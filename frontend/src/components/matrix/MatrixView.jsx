import { FractionText } from './FractionText'

/**
 * Matriz aumentada [A | b] de solo lectura.
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
  label = 'Matriz aumentada',
}) {
  const rhs = columns ?? (matrix[0]?.length ?? 1) - 1
  return (
    <div className="max-w-full overflow-x-auto py-1">
      <div className={`matrix ${size === 'sm' ? 'matrix--sm' : ''}`} role="group" aria-label={label}>
        {showRowLabels && (
          <table className="matrix__table" aria-hidden="true">
            <tbody>
              {matrix.map((_, i) => (
                <tr key={i}>
                  <td className="matrix__row-label">F{i + 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <span className="matrix__bracket matrix__bracket--left" aria-hidden="true" />
        <table className="matrix__table">
          <tbody>
            {matrix.map((row, i) => {
              const rowNumber = i + 1
              const rowClass = dangerRows.includes(rowNumber)
                ? 'matrix__row--danger'
                : highlightRows.includes(rowNumber)
                  ? 'matrix__row--hl'
                  : ''
              return (
                <tr key={i} className={rowClass}>
                  {row.map((value, j) => {
                    const isPivot = pivot && pivot.row === rowNumber && pivot.column === j + 1
                    const classes = [j === rhs ? 'matrix__rhs' : '', isPivot ? 'matrix__pivot' : ''].join(' ').trim()
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
        <span className="matrix__bracket matrix__bracket--right" aria-hidden="true" />
      </div>
    </div>
  )
}

export default MatrixView
