/**
 * The Mathlib map's data (frontend/public/mathlib, written by scripts/mathlib_graph/generate.py) and the pure
 * functions on it: areas and colours, documentation / source links, search, paths and trees. No React here, so the
 * tests (tests/mathlib.test.ts) run it under plain Node.
 */

/** [English, Traditional Chinese] */
export type L = readonly [string, string];

export interface Meta {
  sample: boolean;
  generated: string;
  lean: string;
  mathlib: string;
  packages: Record<string, string>;
  modules: number;
  maxNodes: number;
}

/** One curated theorem, as listed in index.json. */
export interface TheoremEntry {
  name: string;
  en: string;
  zh: string;
  module: string;
  sig: string;
  line: number;
  /** declarations in its full dependency closure (instances and auxiliary declarations collapsed) */
  closure: number;
  axioms: string[];
  /** declarations of the closure per area (second component of the module, e.g. "Algebra") */
  areas: Record<string, number>;
  /** longest shortest-path from the theorem in its closure */
  depth: number;
  file: string;
}

export interface MathlibIndex {
  meta: Meta;
  theorems: TheoremEntry[];
  /** every declaration shown in some theorem's graph → the theorems (indices) whose graph shows it */
  names: Record<string, number[]>;
}

export type Kind = "thm" | "def" | "axiom" | "inductive" | "structure" | "class" | "quot" | "opaque" | "other";

export interface GNode {
  name: string;
  kind: Kind;
  module: string;
  /** distance from the theorem (0 = the theorem itself) */
  depth: number;
  /** dependencies of this declaration that the pruned graph leaves out */
  hidden: number;
  sig: string;
  doc: string;
  line: number;
}

export interface TheoremGraph {
  root: string;
  nodes: GNode[];
  /** [from, to]: `from` uses `to` */
  edges: [number, number][];
  /** the guided path, node indices, from the theorem down */
  path: number[];
  axioms: string[];
}

export interface RawGraph {
  root: string;
  fields: string[];
  nodes: (string | number)[][];
  edges: number[];
  path: number[];
  axioms: string[];
}

export function parseGraph(raw: RawGraph): TheoremGraph {
  const nodes = raw.nodes.map(([name, kind, module, depth, hidden, sig, doc, line]) => ({
    name: name as string,
    kind: kind as Kind,
    module: module as string,
    depth: depth as number,
    hidden: hidden as number,
    sig: sig as string,
    doc: doc as string,
    line: line as number,
  }));
  const edges: [number, number][] = [];
  for (let i = 0; i + 1 < raw.edges.length; i += 2) edges.push([raw.edges[i], raw.edges[i + 1]]);
  return { root: raw.root, nodes, edges, path: raw.path, axioms: raw.axioms };
}

export interface Galaxy {
  /** [name, theorems, definitions, district] */
  modules: [string, number, number, number][];
  /** [name, modules, theorems, definitions] */
  districts: [string, number, number, number][];
  /** [from district, to district, imports]: modules of `from` import modules of `to` */
  links: [number, number, number][];
}

// ---------------------------------------------------------------- areas

export interface Area {
  id: string;
  label: L;
  color: string;
}

export const AREAS: Area[] = [
  { id: "axiom", label: ["Axiom", "公理"], color: "#f59e0b" },
  { id: "core", label: ["Lean core (logic, ℕ, lists)", "Lean 核心（邏輯、ℕ、串列）"], color: "#64748b" },
  { id: "logic", label: ["Logic & set theory", "邏輯與集合論"], color: "#8b5cf6" },
  { id: "order", label: ["Order", "序"], color: "#ec4899" },
  { id: "data", label: ["Data (ℤ, ℚ, ℝ, sets, finsets…)", "資料（ℤ、ℚ、ℝ、集合、有限集…）"], color: "#3b82f6" },
  { id: "algebra", label: ["Algebra", "代數"], color: "#10b981" },
  { id: "linear", label: ["Linear algebra", "線性代數"], color: "#14b8a6" },
  { id: "number", label: ["Number theory", "數論"], color: "#eab308" },
  { id: "topology", label: ["Topology", "拓撲"], color: "#06b6d4" },
  { id: "analysis", label: ["Analysis", "分析"], color: "#ef4444" },
  { id: "measure", label: ["Measure & probability", "測度與機率"], color: "#f97316" },
  { id: "geometry", label: ["Geometry", "幾何"], color: "#84cc16" },
  { id: "combinatorics", label: ["Combinatorics", "組合"], color: "#d946ef" },
  { id: "category", label: ["Category theory", "範疇論"], color: "#6366f1" },
  { id: "other", label: ["Other", "其他"], color: "#94a3b8" },
];
const AREA_BY_ID = Object.fromEntries(AREAS.map((a) => [a.id, a]));

