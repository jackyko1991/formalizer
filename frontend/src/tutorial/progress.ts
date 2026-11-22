/**
 * Tutorial mode (引導模式) for the tutorial track, pure (tested in node): the reader's progress as it is kept in
 * localStorage, the rules that unlock tools, and the goal shown before Lean has run.
 *
 *   on          the mode is on (the default); off shows today's free layout, and turning it on again resumes
 *   solved      problems proved in tutorial mode
 *   unlockedIn  problems whose locked tools were unlocked (after a failed try or a proof, as the guide says)
 *   unlocked    the tools those problems introduce: shown from the start in the problems after them
 *   step        the coach's step per problem: 0 statement, 1 goal, 2 tactic, 3 result, 4 done (or skipped)
 *   revealed    per problem, the chips whose two-step reveal the reader has already seen
 *   hidden      problems whose coach the reader skipped (the step is kept: the Guide button resumes there)
 *   guideOff    "Don't show the guide again": no coach on any problem until the Guide button turns it back on
 */
export const TUTORIAL_KEY = "formalizer.tutorial";

export interface TutorialProgress {
  on: boolean;
  solved: string[];
  unlockedIn: string[];
  unlocked: string[];
  step: Record<string, number>;
  revealed: Record<string, string[]>;
  hidden: string[];
  guideOff: boolean;
}

/** The coach's steps, in order; DONE once they are walked (or skipped). */
export const COACH_STEPS = ["statement", "goal", "tactic", "result"] as const;
export type CoachStep = (typeof COACH_STEPS)[number];
export const DONE = COACH_STEPS.length;

export const fresh = (): TutorialProgress => ({
  on: true,
  solved: [],
  unlockedIn: [],
  unlocked: [],
  step: {},
  revealed: {},
  hidden: [],
  guideOff: false,
});

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const record = <T>(v: unknown, keep: (x: unknown) => T | undefined): Record<string, T> => {
  const out: Record<string, T> = {};
  if (v && typeof v === "object" && !Array.isArray(v))
    for (const [k, x] of Object.entries(v)) {
      const kept = keep(x);
      if (kept !== undefined) out[k] = kept;
    }
  return out;
};

/** Progress from its stored text; anything missing or broken falls back to a fresh start. */
export function parseProgress(text: string | null): TutorialProgress {
  let v: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fresh();
    v = parsed;
  } catch {
    return fresh();
  }
  return {
    on: v.on !== false,
    solved: strings(v.solved),
    unlockedIn: strings(v.unlockedIn),
    unlocked: strings(v.unlocked),
    step: record(v.step, (x) => (typeof x === "number" && Number.isInteger(x) ? Math.max(0, Math.min(DONE, x)) : undefined)),
    revealed: record(v.revealed, (x) => (Array.isArray(x) ? strings(x) : undefined)),
    hidden: strings(v.hidden),
    guideOff: v.guideOff === true,
  };
}
export const serializeProgress = (p: TutorialProgress) => JSON.stringify(p);

const add = (list: string[], ...items: string[]) => [...list, ...items.filter((x, i) => !list.includes(x) && items.indexOf(x) === i)];

export const setOn = (p: TutorialProgress, on: boolean): TutorialProgress => ({ ...p, on });
/** Restart the tutorial: the progress goes, the mode stays as it is. */
export const restart = (p: TutorialProgress): TutorialProgress => ({ ...fresh(), on: p.on });
export const stepOf = (p: TutorialProgress, id: string) => p.step[id] ?? 0;
export const setStep = (p: TutorialProgress, id: string, step: number): TutorialProgress => ({
  ...p,
  step: { ...p.step, [id]: Math.max(0, Math.min(DONE, step)) },
});
/** Move the coach forward to `step` (never back: an action the reader already got past doesn't rewind it). */
export const reachStep = (p: TutorialProgress, id: string, step: number): TutorialProgress =>
  stepOf(p, id) >= step ? p : setStep(p, id, step);
/** "Skip guide": hide the coach on this problem only, keeping its step. */
export const skipGuide = (p: TutorialProgress, id: string): TutorialProgress =>
  p.hidden.includes(id) ? p : { ...p, hidden: add(p.hidden, id) };
/** "Don't show the guide again": no coach anywhere (the Guide button undoes it). */
export const guideOff = (p: TutorialProgress): TutorialProgress => ({ ...p, guideOff: true });
/** The Guide button: the coach back on this problem (and everywhere), where the reader left off; a walked guide starts
 *  again from its first step. */
export const reopenGuide = (p: TutorialProgress, id: string): TutorialProgress => ({
  ...p,
  guideOff: false,
  hidden: p.hidden.filter((x) => x !== id),
  step: stepOf(p, id) >= DONE ? { ...p.step, [id]: 0 } : p.step,
});
/** Is the coach showing on this problem? */
export const coachShown = (p: TutorialProgress, id: string) => !p.guideOff && !p.hidden.includes(id) && stepOf(p, id) < DONE;
export const markSolved = (p: TutorialProgress, id: string): TutorialProgress =>
  p.solved.includes(id) ? p : { ...p, solved: add(p.solved, id) };
