/**
 * Tutorial mode's one floating window (引導 / Guide). The page looks the same with the mode on or off; this window does
 * the explaining: the coach's four steps (statement → goal → tactic → result), a tool's two-step reveal when the reader
 * looks at it in the tactic list, the note when tools unlock, the "No goals 🎉" celebration and the way to the next
 * problem. A pulsing outline (and a thin line from the window) points at what is being explained, and the window keeps
 * clear of it. Draggable by its title (the place is remembered per browser), minimised to a pill, closed by ×
 * ("don't show the guide again"; 🧭 Guide brings it back). Phones: a sheet at the bottom of the screen.
 */
import { RichText, useLang } from "@learnkit/web";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { TacticInfo } from "../tactics";
import type { ProblemGuide } from "../tutorialGuide";
import { COACH_STEPS, DONE, guideOff, type CoachStep } from "./progress";
import { CoachCard, NoGoals, TacticReveal, UnlockNote } from "./Tutorial";
import { updateTutorial } from "./useTutorial";

type L = readonly [string, string];

/** What each step points at on the page (the first that is on screen). */
export const GUIDE_TARGET: Record<CoachStep | "reveal" | "solved", string> = {
  statement: '[data-testid="coach-statement"], [data-testid="statement"]',
  goal: '[data-testid="result-tab-goals"]',
  tactic: '[data-testid="tactic-pill"]',
  result: '[data-testid="result-tab-checkers"]',
  reveal: '[data-testid="tactic-pill"]',
  solved: '[data-testid="result-tab-checkers"]',
};

const POS_KEY = "formalizer.guide.pos";
const W = 340;
const GAP = 14;

interface Box {
  x: number;
  y: number;
}
function loadPos(): Box | null {
  try {
    const v = JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
    return v && typeof v.x === "number" && typeof v.y === "number" ? v : null;
  } catch {
    return null;
  }
}
function savePos(p: Box) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ x: Math.round(p.x), y: Math.round(p.y) }));
  } catch {
    /* storage blocked: the place lasts for this visit */
  }
}
const overlaps = (a: DOMRect | { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }) =>
  a.left < b.right + GAP && a.right + GAP > b.left && a.top < b.bottom + GAP && a.bottom + GAP > b.top;

/** a place for the window that keeps clear of `target` (corners first, then beside it) */
function placeAway(target: DOMRect | null, w: number, h: number): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = 64;
  const spots: Box[] = [
    { x: vw - w - 24, y: vh - h - 110 },
    { x: 24, y: vh - h - 60 },
    { x: vw - w - 24, y: top },
    { x: Math.max(24, vw / 2 - w / 2), y: vh - h - 60 },
    { x: 24, y: top },
  ];
  if (target)
    spots.push(
      { x: target.right + GAP * 2, y: Math.max(top, target.top) },
      { x: target.left - w - GAP * 2, y: Math.max(top, target.top) },
      { x: Math.max(8, target.left), y: target.bottom + GAP * 2 },
    );
  const fits = (s: Box) => s.x >= 8 && s.y >= 8 && s.x + w <= vw - 8 && s.y + h <= vh - 8;
  const ok = spots.find((s) => fits(s) && (!target || !overlaps({ left: s.x, top: s.y, right: s.x + w, bottom: s.y + h }, target)));
  return ok ?? spots[0];
}

export interface GuideWindowProps {
  guide: ProblemGuide;
  problemId: string;
  /** the coach's step, DONE when walked or skipped */
  coach: number;
  onStep: (step: number) => void;
  /** a tool being looked at in the tactic list: its two-step reveal */
  reveal: { tactic: string; info: TacticInfo } | null;
  onCloseReveal: () => void;
  /** tools just unlocked: the guide's note */
  unlocked: boolean;
  /** the proof is done: the celebration and the next problem */
  solved: boolean;
  next: { title: string; go: () => void } | null;
  /** the goal step's words about reading a goal */
  goalWords?: L;
}