const MATHLIB_AREA: Record<string, string> = {
  Logic: "logic",
  SetTheory: "logic",
  ModelTheory: "logic",
  Computability: "logic",
  Order: "order",
  Data: "data",
  Algebra: "algebra",
  GroupTheory: "algebra",
  RingTheory: "algebra",
  FieldTheory: "algebra",
  RepresentationTheory: "algebra",
  AlgebraicGeometry: "algebra",
  LinearAlgebra: "linear",
  NumberTheory: "number",
  Topology: "topology",
  AlgebraicTopology: "topology",
  Analysis: "analysis",
  Dynamics: "analysis",
  MeasureTheory: "measure",
  Probability: "measure",
  InformationTheory: "measure",
  Geometry: "geometry",
  Combinatorics: "combinatorics",
  CategoryTheory: "category",
  Init: "core",
  Tactic: "core",
  Util: "core",
  Lean: "core",
  Control: "core",
  Testing: "core",
};

/** The area of a module ("Mathlib.Analysis.Calculus.Deriv.Basic" → analysis; "Init.Prelude" → core). */
export function areaOf(module: string, kind?: Kind): Area {
  if (kind === "axiom") return AREA_BY_ID.axiom;
  const [top, second] = module.split(".");
  if (top === "Mathlib") return AREA_BY_ID[MATHLIB_AREA[second] ?? "other"];
  if (["Init", "Std", "Lean", "Batteries"].includes(top)) return AREA_BY_ID.core;
  return AREA_BY_ID.other;
}

// ---------------------------------------------------------------- links

export const DOCS = "https://leanprover-community.github.io/mathlib4_docs";

/** The declaration's page in the Mathlib documentation (which also covers core Lean and Batteries). */
export function docsUrl(module: string, name?: string): string {
  return `${DOCS}/${module.split(".").join("/")}.html${name ? `#${name}` : ""}`;
}

/** The declaration's source on GitHub, at the versions the data was generated from. */
export function sourceUrl(module: string, line: number, meta: Pick<Meta, "lean" | "packages">): string | null {
  const top = module.split(".")[0];
  const file = `${module.split(".").join("/")}.lean${line ? `#L${line}` : ""}`;
  const rev = (pkg: string) => meta.packages[pkg] || "master";
  if (top === "Mathlib") return `https://github.com/leanprover-community/mathlib4/blob/${rev("mathlib")}/${file}`;
  if (top === "Batteries") return `https://github.com/leanprover-community/batteries/blob/${rev("batteries")}/${file}`;
  if (["Init", "Std", "Lean"].includes(top)) return `https://github.com/leanprover/lean4/blob/${meta.lean || "master"}/src/${file}`;
  if (top === "Aesop") return `https://github.com/leanprover-community/aesop/blob/${rev("aesop")}/${file}`;
  return null;
}

// ---------------------------------------------------------------- search

export type Hit =
  | { kind: "theorem"; theorem: number; name: string; label: L; module: string; score: number }
  | { kind: "decl"; name: string; theorems: number[]; score: number }
  | { kind: "module"; name: string; module: number; score: number };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/**
 * How well `text` matches the query words (0 = not at all). Every word must occur; a whole match, a match at the start
 * and a match at a name boundary ("pow_card" in "ZMod.pow_card_sub_one_eq_one") score higher.
 */
