/**
 * The shape of the Riemann-hypothesis proof after its refactor of 25 Nov 2026 (lsernau/grh-lean, two editions:
 * frontend/public/rh/proof-map-compact.json and proof-map-readable.json, written by scripts/rh_map/generate.py from the
 * Lean source read as text): districts (directories) of its files, the import links between them, and the pure
 * functions the page uses. The original 17-million-line source (1,020 districts) is the third map,
 * proof-map-original.json, the "before" of the refactor; its totals are also kept in ORIGINAL. No React here, so tests run it under plain Node.
 */

export interface ProofMeta {
  /** owner/name on GitHub */
  repo: string;
  /** the edition's folder inside the repository ("" for the whole repository) */
  root?: string;
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
  districts: [
    string,
    number,
    number,
    number,
    number,
    number,
    number,
    [string, number][],
  ][];
  links: [number, number, number][];
}

export function parseProofMap(raw: RawProofMap): ProofMap {
  return {
    meta: raw.meta,
    tops: raw.tops,
    districts: raw.districts.map(
      ([
        name,
        top,
        lines,
        files,
        mathlibFiles,
        reachableFiles,
        flags,
        topFiles,
      ]) => ({
        name,
        top: raw.tops[top],
        lines,
        files,
        mathlibFiles,
        reachableFiles,
        flags,
        topFiles,
      }),
    ),
    links: raw.links,
  };
}

/** A colour per top-level folder; the statement is gold and the main theorem white, whatever their folder. */
const TOP_COLOURS: Record<string, string> = {
  // the refactor: library (background classed as known) and application (the set-up and the argument)
  Lib: "#38bdf8",
  New: "#f59e0b",
  // the original source's top-level folders
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
export function folders(
  m: ProofMap,
): { top: string; lines: number; files: number; districts: number }[] {
  const s = new Map<
    string,
    { top: string; lines: number; files: number; districts: number }
  >();
  for (const d of m.districts) {
    const f =
      s.get(d.top) ??
      s
        .set(d.top, { top: d.top, lines: 0, files: 0, districts: 0 })
        .get(d.top)!;
    f.lines += d.lines;
    f.files += d.files;
    f.districts += 1;
  }
  return [...s.values()].sort((a, b) => b.lines - a.lines);
}

/** The districts `i` imports most (out) and that import it most (in), heaviest first. */
export function neighbours(
  m: ProofMap,
  i: number,
  k = 3,
): { out: [number, number][]; in: [number, number][] } {
  const out: [number, number][] = [];
  const inn: [number, number][] = [];
  for (const [a, b, w] of m.links) {
    if (a === i) out.push([b, w]);
    if (b === i) inn.push([a, w]);
  }
  const top = (xs: [number, number][]) =>
    xs.sort((x, y) => y[1] - x[1]).slice(0, k);
  return { out: top(out), in: top(inn) };
}

/** The links to draw: the `k` heaviest out of each district, and every link touching the statement or the main theorem. */
export function drawnLinks(m: ProofMap, k = 3): [number, number, number][] {
  const special = new Set(
    m.districts.flatMap((d, i) => (d.flags & (STATEMENT | MAIN) ? [i] : [])),
  );
  const out = new Map<number, [number, number, number][]>();
  const keep: [number, number, number][] = [];
  for (const l of m.links) {
    if (special.has(l[0]) || special.has(l[1])) keep.push(l);
    else (out.get(l[0]) ?? out.set(l[0], []).get(l[0])!).push(l);
  }
  for (const ls of out.values())
    keep.push(...ls.sort((a, b) => b[2] - a[2]).slice(0, k));
  return keep;
}

/** The published source before the refactor (leanprover-community/riemann-hypothesis, first commit 40e56bab), and
 * Mathlib for scale: the totals of the original map (scripts/rh_map/generate.py, 22 Nov 2026). */
export const ORIGINAL = {
  commit: "40e56bab026552e089d7afcfeff08d2defb9c005",
  files: 175_187,
  lines: 17_374_215,
  districts: 1_020,
  importsInternal: 753_569,
  mathlibFiles: 136_266,
  mathlib: { files: 8_529, lines: 2_327_634, version: "v4.34.1" },
} as const;

/** A path inside the edition (a district such as "New/Filling", or a single file without .lean) on GitHub. */
export function githubUrl(
  meta: ProofMeta,
  name: string,
  single: boolean,
): string {
  const root = meta.root ? `${meta.root}/` : "";
  const kind = single ? "blob" : "tree";
  return `https://github.com/${meta.repo}/${kind}/${meta.commit}/${root}src/${name}${single ? ".lean" : ""}`;
}

/** The two refactored editions (25 Nov 2026), and the original source as published (20 Nov 2026). */
export type Edition = "compact" | "readable" | "original";
/** In the order the switch shows them: from the original, left, to the slimmest, right. */
export const EDITIONS: Edition[] = ["original", "readable", "compact"];

const BASE: string =
  (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "./";
const cached = new Map<Edition, Promise<ProofMap>>();

export function loadProofMap(edition: Edition = "compact"): Promise<ProofMap> {
  let p = cached.get(edition);
  if (!p) {
    const file = `rh/proof-map-${edition}.json`;
    p = fetch(`${BASE}${file}`).then((r) => {
      if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
      return r.json().then(parseProofMap);
    });
    cached.set(edition, p);
    p.catch(() => cached.delete(edition));
  }
  return p;
}
