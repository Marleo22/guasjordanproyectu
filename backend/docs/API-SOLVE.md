# API de resolución — `/solve` y `/health`

Responsable: **Diego Girón** (implementa y explica).
Fuente única de verdad del cálculo: `app/Services/GaussJordan/GaussJordanService.php`.

---

## 1. `GET /api/health`

Confirma que el backend está arriba. Útil para que el frontend muestre "servidor no disponible".

```json
200 OK
{
  "status": "ok",
  "service": "gauss-jordan-api",
  "version": "1.0.0",
  "sizes": { "min": 2, "max": 5 },
  "time": "2026-10-23T21:54:00+00:00"
}
```

---

## 2. `POST /api/gauss-jordan/solve`

### Entrada

```json
{
  "size": 3,
  "matrix": [
    ["1", "1", "1", "6"],
    ["2", "3", "1", "11"],
    ["1", "2", "3", "14"]
  ]
}
```

| Campo    | Regla |
| -------- | ----- |
| `size`   | Entero de 2 a 5. |
| `matrix` | `size` filas × `size + 1` columnas. La última columna es `b`. |
| valores  | Texto (o número JSON): enteros `-3`, decimales `0.5`, fracciones `1/3`. |

### Salida (siempre `200 application/json`, sin envoltura `data`)

Todos los campos existen siempre. `classification` decide qué valores son válidos.

| Campo            | Tipo | Descripción |
| ---------------- | ---- | ----------- |
| `size`           | int | Tamaño del sistema. |
| `variables`      | string[] | Nombres de incógnitas: `["a","b","c"]`. |
| `classification` | `"unique" \| "infinite" \| "inconsistent"` | Discriminador. |
| `solution`       | objeto \| `null` | Solo en `unique`: `{"a":"1","b":"2/3"}`. |
| `free_variables` | string[] | Solo en `infinite`: `["c"]`. Si no, `[]`. |
| `parameters`     | objeto | Solo en `infinite`: `{"a":"1 - t","b":"1","c":"t"}`. Si no, `{}`. |
| `contradiction`  | objeto \| `null` | Solo en `inconsistent`: `{row, left, right, equation}`. |
| `verification`   | arreglo | Solo en `unique`: `[{equation, left, right, ok}]`. Si no, `[]`. |
| `initial_matrix` | string[][] | Matriz aumentada tal como entró (simplificada). |
| `steps`          | Step[] | Operaciones elementales en orden (ver abajo). |
| `rref`           | string[][] | Forma escalonada reducida final. |

**Todos los números viajan como texto racional exacto** (`"2/3"`, `"-1/2"`, `"6"`). El frontend nunca los convierte a decimal para decidir nada.

#### Step (cada paso en `steps`)

```json
{
  "index": 1,
  "type": "eliminate",
  "notation": "F2 → F2 - 2F1",
  "description": "Se resta 2 veces la fila 1 de la fila 2 para hacer 0 la columna 1.",
  "target_row": 2,
  "source_row": 1,
  "factor": "2",
  "pivot": { "row": 1, "column": 1, "value": "1" },
  "modified_rows": [2],
  "calculation": ["2 - 2·1 = 0", "3 - 2·1 = 1", "1 - 2·1 = -1", "11 - 2·6 = -1"],
  "before": [["1","1","1","6"],["2","3","1","11"],["1","2","3","14"]],
  "after":  [["1","1","1","6"],["0","1","-1","-1"],["1","2","3","14"]]
}
```

| `type`      | Notación          | `source_row` | `factor` | `modified_rows` |
| ----------- | ----------------- | ------------ | -------- | --------------- |
| `swap`      | `F1 ↔ F2`         | la otra fila | `null`   | las dos filas |
| `scale`     | `F1 → (1/2)F1`    | `null`       | k        | `[i]` |
| `eliminate` | `F2 → F2 - 2F1`   | fila pivote  | k        | `[i]` |

