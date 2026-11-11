/**
 * Further reading ▸ Papers & projects (#/reading/papers[/<group>]): the papers behind Lean and Mathlib, landmark
 * formalisations, and the projects and tools around them. Data: src/reading.ts (DOIs checked against Crossref).
 */
import { PageToc, RichText, useLang } from "@learnkit/web";
import { useEffect } from "react";
import { PAPER_GROUPS, PAPERS } from "../../reading";
import { SCROLL } from "../kit";

export default function PapersReading({ section }: { section: string | null }) {
  const { pick } = useLang();
  useEffect(() => {
    const el = section && document.getElementById(`papers-${section}`);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
    else document.getElementById(SCROLL)?.scrollTo({ top: 0 });
  }, [section]);
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 pt-6 pb-10" data-testid="page-papers">
      <PageToc
        scrollRoot={SCROLL}
        title={pick(["On this page", "本頁內容"])}
        className="top-20"
        items={PAPER_GROUPS.map((g, i) => ({ id: `papers-${g.id}`, mark: i + 1, label: pick(g.title) }))}
      />
      <article className="min-w-0 max-w-4xl flex-1 space-y-10">
        <header>
          <p className="text-sm font-medium text-(--lk-accent)">{pick(["Further reading", "延伸閱讀"])}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{pick(["Papers & projects", "論文與專案"])}</h1>
          <p className="mt-3 text-gray-600">
            {pick([
              "The papers behind Lean and Mathlib, the formalisations that showed what machines can check, and the projects and tools Formalizer builds on.",
              "Lean 與 Mathlib 背後的論文、讓人看見機器能檢查什麼的形式化成果，以及 Formalizer 所依靠的專案與工具。",
            ])}
          </p>
        </header>
        {PAPER_GROUPS.map((g, i) => (
          <section key={g.id} id={`papers-${g.id}`} className="scroll-mt-20">
            <h2 className="flex flex-wrap items-baseline gap-3 text-lg font-semibold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--lk-accent) text-sm text-white">{i + 1}</span>
              {pick(g.title)}
            </h2>
            <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {PAPERS.filter((p) => p.group === g.id).map((p) => (
                <li key={p.id} className="px-5 py-4" data-testid={`paper-${p.id}`}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-(--lk-accent) hover:underline"
                    lang="en"
                  >
                    {p.title} ↗
                  </a>
                  <p className="mt-0.5 text-xs text-gray-500" lang="en">
                    {[
                      p.authors,
                      p.where === "repository"
                        ? pick(["repository", "程式庫"])
                        : p.where === "website"
                          ? pick(["website", "網站"])
                          : p.where,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
                    <RichText text={pick(p.why)} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </div>
  );
}
