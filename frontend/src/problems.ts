/**
 * The tutorial track's problems (Lite runner: core Lean, no Mathlib), from problems/tutorial.json: the same file CI
 * checks with real Lean (tests/test_tutorial.py: the start is open, the reference solution and the chips prove it).
 * Text is [English, Traditional Chinese].
 */
import type { Localized } from "@learnkit/web";
import geometry from "../../problems/geometry.json" with { type: "json" };
import linearAlgebra from "../../problems/linear-algebra.json" with { type: "json" };
import collections from "../../problems/collections.json" with { type: "json" };
import tutorial from "../../problems/tutorial.json" with { type: "json" };

export type Level = "L1" | "L2" | "L3";
export const LEVELS: Level[] = ["L1", "L2", "L3"];

export type Category = "tutorial" | "geometry" | "linalg" | "research";

/** Topics of the library, in order. The research showcase fills in with the Full runner (Mathlib). */
export const CATEGORIES: { id: Category; icon: string; title: Localized; empty?: Localized }[] = [
  { id: "tutorial", icon: "⊢", title: ["Tutorial track", "教學路線"] },
  { id: "geometry", icon: "△", title: ["Geometry", "幾何"] },
  { id: "linalg", icon: "⊞", title: ["Linear algebra", "線性代數"] },
  {
    id: "research",
    icon: "∑",
    title: ["Research showcase", "研究展示"],
    empty: [
      "Coming: 30 research results from openai/math and the Navier–Stokes challenge (needs the Full runner, with Mathlib).",
      "即將推出：30 個來自 openai/math 的研究成果，以及 Navier–Stokes 挑戰（需要含 Mathlib 的 Full 執行器）。",
    ],
  },
];

export interface Problem {
  id: string;
  category: Category;
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

/** One file per topic in problems/, all checked the same way by tests/test_problems.py. */
const FILES: [Category, unknown[]][] = [
  ["tutorial", tutorial],
  ["geometry", geometry],
  ["linalg", linearAlgebra],
];
export const PROBLEMS: Problem[] = FILES.flatMap(([category, list]) =>
  (list as Omit<Problem, "category">[]).map((p) => ({ ...p, category })),
);

/** An ordered learning path across topics (problems/collections.json); a problem may be in several. */
export interface Collection {
  id: string;
  title: Localized;
  summary: Localized;
  /** problem ids, in order */
  items: string[];
}
export const COLLECTIONS = collections as Collection[];

/** The collections a problem belongs to, with its position in each. */
export const collectionsOf = (id: string) =>
  COLLECTIONS.flatMap((c) => (c.items.includes(id) ? [{ collection: c, index: c.items.indexOf(id) }] : []));
