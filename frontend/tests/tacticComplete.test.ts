// Tactic completion at a sorry (src/tacticComplete.ts): the list is the problem's tactics with their meanings (tutorial
// mode: the visible ones), choosing one fills the targeted sorry as the old chips did, the "Tactic ▾" pill sits after
// the target sorry only, and the AI row opens Ask AI with a question naming the sorry's line.
import assert from "node:assert/strict";
import { test } from "node:test";
import { takeAgentOpen } from "../src/agent/bus.ts";
import { PROBLEMS } from "../src/problems.ts";
import { insertChip } from "../src/runner.ts";
import { aiQuestion, applyTactic, askAiForSorry, autoOpenAt, HINTS_KEY, loadHints, pillAt, saveHints, tacticItems, tacticPosition } from "../src/tacticComplete.ts";
import { GUIDE } from "../src/tutorialGuide.ts";
import { visibleChips } from "../src/tutorial/progress.ts";

test("the list is the problem's tactics, in order, steps marked, with meanings", () => {
  for (const p of PROBLEMS) {
    const items = tacticItems(p.tactics, p.steps);
    assert.deepEqual(
      items.map((i) => i.tactic),
      p.tactics,
      p.id,
    );
    for (const i of items) {
      assert.equal(i.label, i.tactic.split("\n")[0]);
      if (p.steps.includes(i.tactic)) assert.ok(i.step, `${p.id}: ${i.label} is a step`);
    }
  }
  const gauss = PROBLEMS.find((p) => p.id === "gauss")!;
  assert.ok(tacticItems(gauss.tactics, gauss.steps).some((i) => i.meaning && i.meaning[0] && i.meaning[1]), "meanings in both languages");
});

test("tutorial mode lists only the visible tools", () => {
  const gauss = PROBLEMS.find((p) => p.id === "gauss")!;
  const guide = GUIDE.gauss;
  const chips = visibleChips(gauss.tactics, guide.first, [], false);
  const items = tacticItems(chips.shown, gauss.steps);
  assert.deepEqual(
    items.map((i) => i.tactic),
    chips.shown,
  );
  assert.ok(chips.locked.length > 0 && items.length < gauss.tactics.length);
});

test("choosing a tactic fills the targeted sorry (as insertChip), on a sorry or on what was typed in its place", () => {
  const code = "theorem t : A ∧ B := by\n  constructor\n  · sorry\n  · sorry\n";
  const second = code.lastIndexOf("sorry");
  const onSorry = applyTactic(code, second, second + 5, { tactic: "exact hb", step: false });
  assert.equal(onSorry.hole, 1);
  assert.equal(onSorry.code, insertChip(code, "exact hb", false, 1));
  // typed "ex" in place of the second sorry
  const typed = code.slice(0, second) + "ex" + code.slice(second + 5);
  const onTyped = applyTactic(typed, second, second + 2, { tactic: "exact hb", step: false });
  assert.equal(onTyped.code, onSorry.code);
  // a step keeps a sorry under it
  const step = applyTactic(code, second, second + 5, { tactic: "have h : B := by\n  sorry", step: true });
  assert.ok(step.code.endsWith("· have h : B := by\n      sorry\n    sorry\n"), step.code);
});

test("the pill goes after the target sorry, and only there", () => {
  const code = "a sorry b sorry c";
  assert.equal(pillAt(code, 0), 7);
  assert.equal(pillAt(code, 1), 15);
  assert.equal(pillAt(code, 5), 7, "an out-of-range target falls back to the first");
  assert.equal(pillAt("no holes", 0), null);
});

test("typing opens the list only where a tactic goes", () => {
  assert.ok(tacticPosition("  "));
  assert.ok(tacticPosition("theorem t : P := by "));
  assert.ok(tacticPosition("  | zero => "));
  assert.ok(tacticPosition("  · "));
  assert.ok(!tacticPosition("theorem t (n : Nat) : n = "));
});

test("the AI row: Ask AI opens with a question naming the sorry's line and its goal", () => {
  (globalThis as { window?: EventTarget }).window ??= new EventTarget();
  askAiForSorry(1, { file: "Proof.lean", line: 6, goal: "n : Nat\n⊢ 2 * sumTo n = n * (n + 1)" });
  const open = takeAgentOpen();
  assert.ok(open, "an agent-open request was published");
  assert.match(open.draft, /L6/);
  assert.match(open.draft, /⊢ 2 \* sumTo n/);
  assert.match(aiQuestion(0, { file: "Proof.lean", line: 14 }), /line 14 \(L14\)/);
});

test("tactic hints open the list at a sorry (inside, touching, or in its indentation), and nowhere else", () => {
  const code = "theorem t : P := by\n  sorry\n\ntheorem u : Q := by\n  exact q\n";
  const at = code.indexOf("sorry");
  for (const pos of [at, at + 2, at + 5, at - 1, at - 2]) assert.equal(autoOpenAt(code, pos), 0, `pos ${pos}`);
  assert.equal(autoOpenAt(code, at - 3), -1, "the end of the line above");
  assert.equal(autoOpenAt(code, code.indexOf("exact")), -1);
  assert.equal(autoOpenAt(code, code.indexOf("theorem t") + 3), -1);
  const two = "a := by\n  · sorry\n  · sorry";
  assert.equal(autoOpenAt(two, two.lastIndexOf("sorry") + 1), 1);
  assert.equal(autoOpenAt(two, two.indexOf("·")), -1, "after a bullet, not just indentation");
});

test("the tactic-hints switch is remembered (on by default)", () => {
  const box = new Map<string, string>();
  const store = { getItem: (k: string) => box.get(k) ?? null, setItem: (k: string, v: string) => void box.set(k, v) };
  assert.equal(loadHints(store), true);
  saveHints(false, store);
  assert.equal(box.get(HINTS_KEY), "off");
  assert.equal(loadHints(store), false);
  saveHints(true, store);
  assert.equal(loadHints(store), true);
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(loadHints(broken), true);
  assert.doesNotThrow(() => saveHints(false, broken));
});
