/**
 * The in-page agent's client (backend/routes_agents.py), as Tensorizer's: one chat turn runs detached on the runner,
 * and the page only follows its event log, so a reload, a closed tab or a dropped connection never stops the agent.
 */
import { JobGone, readJobEvents, visitorId, type JobEvent } from "@learnkit/web";
import { RunnerError, runnerUrl } from "../runner";

export interface AgentStatus {
  enabled: boolean;
  agents: { id: string; label: string; available: boolean; logged_in?: boolean | null }[];
  default: string;
  models: string[];
  modes: { local: boolean; api: boolean };
  check_timeout_s: number;
}
export interface FoundAgent {
  id: string;
  label: string;
  installed: boolean;
  version: string | null;
  logged_in: boolean | null;
  experimental: boolean;
  docs: string;
}
export interface TurnInfo {
  id: string;
  target: string;
  agent: string;
  message: string;
  status: "running" | "done" | "failed" | "cancelled" | "interrupted";
  session: string | null;
  conversation: string | null;
}
export interface Conversation {
  id: string;
  session: string | null;
  target: string;
  agent: string;
  title: string;
  turns: string[];
  created: number;
  updated: number;
  status: TurnInfo["status"];
}
export type AgentEvent = JobEvent;

const headers = (json = false) => ({
  "X-Visitor": visitorId("formalizer.visitor"),
  ...(json ? { "Content-Type": "application/json" } : {}),
});

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${runnerUrl()}${path}`, { ...init, headers: headers(!!init?.body) });
  } catch {
    throw new RunnerError("offline");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new RunnerError(typeof body.detail === "string" ? body.detail : `HTTP ${res.status}`, res.status);
  return body as T;
}

export const agentStatus = () => call<AgentStatus>("/api/agents/status");
export const scanAgents = () => call<{ agents: FoundAgent[] }>("/api/agents/scan", { method: "POST" }).then((r) => r.agents);
export const cancelTurn = (id: string) =>
  call<{ cancelled: boolean }>(`/api/agents/turns/${id}/cancel`, { method: "POST" }).then(
    (r) => r.cancelled,
    () => false,
  );
export const listConversations = (target?: string) =>
  call<{ conversations: Conversation[] }>(`/api/agents/conversations${target ? `?target=${encodeURIComponent(target)}` : ""}`).then(
    (r) => r.conversations,
  );
export const deleteConversation = (id: string) =>
  call(`/api/agents/conversations/${encodeURIComponent(id)}`, { method: "DELETE" }).then(
    () => true,
    () => false,
  );
/** null: the turn is gone (expired, or another browser's). */
export async function turnInfo(id: string): Promise<TurnInfo | null> {
  try {
    return await call<TurnInfo>(`/api/agents/turns/${id}`);
  } catch (e) {
    if (e instanceof RunnerError && e.status === 404) return null;
    throw e;
  }
}

/** An agent turn's log has no single last event: it ends when its stream closes and the turn is no longer running. */
const turnOver = async (id: string | null) => !id || (await turnInfo(id).catch(() => null))?.status !== "running";

export interface ChatBody {
  target: string;
  message: string;
  session?: string | null;
  model?: string;
  context?: unknown;
  agent: string;
  conversation?: string | null;
}

/** Send one message: starts a turn and follows it (reconnecting from the last event if the stream breaks). The
 *  first event is {"type": "turn", "id"}. Aborting stops following, never the agent (cancelTurn does that). */
export async function agentChat(body: ChatBody, onEvent: (e: AgentEvent) => void, signal?: AbortSignal): Promise<void> {
  let turn: string | null = null;
  let posted = false;
  await readJobEvents({
    signal,
    isFinal: () => false,
    finished: () => turnOver(turn),
    onEvent: (e) => {
      if (e.type === "turn") turn = String(e.id);
      onEvent(e);
    },
    open: async (from, s) => {
      if (turn) return fetch(`${runnerUrl()}/api/agents/turns/${turn}/events?from=${from}`, { headers: headers(), signal: s });
      if (posted) throw new JobGone("the message did not reach the runner: send it again");
      posted = true; // never start the same turn twice
      const res = await fetch(`${runnerUrl()}/api/agents/chat`, {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify(body),
        signal: s,
      });
      if (!res.ok) {
        const detail = await res.json().then(
          (b) => b.detail,
          () => null,
        );
        throw new JobGone(typeof detail === "string" ? detail : `HTTP ${res.status}`);
      }
      return res;
    },
  });
}

/** Follow a turn's log from event `from` (a rebuilt chat after a reload; a turn still running is followed live). */
export async function followTurn(id: string, from: number, onEvent: (e: AgentEvent) => void, signal?: AbortSignal): Promise<void> {
  await readJobEvents({
    from,
    signal,
    isFinal: () => false,
    finished: () => turnOver(id),
    onEvent,
    open: (n, s) => fetch(`${runnerUrl()}/api/agents/turns/${id}/events?from=${n}`, { headers: headers(), signal: s }),
  });
}
