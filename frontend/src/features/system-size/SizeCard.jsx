/** Tarjeta de tamaño cuadrado n × n con la matriz identidad de ejemplo (diseño de Yorman). */
function SizeCard({ size, seleccionado, onSeleccionar }) {
  const ejemplo = Array.from({ length: size }, (_, fila) =>
    Array.from({ length: size }, (_, columna) => (fila === columna ? 1 : 0)),
  )

  return (
    <button
      type="button"
      className={`size-card ${seleccionado ? 'size-card--seleccionado' : ''}`}
      onClick={() => onSeleccionar(size)}
      aria-pressed={seleccionado}
    >
      <div className="size-card__titulo">
        <strong>
          {size} × {size}
        </strong>
        <span>
          {size} ecuaciones · {size} incógnitas
        </span>
      </div>

      <div className="size-card__matrix" aria-hidden="true">
        <span className="matrix-bracket">[</span>
        <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {ejemplo.flat().map((valor, indice) => (
            <span key={indice}>{valor}</span>
          ))}
        </div>
        <span className="matrix-bracket">]</span>
      </div>

      <span className="size-card__action">{seleccionado ? 'Seleccionado' : 'Seleccionar'}</span>
    </button>
  )
}

export default SizeCard
