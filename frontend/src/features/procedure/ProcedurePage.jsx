import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DimensionSummary } from '@/components/matrix/DimensionSummary'
import { MatrixView } from '@/components/matrix/MatrixView'
import Badge from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { dimensionLabel, prettyMinus, STEP_TYPE_LABEL } from '@/lib/formatters'
import { ROUTES } from '@/lib/routes'
import { useSolver } from '@/state/solver-context'
import { MatrixComparison } from './MatrixComparison'
import { OperationList } from './OperationList'

/**
 * Etapa 3 · Procedimiento (Daniel). Presenta los pasos tal como llegan del backend:
 * no recalcula, no reordena y no deduce nada mirando las matrices.
 */
export default function ProcedurePage() {
  const { state, setStepIndex } = useSolver()
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  const { result, stepIndex } = state
  const steps = result?.steps ?? []
  const total = steps.length

  // Flechas del teclado para avanzar y retroceder (si el foco no está en un campo).
  useEffect(() => {
    if (!total) return undefined
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight') setStepIndex(stepIndex + 1)
      if (e.key === 'ArrowLeft') setStepIndex(stepIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepIndex, total, setStepIndex])

  if (!result) return <Navigate to={state.rows ? ROUTES.data : ROUTES.size} replace />

  const columns = result.columns ?? state.columns
  const step = steps[stepIndex]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge className="eyebrow px-3 py-1">Paso 3 de 4</Badge>
        <h2 className="m-0 text-3xl font-bold tracking-tight">Procedimiento de Gauss-Jordan</h2>
        <p className="m-0 text-muted-foreground">
          Sistema {dimensionLabel(result.rows ?? state.rows, columns)} · {total}{' '}
          {total === 1 ? 'operación elemental' : 'operaciones elementales'} hasta la forma escalonada reducida.
        </p>
        <DimensionSummary rows={result.rows ?? state.rows} columns={columns} />
      </header>

      {total === 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
          <h3 className="m-0 text-lg font-semibold">No hizo falta ninguna operación</h3>
          <p className="m-0 text-muted-foreground">
            La matriz aumentada ya estaba en forma escalonada reducida.
          </p>
          <MatrixView matrix={result.initial_matrix} columns={columns} showRowLabels label="Matriz inicial" />
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="order-2 rounded-2xl border border-border bg-card p-4 lg:order-1 lg:sticky lg:top-4 lg:self-start">
            <OperationList steps={steps} current={stepIndex} onSelect={setStepIndex} />
          </aside>

          <section aria-live="polite" aria-labelledby="step-title" className="order-1 flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:order-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground">
                  Paso {stepIndex + 1} de {total} · {STEP_TYPE_LABEL[step.type] ?? step.type}
                </span>
                <h3 id="step-title" className="m-0 font-mono text-2xl font-bold text-primary">
                  {prettyMinus(step.notation)}
                </h3>
              </div>
              {step.pivot && (
                <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  Pivote: fila {step.pivot.row}, columna {step.pivot.column}
                </span>
              )}
            </div>

            <p className="m-0 text-base">{step.description}</p>

            <MatrixComparison step={step} columns={columns} />

            {step.calculation?.length > 0 && (
              <details className="rounded-xl border border-border bg-background p-4" open>
                <summary className="cursor-pointer text-sm font-semibold">Cálculo de la fila modificada</summary>
                <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0 font-mono text-sm">
                  {step.calculation.map((line, i) => (
                    <li key={i}>{prettyMinus(line)}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <Button variant="outline" disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
                ← Anterior
              </Button>
              <span className="text-xs text-muted-foreground">Usa ← y → del teclado</span>
              {stepIndex < total - 1 ? (
                <Button onClick={() => setStepIndex(stepIndex + 1)}>Siguiente →</Button>
              ) : (
                <Button onClick={() => navigate(ROUTES.result)}>Ver resultado →</Button>
              )}
            </div>
          </section>
        </div>
      )}

      {total > 0 && (
        <section className="flex flex-col gap-4">
          <Button variant="outline" className="self-start" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Ocultar todas las matrices' : 'Ver todas las matrices'}
          </Button>
          {showAll && (
            <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              <li className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-4">
                <span className="text-sm font-semibold">Matriz inicial</span>
                <MatrixView matrix={result.initial_matrix} columns={columns} size="sm" label="Matriz inicial" />
              </li>
              {steps.map((s, i) => (
                <li key={s.index}>
                  <button
                    type="button"
                    onClick={() => {
                      setStepIndex(i)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`flex w-full min-w-0 flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary ${
                      i === stepIndex ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {s.index}. <span className="font-mono">{prettyMinus(s.notation)}</span>
                    </span>
                    <MatrixView
                      matrix={s.after}
                      columns={columns}
                      size="sm"
                      highlightRows={s.modified_rows}
                      label={`Matriz después del paso ${s.index}`}
                    />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <footer className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => navigate(ROUTES.data)}>
          ← Volver a los datos
        </Button>
        <Button size="lg" onClick={() => navigate(ROUTES.result)}>
          Ver resultado →
        </Button>
      </footer>
    </div>
  )
}
