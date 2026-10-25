import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react'
import { buildPayload, downloadStepsPdf, solveSystem } from '../lib/api.js'
import { ApiError, isAbort } from '../lib/api-errors.js'
import { saveBlob } from '../lib/download.js'
import { ACTIONS, initialState, isMatrixEmpty, solverReducer } from './solver.reducer.js'

const SolverContext = createContext(null)

/**
 * IMPORTANTE: este Provider debe envolver TODAS las rutas (en src/app/providers.jsx, por encima
 * del <RouterProvider>), para que el estado sobreviva al avanzar y retroceder entre etapas.
 */
export function SolverProvider({ children }) {
  const [state, dispatch] = useReducer(solverReducer, initialState)

  // Espejo del estado para que las acciones async lean valores actuales sin recrearse.
  const stateRef = useRef(state)
  useLayoutEffect(() => {
    stateRef.current = state
  }, [state])

  const solveCtrl = useRef(null)
  const pdfCtrl = useRef(null)
  const requestId = useRef(0) // descarta respuestas viejas si se lanzó otra petición

  useEffect(
    () => () => {
      solveCtrl.current?.abort()
      pdfCtrl.current?.abort()
    },
    [],
  )

  const solve = useCallback(async () => {
    const { rows, columns, matrix } = stateRef.current
    if (!rows || !columns || isMatrixEmpty(matrix)) {
      dispatch({
        type: ACTIONS.SOLVE_ERROR,
        error: new ApiError('empty', 'Escribe al menos un valor o carga un ejemplo antes de resolver.'),
      })
      return false
    }
    solveCtrl.current?.abort()
    const ctrl = new AbortController()
    solveCtrl.current = ctrl
    const id = ++requestId.current
    const payload = buildPayload(rows, columns, matrix)

    dispatch({ type: ACTIONS.SOLVE_START })
    try {
      const result = await solveSystem(payload, { signal: ctrl.signal })
      if (id !== requestId.current) return false
      dispatch({ type: ACTIONS.SOLVE_SUCCESS, result, submitted: payload })
      return true
    } catch (e) {
      if (isAbort(e) || id !== requestId.current) return false
      dispatch({ type: ACTIONS.SOLVE_ERROR, error: e instanceof ApiError ? e : new ApiError('server', String(e?.message ?? e)) })
      return false
    }
  }, [])

  const downloadPdf = useCallback(async () => {
    const { submitted } = stateRef.current
    if (!submitted) return
    pdfCtrl.current?.abort()
    const ctrl = new AbortController()
    pdfCtrl.current = ctrl
    dispatch({ type: ACTIONS.PDF_START })
    try {
      const { blob, filename } = await downloadStepsPdf(submitted, { signal: ctrl.signal })
      saveBlob(blob, filename)
      dispatch({ type: ACTIONS.PDF_SUCCESS })
    } catch (e) {
      if (isAbort(e)) return
      dispatch({ type: ACTIONS.PDF_ERROR, error: e instanceof ApiError ? e : new ApiError('server', String(e?.message ?? e)) })
    }
  }, [])

  const actions = useMemo(
    () => ({
      setDimensions: (rows, columns) => dispatch({ type: ACTIONS.SET_DIMENSIONS, rows, columns }),
      setCell: (row, col, value) => dispatch({ type: ACTIONS.SET_CELL, row, col, value }),
      loadSample: (sample) =>
        dispatch({ type: ACTIONS.LOAD_SAMPLE, rows: sample.rows, columns: sample.columns, matrix: sample.matrix }),
      clear: () => {
        solveCtrl.current?.abort()
        dispatch({ type: ACTIONS.CLEAR })
      },
      reset: () => {
        solveCtrl.current?.abort()
        pdfCtrl.current?.abort()
        dispatch({ type: ACTIONS.RESET })
      },
      setStepIndex: (index) => dispatch({ type: ACTIONS.SET_STEP_INDEX, index }),
      dismissError: () => dispatch({ type: ACTIONS.DISMISS_ERROR }),
      solve,
      retry: solve,
      downloadPdf,
    }),
    [solve, downloadPdf],
  )

  const value = useMemo(() => ({ state, ...actions }), [state, actions])
  return <SolverContext.Provider value={value}>{children}</SolverContext.Provider>
}

export function useSolver() {
  const ctx = useContext(SolverContext)
  if (!ctx) throw new Error('useSolver debe usarse dentro de <SolverProvider>.')
  return ctx
}
