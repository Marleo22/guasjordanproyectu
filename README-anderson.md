# Parte de Anderson · integración frontend ↔ backend

Contiene: cliente de la API (`src/lib/api.js`), mock, estado único (`src/state/`), y las pantallas
**Datos** y **Resultado** conectadas (carga, error, vacío, reintento, descarga de PDF).
**No** contiene el algoritmo Gauss-Jordan: eso es del backend (Diego).

## Copiar al repo `frontend/`
Copia `src/` y `tools/` dentro del repo. Si Yorman ya tiene `src/lib/routes.js`, usa el suyo.

## Variables de entorno (`.env.local`, basado en `.env.example`)
| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL base de Laravel, sin barra final. Ej. `http://localhost:8000/api` |
| `VITE_USE_MOCK` | `true` usa el mock; `false` llama a la API real |
| `VITE_MOCK_DELAY_MS` | Latencia simulada del mock (ver el estado de carga) |

Vite solo expone variables que empiezan con `VITE_`. Si cambias `.env.local`, reinicia `npm run dev`.

## Comandos
```bash
npm run dev            # frontend en http://localhost:5173
node --test            # pruebas de estado y API (sin instalar nada extra)
python tools/generate-mock-fixtures.py   # regenera ejemplos del mock
npx shadcn@latest add button alert input # componentes que usan las pantallas
```
Para probar con el backend real: `php artisan serve` (puerto 8000), `VITE_USE_MOCK=false`, reiniciar Vite.

## Montaje obligatorio
```jsx
// src/app/providers.jsx  — el Provider va POR ENCIMA de las rutas
<SolverProvider><RouterProvider router={router} /></SolverProvider>
```
Si queda dentro de una página, el estado se pierde al cambiar de etapa.

## QA de errores sin backend (consola del navegador, modo dev)
`__mockFail('server')` · `__mockFail('network')` · `__mockFail(null)`

## Pendientes de acuerdo con el equipo (confirmar antes de integrar)
1. **Forma de `steps`**: el plan no la define. El mock usa
   `{index, type: swap|scale|eliminate, operation, modified_rows (base 1), before, after}`. Daniel y Diego deben confirmarla.
2. **`ResultContent.jsx`** (Daniel): recibe `result` completo. Anderson ya lo importa en `ResultPage`.
3. **Errores 500**: el campo del identificador de registro no está definido; se lee `error_id`, `request_id` o el header `X-Request-Id`.
4. **422**: el contrato dice `fields`; Laravel por defecto manda `errors`. El cliente acepta ambos.
5. **Índices**: `fields` usa base 0 (`matrix.1.1` = ecuación 2, variable b); `contradiction.row`, `verification.equation` y `modified_rows` usan base 1.
6. **CORS** (Diego/Jacob): permitir `http://localhost:5173` en `config/cors.php`; si quieren que el nombre del PDF venga del servidor, exponer `Content-Disposition` en `exposed_headers`.
7. **`/examples`**: forma de respuesta sin definir; `fetchExamples` devuelve el JSON tal cual y la UI usa ejemplos locales.
