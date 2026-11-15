const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const RUTA_ARCHIVOS = `${API_URL}/api/archivos`;

async function leerRespuesta(respuesta) {
  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    const mensaje = typeof cuerpo?.error === 'string' && cuerpo.error
      ? cuerpo.error
      : `El servidor respondió con un error (HTTP ${respuesta.status}).`;
    throw new Error(mensaje);
  }
  return cuerpo;
}

export async function listarArchivos({ tipo = '', titulo = '' } = {}, signal) {
  const parametros = new URLSearchParams();
  if (tipo) parametros.set('tipo', tipo);
  if (titulo.trim()) parametros.set('titulo', titulo.trim());
  const consulta = parametros.toString();

  let respuesta;
  try {
    respuesta = await fetch(consulta ? `${RUTA_ARCHIVOS}?${consulta}` : RUTA_ARCHIVOS, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Revisa que el backend esté corriendo.');
  }

  const datos = await leerRespuesta(respuesta);
  const lista = Array.isArray(datos) ? datos : datos?.archivos;
  return Array.isArray(lista) ? lista : [];
}

export async function eliminarArchivo(id) {
  let respuesta;
  try {
    respuesta = await fetch(`${RUTA_ARCHIVOS}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    throw new Error('No se pudo conectar con el servidor para eliminar el archivo.');
  }
  return leerRespuesta(respuesta);
}