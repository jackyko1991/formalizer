/**
 * The home (#/home, the logo, and the address with no hash), modelled on Tensorizer's workspace home: your research
 * projects as cards with their blueprint progress, the ways to start one (blank, from a demo, with the AI), the library
 * problems you looked at last, a search of the library, and import / export. Without the runner it still shows the
 * library parts and says how to start it.
 */
import { go, plainText, RichText, useLang } from "@learnkit/web";
import { useMemo, useRef, useState } from "react";
import { requestAgentOpen } from "./agent/bus";
import { LEVEL_STYLE, searchProblems } from "./ProblemLibrary";
import { CATEGORIES, PROBLEMS, type Problem } from "./problems";
import { ago, EMPTY_TEMPLATE, openProject, useProjects, type Listed } from "./research/projects";
import { FREE_PROJECTS } from "./research/store";
import { SHOWCASES, TEMPLATES } from "./research/templates";
import { parseRecent, RECENT_KEY, stored } from "./routes";
import { runnerReady, useRunner } from "./RunnerPanel";

const H2 = "text-xs font-semibold tracking-wide text-gray-500 uppercase";
const LEAD = "mt-1 text-sm text-gray-600";

export default function HomePage() {
  const { t, pick } = useLang();
  const { runner, open: openRunner } = useRunner();
  const ready = runnerReady(runner);
  const research = useProjects({ withProgress: true });
  const { projects, full, limitNote, error } = research;
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const recent = useMemo(
    () => parseRecent(stored(RECENT_KEY)).flatMap((id) => PROBLEMS.filter((p) => p.id === id)),
    [],
  );
  const hits = useMemo(() => searchProblems(query).slice(0, 12), [query]);
  const sorted = [...(projects ?? [])].sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0));

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
      setPicker(false);
    }
  }
  /** a blank project, then the AI panel with a first message to finish and send */
  async function askAI() {
    if (full && sorted[0]) {
      // the free tier's one project is taken: the AI helps with that one
      openProject(sorted[0].id);
      return requestAgentOpen(t("home.askAIDraftExisting"));
    }
    const id = await research.start(EMPTY_TEMPLATE());
    if (id) requestAgentOpen(t("home.askAIDraft"));
  }

  const actions = (
    <div className="grid gap-3 sm:grid-cols-3" data-testid="home-actions">
      <BigAction
        icon="＋"
        label={t("home.blank")}
        hint={t("home.blankHint")}
        onClick={() => run(() => research.start(EMPTY_TEMPLATE()))}
        disabled={busy || full}
        title={full ? limitNote : undefined}
      />
      <BigAction
        icon="◐"
        label={t("home.fromDemo")}
        hint={t("home.fromDemoHint")}
        onClick={() => setPicker((o) => !o)}
        disabled={busy || full}
        title={full ? limitNote : undefined}
      />
      <BigAction
        icon="✨"
        label={t("home.askAI")}
        hint={t("home.askAIHint")}
        onClick={() => run(askAI)}
        disabled={busy}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6" data-testid="home">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{t("home.title")}</h1>
          <p className="mt-1 text-sm text-gray-500" data-testid="home-subtitle">
            {t(ready ? "home.subtitle" : "home.subtitleBrowser").replace("{n}", String(FREE_PROJECTS))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => void Promise.all(sorted.map((p) => research.exportProject(p)))}
            disabled={!sorted.length}
            title={t("home.exportHint")}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            data-testid="home-export"
          >
            ⬇ {t("home.export")}
          </button>
          <button
            onClick={() => file.current?.click()}
            disabled={full}
            title={full ? limitNote : t("home.importHint")}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            data-testid="home-import"
          >
            ⬆ {t("home.import")}
          </button>
          <input
            ref={file}
            type="file"
            accept=".zip,.lean"
            multiple
            className="hidden"
            onChange={(e) => {
              void research.importFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {/* the runner: needed to check proofs and to keep projects in ~/Formalizer */}
      {runner !== "checking" && !ready && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" data-testid="home-runner">
          <p className="font-semibold">{t("home.runnerTitle")}</p>
          <p className="mt-1">
            <RichText text={t("home.runnerBody")} />
          </p>
          <p className="mt-2 text-xs text-amber-800">
            {runner ? t(`runner.state.${runner.state}`) : t("runner.offline")} ·{" "}
            <button onClick={openRunner} className="font-medium underline underline-offset-2">
              {t("runner.how")}
            </button>
          </p>
        </section>
      )}

      {/* 1. your research projects */}
      <section>
        <h2 className={H2}>{t("home.projects")}</h2>
        <p className={LEAD}>
          <RichText text={t("home.projectsLead")} />
        </p>
        {projects === null ? (
          <p className="mt-3 text-sm text-gray-400">{pick(["Loading…", "載入中……"])}</p>
        ) : sorted.length === 0 ? (
          <div className="mt-3 space-y-4 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5 text-center">
            <p className="text-sm text-gray-600">{t("home.empty")}</p>
            {actions}
          </div>
        ) : (
          <>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="home-projects">
              {sorted.map((p) => (
                <ProjectCard key={`${p.where}-${p.id}`} project={p} onExport={() => void research.exportProject(p)} />
              ))}
            </ul>
            <div className="mt-4">{actions}</div>
            {full && (
              <p className="mt-2 text-xs text-gray-500" data-testid="home-limit">
                {limitNote}{" "}
                <button onClick={() => go("agents", "roadmap")} className="text-(--lk-accent) hover:underline">
                  {pick(["Product roadmap", "產品路線圖"])} →
                </button>
              </p>
            )}
          </>
        )}
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {picker && !full && (
          <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/40 p-3" data-testid="home-demos">
            <p className="px-1 pb-2 text-xs text-gray-600">{t("home.demosLead")}</p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {TEMPLATES.filter((x) => x.id !== "empty").map((x) => (
                <li key={x.id}>
                  <button
                    disabled={busy}
                    onClick={() => run(() => research.start(x))}
                    className="flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-(--lk-accent) disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-gray-900">{pick(x.title)}</span>
                    <span className="mt-1 line-clamp-3 text-xs text-gray-600">
                      <RichText text={pick(x.about)} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-1 pt-2 text-xs text-gray-500">
              {t("home.showcases")}{" "}
              {SHOWCASES().map((x, i) => (
                <span key={x.id}>
                  {i > 0 && " · "}
                  <button onClick={() => openProject(`showcase-${x.id}`)} className="text-(--lk-accent) hover:underline">
                    ✓ {pick(x.title)}
                  </button>
                </span>
              ))}
            </p>
          </div>
        )}
      </section>

      {/* 2. the library: search, then the problems looked at last */}
      <section>
        <h2 className={H2}>{t("home.library")}</h2>
        <p className={LEAD}>
          <RichText text={t("home.libraryLead")} />
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.search")}
          aria-label={t("home.search")}
          className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-(--lk-accent) focus:outline-none"
          data-testid="home-search"
        />
        {query.trim() && (
          <ul className="mt-2 max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white" data-testid="home-hits">
            {hits.length === 0 && <li className="px-3 py-2 text-xs text-gray-500">{t("search.none")}</li>}
            {hits.map((p) => (
              <li key={p.id}>
                <ProblemButton problem={p} row />
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-5 text-sm font-semibold text-gray-800">{t("home.recent")}</h3>
        {recent.length ? (
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1" data-testid="home-recent">
            {recent.map((p) => (
              <li key={p.id} className="shrink-0">
                <ProblemButton problem={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-gray-500">
            {t("home.recentNone")}{" "}
            <button onClick={() => go("problems", PROBLEMS[0].id)} className="text-(--lk-accent) hover:underline">
              {t("home.firstProblem")} →
            </button>
          </p>
        )}
      </section>
    </div>
  );
}

/** A research project: name, where it is kept, when it was edited, and how much of its blueprint Lean has accepted. */
function ProjectCard({ project: p, onExport }: { project: Listed; onExport: () => void }) {
  const { t, pick } = useLang();
  const pct = p.progress && p.progress.total ? Math.round((100 * p.progress.proved) / p.progress.total) : 0;
  return (
    <li className="group relative">
      <button
        onClick={() => openProject(p.id)}
        className="flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-(--lk-accent) hover:shadow"
        data-testid="home-project"
      >
        <span className="truncate pr-14 text-sm font-semibold text-gray-900">{p.title}</span>
        <span className="text-[11px] text-gray-500">
          {p.where === "disk" ? `⌂ ~/Formalizer/${p.id}` : pick(["this browser", "這個瀏覽器"])}
          {p.updated ? ` · ${t("home.edited").replace("{time}", ago(p.updated, pick))}` : ""}
        </span>
        {p.progress ? (
          <span className="block" title={t("home.progressHint")}>
            <span className="flex h-2 overflow-hidden rounded-full bg-amber-100" aria-hidden>
              <span className="bg-emerald-500" style={{ width: `${pct}%` }} />
            </span>
            <span className="mt-1 block text-xs text-gray-600" data-testid="home-progress">
              {t("home.progress").replace("{proved}", String(p.progress.proved)).replace("{total}", String(p.progress.total))}
            </span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">{t("home.notChecked")}</span>
        )}
      </button>
      <button
        onClick={onExport}
        title={t("home.export")}
        aria-label={t("home.export")}
        className="absolute top-3 right-3 rounded bg-white/90 px-1.5 text-xs text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-100"
      >
        ⬇
      </button>
    </li>
  );
}

function ProblemButton({ problem: p, row = false }: { problem: Problem; row?: boolean }) {
  const { t, pick } = useLang();
  const category = CATEGORIES.find((c) => c.id === p.category);
  const level = LEVEL_STYLE[p.level];
  return (
    <button
      onClick={() => go("problems", p.id)}
      className={
        row
          ? "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50"
          : "flex w-48 flex-col rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:border-(--lk-accent)"
      }
    >
      <span className={`${row ? "min-w-0 flex-1" : "block"} truncate font-medium text-gray-800`}>
        {plainText(pick(p.title)).replace(/`/g, "")}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 truncate text-[11px] text-gray-500">
        <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} title={t(`level.${p.level}`)} />
        {p.level} · {category ? pick(category.title) : p.category}
      </span>
    </button>
  );
}

function BigAction(props: { icon: string; label: string; hint: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-(--lk-accent) hover:shadow disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:shadow-sm"
    >
      <span className="text-2xl leading-none text-(--lk-accent)">{props.icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{props.label}</span>
        <span className="block text-xs leading-snug text-gray-500">
          <RichText text={props.hint} />
        </span>
      </span>
    </button>
  );
}
