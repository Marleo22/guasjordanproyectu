/**
 * Cliente de la API Gauss-Jordan (Anderson).
 * Reglas:
 *  - La UI NUNCA llama a fetch directamente: todo pasa por aquí.
 *  - Cualquier fallo sale como ApiError con `kind` (ver api-errors.js).
 *  - No se recalcula ni se modifica nada de lo que devuelve el backend.
 */
import { ApiError, isAbort } from './api-errors.js'
import { assertSolveEnvelope } from './contract.js'
import { mockSolve, mockPdf, mockExamples, mockHealth } from './mock-api.js'

const env = import.meta.env ?? {}
const cfg = {
  // Por defecto `/api` relativo: en desarrollo Vite lo redirige a Laravel (proxy en vite.config.js)
  // y en producción Laravel sirve el frontend y la API desde el mismo origen.
  baseUrl: String(env.VITE_API_URL || '/api').replace(/\/$/, ''),
  useMock: env.VITE_USE_MOCK === 'true',
  timeoutMs: 20000,
}
/** Solo para pruebas: cambia la configuración en caliente. */
export const configureApi = (patch) => Object.assign(cfg, patch)
export const getApiConfig = () => ({ ...cfg })

/** Contrato rectangular del backend: `rows` ecuaciones × `columns` incógnitas (+1 término independiente). */
export function buildPayload(rows, columns, matrix) {
  return { rows, columns, matrix: matrix.map((row) => row.map((c) => String(c).trim())) }
}

async function request(path, { method = 'GET', body, signal, accept = 'application/json' } = {}) {
  // Un solo AbortController que une el cancelar del usuario y el timeout.
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    ctrl.abort()
  }, cfg.timeoutMs)
  signal?.addEventListener('abort', () => ctrl.abort())

  let res
  try {
    res = await fetch(`${cfg.baseUrl}${path}`, {
      method,
      headers: { Accept: accept, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
  } catch (e) {
    if (isAbort(e)) {
      if (timedOut) throw new ApiError('timeout', 'La API tardó demasiado en responder.')
      throw e // cancelado por el usuario: la UI lo ignora
    }
    throw new ApiError('network', `No se pudo conectar con la API (${cfg.baseUrl}).`)
  } finally {
    clearTimeout(timer)
  }

  if (res.ok) return res
  throw await toApiError(res)
}

async function toApiError(res) {
  let data = null
  try {
    data = await res.json()
  } catch {
    /* cuerpo vacío o no JSON */
  }
  const requestId = data?.error_id ?? data?.request_id ?? res.headers.get('X-Request-Id')
  if (res.status === 422) {
    // Contrato: { error, message, fields }. Laravel por defecto manda `errors`: se toleran ambos.
    const fields = data?.fields ?? data?.errors ?? {}
    return new ApiError('validation', data?.message ?? 'La matriz no es válida.', { status: 422, fields })
  }
  if (res.status >= 500) {
    return new ApiError('server', data?.message ?? 'Error inesperado del servidor.', {
      status: res.status,
      requestId,
    })
  }
  return new ApiError('http', data?.message ?? `La API respondió ${res.status}.`, { status: res.status })
}

async function readJson(res, what) {
  try {
    return await res.json()
  } catch {
    throw new ApiError('contract', `La respuesta de ${what} no es JSON válido.`)
  }
}

/** POST /api/gauss-jordan/solve  (Diego) */
export async function solveSystem(payload, { signal } = {}) {
  if (cfg.useMock) return assertSolveEnvelope(await mockSolve(payload, { signal }))
  const res = await request('/gauss-jordan/solve', { method: 'POST', body: payload, signal })
  return assertSolveEnvelope(await readJson(res, '/solve'))
}

/** POST /api/gauss-jordan/steps.pdf  (Jacob) -> { blob, filename } */
export async function downloadStepsPdf(payload, { signal } = {}) {
  // Mismo nombre que genera el backend: gauss-jordan-{filas}x{incógnitas}-pasos.pdf
  const filename = `gauss-jordan-${payload.rows}x${payload.columns}-pasos.pdf`
  if (cfg.useMock) return { blob: await mockPdf(payload, { signal }), filename }
  const res = await request('/gauss-jordan/steps.pdf', {
    method: 'POST',
    body: payload,
    signal,
    accept: 'application/pdf',
  })
  const type = res.headers.get('Content-Type') ?? ''
  if (!type.includes('application/pdf')) {
    throw new ApiError('contract', `/steps.pdf debía responder application/pdf y respondió "${type}".`)
  }
  return { blob: await res.blob(), filename }
}

/** GET /api/gauss-jordan/examples  (Jacob) -> { examples: [{ id, title, rows, columns, matrix, expected_classification }] } */
export async function fetchExamples({ signal } = {}) {
  if (cfg.useMock) return mockExamples({ signal })
  return readJson(await request('/gauss-jordan/examples', { signal }), '/examples')
}

/** GET /api/health  (Diego) */
export async function checkHealth({ signal } = {}) {
  if (cfg.useMock) return mockHealth({ signal })
  return readJson(await request('/health', { signal }), '/health')
}
