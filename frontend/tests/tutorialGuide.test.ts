// The Tutorial mode's script (src/tutorialGuide.ts) against the tutorial track (problems/tutorial.json): every problem
// and every chip is covered, tools are introduced before they are needed, and the paper proof and the statement
// mirror point at real Lean text. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { PROBLEMS } from "../src/problems.ts";
import { TACTICS } from "../src/tactics.ts";
import { GUIDE, NO_GOALS, type ProblemGuide } from "../src/tutorialGuide.ts";

const tutorial = PROBLEMS.filter((p) => p.category === "tutorial");
const head = (chip: string) => chip.trim().match(/^[^\s[(]+/)?.[0] ?? "";
const filled = (l: readonly string[], where: string) => {
  assert.equal(l.length, 2, where);
  for (const s of l) assert.ok(s.trim().length > 0, where);
};

test("every tutorial problem has a guide, and every guide a problem", () => {
  assert.ok(tutorial.length >= 15);
  assert.deepEqual(Object.keys(GUIDE).sort(), tutorial.map((p) => p.id).sort());
});

test("chips: `first` is a non-empty subset of the chips, and every chip has a `here` entry", () => {
  for (const p of tutorial) {
    const g = GUIDE[p.id];
    assert.ok(g.first.length > 0, p.id);
    for (const c of g.first) assert.ok(p.tactics.includes(c), `${p.id}: first ${c}`);
    assert.deepEqual(Object.keys(g.here).sort(), [...p.tactics].sort(), p.id);
    for (const [chip, h] of Object.entries(g.here)) {
      assert.ok(h.frames.length > 0 || h.fails, `${p.id}: ${chip} has neither frames nor fails`);
      if (h.fails) filled(h.fails, `${p.id}: ${chip} fails`);
      for (const f of h.frames) {
        assert.ok(f.goal === NO_GOALS || f.goal.includes("⊢"), `${p.id}: ${chip} goal ${f.goal}`);
        if (f.note) filled(f.note, `${p.id}: ${chip} note`);
      }
    }
    // a failure unlocks the rest: one of the first chips must fail on this problem
    if (g.unlock === "after-fail") assert.ok(g.first.some((c) => g.here[c].fails), `${p.id}: nothing in first fails`);
  }
});

test("every chip's tool has its name explained (origin), in both languages", () => {
  for (const p of tutorial) for (const c of p.tactics) assert.ok(TACTICS[head(c)]?.origin, `${p.id}: ${c}`);
  for (const [name, info] of Object.entries(TACTICS)) {
    assert.ok(info.origin, name);
    filled(info.origin!, name);
  }
});

test("the track: each tool is introduced once, before or where it is first needed", () => {
  const known = new Set<string>();
  for (const p of tutorial) {
    const g = GUIDE[p.id];
    for (const t of g.introduces) {
      assert.ok(!known.has(t), `${p.id} re-introduces ${t}`);
      assert.ok(p.tactics.some((c) => head(c) === t), `${p.id} introduces ${t} without a chip for it`);
    }
    for (const t of g.introduces) known.add(t);
    for (const c of p.tactics) assert.ok(known.has(head(c)), `${p.id}: ${c} uses a tool never introduced`);
  }
});

test("texts: unlock note, coach, statement mirror and paper steps are filled in both languages", () => {
  for (const p of tutorial) {
    const g: ProblemGuide = GUIDE[p.id];
    filled(g.unlockNote, `${p.id} unlockNote`);
    for (const k of ["statement", "goal", "tactic", "result"] as const) filled(g.coach[k], `${p.id} coach.${k}`);
    for (const m of g.statementMirror) filled(m.human, `${p.id} mirror`);
    for (const s of g.paper) filled(s.text, `${p.id} paper`);
  }
});

test("statement mirror: every piece is text of the start file, in order", () => {
  for (const p of tutorial) {
    const pieces = GUIDE[p.id].statementMirror;
    assert.ok(pieces.length >= 2, p.id);
    let from = 0;
    for (const m of pieces) {
      const at = p.start.indexOf(m.lean, from);
      assert.ok(at >= 0, `${p.id}: "${m.lean}" not found (in order) in the start file`);
      from = at + m.lean.length;
    }
  }
});

test("paper proof: ranges valid, in order, not overlapping, covering every proof line; anchors match", () => {
  for (const p of tutorial) {
    const lines = p.solution!.split("\n");
    const theorem = lines.findIndex((l) => l.startsWith("theorem ")) + 1;
    assert.ok(theorem > 0, p.id);
    const covered = new Set<number>();
    let last = 0;
    const steps = GUIDE[p.id].paper;
    assert.ok(steps.length >= 1 && steps.length <= 5, p.id);
    for (const s of steps) {
      const [a, b] = s.lines;
      assert.ok(Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= b && b <= lines.length, `${p.id}: ${a}-${b}`);
      assert.ok(a > last, `${p.id}: ${a}-${b} out of order or overlapping`);
      last = b;
      for (let i = a; i <= b; i++) covered.add(i);
      const want = lines.slice(a - 1, b).map((l) => l.trim()).filter(Boolean);
      assert.deepEqual(s.lean, want, `${p.id}: anchors of ${a}-${b}`);
      if (s.goal !== undefined) assert.ok(s.goal.includes("⊢"), `${p.id}: goal of ${a}-${b}`);
    }
    for (let i = theorem + 1; i <= lines.length; i++)
      if (lines[i - 1].trim()) assert.ok(covered.has(i), `${p.id}: solution line ${i} not in any paper step`);
  }
});
