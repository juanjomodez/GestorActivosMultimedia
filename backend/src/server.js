import env from './config/env.js';
import app from './app.js';

const servidor = app.listen(env.puerto, () => {
  console.log(`[api] Servidor escuchando en http://localhost:${env.puerto} (${env.nodeEnv})`);
  console.log(`[api] CORS permitido para: ${env.corsOrigenes.join(', ')}`);
});

const apagar = (senal) => {
  console.log(`\n[api] ${senal} recibido, cerrando servidor...`);
  servidor.close(() => process.exit(0));
};

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
