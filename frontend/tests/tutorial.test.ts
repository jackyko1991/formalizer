// Tutorial mode (src/tutorial/progress.ts): the progress kept in localStorage (load, save, resume, restart), the rules
// that unlock tools, which chips show, the goal worked out from the statement, and the paper ↔ Lean line runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DONE,
  fresh,
  initialGoal,
  isRevealed,
  markRevealed,
  markSolved,
  parseProgress,
  reachStep,
  restart,
  coachShown,
  guideOff,
  locateSteps,
  reopenGuide,
  skipGuide,
  stepAtLine,
  serializeProgress,
  setOn,
  setStep,
  stepOf,
  unlock,
  unlocksNow,
  visibleChips,
} from "../src/tutorial/progress.ts";
import { statementParts } from "../src/tactics.ts";
import { mirrorRuns, paperSteps } from "../src/tutorial/mirror.ts";

test("progress survives a save and a load, and anything broken starts fresh", () => {
  let p = fresh();
  assert.equal(p.on, true);
  p = markSolved(setStep(p, "hello", 2), "hello");
  p = unlock(p, "add-comm", ["omega", "exact"]);
  p = markRevealed(p, "hello", "rfl");
  const back = parseProgress(serializeProgress(p));
  assert.deepEqual(back, p);
  assert.equal(stepOf(back, "hello"), 2);
  assert.equal(stepOf(back, "add-comm"), 0);
  assert.ok(isRevealed(back, "hello", "rfl"));
  assert.ok(!isRevealed(back, "add-comm", "rfl"));
  for (const bad of [null, "", "{", "[]", "42", '{"on":"x","solved":"y","step":{"a":"z","b":99,"c":-1}}']) {
    const q = parseProgress(bad);
    assert.equal(q.on, true, String(bad));
    assert.ok(Array.isArray(q.solved) && Array.isArray(q.unlocked));
  }
  // steps are kept within 0..DONE
  assert.deepEqual(parseProgress('{"step":{"b":99,"c":-1,"d":1.5}}').step, { b: DONE, c: 0 });
});

test("turning the mode off and on resumes where the reader was; restart clears progress only", () => {
  let p = setStep(markSolved(unlock(fresh(), "add-comm", ["omega"]), "hello"), "add-comm", 3);
  const off = parseProgress(serializeProgress(setOn(p, false)));
  assert.equal(off.on, false);
  const on = setOn(off, true);
  assert.equal(stepOf(on, "add-comm"), 3);
  assert.deepEqual(on.solved, ["hello"]);
  assert.deepEqual(on.unlocked, ["omega"]);
  p = restart(on);
  assert.deepEqual(p, fresh());
  assert.equal(restart(setOn(on, false)).on, false);
});

test("the coach moves forward on actions but never back; skipping ends it", () => {
  let p = reachStep(fresh(), "hello", 1);
  assert.equal(stepOf(p, "hello"), 1);
  p = reachStep(p, "hello", 3);
  assert.equal(reachStep(p, "hello", 1), p);
  assert.equal(stepOf(setStep(p, "hello", DONE + 5), "hello"), DONE);
});

test("unlock rules: after-fail on a rejected try, after-solve on a proof; the page's own first run never counts", () => {
  assert.ok(unlocksNow("after-fail", { verdict: "error", errors: 1 }));
  assert.ok(unlocksNow("after-fail", { verdict: "incomplete", errors: 1 }));
  assert.ok(!unlocksNow("after-fail", { verdict: "incomplete", errors: 0 }), "a step that leaves a sorry is not a failure");
  assert.ok(!unlocksNow("after-fail", { verdict: "proved", errors: 0 }));
  assert.ok(!unlocksNow("after-fail", { verdict: "error", errors: 1, auto: true }));
  assert.ok(unlocksNow("after-solve", { verdict: "proved", errors: 0 }));
  assert.ok(!unlocksNow("after-solve", { verdict: "error", errors: 1 }));
  // unlocking twice changes nothing; tools gather across problems without repeats
  const p = unlock(unlock(fresh(), "a", ["omega", "simp"]), "b", ["simp", "exact"]);
  assert.deepEqual(p.unlocked, ["omega", "simp", "exact"]);
  assert.equal(unlock(p, "a", ["x"]), p);
});

