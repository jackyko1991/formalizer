/**
 * Ask AI: the floating mascot (bottom right) and the conversation drawer it opens, as Tensorizer's AgentPanel. It
 * appears only where a page publishes a context (Problems and Research: bus.ts). One conversation per problem or
 * project; each message carries what is on screen (the files, the lemma in focus, the cursor or selection, the goals
 * and errors). The turn runs detached on the runner (backend/turns.py): reloading rebuilds the chat from the turn
 * logs, a turn still running is followed live, and the agent's edits reach the editor once (applied-seq bookkeeping).
 *
 * Modes as in Tensorizer: Local works (Claude Code here, or a Codex / OpenCode / Gemini CLI found on this computer);
 * API (your own key) and Cloud (Pro) are shown as coming.
 */
import { RichText, useLang } from "@learnkit/web";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { RunnerError } from "../runner";
import { runnerReady, useRunner } from "../RunnerPanel";
import {
  agentChat,
  agentStatus,
  cancelTurn,
  deleteConversation,
  followTurn,
  listConversations,
  scanAgents,
  turnInfo,
  type AgentEvent,
  type AgentStatus,
  type Conversation,
  type FoundAgent,
} from "./api";
import { applyAgentFiles, getAgentContext, subscribeAgentContext, type FilesEvent } from "./bus";
import { suggestQuestions } from "./suggest";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ the chat model

type Block =
  | { kind: "text"; text: string }
  | { kind: "tool"; id: string; name: string; input: Record<string, unknown>; ok?: boolean; result?: string }
  | { kind: "check"; verdict: string; ok: boolean; ms?: number; errors?: number; goals?: number; decls?: Record<string, number> }
  | { kind: "files"; event: FilesEvent; applied: boolean }
  | { kind: "error"; text: string; resumable?: boolean }
  | { kind: "question"; id: string; question: string; options: string[]; multi: boolean };
interface Message {
  role: "user" | "assistant";
  blocks: Block[];
  agent?: string;
}
interface Chat {
  messages: Message[];
  session: string | null;
  turns: string[];
  conversation?: string | null;
}
const EMPTY: Chat = { messages: [], session: null, turns: [] };
interface SavedChat {
  session: string | null;
  turns: string[];
  conversation?: string | null;
}
type Source = "live" | "replay";

const CHATS = "formalizer.agent.chats";
const APPLIED = "formalizer.agent.applied";
const CHOICE = "formalizer.agent.choice";
const FOUND = "formalizer.agent.found";
const SIZE = "formalizer.agent.rect";

function loadJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function saveJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the chat lasts for this page only */
  }
}
const savedChats = () => loadJson<Record<string, SavedChat>>(CHATS, {});
function saveChat(key: string, chat: SavedChat | null) {
  const all = savedChats();
  if (chat && chat.turns.length)
    all[key] = { session: chat.session, turns: chat.turns.slice(-40), conversation: chat.conversation ?? null };
  else delete all[key];
  saveJson(CHATS, all);
}
const appliedSeq = (turn: string): number | undefined => loadJson<Record<string, number>>(APPLIED, {})[turn];
function setApplied(turn: string, seq: number) {
  const all = loadJson<Record<string, number>>(APPLIED, {});
  delete all[turn];
  all[turn] = seq;
  const keys = Object.keys(all);
  for (const k of keys.slice(0, Math.max(0, keys.length - 200))) delete all[k];
  saveJson(APPLIED, all);
}

export interface AgentChoice {
  mode: "local" | "api" | "cloud";
  local: string; // claude-code | codex | opencode | gemini
  localModel: string; // Claude Code: one of the status models ("" = the first)
  cliModel: string; // a CLI's model, "" = its default
}
const DEFAULT_CHOICE: AgentChoice = { mode: "local", local: "claude-code", localModel: "", cliModel: "" };
const COMING = new Set<AgentChoice["mode"]>(["api", "cloud"]);
const AGENT_NAMES: Record<string, string> = {
  "claude-code": "Claude Code",
  "claude-api": "Claude (API)",
  codex: "Codex",
  opencode: "OpenCode",
  gemini: "Gemini CLI",
};
const TOOL_LABEL: Record<string, L> = {
  Read: ["Read", "讀取"],
  Write: ["Write", "寫入"],
  Edit: ["Edit", "編輯"],
  Glob: ["Find files", "找檔案"],
  Grep: ["Search", "搜尋"],
  List: ["List", "列出"],
  Bash: ["Shell", "終端機"],
  mcp__formalizer__check_proof: ["Check with Lean", "用 Lean 檢查"],
  mcp__formalizer__ask_user: ["Ask you", "問你"],
};

// ------------------------------------------------------------------------------------------------ where it runs

type Where = "local" | "server" | "cloud";
const WHERE: Record<Where, { icon: string; cls: string; label: L; hint: L }> = {
  local: {
    icon: "⌂",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    label: ["Local", "本機"],
    hint: [
      "The agent and Lean run on this computer, on your copy of the files. The agent's model is your own account's: Claude Code, for example, talks to Anthropic with your login.",
      "代理與 Lean 在這台電腦上執行，處理的是你檔案的副本。代理用的模型來自你自己的帳號：例如 Claude Code 會用你的登入連到 Anthropic。",
    ],
  },
  server: {
    icon: "↗",
    cls: "bg-blue-50 text-blue-700 ring-blue-200",
    label: ["Your provider", "你的服務商"],
    hint: [
      "Runs on this computer with your own API key: your messages and files go to the provider you chose.",
      "用你自己的 API 金鑰在這台電腦上執行：你的訊息與檔案會送到你選的服務商。",
    ],
  },
  cloud: {
    icon: "☁",
    cls: "bg-violet-50 text-violet-700 ring-violet-200",
    label: ["Pro Cloud", "雲端託管"],
    hint: [
      "Runs on Formalizer's hosted service (Pro, pending): your files are sent there, only when you use it.",
      "在 Formalizer 的託管服務上執行（Pro，籌備中）：只有在你使用時，檔案才會送到那裡。",
    ],
  },
};
export function WhereChip({ where }: { where: Where }) {
  const { pick } = useLang();
  const w = WHERE[where];
  return (
    <span
      title={pick(w.hint)}
      data-testid={`where-${where}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-px text-[11px] font-medium whitespace-nowrap ring-1 ${w.cls}`}
    >
      <span aria-hidden>{w.icon}</span>
      {pick(w.label)}
    </span>
  );
}

