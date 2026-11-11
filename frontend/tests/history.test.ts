// The History page and UI strings: complete in English and Traditional Chinese, sourced. Run: npm test
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { ERAS, HISTORY } from "../src/history.ts";
import { LANGS, STRINGS } from "../src/strings.ts";

const filled = (row: readonly string[]) => row.length === LANGS.length && row.every((s) => s.trim().length > 0);

test("every UI string has English and Traditional Chinese", () => {
  const missing = Object.entries(STRINGS)
    .filter(([, row]) => !filled(row))
    .map(([k]) => k);
  assert.deepEqual(missing, []);
});

test("every history card is complete in both languages and cites https sources", () => {
  const eraIds = new Set(ERAS.map((e) => e.id));
  const ids = new Set<string>();
  assert.ok(HISTORY.length >= 15, `only ${HISTORY.length} cards`);
  for (const c of HISTORY) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`);
    ids.add(c.id);
    assert.match(c.id, /^[a-z0-9-]+$/, c.id);
    assert.ok(eraIds.has(c.era), `${c.id}: unknown era ${c.era}`);
    assert.match(c.year, /^\d{4}(–\d{4})?$/, `${c.id}: year ${c.year}`);
    assert.ok(filled(c.title), `${c.id}: title`);
    assert.ok(c.body.length > 0 && c.body.every(filled), `${c.id}: body`);
    assert.ok(c.sources.length > 0, `${c.id}: no source`);
    for (const s of c.sources) assert.match(s.url, /^https?:\/\//, `${c.id}: ${s.url}`);
  }
  for (const e of ERAS) assert.ok(filled(e.title) && (!e.intro || filled(e.intro)), e.id);
});

test("cards run forward in time within the page", () => {
  const start = (y: string) => Number(y.slice(0, 4));
  for (let i = 1; i < HISTORY.length; i++)
    assert.ok(
      start(HISTORY[i].year) >= start(HISTORY[i - 1].year) || HISTORY[i].era !== HISTORY[i - 1].era,
      `${HISTORY[i - 1].id} → ${HISTORY[i].id}`,
    );
});

test("inline code and maths are balanced in every text", () => {
  const texts = [...HISTORY.flatMap((c) => [...c.title, ...c.body.flat()]), ...Object.values(STRINGS).flat()];
  for (const s of texts) {
    assert.equal((s.match(/`/g) ?? []).length % 2, 0, `unbalanced \` in: ${s.slice(0, 60)}`);
    assert.equal((s.replace(/\\\$/g, "").match(/\$/g) ?? []).length % 2, 0, `unbalanced $ in: ${s.slice(0, 60)}`);
  }
});

test("every history card has a picture on disk, with alt text; photos credit and link their source", () => {
  for (const c of HISTORY) {
    assert.ok(c.image, `${c.id}: no picture`);
    const { src, alt, credit, creditUrl } = c.image;
    assert.ok(existsSync(new URL(`../public/${src}`, import.meta.url)), `${c.id}: missing public/${src}`);
    assert.ok(filled(alt), `${c.id}: alt text`);
    assert.ok(credit.trim(), `${c.id}: credit`);
    if (src.endsWith(".webp")) assert.match(creditUrl ?? "", /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, `${c.id}: source link`);
  }
});
