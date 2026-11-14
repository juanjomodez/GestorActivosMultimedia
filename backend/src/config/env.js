import 'dotenv/config';

const REQUERIDAS = ['MONGODB_URI'];

const faltantes = REQUERIDAS.filter((nombre) => !process.env[nombre]?.trim());

if (faltantes.length > 0) {
  console.error(
    `[env] Faltan variables de entorno obligatorias: ${faltantes.join(', ')}.\n` +
      '      Crea backend/.env y completa los valores.'
  );
  process.exit(1);
}

const aEntero = (valor, porDefecto) => {
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) && numero > 0 ? numero : porDefecto;
};

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  puerto: aEntero(process.env.PORT, 4000),
  corsOrigenes: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
  mongo: {
    uri: process.env.MONGODB_URI.trim(),
    nombreBaseDatos: process.env.MONGODB_DB_NAME?.trim() || 'cloud_media_vault',
  },
  tamanoMaximoMB: aEntero(process.env.MAX_FILE_SIZE_MB, 10),
});

export default env;
