import { createElement } from 'react';

const OPCIONES_TIPO = [
  { valor: '', texto: 'Todos' },
  { valor: 'imagen', texto: 'Imágenes' },
  { valor: 'video', texto: 'Videos' },
  { valor: 'pdf', texto: 'PDF' },
];

export default function Filtros({ tipo, titulo, total, alCambiarTipo, alCambiarTitulo }) {
  return (
    <div className="filtros">
      <label className="buscador">
        Buscar por título
        {createElement('input', {
          type: 'search',
          value: titulo,
          maxLength: 150,
          placeholder: 'Escribe parte del título…',
          onChange: (evento) => alCambiarTitulo(evento.target.value),
        })}
      </label>

      <div className="grupo-tipos" role="group" aria-label="Filtrar por tipo de archivo">
        {OPCIONES_TIPO.map(({ valor, texto }) => (
          <button
            key={valor || 'todos'}
            type="button"
            className={`chip${tipo === valor ? ' chip-activo' : ''}`}
            aria-pressed={tipo === valor}
            onClick={() => alCambiarTipo(valor)}
          >
            {texto}
          </button>
        ))}
      </div>

      <p className="total" role="status">
        {total === 1 ? '1 archivo' : `${total} archivos`}
      </p>
    </div>
  );
}