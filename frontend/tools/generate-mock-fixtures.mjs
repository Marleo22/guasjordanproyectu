#!/usr/bin/env node
/**
 * Regenera src/lib/mock-fixtures.js llamando al BACKEND REAL, para que el modo sin servidor
 * (VITE_USE_MOCK=true) devuelva exactamente el mismo contrato que Laravel.
 *
 * Uso (con el backend encendido en http://127.0.0.1:8000):
 *   npm run fixtures
 *   API_URL=http://otro-host/api npm run fixtures
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { SAMPLES } from '../src/lib/sample-matrices.js'

const API_URL = (process.env.API_URL ?? 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const OUT = fileURLToPath(new URL('../src/lib/mock-fixtures.js', import.meta.url))

const fixtures = []
for (const sample of SAMPLES) {
  const { id, rows, columns, matrix } = sample
  const res = await fetch(`${API_URL}/gauss-jordan/solve`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, columns, matrix }),
  }).catch((e) => {
    console.error(`No se pudo conectar con ${API_URL}. ¿Está encendido el backend? (${e.message})`)
    process.exit(1)
  })
  if (!res.ok) {
    console.error(`${id}: la API respondió ${res.status}`, await res.text())
    process.exit(1)
  }
  const response = await res.json()
  fixtures.push({ id, rows, columns, matrix, response })
  console.log(`✓ ${id.padEnd(18)} ${rows}×${columns}  ${response.classification}  (${response.steps.length} pasos)`)
}

const header =
  '// GENERADO por tools/generate-mock-fixtures.mjs a partir del backend real — no editar a mano.\n' +
  '// Respuestas con la forma del contrato JSON. Solo las usa el modo sin servidor (VITE_USE_MOCK=true).\n'
await writeFile(OUT, `${header}export const FIXTURES = ${JSON.stringify(fixtures)};\n`, 'utf8')
console.log(`\nEscrito ${OUT}`)
