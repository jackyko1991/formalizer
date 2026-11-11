import { RichText, useLang } from "@learnkit/web";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useRef, useState } from "react";
import type { Problem } from "./problems";
import { check, fillFirstSorry, health, RunnerError, runnerUrl, type CheckResult, type Health } from "./runner";

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
  const runner = useRunner();
  const ready = runner !== "checking" && runner?.state === "ready";

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
            <span className="font-mono">Hello.lean</span>
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
          {problem.tactics.map((tactic) => (
            <button
              key={tactic}
              onClick={() => {
                // after a failed try there's no sorry left: start again from the problem's file
                const next = fillFirstSorry(/\bsorry\b/.test(code) ? code : problem.start, tactic);
                setCode(next);
                if (ready) void run(next);
              }}
              disabled={running}
              title={t("run.tryHint")}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 font-mono text-xs text-gray-700 hover:border-(--lk-accent) disabled:opacity-40"
            >
              {t("run.try")} {tactic}
            </button>
          ))}
        </div>
        <RunnerStatus runner={runner} />
      </section>

      <section className="space-y-3" aria-live="polite" data-testid="result">
        {problemText && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{problemText}</p>}
        {!result && !problemText && <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">{t("run.none")}</p>}
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
                    {g.others.length > 0 && <p className="mt-1 text-xs text-gray-500">{t("goal.more").replace("{n}", String(g.others.length))}</p>}
                  </div>
                </div>
              </div>
            ))}
            {result.errors.map((e, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-white px-4 py-3" data-testid="lean-error">
                <p className="text-xs font-medium text-red-700">{e.line ? t("error.at").replace("{line}", String(e.line)) : t("error.title")}</p>
                <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-gray-800">{e.message}</pre>
              </div>
            ))}
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
          </>
        )}
      </section>
    </div>
  );
}

/** Polls the local runner every few seconds: is Lean running on this computer, and is it warm? */
function useRunner(): Health | null | "checking" {
  const [state, setState] = useState<Health | null | "checking">("checking");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const h = await health();
      if (!alive) return;
      setState(h);
      timer.current = setTimeout(poll, h?.state === "ready" ? 15000 : 3000);
    };
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, []);
  return state;
}

function RunnerStatus({ runner }: { runner: Health | null | "checking" }) {
  const { t } = useLang();
  if (runner === "checking") return null;
  if (!runner)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="runner-offline">
        <p className="font-medium">{t("runner.offline")}</p>
        <p className="mt-1">{t("runner.start")}</p>
        <pre className="mt-2 overflow-x-auto rounded bg-gray-900 px-3 py-2 font-mono text-xs text-gray-100">
          {"git clone https://github.com/jackyko1991/formalizer\ncd formalizer && pixi run lean-build && pixi run runner"}
        </pre>
        <p className="mt-1 text-xs text-amber-800">{t("runner.where").replace("{url}", runnerUrl())}</p>
      </div>
    );
  return (
    <p className="text-xs text-gray-500" data-testid="runner-status">
      {t(`runner.state.${runner.state}`)} · {runner.runner === "lite" ? t("runner.lite") : t("runner.full")} · {runner.lean}
    </p>
  );
}
