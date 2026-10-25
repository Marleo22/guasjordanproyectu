(function () {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const rowReplace = (target, source, factor, label, before, after, changedRows, explanation, calculation) => ({
    index: 0,
    operation: { type: "row_replace", target, source, factor },
    label,
    before,
    after,
    changed_rows: changedRows,
    explanation,
    calculation
  });

  const uniqueInitial = [
    ["1", "1", "1", "6"],
    ["2", "3", "1", "11"],
    ["1", "2", "3", "14"]
  ];
  const uniqueStates = [
    uniqueInitial,
    [["1", "1", "1", "6"], ["0", "1", "-1", "-1"], ["1", "2", "3", "14"]],
    [["1", "1", "1", "6"], ["0", "1", "-1", "-1"], ["0", "1", "2", "8"]],
    [["1", "0", "2", "7"], ["0", "1", "-1", "-1"], ["0", "1", "2", "8"]],
    [["1", "0", "2", "7"], ["0", "1", "-1", "-1"], ["0", "0", "3", "9"]],
    [["1", "0", "2", "7"], ["0", "1", "-1", "-1"], ["0", "0", "1", "3"]],
    [["1", "0", "0", "1"], ["0", "1", "-1", "-1"], ["0", "0", "1", "3"]],
    [["1", "0", "0", "1"], ["0", "1", "0", "2"], ["0", "0", "1", "3"]]
  ];
  const uniqueOperations = [
    [2, 1, "-2", "F₂ ← F₂ − 2F₁", "Restamos 2 veces la fila 1 a la fila 2 para crear un cero debajo del primer pivote.", "F₂ = [2  3  1 | 11] − 2[1  1  1 | 6] = [0  1  −1 | −1]"],
    [3, 1, "-1", "F₃ ← F₃ − F₁", "Restamos la fila 1 a la fila 3 para crear un cero debajo del primer pivote.", "F₃ = [1  2  3 | 14] − [1  1  1 | 6] = [0  1  2 | 8]"],
    [1, 2, "-1", "F₁ ← F₁ − F₂", "Restamos la fila 2 a la fila 1 para crear un cero arriba del pivote de la columna b.", "F₁ = [1  1  1 | 6] − [0  1  −1 | −1] = [1  0  2 | 7]"],
    [3, 2, "-1", "F₃ ← F₃ − F₂", "Restamos la fila 2 a la fila 3 para crear un cero debajo del pivote de la columna b.", "F₃ = [0  1  2 | 8] − [0  1  −1 | −1] = [0  0  3 | 9]"],
    [3, 3, "1/3", "F₃ ← (1/3)F₃", "Dividimos la fila 3 entre 3 para convertir el pivote de la columna c en 1.", "F₃ = (1/3)[0  0  3 | 9] = [0  0  1 | 3]"],
    [1, 3, "-2", "F₁ ← F₁ − 2F₃", "Restamos 2 veces la fila 3 a la fila 1 para eliminar el valor sobre el pivote de c.", "F₁ = [1  0  2 | 7] − 2[0  0  1 | 3] = [1  0  0 | 1]"],
    [2, 3, "1", "F₂ ← F₂ + F₃", "Sumamos la fila 3 a la fila 2 para eliminar el valor sobre el pivote de c.", "F₂ = [0  1  −1 | −1] + [0  0  1 | 3] = [0  1  0 | 2]"]
  ];
  const uniqueSteps = uniqueOperations.map((item, index) => {
    const [target, source, factor, label, explanation, calculation] = item;
    return { ...rowReplace(target, source, factor, label, uniqueStates[index], uniqueStates[index + 1], [target], explanation, calculation), index: index + 1 };
  });

  const infiniteInitial = [["1", "1", "1", "2"], ["2", "2", "2", "4"], ["1", "-1", "1", "0"]];
  const infiniteStates = [
    infiniteInitial,
    [["1", "1", "1", "2"], ["0", "0", "0", "0"], ["1", "-1", "1", "0"]],
    [["1", "1", "1", "2"], ["0", "0", "0", "0"], ["0", "-2", "0", "-2"]],
    [["1", "1", "1", "2"], ["0", "0", "0", "0"], ["0", "1", "0", "1"]],
    [["1", "0", "1", "1"], ["0", "0", "0", "0"], ["0", "1", "0", "1"]]
  ];
  const infiniteSteps = [
    rowReplace(2, 1, "-2", "F₂ ← F₂ − 2F₁", infiniteStates[0], infiniteStates[1], [2], "La segunda fila se convierte en una fila nula.", "F₂ = [2  2  2 | 4] − 2[1  1  1 | 2] = [0  0  0 | 0]"),
    rowReplace(3, 1, "-1", "F₃ ← F₃ − F₁", infiniteStates[1], infiniteStates[2], [3], "Eliminamos el primer coeficiente de la tercera fila.", "F₃ = [1  −1  1 | 0] − [1  1  1 | 2] = [0  −2  0 | −2]"),
    rowReplace(3, 3, "-1/2", "F₃ ← (−1/2)F₃", infiniteStates[2], infiniteStates[3], [3], "Normalizamos el pivote de la columna b.", "F₃ = (−1/2)[0  −2  0 | −2] = [0  1  0 | 1]"),
    rowReplace(1, 3, "-1", "F₁ ← F₁ − F₃", infiniteStates[3], infiniteStates[4], [1], "Eliminamos el valor sobre el pivote de la columna b.", "F₁ = [1  1  1 | 2] − [0  1  0 | 1] = [1  0  1 | 1]")
  ].map((step, index) => ({ ...step, index: index + 1 }));

  const inconsistentInitial = [["1", "1", "0", "3"], ["2", "2", "0", "6"], ["1", "1", "0", "4"]];
  const inconsistentStates = [
    inconsistentInitial,
    [["1", "1", "0", "3"], ["0", "0", "0", "0"], ["1", "1", "0", "4"]],
    [["1", "1", "0", "3"], ["0", "0", "0", "0"], ["0", "0", "0", "1"]],
    [["1", "1", "0", "3"], ["0", "0", "0", "1"], ["0", "0", "0", "0"]]
  ];
  const inconsistentSteps = [
    rowReplace(2, 1, "-2", "F₂ ← F₂ − 2F₁", inconsistentStates[0], inconsistentStates[1], [2], "La segunda fila se convierte en una fila nula.", "F₂ = [2  2  0 | 6] − 2[1  1  0 | 3] = [0  0  0 | 0]"),
    rowReplace(3, 1, "-1", "F₃ ← F₃ − F₁", inconsistentStates[1], inconsistentStates[2], [3], "La tercera fila revela la contradicción 0 = 1.", "F₃ = [1  1  0 | 4] − [1  1  0 | 3] = [0  0  0 | 1]"),
    { index: 3, operation: { type: "row_swap", target: 2, source: 3 }, label: "F₂ ↔ F₃", before: inconsistentStates[2], after: inconsistentStates[3], changed_rows: [2, 3], explanation: "Subimos la fila de contradicción para dejar clara la inconsistencia.", calculation: "F₂ ↔ F₃" }
  ];

  const fractionsInitial = [["1/2", "1", "1"], ["1", "-1", "0"]];
  const fractionsStates = [
    fractionsInitial,
    [["1", "2", "2"], ["1", "-1", "0"]],
    [["1", "2", "2"], ["0", "-3", "-2"]],
    [["1", "2", "2"], ["0", "1", "2/3"]],
    [["1", "0", "2/3"], ["0", "1", "2/3"]]
  ];
  const fractionsSteps = [
    rowReplace(1, 1, "2", "F₁ ← 2F₁", fractionsStates[0], fractionsStates[1], [1], "Eliminamos el denominador del primer coeficiente.", "F₁ = 2[1/2  1 | 1] = [1  2 | 2]"),
    rowReplace(2, 1, "-1", "F₂ ← F₂ − F₁", fractionsStates[1], fractionsStates[2], [2], "Eliminamos el primer coeficiente de la segunda fila.", "F₂ = [1  −1 | 0] − [1  2 | 2] = [0  −3 | −2]"),
    rowReplace(2, 2, "-1/3", "F₂ ← (−1/3)F₂", fractionsStates[2], fractionsStates[3], [2], "Normalizamos el pivote de la columna b.", "F₂ = (−1/3)[0  −3 | −2] = [0  1 | 2/3]"),
    rowReplace(1, 2, "-2", "F₁ ← F₁ − 2F₂", fractionsStates[3], fractionsStates[4], [1], "Eliminamos el valor sobre el pivote de la columna b.", "F₁ = [1  2 | 2] − 2[0  1 | 2/3] = [1  0 | 2/3]")
  ].map((step, index) => ({ ...step, index: index + 1 }));

  const fixtures = {
    unique: {
      size: 3, classification: "unique", initial_matrix: uniqueInitial, steps: uniqueSteps,
      rref: uniqueStates[7], solution: { a: "1", b: "2", c: "3" }, free_variables: [], parameters: {}, contradiction: null,
      verification: [{ equation: 1, left: "6", right: "6", ok: true }, { equation: 2, left: "11", right: "11", ok: true }, { equation: 3, left: "14", right: "14", ok: true }]
    },
    infinite: {
      size: 3, classification: "infinite", initial_matrix: infiniteInitial, steps: infiniteSteps,
      rref: infiniteStates[4], solution: null, free_variables: ["c"], parameters: { a: "1 - t", b: "1", c: "t" }, contradiction: null, verification: []
    },
    inconsistent: {
      size: 3, classification: "inconsistent", initial_matrix: inconsistentInitial, steps: inconsistentSteps,
      rref: inconsistentStates[3], solution: null, free_variables: [], parameters: {}, contradiction: { row: 2, left: "0", right: "1", equation: "0a + 0b + 0c = 1" }, verification: []
    },
    fractions: {
      size: 2, classification: "unique", initial_matrix: fractionsInitial, steps: fractionsSteps,
      rref: fractionsStates[4], solution: { a: "2/3", b: "2/3" }, free_variables: [], parameters: {}, contradiction: null,
      verification: [{ equation: 1, left: "1", right: "1", ok: true }, { equation: 2, left: "0", right: "0", ok: true }]
    }
  };

  window.GJFixtures = fixtures;
  window.GJStorageKey = "gauss-jordan:solver-response";
  window.GJFixtureNameKey = "gauss-jordan:fixture-name";
})();
