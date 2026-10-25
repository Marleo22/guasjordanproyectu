// Utilidades compartidas por los scripts de la raíz (Windows, macOS y Linux).
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const BACKEND = path.join(ROOT, 'backend')
export const FRONTEND = path.join(ROOT, 'frontend')
export const isWin = process.platform === 'win32'
export const npmCmd = isWin ? 'npm.cmd' : 'npm'

export const color = {
  violet: (s) => `\x1b[35m${s}\x1b[0m`,
  blue: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

export const log = (msg) => console.log(`${color.violet('›')} ${msg}`)
export const fail = (msg) => {
  console.error(`${color.red('✗')} ${msg}`)
  process.exit(1)
}

/** Ejecuta un comando mostrando su salida; termina el proceso si falla. */
export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: isWin && cmd.endsWith('.cmd'), ...opts })
  if (res.error) fail(`No se pudo ejecutar ${cmd}: ${res.error.message}`)
  if (res.status !== 0) fail(`${cmd} ${args.join(' ')} terminó con código ${res.status}`)
}

const capture = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: false })

/** PHP >= 8.3 con las extensiones que hacen falta. Devuelve los -d extension=... necesarios. */
export function checkPhp({ forComposer = false } = {}) {
  const v = capture('php', ['-r', 'echo PHP_VERSION;'])
  if (v.error || v.status !== 0) {
    fail('No se encontró PHP. Instala PHP 8.3 o superior y agrégalo al PATH (https://www.php.net/downloads).')
  }
  const [major, minor] = v.stdout.trim().split('.').map(Number)
  if (major < 8 || (major === 8 && minor < 3)) fail(`Se necesita PHP 8.3 o superior (tienes ${v.stdout.trim()}).`)

  const modules = capture('php', ['-m']).stdout.toLowerCase()
  const needed = ['mbstring', 'openssl', 'dom', 'xml', 'tokenizer', 'ctype']
  const missing = needed.filter((m) => !modules.includes(`\n${m}`))
  if (missing.length) {
    fail(`Faltan extensiones de PHP: ${missing.join(', ')}. Actívalas en tu php.ini (php --ini muestra cuál es).`)
  }
  // Composer necesita zip (o unzip) para descargar paquetes y el lock pide fileinfo:
  // si no están activas en php.ini, se cargan solo para este comando.
  const extra = []
  if (forComposer) {
    for (const ext of ['zip', 'fileinfo']) if (!modules.includes(`\n${ext}`)) extra.push('-d', `extension=${ext}`)
  }
  return { version: v.stdout.trim(), extra }
}

/** Composer global o, si no existe, tools/composer.phar (se descarga la primera vez). */
export async function composerCommand(phpExtra) {
  const global = capture(isWin ? 'composer.bat' : 'composer', ['--version'])
  if (!global.error && global.status === 0 && phpExtra.length === 0) return { cmd: isWin ? 'composer.bat' : 'composer', args: [] }

  const phar = path.join(ROOT, 'tools', 'composer.phar')
  if (!existsSync(phar)) {
    log('Composer no está instalado: descargando composer.phar oficial (getcomposer.org)…')
    const res = await fetch('https://getcomposer.org/download/latest-stable/composer.phar')
    if (!res.ok) fail(`No se pudo descargar Composer (HTTP ${res.status}). Instálalo desde https://getcomposer.org`)
    mkdirSync(path.dirname(phar), { recursive: true })
    writeFileSync(phar, Buffer.from(await res.arrayBuffer()))
  }
  return { cmd: 'php', args: [...phpExtra, phar] }
}

/** Lanza un proceso de larga duración con prefijo de color en su salida. */
export function launch(name, paint, cmd, args, opts = {}) {
  const child = spawn(cmd, args, { shell: isWin && cmd.endsWith('.cmd'), ...opts })
  const prefix = paint(`[${name}]`)
  const pipe = (stream, out) =>
    stream.on('data', (chunk) => {
      for (const line of String(chunk).split(/\r?\n/)) if (line.trim()) out.write(`${prefix} ${line}\n`)
    })
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  return child
}

export function ensureBackendReady() {
  if (!existsSync(path.join(BACKEND, 'vendor', 'autoload.php')) || !existsSync(path.join(BACKEND, '.env'))) {
    fail('El backend no está instalado. Ejecuta primero: npm run setup')
  }
  if (!existsSync(path.join(FRONTEND, 'node_modules'))) fail('El frontend no está instalado. Ejecuta primero: npm run setup')
}
