import mongoose from 'mongoose';
import env from '../config/env.js';

/** Categorías de archivo que acepta la aplicación. */
export const TIPOS_ARCHIVO = Object.freeze(['imagen', 'video', 'pdf']);

/** Tipos MIME permitidos, agrupados por categoría. */
export const MIME_PERMITIDOS = Object.freeze({
  imagen: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  pdf: ['application/pdf'],
});

/** Valores de resource_type de Cloudinary (necesarios para borrar con destroy). */
export const RECURSOS_CLOUD = Object.freeze(['image', 'video', 'raw']);

export const TAMANO_MAXIMO_BYTES = env.tamanoMaximoMB * 1024 * 1024;

const TODOS_LOS_MIME = Object.values(MIME_PERMITIDOS).flat();

/** Devuelve la categoría ('imagen' | 'video' | 'pdf') de un MIME, o null si no se permite. */
export function tipoDesdeMime(mimeType) {
  const entrada = Object.entries(MIME_PERMITIDOS).find(([, lista]) => lista.includes(mimeType));
  return entrada ? entrada[0] : null;
}

export function formatearTamano(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const archivoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: [1, 'El título no puede estar vacío'],
      maxlength: [150, 'El título no puede superar 150 caracteres'],
    },
    url: {
      type: String,
      required: [true, 'La URL pública es obligatoria'],
      trim: true,
      match: [/^https:\/\/\S+$/, 'La URL debe ser pública y usar HTTPS'],
    },
    publicId: {
      type: String,
      required: [true, 'El publicId de Cloudinary es obligatorio'],
      trim: true,
      unique: true,
    },
    tipoArchivo: {
      type: String,
      required: [true, 'El tipo de archivo es obligatorio'],
      enum: { values: TIPOS_ARCHIVO, message: 'Tipo de archivo no permitido: {VALUE}' },
    },
    mimeType: {
      type: String,
      required: [true, 'El tipo MIME es obligatorio'],
      lowercase: true,
      trim: true,
      enum: { values: TODOS_LOS_MIME, message: 'Tipo MIME no permitido: {VALUE}' },
    },
    recursoCloud: {
      type: String,
      required: [true, 'El resource_type de Cloudinary es obligatorio'],
      enum: { values: RECURSOS_CLOUD, message: 'resource_type no válido: {VALUE}' },
    },
    tamanoBytes: {
      type: Number,
      required: [true, 'El tamaño en bytes es obligatorio'],
      min: [1, 'El archivo no puede estar vacío'],
      max: [TAMANO_MAXIMO_BYTES, `El archivo supera el máximo de ${env.tamanoMaximoMB} MB`],
      validate: {
        validator: Number.isInteger,
        message: 'El tamaño debe ser un número entero de bytes',
      },
    },
    fechaSubida: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    subidoPor: {
      type: String,
      required: [true, 'El autor (subidoPor) es obligatorio'],
      trim: true,
      maxlength: [80, 'El autor no puede superar 80 caracteres'],
    },
  },
  {
    collection: 'archivos',
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_documento, salida) => {
        salida.id = String(salida._id);
        delete salida._id;
        return salida;
      },
    },
  }
);

archivoSchema.virtual('tamanoFormateado').get(function tamanoFormateado() {
  return formatearTamano(this.tamanoBytes);
});

archivoSchema.pre('validate', function coherenciaTipoMime() {
  if (this.mimeType && this.tipoArchivo && tipoDesdeMime(this.mimeType) !== this.tipoArchivo) {
    this.invalidate('mimeType', `El MIME ${this.mimeType} no corresponde al tipo ${this.tipoArchivo}`);
  }
});

// Listado general de la galería: más recientes primero.
archivoSchema.index({ fechaSubida: -1 });
// Filtro por tipo manteniendo el orden por fecha.
archivoSchema.index({ tipoArchivo: 1, fechaSubida: -1 });
// Búsqueda por título sin distinguir mayúsculas ni tildes (collation es, strength 1).
archivoSchema.index({ titulo: 1 }, { collation: { locale: 'es', strength: 1 } });

archivoSchema.statics.tipoDesdeMime = tipoDesdeMime;

const Archivo = mongoose.models.Archivo || mongoose.model('Archivo', archivoSchema);

export default Archivo;
