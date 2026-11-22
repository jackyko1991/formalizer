// The research workspace's model: statuses placed in files, the blueprint graph, loss warnings, export zips.
import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blueprintGraph, counts, declAt, exportFiles, exportZip, importZip, lostSince, place, readZip, summarize, workable } from "../src/research/model.ts";
import { finishedFiles, SHOWCASES } from "../src/research/templates.ts";
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
  assert.deepEqual(lostSince({}, decls), []); // a version saved without a summary
});

test("an export is a runnable Lean project, and reads back exactly", () => {
  const meta = { title: "Test project", main: "main", statements: [], notes: { b: "Grönwall · 格朗沃爾" }, next: {}, statuses: { b: "sorry" as const } };
  const back = readZip(exportZip(files, meta, "test-1a2b"));
  assert.deepEqual(
    back.map((f) => f.name),
    [
      "test_project/lean-toolchain",
      "test_project/lakefile.toml",
      "test_project/TestProject.lean",
      "test_project/TestProject/Defs.lean",
      "test_project/TestProject/Lemmas.lean",
      "test_project/TestProject/Main.lean",
      "test_project/PrintAxioms.lean",
      "test_project/README.md",
      "test_project/pixi.toml",
      "test_project/.gitignore",
      "test_project/formalizer.json",
    ],
  );
  const text = (n: string) => back.find((f) => f.name === `test_project/${n}`)!.text;
  // the toolchain is the runners' own
  assert.equal(text("lean-toolchain").trim(), readFileSync(new URL("../../lean/lean-toolchain", import.meta.url), "utf8").trim());
  assert.match(text("lakefile.toml"), /name = "test_project"[\s\S]*\[\[lean_lib\]\]\nname = "TestProject"/);
  assert.doesNotMatch(text("lakefile.toml"), /mathlib/); // no file imports Mathlib
  // each file imports the ones before it, as modules of the package
  assert.equal(text("TestProject/Defs.lean"), files[0].code);
  assert.equal(text("TestProject/Lemmas.lean"), `import TestProject.Defs\n\n${files[1].code}`);
  assert.match(text("TestProject/Main.lean"), /^import TestProject\.Defs\nimport TestProject\.Lemmas\n\ntheorem main/);
  assert.equal(text("TestProject.lean"), "import TestProject.Defs\nimport TestProject.Lemmas\nimport TestProject.Main\n");
  assert.match(text("PrintAxioms.lean"), /#print axioms main/);
  const readme = text("README.md");
  for (const want of ["# Test project", "| `b` | Lemmas.lean | ◐ to prove", "Grönwall · 格朗沃爾", "https://lean-lang.org/install", "lake build", "#print axioms main", "Problems ▸ Research"])
    assert.ok(readme.includes(want), want);
  assert.doesNotMatch(readme, /cache get/);
  assert.match(text("pixi.toml"), /build = "lake build"/);
  const again = importZip(back)!;
  assert.deepEqual(again.files, files);
  assert.deepEqual(again.meta, meta);
});

test("an export with Mathlib requires it and fetches its cache; local imports are rewritten", () => {
  const mf = [
    { name: "Defs.lean", code: "import Mathlib.Tactic\n\ndef two : ℕ := 2\n" },
    { name: "Main.lean", code: "import Defs\n\ntheorem t : two = 2 := rfl\n" },
  ];
  const back = readZip(exportZip(mf, { title: "格朗沃爾", main: "t", statements: [], notes: {}, next: {} }, "gronwall-9z9z", "zh-Hant"));
  const text = (n: string) => back.find((f) => f.name.endsWith(n))!.text;
  assert.ok(back[0].name.startsWith("gronwall_9z9z/")); // a title without letters: named after the id
  assert.match(text("lakefile.toml"), /\[\[require\]\]\nname = "mathlib"[\s\S]*rev = "v4\.34\.1"/);
  assert.equal(text("Gronwall9z9z/Main.lean"), "import Gronwall9z9z.Defs\n\ntheorem t : two = 2 := rfl\n");
  assert.match(text("README.md"), /lake exe cache get/);
  assert.match(text("README.md"), /## 建置/);
  assert.match(text("pixi.toml"), /cache = "lake exe cache get"/);
});

test("older exports (the .lean files beside formalizer.json with `order`) still import", () => {
  const old = [
    { name: "Main.lean", code: "theorem main : True := trivial\n" },
    { name: "Defs.lean", code: "def f := 1\n" },
    { name: "formalizer.json", text: JSON.stringify({ title: "Old", main: "main", order: ["Defs.lean", "Main.lean"], notes: {} }) },
  ].map((e) => ({ name: e.name, text: "text" in e ? e.text! : e.code! }));
  const got = importZip(old)!;
  assert.deepEqual(got.files.map((f) => f.name), ["Defs.lean", "Main.lean"]);
  assert.equal(got.meta.title, "Old");
  assert.equal(importZip([{ name: "x.txt", text: "" }]), null);
});

// a showcase, exported, builds with real Lean (skipped where lake isn't installed)
const lake = spawnSync("lake", ["--version"], { encoding: "utf8", cwd: fileURLToPath(new URL("../../lean", import.meta.url)) }); // the runners' toolchain
test("an exported showcase builds with `lake build`", { skip: lake.status !== 0 ? "lake not found" : false, timeout: 600_000 }, () => {
  const s = SHOWCASES()[0];
  const dir = mkdtempSync(join(tmpdir(), "formalizer-export-"));
  try {
    const meta = { title: "Odd sum", main: s.main, statements: s.statements, notes: {}, next: {} };
    for (const f of exportFiles(finishedFiles(s), meta, "odd-sum")) {
      mkdirSync(dirname(join(dir, f.name)), { recursive: true });
      writeFileSync(join(dir, f.name), f.text);
    }
    const root = join(dir, "odd_sum");
    const built = spawnSync("lake", ["build"], { cwd: root, encoding: "utf8" });
    assert.equal(built.status, 0, built.stdout + built.stderr);
    const axioms = spawnSync("lake", ["env", "lean", "PrintAxioms.lean"], { cwd: root, encoding: "utf8" });
    assert.equal(axioms.status, 0, axioms.stdout + axioms.stderr);
    assert.doesNotMatch(axioms.stdout, /sorryAx/);
    assert.match(axioms.stdout, /odd_sum_eq_square/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
