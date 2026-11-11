// The research workspace's model: statuses placed in files, the blueprint graph, loss warnings, export zips.
import assert from "node:assert/strict";
import { test } from "node:test";
import { blueprintGraph, counts, declAt, exportZip, lostSince, place, readZip, summarize, workable } from "../src/research/model.ts";
import { joinFiles, type Decl } from "../src/runner.ts";
import { layout } from "../src/graphLayout.ts";

const d = (
  name: string,
  line: number,
  endLine: number,
  status: Decl["status"],
  uses: string[] = [],
  kind: Decl["kind"] = "theorem",
): Decl => ({
  name,
  kind,
  line,
  endLine,
  status,
  uses,
  sorry: status === "sorry",
  axioms: [],
});

const files = [
  { name: "Defs.lean", code: "def f : Nat → Nat\n  | n => n\n" },
  { name: "Lemmas.lean", code: "theorem a : f 0 = 0 := rfl\ntheorem b : True := by\n  sorry\n" },
  { name: "Main.lean", code: "theorem main : True := b\n" },
];
const decls = [d("f", 1, 2, "def", [], "def"), d("a", 3, 3, "proved", ["f"]), d("b", 4, 5, "sorry"), d("main", 6, 6, "depends", ["b"])];

test("declarations are placed in their files, and found from a cursor line", () => {
  const placed = place(decls, joinFiles(files).where);
  assert.deepEqual(
    placed.map((p) => [p.name, p.file, p.fileLine, p.fileEnd]),
    [
      ["f", "Defs.lean", 1, 2],
      ["a", "Lemmas.lean", 1, 1],
      ["b", "Lemmas.lean", 2, 3],
      ["main", "Main.lean", 1, 1],
    ],
  );
  assert.equal(declAt(placed, "Lemmas.lean", 3)?.name, "b");
  assert.equal(declAt(placed, "Main.lean", 9), undefined);
});

test("the blueprint starts at the main theorem and lays out without overlaps", () => {
  const g = blueprintGraph(decls, "main");
  assert.deepEqual(g.roots, ["main"]);
  assert.deepEqual(g.edges, [
    { from: "a", to: "f" },
    { from: "main", to: "b" },
  ]);
  const { pos } = layout(g);
  assert.ok(pos.get("main")!.x < pos.get("b")!.x);
  assert.deepEqual(counts(decls), { proved: 1, sorry: 1, depends: 1, error: 0, def: 1 });
  assert.deepEqual(workable(decls), ["b"]);
});

test("replacing the saved version warns about lemmas it would lose", () => {
  const saved = summarize([...decls.slice(0, 2), d("b", 4, 5, "proved")]);
  assert.deepEqual(saved.proved, ["a", "b"]);
  assert.deepEqual(lostSince(saved, decls), ["b"]);
  assert.deepEqual(lostSince(undefined, decls), []);
});

test("an export zip reads back", () => {
  const meta = { title: "T", main: "main", statements: [], notes: { b: "Grönwall · 格朗沃爾" }, next: {} };
  const back = readZip(exportZip(files, meta));
  assert.deepEqual(
    back.map((f) => f.name),
    ["Defs.lean", "Lemmas.lean", "Main.lean", "formalizer.json"],
  );
  assert.equal(back[1].text, files[1].code);
  assert.equal(JSON.parse(back[3].text).notes.b, "Grönwall · 格朗沃爾");
});
