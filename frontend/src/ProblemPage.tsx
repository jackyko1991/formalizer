/**
 * The Problems page in Tensorizer's layout. Wide screens (≥ xl), three columns at full height:
 *   1. the library (foldable),
 *   2. the problem: title, chips, summary, ‹ › through the track; below, Statement / Hint tabs,
 *   3. the proof: Proof.lean with a Tactics panel (chips + Run, like Tensorizer's Parameters), then Goals and Result.
 * Phones show one part at a time (Problem / Proof / Result tabs) and pick problems from a menu.
 * The left column has a second tab, Research (like Tensorizer's Workspace): the research projects, opened in the main
 * area at #/problems/research/<project>.
 */
import { go, plainText, ProblemPicture, RelatedProblems, RichText, useLang, type Localized } from "@learnkit/web";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { mergeFiles, onAgentFiles, setAgentContext, type AgentContext } from "./agent/bus";
import CheckersPanel, { LIGHT_LOOK, type CheckersLight } from "./CheckersPanel";
import { useAsync } from "./mathlib/hooks";
import { loadProblemMap } from "./problemMap";
import TwoLayerMap, { type ProofSource } from "./TwoLayerMap";
import ProblemLibrary, { LEVEL_STYLE } from "./ProblemLibrary";
import { CATEGORIES, collectionsOf, PROBLEMS, readOnlyOn, type Problem } from "./problems";
import { check, insertChip, joinFiles, RunnerError, sorryOffsets, type CheckResult, type Issue, type LeanFile } from "./runner";
import { runnerReady, useRunner, type RunnerState } from "./RunnerPanel";
import { lean } from "./leanLanguage";
import { sorryAt, sorryMarks } from "./sorryMarks";
import { explainTactic, statementParts } from "./tactics";
import ResearchList from "./research/ResearchList";
import ResearchPage from "./research/ResearchPage";
import { LEFT_TAB_KEY, parseRecent, problemsView, pushRecent, RECENT_KEY, store, stored, type LeftTab } from "./routes";
import { GUIDE } from "./tutorialGuide";
import StatementAnatomy from "./StatementAnatomy";
import { showsAnatomy } from "./tutorial/anatomy";
import NaturalProof, { MirrorLegend, stepWords } from "./tutorial/NaturalProof";
import { mirrorLeanText, paperSteps, type GuideMirror } from "./tutorial/mirror";
import { PlainStatementMirror } from "./tutorial/StatementMirror";
import { mirrorFor } from "./proofMirror";
import { stepMarks } from "./tutorial/stepMarks";
import { coachShown, DONE, initialGoal, locateSteps, reopenGuide, stepAtLine, isRevealed, markRevealed, markSolved, reachStep, setStep, stepOf, unlock, unlocksNow, visibleChips } from "./tutorial/progress";
import { CoachCard, LockedRow, NoGoals, TacticReveal, TutorialBar, UnlockNote } from "./tutorial/Tutorial";
import { updateTutorial, useTutorial } from "./tutorial/useTutorial";
import { LibraryColumn, PANEL_HEAD, PANEL_TITLE, tabClass, VerdictChip, Workspace, WorkspaceFrame, type PhonePart, type Tone } from "./WorkspaceFrame";

/** the verdict in a word or two, for the feedback header (the whole sentence is in its title and the Messages tab) */
const VERDICT_CHIP: Record<CheckResult["verdict"], Localized> = {
  proved: ["✓ Proved", "✓ 已證明"],
  incomplete: ["⚠ sorry left", "⚠ 還有 sorry"],
  error: ["✗ Error", "✗ 錯誤"],
  "needs-runner": ["Needs Full", "需要 Full"],
};
const VERDICT_TONE: Record<CheckResult["verdict"], Tone> = { proved: "good", incomplete: "warn", error: "bad", "needs-runner": "plain" };
const VERDICT_TEXT: Record<CheckResult["verdict"], string> = {
  proved: "text-green-800",
  incomplete: "text-amber-900",
  error: "text-red-800",
  "needs-runner": "text-gray-700",
};
/** the file with the problem's statement, checked last */
const MAIN = "Proof.lean";

type MobileTab = "problem" | "proof" | "result";
const MOBILE_TABS: MobileTab[] = ["problem", "proof", "result"];
const PHONE_PART: Record<MobileTab, PhonePart> = { problem: "problem", proof: "work", result: "results" };
/** where each coach step is on a phone: statement, goal (with the results), tactic, result */
const COACH_TAB: MobileTab[] = ["problem", "result", "proof", "result"];
/** the feedback column's tabs */
type FeedTab = "goals" | "messages" | "map" | "checkers";
const FEED_TABS: FeedTab[] = ["goals", "checkers", "messages", "map"];
/** the library: folded or open by the reader's hand (remembered); untouched, it folds itself once a problem is picked */
const LIBRARY_KEY = "formalizer.library";

export default function ProblemsPage({ tab, section }: { tab: string | null; section: string | null }) {
  const { t, pick } = useLang();
  const view = problemsView({ tab, section });
  const problem = PROBLEMS.find((p) => view.kind === "problem" && p.id === view.id) ?? PROBLEMS[0];
  const [libraryChoice, setLibraryChoice] = useState(() => stored(LIBRARY_KEY));
  // untouched by the reader: open on the bare Problems page, folded to its rail once a problem is open
  const [libraryOpen, setLibraryOpen] = useState(libraryChoice === "open" || (libraryChoice !== "folded" && !tab));
  const toggleLibrary = () => {
    const next = !libraryOpen;
    setLibraryOpen(next);
    setLibraryChoice(next ? "open" : "folded");
    store(LIBRARY_KEY, next ? "open" : "folded");
  };
  // the left column: the library (Problems) or the research projects, remembered; opening a project shows Research
  const [leftTab, setLeftTabState] = useState<LeftTab>(() => (stored(LEFT_TAB_KEY) === "research" ? "research" : "problems"));
  const setLeftTab = (next: LeftTab) => (setLeftTabState(next), store(LEFT_TAB_KEY, next));
  useEffect(() => {
    if (view.kind === "research") setLeftTab("research");
  }, [view.kind]);
  // recently viewed library problems, for the home
  useEffect(() => {
    if (view.kind === "problem") store(RECENT_KEY, JSON.stringify(pushRecent(parseRecent(stored(RECENT_KEY)), problem.id)));
  }, [view.kind, problem.id]);
  const select = (next: string) => go("problems", next);
  // picked from the library: fold it to its rail (unless the reader keeps it open), giving the room to the workspace
  const pickFromLibrary = (next: string) => {
    if (libraryChoice !== "open") setLibraryOpen(false);
    select(next);
  };
  const tabs = (
    <div role="tablist" className="grid flex-1 grid-cols-2 gap-1" data-testid="left-tabs">
      {(["problems", "research"] as const).map((id) => (
        <button
          key={id}
          role="tab"
          aria-selected={leftTab === id}
          onClick={() => setLeftTab(id)}
          data-testid={`left-tab-${id}`}
          className={`rounded-md px-2 py-1 text-xs font-medium transition ${
            leftTab === id ? "bg-(--lk-accent) text-white shadow-sm" : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          }`}
        >
          {t(id === "problems" ? "page.problems" : "page.research")}
        </button>
      ))}
    </div>
  );
  return (
    <WorkspaceFrame
      testId="problem-page"
      phoneLibrary={
        // phones and tablets: the same two tabs, then a menu of problems or the research list
        <div className="space-y-2 border-b border-gray-200 p-3 xl:hidden">
          <div className="flex rounded-lg bg-gray-100 p-1">{tabs}</div>
          {leftTab === "problems" ? (
            <select
              value={view.kind === "problem" ? problem.id : ""}
              onChange={(e) => select(e.target.value)}
              aria-label={t("page.problems")}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm"
            >
              {view.kind === "research" && <option value="">{pick(["Pick a problem…", "選一題……"])}</option>}
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
          ) : (
            <details className="rounded-md border border-gray-200" open={view.kind === "research" && !view.project}>
              <summary className="cursor-pointer px-3 py-1.5 text-sm font-medium text-gray-700">
                {pick(["Research projects and demos", "研究專案與範例"])}
              </summary>
              <div className="max-h-[55vh] overflow-y-auto p-2">
                <ResearchList selected={view.kind === "research" ? view.project : undefined} />
              </div>
            </details>
          )}
        </div>
      }
      library={
        // 1. Library or research projects
        <LibraryColumn
          open={libraryOpen}
          onToggle={toggleLibrary}
          head={tabs}
          rail={t(leftTab === "problems" ? "library" : "page.research")}
          foldLabel={t(libraryOpen ? "library.fold" : "library.open")}
        >
          {leftTab === "problems" ? (
            <ProblemLibrary selected={view.kind === "problem" ? problem.id : null} onSelect={pickFromLibrary} />
          ) : (
            <ResearchList selected={view.kind === "research" ? view.project : undefined} />
          )}
        </LibraryColumn>
      }
    >
      {view.kind === "research" ? (
        <div className="min-w-0 flex-1 bg-gray-50/60 xl:min-h-0 xl:overflow-y-auto" data-testid="research-main">
          <ResearchPage id={view.project} />
        </div>
      ) : (
        <ProblemView key={problem.id} problem={problem} onSelect={select} />
      )}
    </WorkspaceFrame>
  );
}

