import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import Archivo, { TIPOS_ARCHIVO } from '../models/Archivo.js';

/** Crea un error con código HTTP para que lo maneje el middleware de errores. */
const errorHttp = (status, mensaje) => Object.assign(new Error(mensaje), { status });

/** Criterios de orden permitidos en GET /api/archivos?orden=... */
export const ORDENES = Object.freeze({
  recientes: { fechaSubida: -1, _id: -1 },
  antiguos: { fechaSubida: 1, _id: 1 },
  titulo: { titulo: 1, _id: 1 },
  tamano: { tamanoBytes: -1, _id: -1 },
});

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

/** Escapa los caracteres especiales de una expresión regular. */
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VOCALES = { a: 'aáàäâ', e: 'eéèëê', i: 'iíìïî', o: 'oóòöô', u: 'uúùüû', n: 'nñ' };

/**
 * Convierte un texto de búsqueda en una regex que ignora mayúsculas y tildes:
 * "cancion" encuentra "Canción" y "CANCIÓN".
 */
function regexSinTildes(texto) {
  const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const patron = escaparRegex(base).replace(/[aeioun]/gi, (letra) => `[${VOCALES[letra.toLowerCase()]}]`);
  return new RegExp(patron, 'i');
}

/** Elimina el recurso en Cloudinary. Si ya no existe allí, se considera eliminado. */
async function eliminarDeCloudinary(publicId, recursoCloud) {
  const respuesta = await cloudinary.uploader.destroy(publicId, {
    resource_type: recursoCloud,
    invalidate: true,
  });
  if (respuesta?.result !== 'ok' && respuesta?.result !== 'not found') {
    throw errorHttp(502, `Cloudinary no eliminó el archivo (respuesta: ${respuesta?.result ?? 'desconocida'}).`);
  }
  return respuesta.result;
}

/**
 * Guarda en Atlas los metadatos devueltos por subirArchivo().
 * Si la base de datos rechaza el registro, borra el archivo recién subido a Cloudinary
 * para no dejar binarios huérfanos (compensación).
 */
export async function guardarMetadatos(metadatos) {
  try {
    return await Archivo.create(metadatos);
  } catch (error) {
    // Un publicId duplicado pertenece a un registro existente: no se borra su archivo.
    if (error?.code === 11000) throw errorHttp(409, 'Ya existe un archivo con ese publicId.');
    try {
      await eliminarDeCloudinary(metadatos.publicId, metadatos.recursoCloud);
      console.warn(`[persistencia] Se revirtió la subida de ${metadatos.publicId} porque Atlas rechazó el registro.`);
    } catch (errorReversion) {
      console.error(`[persistencia] No se pudo revertir ${metadatos.publicId} en Cloudinary:`, errorReversion.message);
    }
    if (error instanceof mongoose.Error.ValidationError) {
      throw errorHttp(400, Object.values(error.errors).map((e) => e.message).join('. '));
    }
    throw error;
  }
}

/**
 * Lista archivos con filtros, orden y paginación.
 * Parámetros (todos opcionales): tipo, q o titulo (título), subidoPor, orden, pagina, limite.
 */
export async function listarArchivos(consulta = {}) {
  const filtro = {};

  const tipo = typeof consulta.tipo === 'string' ? consulta.tipo.trim().toLowerCase() : '';
  if (tipo && tipo !== 'todos') {
    if (!TIPOS_ARCHIVO.includes(tipo)) {
      throw errorHttp(400, `Tipo no válido. Usa: ${TIPOS_ARCHIVO.join(', ')}.`);
    }
    filtro.tipoArchivo = tipo;
  }

  // Se acepta ?q= o ?titulo= (el frontend de la galería envía titulo).
  const textoBusqueda = consulta.q ?? consulta.titulo;
  const busqueda = typeof textoBusqueda === 'string' ? textoBusqueda.trim() : '';
  if (busqueda) {
    if (busqueda.length > 150) throw errorHttp(400, 'La búsqueda no puede superar 150 caracteres.');
    filtro.titulo = regexSinTildes(busqueda);
  }

  const autor = typeof consulta.subidoPor === 'string' ? consulta.subidoPor.trim() : '';
  if (autor) {
    if (autor.length > 80) throw errorHttp(400, 'El autor no puede superar 80 caracteres.');
    filtro.subidoPor = regexSinTildes(autor);
  }

  const nombreOrden = typeof consulta.orden === 'string' && consulta.orden.trim() ? consulta.orden.trim() : 'recientes';
  const orden = Object.hasOwn(ORDENES, nombreOrden) ? ORDENES[nombreOrden] : null;
  if (!orden) throw errorHttp(400, `Orden no válido. Usa: ${Object.keys(ORDENES).join(', ')}.`);

  const entero = (valor, porDefecto) => {
    if (valor === undefined || valor === '') return porDefecto;
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
  };
  const pagina = entero(consulta.pagina, 1);
  const limite = entero(consulta.limite, LIMITE_POR_DEFECTO);
  if (pagina === null) throw errorHttp(400, 'pagina debe ser un entero mayor a 0.');
  if (limite === null || limite > LIMITE_MAXIMO) {
    throw errorHttp(400, `limite debe ser un entero entre 1 y ${LIMITE_MAXIMO}.`);
  }

  const [archivos, total] = await Promise.all([
    Archivo.find(filtro)
      .sort(orden)
      .skip((pagina - 1) * limite)
      .limit(limite)
      .collation(nombreOrden === 'titulo' ? { locale: 'es', strength: 1 } : { locale: 'simple' }),
    Archivo.countDocuments(filtro),
  ]);

  return {
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
    archivos,
  };
}

/** Busca un archivo por id; lanza 400 si el id no es válido y 404 si no existe. */
export async function obtenerArchivo(id) {
  if (!mongoose.isValidObjectId(id) || String(new mongoose.Types.ObjectId(id)) !== id) {
    throw errorHttp(400, 'El id no es válido.');
  }
  const archivo = await Archivo.findById(id);
  if (!archivo) throw errorHttp(404, 'Archivo no encontrado.');
  return archivo;
}

/**
 * Eliminación sincronizada: primero en Cloudinary (con el publicId y el resource_type)
 * y después en Atlas. Si Cloudinary falla, el registro se conserva para poder reintentar.
 */
export async function eliminarArchivo(id) {
  const archivo = await obtenerArchivo(id);
  const resultadoNube = await eliminarDeCloudinary(archivo.publicId, archivo.recursoCloud);
  await Archivo.deleteOne({ _id: archivo._id });
  return { archivo, resultadoNube };
}