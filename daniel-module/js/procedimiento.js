(function () {
  const fixtures = window.GJFixtures;
  const storageKey = window.GJStorageKey;
  const params = new URLSearchParams(window.location.search);
  let fixtureName = params.get("fixture") || localStorage.getItem(window.GJFixtureNameKey) || "unique";
  let response = readResponse() || fixtures[fixtureName] || fixtures.unique;
  let currentStep = response.steps.length ? 1 : 0;
  let showAll = true;

  const $ = (id) => document.getElementById(id);
  const fixtureSelect = $("fixture-select");
  const operationList = $("operation-list");
  const beforeMatrix = $("before-matrix");
  const afterMatrix = $("after-matrix");
  const allMatrices = $("all-matrices");

  function readResponse() {
    try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
  }

  function persistResponse() {
    localStorage.setItem(storageKey, JSON.stringify(response));
    localStorage.setItem(window.GJFixtureNameKey, fixtureName);
  }

  function currentStepData() {
    if (currentStep === 0) return null;
    return response.steps[currentStep - 1];
  }

  function renderOperationList() {
    const initial = `<button class="operation-item ${currentStep === 0 ? "active" : "done"}" type="button" data-step="0" aria-current="${currentStep === 0 ? "step" : "false"}"><span class="operation-dot">${currentStep === 0 ? "0" : "✓"}</span><span class="operation-name"><small>Inicio</small>Matriz inicial</span></button>`;
    const items = response.steps.map((step, index) => {
      const stepNumber = index + 1;
      const stateClass = currentStep === stepNumber ? "active" : currentStep > stepNumber ? "done" : "";
      const dot = currentStep > stepNumber ? "✓" : stepNumber;
      return `<button class="operation-item ${stateClass}" type="button" data-step="${stepNumber}" aria-current="${currentStep === stepNumber ? "step" : "false"}"><span class="operation-dot">${dot}</span><span class="operation-name"><small>Paso ${stepNumber}</small>${window.GJMatrix.escapeHtml(step.label)}</span></button>`;
    }).join("");
    operationList.innerHTML = initial + items;
    operationList.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => {
      currentStep = Number(button.dataset.step);
      render();
    }));
  }

  function renderCurrent() {
    const step = currentStepData();
    $("procedure-subtitle").textContent = `Sistema ${response.size} × ${response.size} · ${response.steps.length} operaciones elementales hasta la forma escalonada reducida`;
    $("operation-total").textContent = `${response.steps.length} ${response.steps.length === 1 ? "paso" : "pasos"}`;
    $("step-count").textContent = currentStep === 0 ? "Inicio" : `Paso ${currentStep} de ${response.steps.length}`;
    $("previous-button").disabled = currentStep === 0;
    $("next-button").disabled = currentStep >= response.steps.length;

    if (!step) {
      $("procedure-kicker").textContent = "Inicio · Matriz inicial";
      $("operation-title").textContent = "Matriz inicial";
      $("operation-explanation").textContent = "Esta es la matriz aumentada que recibimos antes de aplicar operaciones entre filas.";
      $("operation-calculation").textContent = "";
      beforeMatrix.innerHTML = window.GJMatrix.renderMatrix(response.initial_matrix, { size: response.size });
      afterMatrix.innerHTML = window.GJMatrix.renderMatrix(response.initial_matrix, { size: response.size });
      return;
    }

    $("procedure-kicker").textContent = `Paso ${currentStep} · Operación entre filas`;
    $("operation-title").textContent = step.label;
    $("operation-explanation").textContent = step.explanation || "Aplicamos la operación indicada y conservamos el resultado exacto.";
    $("operation-calculation").textContent = step.calculation || step.label;
    beforeMatrix.innerHTML = window.GJMatrix.renderMatrix(step.before, { size: response.size });
    afterMatrix.innerHTML = window.GJMatrix.renderMatrix(step.after, {
      size: response.size,
      changedRows: step.changed_rows,
      changedCells: window.GJMatrix.diffCells(step.before, step.after)
    });
  }

  function nullRows(matrix) {
    return (matrix || []).reduce((rows, row, index) => {
      if (row.slice(0, response.size).every((value) => String(value) === "0") && String(row[response.size]) === "0") rows.push(index + 1);
      return rows;
    }, []);
  }

  function renderAllMatrices() {
    const cards = [{ title: "Matriz inicial", matrix: response.initial_matrix, caption: "Inicio", step: 0 }];
    response.steps.forEach((step) => cards.push({ title: step.label, matrix: step.after, caption: `Paso ${step.index}`, step: step.index, changedRows: step.changed_rows, changedCells: window.GJMatrix.diffCells(step.before, step.after) }));
    const visible = showAll ? cards : cards.filter((card) => card.step === currentStep);
    allMatrices.innerHTML = visible.map((card) => window.GJMatrix.renderMatrixCard(card.title, card.matrix, {
      size: response.size,
      current: card.step === currentStep,
      caption: card.caption,
      changedRows: card.changedRows,
      changedCells: card.changedCells,
      contradictionRow: response.classification === "inconsistent" && response.contradiction ? response.contradiction.row : undefined,
      nullRows: nullRows(card.matrix)
    })).join("");
  }

  function render() {
    renderOperationList();
    renderCurrent();
    renderAllMatrices();
  }

  fixtureSelect.value = fixtureName in fixtures ? fixtureName : "unique";
  fixtureSelect.addEventListener("change", () => {
    fixtureName = fixtureSelect.value;
    response = fixtures[fixtureName];
    currentStep = response.steps.length ? 1 : 0;
    persistResponse();
    render();
  });
  $("previous-button").addEventListener("click", () => { if (currentStep > 0) { currentStep -= 1; render(); } });
  $("next-button").addEventListener("click", () => { if (currentStep < response.steps.length) { currentStep += 1; render(); } });
  $("toggle-all-button").addEventListener("click", () => {
    showAll = !showAll;
    $("toggle-all-button").textContent = showAll ? "Ver solo el paso actual" : "Ver todas las matrices";
    renderAllMatrices();
  });
  persistResponse();
  render();
})();
