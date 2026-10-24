# Gauss-Jordan paso a paso · Backend (Laravel API)

API stateless que valida, resuelve con Gauss-Jordan exacto (fracciones) y devuelve cada operación entre filas.

## Requisitos

- PHP 8.4+ y Composer 2
- No requiere base de datos en el MVP

## Instalación

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan serve        # http://127.0.0.1:8000
```

## Endpoints

| Método | Ruta | Responsable | Estado |
| ------ | ---- | ----------- | ------ |
| GET  | `/api/health` | Diego | Listo |
| POST | `/api/gauss-jordan/solve` | Diego | Listo |
| POST | `/api/gauss-jordan/steps.pdf` | Jacob | Pendiente |
| GET  | `/api/gauss-jordan/examples` | Jacob | Pendiente (opcional) |

Contrato completo de `/solve` y `/health`: [docs/API-SOLVE.md](docs/API-SOLVE.md).

Prueba rápida:

```bash
curl -X POST http://127.0.0.1:8000/api/gauss-jordan/solve -H "Content-Type: application/json" -d "{\"size\":3,\"matrix\":[[\"1\",\"1\",\"1\",\"6\"],[\"2\",\"3\",\"1\",\"11\"],[\"1\",\"2\",\"3\",\"14\"]]}"
```

## Pruebas

```bash
php artisan test
```

Incluye MAT-01 … MAT-06. **Regla de regresión:** ningún cambio del solver se integra si rompe esos casos.

## Reglas

- El algoritmo vive solo en `app/Services/GaussJordan/`. Controladores y frontend no calculan.
- La validación vive en `app/Http/Requests/SolveSystemRequest.php` (Jacob).
- Los valores racionales viajan como texto exacto (`"2/3"`).
- Ramas: `main` (entrega), `develop` (integración), `feature/<nombre>-<modulo>`. Todo entra por PR.
