(function () {
  const fixtures = window.GJFixtures;
  const storageKey = window.GJStorageKey;
  const params = new URLSearchParams(window.location.search);
  let fixtureName = params.get("fixture") || localStorage.getItem(window.GJFixtureNameKey) || "unique";
  let response = readResponse() || fixtures[fixtureName] || fixtures.unique;
  const $ = (id) => document.getElementById(id);
  const fixtureSelect = $("fixture-select");

  function readResponse() {
    try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
  }
  function persistResponse() { localStorage.setItem(storageKey, JSON.stringify(response)); localStorage.setItem(window.GJFixtureNameKey, fixtureName); }
  function labelFor(classification) { return { unique: "Solución única", infinite: "Infinitas soluciones", inconsistent: "Sin solución" }[classification] || "Resultado"; }
  function variables() { return window.GJMatrix.variablesForSize(response.size); }
  function nullRows(matrix) { return (matrix || []).reduce((rows, row, index) => { if (row.slice(0, response.size).every((v) => String(v) === "0") && String(row[response.size]) === "0") rows.push(index + 1); return rows; }, []); }

  function renderUnique() {
    const cards = variables().map((variable) => `<div class="solution-card"><div class="variable">${variable}</div><div class="value">${window.GJMatrix.escapeHtml(response.solution?.[variable] ?? "—")}</div></div>`).join("");
    const verification = (response.verification || []).map((item) => `<li><span class="checkmark">✓</span> Ec. ${item.equation}: ${window.GJMatrix.escapeHtml(item.left)} = ${window.GJMatrix.escapeHtml(item.right)}</li>`).join("");
    return `<span class="result-badge unique">✓ ${labelFor("unique")}</span><h2>El sistema tiene exactamente una solución.</h2><div class="solution-cards">${cards}</div><div class="verification-box"><h3>Comprobación (sustituyendo en las ecuaciones originales)</h3><ul class="verification-list">${verification || "<li>No hay comprobaciones disponibles.</li>"}</ul></div>`;
  }

  function renderInfinite() {
    const parameters = Object.entries(response.parameters || {}).map(([variable, value]) => `<div class="parameter-line">${variable} = ${window.GJMatrix.escapeHtml(value)}</div>`).join("");
    return `<span class="result-badge infinite">∞ ${labelFor("infinite")}</span><h2>El sistema tiene infinitas soluciones.</h2><div class="parameter-box"><h3>Variables libres y parametrización</h3><p>Variables libres: <strong>${window.GJMatrix.escapeHtml((response.free_variables || []).join(", "))}</strong></p>${parameters}</div>`;
  }

  function renderInconsistent() {
    const contradiction = response.contradiction || {};
    return `<span class="result-badge inconsistent">× ${labelFor("inconsistent")}</span><h2>El sistema es inconsistente.</h2><div class="contradiction-box"><h3>Contradicción detectada en la fila ${window.GJMatrix.escapeHtml(contradiction.row || "—")}</h3><p>${window.GJMatrix.escapeHtml(contradiction.equation || "0 = k")}</p><p>La última fila representa una igualdad imposible, por eso no existe solución.</p></div>`;
  }

  function renderSummary() {
    $("result-summary").className = `card result-card ${response.classification}`;
    $("result-summary").innerHTML = response.classification === "unique" ? renderUnique() : response.classification === "infinite" ? renderInfinite() : renderInconsistent();
    $("rref-matrix").innerHTML = window.GJMatrix.renderMatrix(response.rref, {
      size: response.size,
      contradictionRow: response.classification === "inconsistent" ? response.contradiction?.row : undefined,
      nullRows: nullRows(response.rref)
    });
    $("rref-caption").textContent = response.classification === "unique" ? "Cada fila se lee como una ecuación para obtener los valores de las incógnitas." : "La forma reducida permite identificar variables libres o una contradicción.";
  }

  function renderOtherResults() {
    const otherNames = ["infinite", "inconsistent"].filter((name) => name !== response.classification);
    $("other-results").innerHTML = otherNames.map((name) => {
      const item = fixtures[name];
      const body = name === "infinite" ? "Queda una fila nula y una variable libre; el frontend muestra la parametrización recibida." : "La última fila expresa 0 = 1; el sistema es inconsistente.";
      return `<article class="other-result-card ${name}"><span class="result-badge ${name}">${name === "infinite" ? "∞" : "×"} ${labelFor(name)}</span><h3>${name === "infinite" ? "La variable c es libre." : "Se encontró una contradicción."}</h3>${window.GJMatrix.renderMatrix(item.rref, { size: item.size, contradictionRow: name === "inconsistent" ? item.contradiction.row : undefined, nullRows: nullRows(item.rref) })}<p>${body}</p></article>`;
    }).join("");
  }

  function render() {
    $("fixture-select").value = fixtureName in fixtures ? fixtureName : "unique";
    renderSummary();
    renderOtherResults();
  }

  fixtureSelect.addEventListener("change", () => { fixtureName = fixtureSelect.value; response = fixtures[fixtureName]; persistResponse(); render(); });
  $("pdf-button").addEventListener("click", () => { window.print(); $("download-note").textContent = "Se abrió la impresión del navegador: elige “Guardar como PDF” mientras conectamos el endpoint del backend."; });
  persistResponse();
  render();
})();
