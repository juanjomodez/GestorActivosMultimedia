import { Router } from 'express';
import multer from 'multer';
import { TAMANO_MAXIMO_BYTES, tipoDesdeMime } from '../models/Archivo.js';
import { subirArchivo } from '../services/subirArchivo.js';

const router = Router();
const recibirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: TAMANO_MAXIMO_BYTES,
    files: 1,
    fields: 2,
    parts: 4,
    fieldSize: 1024,
  },
  fileFilter(_req, archivo, callback) {
    if (!tipoDesdeMime(archivo.mimetype)) {
      return callback(Object.assign(new Error('Formato de archivo no permitido.'), { status: 400 }));
    }
    callback(null, true);
  },
}).single('archivo');

router.post('/', (req, res, next) => {
  recibirArchivo(req, res, async (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        const excedeTamano = error.code === 'LIMIT_FILE_SIZE';
        return res.status(excedeTamano ? 413 : 400).json({
          error: excedeTamano
            ? `El archivo supera el límite de ${TAMANO_MAXIMO_BYTES / 1024 / 1024} MB.`
            : 'Formulario inválido. Envía un archivo y los campos titulo y subidoPor.',
        });
      }
      return next(error);
    }

    if (!req.file || req.file.size === 0) {
      return res.status(400).json({ error: 'Envía un archivo con contenido en el campo archivo.' });
    }

    const { titulo, subidoPor } = req.body;
    if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 150) {
      return res.status(400).json({ error: 'El título debe contener entre 1 y 150 caracteres.' });
    }
    if (typeof subidoPor !== 'string' || !subidoPor.trim() || subidoPor.trim().length > 80) {
      return res.status(400).json({ error: 'El autor debe contener entre 1 y 80 caracteres.' });
    }

    try {
      const metadatos = await subirArchivo(req.file, {
        titulo: titulo.trim(),
        subidoPor: subidoPor.trim(),
      });
      res.status(201).json(metadatos);
    } catch (errorSubida) {
      console.error('[subida] Falló la transferencia a Cloudinary:', errorSubida.message);
      res.status(500).json({ error: 'No se pudo subir el archivo a Cloudinary.' });
    }
  });
});

export default router;
