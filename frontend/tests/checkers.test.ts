// The checkers' picker and chips (src/checkers.ts): what can be picked where, and how answers show.
import assert from "node:assert/strict";
import { test } from "node:test";
import { availability, CHECKERS, chip, DEFAULT_CHECKERS, duration, info, overall, runnable } from "../src/checkers.ts";
import type { Health } from "../src/runner.ts";

const status = (id: string, available: boolean, reason = "") => ({
  id,
  title: id,
  tier: (["comparator", "nanoda", "lean4lean"].includes(id) ? "full" : "lite") as "lite" | "full",
  available,
  reason,
  default: DEFAULT_CHECKERS.includes(id),
});
const health = (os: string, full: boolean): Health => ({
  runner: "lite",
  lean: "Lean (version 4.34.1)",
  provides: ["Init"],
  state: "ready",
  workers: 1,
  error: null,
  os,
  checkers: CHECKERS.map((c) => status(c.id, c.tier === "lite" || full, c.tier === "full" && !full ? "not available on this OS" : "")),
});

test("the catalogue matches the runner's checkers", () => {
  assert.deepEqual(
    CHECKERS.map((c) => c.id),
    ["static", "kernel+axioms", "statement-match", "leanchecker", "comparator", "nanoda", "lean4lean"],
  );
  assert.deepEqual(DEFAULT_CHECKERS, ["static", "kernel+axioms", "statement-match"]);
  for (const c of CHECKERS) assert.ok(c.title[0] && c.title[1] && c.about[0] && c.about[1], c.id);
});

test("Lite checkers for everyone, Full ones only shown, with Pro, on a runner that has them", () => {
  const windows = health("win32", false);
  const linux = health("linux", true);
  for (const c of CHECKERS.filter((x) => x.tier === "lite")) assert.equal(availability(c, windows, { full: false, pro: false }).enabled, true);
  const nanoda = info("nanoda")!;
  assert.equal(availability(nanoda, linux, { full: false, pro: true }).enabled, false); // the Problems page
  assert.match(availability(nanoda, linux, { full: true, pro: false }).reason![0], /Pro/);
  assert.match(availability(nanoda, windows, { full: true, pro: true }).reason![0], /not available on this OS/);
  assert.equal(availability(nanoda, linux, { full: true, pro: true }).enabled, true);
  assert.equal(availability(info("static")!, null, { full: false, pro: false }).enabled, false); // no runner
  const old = { ...windows, checkers: undefined };
  assert.equal(availability(info("kernel+axioms")!, old, { full: false, pro: false }).enabled, true);
  assert.equal(availability(info("static")!, old, { full: false, pro: false }).enabled, false);
  assert.deepEqual(runnable(["nanoda", "static", "leanchecker"], windows, { full: true, pro: true }), ["static", "leanchecker"]);
});

test("chips: pass, fail, unavailable, error; green only when everything that ran passed", () => {
  const o = (id: string, verdict: "pass" | "fail" | "unavailable" | "error") => ({ id, verdict, message: "", ms: 1200 });
  assert.equal(chip(o("static", "pass")).glyph, "✓");
  assert.equal(chip(o("static", "fail")).glyph, "✗");
  assert.equal(chip(o("nanoda", "unavailable")).glyph, "–");
  assert.equal(chip(o("leanchecker", "error")).glyph, "!");
  assert.equal(overall([o("static", "pass"), o("nanoda", "unavailable")]), "green");
  assert.equal(overall([o("static", "pass"), o("statement-match", "fail")]), "red");
  assert.equal(overall([o("nanoda", "unavailable")]), "none");
  assert.equal(duration(1200), "1.2 s");
  assert.equal(duration(42.4), "42 ms");
});
