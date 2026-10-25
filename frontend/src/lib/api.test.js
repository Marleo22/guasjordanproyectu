// Ejecutar: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPayload, configureApi, downloadStepsPdf, solveSystem } from './api.js'
import { setMockDelay, setMockFailure } from './mock-api.js'
import { SAMPLES } from './sample-matrices.js'
import { FIXTURES } from './mock-fixtures.js'
import { mapFieldErrors } from './api-errors.js'

setMockDelay(0)
const sample = (id) => SAMPLES.find((s) => s.id === id)
const payloadOf = (id) => buildPayload(sample(id).rows, sample(id).columns, sample(id).matrix)
const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

// ---------- modo mock ----------
test('mock: los 3 tipos de resultado cumplen el sobre del contrato', async () => {
  configureApi({ useMock: true })
  for (const [id, cls] of [['MAT-02', 'unique'], ['MAT-03', 'infinite'], ['MAT-04', 'inconsistent']]) {
    const r = await solveSystem(payloadOf(id))
    assert.equal(r.classification, cls, id)
  }
})

test('mock: MAT-06 devuelve fracciones exactas, no decimales', async () => {
  configureApi({ useMock: true })
  const r = await solveSystem(payloadOf('MAT-06'))
  assert.deepEqual(r.solution, { a: '2/3', b: '2/3' })
})

test('mock: campo vacío, texto y 1/0 dan 422 por celda (VAL-01)', async () => {
  configureApi({ useMock: true })
  await assert.rejects(
    solveSystem({ rows: 2, columns: 2, matrix: [['1', '', '3'], ['x', '1/0', '2']] }),
    (e) => {
      assert.equal(e.kind, 'validation')
      assert.equal(e.message, 'Falta el coeficiente de b en la ecuación 1.')
      const { cells } = mapFieldErrors(e.fields)
      assert.deepEqual(Object.keys(cells).sort(), ['0-1', '1-0', '1-1'])
      return true
    },
  )
})

test('mock: un sistema desconocido avisa en vez de inventar un resultado', async () => {
  configureApi({ useMock: true })
  await assert.rejects(solveSystem({ rows: 2, columns: 2, matrix: [['9', '9', '9'], ['9', '8', '7']] }), { kind: 'mock' })
})

test('mock: fallos simulados', async () => {
  configureApi({ useMock: true })
  setMockFailure('server')
  await assert.rejects(solveSystem(payloadOf('MAT-01')), { kind: 'server', requestId: 'mock-0001' })
  setMockFailure(null)
})

test('mock: el PDF es un Blob application/pdf con nombre por tamaño', async () => {
  configureApi({ useMock: true })
  const { blob, filename } = await downloadStepsPdf(payloadOf('MAT-02'))
  assert.equal(blob.type, 'application/pdf')
  assert.equal(filename, 'gauss-jordan-3x3-pasos.pdf')
  assert.match(await blob.text(), /^%PDF-1\.4/)
})

test('fixtures: cada paso muestra antes/después y el último after es la rref', () => {
  for (const f of FIXTURES) {
    const { steps, rref } = f.response
    assert.ok(steps.length > 0, f.id)
    if (f.response.classification !== 'inconsistent') assert.deepEqual(steps.at(-1).after, rref, f.id)
  }
})

// ---------- modo real (fetch simulado) ----------
const realMode = () => configureApi({ useMock: false, baseUrl: 'http://api.test/api' })
const withFetch = async (impl, fn) => {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    await fn()
  } finally {
    globalThis.fetch = original
  }
}

test('real: 200 válido pasa; falta de campo es error de contrato', async () => {
  realMode()
  const ok = FIXTURES[0].response
  await withFetch(async () => json(200, ok), async () => {
    assert.equal((await solveSystem(payloadOf('MAT-01'))).classification, 'unique')
  })
  const { rref, ...incomplete } = ok
  await withFetch(async () => json(200, incomplete), async () => {
    await assert.rejects(solveSystem(payloadOf('MAT-01')), { kind: 'contract' })
  })
})

test('real: 422 acepta `fields` (contrato) y `errors` (Laravel por defecto)', async () => {
  realMode()
  for (const key of ['fields', 'errors']) {
    await withFetch(async () => json(422, { error: 'invalid_matrix', message: 'm', [key]: { 'matrix.0.0': ['v'] } }), async () => {
      await assert.rejects(solveSystem(payloadOf('MAT-01')), (e) => e.kind === 'validation' && e.fields['matrix.0.0'][0] === 'v')
    })
  }
})

test('real: 500 conserva el identificador de registro', async () => {
  realMode()
  await withFetch(async () => json(500, { message: 'boom', error_id: 'log-77' }), async () => {
    await assert.rejects(solveSystem(payloadOf('MAT-01')), { kind: 'server', requestId: 'log-77', status: 500 })
  })
})

test('real: sin conexión es kind=network', async () => {
  realMode()
  await withFetch(async () => { throw new TypeError('Failed to fetch') }, async () => {
    await assert.rejects(solveSystem(payloadOf('MAT-01')), { kind: 'network' })
  })
})

test('real: timeout es kind=timeout y cancelar manualmente NO es un error de la UI', async () => {
  configureApi({ useMock: false, baseUrl: 'http://api.test/api', timeoutMs: 20 })
  const hang = (_url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
  await withFetch(hang, async () => {
    await assert.rejects(solveSystem(payloadOf('MAT-01')), { kind: 'timeout' })
    configureApi({ timeoutMs: 5000 })
    const ctrl = new AbortController()
    const p = solveSystem(payloadOf('MAT-01'), { signal: ctrl.signal })
    ctrl.abort()
    await assert.rejects(p, { name: 'AbortError' })
  })
  configureApi({ timeoutMs: 20000 })
})

test('real: /steps.pdf exige application/pdf', async () => {
  realMode()
  await withFetch(async () => new Response('%PDF-1.4', { status: 200, headers: { 'Content-Type': 'application/pdf' } }), async () => {
    const { blob, filename } = await downloadStepsPdf(payloadOf('MAT-02'))
    assert.equal(blob.size, 8)
    assert.equal(filename, 'gauss-jordan-3x3-pasos.pdf')
  })
  await withFetch(async () => json(200, { oops: true }), async () => {
    await assert.rejects(downloadStepsPdf(payloadOf('MAT-02')), { kind: 'contract' })
  })
})

test('mock: sistemas rectangulares usan rows/columns y nombran el PDF con ambos', async () => {
  configureApi({ useMock: true })
  const r = await solveSystem(payloadOf('infinite-2x3'))
  assert.equal(r.classification, 'infinite')
  assert.equal(r.rows, 2)
  assert.equal(r.columns, 3)
  const { filename } = await downloadStepsPdf(payloadOf('unique-3x2'))
  assert.equal(filename, 'gauss-jordan-3x2-pasos.pdf')
})

test('buildPayload recorta espacios y usa el contrato rectangular', () => {
  assert.deepEqual(buildPayload(2, 3, [[' 1 ', '2', '3', '4'], ['5', ' 6', '7 ', '8']]), {
    rows: 2,
    columns: 3,
    matrix: [['1', '2', '3', '4'], ['5', '6', '7', '8']],
  })
})
