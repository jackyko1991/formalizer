// Every problem has its maths picture (as Tensorizer's diagram.svg): frontend/public/problems/<id>.svg, a static,
// self-described SVG. Run: npm test
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { PROBLEMS } from "../src/problems.ts";

const dir = fileURLToPath(new URL("../public/problems/", import.meta.url));

test("every problem has a picture", () => {
  assert.deepEqual(
    PROBLEMS.filter((p) => !existsSync(`${dir}${p.id}.svg`)).map((p) => p.id),
    [],
  );
});

test("each picture is a small, static SVG that says what it shows", () => {
  for (const p of PROBLEMS) {
    const file = `${dir}${p.id}.svg`;
    if (!existsSync(file)) continue;
    const svg = readFileSync(file, "utf8");
    assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${p.id}: starts with <svg xmlns>`);
    assert.match(svg, /viewBox="[\d. -]+"/, `${p.id}: viewBox`);
    assert.match(svg, /role="img"/, `${p.id}: role="img"`);
    assert.ok(/aria-label="[^"]{20,}"/.test(svg) || /<title>[^<]{20,}<\/title>/.test(svg), `${p.id}: a description`);
    assert.doesNotMatch(svg, /<script|on\w+=|href="(?!#)/i, `${p.id}: no scripts or external links`);
    assert.ok(svg.length < 40_000, `${p.id}: under 40 kB`);
  }
});
