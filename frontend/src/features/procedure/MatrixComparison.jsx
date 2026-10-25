import { MatrixView } from '@/components/matrix/MatrixView'

/** Matriz Antes y Después de una operación, con la(s) fila(s) modificada(s) y el pivote resaltados. */
export function MatrixComparison({ step, columns }) {
  const pivot = step.pivot ? { row: step.pivot.row, column: step.pivot.column } : null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <figure className="m-0 flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-background p-4">
        <figcaption className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Antes</figcaption>
        <MatrixView
          matrix={step.before}
          columns={columns}
          highlightRows={step.modified_rows}
          showRowLabels
          label={`Matriz antes del paso ${step.index}`}
        />
      </figure>
      <figure className="m-0 flex min-w-0 flex-col gap-2 rounded-xl border-2 border-primary/40 bg-card p-4">
        <figcaption className="text-xs font-semibold tracking-wide text-primary uppercase">Después</figcaption>
        <MatrixView
          matrix={step.after}
          columns={columns}
          highlightRows={step.modified_rows}
          pivot={pivot}
          showRowLabels
          label={`Matriz después del paso ${step.index}`}
        />
      </figure>
    </div>
  )
}
