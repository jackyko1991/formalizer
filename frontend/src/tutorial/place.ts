/** Where the guide window goes (tutorial/GuideWindow.tsx): beside what it explains, clear of it and of anything else
 *  it must not cover (the open tactic list). Pure, for node tests. */

export interface Box {
  x: number;
  y: number;
}
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const GAP = 12;
export const overlaps = (a: Rect, b: Rect) => a.left < b.right + 4 && a.right + 4 > b.left && a.top < b.bottom + 4 && a.bottom + 4 > b.top;
const union = (rs: readonly Rect[]): Rect => ({
  left: Math.min(...rs.map((r) => r.left)),
  top: Math.min(...rs.map((r) => r.top)),
  right: Math.max(...rs.map((r) => r.right)),
  bottom: Math.max(...rs.map((r) => r.bottom)),
});

/** Beside the target where there is room (right, left, below, above), then beside the target and the rects to avoid
 *  taken together, else a corner; every spot must fit on screen and touch neither the target nor `avoid`. */
export function placeBeside(t: Rect | null, w: number, h: number, vw: number, vh: number, avoid: readonly Rect[] = []): Box {
  const top = 60;
  const clampY = (y: number) => Math.min(Math.max(top, y), vh - h - 8);
  const clampX = (x: number) => Math.min(Math.max(8, x), vw - w - 8);
  const around = (r: Rect): Box[] => [
    { x: r.right + GAP, y: clampY(r.top) },
    { x: r.left - w - GAP, y: clampY(r.top) },
    { x: clampX(r.left), y: r.bottom + GAP },
    { x: clampX(r.left), y: r.top - h - GAP },
  ];
  const keep = [...(t ? [t] : []), ...avoid];
  const spots: Box[] = [...(t ? around(t) : []), ...(avoid.length ? around(union(keep)) : [])];
  spots.push({ x: vw - w - 24, y: vh - h - 110 }, { x: 24, y: vh - h - 60 }, { x: vw - w - 24, y: top }, { x: 24, y: top });
  const fits = (s: Box) => s.x >= 8 && s.y >= 8 && s.x + w <= vw - 8 && s.y + h <= vh - 8;
  const rect = (s: Box): Rect => ({ left: s.x, top: s.y, right: s.x + w, bottom: s.y + h });
  const clearOf = (rs: readonly Rect[]) => (s: Box) => fits(s) && rs.every((k) => !overlaps(rect(s), k));
  // clear of everything; else at least clear of the target; else the last corner
  return spots.find(clearOf(keep)) ?? spots.find(clearOf(t ? [t] : [])) ?? spots[spots.length - 1];
}