/** The agent's face: Formalizer's F with a friendly face; it looks up with a "…" while the agent works. */
function Mascot({ thinking = false, className = "" }: { thinking?: boolean; className?: string }) {
  const y = thinking ? 41 : 44;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <image href={`${import.meta.env.BASE_URL}favicon.svg`} x="0" y="0" width="64" height="64" />
      <ellipse cx="30" cy="44" rx="4.2" ry="5" fill="#ffffff" />
      <ellipse cx="44" cy="44" rx="4.2" ry="5" fill="#ffffff" />
      <circle cx={thinking ? 31 : 30.5} cy={y} r="2.2" fill="#111827" />
      <circle cx={thinking ? 45 : 44.5} cy={y} r="2.2" fill="#111827" />
      {thinking ? (
        <ellipse cx="37" cy="54" rx="2.4" ry="1.8" fill="#111827" />
      ) : (
        <path d="M31 52 Q37 58 43 52" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      )}
      {thinking && (
        <g fill="#f59e0b">
          <circle cx="50" cy="8" r="2.4" />
          <circle cx="56" cy="8" r="2.4" />
          <circle cx="62" cy="8" r="2.4" />
        </g>
      )}
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ size and place

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const EDGES: Edge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const EDGE_CLASS: Record<Edge, string> = {
  n: "top-0 left-3 right-3 h-1.5 cursor-ns-resize",
  s: "bottom-0 left-3 right-3 h-1.5 cursor-ns-resize",
  e: "right-0 top-3 bottom-3 w-1.5 cursor-ew-resize",
  w: "left-0 top-3 bottom-3 w-1.5 cursor-ew-resize",
  ne: "top-0 right-0 h-3 w-3 cursor-nesw-resize",
  nw: "top-0 left-0 h-3 w-3 cursor-nwse-resize",
  se: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize",
  sw: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize",
};
const MIN_W = 360;
const MIN_H = 420;
const GAP = 8;
function fitRect(r: Rect): Rect {
  const w = Math.min(Math.max(r.w, MIN_W), window.innerWidth - 2 * GAP);
  const h = Math.min(Math.max(r.h, MIN_H), window.innerHeight - 2 * GAP);
  return {
    w,
    h,
    x: Math.min(Math.max(r.x, GAP), window.innerWidth - w - GAP),
    y: Math.min(Math.max(r.y, GAP), window.innerHeight - h - GAP),
  };
}
function resizeRect(r: Rect, edge: Edge, dx: number, dy: number): Rect {
  let { x, y, w, h } = r;
  if (edge.includes("e")) w += dx;
  if (edge.includes("s")) h += dy;
  if (edge.includes("w")) ((x += dx), (w -= dx));
  if (edge.includes("n")) ((y += dy), (h -= dy));
  if (w < MIN_W) ((x -= edge.includes("w") ? MIN_W - w : 0), (w = MIN_W));
  if (h < MIN_H) ((y -= edge.includes("n") ? MIN_H - h : 0), (h = MIN_H));
  return fitRect({ x, y, w, h });
}

const HEAD_BTN =
  "inline-flex h-8 items-center justify-center rounded-md text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40";

// ------------------------------------------------------------------------------------------------ the panel

export default function AgentPanel() {
  const { pick, lang } = useLang();
  const { runner, open: openRunner } = useRunner();
  const ready = runnerReady(runner);
  const ctx = useSyncExternalStore(subscribeAgentContext, getAgentContext, getAgentContext);
  const chatKey = ctx?.target ?? "";

  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [rect, setRect] = useState<Rect | null>(() => {
    const r = loadJson<Rect | null>(SIZE, null);
    return r && typeof window !== "undefined" ? fitRect(r) : null;
  });
  const [st, setSt] = useState<AgentStatus | null>(null);
  const [stError, setStError] = useState<string | null>(null);
  const [choice, setChoiceState] = useState<AgentChoice>(() => ({ ...DEFAULT_CHOICE, ...loadJson<Partial<AgentChoice>>(CHOICE, {}) }));
  const [found, setFoundState] = useState<FoundAgent[] | null>(() => loadJson<FoundAgent[] | null>(FOUND, null));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Conversation[] | "loading" | null>(null);
  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dropSel, setDropSel] = useState<string | null>(null); // the selection the user removed from the context
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const abort = useRef<AbortController | null>(null);
  const turnOf = useRef<Record<string, string | null>>({});
  const restoring = useRef(new Set<string>());
  const bottom = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  const setChoice = (c: AgentChoice) => (setChoiceState(c), saveJson(CHOICE, c));
  const setFound = (f: FoundAgent[]) => (setFoundState(f), saveJson(FOUND, f));
  const chat = chats[chatKey] ?? EMPTY;
  const messages = chat.messages;

  // what this runner offers (asked when the panel opens and the runner is up)
  useEffect(() => {
    if (!open || !ready || st) return;
    agentStatus().then(
      (s) => (setSt(s), setStError(null)),
      (e) => setStError(e instanceof RunnerError && e.status === 404 ? "old-runner" : String(e)),
    );
  }, [open, ready, st]);
  useEffect(() => {
    if (!ready) setSt(null);
  }, [ready]);

  const agentId = choice.local;
  const localOk =
    agentId === "claude-code"
      ? st?.agents.find((a) => a.id === "claude-code")?.available !== false
      : !!found?.some((a) => a.id === agentId && a.installed);
  const connected = !!st?.enabled && choice.mode === "local" && localOk;
  const canType = ready && connected && !!ctx;
  const agentLabel = AGENT_NAMES[agentId] ?? agentId;
  const suggestions = useMemo(() => suggestQuestions(ctx), [ctx]);

  function edit(key: string, fn: (c: Chat) => Chat) {
    setChats((cs) => ({ ...cs, [key]: fn(cs[key] ?? EMPTY) }));
  }

  function onEvent(m: string, e: AgentEvent, source: Source = "live") {
    if (e.type === "turn") {
      const id = String(e.id);
      turnOf.current[m] = id;
      if (source === "live") setApplied(id, (e.seq as number) ?? 0); // this page sees (and applies) every event
      edit(m, (c) => {
        const turns = [...c.turns.filter((x) => x !== id), id];
        saveChat(m, { session: c.session, turns, conversation: c.conversation });
        return { ...c, turns };
      });
      return;
    }
    const turn = turnOf.current[m];
    const fresh = turn != null && typeof e.seq === "number" && e.seq > (appliedSeq(turn) ?? Number.POSITIVE_INFINITY);
    const update = (fn: (blocks: Block[]) => Block[]) =>
      edit(m, (c) => {
        const last = c.messages[c.messages.length - 1];
        if (!last || last.role !== "assistant") return c;
        return { ...c, messages: [...c.messages.slice(0, -1), { ...last, blocks: fn(last.blocks) }] };
      });
    if (e.type === "waiting") return setProgress(pick(["Waiting for a free agent slot…", "等待空出的代理名額……"]));
    if (e.type !== "session") setProgress(null);
    if (e.type === "session")
      edit(m, (c) => {
        const conversation = c.conversation ?? String(e.id);
        saveChat(m, { session: String(e.id), turns: c.turns, conversation });
        return { ...c, session: String(e.id), conversation };
      });
    else if (e.type === "text")
      update((bs) => {
        const last = bs[bs.length - 1];
        return last?.kind === "text"
          ? [...bs.slice(0, -1), { ...last, text: last.text + String(e.delta) }]
          : [...bs, { kind: "text", text: String(e.delta) }];
      });
    else if (e.type === "tool")
      update((bs) => [...bs, { kind: "tool", id: String(e.id), name: String(e.name), input: (e.input as Record<string, unknown>) ?? {} }]);
    else if (e.type === "tool_result")
      update((bs) => bs.map((b) => (b.kind === "tool" && b.id === e.id ? { ...b, ok: !!e.ok, result: String(e.text ?? "") } : b)));
    else if (e.type === "check")
      update((bs) => [
        ...bs,
        {
          kind: "check",
          verdict: String(e.verdict),
          ok: !!e.ok,
          ms: e.ms as number | undefined,
          errors: e.errors as number | undefined,
          goals: e.goals as number | undefined,
          decls: e.decls as Record<string, number> | undefined,
        },
      ]);
    else if (e.type === "question")
      update((bs) =>
        bs.some((b) => b.kind === "question" && b.id === e.id)
          ? bs
          : [...bs, { kind: "question", id: String(e.id), question: String(e.question), options: e.options as string[], multi: !!e.multi }],
      );
    else if (e.type === "files") {
      const event = {
        target: String(e.target),
        files: e.files as Record<string, string>,
        removed: (e.removed as string[]) ?? [],
        order: (e.order as string[]) ?? [],
      };
      // the edits go straight into the editor, once: live, or when a rebuilt chat shows edits this browser never applied
      const applied = fresh && applyAgentFiles(event);
      if (applied && turn && typeof e.seq === "number") setApplied(turn, e.seq);
      update((bs) => [...bs.filter((b) => b.kind !== "files"), { kind: "files", event, applied: applied || !fresh }]);
    } else if (e.type === "error") {
      const stopped = e.message === "stopped";
      const text = e.interrupted
        ? pick(["The runner restarted during this answer.", "回答途中執行器重新啟動了。"])
        : stopped
          ? pick(["Stopped.", "已停止。"])
          : String(e.message);
      update((bs) => [...bs, { kind: "error", text, resumable: !!e.interrupted || stopped }]);
    }
  }

  /** Rebuild a chat from its turns' logs on the runner; a turn still running is followed live. */
  async function restoreChat(m: string, saved: SavedChat) {
    if (restoring.current.has(m)) return;
    restoring.current.add(m);
    const controller = new AbortController();
    edit(m, () => ({ messages: [], session: saved.session, turns: saved.turns, conversation: saved.conversation }));
    const kept: string[] = [];
    try {
      for (const id of saved.turns) {
        let info;
        try {
          info = await turnInfo(id);
        } catch {
          return; // the runner is unreachable: try again when the panel next opens
        }
        if (info === null) continue;
        kept.push(id);
        turnOf.current[m] = id;
        edit(m, (c) => ({
          ...c,
          messages: [
            ...c.messages,
            { role: "user", blocks: [{ kind: "text", text: info.message }] },
            { role: "assistant", blocks: [], agent: AGENT_NAMES[info.agent] ?? info.agent },
          ],
        }));
        const live = info.status === "running";
        if (live) {
          setBusy(m);
          abort.current = controller;
          setNotice(pick(["Reconnected: the agent kept working while the page was closed.", "已重新連上：頁面關閉時代理仍在工作。"]));
        }
        try {
          await followTurn(id, 1, (e) => onEvent(m, e, "replay"), controller.signal); // event 0 is the message
        } catch (e) {
          onEvent(m, { type: "error", message: String(e instanceof Error ? e.message : e) }, "replay");
        } finally {
          if (live) {
            setBusy(null);
            abort.current = null;
            setNotice(null);
            setProgress(null);
          }
        }
      }
    } finally {
      restoring.current.delete(m);
      if (kept.length !== saved.turns.length) {
        edit(m, (c) => ({ ...c, turns: kept }));
        saveChat(m, { session: saved.session, turns: kept, conversation: saved.conversation });
      }
    }
  }

  // opening the panel on a problem or project: rebuild its chat from the runner if this page doesn't have it yet
  useEffect(() => {
    if (!open || !st?.enabled || !chatKey) return;
    if ((chats[chatKey]?.messages.length ?? 0) > 0 || busy === chatKey) return;
    const saved = savedChats()[chatKey];
    if (saved?.turns.length) void restoreChat(chatKey, saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, st?.enabled, chatKey]);

  async function loadHistory() {
    setHistory("loading");
    setHistory(await listConversations(chatKey).catch(() => []));
  }
  useEffect(() => {
    if (historyOpen && chatKey) void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, chatKey]);
  function openConversation(c: Conversation) {
    if (busy) return;
    const saved = { session: c.session, turns: c.turns, conversation: c.id };
    saveChat(chatKey, saved);
    setHistoryOpen(false);
    void restoreChat(chatKey, saved);
  }
  async function removeConversation(c: Conversation) {
    if (!(await deleteConversation(c.id))) return;
    if (c.turns.some((id) => chat.turns.includes(id))) newChat();
    void loadHistory();
  }
  function newChat() {
    edit(chatKey, () => EMPTY);
    saveChat(chatKey, null);
    turnOf.current[chatKey] = null;
  }
  async function stop() {
    const id = busy ? turnOf.current[busy] : null;
    if (!id || !(await cancelTurn(id))) abort.current?.abort();
  }

  useEffect(() => {
    if (busy === null) return setStartedAt(null);
    setStartedAt((s) => s ?? Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);
  useEffect(() => {
    const onResize = () => setRect((r) => (r ? fitRect(r) : r));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  function startResize(e: React.PointerEvent, edge: Edge) {
    e.preventDefault();
    const el = panelRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const start: Rect = { x: b.left, y: b.top, w: b.width, h: b.height };
    const x0 = e.clientX;
    const y0 = e.clientY;
    let last = start;
    const move = (ev: PointerEvent) => setRect((last = resizeRect(start, edge, ev.clientX - x0, ev.clientY - y0)));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      saveJson(SIZE, last);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const selection = ctx?.selection && ctx.selection.text !== dropSel ? ctx.selection : undefined;

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy || !canType || !ctx) return;
    const m = chatKey;
    setDraft("");
    setBusy(m);
    setNotice(null);
    const where = selection
      ? ` \n\n› ${selection.file}:${selection.from_line}${selection.to_line > selection.from_line ? `–${selection.to_line}` : ""}`
      : "";
    edit(m, (c) => ({
      ...c,
      messages: [
        ...c.messages,
        { role: "user", blocks: [{ kind: "text", text: message + where }] },
        { role: "assistant", blocks: [], agent: agentLabel },
      ],
    }));
    abort.current = new AbortController();
    const context = {
      files: ctx.files.map((f) => ({ name: f.name, code: f.code })),
      title: ctx.title,
      main: ctx.main,
      statements: ctx.statements,
      next: ctx.next,
      focus: ctx.focus,
      selection,
      cursor: ctx.cursor,
      goals: ctx.goals,
      errors: ctx.errors,
      lang,
    };
    const model = agentId === "claude-code" ? choice.localModel || st?.models[0] : choice.cliModel;
    try {
      await agentChat(
        {
          target: m,
          message,
          session: chat.session,
          model: model || undefined,
          context,
          agent: agentId,
          conversation: chat.conversation ?? undefined,
        },
        (e) => onEvent(m, e, "live"),
        abort.current.signal,
      );
    } catch (e) {
      onEvent(m, { type: "error", message: String(e instanceof Error ? e.message : e) });
    } finally {
      setBusy(null);
      setProgress(null);
      abort.current = null;
      setDropSel(null);
    }
  }

  if (!ctx) return null; // only the Problems and Research pages publish a context

  const status: ReactNode = !ready ? (
    <button onClick={openRunner} className="text-(--lk-accent) hover:underline">
      {pick(["Start the runner: the agent works through it", "啟動執行器：代理透過它工作"])}
    </button>
  ) : stError === "old-runner" ? (
    pick([
      "This runner has no agent yet: update Formalizer (git pull) and restart it.",
      "這個執行器還沒有代理：請更新 Formalizer（git pull）並重新啟動。",
    ])
  ) : stError ? (
    stError
  ) : !st ? (
    pick(["Checking…", "檢查中……"])
  ) : !st.enabled ? (
    pick(["The agent is switched off on this runner.", "這個執行器關閉了代理。"])
  ) : connected ? (
    <span className="flex min-w-0 items-center gap-1.5">
      <WhereChip where="local" />
      <span className="truncate">
        {pick(["Agent", "代理"])}: {agentLabel}
      </span>
    </span>
  ) : (
    pick(["Choose an agent", "選擇一個代理"])
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={pick(["Ask AI", "問 AI"])}
        aria-expanded={open}
        data-testid="agent-open"
        className="group fixed right-4 bottom-10 z-40 h-16 w-16 rounded-full border border-teal-100 bg-white p-1.5 shadow-lg transition hover:scale-105 hover:shadow-xl"
      >
        <Mascot thinking={busy !== null} className="h-full w-full" />
        <span className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-full bg-teal-700 px-3 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {pick(["Ask AI", "問 AI"])}
        </span>
      </button>

      {open && (
        <>
          {full && <div className="fixed inset-0 z-40 bg-gray-900/20" onClick={() => setFull(false)} aria-hidden />}
          <section
            ref={panelRef}
            aria-label={pick(["AI assistant", "AI 助理"])}
            data-testid="agent-panel"
            style={full || !rect ? undefined : { left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
            className={`fixed z-40 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ${
              full ? "inset-3 sm:inset-6" : rect ? "" : "right-4 bottom-28 h-[min(640px,calc(100dvh-9rem))] w-[min(440px,calc(100vw-2rem))]"
            }`}
          >
            {!full &&
              EDGES.map((edge) => (
                <div
                  key={edge}
                  onPointerDown={(e) => startResize(e, edge)}
                  onDoubleClick={() => (setRect(null), saveJson(SIZE, null))}
                  title={pick(["Drag to resize; double-click for the default size", "拖曳以調整大小；按兩下恢復預設大小"])}
                  aria-hidden
                  className={`absolute z-20 ${EDGE_CLASS[edge]}`}
                />
              ))}
            <header className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
              <Mascot thinking={busy !== null} className="h-7 w-7" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">{pick(["AI assistant", "AI 助理"])}</div>
                <div className="truncate text-[11px] text-gray-500" data-testid="agent-label">
                  {status}
                </div>
              </div>
              {st?.enabled && (
                <button
                  onClick={() => setSettingsOpen((o) => !o)}
                  aria-expanded={settingsOpen}
                  className={`${HEAD_BTN} gap-1.5 px-2.5 ${settingsOpen ? "bg-gray-100 text-gray-800" : ""}`}
                  data-testid="agent-settings"
                >
                  ⚙ {pick(["Agent", "代理"])}
                </button>
              )}
              <button onClick={newChat} disabled={busy !== null} className={`${HEAD_BTN} px-2.5`}>
                {pick(["New chat", "新對話"])}
              </button>
              <button
                onClick={() => setFull((f) => !f)}
                title={full ? pick(["Exit full screen", "離開全螢幕"]) : pick(["Full screen", "全螢幕"])}
                className={`${HEAD_BTN} w-8`}
              >
                {full ? "⤡" : "⤢"}
              </button>
              <button onClick={() => (setOpen(false), setFull(false))} aria-label="close" className={`${HEAD_BTN} w-8`}>
                ✕
              </button>
            </header>

            {settingsOpen && st?.enabled && (
              <div className="max-h-[55%] shrink-0 overflow-y-auto">
                <Settings
                  status={st}
                  choice={choice}
                  onChoice={setChoice}
                  found={found}
                  onFound={setFound}
                  onClose={() => setSettingsOpen(false)}
                />
              </div>
            )}

            <button
              onClick={() => setHistoryOpen((o) => !o)}
              aria-expanded={historyOpen}
              className="flex items-center justify-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900"
              data-testid="agent-history"
            >
              <span className="truncate font-medium text-gray-800">
                <RichText text={ctx.title} />
              </span>
              <span className="text-gray-400">· {pick(["History", "歷史"])}</span>
              <span aria-hidden className={`text-[10px] text-gray-400 transition ${historyOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {historyOpen && (
              <div
                className="max-h-[45%] shrink-0 overflow-y-auto border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs"
                data-testid="agent-history-list"
              >
                {history === "loading" ? (
                  <p className="text-gray-400">{pick(["Loading…", "載入中……"])}</p>
                ) : !history?.length ? (
                  <p className="text-gray-500">{pick(["No earlier chats about this yet.", "還沒有關於這裡的對話。"])}</p>
                ) : (
                  <ul className="space-y-1">
                    {history.map((c) => {
                      const current = c.turns.some((id) => chat.turns.includes(id));
                      return (
                        <li key={c.id} className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-gray-200">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-gray-800">{c.title || "…"}</div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(c.updated * 1000).toLocaleString()} · {c.turns.length} {pick(["messages", "則訊息"])}
                              {c.status === "running" && <span className="ml-1 text-amber-600">● {pick(["working", "工作中"])}</span>}
                              {current && <span className="ml-1 text-teal-700">· {pick(["open", "目前"])}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => openConversation(c)}
                            disabled={busy !== null || current}
                            className="rounded border border-gray-300 px-2 py-0.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                          >
                            {pick(["Open", "開啟"])}
                          </button>
                          <button
                            onClick={() => void removeConversation(c)}
                            disabled={c.status === "running"}
                            aria-label={pick(["Delete", "刪除"])}
                            className="rounded px-1.5 py-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 text-sm">
              {ready && st && !connected && st.enabled && (
                <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  {pick([
                    "Choose an agent under ⚙ Agent: Claude Code on this computer, or a Codex, OpenCode or Gemini CLI you have installed.",
                    "在 ⚙ 代理 中選一個代理：這台電腦上的 Claude Code，或你已安裝的 Codex、OpenCode、Gemini CLI。",
                  ])}
                </p>
              )}
              {messages.length === 0 && canType && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">{pick(["Try one:", "試試看："])}</p>
                  {suggestions.map((q) => (
                    <button
                      key={q[0]}
                      onClick={() => void send(pick(q))}
                      data-testid="agent-suggestion"
                      className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-700 hover:border-teal-300 hover:bg-teal-50"
                    >
                      <RichText text={pick(q)} />
                    </button>
                  ))}
                  <p className="pt-1 text-[11px] text-gray-400">
                    {pick([
                      "The agent works on a copy; its edits come back to your editor, and Lean checks every one.",
                      "代理在副本上工作；它的修改會回到你的編輯器，而且每一個都由 Lean 檢查。",
                    ])}
                  </p>
                </div>
              )}
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="ml-8 rounded-lg bg-gray-100 px-3 py-2 whitespace-pre-wrap text-gray-900">
                    {(msg.blocks[0] as { text: string }).text}
                  </div>
                ) : (
                  <div key={i} className="space-y-2">
                    {msg.agent && (
                      <div className="text-[11px] font-medium text-gray-600" data-testid="agent-answer-name">
                        {msg.agent}
                      </div>
                    )}
                    {groupSteps(msg.blocks).map((g, j) =>
                      g.kind === "steps" ? (
                        <Steps key={j} steps={g.steps} live={busy === chatKey && i === messages.length - 1} />
                      ) : g.block.kind === "question" ? (
                        <QuestionCard
                          key={j}
                          block={g.block}
                          active={i === messages.length - 1 && busy === null && canType}
                          onAnswer={(a) => void send(a)}
                        />
                      ) : (
                        <AgentBlock key={j} block={g.block} />
                      ),
                    )}
                    {busy === chatKey && i === messages.length - 1 && (
                      <div className="text-xs text-gray-400" data-testid="agent-working">
                        <span className="animate-pulse">●</span>{" "}
                        {progress ?? currentStep(msg.blocks, pick) ?? pick(["Working…", "工作中……"])}
                        {startedAt && <span className="ml-1 tabular-nums">· {Math.max(0, Math.round((now - startedAt) / 1000))} s</span>}
                      </div>
                    )}
                    {busy === null &&
                      canType &&
                      i === messages.length - 1 &&
                      msg.blocks[msg.blocks.length - 1]?.kind === "error" &&
                      (msg.blocks[msg.blocks.length - 1] as { resumable?: boolean }).resumable && (
                        <button
                          onClick={() => void send(pick(["Please continue where you stopped.", "請從剛才停下的地方繼續。"]))}
                          className="rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 hover:bg-teal-100"
                        >
                          ↻ {pick(["Continue", "繼續"])}
                        </button>
                      )}
                  </div>
                ),
              )}
              <div ref={bottom} />
            </div>

            <footer className="border-t border-gray-200 p-2">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]" data-testid="agent-context">
                <span className="shrink-0 text-gray-400">{pick(["Context", "內容"])}:</span>
                <span className="inline-flex max-w-[60%] items-center truncate rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-800">
                  <span className="truncate">
                    <RichText text={ctx.title} />
                    {ctx.focus && <span className="font-normal text-gray-500"> · {ctx.focus.name}</span>}
                  </span>
                </span>
                {selection && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-900 ring-1 ring-teal-200"
                    title={selection.text}
                  >
                    <span className="font-mono">
                      {selection.file}:{selection.from_line}
                      {selection.to_line > selection.from_line && `–${selection.to_line}`}
                    </span>
                    <button
                      onClick={() => setDropSel(selection.text)}
                      aria-label={pick(["Remove", "移除"])}
                      className="text-teal-700 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {notice && <span className="text-amber-700">{notice}</span>}
              </div>
              <div className="flex items-end gap-1.5 rounded-xl border border-gray-300 py-1.5 pr-1.5 pl-3 focus-within:border-teal-500">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send(draft);
                    }
                  }}
                  rows={1}
                  disabled={!canType}
                  placeholder={pick(["Ask about this proof…", "問問這個證明……"])}
                  className="max-h-36 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed outline-none placeholder:text-gray-400 disabled:opacity-50"
                  data-testid="agent-input"
                />
                {busy === chatKey ? (
                  <button
                    onClick={() => void stop()}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    data-testid="agent-stop"
                  >
                    {pick(["Stop", "停止"])}
                  </button>
                ) : (
                  <button
                    onClick={() => void send(draft)}
                    disabled={!canType || !draft.trim() || busy !== null}
                    className="rounded-lg bg-(--lk-accent) px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40"
                    data-testid="agent-send"
                  >
                    {pick(["Send", "送出"])}
                  </button>
                )}
              </div>
            </footer>
          </section>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------------------------------------ settings

function Settings({
  status,
  choice,
  onChoice,
  found,
  onFound,
  onClose,
}: {
  status: AgentStatus;
  choice: AgentChoice;
  onChoice: (c: AgentChoice) => void;
  found: FoundAgent[] | null;
  onFound: (f: FoundAgent[]) => void;
  onClose: () => void;
}) {
  const { pick } = useLang();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<AgentChoice>) => onChoice({ ...choice, ...patch });
  const claude = status.agents.find((a) => a.id === "claude-code");
  async function search() {
    setSearching(true);
    setError(null);
    try {
      onFound(await scanAgents());
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSearching(false);
    }
  }
  const MODES: { id: AgentChoice["mode"]; label: L; where: Where }[] = [
    { id: "local", label: ["Local", "本機"], where: "local" },
    { id: "api", label: ["API key", "API 金鑰"], where: "server" },
    { id: "cloud", label: ["Cloud", "雲端"], where: "cloud" },
  ];
  const clis = (found ?? []).filter((a) => a.id !== "claude-code");
  return (
    <div className="space-y-2 border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-xs" data-testid="agent-settings-form">
      <div className="flex items-center text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
        {pick(["Agent", "代理"])}
        <button
          onClick={onClose}
          aria-label={pick(["Close", "關閉"])}
          className="ml-auto rounded px-1.5 text-sm font-normal text-gray-400 hover:bg-gray-200"
        >
          ✕
        </button>
      </div>
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-md bg-white p-0.5 ring-1 ring-gray-200">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={choice.mode === m.id}
            disabled={COMING.has(m.id)}
            title={COMING.has(m.id) ? pick(["Coming", "即將推出"]) : undefined}
            onClick={() => set({ mode: m.id })}
            className={`rounded px-2 py-1 ${choice.mode === m.id ? "bg-teal-700 text-white" : COMING.has(m.id) ? "cursor-not-allowed text-gray-400" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {pick(m.label)}
            {COMING.has(m.id) && <span className="ml-1 text-[10px]">({pick(["coming", "即將推出"])})</span>}
            <span className="mt-0.5 flex justify-center">
              <WhereChip where={m.where} />
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <AgentOption
          active={choice.local === "claude-code"}
          onPick={() => set({ local: "claude-code" })}
          label="Claude Code"
          detail={
            claude?.available === false
              ? pick(["not found", "找不到"])
              : claude?.logged_in === false
                ? pick(["not logged in: run `claude` once and log in", "尚未登入：先執行一次 `claude` 並登入"])
                : pick(["with this computer's login", "用這台電腦的登入"])
          }
        />
        {choice.local === "claude-code" && (
          <label className="flex items-center gap-2 pl-6">
            <span className="text-gray-500">{pick(["Model", "模型"])}</span>
            <select
              value={choice.localModel}
              onChange={(e) => set({ localModel: e.target.value })}
              className="rounded border border-gray-300 bg-white px-1.5 py-0.5"
            >
              {status.models.map((m, i) => (
                <option key={m} value={i === 0 ? "" : m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
        {clis.map((a) => (
          <Fragment key={a.id}>
            <AgentOption
              active={choice.local === a.id}
              disabled={!a.installed}
              onPick={() => set({ local: a.id })}
              label={a.label}
              detail={
                a.installed
                  ? `${a.version ?? ""}${a.logged_in === false ? ` · ${pick(["not logged in", "尚未登入"])}` : ""}${a.experimental ? ` · ${pick(["experimental", "實驗性"])}` : ""}`
                  : pick(["not installed", "未安裝"])
              }
            />
            {choice.local === a.id && a.installed && (
              <label className="flex items-center gap-2 pl-6">
                <span className="text-gray-500">{pick(["Model", "模型"])}</span>
                <input
                  value={choice.cliModel}
                  onChange={(e) => set({ cliModel: e.target.value })}
                  placeholder={pick(["its default", "它的預設"])}
                  className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-1.5 py-0.5"
                />
              </label>
            )}
          </Fragment>
        ))}
        <button
          onClick={() => void search()}
          disabled={searching}
          className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
          data-testid="agent-scan"
        >
          🔍 {searching ? pick(["Searching…", "搜尋中……"]) : pick(["Search this computer for other agents", "在這台電腦上找其他代理"])}
        </button>
        {!found && (
          <p className="text-[11px] text-gray-500">
            {pick([
              "Looks for the Codex, OpenCode and Gemini CLIs. Only whether each is installed (and its version) is reported.",
              "尋找 Codex、OpenCode 與 Gemini CLI。只回報是否安裝（以及版本）。",
            ])}
          </p>
        )}
        {error && <p className="text-red-700">{error}</p>}
      </div>
    </div>
  );
}

function AgentOption({
  active,
  disabled,
  onPick,
  label,
  detail,
}: {
  active: boolean;
  disabled?: boolean;
  onPick: () => void;
  label: string;
  detail: string;
}) {
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left disabled:opacity-50 ${active ? "border-teal-500 bg-white" : "border-gray-200 bg-white hover:border-teal-300"}`}
    >
      <span className={active ? "text-teal-700" : "text-gray-300"}>{active ? "◉" : "○"}</span>
      <span className="font-medium text-gray-900">{label}</span>
      <span className="truncate text-[11px] text-gray-500">
        <RichText text={detail} />
      </span>
    </button>
  );
}

// ------------------------------------------------------------------------------------------------ the answer

function QuestionCard({
  block,
  active,
  onAnswer,
}: {
  block: Extract<Block, { kind: "question" }>;
  active: boolean;
  onAnswer: (a: string) => void;
}) {
  const { pick } = useLang();
  const [picked, setPicked] = useState<string[]>([]);
  const [own, setOwn] = useState("");
  const choose = (o: string) => (block.multi ? setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o])) : onAnswer(o));
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-sm" data-testid="agent-question">
      <p className="mb-2 font-medium text-gray-900">
        <RichText text={block.question} />
      </p>
      <div className="flex flex-col gap-1.5">
        {block.options.map((o) => {
          const on = picked.includes(o);
          return (
            <button
              key={o}
              disabled={!active}
              onClick={() => choose(o)}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-left text-xs disabled:cursor-default disabled:opacity-60 ${on ? "border-teal-500 bg-white text-teal-900" : "border-gray-200 bg-white text-gray-800 hover:border-teal-300"}`}
            >
              {block.multi && <span className={on ? "text-teal-700" : "text-gray-300"}>{on ? "☑" : "☐"}</span>}
              <RichText text={o} />
            </button>
          );
        })}
      </div>
      {active && (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && own.trim() && !e.nativeEvent.isComposing && onAnswer(own.trim())}
            placeholder={pick(["Or type your own answer", "或輸入你自己的回答"])}
            className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-teal-400"
          />
          {(block.multi || own.trim()) && (
            <button
              disabled={!own.trim() && !picked.length}
              onClick={() => onAnswer([...picked, ...(own.trim() ? [own.trim()] : [])].join("; "))}
              className="rounded-md bg-(--lk-accent) px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              {pick(["Send", "送出"])}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const VERDICT: Record<string, { cls: string; label: L }> = {
  proved: { cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", label: ["✓ proved", "✓ 已證明"] },
  incomplete: { cls: "bg-amber-50 text-amber-800 ring-amber-200", label: ["◐ a sorry is left", "◐ 還有 sorry"] },
  error: { cls: "bg-red-50 text-red-800 ring-red-200", label: ["✖ Lean rejects it", "✖ Lean 不接受"] },
  timeout: { cls: "bg-sky-50 text-sky-800 ring-sky-200", label: ["⏱ too slow for a quick check", "⏱ 超過快速檢查的時間"] },
};

function AgentBlock({ block }: { block: Block }) {
  const { pick } = useLang();
  if (block.kind === "text") return <AnswerText text={block.text} />;
  if (block.kind === "error") return <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{block.text}</p>;
  if (block.kind === "check") {
    const v = VERDICT[block.verdict] ?? { cls: "bg-gray-50 text-gray-700 ring-gray-200", label: [block.verdict, block.verdict] as L };
    return (
      <p
        className={`inline-flex flex-wrap items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ring-1 ${v.cls}`}
        data-testid="agent-check"
      >
        <span className="text-[10px] opacity-70">⌂ Lean</span> {pick(v.label)}
        {block.ms != null && <span className="opacity-60">· {block.ms} ms</span>}
        {block.decls &&
          Object.entries(block.decls).map(([k, n]) => (
            <span key={k} className="opacity-70">
              · {n} {k}
            </span>
          ))}
      </p>
    );
  }
  if (block.kind === "files") {
    const names = [...Object.keys(block.event.files), ...block.event.removed.map((n) => `−${n}`)];
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-teal-50 px-3 py-1.5 text-xs text-teal-900" data-testid="agent-files">
        <span>
          {block.applied ? "✓ " + pick(["In your editor:", "已放進你的編輯器："]) : pick(["Edits for:", "修改了："])}{" "}
          <span className="font-mono">{names.join(", ")}</span>
        </span>
        <button
          onClick={() => applyAgentFiles(block.event)}
          className="ml-auto rounded border border-teal-300 bg-white px-2 py-0.5 text-teal-800 hover:bg-teal-100"
        >
          ⇩ {block.applied ? pick(["Apply again", "再套用一次"]) : pick(["Apply", "套用"])}
        </button>
      </div>
    );
  }
  if (block.kind === "tool") return <ToolLine block={block} />;
  return null;
}

function ToolLine({ block }: { block: Extract<Block, { kind: "tool" }> }) {
  const { pick } = useLang();
  const mark = block.ok === undefined ? "text-gray-400 animate-pulse" : block.ok ? "text-green-600" : "text-red-600";
  return (
    <details className="rounded-md text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-gray-700">
        <span className={mark}>●</span>
        <span className="font-semibold">{TOOL_LABEL[block.name] ? pick(TOOL_LABEL[block.name]) : block.name}</span>
        <span className="truncate font-mono text-gray-500">{stepTarget(block)}</span>
      </summary>
      {block.result && (
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-gray-50 p-2 text-[11px] whitespace-pre-wrap text-gray-600">
          {block.result}
        </pre>
      )}
    </details>
  );
}

type Grouped = { kind: "steps"; steps: Extract<Block, { kind: "tool" }>[] } | { kind: "block"; block: Block };
function groupSteps(blocks: Block[]): Grouped[] {
  const out: Grouped[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.kind === "tool" && last?.kind === "steps") last.steps.push(b);
    else if (b.kind === "tool") out.push({ kind: "steps", steps: [b] });
    else out.push({ kind: "block", block: b });
  }
  return out;
}
const stepTarget = (b: Extract<Block, { kind: "tool" }>) =>
  String(b.input.file_path ?? b.input.path ?? b.input.pattern ?? "")
    .split(/[\\/]/)
    .pop();
function currentStep(blocks: Block[], pick: (v: L) => string): string | null {
  const last = [...blocks].reverse().find((b) => b.kind === "tool");
  if (!last || last.kind !== "tool" || last.ok !== undefined) return null;
  return `${TOOL_LABEL[last.name] ? pick(TOOL_LABEL[last.name]) : last.name} ${stepTarget(last)}`.trim() + "…";
}
function Steps({ steps, live }: { steps: Extract<Block, { kind: "tool" }>[]; live: boolean }) {
  const { pick } = useLang();
  const failed = steps.some((s) => s.ok === false);
  const pending = steps.some((s) => s.ok === undefined);
  const last = steps[steps.length - 1];
  return (
    <details className="rounded-md bg-gray-50 px-2 py-1 text-xs ring-1 ring-gray-100" data-testid="agent-steps">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-gray-600">
        <span className={pending && live ? "animate-pulse text-teal-500" : failed ? "text-red-500" : "text-green-600"}>●</span>
        <span>{pick([`${steps.length} step${steps.length === 1 ? "" : "s"}`, `${steps.length} 個步驟`])}</span>
        <span className="truncate font-mono text-gray-400">
          {TOOL_LABEL[last.name] ? pick(TOOL_LABEL[last.name]) : last.name} {stepTarget(last)}
        </span>
        <span className="ml-auto text-gray-400">▾</span>
      </summary>
      <div className="mt-1 space-y-1 border-t border-gray-200 pt-1">
        {steps.map((b) => (
          <ToolLine key={b.id} block={b} />
        ))}
      </div>
    </details>
  );
}

/** The agent's text: Markdown paragraphs, headings and lists (with $…$ maths and `code`), and ``` code blocks. */
function AnswerText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/```([\w+-]*)[^\n]*\n?([\s\S]*?)(?:```|$(?![\s\S]))/), [text]);
  const out: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i].trim()) out.push(<Prose key={i} text={parts[i]} />);
    if (i + 2 < parts.length)
      out.push(
        <pre key={`c${i}`} className="overflow-x-auto rounded-md bg-gray-50 p-2 font-mono text-[12px] leading-relaxed ring-1 ring-gray-200">
          {parts[i + 2].replace(/\n$/, "")}
        </pre>,
      );
  }
  return <div className="space-y-2 text-gray-800">{out}</div>;
}
function Prose({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    if (!line.trim()) continue;
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h)
      out.push(
        <p key={k} className="font-semibold text-gray-900">
          <RichText text={h[2]} />
        </p>,
      );
    else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      for (; k < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[k]); k++) items.push(lines[k].replace(/^\s*([-*]|\d+\.)\s+/, ""));
      k--;
      out.push(
        <ul key={k} className="list-disc space-y-1 pl-5">
          {items.map((it, ii) => (
            <li key={ii}>
              <RichText text={it} />
            </li>
          ))}
        </ul>,
      );
    } else
      out.push(
        <p key={k}>
          <RichText text={line} />
        </p>,
      );
  }
  return <>{out}</>;
}
