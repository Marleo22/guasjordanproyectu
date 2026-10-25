/**
 * Mock de la API: misma forma que el contrato, sin backend (VITE_USE_MOCK=true).
 * Solo conoce los sistemas de sample-matrices.js.
 * NO resuelve nada: busca la respuesta ya preparada en mock-fixtures.js, que se genera llamando
 * al backend real con `npm run fixtures` (tools/generate-mock-fixtures.mjs).
 * También simula el 422 de Jacob (campos vacíos, texto, 1/0) para probar los errores por celda.
 */
import { ApiError } from './api-errors.js'
import { SAMPLES } from './sample-matrices.js'

const env = import.meta.env ?? {}
let DELAY = Number(env.VITE_MOCK_DELAY_MS ?? 600)
/** Solo para pruebas automáticas (evita esperar la latencia simulada). */
export const setMockDelay = (ms) => {
  DELAY = ms
}
const VARS = 'abcde'
const NUMBER_RE = /^[+-]?(\d+(\.\d+)?|\.\d+)$/
const FRACTION_RE = /^[+-]?\d+\/\d+$/

let forcedFailure = null // 'server' | 'network' | null

/** Para QA: en la consola del navegador -> __mockFail('server') / __mockFail(null) */
export function setMockFailure(kind) {
  forcedFailure = kind
}
if (typeof window !== 'undefined' && env.DEV) window.__mockFail = setMockFailure

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

const clean = (matrix) => matrix.map((row) => row.map((c) => String(c ?? '').replace(/\s+/g, '')))
const keyOf = (rows, columns, matrix) => JSON.stringify([rows, columns, clean(matrix)])

function validate(payload) {
  const { rows, columns, matrix } = payload ?? {}
  for (const [key, value, label] of [
    ['rows', rows, 'ecuaciones'],
    ['columns', columns, 'incógnitas'],
  ]) {
    if (!Number.isInteger(value) || value < 2 || value > 5) {
      const msg = `El número de ${label} debe estar entre 2 y 5.`
      throw new ApiError('validation', msg, { status: 422, fields: { [key]: [msg] } })
    }
  }
  const fields = {}
  let first = null
  const add = (i, j, msg) => {
    fields[`matrix.${i}.${j}`] = [msg]
    first ??= msg
  }
  clean(matrix ?? []).forEach((row, i) =>
    row.forEach((v, j) => {
      const what = j < columns ? `el coeficiente de ${VARS[j]}` : 'el término independiente'
      if (v === '') return add(i, j, `Falta ${what} en la ecuación ${i + 1}.`)
      if (FRACTION_RE.test(v)) {
        if (Number(v.split('/')[1]) === 0) add(i, j, 'La fracción no puede tener denominador 0.')
      } else if (!NUMBER_RE.test(v)) {
        add(i, j, `«${v}» no es un número válido (usa enteros, decimales o fracciones como 1/3).`)
      }
    }),
  )
  if (first) {
    throw new ApiError('validation', first, { status: 422, fields })
  }
}

function maybeFail() {
  if (forcedFailure === 'network') throw new ApiError('network', 'Sin conexión (simulado).')
  if (forcedFailure === 'server')
    throw new ApiError('server', 'Error inesperado del servidor (simulado).', {
      status: 500,
      requestId: 'mock-0001',
    })
}

export async function mockSolve(payload, { signal } = {}) {
  await wait(DELAY, signal)
  maybeFail()
  validate(payload)
  const { FIXTURES } = await import('./mock-fixtures.js')
  const hit = FIXTURES.find(
    (f) => keyOf(f.rows, f.columns, f.matrix) === keyOf(payload.rows, payload.columns, payload.matrix),
  )
  if (!hit) {
    throw new ApiError(
      'mock',
      'El modo sin servidor solo conoce los ejemplos del botón «Cargar ejemplo». Para otros sistemas inicia el backend y usa VITE_USE_MOCK=false.',
    )
  }
  return structuredClone(hit.response)
}

/** PDF mínimo válido (una página con texto) para probar la descarga sin backend. */
function buildTinyPdf(text) {
  const esc = (s) => s.replace(/[\\()]/g, '\\$&')
  const stream = `BT /F1 14 Tf 50 780 Td (${esc(text)}) Tj ET`
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, '0')} 00000 n \n`))
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export async function mockPdf(payload, { signal } = {}) {
  await mockSolve(payload, { signal }) // mismas reglas que /solve
  return buildTinyPdf(`PDF de prueba (mock) - sistema ${payload.rows}x${payload.columns}`)
}

export async function mockExamples({ signal } = {}) {
  await wait(DELAY / 2, signal)
  return { examples: SAMPLES }
}

export async function mockHealth({ signal } = {}) {
  await wait(DELAY / 4, signal)
  return { status: 'ok', mock: true }
}
