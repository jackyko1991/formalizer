/**
 * The two-layer map of a problem or project (TwoLayerMap.tsx draws it):
 *
 * 1. what the statement rests on: `#statement_graph` (lean/Formalizer/DepGraph.lean), the closure of the theorems'
 *    types down to the axioms, pruned to at most 120 nodes;
 * 2. how the proof is built: `#dep_graph`, pruned by the runner (backend/check.py prune_graph).
 *
 * Library problems have both precomputed in frontend/public/problems/<id>.map.json (scripts/problem_maps/generate.py),
 * with edges as index pairs; a check with `maps` sends the first layer live (`statementGraph`).
 */
import type { Graph, GraphNode } from "./runner";

export type L = readonly [string, string];

export interface StatementNode {
  id: string;
  kind: "theorem" | "def" | "type" | "class" | "structure" | "axiom" | "opaque" | "quot" | "other";
  /** "" for the checked file itself */
  module: string;
  /** steps from the nearest root (the statement) */
  depth: number;
  /** written in the checked file (the statement and the reader's own definitions) */
  own: boolean;
  /** its dependencies left out of the picture */
  hidden: number;
}
export interface StatementGraph {
  roots: string[];
  nodes: StatementNode[];
  edges: { from: string; to: string }[];
  /** how many declarations the statements rest on in all (the picture shows at most 120) */
  closure: number;
  truncated: boolean;
  /** every axiom in the closure */
  axioms: string[];
}
export interface ProblemMap {
  statement: StatementGraph;
  proof: Graph;
}

interface Compact<N> {
  nodes: N[];
  edges: number[];
}
export interface MapFile {
  v: number;
  id: string;
  runner: string;
  statement: Omit<StatementGraph, "edges"> & Compact<StatementNode>;
  proof: Omit<Graph, "edges"> & Compact<GraphNode>;
}

function expandEdges(nodes: { id: string }[], flat: number[]): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  for (let k = 0; k + 1 < flat.length; k += 2) {
    const a = nodes[flat[k]];
    const b = nodes[flat[k + 1]];
    if (a && b) out.push({ from: a.id, to: b.id });
  }
  return out;
}

/** A map file as the page uses it (edges by name, as the runner sends them). */
export function parseMapFile(file: MapFile): ProblemMap {
  return {
    statement: { ...file.statement, edges: expandEdges(file.statement.nodes, file.statement.edges) },
    proof: { ...file.proof, edges: expandEdges(file.proof.nodes, file.proof.edges) },
  };
}

export async function loadProblemMap(id: string): Promise<ProblemMap> {
  const res = await fetch(`${import.meta.env.BASE_URL}problems/${id}.map.json`);
  if (!res.ok) throw new Error(`no map for ${id} (HTTP ${res.status})`);
  return parseMapFile(await res.json());
}

// ------------------------------------------------------------------------------------------- one shape for both

/** A node of either layer, as the 3D view and its card need it. */
export interface MapNode {
  id: string;
  /** own (the statement, the reader's theorems and definitions) · library · tactics · axiom · sorry (sorryAx) */
  group: "own" | "library" | "tactics" | "axiom" | "sorry";
  kind: string;
  module: string;
  /** a root: a theorem of the problem */
  root: boolean;
  /** the reader's declaration still has `sorry` in its proof */
  open: boolean;
  label: string;
}

export function statementNodes(g: StatementGraph): MapNode[] {
  const roots = new Set(g.roots);
  return g.nodes.map((n) => ({
    id: n.id,
    group: n.id === "sorryAx" ? "sorry" : n.kind === "axiom" ? "axiom" : n.own ? "own" : "library",
    kind: n.kind,
    module: n.module,
    root: roots.has(n.id),
    open: false,
    label: n.id,
  }));
}

export function proofNodes(g: Graph): MapNode[] {
  const roots = new Set(g.roots);
  return g.nodes.map((n) => ({
    id: n.id,
    group: n.id === "sorryAx" ? "sorry" : n.kind === "axiom" ? "axiom" : n.kind === "tactics" ? "tactics" : n.kind === "library" ? "library" : "own",
    kind: n.kind,
    module: "",
    root: roots.has(n.id),
    open: n.status === "sorry" && n.kind !== "axiom",
    label: n.kind === "tactics" ? `${n.label ?? "tactics"} · ${n.count ?? 0}` : n.id,
  }));
}

