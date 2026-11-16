import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { formatosAceptados, limiteMB, subirArchivo, validarArchivo } from './carga.js';
import GaleriaMultimedia from './componentes/GaleriaMultimedia.jsx';
import './estilos.css';

const urlCarga = import.meta.env.VITE_UPLOAD_URL?.trim();

function FormularioDeCarga({ alSubir }) {
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [resultado, setResultado] = useState(null);
  const profundidadArrastre = useRef(0);

  function seleccionarArchivos(archivos) {
    if (enviando || archivos.length === 0) return;
    const seleccionado = archivos[0];
    const error = archivos.length > 1
      ? 'Selecciona un solo archivo por carga.'
      : validarArchivo(seleccionado);

    setArchivo(error ? null : seleccionado);
    setErrorArchivo(error);
    setResultado(null);
  }

  function soltarArchivo(evento) {
    evento.preventDefault();
    profundidadArrastre.current = 0;
    setArrastrando(false);
    seleccionarArchivos(evento.dataTransfer.files);
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando) return;

    const error = validarArchivo(archivo);
    if (error) {
      setErrorArchivo(error);
      return;
    }

    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const titulo = datos.get('titulo').trim();
    const subidoPor = datos.get('subidoPor').trim();
    if (!titulo || !subidoPor) {
      setResultado({ error: true, mensaje: 'Escribe el título y el autor del archivo.' });
      return;
    }

    datos.set('titulo', titulo);
    datos.set('subidoPor', subidoPor);
    datos.set('archivo', archivo);
    setResultado(null);
    setProgreso(null);
    setEnviando(true);

    try {
      await subirArchivo({ datos, url: urlCarga, alProgresar: setProgreso });
      formulario.reset();
      setArchivo(null);
      alSubir?.();
      setResultado({ mensaje: urlCarga ? 'Archivo subido correctamente.' : 'Carga simulada completada.' });
    } catch (errorCarga) {
      setResultado({ error: true, mensaje: errorCarga.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor">
      <header className="encabezado">
        <p className="marca">Cloud Media Vault</p>
        <h1>Subir archivo</h1>
        {!urlCarga && <p className="modo">Modo de prueba. Los archivos permanecen en tu navegador.</p>}
      </header>

      <form className="tarjeta" onSubmit={enviar}>
        <fieldset disabled={enviando}>
          <div className="campos">
            <label>
              Título
              <input name="titulo" type="text" maxLength={150} required />
            </label>
            <label>
              Subido por
              <input name="subidoPor" type="text" maxLength={80} required />
            </label>
          </div>

          <label
            className={`zona-archivo${arrastrando ? ' zona-activa' : ''}`}
            onDragEnter={(evento) => {
              if (!enviando && evento.dataTransfer.types.includes('Files')) {
                profundidadArrastre.current += 1;
                setArrastrando(true);
              }
            }}
            onDragOver={(evento) => evento.preventDefault()}
            onDragLeave={() => {
              profundidadArrastre.current = Math.max(0, profundidadArrastre.current - 1);
              if (profundidadArrastre.current === 0) setArrastrando(false);
            }}
            onDrop={soltarArchivo}
          >
            <input
              className="visualmente-oculto"
              type="file"
              accept={formatosAceptados}
              aria-label="Seleccionar archivo"
              aria-describedby={errorArchivo ? 'formatos error-archivo' : 'formatos'}
              aria-invalid={Boolean(errorArchivo)}
              onChange={(evento) => {
                seleccionarArchivos(evento.currentTarget.files);
                evento.currentTarget.value = '';
              }}
            />
            <strong>{archivo ? archivo.name : 'Seleccionar archivo'}</strong>
            <span>{archivo ? 'Haz clic o arrastra otro archivo para cambiarlo.' : 'También puedes arrastrarlo y soltarlo aquí.'}</span>
            <small id="formatos">JPEG, PNG, WebP, GIF, MP4, WebM, MOV o PDF · Máx. {limiteMB} MB</small>
          </label>

          {errorArchivo && <p id="error-archivo" className="mensaje error" role="alert">{errorArchivo}</p>}
          <button type="submit">{enviando ? 'Subiendo…' : 'Subir archivo'}</button>
        </fieldset>

        {enviando && (
          <div className="estado-carga">
            <progress aria-label="Progreso de subida" value={progreso ?? undefined} max={100} />
            <p role="status">
              {progreso === 100 ? 'Esperando confirmación…' : 'Enviando archivo…'}
              {progreso !== null && progreso < 100 && ` ${progreso} %`}
            </p>
          </div>
        )}
        {resultado && (
          <p className={`mensaje ${resultado.error ? 'error' : 'exito'}`} role={resultado.error ? 'alert' : 'status'}>
            {resultado.mensaje}
          </p>
        )}
      </form>
    </main>
  );
}

function App() {
  const [recarga, setRecarga] = useState(0);

  return (
    <>
      <FormularioDeCarga alSubir={() => setRecarga((n) => n + 1)} />
      <GaleriaMultimedia recarga={recarga} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);