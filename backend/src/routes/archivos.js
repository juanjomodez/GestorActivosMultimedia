import { Router } from 'express';
import multer from 'multer';
import { TAMANO_MAXIMO_BYTES, tipoDesdeMime } from '../models/Archivo.js';
import { subirArchivo } from '../services/subirArchivo.js';
import { guardarMetadatos, listarArchivos, obtenerArchivo, eliminarArchivo } from '../services/archivos.js';

const router = Router();
const recibirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: TAMANO_MAXIMO_BYTES,
    files: 1,
    fields: 2,
    parts: 4,
    fieldSize: 1024,
  },
  fileFilter(_req, archivo, callback) {
    if (!tipoDesdeMime(archivo.mimetype)) {
      return callback(Object.assign(new Error('Formato de archivo no permitido.'), { status: 400 }));
    }
    callback(null, true);
  },
}).single('archivo');

router.post('/', (req, res, next) => {
  recibirArchivo(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        const excedeTamano = error.code === 'LIMIT_FILE_SIZE';
        return res.status(excedeTamano ? 413 : 400).json({
          error: excedeTamano
            ? `El archivo supera el límite de ${TAMANO_MAXIMO_BYTES / 1024 / 1024} MB.`
            : 'Formulario inválido. Envía un archivo y los campos titulo y subidoPor.',
        });
      }
      return next(error);
    }

    if (!req.file || req.file.size === 0) {
      return res.status(400).json({ error: 'Envía un archivo con contenido en el campo archivo.' });
    }

    const { titulo, subidoPor } = req.body;
    if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 150) {
      return res.status(400).json({ error: 'El título debe contener entre 1 y 150 caracteres.' });
    }
    if (typeof subidoPor !== 'string' || !subidoPor.trim() || subidoPor.trim().length > 80) {
      return res.status(400).json({ error: 'El autor debe contener entre 1 y 80 caracteres.' });
    }

    let metadatos;
    try {
      metadatos = await subirArchivo(req.file, {
        titulo: titulo.trim(),
        subidoPor: subidoPor.trim(),
      });
    } catch (errorSubida) {
      console.error('[subida] Falló la transferencia a Cloudinary:', errorSubida.message);
      return res.status(500).json({ error: 'No se pudo subir el archivo a Cloudinary.' });
    }

    // Rol 3: tras confirmar la subida, se guardan los metadatos en Atlas.
    try {
      const archivo = await guardarMetadatos(metadatos);
      res.status(201).json(archivo);
    } catch (errorGuardado) {
      next(errorGuardado);
    }
  });
});

// Rol 3: GET /api/archivos?tipo=imagen&q=texto&subidoPor=autor&orden=recientes&pagina=1&limite=20
router.get('/', async (req, res, next) => {
  try {
    res.json(await listarArchivos(req.query));
  } catch (error) {
    next(error);
  }
});

// Rol 3: GET /api/archivos/:id
router.get('/:id', async (req, res, next) => {
  try {
    res.json(await obtenerArchivo(req.params.id));
  } catch (error) {
    next(error);
  }
});

// Rol 3: DELETE /api/archivos/:id (Cloudinary + Atlas)
router.delete('/:id', async (req, res, next) => {
  try {
    const { archivo, resultadoNube } = await eliminarArchivo(req.params.id);
    res.json({
      mensaje: 'Archivo eliminado de Cloudinary y de la base de datos.',
      nube: resultadoNube,
      archivo,
    });
  } catch (error) {
    next(error);
  }
});

export default router;