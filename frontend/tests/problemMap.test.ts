import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { colourOf, COLOURS, parseMapFile, proofNodes, statementAs2D, statementNodes, type MapFile } from "../src/problemMap.ts";

const read = (id: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../public/problems/${id}.map.json`, import.meta.url)), "utf8")) as MapFile;

test("gauss: the statement rests on sumTo and ℕ; the reference proof on propext", () => {
  const map = parseMapFile(read("gauss"));
  const s = map.statement;
  const ids = new Set(s.nodes.map((n) => n.id));
  assert.ok(ids.has("gauss") && ids.has("sumTo") && ids.has("Nat"));
  assert.ok(s.edges.some((e) => e.from === "gauss" && e.to === "sumTo"));
  const nodes = statementNodes(s);
  const gauss = nodes.find((n) => n.id === "gauss")!;
  assert.equal(gauss.root, true);
  assert.equal(colourOf(gauss), COLOURS.own);
  assert.equal(colourOf(nodes.find((n) => n.id === "Nat")!), COLOURS.core);
  const proof = proofNodes(map.proof);
  assert.equal(colourOf(proof.find((n) => n.id === "propext")!), COLOURS.axiom);
  // the 2D fallback draws the same nodes and edges
  const flat = statementAs2D(s);
  assert.equal(flat.nodes.length, s.nodes.length);
  assert.equal(flat.edges.length, s.edges.length);
});

test("a Mathlib statement: blue library nodes, the three axioms in gold", () => {
  const map = parseMapFile(read("geo-pythagoras-euclid"));
  const nodes = statementNodes(map.statement);
  assert.ok(nodes.some((n) => n.module.startsWith("Mathlib") && colourOf(n) !== COLOURS.core));
  for (const a of ["propext", "Quot.sound", "Classical.choice"]) assert.equal(colourOf(nodes.find((n) => n.id === a)!), COLOURS.axiom);
});
