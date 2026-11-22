/**
 * Tutorial mode's one floating window (引導 / Guide). The page looks the same with the mode on or off; this window does
 * the explaining: the coach's four steps (statement → goal → tactic → result), a tool's two-step reveal when the reader
 * looks at it in the tactic list, the note when tools unlock, the "No goals 🎉" celebration and the way on.
 *
 * One level, no card inside: a header strip (🧭 Guide · the step's title · its dots · – ×), the step's words, a footer
 * (‹ Back · Skip · Next ›). It sits beside what it explains (that gets a pulsing outline; a short line joins them when
 * there is a gap), never over it; dragged by its header it stays where the reader put it for this visit. × is "don't
 * show the guide again" (🧭 Guide in the problem's header brings it back). Phones: a compact sheet at the bottom.
 */
import { RichText, useLang } from "@learnkit/web";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { TacticInfo } from "../tactics";
import type { ProblemGuide } from "../tutorialGuide";
import { COACH_STEPS, DONE, guideOff, skipGuide, type CoachStep } from "./progress";
import { NoGoals, STEP_TITLE, TacticReveal, UnlockNote } from "./Tutorial";
import { updateTutorial } from "./useTutorial";

type L = readonly [string, string];

/** What each step points at on the page, most precise first. */
export const GUIDE_TARGET: Record<CoachStep | "reveal" | "solved", string> = {
  statement: '[data-testid="coach-statement"], [data-testid="statement"]',
  goal: '[data-testid="result-tab-goals"]',
  tactic: '.cm-sorry-target, [data-testid="lean-editor"]',
  result: '[data-testid="result-tab-checkers"]',
  reveal: ".cm-tactic-list, .cm-sorry-target",
  solved: '[data-testid="result-tab-checkers"]',
};

/** the tactic step's extra words: the list opens by itself */
const HINTS_WORDS: L = [
  "Put the cursor on the `sorry`: the tactic list opens there by itself (Tactic hints, on the toolbar). Arrow keys preview, Enter puts it in.",
  "把游標放到 `sorry` 上：戰術清單會自己在那裡打開（工具列的「戰術提示」）。方向鍵預覽，Enter 放進去。",
];

const W = 300;
const GAP = 12;
const POS_KEY = "formalizer.guide.pos";

interface Box {
  x: number;
  y: number;
}
interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const overlaps = (a: Rect, b: Rect) => a.left < b.right + 4 && a.right + 4 > b.left && a.top < b.bottom + 4 && a.bottom + 4 > b.top;

/** beside the target where there is room (right, left, below, above), else a corner clear of it */
export function placeBeside(t: Rect | null, w: number, h: number, vw: number, vh: number): Box {
  const top = 60;
  const clampY = (y: number) => Math.min(Math.max(top, y), vh - h - 8);
  const clampX = (x: number) => Math.min(Math.max(8, x), vw - w - 8);
  const spots: Box[] = t
    ? [
        { x: t.right + GAP, y: clampY(t.top) },
        { x: t.left - w - GAP, y: clampY(t.top) },
        { x: clampX(t.left), y: t.bottom + GAP },
        { x: clampX(t.left), y: t.top - h - GAP },
      ]
    : [];
  spots.push({ x: vw - w - 24, y: vh - h - 110 }, { x: 24, y: vh - h - 60 }, { x: vw - w - 24, y: top });
  const fits = (s: Box) => s.x >= 8 && s.y >= 8 && s.x + w <= vw - 8 && s.y + h <= vh - 8;
  const clear = (s: Box) => !t || !overlaps({ left: s.x, top: s.y, right: s.x + w, bottom: s.y + h }, t);
  return spots.find((s) => fits(s) && clear(s)) ?? spots[spots.length - 1];
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
  /** the goal step's words about reading a goal (behind ⓘ) */
  goalWords?: L;
}

