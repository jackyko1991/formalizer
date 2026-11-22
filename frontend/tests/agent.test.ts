// The agent panel's pure parts: suggested questions from what is on screen, and merging the agent's edits.
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyAgentFiles, mergeFiles, onAgentFiles, type AgentContext } from "../src/agent/bus.ts";
import { suggestQuestions } from "../src/agent/suggest.ts";

const problem = (extra: Partial<AgentContext> = {}): AgentContext => ({
  target: "problem/hello",
  title: "Hello",
  files: [{ name: "Proof.lean", code: "theorem hello : 2 + 2 = 4 := by\n  sorry\n" }],
  ...extra,
});

test("a problem's questions follow the last check, never more than four", () => {
  const en = (c: AgentContext) => suggestQuestions(c).map((q) => q[0]);
  assert.deepEqual(en(problem()).slice(0, 2), [
    "What does this statement say, in plain words?",
    "Give me a hint for the first step, not the answer.",
  ]);
  const err = en(problem({ verdict: "error", errors: [{ file: "Proof.lean", line: 2, message: "x" }] }));
  assert.equal(err[0], "Why does Lean reject line 2 of Proof.lean?");
  const open = en(problem({ verdict: "incomplete" }));
  assert.ok(open.includes("Explain the open goal in words.") && open.length <= 4);
  assert.ok(en(problem({ verdict: "proved" })).includes("Is there a shorter proof?"));
  for (const c of [problem(), problem({ verdict: "incomplete" }), problem({ verdict: "proved" })])
    assert.equal(new Set(en(c)).size, en(c).length); // no repeats
});

test("a research project's questions follow the lemma in focus and the blueprint", () => {
  const base: AgentContext = { target: "project/x", title: "X", files: [], main: "main_t" };
  const sorry = suggestQuestions({ ...base, focus: { name: "step", status: "sorry", note: "induction" }, statuses: { step: "sorry" } });
  assert.deepEqual(
    sorry.map((q) => q[0]),
    [
      "Write `step` in Lean from my note.",
      "Give me a hint for `step`, not the proof.",
      "Split `step` into smaller lemmas.",
      "Which lemma should I work on next?",
    ],
  );
  assert.ok(sorry.every((q) => q[1].length > 0)); // every question has its Chinese
  const done = suggestQuestions({ ...base, statuses: { main_t: "proved" } }).map((q) => q[0]);
  assert.deepEqual(done, ["Explain the proof of `main_t` in words.", "Is there a shorter proof of `main_t`?"]);
  assert.deepEqual(suggestQuestions(null), []);
});

test("the agent's edits merge into the files: changed, added in order, removed, read-only kept", () => {
  const files = [
    { name: "Lib.lean", code: "lib", readonly: true },
    { name: "Lemmas.lean", code: "a" },
    { name: "Proof.lean", code: "p" },
  ];
  const merged = mergeFiles(
    files,
    {
      target: "problem/x",
      files: { "Lemmas.lean": "b", "More.lean": "m", "Lib.lean": "hacked" },
      removed: [],
      order: ["Lib.lean", "Lemmas.lean", "More.lean", "Proof.lean"],
    },
    new Set(["Lib.lean"]),
  );
  assert.deepEqual(
    merged.map((f) => [f.name, f.code]),
    [
      ["Lib.lean", "lib"],
      ["Lemmas.lean", "b"],
      ["More.lean", "m"],
      ["Proof.lean", "p"],
    ],
  );
  const removed = mergeFiles(
    files,
    { target: "problem/x", files: {}, removed: ["Lemmas.lean", "Lib.lean"], order: [] },
    new Set(["Lib.lean"]),
  );
  assert.deepEqual(
    removed.map((f) => f.name),
    ["Lib.lean", "Proof.lean"],
  );
});

test("edits reach only a page that takes them", () => {
  const e = { target: "project/a", files: {}, removed: [], order: [] };
  assert.equal(applyAgentFiles(e), false);
  const off = onAgentFiles((x) => x.target === "project/a");
  assert.equal(applyAgentFiles(e), true);
  assert.equal(applyAgentFiles({ ...e, target: "project/b" }), false);
  off();
  assert.equal(applyAgentFiles(e), false);
});

test("the translator questions: a paper step in focus into Lean, the cursor's Lean line into words", () => {
  const en = (c: AgentContext) => suggestQuestions(c).map((q) => q[0]);
  const both = en(problem({ focus: { name: "step 2", note: "Add one to both sides." }, cursor: { file: "Proof.lean", line: 2 } }));
  assert.deepEqual(both.slice(0, 2), ["Translate this step into Lean: step 2.", "Say line 2 of Proof.lean in natural language."]);
  assert.ok(both.length <= 4);
  assert.ok(!en(problem()).some((q) => q.startsWith("Translate") || q.startsWith("Say line")));
});
