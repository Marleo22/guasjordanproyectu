import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { dimensionLabel } from '@/lib/formatters'
import { ROUTES } from '@/lib/routes'
import { MAX_DIMENSION, MIN_DIMENSION, VARIABLES } from '@/state/solver.reducer'
import { useSolver } from '@/state/solver-context'
import SizeCard from './SizeCard'

const TAMANIOS = [2, 3, 4, 5]
const OPCIONES = Array.from({ length: MAX_DIMENSION - MIN_DIMENSION + 1 }, (_, i) => MIN_DIMENSION + i)

/** Etapa 1 · Tamaño. Sistemas cuadrados (tarjetas) o rectangulares (ecuaciones ≠ incógnitas). */
function SizePage() {
  const { state, setDimensions } = useSolver()
  const navigate = useNavigate()
  const [rows, setRows] = useState(state.rows ?? 3)
  const [columns, setColumns] = useState(state.columns ?? 3)

  const cuadrado = rows === columns
  const continuar = () => {
    setDimensions(rows, columns)
    navigate(ROUTES.data)
  }
  const elegirCuadrado = (n) => {
    setRows(n)
    setColumns(n)
  }

  return (
    <section className="size-page" aria-labelledby="size-title">
      <div className="size-page__intro">
        <Badge className="eyebrow px-3 py-1">Paso 1 de 4</Badge>
        <h2 id="size-title">Elige el tamaño del sistema</h2>
        <p>
          Selecciona cuántas ecuaciones e incógnitas tiene el sistema que quieres resolver con el método de
          Gauss-Jordan. Puedes usar sistemas cuadrados o rectangulares de 2 a 5.
        </p>
      </div>

      <div className="size-grid">
        {TAMANIOS.map((size) => (
          <SizeCard key={size} size={size} seleccionado={cuadrado && rows === size} onSeleccionar={elegirCuadrado} />
        ))}
      </div>

      <fieldset className={`size-custom ${!cuadrado ? 'size-custom--seleccionado' : ''}`}>
        <legend className="sr-only">Dimensiones personalizadas</legend>
        <div className="flex max-w-md flex-col gap-1">
          <strong className="text-base">Sistema rectangular o personalizado</strong>
          <span className="text-sm text-muted-foreground">
            Más ecuaciones que incógnitas (sobredeterminado) o menos ecuaciones que incógnitas (subdeterminado).
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <label>
            Ecuaciones (filas)
            <select value={rows} onChange={(e) => setRows(Number(e.target.value))}>
              {OPCIONES.map((n) => (
                <option key={n} value={n}>
                  {n} ecuaciones
                </option>
              ))}
            </select>
          </label>
          <label>
            Incógnitas (columnas)
            <select value={columns} onChange={(e) => setColumns(Number(e.target.value))}>
              {OPCIONES.map((n) => (
                <option key={n} value={n}>
                  {n} incógnitas ({VARIABLES.slice(0, n).join(', ')})
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <Card className="size-page__footer">
        <p>
          Sistema seleccionado: <strong>{dimensionLabel(rows, columns)}</strong>
          <span className="block text-sm">
            Matriz aumentada de {rows} filas × {columns + 1} columnas
          </span>
        </p>

        <Button size="lg" onClick={continuar}>
          Continuar
          <span aria-hidden="true">→</span>
        </Button>
      </Card>
    </section>
  )
}

export default SizePage