- Filas y columnas se numeran **desde 1**.
- `calculation` tiene una cadena por columna (o la descripción del intercambio en `swap`).
- Garantía: `steps[0].before == initial_matrix`, `steps[i].before == steps[i-1].after`, y el último `after == rref`. Si no hubo operaciones, `steps` es `[]`.
- `pivot` es `null` solo en los intercambios finales que bajan filas nulas.

### Errores

| Código | Cuándo | Cuerpo |
| ------ | ------ | ------ |
| `422`  | Entrada inválida (vacío, texto, `1/0`, forma incorrecta, tamaño fuera de 2–5). No se llama al solver. | `{"error":"invalid_matrix","message":"...","fields":{"matrix.1.1":["..."]}}` |
| `500`  | Error inesperado. | `{"error":"server_error","message":"Ocurrió un error inesperado. Intenta de nuevo.","log_id":"<uuid>"}` — el `log_id` aparece en `storage/logs/laravel.log`. |

> Los mensajes finales de `422` por campo son responsabilidad de **Jacob** (`SolveSystemRequest`).

---

## 3. Cómo funciona el algoritmo (guion para la defensa)

1. **Entrada exacta.** Cada valor se convierte a `RationalNumber` (numerador/denominador con enteros de precisión arbitraria). `0.5` → `1/2`. Nunca se usan flotantes, así que `1/3 + 1/3 + 1/3 = 1` exacto.
2. **Por cada columna de coeficientes**, de izquierda a derecha:
   1. Se busca el primer valor ≠ 0 desde la fila del pivote hacia abajo. Si no hay, esa columna es una **variable libre**.
   2. Si ese valor no está en la fila del pivote → **intercambio** (`swap`).
   3. Si el pivote no es 1 → se **multiplica** la fila por su recíproco (`scale`).
   4. Se hacen 0 los demás valores de la columna, arriba y abajo (`eliminate`): `Fi → Fi − k·Fp`.
3. **Reordenamiento final.** Las filas sin pivote se ordenan: primero las contradicciones `0 = k`, al último las filas `0 = 0`.
4. **Clasificación** (con *r* = número de pivotes = rango):
   - Hay una fila `0 = k` con k ≠ 0 → **`inconsistent`** (rango(A) < rango([A|b])).
   - *r* = n → **`unique`**; la solución es la última columna. Se **comprueba** sustituyendo en las ecuaciones originales.
   - *r* < n → **`infinite`**; las columnas sin pivote son libres y reciben parámetros `t, s, r…`. Cada variable pivote se despeja: `x = b' − Σ (coef · parámetro)`.

### Archivos

| Archivo | Rol |
| ------- | --- |
| `app/Services/GaussJordan/RationalNumber.php` | Aritmética racional exacta. |
| `app/Services/GaussJordan/MatrixOperation.php` | Registro de cada paso (Antes/Después/cálculo). |
| `app/Services/GaussJordan/SystemClassification.php` | Enum `unique / infinite / inconsistent`. |
| `app/Services/GaussJordan/GaussJordanService.php` | Algoritmo, clasificación, comprobación. |
| `app/Http/Controllers/Api/GaussJordanController.php` | Controlador delgado de `/solve` y `/health`. |
| `app/Http/Resources/SolveSystemResource.php` | Forma del sobre JSON. |
| `routes/api.php` | Rutas. |
| `tests/Unit/GaussJordan/*` | MAT-01…MAT-06, 5×5, variables libres, cadena de pasos. |
| `tests/Feature/Api/SolveEndpointTest.php` | Contrato HTTP, 422, `/health`. |

### Para Jacob (`/steps.pdf`)

Reutiliza el mismo servicio, sin segunda implementación:

```php
$result = app(GaussJordanService::class)->solve($request->size(), $request->matrix());
// $result['steps'], $result['rref'], $result['classification'], ...
```
