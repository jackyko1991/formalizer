/** Detached jobs on the runner (backend/jobs.py): long checks that keep running when the page closes or reloads.
 * Separate from runner.ts, which node tests import without the learnkit alias. */
import { readJobEvents, visitorId, type JobEvent } from "@learnkit/web";
import { RunnerError, runnerUrl } from "./runner";

export interface JobInfo {
  id: string;
  kind: string;
  label: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  created: number;
  started: number | null;
  finished: number | null;
  elapsed: number;
  position: number | null;
  error: string | null;
  result: { verdict: string; ms: number } | null;
}

const visitorHeaders = () => ({ "X-Visitor": visitorId("formalizer.visitor") });

async function jobCall<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${runnerUrl()}${path}`, {
      ...init,
      headers: { ...visitorHeaders(), ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch {
    throw new RunnerError("offline");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new RunnerError(typeof body.detail === "string" ? body.detail : `HTTP ${res.status}`, res.status);
  return body;
}

export const startJob = (req: { code: string; theorems: string[]; statements: string[]; decls?: boolean; label: string }) =>
  jobCall<JobInfo>("/api/jobs", { method: "POST", body: JSON.stringify(req) });
export const listJobs = () => jobCall<JobInfo[]>("/api/jobs");
export const cancelJob = (id: string) => jobCall<{ cancelled: boolean }>(`/api/jobs/${id}/cancel`, { method: "POST" });

/** Follow a job's events (replayed from `from`, then live), reconnecting when the stream breaks; resolves with the
 *  final event (result or error). Aborting stops watching, never the job. */
export function followJob(id: string, onEvent: (e: JobEvent) => void, signal?: AbortSignal, from = 0): Promise<JobEvent> {
  return readJobEvents({
    from,
    signal,
    onEvent,
    open: (n, s) => fetch(`${runnerUrl()}/api/jobs/${id}/events?from=${n}`, { headers: visitorHeaders(), signal: s }),
  });
}
