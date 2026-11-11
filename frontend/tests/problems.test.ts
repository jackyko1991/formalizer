// The tutorial track as the page sees it, and the chip helper (mirrored by tests/test_tutorial.py). Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { LEVELS, PROBLEMS } from "../src/problems.ts";
import { insertChip } from "../src/runner.ts";

test("every level has problems and every chip names a real step", () => {
  for (const level of LEVELS) assert.ok(PROBLEMS.filter((p) => p.level === level).length >= 3, level);
  for (const p of PROBLEMS) for (const s of p.steps) assert.ok(p.tactics.includes(s), `${p.id}: ${s}`);
});

test("a chip replaces the first sorry, indents its lines and keeps a sorry after a step", () => {
  const start = "theorem t : P := by\n  sorry\n";
  assert.equal(insertChip(start, "omega"), "theorem t : P := by\n  omega\n");
  assert.equal(insertChip(start, "rw [h]", true), "theorem t : P := by\n  rw [h]\n  sorry\n");
  assert.equal(
    insertChip(start, "cases h with\n| inl a => sorry\n| inr b => sorry"),
    "theorem t : P := by\n  cases h with\n  | inl a => sorry\n  | inr b => sorry\n",
  );
  assert.equal(insertChip("  | succ n ih => sorry", "simp", true), "  | succ n ih => simp\n                 sorry");
  assert.equal(insertChip("done", "omega"), "done");
});
