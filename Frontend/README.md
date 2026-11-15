# Formulario de carga

Ejecuta estos comandos desde `Frontend` y abre la dirección que muestra Vite.

```sh
npm ci
npm run dev
```

En PowerShell de Windows, usa `npm.cmd` si la política de ejecución bloquea `npm.ps1`.

```powershell
npm.cmd ci
npm.cmd run dev
```

El modo de prueba se ejecuta en el navegador. Permite seleccionar o arrastrar un archivo, validar el formato y el límite de 10 MB y recorrer el flujo de progreso y confirmación. Los archivos permanecen en el dispositivo.

Para usar un endpoint de carga, configura `VITE_UPLOAD_URL` en `Frontend/.env.local` y reinicia Vite. El formulario envía un `POST` multipart con los campos `archivo`, `titulo` y `subidoPor`. El cliente muestra como error el campo `error` de la respuesta JSON, cuando existe.

```sh
npm run build
```

En PowerShell también puedes compilar con `npm.cmd run build`.
