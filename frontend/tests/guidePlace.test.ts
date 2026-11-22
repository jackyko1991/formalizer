// The guide window's placement (src/tutorial/place.ts): beside its target, never over it, and never over the open
// tactic list either.
import assert from "node:assert/strict";
import { test } from "node:test";
import { overlaps, placeBeside, type Rect } from "../src/tutorial/place.ts";

const VW = 1912;
const VH = 960;
const W = 300;
const H = 190;
const at = (b: { x: number; y: number }): Rect => ({ left: b.x, top: b.y, right: b.x + W, bottom: b.y + H });

test("beside the target, to its right when there is room", () => {
  const t = { left: 800, top: 300, right: 840, bottom: 318 };
  const b = placeBeside(t, W, H, VW, VH);
  assert.equal(b.x, 852);
  assert.ok(!overlaps(at(b), t));
});

test("clear of both the sorry and the tactic list opened under it", () => {
  const t = { left: 800, top: 300, right: 840, bottom: 318 };
  const list = { left: 796, top: 320, right: 1210, bottom: 610 };
  const b = placeBeside(t, W, H, VW, VH, [list]);
  assert.ok(!overlaps(at(b), t), "not over the target");
  assert.ok(!overlaps(at(b), list), "not over the list");
  assert.ok(b.x >= 8 && b.x + W <= VW - 8 && b.y >= 8 && b.y + H <= VH - 8, "on screen");
});

test("a list that leaves no room beside: still on screen and clear of the target", () => {
  const t = { left: 10, top: 70, right: 40, bottom: 90 };
  const list = { left: 0, top: 0, right: VW, bottom: VH - 20 };
  const b = placeBeside(t, W, H, VW, VH, [list]);
  assert.ok(!overlaps(at(b), t));
  assert.ok(b.x >= 0 && b.x + W <= VW && b.y + H <= VH);
});
