import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DimensionSummary, shapeExplanation } from '@/components/matrix/DimensionSummary'
import Badge from '@/components/ui/Badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { describeError } from '@/lib/error-copy'
import { dimensionLabel } from '@/lib/formatters'
import { ROUTES } from '@/lib/routes'
import { SAMPLES } from '@/lib/sample-matrices'
import { isMatrixEmpty } from '@/state/solver.reducer'
import { useSolver } from '@/state/solver-context'
import { AugmentedMatrixPreview } from './AugmentedMatrixPreview'
import { EquationGrid } from './EquationGrid'

/** Etapa 2 · Datos. Captura, envía a la API y navega a Procedimiento si todo sale bien. */
export default function DataPage() {
  const { state, setCell, loadSample, clear, solve, dismissError } = useSolver()
  const navigate = useNavigate()
  const [sampleId, setSampleId] = useState('')

  const samples = useMemo(
    () => SAMPLES.filter((s) => s.rows === state.rows && s.columns === state.columns),
    [state.rows, state.columns],
  )

  // Sin dimensiones elegidas no hay nada que capturar: de vuelta a la etapa 1.
  if (!state.rows || !state.columns) return <Navigate to={ROUTES.size} replace />

  const loading = state.status === 'loading'
  const empty = isMatrixEmpty(state.matrix)
  const selected = samples.find((s) => s.id === sampleId) ?? samples[0]
  const error = state.status === 'error' && state.error ? describeError(state.error) : null

  async function onSolve() {
    // Si ya hay resultado y nada cambió, no se vuelve a pedir: se sigue al procedimiento.
    if (state.result) return navigate(ROUTES.procedure)
    if (await solve()) navigate(ROUTES.procedure)
  }

  let sampleButton = 'Sin ejemplos para este tamaño'
  if (selected) sampleButton = samples.length > 1 ? 'Cargar ejemplo' : `Cargar ejemplo · ${selected.label}`

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge className="eyebrow px-3 py-1">Paso 2 de 4</Badge>
        <h2 className="m-0 text-3xl font-bold tracking-tight">
          Datos del sistema {dimensionLabel(state.rows, state.columns)}
        </h2>
        <p className="m-0 text-muted-foreground">
          Escribe enteros, decimales o fracciones como <code className="rounded bg-muted px-1">1/3</code>. Escribe 0
          en la variable que no aparece en una ecuación.
        </p>
        <DimensionSummary rows={state.rows} columns={state.columns} />
        {shapeExplanation(state.rows, state.columns) && (
          <p className="m-0 max-w-3xl text-sm text-muted-foreground">{shapeExplanation(state.rows, state.columns)}</p>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {samples.length > 1 && (
          <select
            aria-label="Ejemplo a cargar"
            value={selected?.id ?? ''}
            onChange={(e) => setSampleId(e.target.value)}
            disabled={loading}
            className="h-10 rounded-lg border border-input bg-card px-2 text-sm"
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <Button type="button" variant="outline" disabled={loading || !selected} onClick={() => loadSample(selected)}>
          {sampleButton}
        </Button>
        <Button type="button" variant="ghost" disabled={loading || empty} onClick={clear}>
          Limpiar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>{error.detail}</span>
            {state.formErrors.map((m) => (
              <span key={m}>{m}</span>
            ))}
            <span className="flex gap-2">
              {error.canRetry && (
                <Button size="sm" onClick={onSolve}>
                  Reintentar
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={dismissError}>
                Cerrar
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="rounded-2xl border border-border bg-card p-5">
          <EquationGrid
            columns={state.columns}
            matrix={state.matrix}
            cellErrors={state.cellErrors}
            disabled={loading}
            onChange={setCell}
          />
        </div>
        <AugmentedMatrixPreview columns={state.columns} matrix={state.matrix} />
      </div>

      {empty && !loading && (
        <p className="m-0 text-sm text-muted-foreground">
          La matriz está vacía. Escribe los coeficientes o carga un ejemplo para poder resolver.
        </p>
      )}

      <footer className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="outline" disabled={loading} onClick={() => navigate(ROUTES.size)}>
          ← Cambiar tamaño
        </Button>
        <Button type="button" size="lg" disabled={loading || empty} aria-busy={loading} onClick={onSolve}>
          {loading ? 'Resolviendo…' : state.result ? 'Ver procedimiento →' : 'Resolver con Gauss-Jordan →'}
        </Button>
      </footer>
    </div>
  )
}
