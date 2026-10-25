(function () {
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const variablesForSize = (size) => ["a", "b", "c", "d", "e"].slice(0, size);
  const formatValue = (value) => {
    const text = String(value ?? "");
    if (text === "-0") return "0";
    return text.replace(/^-/u, "−").replaceAll("-", "−");
  };
  const diffCells = (before, after) => {
    const changed = new Set();
    (after || []).forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
      if (!before?.[rowIndex] || String(before[rowIndex][columnIndex]) !== String(value)) changed.add(`${rowIndex + 1}-${columnIndex}`);
    }));
    return changed;
  };
  const renderMatrix = (matrix, options = {}) => {
    if (!Array.isArray(matrix) || matrix.length === 0) return '<div class="matrix-empty">No hay matriz para mostrar.</div>';
    const size = options.size || matrix.length;
    const changedRows = new Set(options.changedRows || []);
    const changedCells = options.changedCells || new Set();
    const contradictionRow = options.contradictionRow;
    const nullRows = new Set(options.nullRows || []);
    const variables = variablesForSize(size);
    const headers = [...variables, "="];
    const head = headers.map((header) => `<span>${escapeHtml(header)}</span>`).join("");
    const rows = matrix.map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const classes = ["matrix-row"];
      if (changedRows.has(rowNumber)) classes.push("changed-row");
      if (contradictionRow === rowNumber) classes.push("contradiction-row");
      if (nullRows.has(rowNumber)) classes.push("null-row");
      const cells = row.map((value, columnIndex) => {
        const cellClasses = ["matrix-cell"];
        if (columnIndex === size) cellClasses.push("rhs-cell");
        if (changedCells.has(`${rowNumber}-${columnIndex}`)) cellClasses.push("changed-cell");
        return `<span class="${cellClasses.join(" ")}" role="gridcell" aria-label="Fila ${rowNumber}, columna ${columnIndex + 1}">${escapeHtml(formatValue(value))}</span>`;
      }).join("");
      return `<div class="${classes.join(" ")}" role="row"><span class="row-label">F${rowNumber}</span>${cells}</div>`;
    }).join("");
    return `<div class="matrix-shell"><div class="matrix-grid" role="grid" style="--matrix-cols:${size + 1}"><div class="matrix-head" role="row"><span></span>${head}</div>${rows}</div></div>`;
  };
  const renderMatrixCard = (title, matrix, options = {}) => `<article class="matrix-card ${options.current ? "current-card" : ""}"><h3>${escapeHtml(title)}</h3>${options.caption ? `<p class="matrix-caption">${escapeHtml(options.caption)}</p>` : ""}${renderMatrix(matrix, options)}</article>`;
  window.GJMatrix = { escapeHtml, variablesForSize, formatValue, diffCells, renderMatrix, renderMatrixCard };
})();
