/**
 * Building blocks for the Concept and Coding Skills pages, so every page has Tensorizer's shape: a sticky table of
 * contents on the left, a title and introduction, then numbered section cards with text, Lean code, figures, callouts
 * and sources. Text is always a [English, Traditional Chinese] pair (`L`).
 *
 * Lean code shown on a page comes from lean/Formalizer/Pages/<Page>.lean through `snippet(page, name)`: those files
 * are compiled by CI (`lake build`, core Lean), so every example on the site is checked. A snippet runs from a line
 * `-- snippet: <name>` to the next `-- snippet:` / `-- end` line. Code that needs Mathlib (not available on the Lite
 * runner) or that is meant to fail is written inline with `<Lean code=… runner="mathlib" | fails>` instead.
 */
import { CodeBlock, go, PageToc, plainText, RichText, useLang } from "@learnkit/web";
import { isValidElement, useEffect, type ReactElement, type ReactNode } from "react";
import { PROBLEMS } from "../problems";
import { parseSnippets } from "./snippets";

/** [English, Traditional Chinese] */
export type L = readonly [string, string];

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

export interface SectionInfo {
  /** element id is `<page id>-<section id>`; deep link #/<page>/<tab>/<section id> */
  id: string;
  title: L;
}

/** A whole page: table of contents, title, introduction, then the sections (children). */
export function Page({
  id,
  title,
  intro,
  sections,
  focus,
  children,
}: {
  /** prefix of the section element ids, e.g. "method" */
  id: string;
  title: L;
  intro: L;
  sections: SectionInfo[];
  /** section to scroll to on open (from the address) */
  focus?: string | null;
  children: ReactNode;
}) {
  const { pick } = useLang();
  useEffect(() => {
    if (focus) requestAnimationFrame(() => document.getElementById(`${id}-${focus}`)?.scrollIntoView({ block: "start" }));
  }, [focus, id]);
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 pt-6 pb-16" data-testid={`page-${id}`}>
      <PageToc
        scrollRoot={SCROLL}
        title={pick(["On this page", "本頁內容"])}
        className="top-6"
        items={sections.map((s, i) => ({ id: `${id}-${s.id}`, label: pick(s.title), mark: i + 1 }))}
      />
      <article className="min-w-0 max-w-4xl flex-1 space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            <RichText text={pick(title)} />
          </h1>
          <p className="mt-3 text-gray-600">
            <RichText text={pick(intro)} />
          </p>
        </header>
        {children}
      </article>
    </div>
  );
}

/** One numbered section card. `page` and `id` must match an entry of the Page's `sections`. */
export function Section({ page, id, n, title, children }: { page: string; id: string; n: number; title: L; children: ReactNode }) {
  const { pick } = useLang();
  return (
    <section id={`${page}-${id}`} className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6" data-testid="page-section">
      <h2 className="flex items-baseline gap-3 text-lg font-semibold text-gray-900">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--lk-accent) text-sm text-white">{n}</span>
        <RichText text={pick(title)} />
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

/** A paragraph (RichText: `code`, **bold**, *italic*, $maths$, links). */
export function P({ t }: { t: L }) {
  const { pick } = useLang();
  return (
    <p>
      <RichText text={pick(t)} />
    </p>
  );
}

/** A bulleted list of RichText items. */
export function List({ items, ordered = false }: { items: L[]; ordered?: boolean }) {
  const { pick } = useLang();
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((it, i) => (
        <li key={i}>
          <RichText text={pick(it)} />
        </li>
      ))}
    </Tag>
  );
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
      <CodeBlock code={code} title={title} />
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

const CALLOUT = {
  tip: "border-teal-200 bg-teal-50/60 text-teal-950",
  note: "border-sky-200 bg-sky-50/60 text-sky-950",
  warn: "border-amber-300 bg-amber-50 text-amber-950",
} as const;

/** A highlighted box: a tip, a side note, or a warning (a common trap). */
export function Callout({ kind = "note", title, children }: { kind?: keyof typeof CALLOUT; title?: L; children: ReactNode }) {
  const { pick } = useLang();
  return (
    <aside className={`rounded-lg border px-4 py-3 ${CALLOUT[kind]}`}>
      {title && (
        <p className="mb-1 text-sm font-semibold">
          <RichText text={pick(title)} />
        </p>
      )}
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </aside>
  );
}

/** A figure (an inline SVG drawn for the page, or any element) with a caption. */
export function Figure({ caption, children }: { caption: L; children: ReactNode }) {
  const { pick } = useLang();
  return (
    <figure className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex justify-center overflow-x-auto">{children}</div>
      <figcaption className="mt-2 text-center text-xs text-gray-500">
        <RichText text={pick(caption)} />
      </figcaption>
    </figure>
  );
}

/** A table (e.g. paper ↔ Lean, tactic ↔ what it does). Cells are RichText, or an element (e.g. a coloured mark). */
export function Table({ head, rows }: { head: readonly L[]; rows: (readonly (L | ReactElement)[])[] }) {
  const { pick } = useLang();
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold">
                <RichText text={pick(h)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {isValidElement(c) ? c : <RichText text={pick(c as L)} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sources at the end of a section: https links only. */
export function Sources({ items }: { items: { label: string; url: string }[] }) {
  const { pick } = useLang();
  return (
    <div className="mt-2 border-t border-gray-100 pt-3">
      <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["Sources", "資料來源"])}</p>
      <ul className="mt-1 space-y-0.5 text-xs">
        {items.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-(--lk-accent) hover:underline">
              {s.label} ↗
            </a>
          </li>
        ))}
      </ul>
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

/** A link to another page of the site, e.g. <SiteLink to={["skills", "search"]} label={…} />. */
export function SiteLink({ to, label }: { to: [string, string?, string?]; label: L }) {
  const { pick } = useLang();
  return (
    <button onClick={() => go(...to)} className="font-medium text-(--lk-accent) hover:underline">
      {pick(label)} →
    </button>
  );
}
