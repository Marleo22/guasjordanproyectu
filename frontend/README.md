# Gauss-Jordan · Frontend (React + Vite)

Interfaz de 4 etapas con stepper: **Tamaño → Datos → Procedimiento → Resultado**. No contiene el algoritmo: consume la API de Laravel y presenta su respuesta tal cual.

## Comandos

Desde la raíz del repositorio lo normal es `npm run dev` (levanta API + Vite). Dentro de `frontend/`:

```bash
npm run dev          # Vite en http://localhost:5173, /api se redirige a Laravel (:8000)
npm run build        # compila en ../backend/public/spa (Laravel la sirve)
npm test             # pruebas de estado y API (node --test, sin dependencias extra)
npm run fixtures     # regenera src/lib/mock-fixtures.js desde la API real
npm run build:mock   # compila en modo sin servidor (VITE_USE_MOCK=true)
```

## Variables de entorno (`.env.local`, ver `.env.example`)

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | Base de la API. Vacía = `/api` en el mismo origen (recomendado). |
| `BACKEND_URL` | Adónde redirige el proxy de Vite durante `npm run dev`. Por defecto `http://127.0.0.1:8000`. |
| `VITE_USE_MOCK` | `true` usa respuestas guardadas; `false` llama a la API real. |
| `VITE_MOCK_DELAY_MS` | Latencia simulada del modo sin servidor. |

## Estructura

```
src/
├─ app/                 providers.jsx (SolverProvider por encima del router) · router.jsx
├─ components/layout/   AppLayout · AppHeader · Stepper                        (Yorman)
├─ components/ui/       Button · Input · Alert · Badge · Card                  (Yorman)
├─ components/matrix/   MatrixView · FractionText                              (Daniel)
├─ features/system-size/   SizePage · SizeCard  (cuadrado o rectangular)       (Yorman)
├─ features/system-input/  DataPage · EquationGrid · AugmentedMatrixPreview    (Anderson)
├─ features/procedure/     ProcedurePage · OperationList · MatrixComparison    (Daniel)
├─ features/result/        ResultPage · PdfDownloadButton (Anderson) · ResultContent (Daniel)
├─ state/                  solver.reducer.js · solver-context.jsx              (Anderson)
├─ lib/                    api.js · mock-api.js · contract.js · formatters.js · routes.js
└─ styles/app.css          tokens y componentes visuales del prototipo
```

## Reglas

- La UI nunca llama a `fetch` directamente: todo pasa por `src/lib/api.js`.
- El estado del solver tiene una sola fuente (`solver.reducer.js`); el Provider envuelve todas las rutas.
- El resultado se presenta según `classification`; no se deduce mirando ceros ni se recalculan matrices.
- Los valores racionales se mantienen como texto exacto (`"2/3"`) hasta la presentación.

## QA sin backend

Con `VITE_USE_MOCK=true`, en la consola del navegador: `__mockFail('server')`, `__mockFail('network')`, `__mockFail(null)`.
