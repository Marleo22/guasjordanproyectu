# Gauss-Jordan paso a paso · Backend (Laravel API)

API stateless para resolver sistemas lineales mediante Gauss-Jordan con aritmética racional exacta, mostrar operaciones y descargar el procedimiento en PDF.

## Requisitos

- PHP 8.5 (el proyecto declara PHP `^8.3`) y Composer 2.
- La generación de PDF requiere Dompdf.
- No se requiere base de datos para el MVP.

## Instalación

En la raíz de `backend/`, instala Dompdf y dependencias:

```powershell
composer require dompdf/dompdf
composer install
```

Configura el entorno local según el README del equipo (`.env.example`, clave de aplicación y servidor). No compartas el archivo `.env` en Git.

## Endpoints

| Método | Ruta | Responsable | Función |
|---|---|---|---|
| GET | `/api/health` | Diego | Estado del servicio y límites de dimensiones |
| POST | `/api/gauss-jordan/solve` | Diego / contrato coordinado | Resolver sistemas cuadrados o rectangulares |
| POST | `/api/gauss-jordan/steps.pdf` | Jacob | Descargar los pasos del procedimiento |
| GET | `/api/gauss-jordan/examples` | Jacob | Ejemplos JSON de las tres clasificaciones |

Contrato completo: [docs/API-SOLVE.md](docs/API-SOLVE.md).

## Dimensiones admitidas

`rows` (ecuaciones) y `columns` (incógnitas) pueden ser valores independientes entre 2 y 5. La matriz aumentada debe tener `rows` filas y `columns + 1` columnas. El contrato legado `size` sigue funcionando para sistemas cuadrados.

## Pruebas

```powershell
php artisan test --compact
```

Antes de integrar, ejecutar Pint sobre los archivos modificados:

```powershell
vendor/bin/pint --dirty --format agent
```

El entorno local debe tener las extensiones PHP que requieren las dependencias y Dompdf instalado para ejecutar las pruebas del PDF.
