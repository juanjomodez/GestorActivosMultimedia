import { createElement } from 'react';

export default function VistaPrevia({ archivo }) {
  const { tipoArchivo, url, titulo } = archivo;

  if (tipoArchivo === 'imagen') {
    return createElement('img', { className: 'vista-previa', src: url, alt: titulo, loading: 'lazy' });
  }

  if (tipoArchivo === 'video') {
    return createElement(
      'video',
      { className: 'vista-previa', src: url, controls: true, preload: 'metadata' },
      'Tu navegador no puede reproducir este video.',
    );
  }

  if (tipoArchivo === 'pdf') {
    return (
      <a className="vista-previa vista-pdf" href={url} target="_blank" rel="noopener noreferrer">
        <span className="icono-pdf" aria-hidden="true">PDF</span>
        <span>Abrir documento</span>
      </a>
    );
  }

  return <div className="vista-previa vista-pdf">Vista previa no disponible</div>;
}