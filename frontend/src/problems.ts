/**
 * The tutorial track's problems (Lite runner: core Lean, no Mathlib), from problems/tutorial.json: the same file CI
 * checks with real Lean (tests/test_tutorial.py: the start is open, the reference solution and the chips prove it).
 * Text is [English, Traditional Chinese].
 */
import type { Localized } from "@learnkit/web";
import data from "../../problems/tutorial.json" with { type: "json" };

export type Level = "L1" | "L2" | "L3";
export const LEVELS: Level[] = ["L1", "L2", "L3"];

export interface Problem {
  id: string;
  level: Level;
  runner: "lite" | "full";
  title: Localized;
  /** what the statement says, in plain words (RichText) */
  summary: Localized;
  /** the statements (and definitions) that must stay exactly as given */
  statements: string[];
  /** theorems whose axioms are reported */
  theorems: string[];
  /** the file the user starts from */
  start: string;
  /** one-click chips, in the order a learner would press them */
  tactics: string[];
  /** chips that are one step, not a finish: a `sorry` stays after them for what is left */
  steps: string[];
  /** a hint shown under the result (RichText) */
  hint: Localized;
  /** the reference solution, proved in CI */
  solution: string;
}

export const PROBLEMS = data as Problem[];
