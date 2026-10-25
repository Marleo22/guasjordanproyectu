// npm run dev — API Laravel (:8000) + Vite con recarga en caliente (:5173). Ctrl+C detiene ambos.
import { BACKEND, checkPhp, color, ensureBackendReady, FRONTEND, launch, log, npmCmd } from './lib.mjs'

checkPhp()
ensureBackendReady()

const children = [
  launch('api', color.violet, 'php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], { cwd: BACKEND }),
  launch('web', color.blue, npmCmd, ['run', 'dev', '--', '--host', '127.0.0.1'], { cwd: FRONTEND }),
]

log(`Abre ${color.blue('http://localhost:5173')} (las llamadas a /api van a Laravel en :8000). Ctrl+C para salir.`)

const stop = () => {
  for (const c of children) if (!c.killed) c.kill()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
for (const c of children) c.on('exit', (code) => code && code !== 0 && stop())
