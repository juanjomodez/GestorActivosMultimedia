import 'dotenv/config';

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
});

export default env;
