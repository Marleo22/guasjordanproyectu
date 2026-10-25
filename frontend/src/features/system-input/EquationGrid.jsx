import { Fragment } from 'react'
import { Input } from '@/components/ui/Input'
import { VARIABLES } from '@/state/solver.reducer'

/**
 * Ecuaciones legibles: [coef]a + [coef]b + ... = [término independiente].
 * Es "tonto": recibe todo por props y avisa con onChange(fila, columna, valor).
 * No valida números: la validación vive en el backend (SolveSystemRequest, Jacob).
 */
export function EquationGrid({ columns, matrix, cellErrors, disabled, onChange }) {
  return (
    <div
      className="flex flex-col gap-5"
      role="group"
      aria-label={`Sistema de ${matrix.length} ecuaciones con ${columns} incógnitas`}
    >
      {matrix.map((row, i) => {
        const rowErrors = row.map((_, j) => cellErrors[`${i}-${j}`]).filter(Boolean)
        const errorId = `equation-${i}-error`
        const cell = (j, label) => (
          <Input
            value={row[j]}
            disabled={disabled}
            onChange={(e) => onChange(i, j, e.target.value)}
            // inputMode "text": el teclado numérico del celular no trae la barra de fracciones (1/3)
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            aria-label={`${label} de la ecuación ${i + 1}`}
            aria-invalid={cellErrors[`${i}-${j}`] ? true : undefined}
            aria-describedby={rowErrors.length ? errorId : undefined}
            className="w-[4.5rem] text-center font-mono"
          />
        )
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="w-6 text-sm font-semibold text-muted-foreground">{i + 1}.</span>
              {row.slice(0, columns).map((_, j) => (
                <Fragment key={j}>
                  {j > 0 && (
                    <span aria-hidden="true" className="text-muted-foreground">
                      +
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    {cell(j, `Coeficiente de ${VARIABLES[j]}`)}
                    <span className="font-semibold italic">{VARIABLES[j]}</span>
                  </span>
                </Fragment>
              ))}
              <span aria-hidden="true" className="px-1 font-semibold text-muted-foreground">
                =
              </span>
              {cell(columns, 'Término independiente')}
            </div>
            {rowErrors.length > 0 && (
              <p id={errorId} className="m-0 pl-8 text-sm text-destructive">
                {rowErrors.join(' · ')}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
