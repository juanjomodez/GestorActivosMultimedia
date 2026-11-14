import mongoose from 'mongoose';
import env from './env.js';

const ESTADOS = {
  0: 'desconectado',
  1: 'conectado',
  2: 'conectando',
  3: 'desconectando',
};

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  const { host, name } = mongoose.connection;
  console.log(`[db] Conectado a MongoDB Atlas (${host} / ${name})`);
});
mongoose.connection.on('disconnected', () => console.warn('[db] Conexión con MongoDB cerrada'));
mongoose.connection.on('error', (error) => console.error('[db] Error de MongoDB:', error.message));

export async function conectarBaseDatos() {
  await mongoose.connect(env.mongo.uri, {
    dbName: env.mongo.nombreBaseDatos,
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  return mongoose.connection;
}

export async function desconectarBaseDatos() {
  await mongoose.connection.close();
}

export function estadoBaseDatos() {
  return ESTADOS[mongoose.connection.readyState] ?? 'desconocido';
}