/** Colours: the reader's own teal (amber while it has `sorry`), library grey (core Lean) or blue (Mathlib, a shade per
 * area), axioms gold, `sorryAx` red. */
export const COLOURS = {
  own: "#14b8a6",
  open: "#f59e0b",
  core: "#94a3b8",
  tactics: "#cbd5e1",
  axiom: "#facc15",
  sorry: "#ef4444",
  mathlib: "#60a5fa",
} as const;

const MATHLIB_SHADES: Record<string, string> = {
  Data: "#3b82f6",
  Algebra: "#60a5fa",
  Order: "#818cf8",
  Logic: "#a5b4fc",
  SetTheory: "#a5b4fc",
  Topology: "#38bdf8",
  Analysis: "#0ea5e9",
  NumberTheory: "#2563eb",
  LinearAlgebra: "#7dd3fc",
  Geometry: "#93c5fd",
};

export function colourOf(n: MapNode): string {
  if (n.group === "sorry") return COLOURS.sorry;
  if (n.group === "axiom") return COLOURS.axiom;
  if (n.group === "own") return n.open ? COLOURS.open : COLOURS.own;
  if (n.group === "tactics") return COLOURS.tactics;
  const [top, second] = n.module.split(".");
  if (top === "Mathlib") return MATHLIB_SHADES[second] ?? COLOURS.mathlib;
  return COLOURS.core;
}

/** Size: the statement largest, then the reader's own, axioms, types and classes, the rest. */
export function sizeOf(n: MapNode): number {
  if (n.root) return 16;
  if (n.group === "own") return 8;
  if (n.group === "axiom" || n.group === "sorry") return 7;
  if (["type", "class", "structure"].includes(n.kind)) return 3.5;
  return 2;
}

export const KIND_WORDS: Record<string, L> = {
  theorem: ["theorem", "定理"],
  def: ["definition", "定義"],
  type: ["type", "型別"],
  class: ["type class", "型別類別"],
  structure: ["structure", "結構"],
  axiom: ["axiom", "公理"],
  opaque: ["opaque definition", "不透明定義"],
  quot: ["quotient (built into Lean)", "商型別（Lean 內建）"],
  library: ["library lemma your proof cites", "你的證明引用的函式庫引理"],
  tactics: ["lemmas the tactics used, folded", "戰術用到的引理（合併顯示）"],
  other: ["declaration", "宣告"],
};

/** Who uses whom: for the hover card. */
export function neighbours(edges: { from: string; to: string }[]): { uses: Map<string, string[]>; usedBy: Map<string, string[]> } {
  const uses = new Map<string, string[]>();
  const usedBy = new Map<string, string[]>();
  for (const e of edges) {
    if (!uses.has(e.from)) uses.set(e.from, []);
    if (!usedBy.has(e.to)) usedBy.set(e.to, []);
    uses.get(e.from)!.push(e.to);
    usedBy.get(e.to)!.push(e.from);
  }
  return { uses, usedBy };
}

/** The statement layer in the shape of the 2D dependency graph (DepGraph.tsx): own declarations, library, axioms. */
export function statementAs2D(g: StatementGraph): Graph {
  return {
    roots: g.roots,
    nodes: g.nodes.map((n) => ({
      id: n.id,
      kind: n.kind === "axiom" ? "axiom" : n.own ? (n.kind === "theorem" ? "theorem" : "def") : "library",
      status: n.kind === "axiom" ? "axiom" : n.own ? "own" : "libdef",
    })) as GraphNode[],
    edges: g.edges,
    hidden: g.nodes.reduce((s, n) => s + n.hidden, 0),
    more: 0,
  };
}

/** How deep the statement goes (the longest of the shortest paths drawn). */
export function depthOf(g: StatementGraph): number {
  return g.nodes.reduce((m, n) => Math.max(m, n.depth), 0);
}
