# Gauss-Jordan paso a paso

Web-app educativa para resolver sistemas de ecuaciones lineales con el método de **Gauss-Jordan exacto** (fracciones, sin redondeos), mostrando cada operación entre filas hasta la forma escalonada reducida.

- Sistemas **cuadrados y rectangulares**: de 2 a 5 ecuaciones y de 2 a 5 incógnitas.
- Acepta enteros, decimales, negativos y fracciones (`1/3`).
- Clasifica el sistema: **solución única**, **infinitas soluciones** (con parametrización) o **sin solución** (con la fila de contradicción).
- Comprueba la solución en las ecuaciones originales y descarga el procedimiento en **PDF**.

| Carpeta | Contenido | Stack |
| ------- | --------- | ----- |
| [`backend/`](backend/) | API de resolución, validación, ejemplos y PDF | Laravel 13 · PHP 8.3+ · Dompdf |
| [`frontend/`](frontend/) | Stepper de 4 etapas: Tamaño → Datos → Procedimiento → Resultado | React 19 · Vite · Tailwind CSS v4 |
| [`scripts/`](scripts/) | Comandos de la raíz (`setup`, `start`, `dev`, `test`) | Node.js |
| [`docs/`](docs/) | Plan del proyecto e historial de integración | — |

## Requisitos

- **PHP 8.3 o superior** con `mbstring`, `openssl`, `dom` y `xml` (vienen activas en la instalación normal).
- **Node.js 20 o superior**.
- Composer es opcional: si no lo tienes, `npm run setup` descarga `composer.phar` oficial en `tools/`.
- No se necesita base de datos.

## Uso rápido

```bash
npm run setup
```

```bash
npm start
```

Abre <http://127.0.0.1:8000>. En Windows también puedes hacer doble clic en **`INICIAR.bat`** (instala la primera vez y abre el navegador).

## Comandos

| Comando | Qué hace |
| ------- | -------- |
| `npm run setup` | Instala backend (Composer) y frontend (npm), crea `backend/.env` y compila la web. |
| `npm start` | Un solo servidor: Laravel sirve la web compilada y la API en `:8000`. `npm start -- --build` recompila antes. |
| `npm run dev` | Desarrollo: API en `:8000` + Vite con recarga en caliente en <http://localhost:5173> (proxy de `/api`). |
| `npm test` | Pruebas del backend (PHPUnit, 60) y del frontend (`node --test`, 27). |
| `npm run build` | Compila la web en `backend/public/spa`. |
| `npm run fixtures` | Regenera las respuestas del modo sin servidor llamando a la API real. |

## Cómo está conectado

```
Navegador ── /, /datos, /procedimiento, /resultado ──▶ Laravel devuelve backend/public/spa/index.html
          └─ /api/* ───────────────────────────────▶ Laravel API (GaussJordanService)
```

- El cálculo vive **solo** en el backend (`GaussJordanService` + `RationalNumber`). El frontend presenta lo que devuelve la API sin recalcular.
- En desarrollo, Vite redirige `/api` a `http://127.0.0.1:8000` (configurable con `BACKEND_URL` en `frontend/.env.local`).
- **Modo sin servidor**: `VITE_USE_MOCK=true` usa respuestas guardadas (solo los ejemplos de «Cargar ejemplo»), útil para presentar sin PHP: `npm --prefix frontend run build:mock`.

## API

| Método | Ruta | Responsable | Función |
| ------ | ---- | ----------- | ------- |
| GET | `/api/health` | Diego | Estado del servicio y límites |
| POST | `/api/gauss-jordan/solve` | Diego | Resuelve y devuelve pasos, forma reducida y clasificación |
| POST | `/api/gauss-jordan/steps.pdf` | Jacob | Descarga el procedimiento en PDF |
| GET | `/api/gauss-jordan/examples` | Jacob | Ejemplos de las tres clasificaciones |

Contrato completo: [backend/docs/API-SOLVE.md](backend/docs/API-SOLVE.md).

## Equipo y módulos

| Integrante | Módulo | Dónde está |
| ---------- | ------ | ---------- |
| Diego | Algoritmo, `/solve`, `/health` | `backend/app/Services/GaussJordan/`, `GaussJordanController` |
| Jacob | Validación, `/steps.pdf`, `/examples` | `SolveSystemRequest`, `GaussJordanSupportController`, `resources/views/pdf/` |
| Yorman | Tokens, header, stepper, tarjetas de tamaño | `frontend/src/components/`, `features/system-size/`, `styles/app.css` |
| Anderson | Cliente API, estado, Datos y Resultado conectados | `frontend/src/lib/api.js`, `state/`, `features/system-input/`, `features/result/ResultPage.jsx` |
| Daniel | Procedimiento y contenido del resultado | `frontend/src/features/procedure/`, `features/result/ResultContent.jsx`, `components/matrix/` |
| Jonathan | Integración del flujo, QA y demo | Casos MAT/VAL/FLOW/PDF del [plan](docs/plan-del-proyecto.html) |

## Ramas

Esta versión unifica `main` (matrices rectangulares + PDF), `develop` (base Laravel y solver) y `feature/yorman-ui` (interfaz), más el paquete de Anderson que estaba en el historial (`gauss-jordan-anderson.zip`). El detalle está en [docs/UNIFICACION.md](docs/UNIFICACION.md).

- `main`: entrega · `develop`: integración · `feature/<nombre>-<modulo>`: trabajo de cada integrante.
- Nadie hace push directo a `main` ni a `develop`; todo entra por PR.
