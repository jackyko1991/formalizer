/**
 * The pieces of Tutorial mode (引導模式) that the problem page places: the mode switch with "Restart tutorial", the
 * coach card that walks statement → goal → tactic → result, a tactic's two-step reveal (where its name comes from,
 * then what it does to this goal, frame by frame), the locked tools row and the note when they unlock, and the
 * "No goals 🎉" celebration.
 */
import { RichText, useLang } from "@learnkit/web";
import { useEffect, useState, type CSSProperties } from "react";
import type { TacticInfo } from "../tactics";
import { NO_GOALS, type ProblemGuide, type TacticHere } from "../tutorialGuide";
import { COACH_STEPS, coachShown, DONE, guideOff, reopenGuide, restart, setOn, skipGuide, type CoachStep } from "./progress";
import { updateTutorial, useReducedMotion, useTutorial } from "./useTutorial";

type L = readonly [string, string];

/** The switch in the problem's header, the Guide button (brings the coach back), and "Restart tutorial" with its
 *  inline confirm. */
export function TutorialBar({ problemId }: { problemId: string }) {
  const { pick } = useLang();
  const progress = useTutorial();
  const { on } = progress;
  const showing = coachShown(progress, problemId);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" data-testid="tutorial-bar">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => updateTutorial((p) => setOn(p, !on))}
        data-testid="tutorial-switch"
        title={pick([
          "Tutorial mode: a coach walks you through each step, and new tools appear as you need them. Off: everything at once.",
          "引導模式：教練帶你一步步走，新工具在需要時才出現。關掉：所有東西一次顯示。",
        ])}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${
          on ? "border-amber-300 bg-amber-50 text-amber-900" : "border-gray-200 text-gray-600 hover:text-gray-900"
        }`}
      >
        <span aria-hidden className={`relative h-3.5 w-6 shrink-0 rounded-full transition-colors ${on ? "bg-amber-500" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-2.5" : ""}`} />
        </span>
        {pick(["Tutorial mode", "引導模式"])}
      </button>
      {on && (
        <button
          type="button"
          onClick={() => updateTutorial((p) => reopenGuide(p, problemId))}
          disabled={showing}
          aria-pressed={showing}
          data-testid="guide-button"
          title={pick(["Show the coach for this problem again, where you left off", "重新顯示這一題的教練，從你停下的地方繼續"])}
          className="flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-0.5 font-medium text-amber-900 hover:bg-amber-50 disabled:cursor-default disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
        >
          🧭 {pick(["Guide", "導覽"])}
        </button>
      )}
      {on &&
        (confirm ? (
          <span className="flex items-center gap-2 rounded-md bg-red-50 px-2 py-0.5 text-red-900" role="group" data-testid="restart-confirm">
            {pick(["Forget your tutorial progress?", "清除你的教學進度？"])}
            <button
              type="button"
              onClick={() => (updateTutorial(restart), setConfirm(false))}
              data-testid="restart-yes"
              className="font-semibold underline underline-offset-2"
            >
              {pick(["Restart", "重新開始"])}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="text-gray-600 hover:text-gray-900">
              {pick(["Cancel", "取消"])}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            data-testid="restart-tutorial"
            className="text-gray-500 hover:text-gray-800 hover:underline"
          >
            ↺ {pick(["Restart tutorial", "重新開始教學"])}
          </button>
        ))}
    </div>
  );
}

const STEP_TITLE: Record<CoachStep, L> = {
  statement: ["① The statement: what is claimed", "① 陳述：宣稱了什麼"],
  goal: ["② The goal: what is left to prove", "② 目標：還要證明什麼"],
  tactic: ["③ A tactic: one proof step", "③ 戰術：證明的一步"],
  result: ["④ The result: Lean's verdict", "④ 結果：Lean 的判定"],
};

