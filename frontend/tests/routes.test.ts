// The site's addresses: Research moved from a header page into the Problems page's left column, and the old
// #/research addresses still lead to the same project; the home's recently viewed list.
import assert from "node:assert/strict";
import { test } from "node:test";
import { legacyResearchHash, legacyResearchRoute, parseRecent, problemsView, pushRecent, showcaseOf } from "../src/routes.ts";

const r = (page: string, tab: string | null = null, section: string | null = null) => ({ page, tab, section });

test("old #/research addresses open the Problems page's Research tab", () => {
  assert.equal(legacyResearchHash(r("research")), "#/problems/research");
  assert.equal(legacyResearchHash(r("research", "odd-sum-3f9k")), "#/problems/research/odd-sum-3f9k");
  assert.equal(legacyResearchHash(r("research", "showcase", "odd-sum")), "#/problems/research/showcase-odd-sum");
  assert.equal(legacyResearchHash(r("research", "showcase")), "#/problems/research");
  assert.deepEqual(legacyResearchRoute(r("research", "my-proof-ab12")), r("problems", "research", "my-proof-ab12"));
  // anything else is left alone
  assert.equal(legacyResearchHash(r("problems", "hello")), null);
  assert.equal(legacyResearchHash(r("home")), null);
  assert.equal(legacyResearchHash(r("concept", "method")), null);
});

test("the Problems page shows a problem or the research area", () => {
  assert.deepEqual(problemsView({ tab: "hello", section: null }), { kind: "problem", id: "hello" });
  assert.deepEqual(problemsView({ tab: null, section: null }), { kind: "problem", id: null });
  assert.deepEqual(problemsView({ tab: "research", section: null }), { kind: "research", project: null });
  assert.deepEqual(problemsView({ tab: "research", section: "x-1" }), { kind: "research", project: "x-1" });
  // a legacy route, mapped, lands on the same view
  const mapped = legacyResearchRoute(r("research", "showcase", "fib"))!;
  assert.deepEqual(problemsView(mapped), { kind: "research", project: "showcase-fib" });
  assert.equal(showcaseOf("showcase-fib"), "fib");
  assert.equal(showcaseOf("fib-ab12"), null);
  assert.equal(showcaseOf(null), null);
});

test("recently viewed problems: newest first, no repeats, at most six", () => {
  let list: string[] = [];
  for (const id of ["a", "b", "c", "a", "d", "e", "f", "g"]) list = pushRecent(list, id);
  assert.deepEqual(list, ["g", "f", "e", "d", "a", "c"]);
  assert.deepEqual(parseRecent(null), []);
  assert.deepEqual(parseRecent("not json"), []);
  assert.deepEqual(parseRecent('["x", 3, "y"]'), ["x", "y"]);
});
