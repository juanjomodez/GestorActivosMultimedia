import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/** Carpeta de Cloudinary donde se guardan todos los archivos del proyecto. */
export const CARPETA_CLOUDINARY = env.cloudinary.carpeta;

/**
 * Comprueba que las credenciales sean válidas haciendo ping a la Admin API.
 * Devuelve true/false en lugar de lanzar, para usarlo en /api/salud.
 */
export async function verificarCloudinary() {
  try {
    const respuesta = await cloudinary.api.ping();
    return respuesta?.status === 'ok';
  } catch (error) {
    console.error('[cloudinary] No se pudo verificar la conexión:', error?.error?.message || error.message);
    return false;
  }
}

export default cloudinary;
