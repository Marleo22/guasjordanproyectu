# Contrato de la API de Gauss-Jordan

La API resuelve sistemas con **2 a 5 ecuaciones** y **2 a 5 incógnitas**, con dimensiones independientes. La matriz recibida es siempre la matriz aumentada: `rows` filas y `columns + 1` valores por fila.

## `GET /api/health`

Devuelve el estado del servicio, los límites heredados de tamaño y los límites independientes de filas y columnas.

## `POST /api/gauss-jordan/solve`

### Contrato legado para sistemas cuadrados

Se conserva para no romper a los consumidores existentes:

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

`size` representa filas e incógnitas; la matriz aumentada debe tener `size` filas y `size + 1` columnas.

### Nuevo contrato para sistemas cuadrados o rectangulares

```json
{
  "rows": 2,
  "columns": 3,
  "matrix": [
    ["1", "1", "1", "6"],
    ["2", "3", "1", "11"]
  ]
}
```

- `rows`: número de ecuaciones, entero entre 2 y 5.
- `columns`: número de incógnitas, entero entre 2 y 5.
- `matrix`: matriz aumentada con `rows` filas y `columns + 1` columnas.
- Los valores pueden ser enteros, decimales o fracciones exactas (`"-3"`, `"0.5"`, `"1/3"`). Booleanos, arreglos, valores vacíos y fracciones con denominador cero se rechazan.
- Si se envían `size`, `rows` y `columns` juntos, los tres deben coincidir; `size` no puede describir una matriz rectangular.

### Respuesta

La respuesta es un objeto JSON plano, sin envoltura `data`. Incluye siempre:

| Campo | Descripción |
|---|---|
| `size` | Tamaño heredado para sistemas cuadrados; `null` en sistemas rectangulares. |
| `rows`, `columns` | Dimensiones de ecuaciones e incógnitas. |
| `variables` | Incógnitas (`a`, `b`, `c`, `d`, `e`). |
| `rank`, `augmented_rank` | Rango de A (número de pivotes) y rango de la matriz aumentada [A|b]. |
| `classification` | `unique`, `infinite` o `inconsistent`. |
| `solution` | Objeto de valores exactos si la solución es única; si no, `null`. |
| `free_variables` | Variables libres en soluciones infinitas; si no, `[]`. |
| `parameters` | Parametrización en sistemas con infinitas soluciones; si no, `{}`. |
| `contradiction` | Fila contradictoria en sistemas sin solución; si no, `null`. |
| `verification` | Sustitución en todas las ecuaciones originales para solución única. |
| `initial_matrix`, `steps`, `rref` | Matriz inicial, operaciones registradas y forma escalonada reducida. |

La clasificación usa los rangos: solución única cuando `rank(A) = rank([A|b]) = columns`; infinitas soluciones cuando los rangos coinciden y son menores que `columns`; sin solución cuando los rangos difieren.

Cada operación incluye `index`, `type`, `notation`, `description`, `target_row`, `source_row`, `factor`, `pivot`, `modified_rows`, `calculation`, `before` y `after`. Los índices de filas y columnas en las operaciones comienzan en 1.

### Errores

- `422`: entrada inválida, dimensiones fuera de 2–5, tamaño heredado conflictivo, matriz con forma incorrecta o valores no racionales. Respuesta: `{"error":"invalid_matrix","message":"...","fields":{...}}`. No se llama al servicio matemático.
- `500`: error inesperado con mensaje genérico e identificador de registro.

## `GET /api/gauss-jordan/examples`

Devuelve ejemplos JSON rectangulares para solución única, infinitas soluciones y sistema inconsistente. Cada ejemplo incluye `rows`, `columns`, `matrix` y `expected_classification`.

## `POST /api/gauss-jordan/steps.pdf`

Acepta cualquiera de los dos contratos de entrada. Devuelve un PDF descargable generado con una plantilla Blade y Dompdf, usando el mismo `GaussJordanService`; no implementa un segundo algoritmo.