export function matchScore(query: string, text: string): number {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const t = norm(text);
  let score = 0;
  for (const w of words) {
    const at = t.indexOf(w);
    if (at < 0) return 0;
    score += 1;
    if (t === w) score += 6;
    else if (at === 0) score += 3;
    else if (/[.\s_(]/.test(t[at - 1])) score += 2;
  }
  return score + Math.max(0, 1 - t.length / 200);
}

/** Search the curated theorems (name and title in both languages), the declarations of their graphs and the modules. */
export function search(index: MathlibIndex, galaxy: Galaxy | null, query: string, limit = 30): Hit[] {
  const q = query.trim();
  if (!q) return [];
  const hits: Hit[] = [];
  index.theorems.forEach((t, i) => {
    const s = Math.max(matchScore(q, t.name) + 2, matchScore(q, `${t.en} ${t.zh}`) + 2);
    if (s > 2) hits.push({ kind: "theorem", theorem: i, name: t.name, label: [t.en, t.zh], module: t.module, score: s + 4 });
  });
  const curated = new Set(index.theorems.map((t) => t.name));
  for (const [name, ths] of Object.entries(index.names)) {
    if (curated.has(name)) continue;
    const s = matchScore(q, name);
    if (s > 0) hits.push({ kind: "decl", name, theorems: ths, score: s });
  }
  galaxy?.modules.forEach(([name], i) => {
    const s = matchScore(q, name);
    if (s > 0) hits.push({ kind: "module", name, module: i, score: s - 0.5 });
  });
  return hits.sort((a, b) => b.score - a.score || a.name.length - b.name.length).slice(0, limit);
}

export interface LoogleHit {
  name: string;
  module: string;
  type: string;
  doc: string | null;
}

export const LOOGLE = "https://loogle.lean-lang.org/json";

/** Search all of Mathlib online with Loogle (only the query is sent). */
export async function loogle(query: string, signal?: AbortSignal): Promise<{ hits: LoogleHit[]; count: number; error?: string }> {
  const r = await fetch(`${LOOGLE}?q=${encodeURIComponent(query)}`, { signal });
  if (!r.ok) return { hits: [], count: 0, error: `Loogle: HTTP ${r.status}` };
  const j = await r.json();
  if (j.error) return { hits: [], count: 0, error: String(j.error) };
  return { hits: (j.hits ?? []) as LoogleHit[], count: Number(j.count ?? 0) };
}

// ---------------------------------------------------------------- graph walks

export function adjacency(g: TheoremGraph): number[][] {
  const out: number[][] = g.nodes.map(() => []);
  for (const [a, b] of g.edges) out[a].push(b);
  return out;
}

/** Shortest path (node indices) from `from` to `to` along "uses" edges, or null. */
export function shortestPath(g: TheoremGraph, from: number, to: number, adj = adjacency(g)): number[] | null {
  const parent = new Map<number, number>([[from, -1]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const u = queue[i];
    if (u === to) break;
    for (const v of adj[u]) {
      if (!parent.has(v)) {
        parent.set(v, u);
        queue.push(v);
      }
    }
  }
  if (!parent.has(to)) return null;
  const path: number[] = [];
  for (let v = to; v !== -1; v = parent.get(v)!) path.push(v);
  return path.reverse();
}

/** Everything `from` reaches inside the stored graph (itself included). */
export function reachable(g: TheoremGraph, from: number, adj = adjacency(g)): Set<number> {
  const seen = new Set([from]);
  const stack = [from];
  while (stack.length) for (const v of adj[stack.pop()!]) if (!seen.has(v)) seen.add(v), stack.push(v);
  return seen;
}

export interface TreeNode {
  node: number;
  /** already shown higher up in the tree (a shared dependency): not expanded again */
  repeat: boolean;
  children: TreeNode[];
}

/** A breadth-first spanning tree from `from`, for the list view: each node is expanded once, where it is nearest. */
export function spanningTree(g: TheoremGraph, from: number, adj = adjacency(g)): TreeNode {
  const depth = new Map<number, number>([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) for (const v of adj[queue[i]]) if (!depth.has(v)) depth.set(v, depth.get(queue[i])! + 1), queue.push(v);
  const expanded = new Set<number>();
  const build = (u: number): TreeNode => {
    expanded.add(u);
    const kids = [...new Set(adj[u])].sort((a, b) => g.nodes[a].name.localeCompare(g.nodes[b].name));
    const children: TreeNode[] = [];
    for (const v of kids) {
      if (depth.get(v) === depth.get(u)! + 1 && !expanded.has(v)) children.push(build(v));
      else children.push({ node: v, repeat: true, children: [] });
    }
    return { node: u, repeat: false, children };
  };
  return build(from);
}

/** How many nodes of the stored graph use node i (its importance, for the node size). */
export function usedBy(g: TheoremGraph): number[] {
  const n = g.nodes.map(() => 0);
  for (const [, b] of g.edges) n[b]++;
  return n;
}

// ---------------------------------------------------------------- loading

const BASE: string = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "./";
const cache = new Map<string, Promise<unknown>>();

export function fetchJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = fetch(`${BASE}mathlib/${path}`).then((r) => {
      if (!r.ok) throw new Error(`mathlib/${path}: HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export const loadIndex = () => fetchJson<MathlibIndex>("index.json");
export const loadGalaxy = () => fetchJson<Galaxy>("galaxy.json");
export const loadGraph = (t: TheoremEntry) => fetchJson<RawGraph>(t.file).then(parseGraph);
