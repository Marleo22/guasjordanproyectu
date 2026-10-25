import { Link } from 'react-router-dom'
import { STEPS } from '@/lib/routes'

/**
 * Stepper de 4 etapas (Yorman). Activo en morado, completados en verde.
 * `alcanzable(n)` decide si una etapa ya se puede visitar (por ejemplo, Resultado solo con resultado).
 */
function Stepper({ pasoActual = 1, alcanzable = () => false }) {
  return (
    <nav className="stepper" aria-label="Progreso de resolución">
      {STEPS.map((paso) => {
        const activo = paso.number === pasoActual
        const completado = paso.number < pasoActual
        const navegable = !activo && alcanzable(paso.number)
        const contenido = (
          <>
            <div className="stepper__circle" aria-hidden="true">
              {completado ? '✓' : paso.number}
            </div>
            <span>{paso.name}</span>
          </>
        )

        return (
          <div
            className={`stepper__item ${activo ? 'stepper__item--activo' : ''} ${completado ? 'stepper__item--completado' : ''}`}
            key={paso.number}
          >
            {navegable ? (
              <Link className="stepper__link" to={paso.path} aria-label={`Ir a la etapa ${paso.number}: ${paso.name}`}>
                {contenido}
              </Link>
            ) : (
              <div className="stepper__link" aria-current={activo ? 'step' : undefined} aria-disabled={!activo || undefined}>
                {contenido}
              </div>
            )}
            {paso.number < STEPS.length && <div className="stepper__line" aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

export default Stepper
