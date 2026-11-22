// The tutorial track as the page sees it, and the chip helper (mirrored by tests/test_tutorial.py). Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIES, COLLECTIONS, LEVELS, PROBLEMS, readOnlyOn } from "../src/problems.ts";
import { insertChip, sorryOffsets } from "../src/runner.ts";

test("every level has problems and every chip names a real step", () => {
  for (const level of LEVELS) assert.ok(PROBLEMS.filter((p) => p.level === level).length >= 3, level);
  for (const p of PROBLEMS) for (const s of p.steps) assert.ok(p.tactics.includes(s), `${p.id}: ${s}`);
});

test("every topic is listed, Mathlib problems say so, and imported proofs name their source", () => {
  for (const p of PROBLEMS) assert.ok(CATEGORIES.some((c) => c.id === p.category), p.id);
  for (const c of COLLECTIONS) for (const id of c.items) assert.ok(PROBLEMS.some((p) => p.id === id), `${c.id}: ${id}`);
  const full = PROBLEMS.filter((p) => p.runner === "full");
  assert.ok(full.length >= 6);
  for (const p of full) assert.ok(p.start.startsWith("import Mathlib\n") && p.solution.startsWith("import Mathlib\n"), p.id);
  const imo = PROBLEMS.filter((p) => p.category === "imo");
  assert.ok(imo.length >= 5);
  for (const p of imo) {
    assert.ok(p.source && /^https:\/\/github\.com\/dwrensha\/compfiles\/blob\/[0-9a-f]{40}\//.test(p.source.url), p.id);
    assert.equal(p.source.licence, "Apache-2.0");
    assert.ok(p.tags?.[0][0].startsWith("IMO "), p.id);
  }
});

test("a Mathlib problem is read-only unless a Full runner is connected", () => {
  assert.equal(readOnlyOn({ runner: "full" }, null), true);
  assert.equal(readOnlyOn({ runner: "full" }, "lite"), true);
  assert.equal(readOnlyOn({ runner: "full" }, "full"), false);
  assert.equal(readOnlyOn({ runner: "lite" }, "lite"), false);
  assert.equal(readOnlyOn({ runner: "lite" }, null), false);
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

test("files are joined in order and every line maps back to its file", async () => {
  const { joinFiles } = await import("../src/runner.ts");
  const { code, where } = joinFiles([
    { name: "Lemmas.lean", code: "theorem a : True := ⟨⟩\ntheorem b : True := ⟨⟩" },
    { name: "Proof.lean", code: "theorem t : 1 = 1 := by\n  rfl\n" },
  ]);
  assert.equal(code, "theorem a : True := ⟨⟩\ntheorem b : True := ⟨⟩\ntheorem t : 1 = 1 := by\n  rfl\n");
  assert.deepEqual(where(2), { file: "Lemmas.lean", line: 2 });
  assert.deepEqual(where(4), { file: "Proof.lean", line: 2 });
});

test("the graph reads left to right: theorem, lemmas, library, axioms last", async () => {
  const { layout } = await import("../src/graphLayout.ts");
  const { pos } = layout({
    roots: ["main"],
    nodes: [
      { id: "main", kind: "theorem", status: "proved" },
      { id: "helper", kind: "theorem", status: "sorry" },
      { id: "Nat.add_comm", kind: "library", status: "library" },
      { id: "propext", kind: "axiom", status: "axiom" },
      { id: "sorryAx", kind: "axiom", status: "sorry" },
    ],
    edges: [
      { from: "main", to: "helper" },
      { from: "main", to: "Nat.add_comm" },
      { from: "helper", to: "sorryAx" },
      { from: "Nat.add_comm", to: "propext" },
    ],
    hidden: 0,
    more: 0,
  });
  const x = (id: string) => pos.get(id)!.x;
  assert.ok(x("main") < x("helper") && x("main") < x("Nat.add_comm"));
  assert.equal(x("propext"), x("sorryAx"));
  assert.ok(x("helper") < x("sorryAx") && x("Nat.add_comm") < x("propext"));
});

test("a graph box is wide enough for Chinese labels", async () => {
  const { estimateWidth } = await import("../src/graphLayout.ts");
  assert.ok(estimateWidth("rw · 1 條引理") > estimateWidth("rw · 1 lemma") - 10);
  assert.equal(estimateWidth("條引理"), 2 * estimateWidth("abc"));
});

test("a chip can fill the sorry the reader picked, not only the first", () => {
  const two = "theorem t : P ∧ Q := by\n  constructor\n  · sorry\n  · sorry\n";
  assert.deepEqual(sorryOffsets(two).length, 2);
  assert.equal(insertChip(two, "exact hq", false, 1), "theorem t : P ∧ Q := by\n  constructor\n  · sorry\n  · exact hq\n");
  assert.equal(insertChip(two, "exact hp", false, 0), "theorem t : P ∧ Q := by\n  constructor\n  · exact hp\n  · sorry\n");
  // a step chip keeps a sorry right after it, aligned with the one it replaced
  assert.equal(insertChip(two, "intro x", true, 1), "theorem t : P ∧ Q := by\n  constructor\n  · sorry\n  · intro x\n    sorry\n");
  // an index past the end falls back to the first; `sorry` inside a longer name is not a hole
  assert.equal(insertChip(two, "rfl", false, 5), "theorem t : P ∧ Q := by\n  constructor\n  · rfl\n  · sorry\n");
  assert.deepEqual(sorryOffsets("theorem sorry_free : True := trivial"), []);
});
