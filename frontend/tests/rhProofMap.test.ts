// The RH page's proof maps (frontend/public/rh/proof-map-{compact,readable}.json, from scripts/rh_map/generate.py):
// the two editions of the refactored proof (lsernau/grh-lean, 25 Nov 2026), and proof-map-original.json, the source
// as published (20 Nov 2026). The totals add up, the statement and the
// main theorem are marked, links are in range, Main.lean reaches every file, and the files stay small enough to draw.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  EDITIONS,
  githubUrl,
  ORIGINAL,
  parseProofMap,
  type RawProofMap,
} from "../src/rh/proofMap.ts";

for (const edition of EDITIONS.filter((e) => e !== "original")) {
  const file = fileURLToPath(
    new URL(`../public/rh/proof-map-${edition}.json`, import.meta.url),
  );
  const map = parseProofMap(
    JSON.parse(readFileSync(file, "utf8")) as RawProofMap,
  );

  test(`${edition}: the map is of the refactored proof, and its districts add up to its totals`, () => {
    assert.equal(map.meta.repo, "lsernau/grh-lean");
    assert.equal(map.meta.root, edition === "compact" ? "grh-compact" : "grh");
    assert.ok(map.meta.commit.startsWith("72fead10"), map.meta.commit);
    assert.equal(
      map.districts.reduce((n, d) => n + d.files, 0),
      map.meta.files,
    );
    assert.equal(
      map.districts.reduce((n, d) => n + d.lines, 0),
      map.meta.lines,
    );
    assert.equal(map.districts.length, map.meta.districts);
    assert.equal(map.meta.reachable.files, map.meta.files);
    assert.deepEqual(
      new Set(map.districts.map((d) => d.top)),
      new Set(["Lib", "New", "Main", "Statements"]),
    );
  });

  test(`${edition}: the statement and the main theorem are districts of their own, and every link is in range`, () => {
    const names = map.districts.map((d) => d.name);
    for (const path of [map.meta.statement, map.meta.main])
      assert.ok(
        names.includes(path.replace(/^src\//, "").replace(/\.lean$/, "")),
        path,
      );
    const n = map.districts.length;
    for (const [a, b, w] of map.links)
      assert.ok(
        a >= 0 && a < n && b >= 0 && b < n && a !== b && w > 0,
        `${a}→${b}`,
      );
    assert.equal(map.links.length, map.meta.links);
    assert.ok(n < 300 && statSync(file).size < 200 * 1024, `${n} districts`);
    assert.equal(
      githubUrl(map.meta, "Statements", true),
      `https://github.com/lsernau/grh-lean/blob/${map.meta.commit}/${map.meta.root}/src/Statements.lean`,
    );
  });
}

test("original: the map before the refactor has the published proof's totals", () => {
  const file = fileURLToPath(
    new URL("../public/rh/proof-map-original.json", import.meta.url),
  );
  const map = parseProofMap(
    JSON.parse(readFileSync(file, "utf8")) as RawProofMap,
  );
  assert.equal(map.meta.commit, ORIGINAL.commit);
  assert.equal(map.meta.files, ORIGINAL.files);
  assert.equal(map.meta.lines, ORIGINAL.lines);
  assert.equal(map.districts.length, ORIGINAL.districts);
  assert.equal(
    map.districts.reduce((n, d) => n + d.lines, 0),
    map.meta.lines,
  );
  const n = map.districts.length;
  for (const [a, b, w] of map.links)
    assert.ok(
      a >= 0 && a < n && b >= 0 && b < n && a !== b && w > 0,
      `${a}→${b}`,
    );
  assert.ok(statSync(file).size < 2.5 * 1024 * 1024);
});
