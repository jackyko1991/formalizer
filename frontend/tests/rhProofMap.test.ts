// The RH page's proof map (frontend/public/rh/proof-map.json, from scripts/rh_map/generate.py): the totals match the
// published proof, the districts add up to them, the statement and the main theorem are marked, links are in range.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseProofMap, type RawProofMap } from "../src/rh/proofMap.ts";

const file = fileURLToPath(new URL("../public/rh/proof-map.json", import.meta.url));
const map = parseProofMap(JSON.parse(readFileSync(file, "utf8")) as RawProofMap);

test("the proof map has the published proof's totals, and its districts add up to them", () => {
  assert.equal(map.meta.commit, "40e56bab026552e089d7afcfeff08d2defb9c005");
  assert.equal(map.meta.files, 175_187);
  assert.equal(map.meta.lines, 17_374_215);
  assert.equal(map.districts.reduce((n, d) => n + d.files, 0), map.meta.files);
  assert.equal(map.districts.reduce((n, d) => n + d.lines, 0), map.meta.lines);
  assert.equal(map.districts.length, map.meta.districts);
});

test("the statement and the main theorem are districts of their own, and every link is in range", () => {
  const names = map.districts.map((d) => d.name);
  for (const path of [map.meta.statement, map.meta.main]) assert.ok(names.includes(path.replace(/^src\//, "").replace(/\.lean$/, "")), path);
  const n = map.districts.length;
  for (const [a, b, w] of map.links) assert.ok(a >= 0 && a < n && b >= 0 && b < n && a !== b && w > 0, `${a}→${b}`);
  assert.equal(map.links.length, map.meta.links);
  assert.ok(statSync(file).size < 2.5 * 1024 * 1024);
});