export default function GuideWindow(props: GuideWindowProps) {
  const { pick } = useLang();
  const { guide, problemId, coach, onStep, reveal, onCloseReveal, unlocked, solved, next } = props;
  const [min, setMin] = useState(false);
  const [more, setMore] = useState(false);
  const [doneSeen, setDoneSeen] = useState(false);
  const [open, setOpen] = useState(false); // phones: the sheet's body
  const step: CoachStep | undefined = COACH_STEPS[coach];
  const showSolved = solved && !doneSeen;
  const what: keyof typeof GUIDE_TARGET | null = reveal ? "reveal" : step ? step : showSolved ? "solved" : null;
  const visible = !!what || unlocked;
  useEffect(() => setMore(false), [coach]);

  const box = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // the outline on what is explained (the page's .tut-coach pulse)
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    if (!what || min) return setTarget(null);
    let el: Element | null = null;
    const find = () => {
      const found =
        GUIDE_TARGET[what]
          .split(", ")
          .flatMap((sel) => [...document.querySelectorAll(sel)])
          .find((e) => (e as HTMLElement).offsetParent !== null || e.classList.contains("cm-tooltip")) ?? null;
      // React may rewrite the element's class on a re-render: put the outline back
      if (found && found === el && !found.classList.contains("tut-coach")) found.classList.add("tut-coach");
      if (found === el) return;
      el?.classList.remove("tut-coach");
      el?.removeAttribute("data-coach-active");
      el = found;
      el?.classList.add("tut-coach");
      el?.setAttribute("data-coach-active", "");
      setTarget(el);
      // phones: the sheet covers the bottom of the screen; bring the target above it
      const sheet = box.current?.getBoundingClientRect();
      const r = el?.getBoundingClientRect();
      if (r && sheet && !window.matchMedia("(min-width: 1280px)").matches && r.top > sheet.top - 40)
        window.scrollBy({ top: r.top - sheet.top + 80, behavior: "smooth" });
    };
    find();
    // the editor redraws its marks, a tab may appear later: look again now and then
    const timer = setInterval(find, 400);
    return () => {
      clearInterval(timer);
      el?.classList.remove("tut-coach");
      el?.removeAttribute("data-coach-active");
    };
  }, [what, min]);

  // beside the target, per step; where the reader dragged it (this visit), unless that would cover the target
  const [pos, setPos] = useState<Box | null>(null);
  const dragged = useRef(false);
  useLayoutEffect(() => {
    if (!wide || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const t = target?.getBoundingClientRect() ?? null;
    const mine = pos && { left: pos.x, top: pos.y, right: pos.x + r.width, bottom: pos.y + r.height };
    if (dragged.current && mine && (!t || !overlaps(mine, t)) && mine.right <= window.innerWidth && mine.bottom <= window.innerHeight) return;
    setPos(placeBeside(t, r.width, r.height, window.innerWidth, window.innerHeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, wide, what, min, more]);

  // a short line from the window to the target when they don't touch
  const [line, setLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  useEffect(() => {
    if (!wide || !target || min) return setLine(null);
    let raf = 0;
    const tick = () => {
      const a = box.current?.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      if (a && b.width) {
        const x2 = Math.max(b.left, Math.min((a.left + a.right) / 2, b.right));
        const y2 = Math.max(b.top, Math.min((a.top + a.bottom) / 2, b.bottom));
        const x1 = Math.max(a.left, Math.min(x2, a.right));
        const y1 = Math.max(a.top, Math.min(y2, a.bottom));
        const far = Math.hypot(x2 - x1, y2 - y1) > 6;
        setLine((l) => (!far ? null : l && l.x1 === x1 && l.y1 === y1 && l.x2 === x2 && l.y2 === y2 ? l : { x1, y1, x2, y2 }));
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
      dragged.current = true;
      setPos(last);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(last));
      } catch {
        /* storage blocked */
      }
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  };

  if (!visible) return null;
  const dots = step && (
    <span className="flex shrink-0 items-center gap-1" aria-label={`${coach + 1} / ${DONE}`} data-testid="guide-dots">
      {COACH_STEPS.map((s, i) => (
        <span key={s} className={`h-1.5 w-1.5 rounded-full ${i <= coach ? "bg-amber-500" : "bg-amber-200"}`} />
      ))}
    </span>
  );
  if (min)
    return (
      <button
        type="button"
        onClick={() => setMin(false)}
        data-testid="guide-pill"
        className="fixed bottom-14 left-4 z-[70] flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-lg hover:bg-amber-100"
      >
        🧭 {pick(["Guide", "引導"])} {dots}
      </button>
    );

  const title = step
    ? pick(STEP_TITLE[step]).replace(/^[①②③④]\s*/, "")
    : reveal
      ? reveal.tactic.split("\n")[0]
      : showSolved
        ? pick(["Proved", "證明完成"])
        : pick(["New tools", "新工具"]);
  const words = (l: L) => <RichText text={pick(l)} />;
  const body: ReactNode[] = [];
  if (step) {
    body.push(
      <p key="coach" data-testid="coach-card" data-step={step}>
        {words(guide.coach[step])}
      </p>,
    );
    if (step === "tactic")
      body.push(
        <p key="hints" className="text-gray-600">
          {words(HINTS_WORDS)}
        </p>,
      );
    if (step === "goal" && props.goalWords && more)
      body.push(
        <p key="goal" className="text-gray-600" data-testid="goal-legend">
          {words(props.goalWords)}
        </p>,
      );
  }
  if (unlocked) body.push(<UnlockNote key="unlock" note={guide.unlockNote} />);
  if (reveal)
    body.push(
      <div key="reveal" data-testid="tactic-explained">
        <TacticReveal info={reveal.info} here={guide.here[reveal.tactic]} />
      </div>,
    );
  if (showSolved && !step)
    body.push(
      <div key="solved" className="space-y-2">
        <NoGoals />
        {next && (
          <button type="button" onClick={next.go} data-testid="guide-next-problem" className="w-full text-left text-green-800 hover:underline">
            {pick(["Next problem", "下一題"])}: <RichText text={next.title} /> →
          </button>
        )}
      </div>,
    );

  const footer = step ? (
    <div className="flex h-9 shrink-0 items-center gap-2 border-t border-amber-100 px-3">
      {coach > 0 && (
        <button type="button" onClick={() => onStep(coach - 1)} className="text-amber-800 hover:underline">
          ‹ {pick(["Back", "上一步"])}
        </button>
      )}
      {step === "goal" && props.goalWords && (
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="text-gray-500 hover:text-gray-800">
          ⓘ {pick(more ? ["Less", "收起"] : ["More", "更多"])}
        </button>
      )}
      <button
        type="button"
        onClick={() => updateTutorial((p) => skipGuide(p, problemId))}
        data-testid="coach-skip"
        title={pick(["Hide the guide on this problem; 🧭 Guide brings it back", "這一題先不顯示導覽；按 🧭 導覽 可以叫回來"])}
        className="ml-auto text-gray-500 hover:text-gray-800"
      >
        {pick(["Skip", "略過"])}
      </button>
      <button
        type="button"
        onClick={() => onStep(coach + 1)}
        data-testid="coach-next"
        className="rounded-md bg-amber-500 px-2.5 py-1 font-medium text-white hover:bg-amber-600"
      >
        {coach === DONE - 1 ? pick(["Done ✓", "完成 ✓"]) : `${pick(["Next", "下一步"])} ›`}
      </button>
    </div>
  ) : (
    <div className="flex h-9 shrink-0 items-center border-t border-amber-100 px-3">
      <button
        type="button"
        onClick={() => (reveal ? onCloseReveal() : setDoneSeen(true))}
        className="ml-auto rounded-md border border-amber-300 px-2.5 py-1 text-amber-900 hover:bg-amber-50"
      >
        {pick(["OK", "知道了"])}
      </button>
    </div>
  );

  return (
    <>
      {line && (
        <svg className="pointer-events-none fixed inset-0 z-[69] h-full w-full" aria-hidden data-testid="guide-line">
          <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
          <circle cx={line.x2} cy={line.y2} r={3} fill="#f59e0b" />
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
            ? "fixed z-[70] flex max-h-[60vh] flex-col overflow-hidden rounded-lg border border-amber-300 bg-white text-xs shadow-xl"
            : "fixed inset-x-0 bottom-0 z-[70] flex max-h-[50vh] flex-col overflow-hidden rounded-t-lg border-t border-amber-300 bg-white text-xs shadow-2xl"
        }
        style={wide ? { width: W, left: pos?.x ?? -9999, top: pos?.y ?? 0 } : undefined}
      >
        <div
          onPointerDown={drag}
          onClick={() => !wide && setOpen((o) => !o)}
          className={`flex h-8 shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 ${wide ? "cursor-move" : ""}`}
        >
          <span className="shrink-0 font-semibold text-amber-900">🧭 {pick(["Guide", "引導"])}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{title}</span>
          {dots}
          {!wide && <span className="text-amber-700">{open ? "▾" : "▴"}</span>}
          <button
            type="button"
            onClick={(e) => (e.stopPropagation(), setMin(true))}
            aria-label={pick(["Minimise", "縮小"])}
            title={pick(["Minimise", "縮小"])}
            data-testid="guide-min"
            className="rounded px-1 text-amber-800 hover:bg-amber-100"
          >
            –
          </button>
          <button
            type="button"
            onClick={(e) => (e.stopPropagation(), updateTutorial(guideOff))}
            aria-label={pick(["Close the guide (🧭 Guide brings it back)", "關閉導覽（按 🧭 導覽 可以叫回來）"])}
            title={pick(["Close the guide (🧭 Guide brings it back)", "關閉導覽（按 🧭 導覽 可以叫回來）"])}
            data-testid="guide-close"
            className="rounded px-1 text-amber-800 hover:bg-amber-100"
          >
            ×
          </button>
        </div>
        {(wide || open) && (
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2 text-[12.5px] leading-relaxed text-gray-800">{body}</div>
        )}
        {footer}
      </div>
    </>
  );
}
