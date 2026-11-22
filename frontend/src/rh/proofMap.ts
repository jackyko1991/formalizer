/**
 * The shape of the claimed Riemann-hypothesis proof (frontend/public/rh/proof-map.json, written by
 * scripts/rh_map/generate.py from the Lean source read as text): districts (directories) of the 175,187 files, the
 * import links between them, and the pure functions the page uses. No React here, so tests run it under plain Node.
 */

export interface ProofMeta {
  repo: string;
  commit: string;
  commitDate: string;
  fetched: string;
  files: number;
  lines: number;
  bytes: number;
  /** files that import Mathlib directly */
  mathlibFiles: number;
  importsInternal: number;
  importsExternal: number;
  /** files Main.lean imports, directly or not (itself included) */
  reachable: { files: number; lines: number };
  statement: string;
  main: string;
  districts: number;
  links: number;
  /** Mathlib's own size, for the comparison */
  mathlib: { files: number; lines: number; version: string } | null;
}

export const STATEMENT = 1;
export const MAIN = 2;
export const SINGLE = 4;

export interface District {
  /** directory under src/ (or a single file's path without .lean, for the statement and the main theorem) */
  name: string;
  top: string;
  lines: number;
  files: number;
  mathlibFiles: number;
  reachableFiles: number;
  flags: number;
  /** its largest files: [path inside the district, lines] */
  topFiles: [string, number][];
}

export interface ProofMap {
  meta: ProofMeta;
  tops: string[];
  districts: District[];
  /** [from, to, imports]: files of `from` import this many files of `to` */
  links: [number, number, number][];
}

export interface RawProofMap {
  meta: ProofMeta;
  tops: string[];
  districts: [string, number, number, number, number, number, number, [string, number][]][];
  links: [number, number, number][];
}

export function parseProofMap(raw: RawProofMap): ProofMap {
  return {
    meta: raw.meta,
    tops: raw.tops,
    districts: raw.districts.map(([name, top, lines, files, mathlibFiles, reachableFiles, flags, topFiles]) => ({
      name,
      top: raw.tops[top],
      lines,
      files,
      mathlibFiles,
      reachableFiles,
      flags,
      topFiles,
    })),
    links: raw.links,
  };
}

/** A colour per top-level folder; the statement is gold and the main theorem white, whatever their folder. */
const TOP_COLOURS: Record<string, string> = {
  Development: "#3b82f6",
  Formalism: "#10b981",
  GroundTheory: "#a855f7",
  ReciprocityTheory: "#ef4444",
  CompanionTheory: "#06b6d4",
  PositivityTheory: "#f97316",
  Supplements: "#ec4899",
  Lemmata: "#84cc16",
  BuildAid: "#94a3b8",
};
export const STATEMENT_COLOUR = "#fbbf24";
export const MAIN_COLOUR = "#f8fafc";

export function colourOf(d: District): string {
  if (d.flags & STATEMENT) return STATEMENT_COLOUR;
  if (d.flags & MAIN) return MAIN_COLOUR;
  return TOP_COLOURS[d.top] ?? "#64748b";
}

/** Lines and files per top-level folder, largest first. */
export function folders(m: ProofMap): { top: string; lines: number; files: number; districts: number }[] {
  const s = new Map<string, { top: string; lines: number; files: number; districts: number }>();
  for (const d of m.districts) {
    const f = s.get(d.top) ?? s.set(d.top, { top: d.top, lines: 0, files: 0, districts: 0 }).get(d.top)!;
    f.lines += d.lines;
    f.files += d.files;
    f.districts += 1;
  }
  return [...s.values()].sort((a, b) => b.lines - a.lines);
}

/** The districts `i` imports most (out) and that import it most (in), heaviest first. */
export function neighbours(m: ProofMap, i: number, k = 3): { out: [number, number][]; in: [number, number][] } {
  const out: [number, number][] = [];
  const inn: [number, number][] = [];
  for (const [a, b, w] of m.links) {
    if (a === i) out.push([b, w]);
    if (b === i) inn.push([a, w]);
  }
  const top = (xs: [number, number][]) => xs.sort((x, y) => y[1] - x[1]).slice(0, k);
  return { out: top(out), in: top(inn) };
}

/** The links to draw: the `k` heaviest out of each district, and every link touching the statement or the main theorem. */
export function drawnLinks(m: ProofMap, k = 3): [number, number, number][] {
  const special = new Set(m.districts.flatMap((d, i) => (d.flags & (STATEMENT | MAIN) ? [i] : [])));
  const out = new Map<number, [number, number, number][]>();
  const keep: [number, number, number][] = [];
  for (const l of m.links) {
    if (special.has(l[0]) || special.has(l[1])) keep.push(l);
    else (out.get(l[0]) ?? out.set(l[0], []).get(l[0])!).push(l);
  }
  for (const ls of out.values()) keep.push(...ls.sort((a, b) => b[2] - a[2]).slice(0, k));
  return keep;
}

const BASE: string = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "./";
let cached: Promise<ProofMap> | null = null;

export function loadProofMap(): Promise<ProofMap> {
  if (!cached) {
    cached = fetch(`${BASE}rh/proof-map.json`).then((r) => {
      if (!r.ok) throw new Error(`rh/proof-map.json: HTTP ${r.status}`);
      return r.json().then(parseProofMap);
    });
    cached.catch(() => (cached = null));
  }
  return cached;
}
