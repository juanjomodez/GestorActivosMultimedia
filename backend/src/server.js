import env from './config/env.js';
import app from './app.js';
import { conectarBaseDatos, desconectarBaseDatos } from './config/db.js';

async function iniciar() {
  try {
    await conectarBaseDatos();
  } catch (error) {
    console.error('[db] No se pudo conectar a MongoDB Atlas:', error.message);
    console.error('     Revisa MONGODB_URI y que tu IP esté permitida en Atlas (Network Access).');
    process.exit(1);
  }

  const servidor = app.listen(env.puerto, () => {
    console.log(`[api] Servidor escuchando en http://localhost:${env.puerto} (${env.nodeEnv})`);
    console.log(`[api] CORS permitido para: ${env.corsOrigenes.join(', ')}`);
  });

  const apagar = (senal) => {
    console.log(`\n[api] ${senal} recibido, cerrando servidor...`);
    servidor.close(async () => {
      await desconectarBaseDatos();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

iniciar();
