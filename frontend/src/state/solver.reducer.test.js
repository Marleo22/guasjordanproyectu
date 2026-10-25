// Ejecutar: npm test   (usa el runner nativo de Node, sin dependencias)
import test from 'node:test'
import assert from 'node:assert/strict'
import { ACTIONS as A, initialState, solverReducer as reduce } from './solver.reducer.js'

const run = (...actions) => actions.reduce((s, a) => reduce(s, a), initialState)
const dims = (rows, columns = rows) => ({ type: A.SET_DIMENSIONS, rows, columns })
const RESULT = { classification: 'unique', steps: [{}, {}, {}] }

test('elegir dimensiones cuadradas crea matriz vacía de n × (n+1)', () => {
  const s = run(dims(3))
  assert.equal(s.matrix.length, 3)
  assert.ok(s.matrix.every((r) => r.length === 4 && r.every((c) => c === '')))
})

test('elegir dimensiones rectangulares crea rows × (columns+1)', () => {
  const s = run(dims(3, 2))
  assert.equal(s.rows, 3)
  assert.equal(s.columns, 2)
  assert.equal(s.matrix.length, 3)
  assert.ok(s.matrix.every((r) => r.length === 3))
  const t = run(dims(2, 5))
  assert.equal(t.matrix.length, 2)
  assert.ok(t.matrix.every((r) => r.length === 6))
})

test('dimensiones fuera de 2..5 se ignoran', () => {
  assert.equal(run(dims(1, 3)), initialState)
  assert.equal(run(dims(3, 6)), initialState)
})

test('volver a elegir las mismas dimensiones conserva lo capturado', () => {
  const s = run(dims(2), { type: A.SET_CELL, row: 0, col: 0, value: '5' }, dims(2))
  assert.equal(s.matrix[0][0], '5')
})

test('cambiar de dimensiones reinicia matriz y resultado', () => {
  const s = run(dims(2), { type: A.SOLVE_SUCCESS, result: RESULT, submitted: {} }, dims(4, 3))
  assert.equal(s.matrix.length, 4)
  assert.equal(s.matrix[0].length, 4)
  assert.equal(s.result, null)
  assert.equal(s.status, 'idle')
})

test('editar una celda invalida el resultado anterior', () => {
  const s = run(
    dims(2),
    { type: A.SOLVE_SUCCESS, result: RESULT, submitted: { rows: 2, columns: 2 } },
    { type: A.SET_CELL, row: 1, col: 1, value: '9' },
  )
  assert.equal(s.result, null)
  assert.equal(s.submitted, null)
  assert.equal(s.status, 'idle')
  assert.equal(s.matrix[1][1], '9')
})

test('el 422 se mapea a errores por celda (índices base 0) y editar la celda limpia su error', () => {
  const err = {
    kind: 'validation',
    message: 'Falta el coeficiente de b en la ecuación 2',
    fields: { 'matrix.1.1': ['Falta el coeficiente de b en la ecuación 2'], rows: ['Dimensión inválida'] },
  }
  let s = run(dims(2), { type: A.SOLVE_ERROR, error: err })
  assert.equal(s.status, 'error')
  assert.equal(s.cellErrors['1-1'], 'Falta el coeficiente de b en la ecuación 2')
  assert.deepEqual(s.formErrors, ['Dimensión inválida'])
  s = reduce(s, { type: A.SET_CELL, row: 1, col: 1, value: '3' })
  assert.equal(s.cellErrors['1-1'], undefined)
})

test('un error de servidor no genera errores por celda y conserva la matriz', () => {
  const s = run(
    dims(2),
    { type: A.SET_CELL, row: 0, col: 0, value: '1' },
    { type: A.SOLVE_ERROR, error: { kind: 'server', message: 'x', requestId: 'abc' } },
  )
  assert.deepEqual(s.cellErrors, {})
  assert.equal(s.error.requestId, 'abc')
  assert.equal(s.matrix[0][0], '1')
})

test('fallo del PDF conserva el resultado en pantalla', () => {
  const s = run(
    dims(2),
    { type: A.SOLVE_SUCCESS, result: RESULT, submitted: { rows: 2, columns: 2 } },
    { type: A.PDF_START },
    { type: A.PDF_ERROR, error: { kind: 'network', message: 'sin red' } },
  )
  assert.equal(s.pdf.status, 'error')
  assert.equal(s.result, RESULT)
})

test('el índice de paso se limita al rango de steps', () => {
  let s = run(dims(2), { type: A.SOLVE_SUCCESS, result: RESULT, submitted: {} })
  s = reduce(s, { type: A.SET_STEP_INDEX, index: 99 })
  assert.equal(s.stepIndex, 2)
  s = reduce(s, { type: A.SET_STEP_INDEX, index: -4 })
  assert.equal(s.stepIndex, 0)
})

test('cargar un ejemplo fija sus dimensiones y copia la matriz', () => {
  const matrix = [['1', '1', '3'], ['1', '-1', '1'], ['2', '1', '5']]
  const s = run(dims(2), { type: A.LOAD_SAMPLE, rows: 3, columns: 2, matrix })
  assert.equal(s.rows, 3)
  assert.equal(s.columns, 2)
  assert.deepEqual(s.matrix, matrix)
  assert.notEqual(s.matrix[0], matrix[0])
})

test('limpiar vacía la matriz pero conserva las dimensiones; reset vuelve al inicio', () => {
  let s = run(dims(3, 4), { type: A.SET_CELL, row: 0, col: 0, value: '7' }, { type: A.CLEAR })
  assert.equal(s.rows, 3)
  assert.equal(s.columns, 4)
  assert.equal(s.matrix[0][0], '')
  assert.equal(s.matrix[0].length, 5)
  s = reduce(s, { type: A.RESET })
  assert.equal(s, initialState)
})
