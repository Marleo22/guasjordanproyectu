import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = { window: {} };
vm.runInNewContext(readFileSync(new URL("../js/solver-fixtures.js", import.meta.url), "utf8"), context);
const fixtures = context.window.GJFixtures;

test("cada fixture tiene matrices aumentadas con size + 1 columnas", () => {
  for (const fixture of Object.values(fixtures)) {
    assert.equal(fixture.initial_matrix.length, fixture.size);
    assert.ok(fixture.initial_matrix.every((row) => row.length === fixture.size + 1));
    assert.equal(fixture.rref.length, fixture.size);
    assert.ok(fixture.rref.every((row) => row.length === fixture.size + 1));
  }
});

test("las tres clasificaciones están disponibles", () => {
  assert.equal(fixtures.unique.classification, "unique");
  assert.equal(fixtures.infinite.classification, "infinite");
  assert.equal(fixtures.inconsistent.classification, "inconsistent");
});

test("cada paso conserva before, after y filas modificadas", () => {
  for (const fixture of Object.values(fixtures)) {
    for (const step of fixture.steps) {
      assert.ok(Array.isArray(step.before));
      assert.ok(Array.isArray(step.after));
      assert.ok(Array.isArray(step.changed_rows));
      assert.ok(step.label);
    }
  }
});

test("la fixture de fracciones mantiene valores exactos", () => {
  assert.equal(fixtures.fractions.solution.a, "2/3");
  assert.equal(fixtures.fractions.solution.b, "2/3");
});