/** The coach's card for the current step, placed inside the highlighted area. */
export function CoachCard({
  guide,
  problemId,
  step,
  onStep,
}: {
  guide: ProblemGuide;
  problemId: string;
  step: number;
  onStep: (step: number) => void;
}) {
  const { pick } = useLang();
  const name = COACH_STEPS[step];
  if (!name) return null;
  const last = step === DONE - 1;
  return (
    <div
      className="tut-fade-in relative z-[1] mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 shadow-sm"
      role="note"
      aria-live="polite"
      data-testid="coach-card"
      data-step={name}
    >
      <p className="flex items-center justify-between gap-2">
        <span className="font-semibold">{pick(STEP_TITLE[name])}</span>
        <span className="shrink-0 text-[10px] text-amber-700">
          {step + 1} / {DONE}
        </span>
      </p>
      <p className="mt-0.5">
        <RichText text={pick(guide.coach[name])} />
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {step > 0 && (
          <button type="button" onClick={() => onStep(step - 1)} className="rounded px-1.5 py-0.5 text-amber-800 hover:bg-amber-100">
            ‹ {pick(["Back", "上一步"])}
          </button>
        )}
        <button
          type="button"
          onClick={() => onStep(step + 1)}
          data-testid="coach-next"
          className="rounded-md bg-amber-500 px-2 py-0.5 font-medium text-white hover:bg-amber-600"
        >
          {last ? pick(["Done ✓", "完成 ✓"]) : `${pick(["Next", "下一步"])} ›`}
        </button>
        <button
          type="button"
          onClick={() => updateTutorial((p) => skipGuide(p, problemId))}
          data-testid="coach-skip"
          title={pick(["Hide the coach on this problem; 🧭 Guide brings it back", "這一題先不顯示教練；按 🧭 導覽 可以叫回來"])}
          className="ml-auto text-amber-700 hover:text-amber-950 hover:underline"
        >
          {pick(["Skip guide", "略過導覽"])}
        </button>
      </div>
      <button
        type="button"
        onClick={() => updateTutorial(guideOff)}
        data-testid="coach-off"
        className="mt-1 text-[10px] text-amber-700/80 hover:text-amber-950 hover:underline"
      >
        {pick(["Don't show the guide again (🧭 Guide turns it back on)", "不再顯示導覽（按 🧭 導覽 可以再打開）"])}
      </button>
    </div>
  );
}

/**
 * The two-step reveal of a chip in tutorial mode: ① where its name comes from, ② what it does to this goal (frames,
 * one after another with the change between them, ending in ✓; or Lean's verdict in plain words with ✗).
 */
