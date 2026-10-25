// Rutas de las 4 etapas del stepper.
export const ROUTES = {
  size: '/',
  data: '/datos',
  procedure: '/procedimiento',
  result: '/resultado',
}

export const STEPS = [
  { number: 1, name: 'Tamaño', path: ROUTES.size },
  { number: 2, name: 'Datos', path: ROUTES.data },
  { number: 3, name: 'Procedimiento', path: ROUTES.procedure },
  { number: 4, name: 'Resultado', path: ROUTES.result },
]

export const stepForPath = (pathname) => STEPS.find((s) => s.path === pathname)?.number ?? 1
