import { prettyMinus, STEP_TYPE_LABEL } from '@/lib/formatters'

const TYPE_DOT = {
  swap: 'bg-sky-600',
  scale: 'bg-primary',
  eliminate: 'bg-amber-600',
}

/** Lista de operaciones en el orden exacto que devolvió el backend. Seleccionar una salta a ese paso. */
export function OperationList({ steps, current, onSelect }) {
  return (
    <nav aria-label="Operaciones entre filas" className="flex flex-col gap-2">
      <h3 className="m-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Operaciones ({steps.length})
      </h3>
      <ol className="m-0 flex max-h-[28rem] list-none flex-col gap-1 overflow-y-auto p-0 pr-1">
        {steps.map((step, i) => {
          const active = i === current
          return (
            <li key={step.index}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none ${
                  active ? 'border-primary bg-secondary text-secondary-foreground' : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{step.index}</span>
                <span className={`size-2 shrink-0 rounded-full ${TYPE_DOT[step.type] ?? 'bg-muted-foreground'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono font-semibold">{prettyMinus(step.notation)}</span>
                  <span className="block text-xs text-muted-foreground">{STEP_TYPE_LABEL[step.type] ?? step.type}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
