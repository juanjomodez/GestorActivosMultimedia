import cloudinary, { CARPETA_CLOUDINARY } from '../config/cloudinary.js';
import { tipoDesdeMime } from '../models/Archivo.js';

export async function subirArchivo(archivo, { titulo, subidoPor }) {
  const respuesta = await new Promise((resolve, reject) => {
    const flujo = cloudinary.uploader.upload_stream(
      {
        folder: CARPETA_CLOUDINARY,
        resource_type: 'auto',
        timeout: 60000,
      },
      (error, resultado) => {
        if (error) return reject(error);
        resolve(resultado);
      },
    );
    flujo.on('error', reject);
    flujo.end(archivo.buffer);
  });

  return {
    titulo,
    subidoPor,
    url: respuesta.secure_url,
    publicId: respuesta.public_id,
    tipoArchivo: tipoDesdeMime(archivo.mimetype),
    mimeType: archivo.mimetype,
    recursoCloud: respuesta.resource_type,
    tamanoBytes: archivo.size,
  };
}
