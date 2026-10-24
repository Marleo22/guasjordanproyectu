# Gauss-Jordan paso a paso

Aplicación web educativa para resolver sistemas lineales de 2 × 2 a 5 × 5 con Gauss-Jordan exacto, mostrando cada operación entre filas.

| Carpeta | Contenido | Stack |
| ------- | --------- | ----- |
| [`backend/`](backend/) | API de resolución, validación y PDF | Laravel 13 + PHP 8.4 |
| `frontend/` | Stepper de 4 etapas, captura y visualización | React 19 + Vite (pendiente) |

Contrato de la API: [backend/docs/API-SOLVE.md](backend/docs/API-SOLVE.md).

## Ramas

- `main`: entrega
- `develop`: integración
- `feature/<nombre>-<modulo>`: trabajo de cada integrante

Nadie hace push directo a `main` ni a `develop`; todo entra por PR.
