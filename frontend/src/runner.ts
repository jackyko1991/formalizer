/** The local Lean runner (backend/serve.py on the user's computer). Nothing is sent anywhere else. */

const PORT_KEY = "formalizer.runnerPort";
export const DEFAULT_PORT = 8790;

export function runnerPort(): number {
  try {
    const saved = Number(localStorage.getItem(PORT_KEY));
    return Number.isInteger(saved) && saved > 0 && saved < 65536 ? saved : DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}
export const runnerUrl = () => `http://localhost:${runnerPort()}`;

export interface Health {
  runner: "lite" | "full";
  lean: string;
  provides: string[];
  state: "warming" | "ready" | "failed" | "stopped";
  workers: number;
  error: string | null;
}

export interface Goal {
  line: number;
  column: number;
  /** the branch's name after `induction` / `cases`, e.g. "succ" */
  case?: string | null;
  hypotheses: string[];
  target: string;
  others: { hypotheses: string[]; target: string }[];
}
export interface Issue {
  line: number;
  column: number;
  message: string;
}
export interface CheckResult {
  verdict: "proved" | "incomplete" | "error" | "needs-runner";
  errors: Issue[];
  warnings: Issue[];
  /** info messages, e.g. the "Try this" of `exact?` and `simp?` */
  infos: Issue[];
  goals: Goal[];
  axioms: Record<string, string[]>;
  ms: number;
}

export class RunnerError extends Error {}

/** null when no runner answers on this computer. */
export async function health(signal?: AbortSignal): Promise<Health | null> {
  try {
    const res = await fetch(`${runnerUrl()}/api/health`, { signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function check(code: string, theorems: string[], statements: string[]): Promise<CheckResult> {
  let res: Response;
  try {
    res = await fetch(`${runnerUrl()}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, theorems, statements }),
    });
  } catch {
    throw new RunnerError("offline");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new RunnerError(typeof body.detail === "string" ? body.detail : `HTTP ${res.status}`);
  return body;
}

/** Replace the first `sorry` with a tactic (the help chips). */
/**
 * A chip replaces the first `sorry`. Its further lines (an `induction` or `calc` skeleton) are indented to that column;
 * a step chip keeps a `sorry` after it for what is left. Mirrored by tests/test_tutorial.py `insert_chip`.
 */
export function insertChip(code: string, chip: string, step = false): string {
  const m = /\bsorry\b/.exec(code);
  if (!m) return code;
  const indent = " ".repeat(m.index - (code.lastIndexOf("\n", m.index - 1) + 1));
  const text = chip.replaceAll("\n", "\n" + indent) + (step ? `\n${indent}sorry` : "");
  return code.slice(0, m.index) + text + code.slice(m.index + "sorry".length);
}

/** One file of a proof. A problem may ship extra files (e.g. a read-only library); the reader may add lemma files. */
export interface LeanFile {
  name: string;
  code: string;
  readonly?: boolean;
}

/**
 * Several files checked as one: joined in order (the main file last, so lemmas come before their use), with a map
 * from a line of the joined text back to its file and line there.
 */
export function joinFiles(files: LeanFile[]): { code: string; where: (line: number) => { file: string; line: number } } {
  const starts: { file: string; first: number }[] = [];
  let next = 1;
  const parts = files.map((f) => {
    const text = f.code.endsWith("\n") ? f.code : `${f.code}\n`;
    starts.push({ file: f.name, first: next });
    next += text.split("\n").length - 1;
    return text;
  });
  const where = (line: number) => {
    const at = [...starts].reverse().find((s) => s.first <= line) ?? starts[0];
    return { file: at.file, line: line - at.first + 1 };
  };
  return { code: parts.join(""), where };
}
