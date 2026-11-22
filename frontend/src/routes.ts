/**
 * The site's addresses, pure (tested in node). The home is #/home (also the address with no hash). The Problems page
 * holds the library and, in its left column's other tab, the research projects:
 *   #/problems/<problem>                 a library problem
 *   #/problems/research                  the research home (demos, templates, your projects)
 *   #/problems/research/<project>        a research project (a demo's finished showcase is `showcase-<demo>`)
 * Research used to be a header page: #/research, #/research/<project> and #/research/showcase/<demo> still work.
 */
export interface RouteLike {
  page: string;
  tab: string | null;
  section: string | null;
}

export const HOME = "home";
export const RESEARCH = "research";
/** the left column's tab on the Problems page, remembered in this browser */
export type LeftTab = "problems" | "research";
export const LEFT_TAB_KEY = "formalizer.leftTab";
/** recently viewed library problems, newest first, for the home */
export const RECENT_KEY = "formalizer.recent";
export const RECENT_MAX = 6;

/** Where an old Research page address leads now, or null when the route is something else. */
export function legacyResearchRoute(r: RouteLike): RouteLike | null {
  if (r.page !== RESEARCH) return null;
  const project = r.tab === "showcase" ? (r.section ? `showcase-${r.section}` : null) : r.tab;
  return { page: "problems", tab: RESEARCH, section: project };
}
/** The same, as the address to put in the location bar. */
export function legacyResearchHash(r: RouteLike): string | null {
  const to = legacyResearchRoute(r);
  return to && "#/" + [to.page, to.tab, to.section].filter(Boolean).map((p) => encodeURIComponent(p!)).join("/");
}

/** What the Problems page's main area shows for a route. */
export type ProblemsView = { kind: "problem"; id: string | null } | { kind: "research"; project: string | null };
export function problemsView(r: Pick<RouteLike, "tab" | "section">): ProblemsView {
  return r.tab === RESEARCH ? { kind: "research", project: r.section } : { kind: "problem", id: r.tab };
}

/** A demo's showcase id (`showcase-<demo>`) → the demo's id, else null. */
export function showcaseOf(project: string | null): string | null {
  return project?.startsWith("showcase-") ? project.slice("showcase-".length) : null;
}

/** The recent list after viewing `id`: it moves to the front, at most `max` kept. */
export function pushRecent(list: readonly string[], id: string, max = RECENT_MAX): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, max);
}

export function parseRecent(text: string | null): string[] {
  try {
    const v = JSON.parse(text ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** localStorage, never throwing (private windows and blocked storage just forget). */
export function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function store(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage blocked: remembered for this page only
  }
}
