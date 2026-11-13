Taller Práctico Colaborativo: Gestor de Activos
Multimedia en la Nube (Cloud Media Vault)

Distribución de Roles y Trabajo en Equipo

Rol 1 - Alejandro
Rol 2 - Santiago
Rol 3 - Jesus
Rol 4 - Yeferson
Rol 5 - Juan Jose

Alejandro: Rol 1 — Arquitecto Cloud y Base de Datos:
○ Configurar el proveedor de almacenamiento en la nube (ej. Cloudinary) y la instancia
de base de datos (Neon.tech o MongoDB Atlas).
○ Diseñar el esquema/modelo de metadatos (id, titulo, url, publicId, tipoArchivo,
tamanoBytes, fechaSubida, subidoPor) y administrar las variables de entorno (.env
y .env.example).

Santiago:  Rol 2 — Desarrollador Backend (Ingesta y Subida Cloud):
○ Implementar el endpoint POST /api/archivos encargado de recibir el formulario
multipart/form-data (multer en Express o formData() en Next.js).
○ Gestionar la transferencia segura del binario hacia el proveedor cloud y validar el
peso máximo y tipos MIME permitidos en el servidor

Jesus: Rol 3 — Desarrollador Backend (Persistencia CRUD y Sincronización):
○ Conectar la respuesta del proveedor cloud con la base de datos para guardar los
metadatos tras confirmar la subida.
○ Implementar los endpoints GET /api/archivos (consulta ordenada y filtros) y
DELETE /api/archivos/:id (eliminación sincronizada tanto en el storage cloud como
en la base de datos).

Yeferson: Rol 4 — Desarrollador Frontend (Formulario de Carga y Validaciones):
○ Construir la interfaz de subida en React/Next.js con soporte de selección de archivo
o Drag & Drop.
○ Empaquetar los datos con FormData, validar peso/formato antes del envío y
gestionar estados visuales de carga (loading spinner / barra de progreso) y alertas de
retroalimentación.

Juan Jose: Rol 5 — Desarrollador Frontend (Galería Multimedia, Filtros y QA):
○ Construir la galería dinámica que consume GET /api/archivos, renderizando
miniaturas de imágenes, reproductor video para videos y previsualización/enlace
para PDFs junto con sus metadatos.
○ Implementar filtros por tipo de archivo y búsqueda por título, además de liderar las
pruebas de integración y limpieza de errores en consola antes de la entrega
