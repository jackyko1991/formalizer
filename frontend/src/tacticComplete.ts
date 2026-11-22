/**
 * Tactic completion at a `sorry`, the pure part (tacticCompletion.ts is the CodeMirror glue): the list of a problem's
 * tactics with their meanings, where the "Tactic ▾" pill goes, and what choosing one does to the file.
 *
 * Choosing a tactic replaces the sorry with it, as the old chips did (runner.ts insertChip): a "step" tactic (induction
 * skeleton, `have …`) keeps a sorry under it for the rest; a "try" replaces the sorry outright.
 */
import { insertChip, sorryOffsets } from "./runner.ts";
import { explainTactic } from "./tactics.ts";
import { requestAgentOpen } from "./agent/bus.ts";

type L = readonly [string, string];

export interface TacticItem {
  /** the tactic as it goes into the file (may span lines: an induction skeleton) */
  tactic: string;
  /** its first line, the label in the list */
  label: string;
  /** a step keeps a sorry under it; a try replaces the sorry */
  step: boolean;
  /** what it does, in a few words */
  meaning?: L;
  /** longer words, for the list's side pane */
  long?: L;
  origin?: L;
  /** Mathlib only (Lite answers `unknown tactic`) */
  mathlib: boolean;
}

/** The problem's tactics as completion items, in the problem's order (tutorial mode passes the visible ones). */
export function tacticItems(chips: readonly string[], steps: readonly string[]): TacticItem[] {
  return chips.map((tactic) => {
    const info = explainTactic(tactic);
    return {
      tactic,
      label: tactic.split("\n")[0],
      step: steps.includes(tactic) || /\bsorry\b/.test(tactic),
      meaning: info?.short,
      long: info?.long,
      origin: info?.origin,
      mathlib: !!info?.mathlib,
    };
  });
}

/** Where the "Tactic ▾" pill goes: right after the target sorry (the first one when the target is out of range), or
 *  null when the file has no sorry. */
export function pillAt(code: string, target: number): number | null {
  const all = sorryOffsets(code);
  if (!all.length) return null;
  return (all[target] ?? all[0]) + "sorry".length;
}

/**
 * The file after choosing `item` for the text between `from` and `to`: that range is a sorry (the list opened on it)
 * or what the reader typed in its place (the list opened by typing); either way it becomes the tactic.
 * Returns the new file and the index of the sorry that was filled.
 */
export function applyTactic(code: string, from: number, to: number, item: Pick<TacticItem, "tactic" | "step">): { code: string; hole: number } {
  const withSorry = code.slice(0, from) + "sorry" + code.slice(to);
  const hole = sorryOffsets(withSorry).indexOf(from);
  return { code: insertChip(withSorry, item.tactic, item.step, Math.max(0, hole)), hole: Math.max(0, hole) };
}

/** Typing may open the list only where a tactic goes: the word is first on its line, or follows `by`, `=>` or `·`. */
export function tacticPosition(lineBefore: string): boolean {
  return /^\s*$|(?:\bby|=>|·)\s+$/.test(lineBefore);
}

/** The list's last row: ask AI for this step. Its words depend on whether the reader's own agent is connected. */
export const AI_ROW = {
  label: ["AI (connect your agent / Pro version)", "AI（連接你的代理 / Pro 版）"],
  connected: ["AI: ask your agent for this step", "AI：問你的代理這一步"],
  subtitle: ["Connect your agent, or the Pro version", "連接你的代理 / Pro 版"],
  connectedSubtitle: ["Opens Ask AI with a question about this sorry", "打開 Ask AI，問題已準備好：這個 sorry"],
} as const;

/** The question about one sorry, ready in the Ask AI box: where it is, and the goal Lean showed there. */
export function aiQuestion(lang: 0 | 1, at: { file: string; line: number; goal?: string }): string {
  const goal = at.goal ? `\n\n${lang ? "Lean 在那裡的目標：" : "Lean's goal there:"}\n${at.goal}` : "";
  return lang
    ? `請建議 ${at.file} 第 ${at.line} 行（L${at.line}）那個 sorry 的下一步戰術，並說明為什麼。${goal}`
    : `Suggest the next tactic for the sorry at ${at.file} line ${at.line} (L${at.line}), and say why.${goal}`;
}

/** Choosing the AI row: open the Ask AI panel with the question (it shows how to connect an agent when none is). */
export function askAiForSorry(lang: 0 | 1, at: { file: string; line: number; goal?: string }): void {
  requestAgentOpen(aiQuestion(lang, at));
}

/**
 * Tactic hints open the list by themselves when the cursor is at a sorry: inside or touching the word, or in the
 * indentation before it on its line. The index of that sorry, or -1.
 */
export function autoOpenAt(code: string, pos: number): number {
  const all = sorryOffsets(code);
  return all.findIndex((from) => {
    if (pos >= from && pos <= from + "sorry".length) return true;
    const lineStart = code.lastIndexOf("\n", from - 1) + 1;
    return pos >= lineStart && pos < from && /^\s*$/.test(code.slice(lineStart, from));
  });
}

/** The "Tactic hints" switch, remembered per browser (on unless the reader turned it off). */
export const HINTS_KEY = "formalizer.tacticHints";
type Store = Pick<Storage, "getItem" | "setItem">;
export function loadHints(store: Store | undefined = globalThis.localStorage): boolean {
  try {
    return store?.getItem(HINTS_KEY) !== "off";
  } catch {
    return true;
  }
}
export function saveHints(on: boolean, store: Store | undefined = globalThis.localStorage): void {
  try {
    store?.setItem(HINTS_KEY, on ? "on" : "off");
  } catch {
    /* storage blocked: the choice lasts for this visit */
  }
}
