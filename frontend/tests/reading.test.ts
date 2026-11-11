// Further reading data (src/reading.ts): valid ISBNs, https links, both languages, no empty group. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { BOOK_GROUPS, BOOKS, isValidIsbn13, PAPER_GROUPS, PAPERS } from "../src/reading.ts";

const filled = (pair: readonly string[]) => pair.length === 2 && pair.every((s) => s.trim().length > 0);

test("every printed book has a valid ISBN-13, a publisher and a year; online books have a free link", () => {
  const ids = new Set<string>();
  for (const b of BOOKS) {
    assert.ok(!ids.has(b.id), b.id);
    ids.add(b.id);
    assert.ok(filled(b.why) && filled(b.site.label), b.id);
    if (b.publisher === "online") assert.match(b.free ?? "", /^https:\/\//, b.id);
    else assert.ok(b.isbn13 && isValidIsbn13(b.isbn13) && b.year && b.year > 1900, b.id);
    if (b.free) assert.match(b.free, /^https:\/\//, b.id);
  }
  for (const g of BOOK_GROUPS) assert.ok(filled(g.title) && BOOKS.some((b) => b.group === g.id && b.top), `${g.id}: needs a top pick`);
});

test("every paper and project links over https, in both languages", () => {
  for (const p of PAPERS) assert.ok(/^https:\/\//.test(p.url) && filled(p.why), p.id);
  for (const g of PAPER_GROUPS) assert.ok(filled(g.title) && PAPERS.some((p) => p.group === g.id), g.id);
});

test("the ISBN-13 checksum catches a wrong digit", () => {
  assert.ok(isValidIsbn13("9781108439534"));
  assert.ok(!isValidIsbn13("9781108439535"));
});
