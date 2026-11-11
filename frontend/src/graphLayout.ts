/** Layered left-to-right layout of a dependency graph (see DepGraph.tsx). Pure, so it is tested without a browser. */
import type { Graph, GraphNode } from "./runner";

export const H = 28;
export const GAP_Y = 12;
const GAP_X = 56;
const PAD = 12;
const CHAR = 6.8; // px per character at 11 px monospace

/** `lemmas(n)`: "1 lemma" / "27 lemmas" in the page language */
export const label = (n: GraphNode, lemmas: (n: number) => string) =>
  n.kind === "tactics" ? `${n.label} · ${lemmas(n.count ?? 0)}` : n.id;

export function layout(graph: Graph, lemmas: (n: number) => string = (n) => `${n} lemmas`) {
  const ids = graph.nodes.map((n) => n.id);
  const out = new Map<string, string[]>(ids.map((i) => [i, []]));
  const into = new Map<string, string[]>(ids.map((i) => [i, []]));
  for (const e of graph.edges) {
    if (!out.has(e.from) || !out.has(e.to) || e.from === e.to) continue;
    out.get(e.from)!.push(e.to);
    into.get(e.to)!.push(e.from);
  }
  // column = longest path from a root (bounded, so a cycle can't loop forever)
  const col = new Map<string, number>();
  const roots = graph.roots.filter((r) => out.has(r));
  const queue: string[] = roots.length ? [...roots] : ids.filter((i) => !into.get(i)!.length);
  for (const r of queue) col.set(r, 0);
  for (let i = 0; i < queue.length && i < ids.length * ids.length; i++) {
    const n = queue[i];
    for (const m of out.get(n)!) {
      const c = col.get(n)! + 1;
      if ((col.get(m) ?? -1) < c && c < ids.length) {
        col.set(m, c);
        queue.push(m);
      }
    }
  }
  for (const i of ids) if (!col.has(i)) col.set(i, 0);
  const last = Math.max(0, ...graph.nodes.filter((n) => n.kind !== "axiom").map((n) => col.get(n.id)!)) + 1;
  for (const n of graph.nodes) if (n.kind === "axiom") col.set(n.id, last);
  const columns: string[][] = [];
  for (const i of ids) (columns[col.get(i)!] ??= []).push(i);
  const row = new Map<string, number>();
  const nodeOf = new Map(graph.nodes.map((n) => [n.id, n]));
  const width = (i: string) => Math.max(64, label(nodeOf.get(i)!, lemmas).length * CHAR + 20);
  let x = PAD;
  const pos = new Map<string, { x: number; y: number; w: number }>();
  let height = 0;
  columns.forEach((list = []) => {
    const order = list
      .map((i, k) => {
        const parents = into.get(i)!.filter((p) => row.has(p));
        const bary = parents.length ? parents.reduce((s, p) => s + row.get(p)!, 0) / parents.length : k;
        return { i, bary };
      })
      .sort((a, b) => a.bary - b.bary);
    const w = Math.max(...order.map((o) => width(o.i)), 0);
    order.forEach(({ i }, k) => {
      row.set(i, k);
      pos.set(i, { x, y: PAD + k * (H + GAP_Y), w: width(i) });
    });
    height = Math.max(height, PAD * 2 + order.length * (H + GAP_Y) - GAP_Y);
    x += w + GAP_X;
  });
  return { pos, width: x - GAP_X + PAD, height, nodeOf };
}
