import { useNavigate } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { describeError } from '@/lib/error-copy'
import { ROUTES } from '@/lib/routes'
import { useSolver } from '@/state/solver-context'
import { PdfDownloadButton } from './PdfDownloadButton'
import { ResultContent } from './ResultContent'

/** Etapa 4 · Resultado (Anderson). Aquí viven los estados (carga, vacío, error), el PDF y las acciones. */
export default function ResultPage() {
  const { state, reset, retry } = useSolver()
  const navigate = useNavigate()

  if (state.status === 'loading') {
    return (
      <p role="status" className="mx-auto max-w-4xl text-muted-foreground">
        Resolviendo el sistema…
      </p>
    )
  }

  // Sin resultado (por ejemplo, entró directo a /resultado): hay que volver a capturar.
  if (!state.result) {
    const error = state.status === 'error' && state.error ? describeError(state.error) : null
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4">
        <h2 className="m-0 text-2xl font-semibold tracking-tight">Todavía no hay un resultado</h2>
        <p className="m-0 text-muted-foreground">Captura un sistema y resuélvelo para ver la solución aquí.</p>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{error.title}</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              <span>{error.detail}</span>
              {error.canRetry && (
                <Button size="sm" onClick={retry}>
                  Reintentar
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        <Button onClick={() => navigate(state.rows ? ROUTES.data : ROUTES.size)}>Ir a capturar datos</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge className="eyebrow px-3 py-1">Paso 4 de 4</Badge>
        <h2 className="m-0 text-3xl font-bold tracking-tight">Resultado</h2>
      </header>
      <ResultContent result={state.result} />
      <PdfDownloadButton />
      <footer className="flex flex-wrap justify-between gap-2 border-t border-border pt-5">
        <Button variant="outline" onClick={() => navigate(ROUTES.procedure)}>
          ← Volver al procedimiento
        </Button>
        <Button
          size="lg"
          onClick={() => {
            reset()
            navigate(ROUTES.size)
          }}
        >
          Resolver otro sistema
        </Button>
      </footer>
    </div>
  )
}