export default function GuideWindow(props: GuideWindowProps) {
  const { pick } = useLang();
  const { guide, problemId, coach, onStep, reveal, onCloseReveal, unlocked, solved, next } = props;
  const [min, setMin] = useState(false);
  const [doneSeen, setDoneSeen] = useState(false);
  const step: CoachStep | undefined = COACH_STEPS[coach];
  const showSolved = solved && !doneSeen;
  const what: keyof typeof GUIDE_TARGET | null = reveal ? "reveal" : step ? step : showSolved ? "solved" : null;
  const visible = !!what || unlocked;

  // the outline on what is explained (the page's own .tut-coach pulse)
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    if (!what || min) return setTarget(null);
    let el: Element | null = null;
    const find = () => {
      // the selectors in order of preference (the most precise first)
      const found =
        GUIDE_TARGET[what]
          .split(", ")
          .flatMap((sel) => [...document.querySelectorAll(sel)])
          .find((e) => (e as HTMLElement).offsetParent !== null) ?? null;
      // React may rewrite the element's class on a re-render: put the outline back
      if (found && found === el && !found.classList.contains("tut-coach")) found.classList.add("tut-coach");
      if (found !== el) {
        el?.classList.remove("tut-coach");
        el = found;
        el?.classList.add("tut-coach");
        el?.setAttribute("data-coach-active", "");
        setTarget(el);
        // phones: the sheet covers the bottom of the screen; bring the target above it
        const sheet = box.current?.getBoundingClientRect();
        const r = el?.getBoundingClientRect();
        if (el && r && sheet && !window.matchMedia("(min-width: 1280px)").matches && r.bottom > sheet.top - 8)
          window.scrollBy({ top: r.bottom - sheet.top + 24, behavior: "smooth" });
      }
    };
    find();
    // the pill is redrawn by the editor, a tab may appear later: look again now and then
    const timer = setInterval(find, 400);
    return () => {
      clearInterval(timer);
      el?.classList.remove("tut-coach");
      el?.removeAttribute("data-coach-active");
    };
  }, [what, min]);

  // where the window is: the reader's place, unless it would cover the target
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Box | null>(() => loadPos());
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useLayoutEffect(() => {
    if (!wide || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const t = target?.getBoundingClientRect() ?? null;
    const here = pos ?? placeAway(t, r.width, r.height);
    const mine = { left: here.x, top: here.y, right: here.x + r.width, bottom: here.y + r.height };
    const off = here.x + r.width > window.innerWidth || here.y + r.height > window.innerHeight;
    if (!pos || off || (t && overlaps(mine, t))) setPos(placeAway(t, r.width, r.height));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, wide, what, min]);

  // the thin line from the window to the target, kept in step with scrolling and resizing
  const [line, setLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  useEffect(() => {
    if (!wide || !target || min) return setLine(null);
    let raf = 0;
    const tick = () => {
      const a = box.current?.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      if (a && b.width) {
        const cx = Math.max(b.left, Math.min((a.left + a.right) / 2, b.right));
        const cy = Math.max(b.top, Math.min((a.top + a.bottom) / 2, b.bottom));
        const x1 = Math.max(a.left, Math.min(cx, a.right));
        const y1 = Math.max(a.top, Math.min(cy, a.bottom));
        setLine((l) => (l && l.x1 === x1 && l.y1 === y1 && l.x2 === cx && l.y2 === cy ? l : { x1, y1, x2: cx, y2: cy }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, wide, min]);

  const drag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!wide || !box.current || (e.target as HTMLElement).closest("button")) return;
    const r = box.current.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    let last: Box = { x: r.left, y: r.top };
    const move = (ev: PointerEvent) => {
      last = {
        x: Math.min(window.innerWidth - r.width - 4, Math.max(4, ev.clientX - dx)),
        y: Math.min(window.innerHeight - 40, Math.max(4, ev.clientY - dy)),
      };
      setPos(last);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      savePos(last);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  };

  if (!visible) return null;
  const count = step ? `${coach + 1}/${DONE}` : "";
  if (min)
    return (
      <button
        type="button"
        onClick={() => setMin(false)}
        data-testid="guide-pill"
        className="fixed bottom-14 left-4 z-[70] flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-lg hover:bg-amber-100"
      >
        🧭 {pick(["Guide", "引導"])} {count}
      </button>
    );

  const section = (key: string, body: ReactNode) => (
    <div key={key} className="border-t border-amber-100 px-3 py-2 first:border-t-0">
      {body}
    </div>
  );
  return (
    <>
      {line && (
        <svg className="pointer-events-none fixed inset-0 z-[69] h-full w-full" aria-hidden data-testid="guide-line">
          <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
          <circle cx={line.x2} cy={line.y2} r={3.5} fill="#f59e0b" />
        </svg>
      )}
      <div
        ref={box}
        role="dialog"
        aria-label={pick(["Guide", "引導"])}
        data-testid="guide-window"
        data-step={what ?? ""}
        className={
          wide
            ? "fixed z-[70] flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-amber-300 bg-white text-xs shadow-2xl"
            : "fixed inset-x-0 bottom-0 z-[70] flex max-h-[45vh] flex-col overflow-hidden rounded-t-xl border-t border-amber-300 bg-white text-xs shadow-2xl"
        }
        style={wide ? { width: W, left: pos?.x ?? -9999, top: pos?.y ?? 0 } : undefined}
      >
        <div
          onPointerDown={drag}
          className={`flex h-8 shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 ${wide ? "cursor-move" : ""}`}
        >
          <span className="font-semibold text-amber-900">🧭 {pick(["Guide", "引導"])}</span>
          {count && <span className="text-[10px] text-amber-700">{count}</span>}
          <button
            type="button"
            onClick={() => setMin(true)}
            aria-label={pick(["Minimise", "縮小"])}
            title={pick(["Minimise", "縮小"])}
            data-testid="guide-min"
            className="ml-auto rounded px-1.5 text-amber-800 hover:bg-amber-100"
          >
            –
          </button>
          <button
            type="button"
            onClick={() => updateTutorial(guideOff)}
            aria-label={pick(["Close the guide (🧭 Guide brings it back)", "關閉導覽（按 🧭 導覽 可以叫回來）"])}
            title={pick(["Close the guide (🧭 Guide brings it back)", "關閉導覽（按 🧭 導覽 可以叫回來）"])}
            data-testid="guide-close"
            className="rounded px-1.5 text-amber-800 hover:bg-amber-100"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto leading-relaxed text-gray-800">
          {step && section("coach", <CoachCard guide={guide} problemId={problemId} step={coach} onStep={onStep} />)}
          {step === "goal" &&
            props.goalWords &&
            section(
              "goal",
              <p className="text-[11px] text-gray-600" data-testid="goal-legend">
                <RichText text={pick(props.goalWords)} />
              </p>,
            )}
          {unlocked && section("unlock", <UnlockNote note={guide.unlockNote} />)}
          {reveal &&
            section(
              "reveal",
              <div className="space-y-1.5" data-testid="tactic-explained">
                <p className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gray-900">{reveal.tactic.split("\n")[0]}</span>
                  <button type="button" onClick={onCloseReveal} className="ml-auto text-gray-400 hover:text-gray-800" aria-label={pick(["Close", "關閉"])}>
                    ×
                  </button>
                </p>
                <TacticReveal info={reveal.info} here={guide.here[reveal.tactic]} />
              </div>,
            )}
          {showSolved &&
            section(
              "solved",
              <div className="space-y-2">
                <NoGoals />
                {next && (
                  <button
                    type="button"
                    onClick={next.go}
                    data-testid="guide-next-problem"
                    className="w-full rounded-md border border-green-200 bg-white px-2.5 py-1.5 text-left hover:border-green-400"
                  >
                    <span className="text-[11px] font-medium text-green-800">{pick(["Next problem", "下一題"])} →</span>
                    <span className="block font-medium text-gray-900">
                      <RichText text={next.title} />
                    </span>
                  </button>
                )}
                <button type="button" onClick={() => setDoneSeen(true)} className="text-[11px] text-gray-500 hover:text-gray-800">
                  {pick(["Close", "關閉"])}
                </button>
              </div>,
            )}
        </div>
      </div>
    </>
  );
}
