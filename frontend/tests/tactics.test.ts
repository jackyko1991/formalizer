// Beginners' help on the Problems page: every tactic chip has a plain-language meaning, and every L1 problem's file
// can be read piece by piece. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { PROBLEMS } from "../src/problems.ts";
import { explainTactic, statementParts, TACTICS } from "../src/tactics.ts";

test("every chip of every problem has a meaning, in both languages", () => {
  const missing = PROBLEMS.flatMap((p) => p.tactics.filter((t) => !explainTactic(t)).map((t) => `${p.id}: ${t}`));
  assert.deepEqual(missing, []);
  for (const [name, info] of Object.entries(TACTICS))
    for (const text of [...info.short, ...info.long]) assert.ok(text.trim().length > 0, name);
});

test("norm_num is marked as Mathlib, and a chip is found by its first word", () => {
  assert.equal(explainTactic("norm_num")?.mathlib, true);
  assert.equal(explainTactic("rw [h₁, h₂]"), TACTICS.rw);
  assert.equal(explainTactic("induction n with\n| zero => sorry"), TACTICS.induction);
  assert.equal(explainTactic("exact?"), TACTICS["exact?"]);
});

test("every tutorial file reads as [def] · theorem · name · given · claim · := by · sorry", () => {
  // the whole tutorial track is shown as one clickable file, definitions included (gauss's sumTo)
  const tutorial = PROBLEMS.filter((p) => p.category === "tutorial");
  assert.ok(tutorial.length >= 15);
  for (const p of tutorial) assert.ok(statementParts(p.start), p.id);
  assert.match(statementParts(PROBLEMS.find((p) => p.id === "gauss")!.start)!.defs, /^def sumTo : Nat → Nat/);
  assert.equal(statementParts("import Mathlib\ntheorem t : True := by\n  sorry"), null);
  assert.deepEqual(statementParts("theorem hello : 2 + 2 = 4 := by\n  sorry\n"), { defs: "", name: "hello", args: "", claim: "2 + 2 = 4" });
  assert.deepEqual(statementParts("theorem add_swap (a b : Nat) : a + b = b + a := by\n  sorry\n"), {
    defs: "",
    name: "add_swap",
    args: "(a b : Nat)",
    claim: "a + b = b + a",
  });
});
