// Concept and Coding Skills pages: every snippet("File", "name") a page shows exists in lean/Formalizer/Pages/File.lean
// (those files are compiled by CI, so the code on the site is checked). Run: npm test
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parseSnippets } from "../src/pages/snippets.ts";

const here = new URL(".", import.meta.url).pathname;
const pages = ["concept", "skills"].flatMap((dir) =>
  readdirSync(`${here}../src/pages/${dir}`).map((f) => `${here}../src/pages/${dir}/${f}`),
);
const lean = (file: string) => readFileSync(`${here}../../lean/Formalizer/Pages/${file}.lean`, "utf8");

test("every snippet a page uses is in its Lean file", () => {
  const missing: string[] = [];
  for (const page of pages) {
    for (const m of readFileSync(page, "utf8").matchAll(/snippet\(\s*"(\w+)"\s*,\s*"([\w-]+)"\s*\)/g)) {
      if (!(m[2] in parseSnippets(lean(m[1])))) missing.push(`${page.split("/pages/")[1]}: ${m[1]}:${m[2]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("snippet blocks run to the next marker or -- end", () => {
  const s = parseSnippets("namespace X\n-- snippet: a\ntheorem a : 1 = 1 := rfl\n\n-- snippet: b\nexample : True := ⟨⟩\n-- end\nend X\n");
  assert.deepEqual(s, { a: "theorem a : 1 = 1 := rfl", b: "example : True := ⟨⟩" });
});
