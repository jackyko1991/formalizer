// The Mathlib map (#/skills/mathlib): the generated data in public/mathlib is consistent (every theorem's graph reaches
// each of its axioms, the guided paths follow edges, the tours' theorems exist, the whole stays small), and the pure
// functions of src/mathlib/data.ts (areas, links, search, paths, trees) behave. Run: npm test
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  areaOf,
  docsUrl,
  matchScore,
  parseGraph,
  reachable,
  search,
  shortestPath,
  sourceUrl,
  spanningTree,
  type Galaxy,
  type MathlibIndex,
  type RawGraph,
  type TreeNode,
} from "../src/mathlib/data.ts";

const dir = fileURLToPath(new URL("../public/mathlib/", import.meta.url));
const json = <T>(p: string): T => JSON.parse(readFileSync(dir + p, "utf8")) as T;
const index = json<MathlibIndex>("index.json");
const galaxy = json<Galaxy>("galaxy.json");
const AXIOMS = ["propext", "Quot.sound", "Classical.choice"];

test("the data is generated (not the sample) and stays under 5 MB", () => {
  assert.equal(index.meta.sample, false);
  assert.ok(index.theorems.length >= 40, `${index.theorems.length} theorems`);
  let total = 0;
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const s = statSync(d + f);
      if (s.isDirectory()) walk(d + f + "/");
      else total += s.size;
    }
  };
  walk(dir);
  assert.ok(total < 5e6, `${total} bytes`);
});

test("every theorem's graph: root first, edges in range, axioms reachable, the guided path follows edges", () => {
  for (const t of index.theorems) {
    const g = parseGraph(json<RawGraph>(t.file));
    assert.equal(g.root, t.name);
    assert.equal(g.nodes[0].name, t.name);
    assert.equal(g.nodes[0].depth, 0);
    for (const [a, b] of g.edges) assert.ok(a < g.nodes.length && b < g.nodes.length, t.name);
    const below = reachable(g, 0);
    for (const a of t.axioms) {
      const i = g.nodes.findIndex((n) => n.name === a);
      assert.ok(i >= 0 && below.has(i), `${t.name}: ${a} not reachable`);
      assert.equal(g.nodes[i].kind, "axiom");
    }
    const edges = new Set(g.edges.map(([a, b]) => `${a}>${b}`));
    for (let k = 0; k + 1 < g.path.length; k++) assert.ok(edges.has(`${g.path[k]}>${g.path[k + 1]}`), `${t.name}: path step ${k}`);
    for (const n of g.nodes) assert.ok(n.module, `${n.name} has no module`);
    // every drawn declaration is in the search index
    for (const n of g.nodes) assert.ok(index.names[n.name], n.name);
  }
});

test("famous facts about the axioms hold in the data", () => {
  const ax = (name: string) => index.theorems.find((t) => t.name === name)?.axioms.slice().sort();
  assert.deepEqual(ax("Nat.add_comm"), []);
  assert.deepEqual(ax("funext"), ["Quot.sound"]);
  assert.deepEqual(ax("Classical.em"), [...AXIOMS].sort());
  assert.deepEqual(ax("Function.cantor_surjective"), []);
});

test("the guided tours start at their theorem and end at an axiom", async () => {
  // Tours.tsx imports React components; read its TOURS by name instead
  const src = readFileSync(fileURLToPath(new URL("../src/mathlib/Tours.tsx", import.meta.url)), "utf8");
  const tours = [...src.matchAll(/theorem: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(tours.length >= 4);
  for (const name of tours) {
    const t = index.theorems.find((e) => e.name === name);
    assert.ok(t, `tour theorem ${name} not in the data`);
    const g = parseGraph(json<RawGraph>(t.file));
    assert.ok(g.path.length >= 4, `${name}: path too short`);
    assert.equal(g.path[0], 0);
    assert.ok(AXIOMS.includes(g.nodes[g.path.at(-1)!].name), `${name} ends at ${g.nodes[g.path.at(-1)!].name}`);
  }
});

test("areas, documentation and source links", () => {
  assert.equal(areaOf("Mathlib.Analysis.Calculus.Deriv.Basic").id, "analysis");
  assert.equal(areaOf("Mathlib.NumberTheory.Wilson").id, "number");
  assert.equal(areaOf("Init.Prelude").id, "core");
  assert.equal(areaOf("Init.Core", "axiom").id, "axiom");
  assert.equal(
    docsUrl("Mathlib.NumberTheory.Wilson", "ZMod.wilsons_lemma"),
    "https://leanprover-community.github.io/mathlib4_docs/Mathlib/NumberTheory/Wilson.html#ZMod.wilsons_lemma",
  );
  assert.equal(
    sourceUrl("Mathlib.NumberTheory.Wilson", 12, { lean: "v4.34.1", packages: { mathlib: "v4.34.1" } }),
    "https://github.com/leanprover-community/mathlib4/blob/v4.34.1/Mathlib/NumberTheory/Wilson.lean#L12",
  );
  assert.equal(sourceUrl("Init.Prelude", 0, { lean: "v4.34.1", packages: {} }), "https://github.com/leanprover/lean4/blob/v4.34.1/src/Init/Prelude.lean");
});

test("search: by name, by keyword in either language, by module", () => {
  assert.ok(matchScore("pow_card", "ZMod.pow_card_sub_one_eq_one") > matchScore("pow_card", "Foo.xpow_cardy"));
  assert.equal(matchScore("fermat little", "Fermat's little theorem"), matchScore("little fermat", "Fermat's little theorem"));
  assert.equal(matchScore("fermat zzz", "Fermat's little theorem"), 0);
  const first = (q: string) => search(index, galaxy, q)[0];
  assert.equal(first("Fermat's little").name, "ZMod.pow_card_sub_one_eq_one");
  assert.equal(first("費馬小定理").name, "ZMod.pow_card_sub_one_eq_one");
  assert.equal(first("pythagoras").name, "EuclideanGeometry.dist_sq_eq_dist_sq_add_dist_sq_iff_angle_eq_pi_div_two");
  const real = search(index, galaxy, "Real.sqrt").find((h) => h.name === "Real.sqrt");
  assert.ok(real && real.kind === "decl" && real.theorems.length > 0);
  assert.ok(search(index, galaxy, "Mathlib.NumberTheory.Wilson").some((h) => h.kind === "module"));
  assert.deepEqual(search(index, galaxy, "   "), []);
});

test("paths and the spanning tree on a small graph", () => {
  // 0 → 1 → 3, 0 → 2 → 3, 3 → 4
  const g = parseGraph({
    root: "a",
    fields: [],
    nodes: ["a", "b", "c", "d", "e"].map((n, i) => [n, i === 4 ? "axiom" : "thm", "Mathlib.Logic.Basic", i, 0, "", "", 0]),
    edges: [0, 1, 0, 2, 1, 3, 2, 3, 3, 4],
    path: [0, 1, 3, 4],
    axioms: ["e"],
  });
  assert.deepEqual(shortestPath(g, 0, 4), [0, 1, 3, 4]);
  assert.equal(shortestPath(g, 4, 0), null);
  assert.deepEqual([...reachable(g, 2)].sort(), [2, 3, 4]);
  const tree = spanningTree(g, 0);
  const flat = (t: TreeNode): string[] => [`${t.node}${t.repeat ? "*" : ""}`, ...t.children.flatMap(flat)];
  assert.deepEqual(flat(tree), ["0", "1", "3", "4", "2", "3*"]);
});
