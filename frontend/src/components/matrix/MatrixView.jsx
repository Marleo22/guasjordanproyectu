import { VARIABLES } from '@/state/solver.reducer'
import { FractionText } from './FractionText'

/**
 * Matriz aumentada [A | b] de solo lectura, en una sola tabla para que encabezados y filas alineen.
 *  - showRowLabels: muestra F1, F2… a la izquierda.
 *  - showHeader: muestra a, b, c… sobre cada columna y "b" sobre el término independiente,
 *    para que se vea que las columnas son incógnitas y las filas ecuaciones.
 *  - highlightRows: filas (base 1) que cambiaron en el paso.
 *  - dangerRows: filas (base 1) a marcar en rojo (contradicción).
 *  - pivot: { row, column } (base 1) para remarcar el pivote.
 * No modifica ni recalcula valores: pinta exactamente lo que manda el backend.
 */
export function MatrixView({
  matrix,
  columns,
  highlightRows = [],
  dangerRows = [],
  pivot = null,
  size = 'md',
  showRowLabels = false,
  showHeader = false,
  variables,
  label = 'Matriz aumentada',
}) {
  const rhs = columns ?? (matrix[0]?.length ?? 1) - 1
  const names = variables ?? VARIABLES.slice(0, rhs)
  const last = matrix.length - 1

  return (
    <div className="max-w-full overflow-x-auto py-1">
      <table className={`matrix__table matrix ${size === 'sm' ? 'matrix--sm' : ''}`} aria-label={label}>
        {showHeader && (
          <thead>
            <tr>
              {showRowLabels && <th aria-hidden="true" />}
              {names.map((n) => (
                <th key={n} scope="col" className="matrix__head">
                  {n}
                </th>
              ))}
              <th scope="col" className="matrix__head matrix__rhs" title="Término independiente">
                <span aria-hidden="true">=</span>
                <span className="sr-only">Término independiente</span>
              </th>
            </tr>
          </thead>
        )}
        <tbody>
          {matrix.map((row, i) => {
            const rowNumber = i + 1
            const rowClass = dangerRows.includes(rowNumber)
              ? 'matrix__row--danger'
              : highlightRows.includes(rowNumber)
                ? 'matrix__row--hl'
                : ''
            const edge = i === 0 ? 'matrix__edge--top' : i === last ? 'matrix__edge--bottom' : ''
            return (
              <tr key={i} className={rowClass}>
                {showRowLabels && (
                  <th scope="row" className="matrix__row-label">
                    F{rowNumber}
                  </th>
                )}
                {row.map((value, j) => {
                  const isPivot = pivot && pivot.row === rowNumber && pivot.column === j + 1
                  const classes = [
                    j === 0 ? `matrix__edge-l ${edge}` : '',
                    j === row.length - 1 ? `matrix__edge-r ${edge}` : '',
                    j === rhs ? 'matrix__rhs' : '',
                    isPivot ? 'matrix__pivot' : '',
                  ]
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                  return (
                    <td key={j} className={classes || undefined}>
                      <FractionText value={value} />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default MatrixView
