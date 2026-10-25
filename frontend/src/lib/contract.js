import { ApiError } from './api-errors.js'

const REQUIRED = [
  'classification',
  'solution',
  'free_variables',
  'parameters',
  'contradiction',
  'verification',
  'initial_matrix',
  'steps',
  'rref',
]
const CLASSIFICATIONS = ['unique', 'infinite', 'inconsistent']

/**
 * Regla del plan: "si falta un campo obligatorio del sobre, se trata como error de contrato".
 * Solo comprueba la forma; NO recalcula ni corrige nada.
 */
export function assertSolveEnvelope(body) {
  if (!body || typeof body !== 'object') {
    throw new ApiError('contract', 'La respuesta de /solve no es un objeto JSON.')
  }
  const missing = REQUIRED.filter((k) => !(k in body))
  if (missing.length) {
    throw new ApiError('contract', `La respuesta de /solve no trae: ${missing.join(', ')}.`)
  }
  if (!CLASSIFICATIONS.includes(body.classification)) {
    throw new ApiError('contract', `Clasificación desconocida: "${body.classification}".`)
  }
  return body
}
