import { MatrixView } from '@/components/matrix/MatrixView'

/** Vista en vivo de la matriz aumentada [A | b] con lo que se va escribiendo. Solo lectura. */
export function AugmentedMatrixPreview({ columns, matrix }) {
  const shown = matrix.map((row) => row.map((v) => String(v).trim() || '·'))
  return (
    <figure className="m-0 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <figcaption className="text-sm font-semibold">Matriz aumentada [A | b]</figcaption>
      <MatrixView matrix={shown} columns={columns} size="sm" showRowLabels showHeader label="Vista previa de la matriz aumentada" />
      <p className="m-0 text-xs text-muted-foreground">
        {matrix.length} filas (ecuaciones) × {columns + 1} columnas: {columns} de coeficientes + 1 del término independiente
      </p>
    </figure>
  )
}
