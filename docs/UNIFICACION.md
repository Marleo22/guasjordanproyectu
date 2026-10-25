# Unificación de ramas

Rama `unificado`, creada a partir de `main` y fusionando `origin/develop` y `origin/feature/yorman-ui`.

## Qué tenía cada rama

| Origen | Aporte | Problema encontrado |
| ------ | ------ | ------------------- |
| `develop` | Proyecto Laravel completo, `GaussJordanService`, `RationalNumber`, `MatrixOperation`, pruebas | Solo sistemas cuadrados |
| `main` | Matrices rectangulares, `/steps.pdf`, `/examples`, plantillas PDF | El commit `710853c` borró por error el esqueleto de Laravel (`composer.json`, `artisan`, `config/`, `RationalNumber.php`…), así que `main` no arrancaba |
| `feature/yorman-ui` | Proyecto React + Vite + Tailwind, header, stepper, tarjetas de tamaño | Solo pantalla Tamaño; botón Continuar sin conexión |
| `gauss-jordan-anderson.zip` (subido en `02952c9` y borrado después) | Cliente API, mock, estado único, pantallas Datos y Resultado, pruebas | Importaba componentes shadcn en minúsculas que no existían; dependía de `ResultContent.jsx` (pendiente de Daniel) |

## Cómo se combinó

1. Backend = esqueleto de `develop` + todos los archivos modificados en `main` (rectangulares, PDF, ejemplos).
2. `composer.json`: se añadió `dompdf/dompdf` (lo pedía `docs/historial/INTEGRATION-rectangular.md`) y `config.platform.php = 8.3.0`, porque el lock se había generado con Symfony 8 (PHP 8.4+). Así instala en PHP 8.3, 8.4 y 8.5.
3. Frontend = proyecto de Yorman + archivos de Anderson, adaptados al contrato rectangular (`rows`/`columns`).
4. Se implementó lo que faltaba: router de las 4 etapas, pantalla **Procedimiento** y **ResultContent** (parte de Daniel), componentes de matriz y fracciones, selector rectangular.
5. Laravel sirve la web compilada (`backend/public/spa`) en todas las rutas que no son `/api`, para usar la app con un solo servidor.

## Correcciones en el backend

- `SolveSystemRequest::messages()` producía un **error 500** con matrices rectangulares (`Undefined array key 5`) porque generaba mensajes para columnas inexistentes. Rompía 14 pruebas.
- Los mensajes por celda ("Falta el coeficiente de a en la ecuación 1") quedaban tapados por el genérico `matrix.*.*.required`.
- Redacción: "El valor de el coeficiente…" → "El coeficiente de b en la ecuación 2 debe ser…".

## Estado de pruebas

- Backend: 60 pruebas PHPUnit en verde (incluye generación real del PDF con Dompdf).
- Frontend: 27 pruebas `node --test` (estado, cliente API, modo sin servidor) en verde.
- Recorrido manual: 3×3 solución única, 2×3 infinitas soluciones (rectangular), escritorio y móvil.

## Feedback de QA: sistemas rectangulares

Reporte: "al elegir 3x2 o 5x3 parece que calcula una matriz cuadrada". El cálculo ya respetaba filas ≠ columnas
(se agregó `RectangularDimensionsTest` para fijarlo), pero la pantalla se prestaba a confusión: la matriz
aumentada [A|b] agrega una columna, así que un 3×2 se ve como un cuadro de 3×3, y la solución da un valor por
incógnita (columna), no por fila. Cambios:

- La API devuelve `rank` y `augmented_rank`.
- Datos, Procedimiento y Resultado muestran ecuaciones (filas), incógnitas (columnas), A, [A|b] y rangos.
- Las matrices tienen encabezados `a b c | =` y etiquetas F1, F2…
- Texto que explica sistemas sobredeterminados y subdeterminados; vista previa de la forma en Tamaño.
- Ejemplos rectangulares nuevos: 2×4, 3×4, 3×5, 4×2, 4×3, 5×2 y 5×3.
