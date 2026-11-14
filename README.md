Taller PrÃ¡ctico Colaborativo: Gestor de Activos
Multimedia en la Nube (Cloud Media Vault)

DistribuciÃ³n de Roles y Trabajo en Equipo

Rol 1 - Alejandro
Rol 2 - Santiago
Rol 3 - Jesus
Rol 4 - Yeferson
Rol 5 - Juan Jose

Alejandro: Rol 1 â€” Arquitecto Cloud y Base de Datos:
â—‹ Configurar el proveedor de almacenamiento en la nube (ej. Cloudinary) y la instancia
de base de datos (Neon.tech o MongoDB Atlas).
â—‹ DiseÃ±ar el esquema/modelo de metadatos (id, titulo, url, publicId, tipoArchivo,
tamanoBytes, fechaSubida, subidoPor) y administrar las variables de entorno (.env
y .env.example).

Santiago:  Rol 2 â€” Desarrollador Backend (Ingesta y Subida Cloud):
â—‹ Implementar el endpoint POST /api/archivos encargado de recibir el formulario
multipart/form-data (multer en Express o formData() en Next.js).
â—‹ Gestionar la transferencia segura del binario hacia el proveedor cloud y validar el
peso mÃ¡ximo y tipos MIME permitidos en el servidor

Jesus: Rol 3 â€” Desarrollador Backend (Persistencia CRUD y SincronizaciÃ³n):
â—‹ Conectar la respuesta del proveedor cloud con la base de datos para guardar los
metadatos tras confirmar la subida.
â—‹ Implementar los endpoints GET /api/archivos (consulta ordenada y filtros) y
DELETE /api/archivos/:id (eliminaciÃ³n sincronizada tanto en el storage cloud como
en la base de datos).

Yeferson: Rol 4 â€” Desarrollador Frontend (Formulario de Carga y Validaciones):
â—‹ Construir la interfaz de subida en React/Next.js con soporte de selecciÃ³n de archivo
o Drag & Drop.
â—‹ Empaquetar los datos con FormData, validar peso/formato antes del envÃ­o y
gestionar estados visuales de carga (loading spinner / barra de progreso) y alertas de
retroalimentaciÃ³n.

Juan Jose: Rol 5 â€” Desarrollador Frontend (GalerÃ­a Multimedia, Filtros y QA):
â—‹ Construir la galerÃ­a dinÃ¡mica que consume GET /api/archivos, renderizando
miniaturas de imÃ¡genes, reproductor video para videos y previsualizaciÃ³n/enlace
para PDFs junto con sus metadatos.
â—‹ Implementar filtros por tipo de archivo y bÃºsqueda por tÃ­tulo, ademÃ¡s de liderar las
pruebas de integraciÃ³n y limpieza de errores en consola antes de la entrega


---

# Cloud Media Vault: documentaciÃ³n tÃ©cnica

Los archivos (imÃ¡genes, videos y PDF) se guardan en **Cloudinary** y sus metadatos en **MongoDB Atlas**, a travÃ©s de una API REST en **Express**. El frontend se construye en **React + Vite** (Ruta B: arquitectura desacoplada cliente-servidor).

## Rol 1: Arquitecto Cloud y Base de Datos

**Integrante:** Alejandro
**Rama:** `rol1-cloud-bd`

### Responsabilidades

- ConfiguraciÃ³n del proveedor de almacenamiento en la nube (Cloudinary).
- ConfiguraciÃ³n de la instancia de base de datos (MongoDB Atlas) y conexiÃ³n con Mongoose.
- DiseÃ±o del modelo de metadatos `Archivo`.
- AdministraciÃ³n de las variables de entorno (`.env` y `.env.example`).
- Servidor Express base (CORS, dotenv, manejo de errores y endpoint de salud).

---

## Arquitectura

```mermaid
flowchart LR
    U[Usuario] --> FE[Frontend<br/>React + Vite]
    FE -- "multipart/form-data<br/>POST /api/archivos" --> API[API REST<br/>Express + multer]
    FE -- "GET / DELETE /api/archivos" --> API
    API -- "1. upload_stream (binario)" --> CL[(Cloudinary<br/>archivo fÃ­sico)]
    CL -- "secure_url + public_id" --> API
    API -- "2. Mongoose (metadatos)" --> DB[(MongoDB Atlas<br/>colecciÃ³n archivos)]
```