test("tutorial chips: the first ones and earlier tools; all once this problem unlocks", () => {
  const chips = ["omega", "exact Nat.add_comm a b", "simp", "rfl"];
  assert.deepEqual(visibleChips(chips, ["rfl"], [], false), { shown: ["rfl"], locked: ["omega", "exact Nat.add_comm a b", "simp"] });
  // an earlier unlock by head word or exact chip
  assert.deepEqual(visibleChips(chips, ["rfl"], ["exact", "simp"], false).shown, ["exact Nat.add_comm a b", "simp", "rfl"]);
  assert.deepEqual(visibleChips(chips, ["rfl"], [], true), { shown: chips, locked: [] });
});

test("the goal before Lean runs: binders above the line, the claim after ⊢", () => {
  assert.deepEqual(initialGoal(statementParts("theorem hello : 2 + 2 = 4 := by\n  sorry\n")), { hypotheses: [], target: "2 + 2 = 4" });
  assert.deepEqual(initialGoal(statementParts("theorem add_swap (a b : Nat) : a + b = b + a := by\n  sorry\n")), {
    hypotheses: ["a b : Nat"],
    target: "a + b = b + a",
  });
  assert.deepEqual(
    initialGoal(
      statementParts("theorem even_add (a b : Nat) (ha : ∃ k, a = 2 * k) (hb : ∃ k, b = 2 * k) : ∃ k, a + b = 2 * k := by\n  sorry\n"),
    ),
    { hypotheses: ["a b : Nat", "ha : ∃ k, a = 2 * k", "hb : ∃ k, b = 2 * k"], target: "∃ k, a + b = 2 * k" },
  );
  assert.deepEqual(initialGoal({ args: "{α : Type} [inst : Inhabited α] (f : (Nat → Nat))", claim: "True" })?.hypotheses, [
    "α : Type",
    "inst : Inhabited α",
    "f : (Nat → Nat)",
  ]);
  assert.equal(initialGoal(null), null);
});

test("skipping hides the coach on that problem only; the Guide button resumes at the saved step", () => {
  let p = setStep(fresh(), "add-comm", 2);
  p = skipGuide(p, "add-comm");
  assert.ok(!coachShown(p, "add-comm"));
  assert.ok(coachShown(p, "hello"), "the next problem still starts with the coach");
  p = parseProgress(serializeProgress(p));
  p = reopenGuide(p, "add-comm");
  assert.ok(coachShown(p, "add-comm"));
  assert.equal(stepOf(p, "add-comm"), 2);
  // a walked guide reopens from its first step
  assert.equal(stepOf(reopenGuide(setStep(fresh(), "x", DONE), "x"), "x"), 0);
  // "Don't show the guide again": nowhere, until the Guide button
  p = guideOff(p);
  assert.ok(!coachShown(p, "hello") && !coachShown(p, "add-comm"));
  assert.equal(parseProgress(serializeProgress(p)).guideOff, true);
  p = reopenGuide(p, "hello");
  assert.ok(coachShown(p, "hello") && coachShown(p, "add-comm"));
  // restart clears skips and the global off too
  assert.deepEqual(restart(guideOff(skipGuide(p, "hello"))), fresh());
});

