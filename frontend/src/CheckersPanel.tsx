/**
 * The independent checkers as a TDD guard: the frozen statement is the test, the checkers are the test runner. A row
 * of checkers to pick (Lite for everyone; Full listed on the Research page, for Pro on a Linux runner), Run, and one
 * chip per checker: ✓ passes, ✗ fails, – not available, ! could not run, each with its reason and time.
 * It runs by itself once the page's own check turns "proved" (red → green), and on Run.
 */
import { useLang } from "@learnkit/web";
import { useEffect, useRef, useState } from "react";
import { availability, CHECKERS, chip, DEFAULT_CHECKERS, duration, info, overall, runnable } from "./checkers";
import { runnerReady, useRunner } from "./RunnerPanel";
import { check, RunnerError, type CheckOutcome } from "./runner";

const PICKED_KEY = "formalizer.checkers";

function loadPicked(scope: string): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(`${PICKED_KEY}.${scope}`) ?? "null");
    return Array.isArray(saved) && saved.every((x) => typeof x === "string") ? saved : DEFAULT_CHECKERS;
  } catch {
    return DEFAULT_CHECKERS;
  }
}

export default function CheckersPanel({
  code,
  theorems,
  statements,
  challenge,
  full = false,
  pro = false,
  verdict,
  scope = "problems",
  compact = false,
}: {
  /** the whole file as the page checks it */
  code: string;
  theorems: string[];
  /** the frozen statements: the test */
  statements: string[];
  /** the problem's starting file (statement-match compares against it) */
  challenge?: string;
  /** list the Full checkers (the Research page) */
  full?: boolean;
  /** the paid tier: Full checkers can be picked (when the runner has them) */
  pro?: boolean;
  /** the page's own verdict: turning "proved" runs the checkers once */
  verdict?: string;
  /** where the picked checkers are remembered */
  scope?: string;
  /** tutorial mode: one status light, the full panel behind "View the judge's details" */
  compact?: boolean;
}) {
  const { pick } = useLang();
  const { runner } = useRunner();
  const health = runner === "checking" ? null : runner;
  const ready = runnerReady(runner);
  const [picked, setPicked] = useState<string[]>(() => loadPicked(scope));
  const [outcomes, setOutcomes] = useState<CheckOutcome[] | null>(null);
  const [checkedCode, setCheckedCode] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const opts = { full, pro };
  const shown = CHECKERS.filter((c) => c.tier === "lite" || full);

  function toggle(id: string) {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    setPicked(next);
    try {
      localStorage.setItem(`${PICKED_KEY}.${scope}`, JSON.stringify(next));
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }

  const latest = useRef({ code, theorems, statements, challenge, picked, health, opts });
  latest.current = { code, theorems, statements, challenge, picked, health, opts };
  async function run() {
    const now = latest.current;
    const ids = runnable(now.picked, now.health, now.opts);
    if (!ids.length) return;
    setRunning(true);
    setError(null);
    try {
      const r = await check(now.code, now.theorems, now.statements, false, { checkers: ids, challenge: now.challenge });
      setOutcomes(r.checks ?? []);
      setCheckedCode(now.code);
    } catch (e) {
      setError(e instanceof RunnerError ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  // red → green: when the page's own check says "proved", let every picked checker have its say
  const ranFor = useRef<string | null>(null);
  useEffect(() => {
    if (verdict !== "proved" || !ready || ranFor.current === code) return;
    ranFor.current = code;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict, ready, code]);

  const stale = outcomes !== null && checkedCode !== code;
  const colour = outcomes ? overall(outcomes) : "none";
  const canRun = ready && runnable(picked, health, opts).length > 0 && !running;
  const opened = outcomes?.find((o) => o.id === open);
  const [details, setDetails] = useState(false);

  if (compact && !details) {
    const light =
      running ? "checking" : outcomes && !stale && colour === "green" ? "passed" : outcomes && !stale && colour === "red" ? "failed" : "not-yet";
    const look = {
      checking: ["bg-sky-400 animate-pulse motion-reduce:animate-none", ["Checking…", "檢查中……"]],
      passed: ["bg-green-500", ["Passed ✓", "通過 ✓"]],
      failed: ["bg-red-500", ["Not passed ✗", "沒有通過 ✗"]],
      "not-yet": ["bg-gray-300", ["Not yet", "還沒有"]],
    } as const;
    return (
      <section className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs" data-testid="checkers-panel" data-compact data-light={light}>
        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${look[light][0]}`} />
        <span className="font-medium text-gray-700">{pick(["Judges:", "裁判："])}</span>
        <span className="text-gray-800" data-testid="checkers-light">{pick(look[light][1])}</span>
        <button
          type="button"
          onClick={() => setDetails(true)}
          aria-expanded={false}
          data-testid="checkers-details"
          className="ml-auto text-(--lk-accent) hover:underline"
        >
          {pick(["View the judge's details ▾", "查看底層裁判細節 ▾"])}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-2 rounded-md border border-gray-200 bg-white p-3 text-xs" data-testid="checkers-panel">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide text-gray-500 uppercase">{pick(["Checkers", "檢查器"])}</span>
        <span className="text-gray-400">{pick(["the statement is the test", "陳述就是測試"])}</span>
        {compact && (
          <button type="button" onClick={() => setDetails(false)} aria-expanded className="text-(--lk-accent) hover:underline">
            {pick(["Hide ▴", "收起 ▴"])}
          </button>
        )}
        <button
          onClick={() => void run()}
          disabled={!canRun}
          data-testid="run-checkers"
          className="ml-auto rounded-md bg-(--lk-accent) px-2.5 py-1 font-medium text-white disabled:opacity-40"
        >
          {running ? pick(["Checking…", "檢查中……"]) : pick(["▶ Run checkers", "▶ 執行檢查器"])}
        </button>
      </div>

      {/* the picker */}
      <div className="flex flex-wrap gap-1.5" data-testid="checker-picker">
        {shown.map((c) => {
          const a = availability(c, health, opts);
          const on = picked.includes(c.id) && a.enabled;
          return (
            <label
              key={c.id}
              title={`${pick(c.about)}${a.reason ? `\n— ${pick(a.reason)}` : ""}`}
              data-testid={`checker-${c.id}`}
              className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${
                a.enabled ? (on ? "bg-sky-50 text-sky-900 ring-sky-300" : "text-gray-700 ring-gray-200") : "cursor-not-allowed text-gray-400 ring-gray-100"
              }`}
            >
              <input type="checkbox" className="h-3 w-3" checked={on} disabled={!a.enabled} onChange={() => toggle(c.id)} />
              {pick(c.title)}
              {c.tier === "full" && <span className="rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-800">Pro</span>}
            </label>
          );
        })}
      </div>

      {/* the results */}
      {error && <p className="text-red-700">{error}</p>}
      {outcomes && (
        <div className={`space-y-1.5 ${stale ? "opacity-50" : ""}`} data-testid="checker-results" data-overall={colour}>
          <div className="flex flex-wrap gap-1.5">
            {outcomes.map((o) => {
              const c = chip(o);
              const name = info(o.id)?.title ?? [o.id, o.id];
              return (
                <button
                  key={o.id}
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                  title={o.message}
                  data-testid={`check-${o.id}`}
                  data-verdict={o.verdict}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 ${c.cls}`}
                >
                  <span className="font-bold">{c.glyph}</span>
                  {pick(name)}
                  {o.verdict !== "unavailable" && <span className="text-[10px] opacity-70">{duration(o.ms)}</span>}
                </button>
              );
            })}
          </div>
          {stale && <p className="text-gray-500">{pick(["The file changed since: run again.", "檔案已改動：請再執行一次。"])}</p>}
          {opened ? (
            <p className="rounded bg-gray-50 px-2 py-1 text-gray-700" data-testid="check-message">
              <span className="font-medium">{pick(info(opened.id)?.title ?? [opened.id, opened.id])}</span> {pick(chip(opened).label)}: {opened.message}
            </p>
          ) : (
            outcomes
              .filter((o) => o.verdict === "fail" || o.verdict === "error")
              .map((o) => (
                <p key={o.id} className="text-red-800">
                  <span className="font-medium">{pick(info(o.id)?.title ?? [o.id, o.id])}:</span> {o.message}
                </p>
              ))
          )}
        </div>
      )}
      {!outcomes && !error && (
        <p className="text-gray-500">
          {pick([
            "Pick checkers and run them: each one must pass (✓) before the proof counts. They also run by themselves when Lean says proved.",
            "選好檢查器後執行：每一個都要通過（✓）證明才算數。Lean 判定「已證明」時也會自動執行。",
          ])}
        </p>
      )}
    </section>
  );
}
