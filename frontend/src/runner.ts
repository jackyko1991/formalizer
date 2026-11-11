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
export function fillFirstSorry(code: string, tactic: string): string {
  return code.replace(/\bsorry\b/, tactic);
}
