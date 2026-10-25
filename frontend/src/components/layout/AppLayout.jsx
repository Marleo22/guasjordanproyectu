import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { stepForPath } from '@/lib/routes'
import { useSolver } from '@/state/solver-context'
import AppHeader from './AppHeader'
import Stepper from './Stepper'

const TITLES = { 1: 'Tamaño', 2: 'Datos', 3: 'Procedimiento', 4: 'Resultado' }

/** Marco común: header + stepper (presente en todas las pantallas, regla visual del plan) + etapa actual. */
export default function AppLayout() {
  const { pathname } = useLocation()
  const { state } = useSolver()
  const paso = stepForPath(pathname)

  useEffect(() => {
    document.title = `${TITLES[paso]} · Gauss-Jordan paso a paso`
    window.scrollTo({ top: 0 })
  }, [paso])

  const alcanzable = (n) => n === 1 || (n === 2 && Boolean(state.rows)) || (n >= 3 && Boolean(state.result))

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <AppHeader />
      <main id="contenido" className="page-container">
        <Stepper pasoActual={paso} alcanzable={alcanzable} />
        <Outlet />
      </main>
    </>
  )
}
