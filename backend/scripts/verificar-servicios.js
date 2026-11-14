import { conectarBaseDatos, desconectarBaseDatos } from '../src/config/db.js';
import { verificarCloudinary, CARPETA_CLOUDINARY } from '../src/config/cloudinary.js';
import Archivo from '../src/models/Archivo.js';

let fallo = false;

try {
  await conectarBaseDatos();
  await Archivo.syncIndexes();
  const indices = await Archivo.listIndexes();
  const total = await Archivo.countDocuments();
  console.log(`[ok] MongoDB Atlas: colección "archivos" con ${total} documento(s)`);
  console.log(`     Índices: ${indices.map((i) => i.name).join(', ')}`);
} catch (error) {
  fallo = true;
  console.error('[x]  MongoDB Atlas:', error.message);
} finally {
  await desconectarBaseDatos().catch(() => {});
}

if (await verificarCloudinary()) {
  console.log(`[ok] Cloudinary: credenciales válidas (carpeta "${CARPETA_CLOUDINARY}")`);
} else {
  fallo = true;
  console.error('[x]  Cloudinary: credenciales inválidas o sin conexión');
}

process.exit(fallo ? 1 : 0);
