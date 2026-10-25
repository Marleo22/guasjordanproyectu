import { FractionText } from '@/components/matrix/FractionText'
import { MatrixView } from '@/components/matrix/MatrixView'
import { CLASSIFICATION_COPY, equationText, prettyMinus, variablesFor } from '@/lib/formatters'

const TONE = {
  success: { box: 'border-success/40 bg-success-soft', title: 'text-success', icon: '✓' },
  warning: { box: 'border-warning/40 bg-warning-soft', title: 'text-warning', icon: '∞' },
  danger: { box: 'border-destructive/40 bg-destructive-soft', title: 'text-destructive', icon: '✕' },
}

/**
 * Presenta el sobre completo de /solve (Daniel). El texto y el color dependen SOLO de `classification`;
 * no se deduce nada mirando ceros ni se recalculan matrices (regla de presentación del plan).
 */
export function ResultContent({ result }) {
  const copy = CLASSIFICATION_COPY[result.classification]
  const tone = TONE[copy.tone]
  const variables = variablesFor(result.columns, result.variables)
  const columns = variables.length

  return (
    <div className="flex flex-col gap-6">
      <section className={`flex items-start gap-4 rounded-2xl border-2 p-5 ${tone.box}`} aria-labelledby="classification-title">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-full bg-card text-xl font-bold ${tone.title}`}
          aria-hidden="true"
        >
          {tone.icon}
        </span>
        <div className="flex flex-col gap-1">
          <h3 id="classification-title" className={`m-0 text-2xl font-bold ${tone.title}`}>
            {copy.title}
          </h3>
          <p className="m-0">{copy.summary}</p>
        </div>
      </section>

      {result.classification === 'unique' && <UniqueSolution solution={result.solution} variables={variables} />}
      {result.classification === 'infinite' && (
        <InfiniteSolution parameters={result.parameters} freeVariables={result.free_variables} variables={variables} />
      )}
      {result.classification === 'inconsistent' && <Contradiction contradiction={result.contradiction} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="m-0 text-lg font-semibold">Forma escalonada reducida</h3>
          <MatrixView
            matrix={result.rref}
            columns={columns}
            showRowLabels
            dangerRows={result.contradiction ? [result.contradiction.row] : []}
            label="Forma escalonada reducida"
          />
          <p className="m-0 text-sm text-muted-foreground">
            Cada fila con un 1 principal (pivote) determina una incógnita; las filas 0 = 0 no aportan información.
          </p>
        </section>

        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="m-0 text-lg font-semibold">Sistema original</h3>
          <ol className="m-0 flex flex-col gap-1 pl-6 font-mono text-sm">
            {result.initial_matrix.map((row, i) => (
              <li key={i}>{equationText(row, variables)}</li>
            ))}
          </ol>
          {result.classification === 'unique' && <VerificationList verification={result.verification} />}
        </section>
      </div>
    </div>
  )
}

function UniqueSolution({ solution, variables }) {
  return (
    <section aria-labelledby="solution-title" className="flex flex-col gap-3">
      <h3 id="solution-title" className="m-0 text-lg font-semibold">
        Solución
      </h3>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {variables.map((name) => (
          <li key={name} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-2xl">
            <span className="font-semibold italic">{name}</span>
            <span className="text-muted-foreground">=</span>
            <strong className="font-mono">
              <FractionText value={solution[name]} />
            </strong>
          </li>
        ))}
      </ul>
    </section>
  )
}

function InfiniteSolution({ parameters, freeVariables, variables }) {
  const params = [...new Set(freeVariables.map((v) => parameters[v]))]
  return (
    <section aria-labelledby="parametric-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <h3 id="parametric-title" className="m-0 text-lg font-semibold">
        Solución paramétrica
      </h3>
      <p className="m-0 text-muted-foreground">
        Variables libres: <strong className="text-foreground">{freeVariables.join(', ')}</strong>. Cada valor real de{' '}
        {params.join(', ')} produce una solución distinta.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-lg">
        {variables.map((name) => (
          <li key={name}>
            <span className="font-semibold italic">{name}</span> = {prettyMinus(parameters[name])}
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-muted-foreground">
        con {params.map((p) => `${p} ∈ ℝ`).join(', ')}
      </p>
    </section>
  )
}

function Contradiction({ contradiction }) {
  if (!contradiction) return null
  return (
    <section aria-labelledby="contradiction-title" className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
      <h3 id="contradiction-title" className="m-0 text-lg font-semibold">
        Contradicción en la fila {contradiction.row}
      </h3>
      <p className="m-0 font-mono text-lg">{prettyMinus(contradiction.equation)}</p>
      <p className="m-0 text-muted-foreground">
        El lado izquierdo vale {contradiction.left} para cualquier valor de las incógnitas, pero el lado derecho es{' '}
        {prettyMinus(contradiction.right)}. Como {contradiction.left} ≠ {prettyMinus(contradiction.right)}, ninguna
        combinación de valores satisface todas las ecuaciones a la vez.
      </p>
    </section>
  )
}

function VerificationList({ verification }) {
  const allOk = verification.every((v) => v.ok)
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <h4 className="m-0 text-sm font-semibold">
        Comprobación en las ecuaciones originales {allOk ? '· todas se cumplen' : '· revisar'}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm">
        {verification.map((v) => (
          <li key={v.equation} className="flex items-center gap-2">
            <span
              className={`grid size-5 place-items-center rounded-full text-xs font-bold text-white ${v.ok ? 'bg-success' : 'bg-destructive'}`}
              aria-hidden="true"
            >
              {v.ok ? '✓' : '✕'}
            </span>
            <span>
              Ecuación {v.equation}: <FractionText value={v.left} /> = <FractionText value={v.right} />
              <span className="sr-only">{v.ok ? ', correcta' : ', no coincide'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
