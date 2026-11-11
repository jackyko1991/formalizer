import { go, RichText, useLang } from "@learnkit/web";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import { PROBLEMS, type Problem } from "./problems";
import { check, insertChip, RunnerError, type CheckResult, type Issue } from "./runner";
import { runnerReady, useRunner, type RunnerState } from "./RunnerPanel";

const VERDICT_STYLE: Record<CheckResult["verdict"], string> = {
  proved: "border-green-200 bg-green-50 text-green-800",
  incomplete: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
  "needs-runner": "border-gray-200 bg-gray-50 text-gray-700",
};

/** One problem: the statement in words, the Lean file, Run, and what Lean says (verdict, goals, errors). */
export default function ProblemPage({ problem }: { problem: Problem }) {
  const { t, pick } = useLang();
  const [code, setCode] = useState(problem.start);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [previous, setPrevious] = useState<CheckResult | null>(null);
  const [running, setRunning] = useState(false);
  const [problemText, setProblemText] = useState<string | null>(null);
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
    } catch (e) {
      setProblemText(e instanceof RunnerError && e.message === "offline" ? t("run.offline") : String(e instanceof Error ? e.message : e));
    } finally {
      setRunning(false);
    }
  }
  // hypotheses that weren't there at the same goal last time: the step's effect
  const before = new Set(previous?.goals.flatMap((g) => g.hypotheses) ?? []);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-testid="problem-page">
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-(--lk-accent) uppercase">
            {problem.level} · {problem.runner === "lite" ? t("runner.lite") : t("runner.full")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            <RichText text={pick(problem.title)} />
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            <RichText text={pick(problem.summary)} />
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
            <span className="font-mono">Proof.lean</span>
            <button
              onClick={() => (setCode(problem.start), setResult(null), setPrevious(null))}
              className="ml-auto rounded px-2 py-0.5 hover:bg-gray-200"
            >
              {t("run.reset")}
            </button>
          </div>
          <CodeMirror
            value={code}
            onChange={setCode}
            basicSetup={{ foldGutter: false }}
            className="font-mono text-sm"
            aria-label={t("run.editor")}
            data-testid="lean-editor"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void run()}
            disabled={running || !ready}
            data-testid="run"
            className="rounded-md bg-(--lk-accent) px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {running ? t("run.running") : `▶ ${t("run.run")}`}
          </button>
          {problem.tactics.map((tactic) => {
            const step = problem.steps.includes(tactic);
            const first = tactic.split("\n")[0];
            const label = first.length > 26 || first !== tactic ? `${first.slice(0, 24).trimEnd()} …` : tactic;
            return (
              <button
                key={tactic}
                onClick={() => {
                  // after a finishing try there's no sorry left: start again from the problem's file
                  const next = insertChip(/\bsorry\b/.test(code) ? code : problem.start, tactic, step);
                  setCode(next);
                  if (ready) void run(next);
                }}
                disabled={running}
                title={`${t(step ? "run.stepHint" : "run.tryHint")}\n\n${tactic}`}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 font-mono text-xs text-gray-700 hover:border-(--lk-accent) disabled:opacity-40"
              >
                {t(step || /\bsorry\b/.test(tactic) ? "run.step" : "run.try")} {label}
              </button>
            );
          })}
        </div>
        <RunnerHint runner={runner} onOpen={openRunner} />
      </section>

      <section className="space-y-3" aria-live="polite" data-testid="result">
        {problemText && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{problemText}</p>}
        {!result && !problemText && (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">{t("run.none")}</p>
        )}
        {result && (
          <>
            <p className={`rounded-lg border px-4 py-3 text-sm font-medium ${VERDICT_STYLE[result.verdict]}`} data-testid="verdict">
              {t(`verdict.${result.verdict}`)}
              <span className="ml-2 font-normal text-gray-500">{result.ms} ms</span>
            </p>
            {result.goals.map((g, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white" data-testid="goal">
                <p className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
                  {t("goal.at").replace("{line}", String(g.line))}
                  {g.case && <span className="ml-2 rounded bg-gray-200 px-1.5 font-mono text-gray-700">case {g.case}</span>}
                </p>
                <div className="grid gap-0 sm:grid-cols-2">
                  <div className="border-b border-gray-100 p-3 sm:border-r sm:border-b-0">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{t("goal.known")}</p>
                    {g.hypotheses.length ? (
                      <ul className="space-y-0.5 font-mono text-sm">
                        {g.hypotheses.map((h) => (
                          <li key={h} className={previous && !before.has(h) ? "rounded bg-green-50 text-green-800" : "text-gray-800"}>
                            {h}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">{t("goal.none")}</p>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{t("goal.prove")}</p>
                    <p className="font-mono text-sm text-gray-900">⊢ {g.target}</p>
                    {g.others.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">{t("goal.more").replace("{n}", String(g.others.length))}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {result.errors.map((e, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-white px-4 py-3" data-testid="lean-error">
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
            {result.verdict !== "proved" && (
              <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <RichText text={pick(problem.hint)} />
              </p>
            )}
            {result.verdict === "proved" && <NextProblem id={problem.id} />}
          </>
        )}
      </section>
    </div>
  );
}

/** What Lean says besides errors: "Try this" suggestions (`exact?`, `simp?`) and warnings, by line. */
function Notes({ items }: { items: Issue[] }) {
  const { t } = useLang();
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-sky-200 bg-white px-4 py-3" data-testid="lean-notes">
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

/** After a proof: on to the next problem in the track (or back to the list after the last one). */
function NextProblem({ id }: { id: string }) {
  const { t, pick } = useLang();
  const next = PROBLEMS[PROBLEMS.findIndex((p) => p.id === id) + 1];
  return (
    <button
      onClick={() => go("problems", next ? next.id : null)}
      data-testid="next-problem"
      className="w-full rounded-lg border border-green-200 bg-white px-4 py-3 text-left text-sm hover:border-green-400"
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
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900" data-testid="runner-hint">
      {runner ? t(`runner.state.${runner.state}`) : t("runner.offline")} ·{" "}
      <button onClick={onOpen} className="font-medium underline underline-offset-2">
        {t("runner.how")}
      </button>
    </p>
  );
}
