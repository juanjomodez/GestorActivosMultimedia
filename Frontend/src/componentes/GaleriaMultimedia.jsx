import { useEffect, useState } from 'react';
import Filtros from './Filtros.jsx';
import TarjetaArchivo from './TarjetaArchivo.jsx';
import { eliminarArchivo, listarArchivos } from '../servicios/api.js';
import { filtrarArchivos, idDe } from '../utils/formato.js';
import '../galeria.css';

export default function GaleriaMultimedia({ recarga = 0 }) {
  const [archivos, setArchivos] = useState([]);
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [actualizar, setActualizar] = useState(0);

  useEffect(() => {
    const temporizador = setTimeout(() => setBusqueda(titulo.trim()), 300);
    return () => clearTimeout(temporizador);
  }, [titulo]);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    setError('');

    listarArchivos({ tipo, titulo: busqueda }, controlador.signal)
      .then(setArchivos)
      .catch((errorCarga) => {
        if (errorCarga.name !== 'AbortError') setError(errorCarga.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    return () => controlador.abort();
  }, [tipo, busqueda, recarga, actualizar]);

  async function manejarEliminar(archivo) {
    const id = idDe(archivo);
    if (!id || eliminandoId) return;

    const confirmado = window.confirm(
      `¿Eliminar "${archivo.titulo}"? Se borrará de la nube y de la base de datos.`,
    );
    if (!confirmado) return;

    setEliminandoId(id);
    setAviso(null);
    try {
      await eliminarArchivo(id);
      setArchivos((lista) => lista.filter((item) => idDe(item) !== id));
      setAviso({ tipo: 'exito', texto: `"${archivo.titulo}" se eliminó correctamente.` });
    } catch (errorEliminar) {
      setAviso({ tipo: 'error', texto: errorEliminar.message });
    } finally {
      setEliminandoId(null);
    }
  }

  const visibles = filtrarArchivos(archivos, { tipo, titulo: busqueda });

  let contenido;
  if (error) {
    contenido = <p className="mensaje error" role="alert">{error}</p>;
  } else if (cargando && archivos.length === 0) {
    contenido = <p className="estado-galeria" role="status">Cargando archivos…</p>;
  } else if (visibles.length === 0) {
    contenido = (
      <p className="estado-galeria">
        {tipo || busqueda ? 'Ningún archivo coincide con los filtros.' : 'Aún no hay archivos. ¡Sube el primero!'}
      </p>
    );
  } else {
    contenido = (
      <div className={`cuadricula${cargando ? ' cuadricula-cargando' : ''}`}>
        {visibles.map((archivo) => (
          <TarjetaArchivo
            key={idDe(archivo)}
            archivo={archivo}
            eliminando={eliminandoId === idDe(archivo)}
            alEliminar={manejarEliminar}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="galeria" aria-labelledby="titulo-galeria">
      <header className="galeria-encabezado">
        <h2 id="titulo-galeria">Galería multimedia</h2>
        <button
          type="button"
          className="boton-secundario"
          onClick={() => setActualizar((n) => n + 1)}
          disabled={cargando}
        >
          Actualizar
        </button>
      </header>

      <Filtros
        tipo={tipo}
        titulo={titulo}
        total={visibles.length}
        alCambiarTipo={setTipo}
        alCambiarTitulo={setTitulo}
      />

      {aviso && (
        <p className={`mensaje ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          {aviso.texto}
        </p>
      )}

      {contenido}
    </section>
  );
}