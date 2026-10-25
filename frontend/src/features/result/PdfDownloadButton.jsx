import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { describeError } from '../../lib/error-copy.js'
import { useSolver } from '../../state/solver-context.jsx'

/** Botón «Descargar pasos (PDF)». Si falla, el resultado en pantalla se conserva y se ofrece reintentar. */
export function PdfDownloadButton() {
  const { state, downloadPdf } = useSolver()
  const { status, error } = state.pdf
  const loading = status === 'loading'
  const copy = status === 'error' && error ? describeError(error) : null

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="outline" disabled={!state.submitted || loading} aria-busy={loading} onClick={downloadPdf}>
        {loading ? 'Generando PDF…' : 'Descargar pasos (PDF)'}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {status === 'success' ? 'PDF descargado.' : ''}
      </p>
      {copy && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo descargar el PDF</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>{copy.detail}</span>
            <Button size="sm" onClick={downloadPdf}>Reintentar</Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
