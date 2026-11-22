/**
 * The independent checkers (backend/checkers.py) as the site shows them: the frozen statement is the test, the checkers
 * are the test runner. Lite checkers run on every runner and OS, free; Full ones need a Full runner on Linux, WSL or
 * the cloud, and come with Formalizer Pro (pending). Pure logic here (tested by tests/checkers.test.ts); the picker
 * and the chips are CheckersPanel.tsx.
 */
import type { CheckOutcome, CheckerStatus, Health } from "./runner";

export type L = readonly [string, string];

export interface CheckerInfo {
  id: string;
  tier: "lite" | "full";
  title: L;
  /** what it checks, in a sentence */
  about: L;
}

export const CHECKERS: CheckerInfo[] = [
  {
    id: "static",
    tier: "lite",
    title: ["Static scan", "靜態掃描"],
    about: [
      "Reads the text: the statement is there unchanged; no sorry, axiom, native_decide or other escape hatch; nothing before the statement that changes what it means.",
      "讀程式文字：陳述原封不動；沒有 sorry、axiom、native_decide 等後門；陳述之前沒有改變其意思的東西。",
    ],
  },
  {
    id: "kernel+axioms",
    tier: "lite",
    title: ["Kernel + axioms", "核心 + 公理"],
    about: [
      "Lean's kernel accepts the file, and the theorem uses only propext, Quot.sound and Classical.choice.",
      "Lean 核心接受整個檔案，且定理只用到 propext、Quot.sound、Classical.choice。",
    ],
  },
  {
    id: "statement-match",
    tier: "lite",
    title: ["Statement match", "陳述比對"],
    about: [
      "Elaborates the problem's file and yours separately and compares the theorem's statement as Lean terms, with the definitions it uses: redefining ^ to mean 37 is caught here.",
      "分別展開題目的檔案和你的檔案，把定理陳述（連同它用到的定義）當成 Lean 項來比對：把 ^ 重新定義成 37 這類把戲會在這裡被抓到。",
    ],
  },
  {
    id: "leanchecker",
    tier: "lite",
    title: ["leanchecker", "leanchecker"],
    about: [
      "Compiles your file and replays every declaration through the kernel in a fresh process (ships with Lean). Takes a few seconds.",
      "編譯你的檔案，在全新的程序中把每個宣告重新交給核心檢查（隨 Lean 附帶）。需要幾秒。",
    ],
  },
  {
    id: "comparator",
    tier: "full",
    title: ["Comparator", "Comparator"],
    about: [
      "leanprover/comparator: builds challenge and solution in a sandbox, compares statements and axioms, replays the proof.",
      "leanprover/comparator：在沙箱中建置題目與解答，比對陳述與公理，再重播證明。",
    ],
  },
  {
    id: "nanoda",
    tier: "full",
    title: ["nanoda", "nanoda"],
    about: ["An independent type checker written in Rust, on lean4export's output.", "以 Rust 寫成的獨立型別檢查器，讀 lean4export 的輸出。"],
  },
  {
    id: "lean4lean",
    tier: "full",
    title: ["Lean4Lean", "Lean4Lean"],
    about: ["Lean's kernel rewritten in Lean.", "用 Lean 重寫的 Lean 核心。"],
  },
];

/** What the picker starts with: the quick Lite checkers (the runner's default set). */
export const DEFAULT_CHECKERS = ["static", "kernel+axioms", "statement-match"];

export const info = (id: string): CheckerInfo | undefined => CHECKERS.find((c) => c.id === id);

/**
 * Whether a checker can be picked: Lite ones whenever a runner is ready; Full ones only when shown (`full`), with Pro,
 * and when the runner reports them available (on Windows it says "not available on this OS").
 */
export function availability(c: CheckerInfo, health: Health | null, opts: { full: boolean; pro: boolean }): { enabled: boolean; reason: L | null } {
  if (!health || health.state !== "ready") return { enabled: false, reason: ["Start the runner first.", "請先啟動執行器。"] };
  const reported: CheckerStatus | undefined = health.checkers?.find((s) => s.id === c.id);
  if (c.tier === "full") {
    if (!opts.full) return { enabled: false, reason: ["Full checkers are in research projects (Problems ▸ Research).", "完整檢查器在研究專案裡（題庫 ▸ 研究）。"] };
    if (!opts.pro) return { enabled: false, reason: ["Comes with Formalizer Pro (pending).", "隨 Formalizer Pro 推出（籌備中）。"] };
  }
  if (!reported) {
    // a runner from before the checkers: it has only its own check
    return c.id === "kernel+axioms"
      ? { enabled: true, reason: null }
      : { enabled: false, reason: ["This runner is older than the checkers: update it.", "這個執行器比檢查器舊：請更新。"] };
  }
  if (!reported.available) return { enabled: false, reason: [reported.reason, reported.reason] };
  return { enabled: true, reason: null };
}

/** The chip for one checker's answer. */
export function chip(o: CheckOutcome): { glyph: string; cls: string; label: L } {
  switch (o.verdict) {
    case "pass":
      return { glyph: "✓", cls: "bg-green-50 text-green-800 ring-green-200", label: ["passes", "通過"] };
    case "fail":
      return { glyph: "✗", cls: "bg-red-50 text-red-800 ring-red-200", label: ["fails", "未通過"] };
    case "error":
      return { glyph: "!", cls: "bg-amber-50 text-amber-800 ring-amber-200", label: ["could not run", "無法執行"] };
    default:
      return { glyph: "–", cls: "bg-gray-50 text-gray-500 ring-gray-200", label: ["not available", "無法使用"] };
  }
}

/** The row's overall colour: green when every checker that ran passed, red when one failed. */
export function overall(outcomes: CheckOutcome[]): "green" | "red" | "none" {
  const ran = outcomes.filter((o) => o.verdict === "pass" || o.verdict === "fail");
  if (!ran.length) return "none";
  return ran.every((o) => o.verdict === "pass") ? "green" : "red";
}

/** "0.3 s" / "12 ms" */
export function duration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

/** Only the picked checkers that can run, in the catalogue's order. */
export function runnable(picked: string[], health: Health | null, opts: { full: boolean; pro: boolean }): string[] {
  return CHECKERS.filter((c) => picked.includes(c.id) && availability(c, health, opts).enabled).map((c) => c.id);
}

/**
 * The paid tier. Formalizer Pro is pending, so this is false for everyone; `localStorage["formalizer.pro"] = "1"` turns
 * it on in this browser to try the Full checkers on your own Linux / WSL runner.
 */
export function proEnabled(): boolean {
  try {
    return localStorage.getItem("formalizer.pro") === "1";
  } catch {
    return false;
  }
}
