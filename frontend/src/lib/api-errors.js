/**
 * Error único que lanza la capa de API. La UI solo mira `kind`:
 *  - validation : 422, la matriz es inválida (trae `fields`)
 *  - server     : 5xx (puede traer `requestId` para el registro del backend)
 *  - network    : no hubo respuesta (backend apagado, CORS, sin internet)
 *  - timeout    : la API tardó demasiado
 *  - contract   : la respuesta no cumple el contrato JSON acordado
 *  - http       : cualquier otro 4xx
 *  - mock       : el mock no conoce ese sistema (solo en modo mock)
 */
export class ApiError extends Error {
  constructor(kind, message, { status = null, fields = null, requestId = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fields = fields
    this.requestId = requestId
  }
}

export const isAbort = (e) => e?.name === 'AbortError'

/**
 * Convierte los campos del 422 en errores por celda.
 *   "matrix.1.2": ["..."]  ->  cells["1-2"] = "..."   (índices base 0: fila-columna)
 * Lo que no sea una celda (p. ej. "size", "matrix") va a `form`.
 */
export function mapFieldErrors(fields) {
  const cells = {}
  const form = []
  for (const [key, msgs] of Object.entries(fields ?? {})) {
    const text = Array.isArray(msgs) ? msgs[0] : String(msgs)
    const m = /^matrix\.(\d+)\.(\d+)$/.exec(key)
    if (m) cells[`${m[1]}-${m[2]}`] = text
    else form.push(text)
  }
  return { cells, form }
}
