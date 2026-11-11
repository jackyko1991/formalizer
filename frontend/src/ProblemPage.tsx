/**
 * The Problems page in Tensorizer's layout. Wide screens (≥ xl), three columns at full height:
 *   1. the library (foldable),
 *   2. the problem: title, chips, summary, ‹ › through the track; below, Statement / Hint tabs,
 *   3. the proof: Proof.lean with a Tactics panel (chips + Run, like Tensorizer's Parameters), then Goals and Result.
 * Phones show one part at a time (Problem / Proof / Result tabs) and pick problems from a menu.
 */
import { go, plainText, RichText, useLang } from "@learnkit/web";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import ProblemLibrary, { LEVEL_STYLE } from "./ProblemLibrary";
import { CATEGORIES, collectionsOf, PROBLEMS, type Problem } from "./problems";
import { check, insertChip, RunnerError, type CheckResult, type Issue } from "./runner";
import { runnerReady, useRunner, type RunnerState } from "./RunnerPanel";

const VERDICT_STYLE: Record<CheckResult["verdict"], string> = {
  proved: "border-green-200 bg-green-50 text-green-800",
  incomplete: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
  "needs-runner": "border-gray-200 bg-gray-50 text-gray-700",
};
const PANEL_HEAD = "flex h-8 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 text-xs";
const PANEL_TITLE = "font-semibold tracking-wide text-gray-500 uppercase";

type MobileTab = "problem" | "proof" | "result";
const MOBILE_TABS: MobileTab[] = ["problem", "proof", "result"];

