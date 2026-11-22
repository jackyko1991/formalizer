// The natural-language mirror (src/proofMirror.ts) against the problem library (problems/*.json): every problem
// outside the tutorial has a mirror, every statement piece is text of the start file, and every paper step points at
// real lines of the reference solution. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { PROBLEMS } from "../src/problems.ts";
import { MIRRORS, mirrorFor } from "../src/proofMirror.ts";
import { GUIDE } from "../src/tutorialGuide.ts";

const others = PROBLEMS.filter((p) => p.category !== "tutorial");
const filled = (l: readonly string[], where: string) => {
  assert.equal(l.length, 2, where);
  for (const s of l) assert.ok(s.trim().length > 0, where);
};

test("every problem outside the tutorial has a mirror, and every mirror a problem", () => {
  assert.ok(others.length >= 29);
  assert.deepEqual(Object.keys(MIRRORS).sort(), others.map((p) => p.id).sort());
});

test("texts: statement pieces and paper steps are filled in both languages", () => {
  for (const p of others) {
    const m = MIRRORS[p.id];
    for (const s of m.statementMirror) filled(s.human, `${p.id} statement`);
    for (const s of m.paper) filled(s.text, `${p.id} paper`);
  }
});

test("statement mirror: every piece is text of the start file, in order", () => {
  for (const p of others) {
    const pieces = MIRRORS[p.id].statementMirror;
    assert.ok(pieces.length >= 2, p.id);
    let from = 0;
    for (const m of pieces) {
      assert.ok(m.lean.trim().length > 0, p.id);
      const at = p.start.indexOf(m.lean, from);
      assert.ok(at >= 0, `${p.id}: "${m.lean}" not found (in order) in the start file`);
      from = at + m.lean.length;
    }
  }
});

test("paper proof: ranges valid, in order, not overlapping, covering every proof line; anchors match", () => {
  for (const p of others) {
    const lines = p.solution.split("\n");
    const theorem = lines.findIndex((l) => l.startsWith("theorem ")) + 1;
    assert.ok(theorem > 0, p.id);
    const covered = new Set<number>();
    let last = 0;
    const steps = MIRRORS[p.id].paper;
    assert.ok(steps.length >= 1, p.id);
    for (const s of steps) {
      const [a, b] = s.lines;
      assert.ok(Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= b && b <= lines.length, `${p.id}: ${a}-${b}`);
      assert.ok(a > last, `${p.id}: ${a}-${b} out of order or overlapping`);
      last = b;
      for (let i = a; i <= b; i++) covered.add(i);
      const want = lines.slice(a - 1, b).map((l) => l.trim()).filter(Boolean);
      assert.ok(want.length > 0, `${p.id}: ${a}-${b} is blank`);
      assert.deepEqual(s.lean, want, `${p.id}: anchors of ${a}-${b}`);
      if (s.goal !== undefined) {
        assert.ok(s.goal.includes("⊢"), `${p.id}: goal of ${a}-${b}`);
        assert.equal(p.runner, "lite", `${p.id}: goals are captured for Lite problems only`);
      }
    }
    // every non-blank line after the first theorem line is in a step, except the closing `end <Namespace>`
    for (let i = theorem + 1; i <= lines.length; i++) {
      const l = lines[i - 1].trim();
      if (l && !/^end \w+$/.test(l)) assert.ok(covered.has(i), `${p.id}: solution line ${i} not in any paper step: ${l}`);
    }
  }
});

test("mirrorFor: tutorial problems from GUIDE, the rest from MIRRORS", () => {
  const tutorial = PROBLEMS.filter((p) => p.category === "tutorial");
  assert.ok(tutorial.length > 0);
  for (const p of tutorial) assert.equal(mirrorFor(p.id), GUIDE[p.id], p.id);
  for (const p of others) assert.equal(mirrorFor(p.id), MIRRORS[p.id], p.id);
  for (const p of PROBLEMS) {
    const m = mirrorFor(p.id);
    assert.ok(m && m.statementMirror.length > 0 && m.paper.length > 0, p.id);
  }
  assert.equal(mirrorFor("no-such-problem"), undefined);
  assert.equal(mirrorFor("constructor"), undefined);
});
