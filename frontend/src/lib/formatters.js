/**
 * Formato de presentación. NO calcula nada del algoritmo: solo convierte el texto racional
 * que manda el backend ("-2/3", "1 - t") en texto legible.
 */
import { VARIABLES } from '../state/solver.reducer.js'

/** Signo menos tipográfico (−) en lugar del guion. */
export const prettyMinus = (text) => String(text).replace(/(^|[\s(])-/g, '$1−').replace(/ - /g, ' − ')

/** Descompone "-2/3" en { negative, numerator, denominator }; null si no es fracción. */
export function parseFraction(value) {
  const m = /^\s*(-?)(\d+)\s*\/\s*(\d+)\s*$/.exec(String(value))
  return m ? { negative: m[1] === '-', numerator: m[2], denominator: m[3] } : null
}

/** Nombre de las incógnitas según el número de columnas. */
export const variablesFor = (columns, fromResult) => fromResult ?? VARIABLES.slice(0, columns)

const isZero = (v) => /^-?0+(\.0+)?$/.test(String(v).trim()) || /^-?0+\/\d+$/.test(String(v).trim())
const isOne = (v) => String(v).trim() === '1'
const isMinusOne = (v) => String(v).trim() === '-1'

/**
 * Ecuación legible desde una fila de la matriz aumentada: ["2","-1","1/2","5"] -> "2a − b + (1/2)c = 5".
 * Solo da formato; no simplifica ni opera.
 */
export function equationText(row, variables) {
  const coefs = row.slice(0, variables.length)
  const rhs = row[variables.length]
  const terms = []
  coefs.forEach((raw, j) => {
    const c = String(raw).trim()
    if (c === '' || isZero(c)) return
    const negative = c.startsWith('-')
    const abs = negative ? c.slice(1) : c
    const body = isOne(c) || isMinusOne(c) ? variables[j] : abs.includes('/') ? `(${abs})${variables[j]}` : `${abs}${variables[j]}`
    if (terms.length === 0) terms.push(`${negative ? '−' : ''}${body}`)
    else terms.push(`${negative ? '−' : '+'} ${body}`)
  })
  const left = terms.length ? terms.join(' ') : '0'
  return `${left} = ${prettyMinus(String(rhs).trim() || '0')}`
}

export const STEP_TYPE_LABEL = {
  swap: 'Intercambio',
  scale: 'Escalamiento',
  eliminate: 'Eliminación',
}

export const CLASSIFICATION_COPY = {
  unique: {
    title: 'Solución única',
    tone: 'success',
    summary: 'El sistema es compatible determinado: cada incógnita tiene exactamente un valor.',
  },
  infinite: {
    title: 'Infinitas soluciones',
    tone: 'warning',
    summary: 'El sistema es compatible indeterminado: hay variables libres y la solución se expresa con parámetros.',
  },
  inconsistent: {
    title: 'Sin solución',
    tone: 'danger',
    summary: 'El sistema es incompatible: la eliminación produce una ecuación imposible del tipo 0 = k con k ≠ 0.',
  },
}

export const dimensionLabel = (rows, columns) =>
  rows === columns ? `${rows} × ${columns}` : `${rows} ecuaciones × ${columns} incógnitas`
