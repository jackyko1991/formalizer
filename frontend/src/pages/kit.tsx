/**
 * Building blocks for the Concept and Coding Skills pages, so every page has Tensorizer's shape: a sticky table of
 * contents on the left, a title and introduction, then numbered section cards with text, Lean code, figures, callouts
 * and sources. Text is always a [English, Traditional Chinese] pair (`L`). The site-neutral blocks (Page, Section, P,
 * List, Callout, Figure, Table, Sources, SiteLink) are learnkit's page kit, re-exported here; Lean code, snippets and
 * "Try it in" are Formalizer's own.
 *
 * Lean code shown on a page comes from lean/Formalizer/Pages/<Page>.lean through `snippet(page, name)`: those files
 * are compiled by CI (`lake build`, core Lean), so every example on the site is checked. A snippet runs from a line
 * `-- snippet: <name>` to the next `-- snippet:` / `-- end` line. Code that needs Mathlib (not available on the Lite
 * runner) or that is meant to fail is written inline with `<Lean code=… runner="mathlib" | fails>` instead.
 */
import { CodeBlock, go, Page as KitPage, plainText, RichText, useLang, type L, type PageProps } from "@learnkit/web";
import { lean } from "../leanLanguage";
import { PROBLEMS } from "../problems";
import { parseSnippets } from "./snippets";

export { Callout, Figure, List, P, Section, SiteLink, Sources, Table } from "@learnkit/web";
export type { L, SectionInfo } from "@learnkit/web";

/** The main scroll area (Shell's scrollId) and the height kept free by the sticky tab row above every page. */
export const SCROLL = "fz-scroll";

// lean/Formalizer/Pages/*.lean, as text, keyed by file name without extension ("Tactics")
const FILES = import.meta.glob("../../../lean/Formalizer/Pages/*.lean", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;
const SOURCES: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, text]) => [
    path
      .split("/")
      .pop()!
      .replace(/\.lean$/, ""),
    text,
  ]),
);

/** The checked Lean code of snippet `name` in lean/Formalizer/Pages/<file>.lean. */
export function snippet(file: string, name: string): string {
  const code = parseSnippets(SOURCES[file] ?? "")[name];
  if (code === undefined) throw new Error(`no snippet ${file}:${name} in lean/Formalizer/Pages/${file}.lean`);
  return code;
}

/** A whole page (learnkit's Page) scrolling in Formalizer's main area. */
export function Page(props: Omit<PageProps, "scrollRoot">) {
  return <KitPage {...props} scrollRoot={SCROLL} />;
}

const RUNNER_BADGE = {
  lite: ["checked by Lean in CI", "已由 Lean 在 CI 中檢查"],
  mathlib: ["needs Mathlib (Full runner)", "需要 Mathlib（Full 執行器）"],
  fails: ["Lean rejects this, on purpose", "Lean 會拒絕這段，刻意的"],
} as const;

/**
 * Lean code. Prefer `code={snippet("Page", "name")}` (checked); otherwise pass the code inline and say why it isn't
 * checked: `runner="mathlib"` or `fails`.
 */
/** Lean 4 colours for every snippet on the Concept and Coding Skills pages */
const LEAN_COLOURS = lean();

export function Lean({
  code,
  title,
  note,
  runner = "lite",
  fails = false,
}: {
  code: string;
  title?: string;
  note?: L;
  runner?: "lite" | "mathlib";
  fails?: boolean;
}) {
  const { pick } = useLang();
  const kind = fails ? "fails" : runner;
  return (
    <div className="space-y-1">
      <CodeBlock code={code} title={title} language={LEAN_COLOURS} />
      <p className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${
            kind === "lite" ? "bg-teal-50 text-(--lk-accent)" : kind === "mathlib" ? "bg-sky-50 text-sky-700" : "bg-red-50 text-red-700"
          }`}
        >
          {pick(RUNNER_BADGE[kind])}
        </span>
        {note && <RichText text={pick(note)} />}
      </p>
    </div>
  );
}

/** "Try it in: …" chips that open tutorial problems (ids from problems/tutorial.json). */
export function TryIn({ ids }: { ids: string[] }) {
  const { pick } = useLang();
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-gray-500">{pick(["Try it in:", "動手試試："])}</span>
      {ids.map((id) => {
        const p = PROBLEMS.find((q) => q.id === id);
        if (!p) throw new Error(`TryIn: no problem ${id}`);
        return (
          <button
            key={id}
            onClick={() => go("problems", id)}
            className="rounded-full bg-teal-50 px-2.5 py-1 text-(--lk-accent) hover:bg-teal-100"
          >
            {p.level} · {plainText(pick(p.title)).replace(/`/g, "")}
          </button>
        );
      })}
    </p>
  );
}
