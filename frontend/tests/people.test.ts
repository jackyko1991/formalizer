// The RH page's timeline portraits: small files in frontend/public/people/, each credited in CREDITS.md and referenced
// by Rh.tsx with its Commons file page (Buzzard's is the Views page's, public/views/). Run: npm test
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const pub = fileURLToPath(new URL("../public/", import.meta.url));
const dir = `${pub}people/`;
const page = readFileSync(fileURLToPath(new URL("../src/pages/concept/Rh.tsx", import.meta.url)), "utf8");
const credits = readFileSync(`${dir}CREDITS.md`, "utf8");
const photos = readdirSync(dir).filter((f) => /\.(webp|jpg)$/.test(f));

test("each timeline portrait is small, credited and used", () => {
  assert.ok(photos.length > 0);
  for (const f of photos) {
    assert.ok(statSync(`${dir}${f}`).size <= 30_000, `${f}: at most 30 kB`);
    assert.ok(credits.includes(`\`${f}\``), `${f}: listed in CREDITS.md`);
    assert.ok(page.includes(`"people/${f}"`), `${f}: used by Rh.tsx`);
  }
});

test("every photo Rh.tsx uses exists, is credited and links its Commons file page", () => {
  const used = [...page.matchAll(/src: "((?:people|views)\/[^"]+)"[^}]*?file: `\$\{COMMONS\}([^`]+)`/g)];
  assert.equal(used.filter((m) => m[1].startsWith("people/")).length, photos.length);
  for (const [, src, file] of used) {
    assert.ok(existsSync(`${pub}${src}`), `${src}: exists`);
    assert.ok(statSync(`${pub}${src}`).size <= 30_000, `${src}: at most 30 kB`);
    const folderCredits = readFileSync(`${pub}${src.split("/")[0]}/CREDITS.md`, "utf8");
    assert.ok(folderCredits.includes(`/File:${file}>`), `${src}: same Commons file as its CREDITS.md`);
  }
});

test("each timeline entry shows at most two people", () => {
  for (const m of page.matchAll(/faces: \[([^\]]*)\]/g)) assert.ok(m[1].split(",").length <= 2, m[0]);
});