export const unlock = (p: TutorialProgress, id: string, introduces: readonly string[]): TutorialProgress =>
  p.unlockedIn.includes(id) ? p : { ...p, unlockedIn: add(p.unlockedIn, id), unlocked: add(p.unlocked, ...introduces) };
export const isRevealed = (p: TutorialProgress, id: string, chip: string) => (p.revealed[id] ?? []).includes(chip);
export const markRevealed = (p: TutorialProgress, id: string, chip: string): TutorialProgress =>
  isRevealed(p, id, chip) ? p : { ...p, revealed: { ...p.revealed, [id]: add(p.revealed[id] ?? [], chip) } };

/**
 * Does this run unlock the problem's locked tools? "after-fail": a try the reader made that Lean rejects (an error,
 * e.g. `rfl` on `a + b = b + a`, or goals left unsolved); "after-solve": a proof. The page's own first run of the
 * start file (`auto`) never counts, nor does a step that just leaves a `sorry` for later.
 */
export function unlocksNow(
  rule: "after-fail" | "after-solve",
  run: { verdict: string; errors: number; auto?: boolean },
): boolean {
  if (run.auto) return false;
  if (rule === "after-solve") return run.verdict === "proved";
  return run.verdict === "error" || (run.verdict === "incomplete" && run.errors > 0);
}

/** The head word of a chip (`exact Nat.add_comm a b` → exact), as the glossary looks it up. */
export const chipHead = (chip: string) => chip.trim().match(/^[^\s[(]+/)?.[0] ?? "";

/**
 * Which chips show in tutorial mode: the problem's first ones, and any tool unlocked earlier in the track (by its exact
 * chip or its head word); once this problem's tools are unlocked, all of them. `locked` keeps the rest, in order.
 */
export function visibleChips(
  chips: readonly string[],
  first: readonly string[],
  unlocked: readonly string[],
  open: boolean,
): { shown: string[]; locked: string[] } {
  if (open) return { shown: [...chips], locked: [] };
  const known = new Set(unlocked);
  const shown = chips.filter((c) => first.includes(c) || known.has(c) || known.has(chipHead(c)));
  return { shown, locked: chips.filter((c) => !shown.includes(c)) };
}

/**
 * The goal Lean will show for a start file `[defs] theorem name args : claim := by sorry`, worked out from its parts
 * before Lean runs: each binder `(a b : Nat)` becomes a hypothesis line `a b : Nat`, and the claim goes below ⊢.
 * Binders are split at the top level only, so `(h : ∃ k, a = 2 * k)` stays one line.
 */
export function initialGoal(parts: { args: string; claim: string } | null): { hypotheses: string[]; target: string } | null {
  if (!parts) return null;
  const hypotheses: string[] = [];
  const open = "([{⦃";
  const close = ")]}⦄";
  let depth = 0;
  let current = "";
  for (const ch of parts.args) {
    if (open.includes(ch)) {
      if (depth === 0) current = "";
      else current += ch;
      depth++;
    } else if (close.includes(ch)) {
      depth--;
      if (depth === 0) {
        const line = current.trim().replace(/\s+/g, " ");
        // an instance binder `[inst : C α]` or `[C α]` is shown as Lean does: `inst : C α`, or `inst✝ : C α`
        if (line) hypotheses.push(line.includes(":") ? line : `inst✝ : ${line}`);
      } else current += ch;
    } else if (depth > 0) current += ch;
  }
  return { hypotheses, target: parts.claim.replace(/\s+/g, " ").trim() };
}

/** A step of the proof on paper; `lean` holds the trimmed solution lines that do it (anchors in the reader's code). */
export interface PaperStep {
  text: readonly [string, string];
  lines: readonly [number, number];
  lean: readonly string[];
  goal?: string;
}

const norm = (line: string) => line.trim().replace(/\s+/g, " ");

/**
 * Where each paper step is in the reader's code now: the 1-based lines holding its anchors (whitespace normalised), or
 * null when it isn't written yet. The anchors are looked for as consecutive lines first, else in order with lines
 * between; each step is searched after the one before it (then from the top), so steps keep the code's order and a
 * short line such as `rfl` is not claimed by an earlier step.
 */
export function locateSteps(code: string, steps: readonly Pick<PaperStep, "lean">[]): (number[] | null)[] {
  const lines = code.split("\n").map(norm);
  const find = (anchors: string[], from: number): number[] | null => {
    if (!anchors.length) return null;
    for (let i = from; i + anchors.length <= lines.length; i++)
      if (anchors.every((a, k) => lines[i + k] === a)) return anchors.map((_, k) => i + k + 1);
    const out: number[] = [];
    let at = from;
    for (const a of anchors) {
      const i = lines.indexOf(a, at);
      if (i < 0) return null;
      out.push(i + 1);
      at = i + 1;
    }
    return out;
  };
  let after = 0;
  return steps.map((s) => {
    const anchors = s.lean.map(norm).filter(Boolean);
    const found = find(anchors, after) ?? find(anchors, 0);
    if (found) after = Math.max(after, found[0]);
    return found;
  });
}

/** The step whose lines hold this 1-based line, or null. */
export const stepAtLine = (located: readonly (number[] | null)[], line: number): number | null => {
  const i = located.findIndex((l) => l?.includes(line));
  return i < 0 ? null : i;
};