export default function ProblemsPage({ id }: { id: string | null }) {
  const { t, pick } = useLang();
  const problem = PROBLEMS.find((p) => p.id === id) ?? PROBLEMS[0];
  const [libraryOpen, setLibraryOpen] = useState(true);
  const select = (next: string) => go("problems", next);
  return (
    <div className="flex flex-col bg-white xl:h-full xl:min-h-0 xl:flex-row" data-testid="problem-page">
      {/* phones and tablets: a menu instead of the library column */}
      <div className="border-b border-gray-200 p-3 xl:hidden">
        <select
          value={problem.id}
          onChange={(e) => select(e.target.value)}
          aria-label={t("page.problems")}
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
        >
          {CATEGORIES.filter((c) => PROBLEMS.some((p) => p.category === c.id)).map((c) => (
            <optgroup key={c.id} label={pick(c.title)}>
              {PROBLEMS.filter((p) => p.category === c.id).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.level} · {plainText(pick(p.title)).replace(/`/g, "")}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 1. Library */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] xl:flex ${libraryOpen ? "w-64" : "w-10"}`}
      >
        <div className="flex h-9 shrink-0 items-center gap-1 border-b border-gray-200 bg-gray-50 px-1.5">
          {libraryOpen && (
            <span className="flex-1 rounded-md bg-(--lk-accent) px-2 py-1 text-center text-xs font-medium text-white shadow-sm">
              {t("page.problems")}
            </span>
          )}
          <button
            onClick={() => setLibraryOpen((o) => !o)}
            title={t(libraryOpen ? "library.fold" : "library.open")}
            className="rounded px-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
          >
            {libraryOpen ? "«" : "»"}
          </button>
        </div>
        {libraryOpen ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ProblemLibrary selected={problem.id} onSelect={select} />
          </div>
        ) : (
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex-1 py-3 text-xs font-medium tracking-wide text-gray-500 [writing-mode:vertical-rl] hover:text-gray-800"
          >
            {t("library")}
          </button>
        )}
      </aside>

      <ProblemView key={problem.id} problem={problem} onSelect={select} />
    </div>
  );
}

function ProblemView({ problem, onSelect }: { problem: Problem; onSelect: (id: string) => void }) {
  const { t, pick } = useLang();
  const [code, setCode] = useState(problem.start);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [previous, setPrevious] = useState<CheckResult | null>(null);
  const [running, setRunning] = useState(false);
  const [problemText, setProblemText] = useState<string | null>(null);
  const [lowerTab, setLowerTab] = useState<"statement" | "hint">("statement");
  const [mobileTab, setMobileTab] = useState<MobileTab>("problem");
  const onPhone = (tab: MobileTab, display = "xl:block") => (mobileTab === tab ? "" : `hidden ${display}`);
  const { runner, open: openRunner } = useRunner();
  const ready = runnerReady(runner);

  useEffect(() => {
    setCode(problem.start);
    setResult(null);
    setPrevious(null);
  }, [problem.id]);

  async function run(source = code) {
    setRunning(true);
    setProblemText(null);
    try {
      const next = await check(source, problem.theorems, problem.statements);
      setPrevious(result);
      setResult(next);
      setMobileTab((tab) => (tab === "problem" ? "result" : tab));
    } catch (e) {
      setProblemText(e instanceof RunnerError && e.message === "offline" ? t("run.offline") : String(e instanceof Error ? e.message : e));
    } finally {
      setRunning(false);
    }
  }
  const reset = () => (setCode(problem.start), setResult(null), setPrevious(null));
  const level = LEVEL_STYLE[problem.level];
  const category = CATEGORIES.find((c) => c.id === problem.category)!;
  // hypotheses that weren't there at the same goal last time: the step's effect
  const before = new Set(previous?.goals.flatMap((g) => g.hypotheses) ?? []);

  return (
    <>
      <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-white xl:hidden" role="tablist">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 border-b-2 py-2.5 text-sm font-medium ${
              mobileTab === tab ? "border-(--lk-accent) text-(--lk-accent)" : "border-transparent text-gray-500"
            }`}
          >
            {t(`mtab.${tab}`)}
          </button>
        ))}
      </div>

      {/* 2. The problem: title, chips, summary pinned; Statement / Hint scroll */}
      <main className={`flex min-w-0 flex-col border-r border-gray-200 xl:min-h-0 xl:flex-1 ${onPhone("problem", "xl:flex")}`}>
        <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            <RichText text={pick(problem.title)} />
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-(--lk-accent)">{pick(category.title)}</span>
            <span
              className={`flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium ${level.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
              {problem.level} · {t(`level.${problem.level}`)}
            </span>
            <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-500">
              {problem.runner === "lite" ? t("runner.lite") : t("runner.full")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            <RichText text={pick(problem.summary)} />
          </p>
          <CollectionNav problemId={problem.id} onSelect={onSelect} />
        </div>

        <div className="space-y-4 bg-gray-50/60 p-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
          <div role="tablist" className="flex gap-1">
            {(["statement", "hint"] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={lowerTab === tab}
                onClick={() => setLowerTab(tab)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  lowerTab === tab ? "bg-white text-(--lk-accent) shadow-sm ring-1 ring-gray-200" : "text-gray-600 hover:bg-white/70"
                }`}
              >
                {t(`tab.${tab}`)}
              </button>
            ))}
          </div>
          {lowerTab === "statement" ? (
            <div className="space-y-3" data-testid="statement">
              <p className="text-sm leading-relaxed text-gray-700">
                <RichText text={t("problems.intro")} />
              </p>
              <pre className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-900">
                {problem.statements.join("\n\n")}
              </pre>
              <p className="text-xs text-gray-500">
                {t("statement.checked")} <span className="font-mono text-gray-700">{problem.theorems.join(", ")}</span>
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700" data-testid="hint">
              <RichText text={pick(problem.hint)} />
            </p>
          )}
        </div>
      </main>

      {/* 3. The proof: Proof.lean + Tactics, then Goals and Result */}
      <section className="flex min-w-0 flex-col xl:min-h-0 xl:w-[54%] xl:shrink-0">
        <div className={`flex flex-col overflow-hidden bg-white xl:min-h-0 xl:flex-[1.4] xl:flex-row ${onPhone("proof", "xl:flex")}`}>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-end gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-2">
              <span className="rounded-t-md border border-b-0 border-gray-200 bg-white px-3 py-1.5 font-mono text-xs text-gray-900">
                Proof.lean
                {code !== problem.start && <span className="ml-1 text-amber-600">●</span>}
              </span>
            </div>
            <div className="flex h-7 shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-3 text-xs text-gray-500">
              <span className="truncate">{t("proof.about")}</span>
              {code !== problem.start && (
                <button onClick={reset} className="shrink-0 text-(--lk-accent) hover:underline">
                  {t("run.reset")}
                </button>
              )}
            </div>
            <div className="max-h-[60vh] min-h-48 flex-1 overflow-auto xl:max-h-none xl:min-h-0">
              <CodeMirror
                value={code}
                onChange={setCode}
                basicSetup={{ foldGutter: false }}
                className="font-mono text-sm"
                aria-label={t("run.editor")}
                data-testid="lean-editor"
              />
            </div>
          </div>

          {/* like Tensorizer's Parameters panel: what you can try, and Run */}
          <aside className="flex w-full shrink-0 flex-col border-t border-gray-200 bg-white xl:w-60 xl:border-t-0 xl:border-l">
            <div className={PANEL_HEAD}>
              <span className={PANEL_TITLE}>{t("panel.tactics")}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
              <p className="pb-1 text-[11px] leading-snug text-gray-500">{t("run.tryHint")}</p>
              {problem.tactics.map((tactic) => {
                const step = problem.steps.includes(tactic) || /\bsorry\b/.test(tactic);
                const first = tactic.split("\n")[0];
                const label = first.length > 26 || first !== tactic ? `${first.slice(0, 24).trimEnd()} …` : tactic;
                return (
                  <button
                    key={tactic}
                    onClick={() => {
                      // after a finishing try there's no sorry left: start again from the problem's file
                      const next = insertChip(/\bsorry\b/.test(code) ? code : problem.start, tactic, problem.steps.includes(tactic));
                      setCode(next);
                      if (ready) void run(next);
                    }}
                    disabled={running}
                    title={`${t(step ? "run.stepHint" : "run.tryHint")}\n\n${tactic}`}
                    data-testid="tactic"
                    className="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-left font-mono text-xs text-gray-800 hover:border-(--lk-accent) disabled:opacity-40"
                  >
                    <span
                      className={`shrink-0 rounded px-1 font-sans text-[10px] font-medium ${step ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-(--lk-accent)"}`}
                    >
                      {t(step ? "run.step" : "run.try")}
                    </span>
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 space-y-2 border-t border-gray-200 p-3">
              <RunnerHint runner={runner} onOpen={openRunner} />
              <button
                onClick={() => void run()}
                disabled={running || !ready}
                data-testid="run"
                className="w-full rounded-md bg-(--lk-accent) py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {running ? t("run.running") : `▶ ${t("run.run")}`}
              </button>
            </div>
          </aside>
        </div>

        <div className={`flex flex-col border-t border-gray-200 xl:min-h-0 xl:flex-1 xl:flex-row ${onPhone("result", "xl:flex")}`}>
          {/* Goals: what Lean still wants, as the terminal is in Tensorizer */}
          <section className="flex min-w-0 flex-col bg-white xl:w-1/2 xl:shrink-0" data-testid="goals">
            <div className={PANEL_HEAD}>
              <span className={PANEL_TITLE}>{t("panel.goals")}</span>
              {result && <span className="text-gray-500">{result.goals.length}</span>}
            </div>
            <div className="min-h-32 flex-1 space-y-2 overflow-auto p-3">
              {!result || !result.goals.length ? (
                <p className="text-xs text-gray-400">{t(result?.verdict === "proved" ? "goals.done" : "goals.none")}</p>
              ) : (
                result.goals.map((g, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-gray-200" data-testid="goal">
                    <p className="border-b border-gray-100 bg-gray-50 px-3 py-1 text-[11px] text-gray-500">
                      {t("goal.at").replace("{line}", String(g.line))}
                      {g.case && <span className="ml-2 rounded bg-gray-200 px-1.5 font-mono text-gray-700">case {g.case}</span>}
                    </p>
                    <div className="px-3 py-2 font-mono text-xs leading-relaxed">
                      {g.hypotheses.map((h) => (
                        <p key={h} className={previous && !before.has(h) ? "rounded bg-green-50 text-green-800" : "text-gray-700"}>
                          {h}
                        </p>
                      ))}
                      <p className="mt-0.5 border-t border-gray-200 pt-0.5 text-gray-900">⊢ {g.target}</p>
                      {g.others.length > 0 && (
                        <p className="mt-1 font-sans text-[11px] text-gray-500">{t("goal.more").replace("{n}", String(g.others.length))}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Result: the verdict, errors, notes, axioms */}
          <section
            className="flex min-w-0 flex-col border-t border-gray-200 bg-white xl:min-h-0 xl:flex-1 xl:border-t-0 xl:border-l"
            aria-live="polite"
            data-testid="result"
          >
            <div className={PANEL_HEAD}>
              <span className={PANEL_TITLE}>{t("panel.result")}</span>
              {result && <span className="text-gray-500">{result.ms} ms</span>}
            </div>
            <div className="min-h-32 flex-1 space-y-2 overflow-auto p-3">
              {problemText && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{problemText}</p>}
              {!result && !problemText && <p className="text-xs text-gray-400">{t("run.none")}</p>}
              {result && (
                <>
                  <p className={`rounded-lg border px-3 py-2 text-sm font-medium ${VERDICT_STYLE[result.verdict]}`} data-testid="verdict">
                    {t(`verdict.${result.verdict}`)}
                  </p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="rounded-lg border border-red-200 bg-white px-3 py-2" data-testid="lean-error">
                      <p className="text-xs font-medium text-red-700">
                        {e.line ? t("error.at").replace("{line}", String(e.line)) : t("error.title")}
                      </p>
                      <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-gray-800">{e.message}</pre>
                    </div>
                  ))}
                  <Notes items={[...(result.infos ?? []), ...result.warnings]} />
                  {Object.keys(result.axioms).length > 0 && (
                    <p className="text-xs text-gray-500" data-testid="axioms">
                      {t("axioms.label")}{" "}
                      {Object.entries(result.axioms)
                        .map(([name, list]) => `${name}: ${list.length ? list.join(", ") : t("axioms.none")}`)
                        .join(" · ")}
                    </p>
                  )}
                  {result.verdict === "error" && (
                    <button onClick={() => setLowerTab("hint")} className="text-xs text-(--lk-accent) hover:underline">
                      {t("hint.show")}
                    </button>
                  )}
                  {result.verdict === "proved" && <NextProblem id={problem.id} onSelect={onSelect} />}
                </>
              )}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

/** "🧭 Collection · k of n ‹ ›" for each collection (learning path) the problem is in; nothing when it is in none. */
function CollectionNav({ problemId, onSelect }: { problemId: string; onSelect: (id: string) => void }) {
  const { t, pick } = useLang();
  const found = collectionsOf(problemId);
  if (!found.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {found.map(({ collection: c, index }) => (
        <div
          key={c.id}
          data-testid="series-nav"
          className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs"
        >
          <span className="cursor-help font-medium text-gray-800" title={pick(c.summary)}>
            🧭 {pick(c.title)}
          </span>
          <span className="text-gray-500">
            {t("series.of")
              .replace("{i}", String(index + 1))
              .replace("{n}", String(c.items.length))}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onSelect(c.items[index - 1])}
              disabled={index <= 0}
              title={t("series.prev")}
              className="rounded px-1.5 text-gray-600 hover:bg-white disabled:opacity-30"
            >
              ‹
            </button>
            <button
              onClick={() => onSelect(c.items[index + 1])}
              disabled={index >= c.items.length - 1}
              title={t("series.next")}
              className="rounded px-1.5 text-gray-600 hover:bg-white disabled:opacity-30"
            >
              ›
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

/** What Lean says besides errors: "Try this" suggestions (`exact?`, `simp?`) and warnings, by line. */
function Notes({ items }: { items: Issue[] }) {
  const { t } = useLang();
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-sky-200 bg-white px-3 py-2" data-testid="lean-notes">
      <p className="text-xs font-medium text-sky-800">{t("notes.title")}</p>
      {[...items]
        .sort((a, b) => a.line - b.line)
        .map((n, i) => (
          <div key={i} className="mt-1">
            <p className="text-[11px] text-gray-500">{t("notes.at").replace("{line}", String(n.line))}</p>
            <pre className="font-mono text-xs whitespace-pre-wrap text-gray-800">{n.message}</pre>
          </div>
        ))}
    </div>
  );
}

/** After a proof: on to the next problem in the track (or back to the first after the last one). */
function NextProblem({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const { t, pick } = useLang();
  const next = PROBLEMS[PROBLEMS.findIndex((p) => p.id === id) + 1];
  return (
    <button
      onClick={() => onSelect(next ? next.id : PROBLEMS[0].id)}
      data-testid="next-problem"
      className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-left text-sm hover:border-green-400"
    >
      <span className="text-xs font-medium text-green-800">{next ? `${t("next.title")} · ${next.level}` : t("next.done")}</span>
      <span className="mt-0.5 block font-medium text-gray-900">{next ? <RichText text={pick(next.title)} /> : t("next.list")} →</span>
    </button>
  );
}

/** A one-line pointer to the header's runner button while Lean isn't ready (the instructions live in its panel). */
function RunnerHint({ runner, onOpen }: { runner: RunnerState; onOpen: () => void }) {
  const { t } = useLang();
  if (runner === "checking" || runnerReady(runner)) return null;
  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900" data-testid="runner-hint">
      {runner ? t(`runner.state.${runner.state}`) : t("runner.offline")} ·{" "}
      <button onClick={onOpen} className="font-medium underline underline-offset-2">
        {t("runner.how")}
      </button>
    </p>
  );
}
