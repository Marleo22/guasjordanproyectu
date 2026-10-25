// npm test — pruebas del backend (PHPUnit) y del frontend (node --test).
import { BACKEND, checkPhp, ensureBackendReady, FRONTEND, log, npmCmd, run } from './lib.mjs'

checkPhp()
ensureBackendReady()
log('Backend · php artisan test')
run('php', ['artisan', 'test'], { cwd: BACKEND })
log('Frontend · node --test')
run(npmCmd, ['test'], { cwd: FRONTEND })
