/**
 * What the agent panel knows about the page, and how its edits get back into the editor (Tensorizer's agentBus).
 * Only the Problems page (a problem or a research project) publishes a context, so the panel appears only there.
 * Self-contained (no imports with values), so node tests can import it.
 */
export interface AgentFile {
  name: string;
  code: string;
}
export interface AgentContext {
  /** problem/<id> | project/<id> */
  target: string;
  title: string;
  /** every file, in the order Lean checks them (a problem's Proof.lean last) */
  files: AgentFile[];
  /** files the agent's edits must not overwrite (a problem's own library) */
  readonly?: string[];
  main?: string;
  statements?: string[];
  next?: string;
  focus?: { name: string; file?: string; status?: string; note?: string };
  cursor?: { file: string; line: number };
  selection?: { file: string; from_line: number; to_line: number; text: string };
  goals?: string[];
  errors?: { file: string; line: number; message: string }[];
  /** the last check, for the suggested questions */
  verdict?: string;
  /** declarations by status (a research project) */
  statuses?: Record<string, string>;
  lang?: string;
}
/** The agent's edits after a turn (backend agent.files_event). */
export interface FilesEvent {
  target: string;
  files: Record<string, string>;
  removed: string[];
  order: string[];
}

let current: AgentContext | null = null;
const listeners = new Set<() => void>();
export function setAgentContext(c: AgentContext | null): void {
  current = c;
  listeners.forEach((l) => l());
}
export const getAgentContext = () => current;
export function subscribeAgentContext(l: () => void): () => void {
  listeners.add(l);
  return () => void listeners.delete(l);
}

/** Open the Ask AI panel (from the home's "Ask AI to set one up"), with a first message ready to edit and send. The
 *  request waits until the panel is on screen (it appears on the Problems page). */
export const AGENT_OPEN_EVENT = "formalizer:agent-open";
let openRequest: string | null = null;
let sendRequest = false;
/** `send`: send the message at once when an agent is connected (else it waits in the box, to send by hand). */
export function requestAgentOpen(draft = "", { send = false }: { send?: boolean } = {}): void {
  openRequest = draft;
  sendRequest = send;
  window.dispatchEvent(new Event(AGENT_OPEN_EVENT));
}
export function takeAgentOpen(): { draft: string; send: boolean } | null {
  if (openRequest === null) return null;
  const d = { draft: openRequest, send: sendRequest };
  openRequest = null;
  sendRequest = false;
  return d;
}

/** The agent's answer text when a turn ends, for pages that asked something they read back (the research
 *  workspace's "Ask AI to link"). */
export interface AgentAnswer {
  target: string;
  message: string;
  text: string;
}
const answerListeners = new Set<(a: AgentAnswer) => void>();
export function onAgentAnswer(l: (a: AgentAnswer) => void): () => void {
  answerListeners.add(l);
  return () => void answerListeners.delete(l);
}
export function publishAgentAnswer(a: AgentAnswer): void {
  answerListeners.forEach((l) => l(a));
}

const appliers = new Set<(e: FilesEvent) => boolean>();
/** A page takes edits for the target it shows (returns true when it applied them). */
export function onAgentFiles(handler: (e: FilesEvent) => boolean): () => void {
  appliers.add(handler);
  return () => void appliers.delete(handler);
}
/** true when a page on screen applied them; false: nobody shows that target now (applied later, from the log). */
export function applyAgentFiles(e: FilesEvent): boolean {
  let taken = false;
  appliers.forEach((h) => (taken = h(e) || taken));
  return taken;
}

/** Merge the agent's edits into a list of files: changed ones replaced, new ones placed by `order`, removed ones
 *  dropped; read-only files are never touched. */
export function mergeFiles<F extends AgentFile>(files: F[], e: FilesEvent, readonly: ReadonlySet<string> = new Set()): F[] {
  const out = files
    .filter((f) => readonly.has(f.name) || !e.removed.includes(f.name))
    .map((f) => (!readonly.has(f.name) && f.name in e.files ? { ...f, code: e.files[f.name] } : f));
  for (const name of e.order) {
    if (out.some((f) => f.name === name) || !(name in e.files)) continue;
    const at = e.order.indexOf(name);
    const after = e.order
      .slice(0, at)
      .reverse()
      .find((n) => out.some((f) => f.name === n));
    const index = after ? out.findIndex((f) => f.name === after) + 1 : 0;
    out.splice(index, 0, { name, code: e.files[name] } as F);
  }
  return out;
}