**Almacenamiento dual desacoplado:**

| Capa | QuÃ© guarda | Servicio |
| --- | --- | --- |
| Archivo fÃ­sico | El binario (imagen, video o PDF) | Cloudinary |
| Metadatos | La referencia (`url`, `publicId`) y los datos tÃ©cnicos | MongoDB Atlas |

La base de datos **nunca** guarda el archivo, solo su referencia. Para borrar un archivo se usa el `publicId` en Cloudinary y luego se elimina el documento en Atlas.

### Estructura del backend

```
backend/
â”œâ”€â”€ .env.example                 # Plantilla de variables de entorno
â”œâ”€â”€ package.json
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ verificar-servicios.js   # Comprueba Atlas + Cloudinary y sincroniza Ã­ndices
â””â”€â”€ src/
    â”œâ”€â”€ app.js                   # App Express: CORS, JSON, /api/salud, 404 y errores
    â”œâ”€â”€ server.js                # Arranque: conecta a Atlas y levanta el servidor
    â”œâ”€â”€ config/
    â”‚   â”œâ”€â”€ env.js               # Carga y valida las variables de entorno
    â”‚   â”œâ”€â”€ db.js                # ConexiÃ³n a MongoDB Atlas con Mongoose
    â”‚   â””â”€â”€ cloudinary.js        # ConfiguraciÃ³n del SDK de Cloudinary
    â””â”€â”€ models/
        â””â”€â”€ Archivo.js           # Modelo de metadatos
```

---

## Modelo de metadatos `Archivo`

ColecciÃ³n: `archivos`

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `id` | ObjectId | Generado por MongoDB (se expone como `id` en el JSON) |
| `titulo` | String | Obligatorio, sin espacios sobrantes, mÃ¡x. 150 caracteres |
| `url` | String | Obligatorio, URL pÃºblica HTTPS de Cloudinary (`secure_url`) |
| `publicId` | String | Obligatorio y **Ãºnico**, identificador en Cloudinary |
| `tipoArchivo` | String | `imagen` \| `video` \| `pdf` |
| `mimeType` | String | MIME permitido y coherente con `tipoArchivo` |
| `recursoCloud` | String | `image` \| `video` \| `raw` (resource_type de Cloudinary, necesario para borrar) |
| `tamanoBytes` | Number | Entero, mayor a 0 y mÃ¡ximo `MAX_FILE_SIZE_MB` (10 MB) |
| `fechaSubida` | Date | AutomÃ¡tica (`Date.now`), inmutable |
| `subidoPor` | String | Obligatorio, autor del archivo, mÃ¡x. 80 caracteres |

AdemÃ¡s, el JSON incluye el campo virtual `tamanoFormateado` (por ejemplo `2.35 MB`).

**Tipos MIME permitidos**

| CategorÃ­a | MIME |
| --- | --- |
| imagen | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| video | `video/mp4`, `video/webm`, `video/quicktime` |
| pdf | `application/pdf` |

**Ãndices** (para consultas ordenadas y Ã³ptimas):

| Ãndice | Uso |
| --- | --- |
| `{ publicId: 1 }` Ãºnico | Evita registros duplicados y permite buscar por `publicId` |
| `{ fechaSubida: -1 }` | Listado de la galerÃ­a, mÃ¡s recientes primero |
| `{ tipoArchivo: 1, fechaSubida: -1 }` | Filtro por tipo manteniendo el orden por fecha |
| `{ titulo: 1 }` con collation `es` | BÃºsqueda por tÃ­tulo sin distinguir mayÃºsculas ni tildes |

**Utilidades exportadas** por `src/models/Archivo.js` para el resto del equipo:

```js
import Archivo, {
  TIPOS_ARCHIVO,        // ['imagen', 'video', 'pdf']
  MIME_PERMITIDOS,      // MIME agrupados por categorÃ­a
  TAMANO_MAXIMO_BYTES,  // 10 MB en bytes
  tipoDesdeMime,        // 'image/png' -> 'imagen'
  formatearTamano,      // 2048 -> '2.0 KB'
} from './models/Archivo.js';

import cloudinary, { CARPETA_CLOUDINARY } from './config/cloudinary.js';
```

