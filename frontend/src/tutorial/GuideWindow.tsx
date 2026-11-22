/**
 * Tutorial mode's one floating window (引導 / Guide). The page looks the same with the mode on or off; this window does
 * the explaining: the coach's four steps (statement → goal → tactic → result), a tool's two-step reveal when the reader
 * looks at it in the tactic list, the note when tools unlock, the "No goals 🎉" celebration and the way on.
 *
 * One level, no card inside: a header strip (🧭 Guide · the step's title · its dots · – ×), the step's words, a footer
 * (‹ Back · Skip · Next ›). It sits beside what it explains (that gets a pulsing outline; a short line joins them when
 * there is a gap), never over it; dragged by its header it stays where the reader put it for this visit. × is "don't
 * show the guide again" (🧭 Guide in the problem's header brings it back). It also keeps clear of the tactic list when
 * that is open (re-placed as the list opens, closes or moves).
 *
 * The statement's parts (StatementAnatomy) are explained here in tutorial mode: a clicked part's meaning joins the
 * statement step, or, on a later step, shows on its own until OK. (With the mode off, a popover on the part says it.)
 *
 * Phones: a one-line sheet at the bottom (🧭 · the step's title · ‹ › · ▴), opened by a tap; each step scrolls its
 * target into the part of the screen above the sheet.
 */
import { RichText, useLang } from "@learnkit/web";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { AnatomyPart } from "../StatementAnatomy";
import type { TacticInfo } from "../tactics";
import type { ProblemGuide } from "../tutorialGuide";
import { overlaps, placeBeside, type Box } from "./place";
import { COACH_STEPS, DONE, guideOff, skipGuide, type CoachStep } from "./progress";
import { NoGoals, STEP_TITLE, TacticReveal, UnlockNote } from "./Tutorial";
import { updateTutorial } from "./useTutorial";

type L = readonly [string, string];

/** What each step points at on the page, most precise first. */
export const GUIDE_TARGET: Record<CoachStep | "reveal" | "solved" | "part", string> = {
  statement: '[data-testid="coach-statement"], [data-testid="statement"]',
  goal: '[data-testid="result-tab-goals"]',
  tactic: '.cm-sorry-target, [data-testid="lean-editor"]',
  result: '[data-testid="result-tab-checkers"]',
  reveal: ".cm-tactic-list, .cm-sorry-target",
  solved: '[data-testid="result-tab-checkers"]',
  part: '[data-testid="statement-anatomy"] [aria-expanded="true"], [data-testid="coach-statement"]',
};
/** the open tactic list (CodeMirror's completion tooltip) and its info box: the window keeps clear of them */
const LIST = ".cm-tooltip-autocomplete, .cm-tooltip.cm-completionInfo";

/** the tactic step's extra words: the list opens by itself */
const HINTS_WORDS: L = [
  "Put the cursor on the `sorry`: the tactic list opens there by itself (Tactic hints, on the toolbar). Arrow keys preview, Enter puts it in.",
  "把游標放到 `sorry` 上：戰術清單會自己在那裡打開（工具列的「戰術提示」）。方向鍵預覽，Enter 放進去。",
];

const W = 300;
const POS_KEY = "formalizer.guide.pos";

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
  /** a part of the statement the reader clicked (StatementAnatomy): what it means */
  part?: AnatomyPart | null;
  onClosePart?: () => void;
  /** the goal step's words about reading a goal (behind ⓘ) */
  goalWords?: L;
}

