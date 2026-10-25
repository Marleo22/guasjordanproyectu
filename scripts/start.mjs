// npm start — un solo servidor: Laravel sirve la web compilada y la API en http://127.0.0.1:8000
import { existsSync } from 'node:fs'
import path from 'node:path'
import { BACKEND, checkPhp, color, ensureBackendReady, FRONTEND, launch, log, npmCmd, run } from './lib.mjs'

checkPhp()
// La web compilada viene en el repositorio: Node/npm del frontend solo hacen falta para recompilar.
const built = existsSync(path.join(BACKEND, 'public', 'spa', 'index.html'))
const rebuild = process.argv.includes('--build') || !built
ensureBackendReady({ needFrontend: rebuild })

const port = process.env.PORT ?? '8000'
if (rebuild) {
  log('Compilando la web…')
  run(npmCmd, ['run', 'build'], { cwd: FRONTEND })
}

const server = launch('app', color.violet, 'php', ['artisan', 'serve', '--host=127.0.0.1', `--port=${port}`], { cwd: BACKEND })
log(`Gauss-Jordan listo en ${color.blue(`http://127.0.0.1:${port}`)}  ${color.dim('(Ctrl+C para detener)')}`)

const stop = () => {
  server.kill()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
server.on('exit', (code) => process.exit(code ?? 0))
