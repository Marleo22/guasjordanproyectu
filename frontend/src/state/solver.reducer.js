/**
 * Fuente única de estado del solver: dimensiones, matriz, resultado, pasos y estados de la UI.
 * Nadie más guarda copias de estos datos (regla del plan). Funciones puras, sin React.
 *
 * Dimensiones: `rows` = ecuaciones, `columns` = incógnitas (ambas de 2 a 5, independientes).
 * La matriz aumentada siempre tiene `rows` filas y `columns + 1` valores por fila.
 */
import { mapFieldErrors } from '../lib/api-errors.js'

export const VARIABLES = ['a', 'b', 'c', 'd', 'e']
export const MIN_DIMENSION = 2
export const MAX_DIMENSION = 5

export const ACTIONS = {
  SET_DIMENSIONS: 'SET_DIMENSIONS',
  SET_CELL: 'SET_CELL',
  LOAD_SAMPLE: 'LOAD_SAMPLE',
  CLEAR: 'CLEAR',
  SOLVE_START: 'SOLVE_START',
  SOLVE_SUCCESS: 'SOLVE_SUCCESS',
  SOLVE_ERROR: 'SOLVE_ERROR',
  SET_STEP_INDEX: 'SET_STEP_INDEX',
  DISMISS_ERROR: 'DISMISS_ERROR',
  PDF_START: 'PDF_START',
  PDF_SUCCESS: 'PDF_SUCCESS',
  PDF_ERROR: 'PDF_ERROR',
  RESET: 'RESET',
}

export const emptyMatrix = (rows, columns) => Array.from({ length: rows }, () => Array(columns + 1).fill(''))
export const isMatrixEmpty = (matrix) =>
  matrix.length === 0 || matrix.every((row) => row.every((c) => String(c).trim() === ''))
export const isValidDimension = (n) => Number.isInteger(n) && n >= MIN_DIMENSION && n <= MAX_DIMENSION

const idlePdf = { status: 'idle', error: null }

export const initialState = {
  rows: null, // ecuaciones 2..5, null hasta que se elige en la etapa Tamaño
  columns: null, // incógnitas 2..5
  matrix: [], // strings; rows filas x (columns + 1) valores
  status: 'idle', // idle | loading | success | error
  result: null, // sobre completo del backend, tal cual
  submitted: null, // payload que produjo `result` (el PDF usa este mismo)
  stepIndex: 0, // paso actual en Procedimiento
  error: null, // { kind, message, status?, requestId? }
  cellErrors: {}, // { "fila-columna": "mensaje" } base 0
  formErrors: [], // errores del 422 que no pertenecen a una celda
  pdf: idlePdf, // { status: idle|loading|success|error, error }
}

// Quita todo lo que depende de un resultado anterior.
const withoutResult = (state) => ({
  ...state,
  status: 'idle',
  result: null,
  submitted: null,
  stepIndex: 0,
  error: null,
  cellErrors: {},
  formErrors: [],
  pdf: idlePdf,
})

export function solverReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DIMENSIONS: {
      const { rows, columns } = action
      if (!isValidDimension(rows) || !isValidDimension(columns)) return state
      // Elegir las mismas dimensiones otra vez (volver atrás y avanzar) NO borra lo capturado.
      if (rows === state.rows && columns === state.columns && state.matrix.length) return state
      return { ...withoutResult(state), rows, columns, matrix: emptyMatrix(rows, columns) }
    }

    case ACTIONS.SET_CELL: {
      const { row, col, value } = action
      const matrix = state.matrix.map((r, i) => (i === row ? r.map((c, j) => (j === col ? value : c)) : r))
      const { [`${row}-${col}`]: _removed, ...cellErrors } = state.cellErrors
      // Editar invalida el resultado anterior: ya no corresponde a lo que hay en pantalla.
      const base = state.result ? withoutResult(state) : state
      return { ...base, matrix, cellErrors: state.result ? {} : cellErrors }
    }

    case ACTIONS.LOAD_SAMPLE:
      return {
        ...withoutResult(state),
        rows: action.rows,
        columns: action.columns,
        matrix: action.matrix.map((r) => [...r]),
      }

    case ACTIONS.CLEAR:
      return { ...withoutResult(state), matrix: state.rows ? emptyMatrix(state.rows, state.columns) : [] }

    case ACTIONS.SOLVE_START:
      return { ...state, status: 'loading', error: null, cellErrors: {}, formErrors: [], pdf: idlePdf }

    case ACTIONS.SOLVE_SUCCESS:
      return {
        ...state,
        status: 'success',
        result: action.result,
        submitted: action.submitted,
        stepIndex: 0,
        error: null,
        cellErrors: {},
        formErrors: [],
      }

    case ACTIONS.SOLVE_ERROR: {
      const { error } = action
      const mapped = error.kind === 'validation' ? mapFieldErrors(error.fields) : { cells: {}, form: [] }
      return {
        ...state,
        status: 'error',
        result: null,
        submitted: null,
        error: { kind: error.kind, message: error.message, status: error.status, requestId: error.requestId },
        cellErrors: mapped.cells,
        formErrors: mapped.form,
      }
    }

    case ACTIONS.SET_STEP_INDEX: {
      const last = Math.max((state.result?.steps.length ?? 1) - 1, 0)
      return { ...state, stepIndex: Math.min(Math.max(action.index, 0), last) }
    }

    case ACTIONS.DISMISS_ERROR:
      return { ...state, error: null, status: state.status === 'error' ? 'idle' : state.status }

    case ACTIONS.PDF_START:
      return { ...state, pdf: { status: 'loading', error: null } }
    case ACTIONS.PDF_SUCCESS:
      return { ...state, pdf: { status: 'success', error: null } }
    case ACTIONS.PDF_ERROR:
      // El resultado en pantalla se conserva (regla del plan); solo falla la descarga.
      return {
        ...state,
        pdf: {
          status: 'error',
          error: { kind: action.error.kind, message: action.error.message, requestId: action.error.requestId },
        },
      }

    case ACTIONS.RESET:
      return initialState

    default:
      return state
  }
}
