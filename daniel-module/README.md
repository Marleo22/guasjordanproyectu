# Módulo de Daniel · Procedimiento y Resultado

Este módulo es una versión local del frontend de Gauss-Jordan. Presenta los pasos que recibe del solver y no vuelve a calcular la eliminación.

## Abrir las pantallas

- Abre `procedimiento.html` para navegar por las operaciones.
- Abre `resultado.html` para revisar la clasificación y la solución.
- Usa el selector `Ejemplo local` para probar `unique`, `infinite`, `inconsistent` y `fractions`.
- También puedes abrir un fixture directamente: `procedimiento.html?fixture=infinite`.

Para que la navegación entre páginas conserve el mismo ejemplo, el módulo guarda la respuesta en `localStorage` con la clave `gauss-jordan:solver-response`.

## Ejecutar las pruebas

Desde esta carpeta:

```bash
node --test tests/fixtures.test.mjs
```

Las pruebas verifican dimensiones de matrices aumentadas, las tres clasificaciones, la forma de cada paso y la conservación de fracciones exactas.

## Integración posterior

Cuando el backend esté disponible, Anderson puede reemplazar el fixture guardado por la respuesta de `/api/gauss-jordan/solve`. Los componentes deben conservar `classification`, `steps`, `rref`, `solution`, `free_variables`, `parameters`, `contradiction` y `verification`.