---

## Variables de entorno

Las credenciales reales van en `backend/.env`, que estÃ¡ en `.gitignore` y **no se sube al repositorio**. El archivo `backend/.env.example` sirve de plantilla.

| Variable | Obligatoria | DescripciÃ³n | Valor por defecto |
| --- | --- | --- | --- |
| `PORT` | No | Puerto del servidor | `4000` |
| `NODE_ENV` | No | `development` o `production` | `development` |
| `CORS_ORIGIN` | No | OrÃ­genes permitidos, separados por coma | `http://localhost:5173` |
| `MONGODB_URI` | **SÃ­** | Cadena de conexiÃ³n de MongoDB Atlas | |
| `MONGODB_DB_NAME` | No | Nombre de la base de datos | `cloud_media_vault` |
| `CLOUDINARY_CLOUD_NAME` | **SÃ­** | Cloud name de Cloudinary | |
| `CLOUDINARY_API_KEY` | **SÃ­** | API Key de Cloudinary | |
| `CLOUDINARY_API_SECRET` | **SÃ­** | API Secret de Cloudinary | |
| `CLOUDINARY_FOLDER` | No | Carpeta donde se guardan los archivos | `cloud-media-vault` |
| `MAX_FILE_SIZE_MB` | No | TamaÃ±o mÃ¡ximo por archivo | `10` |

Si falta alguna variable obligatoria, el servidor no arranca y muestra cuÃ¡les faltan.

---

## ConfiguraciÃ³n de los servicios en la nube

### MongoDB Atlas

1. Crear un cluster gratuito **M0** en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. En **Database Access**, crear un usuario de base de datos con permiso de lectura y escritura.
3. En **Network Access**, permitir la IP de cada integrante (o `0.0.0.0/0` durante el desarrollo).
4. En **Database > Connect > Drivers**, copiar la cadena de conexiÃ³n y pegarla en `MONGODB_URI`.

### Cloudinary

1. Crear una cuenta gratuita en [Cloudinary](https://cloudinary.com).
2. En **Settings > API Keys**, copiar `Cloud name`, `API Key` y `API Secret`.
3. Los archivos se guardarÃ¡n en la carpeta definida en `CLOUDINARY_FOLDER`.

> Las credenciales se comparten con el equipo por un canal privado, nunca en el repositorio.

---

## InstalaciÃ³n y ejecuciÃ³n

**Requisitos:** Node.js 18.18 o superior y npm.

```bash
cd backend
npm install
cp .env.example .env   # en Windows: copy .env.example .env
```

Completar `backend/.env` con las credenciales y luego:

```bash
npm run verificar   # comprueba Atlas y Cloudinary y crea los Ã­ndices
npm run dev         # servidor con recarga automÃ¡tica
```

| Script | DescripciÃ³n |
| --- | --- |
| `npm run dev` | Inicia el servidor en modo desarrollo (`node --watch`) |
| `npm start` | Inicia el servidor en modo normal |
| `npm run verificar` | Verifica la conexiÃ³n con MongoDB Atlas y Cloudinary y sincroniza los Ã­ndices |

### Endpoint de salud

`GET http://localhost:4000/api/salud`

```json
{
  "estado": "ok",
  "servicios": { "baseDatos": "conectado", "nube": "conectado" },
  "fecha": "2026-11-14T19:23:39.446Z"
}
```

Responde `200` si Atlas y Cloudinary estÃ¡n conectados y `503` si alguno falla.

### Seguridad

- `.env` excluido del repositorio mediante `.gitignore`. Solo se versiona `.env.example`.
- CORS restringido a los orÃ­genes de `CORS_ORIGIN`. Cualquier otro origen recibe `403`.
- Cloudinary configurado con `secure: true`, asÃ­ todas las URL son HTTPS.
- ValidaciÃ³n de variables de entorno al arrancar.
- En producciÃ³n, los errores internos no exponen detalles al cliente.
