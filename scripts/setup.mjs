// npm run setup — instala todo lo necesario la primera vez (backend + frontend) y compila la web.
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { BACKEND, checkPhp, color, composerCommand, FRONTEND, log, npmCmd, run } from './lib.mjs'

const php = checkPhp({ forComposer: true })
log(`PHP ${php.version}`)

log('Instalando dependencias del backend (Composer)…')
const composer = await composerCommand(php.extra)
run(composer.cmd, [...composer.args, 'install', '--no-interaction', '--prefer-dist'], { cwd: BACKEND })

if (!existsSync(path.join(BACKEND, '.env'))) {
  log('Creando backend/.env a partir de .env.example')
  copyFileSync(path.join(BACKEND, '.env.example'), path.join(BACKEND, '.env'))
  run('php', ['artisan', 'key:generate', '--ansi'], { cwd: BACKEND })
}

log('Instalando dependencias del frontend (npm)…')
run(npmCmd, ['install'], { cwd: FRONTEND })

log('Compilando la web…')
run(npmCmd, ['run', 'build'], { cwd: FRONTEND })

console.log(`\n${color.green('✓ Listo.')} Siguiente paso:\n`)
console.log(`  ${color.violet('npm start')}     usar la aplicación en http://127.0.0.1:8000`)
console.log(`  ${color.violet('npm run dev')}   desarrollar con recarga en caliente en http://localhost:5173\n`)