test("the proof mirror: each paper step found in the live code by its Lean lines", () => {
  const solution = [
    "def sumTo : Nat → Nat",
    "  | 0 => 0",
    "  | n + 1 => sumTo n + (n + 1)",
    "",
    "theorem t (n : Nat) : x := by",
    "  induction n with",
    "  | zero => rfl",
    "  | succ n ih => omega",
    "",
  ].join("\n");
  const steps = paperSteps(
    {
      paper: [
        { text: ["a", "a"], lines: [5, 6] },
        { text: ["b", "b"], lines: [7, 7] },
        { text: ["c", "c"], lines: [8, 8], lean: ["| succ n ih =>   omega"] },
      ],
    },
    solution,
  );
  assert.deepEqual(steps[0].lean, ["theorem t (n : Nat) : x := by", "induction n with"]);
  assert.deepEqual(locateSteps(solution, steps), [[5, 6], [7], [8]]);
  // the start file: the rest is not written yet
  const start = solution.split("\n").slice(0, 5).join("\n") + "\n  sorry\n";
  assert.deepEqual(locateSteps(start, steps), [null, null, null]);
  // edits move the links: other indentation, a line inserted between
  const edited = ["theorem t (n : Nat) : x := by", "    induction n with", "    -- base", "    | zero =>   rfl", "    | succ n ih => sorry"].join("\n");
  const found = locateSteps(edited, steps);
  assert.deepEqual(found, [[1, 2], [4], null]);
  assert.equal(stepAtLine(found, 4), 1);
  assert.equal(stepAtLine(found, 3), null);
  // a short line like `rfl` is looked for after the step before it
  assert.deepEqual(locateSteps(["rfl", "A", "rfl"].join("\n"), [{ lean: ["A"] }, { lean: ["rfl"] }]), [[2], [3]]);
});

test("the statement mirror: Lean words of each pair inside the clickable parts", () => {
  const parts = ["theorem", "add_swap", "(a b : Nat)", ": a + b = b + a", ":= by", "sorry"];
  const runs = mirrorRuns(parts, [{ lean: "theorem add_swap" }, { lean: "(a b : Nat)" }, { lean: "a + b = b + a" }]);
  assert.deepEqual(runs[0], [{ text: "theorem", pair: 0 }]);
  assert.deepEqual(runs[1], [{ text: "add_swap", pair: 0 }]);
  assert.deepEqual(runs[2], [{ text: "(a b : Nat)", pair: 1 }]);
  assert.deepEqual(runs[3], [
    { text: ": ", pair: null },
    { text: "a + b = b + a", pair: 2 },
  ]);
  assert.deepEqual(runs[5], [{ text: "sorry", pair: null }]);
  // the same words twice in one part: the longer pair first, the other takes the next free place
  const two = mirrorRuns([": a = a"], [{ lean: "a" }, { lean: "a = a" }]);
  assert.deepEqual(two[0], [
    { text: ": ", pair: null },
    { text: "a = a", pair: 1 },
  ]);
});

test("the clickable statement is for the tutorial track only", async () => {
  const { showsAnatomy } = await import("../src/tutorial/anatomy.ts");
  const { PROBLEMS } = await import("../src/problems.ts");
  const geo = PROBLEMS.find((p) => p.id === "geo-pythagoras")!;
  assert.equal(geo.level, "L1");
  assert.equal(showsAnatomy(geo), false);
  assert.equal(showsAnatomy(PROBLEMS.find((p) => p.id === "hello")!), true);
  for (const p of PROBLEMS) if (p.category !== "tutorial") assert.equal(showsAnatomy(p), false, p.id);
});

test("the statement mirror shows the start file when a natural-language piece describes a definition it uses", async () => {
  const { mirrorLeanText } = await import("../src/tutorial/mirror.ts");
  const { MIRRORS } = await import("../src/proofMirror.ts");
  const { PROBLEMS } = await import("../src/problems.ts");
  for (const p of PROBLEMS) {
    const m = MIRRORS[p.id];
    if (!m) continue;
    const text = mirrorLeanText(p.statements, p.start, m.statementMirror);
    for (const piece of m.statementMirror) assert.ok(text.includes(piece.lean), `${p.id}: ${piece.lean.slice(0, 40)}`);
  }
  assert.equal(mirrorLeanText(["theorem t : True"], "theorem t : True := by\n  sorry\n", [{ lean: "True" }]), "theorem t : True");
});
