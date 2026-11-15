export const ETIQUETAS_TIPO = Object.freeze({
  imagen: 'Imagen',
  video: 'Video',
  pdf: 'PDF',
});

export const idDe = (archivo) => archivo?.id ?? archivo?._id;

export function formatearTamano(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatearFecha(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  return valor.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

const normalizar = (texto = '') =>
  String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filtrarArchivos(archivos, { tipo = '', titulo = '' } = {}) {
  const buscado = normalizar(titulo.trim());
  return archivos.filter(
    (archivo) =>
      (!tipo || archivo.tipoArchivo === tipo) &&
      (!buscado || normalizar(archivo.titulo).includes(buscado)),
  );
}