export default function GuideWindow(props: GuideWindowProps) {
  const { pick } = useLang();
  const { guide, problemId, coach, onStep, reveal, onCloseReveal, unlocked, solved, next, part = null, onClosePart } = props;
  const [min, setMin] = useState(false);
  const [more, setMore] = useState(false);
  const [doneSeen, setDoneSeen] = useState(false);
  const [open, setOpen] = useState(false); // phones: the sheet's body
  const step: CoachStep | undefined = COACH_STEPS[coach];
  const showSolved = solved && !doneSeen;
  // a clicked part joins the statement step; on any other step (or after the walk) it shows on its own
  const partAlone = !!part && step !== "statement";
  const what: keyof typeof GUIDE_TARGET | null = reveal ? "reveal" : partAlone ? "part" : step ? step : showSolved ? "solved" : null;
  const visible = !!what || unlocked;
  useEffect(() => setMore(false), [coach]);
  // a part or a tool the reader asked about: bring the window back and, on a phone, open the sheet
  useEffect(() => {
    if (part || reveal) (setMin(false), setOpen(true));
  }, [part, reveal]);

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
      // phones: the sheet covers the bottom of the screen; scroll the target into the part above it
      const sheet = box.current?.getBoundingClientRect();
      if (el instanceof HTMLElement && sheet && !window.matchMedia("(min-width: 1280px)").matches) {
        const room = window.innerHeight - sheet.height;
        el.style.scrollMarginBottom = `${Math.ceil(sheet.height) + 12}px`;
        el.style.scrollMarginTop = "56px"; // the phone's tab bar
        const r = el.getBoundingClientRect();
        if (r.top < 56 || r.bottom > room - 8) el.scrollIntoView({ block: r.height < room - 80 ? "nearest" : "start", behavior: "smooth" });
      }
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

  // the open tactic list, as "left,top,right,bottom" ("" when closed): watched so the window can keep clear of it
  const [list, setList] = useState("");
  useEffect(() => {
    if (!wide || !visible || min) return setList("");
    const look = () => {
      const rs = [...document.querySelectorAll(LIST)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
      const key = rs.map((r) => [r.left, r.top, r.right, r.bottom].map(Math.round).join(",")).join(";");
      setList((k) => (k === key ? k : key));
    };
    look();
    const timer = setInterval(look, 150);
    return () => clearInterval(timer);
  }, [wide, visible, min]);

  // beside the target, per step, clear of the open list; where the reader dragged it (this visit), unless that would
  // cover the target or the list
  const [pos, setPos] = useState<Box | null>(null);
  const dragged = useRef(false);
  useLayoutEffect(() => {
    if (!wide || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const t = target?.getBoundingClientRect() ?? null;
    const avoid = list
      ? list.split(";").map((k) => {
          const [left, top, right, bottom] = k.split(",").map(Number);
          return { left, top, right, bottom };
        })
      : [];
    const mine = pos && { left: pos.x, top: pos.y, right: pos.x + r.width, bottom: pos.y + r.height };
    const blocked = (m: NonNullable<typeof mine>) => (t && overlaps(m, t)) || avoid.some((a) => overlaps(m, a));
    if (mine && dragged.current && !blocked(mine) && mine.right <= window.innerWidth && mine.bottom <= window.innerHeight) return;
    setPos(placeBeside(t, r.width, r.height, window.innerWidth, window.innerHeight, avoid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, wide, what, min, more, list, part]);

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

  const title = partAlone
    ? pick(["What it means", "代表什麼"])
    : step
    ? pick(STEP_TITLE[step]).replace(/^[①②③④]\s*/, "")
    : reveal
      ? reveal.tactic.split("\n")[0]
      : showSolved
        ? pick(["Proved", "證明完成"])
        : pick(["New tools", "新工具"]);
  const words = (l: L) => <RichText text={pick(l)} />;
  const body: ReactNode[] = [];
  if (step && !partAlone) {
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
  if (part)
    body.push(
      <div key="part" data-testid="guide-part" className={partAlone ? "" : "rounded-md bg-amber-50/70 px-2 py-1.5"}>
        <p className="font-semibold text-gray-900">
          <RichText text={pick(part.title)} />
        </p>
        <p>
          <RichText text={pick(part.text)} />
        </p>
      </div>,
    );
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

  const walking = !!step && !partAlone;
  const footer = walking ? (
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
        onClick={() => (reveal ? onCloseReveal() : partAlone ? onClosePart?.() : setDoneSeen(true))}
        data-testid="guide-ok"
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
          data-testid="guide-head"
          aria-expanded={wide ? undefined : open}
          className={`flex shrink-0 items-center gap-2 bg-amber-50 px-3 ${wide ? "h-8 cursor-move border-b border-amber-200" : `h-10 ${open ? "border-b border-amber-200" : ""}`}`}
        >
          <span className="shrink-0 font-semibold text-amber-900">🧭{wide ? ` ${pick(["Guide", "引導"])}` : ""}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-gray-800">{title}</span>
          {wide && dots}
          {/* phones: the step's ‹ › on the sheet's one line, so the sheet can stay closed */}
          {!wide && walking && (
            <span className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), onStep(coach - 1))}
                disabled={coach === 0}
                aria-label={pick(["Back", "上一步"])}
                data-testid="guide-sheet-back"
                className="rounded px-2 py-1 text-base leading-none text-amber-800 disabled:opacity-30"
              >
                ‹
              </button>
              <span className="text-[11px] text-amber-700 tabular-nums">
                {coach + 1}/{DONE}
              </span>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), onStep(coach + 1))}
                aria-label={coach === DONE - 1 ? pick(["Done", "完成"]) : pick(["Next", "下一步"])}
                data-testid="guide-sheet-next"
                className="rounded px-2 py-1 text-base leading-none text-amber-800"
              >
                {coach === DONE - 1 ? "✓" : "›"}
              </button>
            </span>
          )}
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
        {(wide || open) && footer}
      </div>
    </>
  );
}