function ProblemView({ problem, onSelect }: { problem: Problem; onSelect: (id: string) => void }) {
  const { t, pick } = useLang();
  const [code, setCode] = useState(problem.start);
  // files checked before Proof.lean, left to right: the problem's own, then any the reader adds for lemmas
  const [files, setFiles] = useState<LeanFile[]>(() => problem.files ?? []);
  const [active, setActive] = useState(MAIN);
  const [result, setResult] = useState<CheckResult | null>(null);
  // where each line of the last check came from: "Lemmas.lean, line 3"
  const [where, setWhere] = useState<(line: number) => { file: string; line: number }>(() => (line: number) => ({ file: MAIN, line }));
  const [previous, setPrevious] = useState<CheckResult | null>(null);
  const [running, setRunning] = useState(false);
  const [problemText, setProblemText] = useState<string | null>(null);
  const [lowerTab, setLowerTab] = useState<"statement" | "hint" | "natural">("statement");
  // the feedback column: the goals while writing, Lean's messages on errors, the two-layer map (TwoLayerMap.tsx) once
  // proved, the checkers
  const [feedTab, setFeedTab] = useState<FeedTab>("goals");
  const [checkersLight, setCheckersLight] = useState<CheckersLight>("not-yet");
  // the toolbar's popovers: the tactics that don't fit on its line, the list of sorrys
  const [moreOpen, setMoreOpen] = useState(false);
  const [sorryOpen, setSorryOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("problem");
  const { runner, open: openRunner } = useRunner();
  const ready = runnerReady(runner);
  // a Mathlib problem without a Full runner: its reference proof, read-only (the Lite runner has no Mathlib)
  const readOnly = readOnlyOn(problem, runner && runner !== "checking" ? runner.runner : null);
  // Tutorial mode (src/tutorial): a coach, the goal from the start, tools that unlock as they are needed
  const guide = problem.category === "tutorial" ? GUIDE[problem.id] : undefined;
  const progress = useTutorial();
  const tutorial = !!guide && progress.on;
  const coach = tutorial && coachShown(progress, problem.id) ? stepOf(progress, problem.id) : DONE;
  const goStep = (n: number) => updateTutorial((p) => setStep(p, problem.id, n));
  const advance = (n: number) => tutorial && updateTutorial((p) => reachStep(p, problem.id, n));
  /** the tools that just unlocked here (they slide in, with the guide's note) */
  const [justUnlocked, setJustUnlocked] = useState<string[]>([]);
  const coachMoved = useRef(false);
  useEffect(() => {
    if (!tutorial || coach >= DONE) return;
    setMobileTab(COACH_TAB[coach]);
    if (coach === 1) setFeedTab("goals");
    if (coach === 3) setFeedTab("checkers");
    // after the first step, bring the highlighted part into view (a phone has just switched tabs)
    if (coachMoved.current)
      requestAnimationFrame(() => document.querySelector("[data-coach-active]")?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    coachMoved.current = true;
  }, [tutorial, coach]);

  useEffect(() => {
    setCode(problem.start);
    setResult(null);
    setPrevious(null);
  }, [problem.id]);

  /** `auto`: the page's own first run of the start file in tutorial mode (Lean's goal replaces the preview) */
  async function run(source = code, extra = files, auto = false) {
    setRunning(true);
    setProblemText(null);
    try {
      const joined = joinFiles([...extra, { name: MAIN, code: source }]);
      const next = await check(joined.code, problem.theorems, problem.statements);
      setWhere(() => joined.where);
      setPrevious(result);
      setResult(next);
      // after a Run, the checkers first: their chips are the verdict to read (the page's own first run keeps the goal)
      if (!auto) setFeedTab("checkers");
      if (!auto) setMobileTab((tab) => (tab === "problem" ? "result" : tab));
      if (tutorial && guide) {
        if (next.verdict === "proved") updateTutorial((p) => markSolved(p, problem.id));
        if (!progress.unlockedIn.includes(problem.id) && unlocksNow(guide.unlock, { verdict: next.verdict, errors: next.errors.length, auto })) {
          setJustUnlocked(chips.locked);
          updateTutorial((p) => unlock(p, problem.id, guide.introduces));
        }
      }
    } catch (e) {
      setFeedTab("messages");
      setProblemText(e instanceof RunnerError && e.message === "offline" ? t("run.offline") : String(e instanceof Error ? e.message : e));
    } finally {
      setRunning(false);
    }
  }
  // tutorial mode: run the start file once, so the goal shown is Lean's own
  const autoRan = useRef(false);
  useEffect(() => {
    if (!tutorial || !ready || readOnly || autoRan.current || result || code !== problem.start) return;
    autoRan.current = true;
    void run(problem.start, files, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorial, ready, readOnly]);
  const reset = () => (setCode(problem.start), setFiles(problem.files ?? []), setActive(MAIN), setResult(null), setPrevious(null));
  const edited = code !== problem.start || JSON.stringify(files) !== JSON.stringify(problem.files ?? []);
  const own = new Set((problem.files ?? []).map((f) => f.name));
  const activeFile = files.find((f) => f.name === active);
  const at = (line: number) => {
    const w = where(line);
    return { file: w.file, line: String(w.line) };
  };
  // the AI assistant (agent/AgentPanel.tsx): what is on screen, and the agent's edits back into the editor
  const [sel, setSel] = useState<{ cursor: AgentContext["cursor"]; selection?: AgentContext["selection"] }>({ cursor: undefined });
  // the proof mirror: the guide's paper steps, each found in the live Proof.lean by its Lean lines (tutorial/stepMarks.ts)
  // every problem has one (proofMirror.ts): the tutorial's from its guide, the others written for them
  const mirror = mirrorFor(problem.id) as GuideMirror | undefined;
  const steps = useMemo(() => paperSteps(mirror, problem.solution), [mirror, problem.solution]);
  const anchors = useMemo(() => steps.map((s) => s.lean), [steps]);
  // the Lean side is the editor's Proof.lean: the reader's code, or the reference proof when it is read-only here
  const leanShown = readOnly ? problem.solution : code;
  const located = useMemo(() => locateSteps(leanShown, steps), [leanShown, steps]);
  const [stepHover, setStepHover] = useState<number | null>(null);
  const [stepPin, setStepPin] = useState<number | null>(null);
  const [cursorStep, setCursorStep] = useState<number | null>(null);
  /** a gutter badge tapped: its step in words, over the editor */
  const [badge, setBadge] = useState<number | null>(null);
  const activeStep = stepHover ?? stepPin ?? cursorStep;
  const focusStep = stepPin ?? cursorStep;
  const { lang } = useLang();
  useEffect(() => {
    const allFiles = [...files, { name: MAIN, code }];
    setAgentContext({
      target: `problem/${problem.id}`,
      title: pick(problem.title),
      files: allFiles.map((f) => ({ name: f.name, code: f.code })),
      readonly: files.filter((f) => f.readonly).map((f) => f.name),
      main: problem.theorems[0],
      statements: problem.statements,
      verdict: result?.verdict,
      goals: result?.goals.map((g) => [...g.hypotheses, `⊢ ${g.target}`].join("\n")),
      errors: result?.errors.map((e) => ({ ...where(e.line), message: e.message })),
      cursor: sel.cursor,
      selection: sel.selection,
      // a paper step picked (or under the cursor): the translator's "this step"
      focus:
        focusStep !== null && steps[focusStep]
          ? { name: `step ${focusStep + 1} of the natural-language proof`, note: stepWords(pick(steps[focusStep].text)) }
          : undefined,
      lang,
    });
  }, [problem, files, code, result, where, sel, lang, pick, focusStep, steps]);
  useEffect(() => () => setAgentContext(null), []);
  useEffect(
    () =>
      onAgentFiles((e) => {
        if (e.target !== `problem/${problem.id}`) return false;
        if (MAIN in e.files) setCode(e.files[MAIN]);
        const rest = {
          ...e,
          files: Object.fromEntries(Object.entries(e.files).filter(([n]) => n !== MAIN)),
          order: e.order.filter((n) => n !== MAIN),
        };
        setFiles((fs) => mergeFiles(fs, rest, new Set(fs.filter((f) => f.readonly).map((f) => f.name))));
        return true;
      }),
    [problem.id],
  );

  const addFile = () => {
    const taken = new Set([MAIN, ...files.map((f) => f.name)]);
    let n = 1;
    while (taken.has(n === 1 ? "Lemmas.lean" : `Lemmas${n}.lean`)) n++;
    const name = n === 1 ? "Lemmas.lean" : `Lemmas${n}.lean`;
    setFiles((fs) => [...fs, { name, code: t("files.template") }]);
    setActive(name);
  };
  const level = LEVEL_STYLE[problem.level];
  // the complete proof stays hidden until the reader asks for it (the switch in the Tactics panel)
  const [showProof, setShowProof] = useState(false);
  /** the chip whose longer explanation is open */
  const [explained, setExplained] = useState<string | null>(null);
  /** which sorry the tactics fill (picked by clicking it in the editor) and the tactic being hovered (previewed there) */
  const [target, setTarget] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const holes = sorryOffsets(code);
  const hole = target < holes.length ? target : 0;
  const editing = active === MAIN && !readOnly;
  const editorView = useRef<EditorView | null>(null);
  /** pick a sorry from the Tactics panel: it becomes the target, and the editor scrolls to it and selects it */
  const pickHole = (i: number) => {
    setTarget(i);
    const view = editorView.current;
    const at = holes[i];
    if (!view || at === undefined || active !== MAIN) return;
    view.dispatch({ selection: { anchor: at, head: at + "sorry".length }, effects: EditorView.scrollIntoView(at, { y: "center" }) });
    view.focus();
  };
  // tutorial mode shows the first chips and the tools unlocked so far; the rest wait in a locked row
  const chips =
    tutorial && guide
      ? visibleChips(problem.tactics, guide.first, progress.unlocked, progress.unlockedIn.includes(problem.id))
      : { shown: problem.tactics, locked: [] as string[] };
  const coachChip = chips.shown.find((c) => guide?.first.includes(c)) ?? chips.shown[0];
  // the goal read off the statement, shown before the first run (Lean's own replaces it)
  const preGoal = initialGoal(statementParts(problem.start));
  const coachBox = (step: number) => (coach === step ? { className: "tut-coach", "data-coach-active": "" } : { className: "" });
  const coachCard = (step: number) => guide && coach === step && <CoachCard guide={guide} problemId={problem.id} step={step} onStep={goStep} />;
  const onBadge = (i: number) => (setBadge(i), setStepPin(i));
  const extensions = useMemo(
    () =>
      [
        lean(),
        ...(editing ? [sorryMarks(hole, preview)] : []),
        ...(active === MAIN && anchors.length ? [stepMarks(anchors, activeStep, onBadge)] : []),
      ],
    [editing, hole, preview, anchors, activeStep, active],
  );
  // a paper step pointed at: bring its Lean lines into view
  const pointed = stepHover ?? stepPin;
  useEffect(() => {
    const view = editorView.current;
    const lines = pointed === null ? null : located[pointed];
    if (!view || !lines || active !== MAIN) return;
    const n = Math.min(lines[0], view.state.doc.lines);
    view.dispatch({ effects: EditorView.scrollIntoView(view.state.doc.line(n).from, { y: "nearest" }) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointed]);
  const naturalProof = steps.length > 0 && (
    <NaturalProof
      steps={steps}
      located={located}
      active={activeStep}
      pinned={stepPin}
      onHover={setStepHover}
      onPin={setStepPin}
      hasSorry={holes.length > 0 && !readOnly}
      onGoSorry={() => {
        setActive(MAIN);
        setMobileTab("proof");
        requestAnimationFrame(() => pickHole(hole));
      }}
    />
  );
  const category = CATEGORIES.find((c) => c.id === problem.category)!;
  // the two-layer map: the statement layer and the reference proof precomputed (public/problems/<id>.map.json),
  // the reader's own proof from the latest check; the reference proof once solved, or when it is all there is
  const { data: refMap, error: refMapError } = useAsync(() => loadProblemMap(problem.id), problem.id);
  const solved = result?.verdict === "proved";
  const proofs: ProofSource[] = [
    ...(result?.graph && !readOnly ? [{ key: "yours", label: ["Your proof", "你的證明"] as const, short: ["Yours", "你的"] as const, graph: result.graph }] : []),
    ...(refMap && (solved || readOnly) ? [{ key: "reference", label: ["The reference proof", "參考證明"] as const, short: ["Reference", "參考"] as const, graph: refMap.proof }] : []),
  ];
  const mapView = (
    <TwoLayerMap
      key={`${problem.id}-${solved}`}
      statement={result?.statementGraph ?? refMap?.statement ?? null}
      statementNote={refMapError}
      proofs={proofs}
      proofNote={[
        "Check your proof to see how it is built. Once it is proved, the reference proof's map opens here too.",
        "檢查你的證明，就能看到它怎麼組成。證明完成後，這裡也會出現參考證明的地圖。",
      ]}
      initial={solved || readOnly ? "proof" : "statement"}
      fill
    />
  );
  // hypotheses that weren't there at the same goal last time: the step's effect
  const before = new Set(previous?.goals.flatMap((g) => g.hypotheses) ?? []);
  const next = PROBLEMS[PROBLEMS.findIndex((p) => p.id === problem.id) + 1];
  // the tactic pills that fit on the toolbar's line; the rest go under "more"
  const pillBox = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState(Infinity);
  useLayoutEffect(() => {
    const el = pillBox.current;
    if (!el) return;
    const count = () => {
      const kids = [...el.children] as HTMLElement[];
      const top = kids[0]?.offsetTop ?? 0;
      const n = kids.findIndex((k) => k.offsetTop > top + 2);
      setFit(n < 0 ? kids.length : n);
    };
    count();
    const ro = new ResizeObserver(count);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chips.shown.join("\n")]);

  // --- the parts of the workspace (WorkspaceFrame.tsx puts them in their columns) ---

  const phoneBar = (
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
      {tutorial && (
        <button
          type="button"
          onClick={() => updateTutorial((p) => reopenGuide(p, problem.id))}
          disabled={coach < DONE}
          data-testid="guide-button-phone"
          title={pick(["Guide", "導覽"])}
          className="shrink-0 px-3 text-sm text-amber-800 disabled:text-gray-300"
        >
          🧭 <span className="text-xs">{pick(["Guide", "導覽"])}</span>
        </button>
      )}
    </div>
  );

  // the problem: title, chips, summary pinned; Statement / Hint scroll
  const problemPart = (
    <>
      <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-4">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          <RichText text={pick(problem.title)} />
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-(--lk-accent)">{pick(category.title)}</span>
          <span className={`flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium ${level.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
            {problem.level} · {t(`level.${problem.level}`)}
          </span>
          <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-500">
            {problem.runner === "lite" ? t("runner.lite") : t("runner.full")}
          </span>
        </div>
        {guide && <TutorialBar problemId={problem.id} />}
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          <RichText text={pick(problem.summary)} />
        </p>
        {/* the problem's maths picture (frontend/public/problems/<id>.svg, as Tensorizer's diagram.svg): what the
            statement is about, drawn before any Lean; tests/pictures.test.ts requires one for every problem */}
        <ProblemPicture
          src={`${import.meta.env.BASE_URL}problems/${problem.id}.svg`}
          alt={pick(["The picture of: ", "題目的圖："]) + plainText(pick(problem.title)).replace(/`/g, "")}
        />
        <ProblemMeta problem={problem} />
        <CollectionNav problemId={problem.id} onSelect={onSelect} />
        {/* the same idea on a sister site (learnkit interlinks.ts; nothing is drawn when there is none) */}
        <RelatedProblems site="formalizer" id={problem.id} />
      </div>

      <div className="space-y-4 bg-gray-50/60 p-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        <div role="tablist" className="flex gap-1">
          {(["statement", "hint", ...(steps.length && !tutorial ? (["natural"] as const) : [])] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={lowerTab === tab}
              onClick={() => setLowerTab(tab)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                lowerTab === tab ? "bg-white text-(--lk-accent) shadow-sm ring-1 ring-gray-200" : "text-gray-600 hover:bg-white/70"
              }`}
            >
              {tab === "natural" ? pick(["Natural-language proof", "自然語言證明"]) : t(`tab.${tab}`)}
            </button>
          ))}
        </div>
        {lowerTab === "natural" && !tutorial ? (
          <div className="space-y-3" data-testid="natural-tab">
            <MirrorLegend />
            {naturalProof}
          </div>
        ) : lowerTab !== "hint" ? (
          <div className="space-y-3" data-testid="statement">
            <p className="text-sm leading-relaxed text-gray-700">
              <RichText text={t("problems.intro")} />
            </p>
            {(mirror?.statementMirror?.length || steps.length > 0) && <MirrorLegend />}
            {/* a simple `theorem … := by sorry` file is shown once, clickable part by part; anything else as plain text */}
            {showsAnatomy(problem) ? (
              <div {...coachBox(0)} data-testid="coach-statement">
                <div className={coach === 0 ? "p-1.5" : ""}>
                  {coachCard(0)}
                  <StatementAnatomy start={problem.start} beginner={problem.level === "L1"} onPick={() => advance(1)} mirror={mirror?.statementMirror} />
                </div>
              </div>
            ) : mirror?.statementMirror?.length ? (
              <PlainStatementMirror text={mirrorLeanText(problem.statements, problem.start, mirror.statementMirror)} pairs={mirror.statementMirror} />
            ) : (
              <pre className="rounded-lg border border-gray-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-900">
                {problem.statements.join("\n\n")}
              </pre>
            )}
            <p className="text-xs text-gray-500">
              {t("statement.checked")} <span className="font-mono text-gray-700">{problem.theorems.join(", ")}</span>
            </p>
            {tutorial && naturalProof}
          </div>
        ) : (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700" data-testid="hint">
            <RichText text={pick(problem.hint)} />
          </p>
        )}
      </div>
    </>
  );

  // the editor's own tab bar: Proof.lean, the lemma files, +
  const fileTabs = (
    <div className="flex shrink-0 items-end gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-2 pt-1.5" role="tablist">
      {[...files.map((f) => f.name), MAIN].map((name) => {
        const dirty =
          name === MAIN ? code !== problem.start : files.find((f) => f.name === name)?.code !== problem.files?.find((f) => f.name === name)?.code;
        return (
          <span
            key={name}
            className={`flex shrink-0 items-center rounded-t-md border border-b-0 font-mono text-xs ${
              active === name ? "border-gray-200 bg-white text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <button
              role="tab"
              aria-selected={active === name}
              onClick={() => setActive(name)}
              title={name === MAIN ? t("proof.about") : undefined}
              className="py-1 pr-2 pl-3"
              data-testid="file-tab"
            >
              {name}
              {dirty && <span className="ml-1 text-amber-600">●</span>}
            </button>
            {name !== MAIN && !own.has(name) && (
              <button
                onClick={() => {
                  setFiles((fs) => fs.filter((f) => f.name !== name));
                  setActive(MAIN);
                }}
                title={t("files.remove")}
                className="pr-2 text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            )}
          </span>
        );
      })}
      <button
        onClick={addFile}
        title={t("files.add")}
        data-testid="add-file"
        className="mb-1 shrink-0 rounded px-2 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-800"
      >
        +
      </button>
      {edited && (
        <button onClick={reset} className="mb-1 ml-auto shrink-0 px-1 text-xs text-(--lk-accent) hover:underline" data-testid="reset">
          {t("run.reset")}
        </button>
      )}
    </div>
  );

  /** a tactic as a pill on the toolbar, or as a row with its meaning in the "more" list */
  const tacticChip = (tactic: string, row = false) => {
    const step = problem.steps.includes(tactic) || /\bsorry\b/.test(tactic);
    const first = tactic.split("\n")[0];
    const max = row ? 26 : 18;
    const label = first.length > max || first !== tactic ? `${first.slice(0, max - 2).trimEnd()} …` : tactic;
    const info = explainTactic(tactic);
    // tutorial mode: a chip's first hover or focus opens its two-step reveal
    const firstLook = () => {
      if (!tutorial || isRevealed(progress, problem.id, tactic)) return;
      setExplained(tactic);
      updateTutorial((p) => markRevealed(p, problem.id, tactic));
    };
    const box = tactic === coachChip ? coachBox(2) : { className: "" };
    const meaning = info ? plainText(pick(info.short)).replace(/`/g, "") : "";
    return (
      <span
        key={tactic}
        {...box}
        className={`flex shrink-0 items-stretch overflow-hidden border border-gray-200 bg-white hover:border-(--lk-accent) ${row ? "w-full rounded-md" : "h-6 rounded-full"} ${box.className} ${justUnlocked.includes(tactic) ? "tut-slide-in" : ""}`}
        data-chip={tactic}
      >
        <button
          onClick={() => {
            // after a finishing try there's no sorry left: start again from the problem's file
            const fresh = !/\bsorry\b/.test(code);
            const nextCode = insertChip(fresh ? problem.start : code, tactic, problem.steps.includes(tactic), fresh ? 0 : hole);
            setPreview(null);
            setActive(MAIN);
            setCode(nextCode);
            setMoreOpen(false);
            advance(3);
            if (ready) void run(nextCode);
          }}
          disabled={running || readOnly}
          title={`${meaning ? `${meaning}\n\n` : ""}${t(step ? "run.stepHint" : "run.tryHint")}\n\n${tactic}`}
          data-testid="tactic"
          onMouseEnter={() => (firstLook(), editing && holes.length && setPreview(tactic))}
          onMouseLeave={() => setPreview(null)}
          onFocus={() => (firstLook(), editing && holes.length && setPreview(tactic))}
          onBlur={() => setPreview(null)}
          className={`min-w-0 flex-1 text-left disabled:opacity-40 ${row ? "px-2 py-1" : "px-2"}`}
        >
          <span className="flex items-center gap-1.5 font-mono text-xs whitespace-nowrap text-gray-800">
            <span
              className={`shrink-0 rounded px-1 font-sans text-[10px] font-medium ${step ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-(--lk-accent)"}`}
            >
              {t(step ? "run.step" : "run.try")}
            </span>
            <span className="min-w-0 truncate">{label}</span>
            {info?.mathlib && (
              <span className="shrink-0 rounded bg-amber-50 px-1 font-sans text-[10px] font-medium text-amber-800" title="Mathlib">
                {row ? "Mathlib" : "M"}
              </span>
            )}
          </span>
          {row && info && (
            <span className="mt-0.5 block text-[11px] leading-snug text-gray-500" data-testid="tactic-meaning">
              <RichText text={pick(info.short)} />
            </span>
          )}
        </button>
        {info && (
          <button
            type="button"
            onClick={() => {
              setExplained(explained === tactic ? null : tactic);
              setMoreOpen(false);
              if (tutorial) updateTutorial((p) => markRevealed(p, problem.id, tactic));
            }}
            aria-expanded={explained === tactic}
            aria-label={pick(["What does this do?", "這是做什麼的？"])}
            title={pick(["What does this do?", "這是做什麼的？"])}
            className={`shrink-0 border-l border-gray-100 px-1.5 text-[11px] ${explained === tactic ? "text-(--lk-accent)" : "text-gray-400 hover:text-gray-700"}`}
          >
            ⓘ
          </button>
        )}
      </span>
    );
  };
  const hidden = chips.shown.slice(fit);
  const explainedInfo = explained ? explainTactic(explained) : null;

  // one line over the editor: Run, the sorry being filled, the tactics (the rest under "more"), the answer switch
  const toolbar = (
    <div {...coachBox(2)} className={`relative flex shrink-0 flex-wrap items-center gap-1.5 border-b border-gray-200 bg-white px-2 py-1.5 xl:h-10 xl:flex-nowrap xl:py-0 ${coachBox(2).className}`} data-testid="toolbar">
      <button
        onClick={() => void run()}
        disabled={running || !ready || readOnly}
        data-testid="run"
        title={readOnly ? pick(NEEDS_FULL) : undefined}
        className="h-7 shrink-0 rounded-md bg-(--lk-accent) px-3 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {running ? t("run.running") : `▶ ${t("run.run")}`}
      </button>
      {editing && holes.length > 0 && (
        <button
          type="button"
          onClick={() => (holes.length > 1 ? setSorryOpen((o) => !o) : pickHole(hole))}
          aria-expanded={holes.length > 1 ? sorryOpen : undefined}
          title={pick(["The sorry the tactics fill: click to jump to it", "戰術要填的 sorry：點一下跳過去"])}
          data-testid="sorry-target"
          className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 text-[11px] text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
        >
          {pick(["Filling", "正在填"])}{" "}
          <span className="font-mono font-semibold">L{code.slice(0, holes[hole]).split("\n").length}</span>
          <span className="font-mono underline decoration-amber-500 decoration-dotted underline-offset-2">sorry</span>
          {holes.length > 1 && <span className="text-amber-700">{`${hole + 1}/${holes.length} ▾`}</span>}
        </button>
      )}
      <div ref={pillBox} className="order-last flex h-6 min-w-0 basis-full flex-wrap items-center gap-1 overflow-hidden xl:order-none xl:basis-auto xl:flex-1" data-testid="tactic-pills">
        {chips.shown.map((c) => tacticChip(c))}
      </div>
      {guide && tutorial && <LockedRow count={chips.locked.length} rule={guide.unlock} pill />}
      <span className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          data-testid="more-tools"
          className={`flex h-6 items-center gap-1 rounded-full px-2 text-[11px] ring-1 ${moreOpen ? "bg-gray-800 text-white ring-gray-800" : "text-gray-600 ring-gray-300 hover:bg-gray-50"}`}
        >
          {hidden.length > 0 ? pick([`+${hidden.length} more`, `還有 ${hidden.length} 個`]) : pick(["More", "更多"])} ▾
        </button>
        {moreOpen && (
          <div className="absolute top-8 right-0 z-30 w-72 space-y-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-lg" data-testid="more-panel">
            {hidden.map((c) => tacticChip(c, true))}
            {!hidden.length && <p className="text-[11px] text-gray-500">{t("run.tryHint")}</p>}
            {guide && tutorial && <LockedRow count={chips.locked.length} rule={guide.unlock} />}
            {/* Formalizer Pro (pending): live suggestions from Lean's search, a local prover, or the visitor's agent */}
            <button
              onClick={() => go("agents", "roadmap")}
              data-testid="pro-pending"
              className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-gray-300 px-2.5 py-1.5 text-left text-xs text-gray-500 hover:border-(--lk-accent) hover:text-gray-800"
            >
              <span>✨ {t("pro.suggest")}</span>
              <span className="rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-800">{t("pro.pending")}</span>
            </button>
          </div>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={showProof}
        onClick={() => setShowProof((v) => !v)}
        title={t("proof.switchHint")}
        data-testid="proof-switch"
        className="flex shrink-0 items-center gap-1 text-[11px] text-gray-600 hover:text-gray-900"
      >
        {t("proof.switch")}
        <span aria-hidden className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${showProof ? "bg-(--lk-accent)" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${showProof ? "translate-x-3" : ""}`} />
        </span>
      </button>
    </div>
  );

  // strips under the toolbar, only while there is something to say; the editor keeps the rest
  const strip = "flex shrink-0 items-start gap-2 border-b border-gray-100 px-3 py-1.5 text-xs";
  const close = (onClose: () => void) => (
    <button type="button" onClick={onClose} aria-label={pick(["Close", "關閉"])} className="shrink-0 text-gray-400 hover:text-gray-900">
      ×
    </button>
  );
  const drawer = (
    <div className="max-h-[45%] shrink-0 overflow-y-auto empty:hidden">
      {coach === 2 && <div className="border-b border-gray-100 p-2">{coachCard(2)}</div>}
      {readOnly && active === MAIN && (
        <p className={`${strip} bg-indigo-50 text-indigo-900`} data-testid="needs-full">
          {pick(NEEDS_FULL)}
        </p>
      )}
      {!readOnly && <RunnerHint runner={runner} onOpen={openRunner} />}
      {active !== MAIN && <p className={`${strip} text-gray-500`}>{activeFile?.readonly ? t("files.readonly") : t("files.about")}</p>}
      {justUnlocked.length > 0 && guide && (
        <div className="border-b border-gray-100 p-2">
          <UnlockNote note={guide.unlockNote} />
        </div>
      )}
      {sorryOpen && editing && holes.length > 1 && (
        <div className={strip}>
          <div className="min-w-0 flex-1">
            <SorryList code={code} holes={holes} active={hole} onPick={pickHole} />
          </div>
          {close(() => setSorryOpen(false))}
        </div>
      )}
      {explained && explainedInfo && (
        <div className={`${strip} bg-gray-50/70 text-[11px] leading-relaxed text-gray-700`} data-testid="tactic-explained">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-mono text-xs font-medium text-gray-900">{explained.split("\n")[0]}</p>
            {tutorial && guide ? (
              <TacticReveal info={explainedInfo} here={guide.here[explained]} />
            ) : (
              <p>
                <RichText text={pick(explainedInfo.long)} />
              </p>
            )}
            {explainedInfo.link && (
              <button type="button" onClick={() => go("skills", explainedInfo.link![0], explainedInfo.link![1])} className="font-medium text-(--lk-accent) hover:underline">
                {pick(["More in Coding Skills →", "在「程式技巧」看更多 →"])}
              </button>
            )}
          </div>
          {close(() => setExplained(null))}
        </div>
      )}
      {showProof && (
        <div className={`${strip} bg-gray-50/60`} data-testid="reference-proof">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[11px] leading-snug text-gray-500">{t("proof.reference")}</p>
            <pre className="max-h-40 overflow-auto rounded-md border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs leading-relaxed text-gray-800">
              {proofBody(problem)}
            </pre>
            <button
              onClick={() => {
                setCode(problem.solution);
                setActive(MAIN);
                if (ready) void run(problem.solution);
              }}
              disabled={running}
              data-testid="use-proof"
              className="rounded-md border border-(--lk-accent) bg-white px-2.5 py-1 text-xs font-medium text-(--lk-accent) hover:bg-teal-50 disabled:opacity-40"
            >
              {t("proof.use")}
            </button>
          </div>
          {close(() => setShowProof(false))}
        </div>
      )}
      {badge !== null && steps[badge] && active === MAIN && (
        <div className={`${strip} bg-amber-50/60 text-gray-800`} data-testid="badge-step">
          <span className="mt-0.5 rounded bg-gray-700 px-1 text-[10px] font-bold text-white">{badge + 1}</span>
          <span className="min-w-0 flex-1">
            <RichText text={pick(steps[badge].text)} />
          </span>
          {close(() => (setBadge(null), setStepPin(null)))}
        </div>
      )}
    </div>
  );

  // the editor: the column's whole height (on phones most of the screen)
  const editor = (
    <div className="h-[70dvh] min-h-64 overflow-auto xl:h-auto xl:min-h-0 xl:flex-1" data-testid="editor-box">
      <CodeMirror
        key={active}
        onCreateEditor={(view) => {
          editorView.current = view;
          // open on the sorry being filled, so the target line is in view without scrolling
          const at = holes[hole];
          if (active === MAIN && !readOnly && at !== undefined)
            requestAnimationFrame(() => view.dispatch({ effects: EditorView.scrollIntoView(at, { y: "center" }) }));
        }}
        value={active === MAIN ? (readOnly ? problem.solution : code) : (activeFile?.code ?? "")}
        onChange={(nextCode) => (active === MAIN ? setCode(nextCode) : setFiles((fs) => fs.map((f) => (f.name === active ? { ...f, code: nextCode } : f))))}
        editable={active === MAIN ? !readOnly : !activeFile?.readonly}
        onUpdate={(u) => {
          if (!u.selectionSet) return;
          // a click on a sorry makes it the one the tactics fill
          if (active === MAIN) {
            const picked = sorryAt(u.state.doc.toString(), u.state.selection.main.head);
            if (picked >= 0) setTarget(picked);
            // the cursor on a line of a paper step lights that step on the left
            if (steps.length) {
              const line = u.state.doc.lineAt(u.state.selection.main.head).number;
              setCursorStep(stepAtLine(locateSteps(u.state.doc.toString(), steps), line));
              // a step picked on the left gives way to where the reader now is (a tapped badge pins it again)
              if (u.transactions.some((tr) => tr.isUserEvent("select"))) setStepPin(null);
            }
          }
          const r = u.state.selection.main;
          const line = (pos: number) => u.state.doc.lineAt(pos).number;
          const text = u.state.sliceDoc(r.from, r.to);
          setSel({
            cursor: { file: active, line: line(r.head) },
            selection: text.trim() ? { file: active, from_line: line(r.from), to_line: line(r.to), text: text.slice(0, 4000) } : undefined,
          });
        }}
        // no boxes on every other `sorry` when one is selected: the dotted underlines mark them
        basicSetup={{ foldGutter: false, highlightSelectionMatches: false }}
        extensions={extensions}
        className="font-mono text-sm"
        aria-label={t("run.editor")}
        data-testid="lean-editor"
      />
    </div>
  );

  // the feedback column: the verdict, then tabs Goals | Messages | Map | Checkers at full height
  const tabWord: Record<FeedTab, string> = {
    goals: tutorial ? pick(["Goal", "目標"]) : t("panel.goals"),
    messages: t("result.messages"),
    map: t("result.map"),
    checkers: pick(tutorial ? ["Judges", "裁判"] : ["Checkers", "檢查器"]),
  };
  const feedback = (
    <>
      <div className={PANEL_HEAD}>
        <span className="flex min-w-0 items-center gap-2">
          <span className={PANEL_TITLE}>{t("panel.result")}</span>
          {result && (
            <VerdictChip tone={VERDICT_TONE[result.verdict]} title={t(`verdict.${result.verdict}`)} testId="verdict">
              {pick(VERDICT_CHIP[result.verdict])}
            </VerdictChip>
          )}
          {running && <span className="animate-pulse text-gray-500">{t("run.running")}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {solved && next && (
            <button
              type="button"
              onClick={() => onSelect(next.id)}
              title={`${t("next.title")}: ${plainText(pick(next.title)).replace(/`/g, "")}`}
              data-testid="next-chip"
              className="font-medium text-green-700 hover:underline"
            >
              {pick(["Next ›", "下一題 ›"])}
            </button>
          )}
          {result && <span className="text-gray-500 tabular-nums">{result.ms} ms</span>}
        </span>
      </div>
      <div className="flex h-8 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-gray-200 bg-gray-50/60 px-2 text-xs" role="tablist">
        {FEED_TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={feedTab === tab}
            onClick={() => setFeedTab(tab)}
            data-testid={`result-tab-${tab}`}
            {...(tab === "goals" ? coachBox(1) : tab === "checkers" ? coachBox(3) : {})}
            className={`${tabClass(feedTab === tab)} ${tab === "goals" ? coachBox(1).className : tab === "checkers" ? coachBox(3).className : ""}`}
          >
            {tabWord[tab]}
            {tab === "goals" && result && <span className="text-[10px] text-gray-400 tabular-nums">{result.goals.length}</span>}
            {tab === "messages" && !!result?.errors.length && (
              <span className="rounded-full bg-red-100 px-1 text-[10px] text-red-700 tabular-nums">{result.errors.length}</span>
            )}
            {tab === "checkers" && <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${LIGHT_LOOK[checkersLight][0]}`} data-testid="checkers-dot" />}
            {/* tutorial mode: the judges' one light, in words */}
            {tab === "checkers" && tutorial && (
              <span className="font-normal text-gray-600" data-testid="checkers-light" data-light={checkersLight}>
                {pick(LIGHT_LOOK[checkersLight][1])}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* the bottom of the column stays clear for the floating Ask AI button (wide screens) */}
      <div
        className={`min-h-0 flex-1 p-2.5 xl:pb-20 ${feedTab === "map" ? "flex flex-col" : "space-y-2 overflow-auto"}`}
        aria-live="polite"
        data-testid="result"
      >
        {problemText && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-800">{problemText}</p>}
        {feedTab === "goals" && (
          <div className="space-y-1.5" data-testid="goals">
            {coachCard(1)}
            {tutorial && solved ? (
              <NoGoals />
            ) : preGoal && !result?.goals.length && !solved && (!result || tutorial) ? (
              <div className="overflow-hidden rounded-md border border-gray-200" data-testid="goal-preview">
                <p className="border-b border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-500">
                  {pick(running ? ["Asking Lean…", "正在問 Lean……"] : ["From the statement, before any step", "從陳述得出，還沒做任何一步"])}
                </p>
                <div className="px-2.5 py-1.5 font-mono text-xs leading-relaxed">
                  {preGoal.hypotheses.map((h) => (
                    <p key={h} className="text-gray-700">
                      {h}
                    </p>
                  ))}
                  <p className="mt-0.5 border-t border-gray-200 pt-0.5 text-gray-900">⊢ {preGoal.target}</p>
                </div>
              </div>
            ) : !result || !result.goals.length ? (
              <p className="text-xs text-gray-400">{t(solved ? "goals.done" : "goals.none")}</p>
            ) : (
              result.goals.map((g, i) => (
                <div key={i} className="overflow-hidden rounded-md border border-gray-200" data-testid="goal">
                  <p className="border-b border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-500">
                    {t("goal.at").replace("{file}", at(g.line).file).replace("{line}", at(g.line).line)}
                    {g.case && <span className="ml-2 rounded bg-gray-200 px-1.5 font-mono text-gray-700">case {g.case}</span>}
                  </p>
                  <div className="px-2.5 py-1.5 font-mono text-xs leading-relaxed">
                    {g.hypotheses.map((h) => (
                      <p key={h} className={previous && !before.has(h) ? "rounded bg-green-50 text-green-800" : "text-gray-700"}>
                        {h}
                      </p>
                    ))}
                    <p className="mt-0.5 border-t border-gray-200 pt-0.5 text-gray-900">⊢ {g.target}</p>
                    {g.others.length > 0 && <p className="mt-1 font-sans text-[11px] text-gray-500">{t("goal.more").replace("{n}", String(g.others.length))}</p>}
                  </div>
                </div>
              ))
            )}
            {result && result.errors.length > 0 && (
              <button onClick={() => setFeedTab("messages")} className="text-xs text-red-700 hover:underline">
                {pick([`${result.errors.length} error(s) in Messages →`, `訊息裡有 ${result.errors.length} 個錯誤 →`])}
              </button>
            )}
            {tutorial && !solved && (
              <p className="text-[11px] leading-snug text-gray-500" data-testid="goal-legend">
                <RichText
                  text={pick(
                    preGoal?.hypotheses.length || result?.goals.some((g) => g.hypotheses.length)
                      ? [
                          "Above the line: what you are given. After `⊢`: what is left to prove. A tactic changes it; the proof is done when no goal is left.",
                          "橫線上方：已知的東西。`⊢` 後面：還要證明的。戰術會改變它；沒有目標時，證明就完成了。",
                        ]
                      : [
                          "After `⊢`: what is left to prove. A tactic changes it; the proof is done when no goal is left.",
                          "`⊢` 後面：還要證明的。戰術會改變它；沒有目標時，證明就完成了。",
                        ],
                  )}
                />
              </p>
            )}
          </div>
        )}
        {feedTab === "checkers" && coachCard(3)}
        {feedTab === "messages" && (
          <>
            {!result ? (
              !problemText && <p className="text-xs text-gray-400">{t("run.none")}</p>
            ) : (
              <>
                <p className={`text-xs font-medium ${VERDICT_TEXT[result.verdict]}`} data-testid="verdict-text">
                  {t(`verdict.${result.verdict}`)}
                </p>
                {result.errors.map((e, i) => (
                  <div key={i} className="rounded-md border border-red-200 bg-white px-2.5 py-1.5" data-testid="lean-error">
                    <p className="text-xs font-medium text-red-700">
                      {e.line ? t("error.at").replace("{file}", at(e.line).file).replace("{line}", at(e.line).line) : t("error.title")}
                    </p>
                    <pre className="mt-0.5 font-mono text-xs whitespace-pre-wrap text-gray-800">{e.message}</pre>
                  </div>
                ))}
                <Notes items={[...(result.infos ?? []), ...result.warnings]} at={at} />
                {Object.keys(result.axioms).length > 0 && (
                  <p className="text-xs text-gray-500" data-testid="axioms">
                    {t("axioms.label")}{" "}
                    {Object.entries(result.axioms)
                      .map(([name, list]) => `${name}: ${list.length ? list.join(", ") : t("axioms.none")}`)
                      .join(" · ")}
                  </p>
                )}
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {result.verdict === "error" && (
                    <button onClick={() => setLowerTab("hint")} className="text-(--lk-accent) hover:underline">
                      {t("hint.show")}
                    </button>
                  )}
                  {result.graph && (
                    <button onClick={() => setFeedTab("map")} className="text-(--lk-accent) hover:underline">
                      {t("graph.open")} →
                    </button>
                  )}
                </p>
                {solved && <NextProblem id={problem.id} onSelect={onSelect} />}
              </>
            )}
          </>
        )}
        {feedTab === "map" && <div className="h-[65dvh] min-h-0 xl:h-auto xl:flex-1">{mapView}</div>}
        {/* the independent checkers (Lite): the statement is the test, they are its runner; always mounted, so they
            still run by themselves when Lean says proved, whichever tab is open */}
        <div className={feedTab === "checkers" ? "" : "hidden"} data-testid="checkers-tab">
          <CheckersPanel
            code={joinFiles([...files, { name: MAIN, code }]).code}
            theorems={problem.theorems}
            statements={problem.statements}
            challenge={joinFiles([...(problem.files ?? []), { name: MAIN, code: problem.start }]).code}
            verdict={result?.verdict}
            onStatus={setCheckersLight}
          />
        </div>
      </div>
    </>
  );

  return (
    <Workspace
      shape="full-height"
      phone={PHONE_PART[mobileTab]}
      phoneBar={phoneBar}
      problem={problemPart}
      editorTabs={fileTabs}
      toolbar={toolbar}
      drawer={drawer}
      editor={editor}
      feedback={feedback}
    />
  );
}

/** The lines of the reference solution that take the place of `sorry` in the starting file. */
export function proofBody(problem: Pick<Problem, "start" | "solution">): string {
  const at = problem.start.search(/\bsorry\b/);
  const head = problem.start.slice(0, at);
  const tail = problem.start.slice(at + "sorry".length);
  if (at < 0 || !problem.solution.startsWith(head) || !problem.solution.endsWith(tail)) return problem.solution.trim();
  const body = problem.solution.slice(head.length, problem.solution.length - tail.length);
  const indent = head.slice(head.lastIndexOf("\n") + 1);
  return body
    .split("\n")
    .map((line, i) => (i === 0 || !line.startsWith(indent) ? line : line.slice(indent.length)))
    .join("\n");
}

const NEEDS_FULL: Localized = [
  "This needs Mathlib: read the proof here, run it on a Full runner.",
  "這題需要 Mathlib：在這裡閱讀證明，在 Full 執行器上執行。",
];
const SOURCE: Record<"from" | "by" | "via" | "ported", Localized> = {
  from: ["Source", "出處"],
  by: ["by", "作者"],
  via: ["from Mathlib's Archive", "取自 Mathlib Archive"],
  ported: ["Ported", "移植說明"],
};

/** Tags (e.g. "IMO 1959 P1") and, for an imported proof, where it comes from: project, licence, authors, link. */
/**
 * The sorrys still open, as their source lines (`L4  | inr hq => sorry`), linked both ways with the editor: pick one
 * here and the editor jumps to it; click one in the editor and it is picked here (and scrolled into view when the list
 * is long). The picked one is the sorry the tactics below fill.
 */
function SorryList({ code, holes, active, onPick }: { code: string; holes: number[]; active: number; onPick: (i: number) => void }) {
  const { pick } = useLang();
  const list = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-hole="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return (
    <div className="space-y-1.5 pb-1" data-testid="sorry-target">
      <p className="flex items-baseline justify-between gap-2 text-[11px] text-gray-500">
        <span className="font-medium text-gray-700">{pick(["Filling", "正在填"])}</span>
        <span>
          {holes.length > 1 ? pick([`sorry ${active + 1} of ${holes.length}`, `第 ${active + 1} 個 sorry，共 ${holes.length} 個`]) : "sorry"}
        </span>
      </p>
      <ol ref={list} className="max-h-36 space-y-0.5 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/60 p-1">
        {holes.map((at, i) => {
          const start = code.lastIndexOf("\n", at - 1) + 1;
          const stop = code.indexOf("\n", at);
          const line = code.slice(0, at).split("\n").length;
          // a long line is shown as a window that ends at its sorry, so the hole itself is always visible
          const lead = code.slice(start, at).trimStart();
          const before = lead.length > 22 ? `…${lead.slice(-21)}` : lead;
          const after = code.slice(at + "sorry".length, stop < 0 ? code.length : stop);
          const on = i === active;
          return (
            <li key={at}>
              <button
                type="button"
                data-hole={i}
                onClick={() => onPick(i)}
                aria-current={on ? "true" : undefined}
                title={pick(["Fill this sorry (the editor jumps to it)", "填這個 sorry（編輯器會跳到那裡）"])}
                className={`flex w-full items-baseline gap-2 rounded px-1.5 py-1 text-left font-mono text-[11px] ${
                  on ? "bg-amber-50 text-gray-900 ring-1 ring-amber-300" : "text-gray-600 hover:bg-white"
                }`}
              >
                <span className={`shrink-0 font-sans text-[10px] ${on ? "font-semibold text-amber-800" : "text-gray-400"}`}>L{line}</span>
                <span className="min-w-0 truncate">
                  {before}
                  <span
                    className={`font-semibold text-amber-700 underline decoration-dotted underline-offset-4 ${on ? "decoration-amber-600 decoration-[3px]" : "decoration-amber-400 decoration-2"}`}
                  >
                    sorry
                  </span>
                  {after}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-[11px] leading-snug text-gray-500">
        <RichText
          text={pick([
            holes.length > 1
              ? "Hover a tactic to preview it there; click it to put it in and run. Pick another `sorry` here or in the editor."
              : "Hover a tactic to preview it there; click it to put it in and run.",
            holes.length > 1
              ? "滑過戰術可在那裡預覽；點下去就放進去並執行。在這裡或編輯器裡點另一個 `sorry`，就改填那一個。"
              : "滑過戰術可在那裡預覽；點下去就放進去並執行。",
          ])}
        />
      </p>
    </div>
  );
}

function ProblemMeta({ problem }: { problem: Problem }) {
  const { pick } = useLang();
  const { tags, source } = problem;
  if (!tags?.length && !source) return null;
  return (
    <div className="mt-2 space-y-1.5" data-testid="problem-meta">
      {tags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag[0]} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
              {pick(tag)}
            </span>
          ))}
        </div>
      ) : null}
      {source && (
        <p className="text-xs text-gray-500" data-testid="problem-source">
          {pick(SOURCE.from)}:{" "}
          <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-(--lk-accent) hover:underline">
            {source.name} ↗
          </a>{" "}
          ({source.licence}) · {pick(SOURCE.by)} {source.authors}
          {source.via && (
            <>
              {" "}
              ·{" "}
              <a href={source.via} target="_blank" rel="noreferrer" className="hover:underline">
                {pick(SOURCE.via)} ↗
              </a>
            </>
          )}
          {source.changes && (
            <span className="block text-[11px] text-gray-400">
              {pick(SOURCE.ported)}: <RichText text={pick(source.changes)} />
            </span>
          )}
        </p>
      )}
    </div>
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
function Notes({ items, at }: { items: Issue[]; at: (line: number) => { file: string; line: string } }) {
  const { t } = useLang();
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-sky-200 bg-white px-3 py-2" data-testid="lean-notes">
      <p className="text-xs font-medium text-sky-800">{t("notes.title")}</p>
      {[...items]
        .sort((a, b) => a.line - b.line)
        .map((n, i) => (
          <div key={i} className="mt-1">
            <p className="text-[11px] text-gray-500">
              {t("notes.at").replace("{file}", at(n.line).file).replace("{line}", at(n.line).line)}
            </p>
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