export function TacticReveal({ info, here }: { info: TacticInfo; here?: TacticHere }) {
  const { pick } = useLang();
  const reduce = useReducedMotion();
  const frames = here?.frames ?? [];
  const [shown, setShown] = useState(reduce ? frames.length : 1);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduce) return setShown(frames.length);
    setShown(1);
    let n = 1;
    const timer = setInterval(() => {
      n++;
      setShown(n);
      if (n > frames.length) clearInterval(timer);
    }, 1100);
    return () => clearInterval(timer);
  }, [reduce, frames.length, run]);
  const finished = shown > frames.length || (reduce && shown >= frames.length);
  return (
    <div className="space-y-2" data-testid="tactic-reveal">
      <div>
        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["① The name", "① 名字的由來"])}</p>
        <p className="mt-0.5">
          <RichText text={pick(info.origin ?? info.short)} />
        </p>
      </div>
      {here && (
        <div className="tut-fade-in" style={{ animationDelay: reduce ? undefined : "0.35s" }}>
          <p className="flex items-center justify-between text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
            {pick(["② On this goal", "② 用在這個目標上"])}
            {frames.length > 1 && !reduce && finished && (
              <button
                type="button"
                onClick={() => setRun((r) => r + 1)}
                className="font-sans text-[10px] font-medium tracking-normal text-(--lk-accent) normal-case hover:underline"
              >
                ↻ {pick(["Replay", "重播"])}
              </button>
            )}
          </p>
          {here.fails ? (
            <p className="mt-1 flex gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-red-900" data-testid="reveal-fails">
              <span className="font-bold">✗</span>
              <span>
                <RichText text={pick(here.fails)} />
              </span>
            </p>
          ) : (
            <ol className="mt-1 space-y-1" data-testid="reveal-frames">
              {frames.slice(0, Math.max(1, shown)).map((f, i) => (
                <li key={i} className={i > 0 ? "tut-fade-in" : undefined}>
                  {i > 0 && (
                    <p className="flex items-center gap-1 py-0.5 text-[10px] text-gray-600">
                      <span className="font-bold text-(--lk-accent)">↓</span>
                      {f.note && <RichText text={pick(f.note)} />}
                    </p>
                  )}
                  <pre className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[11px] leading-snug whitespace-pre-wrap text-gray-900">
                    {f.goal === NO_GOALS ? pick(["No goals", "沒有目標了"]) : f.goal}
                  </pre>
                  {i === 0 && f.note && (
                    <p className="pt-0.5 text-[10px] text-gray-600">
                      <RichText text={pick(f.note)} />
                    </p>
                  )}
                </li>
              ))}
              {finished && frames.length > 0 && (
                <li className="tut-fade-in flex items-center gap-1 font-medium text-green-800" data-testid="reveal-done">
                  <span className="font-bold">✓</span>
                  {pick(["Goal cleared", "目標消除了"])}
                </li>
              )}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

/** "🔒 n more tools unlock when …" */
export function LockedRow({ count, rule, pill = false }: { count: number; rule: ProblemGuide["unlock"]; pill?: boolean }) {
  const { pick } = useLang();
  if (!count) return null;
  const when: L =
    rule === "after-fail"
      ? ["you try one and Lean says no", "你試一個而 Lean 說不行時"]
      : ["you solve this problem", "你解出這一題時"];
  const words = pick([
    `${count} more ${count === 1 ? "tool unlocks" : "tools unlock"} when ${when[0]}.`,
    `還有 ${count} 個工具，${when[1]}就會解鎖。`,
  ]);
  // the editor's toolbar: a small pill, the sentence on hover
  if (pill)
    return (
      <span
        className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-50 px-2 text-[11px] text-gray-500"
        title={words}
        data-testid="locked-tools"
      >
        <span aria-hidden>🔒</span>+{count}
      </span>
    );
  return (
    <p
      className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-500"
      data-testid="locked-tools"
    >
      <span aria-hidden>🔒</span>
      {pick([
        `${count} more ${count === 1 ? "tool unlocks" : "tools unlock"} when ${when[0]}.`,
        `還有 ${count} 個工具，${when[1]}就會解鎖。`,
      ])}
    </p>
  );
}

/** The note when tools unlock: "New tool unlocked: omega …" */
export function UnlockNote({ note }: { note: L }) {
  const { pick } = useLang();
  return (
    <p
      className="tut-slide-in rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-[11px] leading-snug text-teal-900"
      data-testid="unlock-note"
      role="status"
    >
      🔓 <RichText text={pick(note)} />
    </p>
  );
}

const CONFETTI = ["#f59e0b", "#0f766e", "#6d28d9", "#0369a1", "#be185d", "#16a34a"];
/** "No goals 🎉", with a short burst (none with reduced motion). */
export function NoGoals() {
  const { pick } = useLang();
  return (
    <div className="relative rounded-lg border border-green-200 bg-green-50 px-3 py-4 text-center" data-testid="no-goals">
      <p className="tut-celebrate text-base font-semibold text-green-800">{pick(["No goals 🎉", "沒有目標了 🎉"])}</p>
      <p className="mt-1 text-xs text-green-900">
        {pick(["Every goal is cleared: Lean accepts the proof.", "所有目標都消除了：Lean 接受這個證明。"])}
      </p>
      <span className="tut-confetti" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => {
          const angle = (i / 14) * Math.PI * 2;
          const r = 60 + (i % 3) * 18;
          return (
            <i
              key={i}
              style={
                {
                  background: CONFETTI[i % CONFETTI.length],
                  "--dx": `${Math.round(Math.cos(angle) * r)}px`,
                  "--dy": `${Math.round(Math.sin(angle) * r * 0.6)}px`,
                  animationDelay: `${(i % 4) * 0.04}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </span>
    </div>
  );
}
