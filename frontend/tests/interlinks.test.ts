// learnkit's interlinks.ts names Formalizer problems by id and title; they must match problems/*.json (and a linked
// concept page must exist), so a renamed or removed problem fails here, not silently on a sister site. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { INTERLINKS } from "../../vendor/learnkit/web/src/interlinks.ts";
import { PROBLEMS } from "../src/problems.ts";

test("every Formalizer problem in the shared interlinks exists here with the same title", () => {
  const refs = INTERLINKS.flatMap((l) => [l.a, l.b]).filter((r) => r.site === "formalizer");
  assert.ok(refs.length > 0);
  for (const r of refs) {
    if (r.page) {
      assert.match(r.id, /^concept\/[a-z-]+$/, r.id);
      continue;
    }
    const p = PROBLEMS.find((q) => q.id === r.id);
    assert.ok(p, `no Formalizer problem ${r.id}`);
    assert.equal(r.title.en, p!.title[0], `${r.id}: English title`);
    assert.equal(r.title["zh-Hant"], p!.title[1], `${r.id}: Chinese title`);
  }
});
