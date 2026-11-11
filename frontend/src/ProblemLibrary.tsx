/**
 * The problem library (left column of the Problems page, Tensorizer's Sidebar): a search box ("/" focuses it), then
 * each topic folds open to its problems grouped by level, a coloured dot per level.
 */
import { plainText, RichText, useLang } from "@learnkit/web";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, COLLECTIONS, LEVELS, PROBLEMS, type Level, type Problem } from "./problems";

export const LEVEL_STYLE: Record<Level, { dot: string; text: string }> = {
  L1: { dot: "bg-green-500", text: "text-green-700" },
  L2: { dot: "bg-amber-500", text: "text-amber-700" },
  L3: { dot: "bg-red-500", text: "text-red-700" },
};

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export default function ProblemLibrary({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { t, pick } = useLang();
  const selectedCategory = PROBLEMS.find((p) => p.id === selected)?.category;
  const [open, setOpen] = useState<Set<string>>(() => new Set(selectedCategory ? [selectedCategory] : [CATEGORIES[0].id]));
  useEffect(() => {
    if (selectedCategory) setOpen((s) => (s.has(selectedCategory) ? s : new Set(s).add(selectedCategory)));
  }, [selectedCategory]);

  // keep the open problem in view in the list (e.g. an L3 problem opened from a link)
  const listRef = useRef<HTMLElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" }));
  }, [selected]);

  // search: titles and summaries in both languages, the tactics, the statement and the slug; case and accents ignored
  const [query, setQuery] = useState("");
  const box = useRef<HTMLInputElement>(null);
  const index = useMemo(
    () =>
      PROBLEMS.map((p) => ({
        p,
        text: fold([...p.title, ...p.summary, ...p.tactics, ...p.statements, p.id.replace(/-/g, " ")].join(" ")),
      })),
    [],
  );
  const words = fold(query).split(/\s+/).filter(Boolean);
  // collections: chosen under the search box, they list their problems in order
  const [collection, setCollection] = useState<string | null>(null);
  const current = COLLECTIONS.find((c) => c.id === collection) ?? null;
  const hits = words.length ? index.filter((e) => words.every((w) => e.text.includes(w))).map((e) => e.p) : [];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, [contenteditable=true], .cm-editor");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        box.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const item = (p: Problem, dot = false) => (
    <li key={p.id}>
      <button
        onClick={() => onSelect(p.id)}
        title={plainText(pick(p.title))}
        aria-current={selected === p.id ? "page" : undefined}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition ${
          selected === p.id ? "bg-teal-50 font-medium text-(--lk-accent)" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_STYLE[p.level].dot}`} />}
        <span className="min-w-0">
          <RichText text={pick(p.title)} />
        </span>
      </button>
    </li>
  );

  return (
    <nav ref={listRef} className="space-y-1" data-testid="problem-library">
      {/* stays put while the list scrolls under it */}
      <div className="sticky -top-3 z-10 -mx-3 -mt-3 mb-2 bg-white px-3 pt-3 pb-1">
        <div className="relative">
          <input
            ref={box}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            data-testid="problem-search"
            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pr-7 pl-7 text-sm placeholder:text-gray-400 focus:border-(--lk-accent) focus:outline-none"
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-2 left-2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label={t("search.clear")}
              className="absolute top-1 right-1.5 px-1 text-lg leading-none text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          ) : (
            <kbd className="absolute top-1.5 right-2 rounded border border-gray-200 px-1 text-[10px] text-gray-400">/</kbd>
          )}
        </div>
      </div>

      {words.length === 0 && (
        <label className="mb-2 flex items-center gap-1.5 px-1 text-xs text-gray-500" data-testid="collections">
          <span className="shrink-0">📚</span>
          <select
            value={collection ?? ""}
            onChange={(e) => setCollection(e.target.value || null)}
            aria-label={t("coll.title")}
            data-testid="collection-select"
            className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-(--lk-accent) focus:outline-none"
          >
            <option value="">
              {t("coll.title")}: {t("coll.all")}
            </option>
            {COLLECTIONS.map((c) => (
              <option key={c.id} value={c.id} title={pick(c.summary)}>
                {pick(c.title)} ({c.items.length})
              </option>
            ))}
          </select>
        </label>
      )}
      {words.length === 0 && current ? (
        <div data-testid="collection-list">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs font-semibold text-gray-800">{pick(current.title)}</span>
            <button onClick={() => setCollection(null)} className="text-[11px] text-(--lk-accent) hover:underline">
              {t("coll.all")}
            </button>
          </div>
          <p className="px-2 pb-1 text-[11px] text-gray-500">{pick(current.summary)}</p>
          <ol>
            {current.items.map((id, i) => (
              <li key={id} className="flex items-start gap-1">
                <span className="mt-1.5 w-5 shrink-0 text-right font-mono text-[10px] text-gray-400">{i + 1}.</span>
                <ul className="min-w-0 flex-1">
                  {item(
                    PROBLEMS.find((p) => p.id === id)!,
                    true,
                  )}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      ) : words.length > 0 ? (
        <div data-testid="search-results">
          <p className="px-2 pb-1 text-[11px] text-gray-500">{t("search.count").replace("{n}", String(hits.length))}</p>
          {hits.length === 0 && <p className="px-2 py-2 text-sm text-gray-400">{t("search.none")}</p>}
          <ul>{hits.map((p) => item(p, true))}</ul>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const isOpen = open.has(cat.id);
          const problems = PROBLEMS.filter((p) => p.category === cat.id);
          return (
            <div key={cat.id}>
              <button
                onClick={() => toggle(cat.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-(--lk-accent)">
                    {cat.icon}
                  </span>
                  {pick(cat.title)}
                </span>
                <span className="flex items-center gap-2 text-xs font-normal text-gray-400">
                  {problems.length || "—"}
                  <span className={`transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                </span>
              </button>
              {isOpen && (
                <div className="mb-2 ml-2 space-y-2 border-l border-gray-200 pl-2">
                  {problems.length === 0 && <p className="px-2 py-1 text-xs text-gray-400">{pick(cat.empty ?? cat.title)}</p>}
                  {LEVELS.map((level) => {
                    const inLevel = problems.filter((p) => p.level === level);
                    if (!inLevel.length) return null;
                    const style = LEVEL_STYLE[level];
                    return (
                      <div key={level} data-testid={`level-${level}`}>
                        <h3
                          className={`flex items-center gap-1.5 px-2 pt-1 pb-0.5 text-[11px] font-semibold tracking-wide uppercase ${style.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {level} · {t(`level.${level}`)}
                        </h3>
                        <ul>{inLevel.map((p) => item(p))}</ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </nav>
  );
}
