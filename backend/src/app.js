import express from 'express';
import cors from 'cors';
import env from './config/env.js';

const app = express();

app.disable('x-powered-by');

app.use(
  cors({
    origin(origen, callback) {
      // Peticiones sin Origin (curl, Postman, servidor a servidor) se permiten.
      if (!origen || env.corsOrigenes.includes(origen)) return callback(null, true);
      return callback(new Error(`Origen no permitido por CORS: ${origen}`));
    },
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json({ limit: '100kb' }));

app.get('/api/salud', (_req, res) => {
  res.json({ estado: 'ok', fecha: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  const status = error.status || error.statusCode || (error.message?.startsWith('Origen no permitido') ? 403 : 500);
  if (status >= 500) console.error('[api]', error);
  res.status(status).json({
    error: status >= 500 && env.nodeEnv === 'production' ? 'Error interno del servidor' : error.message,
  });
});

export default app;
