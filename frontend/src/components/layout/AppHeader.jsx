import { Link } from 'react-router-dom'
import { getApiConfig } from '@/lib/api'
import { ROUTES } from '@/lib/routes'

function AppHeader() {
  const { useMock } = getApiConfig()
  return (
    <header className="app-header">
      <div className="app-header__content">
        <Link to={ROUTES.size} className="app-logo" aria-label="Gauss-Jordan, ir al inicio">
          <span aria-hidden="true">GJ</span>
        </Link>

        <div className="min-w-0 flex-1">
          <h1>Gauss-Jordan paso a paso</h1>
          <p>Resolución exacta de sistemas de ecuaciones lineales, con cada operación entre filas</p>
        </div>

        {useMock && (
          <span className="badge badge--primary px-3 py-1" title="VITE_USE_MOCK=true: las respuestas vienen de ejemplos guardados">
            Modo sin servidor
          </span>
        )}
      </div>
    </header>
  )
}

export default AppHeader
