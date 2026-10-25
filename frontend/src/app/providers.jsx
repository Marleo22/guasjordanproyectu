import { RouterProvider } from 'react-router-dom'
import { SolverProvider } from '@/state/solver-context'
import { router } from './router'

/** El SolverProvider va POR ENCIMA de las rutas: así el estado sobrevive al avanzar y retroceder. */
export default function Providers() {
  return (
    <SolverProvider>
      <RouterProvider router={router} />
    </SolverProvider>
  )
}
