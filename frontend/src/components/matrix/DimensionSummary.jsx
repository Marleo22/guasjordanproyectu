/**
 * Deja explícito el tamaño del sistema para no confundir la matriz aumentada con una cuadrada:
 * filas = ecuaciones, columnas = incógnitas, y [A|b] agrega una columna para el término independiente.
 */
export function DimensionSummary({ rows, columns, rank = null, augmentedRank = null }) {
  const items = [
    ['Ecuaciones (filas)', rows],
    ['Incógnitas (columnas)', columns],
    ['Matriz A', `${rows} × ${columns}`],
    ['Matriz aumentada [A | b]', `${rows} × ${columns + 1}`],
  ]
  if (rank !== null && rank !== undefined) items.push(['Rango de A', rank])
  if (augmentedRank !== null && augmentedRank !== undefined) items.push(['Rango de [A | b]', augmentedRank])

  return (
    <dl className="m-0 flex flex-wrap gap-2" aria-label="Dimensiones del sistema">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="m-0 font-mono text-sm font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Explica en palabras qué significa la forma del sistema. Solo texto: no calcula nada. */
export function shapeExplanation(rows, columns) {
  if (rows === columns) return null
  if (rows > columns) {
    return `Hay más ecuaciones (${rows}) que incógnitas (${columns}): es un sistema sobredeterminado. La solución tiene ${columns} valores, uno por incógnita; las ecuaciones que sobran se usan para comprobar y, si son compatibles, terminan como filas 0 = 0 en la forma reducida.`
  }
  return `Hay menos ecuaciones (${rows}) que incógnitas (${columns}): es un sistema subdeterminado. Nunca puede tener solución única, porque el rango es como máximo ${rows}; quedan al menos ${columns - rows} variable(s) libre(s) o el sistema no tiene solución.`
}
