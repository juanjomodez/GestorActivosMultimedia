import VistaPrevia from './VistaPrevia.jsx';
import { ETIQUETAS_TIPO, formatearFecha, formatearTamano } from '../utils/formato.js';

export default function TarjetaArchivo({ archivo, eliminando, alEliminar }) {
  const tamano = archivo.tamanoFormateado ?? formatearTamano(archivo.tamanoBytes);

  return (
    <article className="tarjeta-archivo">
      <VistaPrevia archivo={archivo} />

      <div className="datos-archivo">
        <span className={`etiqueta etiqueta-${archivo.tipoArchivo}`}>
          {ETIQUETAS_TIPO[archivo.tipoArchivo] ?? archivo.tipoArchivo}
        </span>
        <h3 title={archivo.titulo}>{archivo.titulo}</h3>

        <dl className="metadatos">
          <div>
            <dt>Subido por</dt>
            <dd>{archivo.subidoPor}</dd>
          </div>
          <div>
            <dt>Tamaño</dt>
            <dd>{tamano}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatearFecha(archivo.fechaSubida)}</dd>
          </div>
        </dl>

        <div className="acciones-archivo">
          <a href={archivo.url} target="_blank" rel="noopener noreferrer">Abrir</a>
          <button
            type="button"
            className="boton-eliminar"
            onClick={() => alEliminar(archivo)}
            disabled={eliminando}
          >
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </article>
  );
}