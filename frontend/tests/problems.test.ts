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
