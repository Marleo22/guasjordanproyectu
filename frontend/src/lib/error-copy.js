import { getApiConfig } from './api.js'

/**
 * Texto de error para la UI, según `error.kind`. Dice qué pasó y qué hacer; sin disculpas ni jerga.
 * Devuelve { title, detail, canRetry }.
 */
export function describeError(error) {
  const { baseUrl, useMock } = getApiConfig()
  const id = error.requestId ? ` Si continúa, comparte el identificador ${error.requestId} con backend.` : ''
  switch (error.kind) {
    case 'empty':
      return { title: 'Falta información', detail: error.message, canRetry: false }
    case 'validation':
      return { title: 'Revisa los campos marcados', detail: error.message, canRetry: false }
    case 'network':
      return {
        title: 'No hay conexión con la API',
        detail: useMock
          ? error.message
          : `Comprueba que el backend esté encendido en ${baseUrl} y que CORS permita este origen.`,
        canRetry: true,
      }
    case 'timeout':
      return { title: 'La API tardó demasiado', detail: `${error.message} Reintenta.`, canRetry: true }
    case 'server':
      return { title: 'El servidor no pudo completar la operación', detail: `${error.message}${id}`, canRetry: true }
    case 'contract':
      return {
        title: 'La respuesta no cumple el contrato JSON',
        detail: `${error.message} Avisa a backend: el endpoint o el contrato cambió.`,
        canRetry: false,
      }
    case 'mock':
      return { title: 'Ejemplo no disponible en el mock', detail: error.message, canRetry: false }
    default:
      return { title: 'No se pudo completar la operación', detail: error.message, canRetry: true }
  }
}
