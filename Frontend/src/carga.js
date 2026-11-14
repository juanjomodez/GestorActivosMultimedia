const formatosPermitidos = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf',
];

export const formatosAceptados = formatosPermitidos.join(',');
export const limiteMB = 10;

export function validarArchivo(archivo) {
  if (!archivo) return 'Selecciona un archivo para continuar.';
  if (!formatosPermitidos.includes(archivo.type)) return 'El formato de este archivo no está permitido.';
  if (archivo.size === 0) return 'El archivo está vacío.';
  if (archivo.size > limiteMB * 1024 * 1024) return `El archivo supera el límite de ${limiteMB} MB.`;
  return '';
}

export async function subirArchivo({ datos, url, alProgresar }) {
  if (!url) {
    for (const porcentaje of [20, 40, 60, 80, 100]) {
      await new Promise((resolver) => setTimeout(resolver, 140));
      alProgresar(porcentaje);
    }
    await new Promise((resolver) => setTimeout(resolver, 300));
    return;
  }

  await new Promise((resolver, rechazar) => {
    const solicitud = new XMLHttpRequest();
    solicitud.open('POST', url);
    solicitud.timeout = 60000;
    solicitud.responseType = 'json';
    solicitud.upload.addEventListener('progress', ({ lengthComputable, loaded, total }) => {
      if (lengthComputable && total > 0) alProgresar(Math.floor(loaded / total * 100));
    });
    solicitud.upload.addEventListener('load', () => alProgresar(100));
    solicitud.addEventListener('load', () => {
      if (solicitud.status >= 200 && solicitud.status < 300) {
        resolver();
        return;
      }

      const mensaje = solicitud.response?.error;
      rechazar(new Error(typeof mensaje === 'string' && mensaje
        ? mensaje
        : `El servidor rechazó la subida (HTTP ${solicitud.status}).`));
    });
    solicitud.addEventListener('error', () => rechazar(new Error('No se pudo conectar con el servidor.')));
    solicitud.addEventListener('timeout', () => rechazar(new Error('El servidor tardó demasiado en responder.')));
    solicitud.send(datos);
  });
}
