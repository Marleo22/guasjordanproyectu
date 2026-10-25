# Integración del módulo rectangular Gauss-Jordan

Este ZIP contiene un **parche de archivos fuente**, no una copia completa del repositorio. Está diseñado para integrarse en el backend existente sin sobrescribir `AGENTS.md`, `composer.json`, `composer.lock`, `.env`, ni la configuración de Laravel Boost del equipo.

## Antes de copiar

1. Haz una copia de seguridad o crea una rama Git para esta tarea.
2. Confirma que estás en la raíz del repositorio que contiene la carpeta `backend/`.
3. Extrae el ZIP en la carpeta padre del backend (por ejemplo, `C:\algebra lineal`) y permite combinar la carpeta `backend` y sobrescribir solo los archivos enumerados en el ZIP.
4. Revisa `git status --short` y `git diff` antes de aceptar cambios.

## Dependencia del PDF

Desde `C:\algebra lineal\backend`, ejecuta:

```powershell
composer require dompdf/dompdf
```

Este comando actualiza `composer.json` y `composer.lock` en tu copia local y deja la versión resuelta por Composer. No copies un `composer.lock` de otra máquina.

## Contrato compatible

- Solicitudes antiguas cuadradas con `size` siguen siendo válidas.
- Solicitudes nuevas usan `rows` y `columns`, ambos entre 2 y 5.
- Si se proporcionan `size`, `rows` y `columns` simultáneamente, deben ser iguales.
- La matriz enviada es aumentada: `rows` filas por `columns + 1` valores.
- Respuestas incluyen `rows` y `columns`; `size` conserva el entero en sistemas cuadrados y es `null` en sistemas rectangulares.

## Verificación local

Después de instalar Dompdf, ejecuta:

```powershell
vendor/bin/pint --dirty --format agent
php artisan test --compact tests/Unit/GaussJordan/GaussJordanServiceTest.php
php artisan test --compact tests/Unit/GaussJordan/RectangularGaussJordanServiceTest.php
php artisan test --compact tests/Feature/Api/SolveEndpointTest.php
php artisan test --compact tests/Feature/Api/GaussJordanSupportEndpointTest.php
```

Si falla una prueba, no subas el cambio todavía; conserva el mensaje completo para diagnosticarlo.

## Nota sobre pruebas en este paquete

Los archivos PHP se revisaron con `php -l`. También se ejecutó una comprobación aislada del algoritmo con una implementación de prueba de enteros pequeños para verificar los tres tipos de solución, los casos cuadrados existentes y las 16 parejas de dimensiones. El entorno donde se preparó el ZIP no contiene las dependencias reales del proyecto, así que **no se ejecutó PHPUnit ni se confirmó la generación real de PDF con Dompdf**. Esas comprobaciones deben realizarse en el backend local.
