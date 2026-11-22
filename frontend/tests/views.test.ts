// The Views page's portraits: small files in frontend/public/views/, each credited in CREDITS.md and referenced by
// Views.tsx with its Commons file page. Run: npm test
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../public/views/", import.meta.url));
const page = readFileSync(fileURLToPath(new URL("../src/pages/concept/Views.tsx", import.meta.url)), "utf8");
const credits = readFileSync(`${dir}CREDITS.md`, "utf8");
const photos = readdirSync(dir).filter((f) => /\.(webp|jpg)$/.test(f));

test("each portrait is small, credited and used", () => {
  assert.ok(photos.length > 0);
  for (const f of photos) {
    assert.ok(statSync(`${dir}${f}`).size <= 30_000, `${f}: at most 30 kB`);
    assert.ok(credits.includes(`\`${f}\``), `${f}: listed in CREDITS.md`);
    assert.ok(page.includes(`"views/${f}"`), `${f}: used by Views.tsx`);
  }
});

test("every photo the page uses exists and links its Commons file page", () => {
  const used = [...page.matchAll(/src: "views\/([^"]+)"[^}]*file: `\$\{COMMONS\}([^`]+)`/g)];
  assert.equal(used.length, photos.length);
  for (const m of used) {
    assert.ok(photos.includes(m[1]), `${m[1]}: exists`);
    assert.ok(credits.includes(`/File:${m[2]}>`), `${m[1]}: same Commons file as CREDITS.md`);
  }
});
