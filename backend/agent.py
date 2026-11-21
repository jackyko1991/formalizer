"""The in-page agent: a coding agent working on a scratch copy of one problem or one research project.

Ported from Tensorizer (backend/app/agent.py). Nothing new is built here: the agent loop, tools and context handling
are the agent's own. This module only
  * gives each chat its own working copy (a folder of .lean files: Proof.lean for a problem, the project's files for
    a research project), written from what the page's editor shows at every message,
  * picks the agent (backend/agents/): Claude Code via the Claude Agent SDK, or the Codex / OpenCode / Gemini CLI
    found on this computer; each works only inside that folder and checks its work through one tool, `check_proof`,
    which runs the same Lean check as the page,
  * passes the visitor's API key (Anthropic or OpenRouter) to that chat's agent process only (never stored or
    logged), or lets the agent use this computer's own login (the runner always runs on the user's computer),
  * turns the agent's output into the newline-delimited JSON events the page draws, and after each turn sends the
    files the agent changed (`files`), which the page applies to its editor.

The turn itself runs detached (turns.py), so a reload or a closed tab never stops it.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
import secrets
import shutil
import time
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass, field
from pathlib import Path

from .mcp import LANGS, load_problems

ENABLED = os.environ.get("FORMALIZER_AGENT", "1") == "1"
# The runner runs on the user's computer, so its agents may use this computer's logins; set
# FORMALIZER_AGENT_AUTH=key on a shared machine to allow only the visitor's own API key.
LOCAL_ALLOWED = os.environ.get("FORMALIZER_AGENT_AUTH", "local") == "local"
AGENTS = ("claude-code", "claude-api", "codex", "opencode", "gemini")
LOCAL_CLIS = ("codex", "opencode", "gemini")  # offered only after "Search this computer"
MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"]
# OpenRouter through its Anthropic-compatible endpoint, as documented for Claude Code
OPENROUTER_BASE = "https://openrouter.ai/api"
OPENROUTER_MODELS = ["anthropic/claude-opus-5.5", "anthropic/claude-sonnet-5.5", "anthropic/claude-haiku-5.5"]
PROVIDERS = {"anthropic": MODELS, "openrouter": OPENROUTER_MODELS}
_CLI_MODEL = re.compile(r"^[\w./:~@-]{1,100}$")  # a model name a CLI may get on its command line
MAX_TURNS = int(os.environ.get("FORMALIZER_AGENT_MAX_TURNS", "30"))
IDLE_S = 30 * 60
# A conversation's folder outlives the idle session, so History can continue it (Claude Code resumes a conversation
# only from the folder it started in). Kept KEEP_S after its last use, then deleted.
KEEP_S = float(os.environ.get("FORMALIZER_AGENT_KEEP_S", str(7 * 24 * 3600)))
WORK_ROOT = Path(os.environ.get("FORMALIZER_AGENT_WORK", Path.home() / ".cache" / "formalizer" / "agent")).expanduser()
_active = asyncio.Semaphore(int(os.environ.get("FORMALIZER_AGENT_SESSIONS", "2")))

FILE = re.compile(r"[A-Za-z0-9_][A-Za-z0-9_-]{0,63}\.lean")  # as research projects (projects.py)
PROJECT_ID = re.compile(r"[a-z0-9][a-z0-9-]{0,63}")
THEOREM = re.compile(r"[A-Za-z_][\w.'₀-₉]*")
PROBLEM_FILE = "Proof.lean"
MAX_FILE = 200_000
MAX_FILES = 40

# The Lean check, given by app.py: (code, theorems, statements, decls) → the page's check result.
# Raises TimeoutError when the check takes longer than CHECK_TIMEOUT_S.
Check = Callable[[str, list[str], list[str], bool], Awaitable[dict]]
CHECK: Check | None = None
CHECK_TIMEOUT_S = 60.0
PROBLEMS: dict[str, dict] = load_problems()

SYSTEM = """You are the agent inside Formalizer, a website where mathematics is written as Lean 4 proofs and checked by
Lean on the user's own computer. Your working directory holds the .lean files the user's editor shows right now.

- Explain clearly for a mathematics or computer-science student: the idea in words first, then the Lean. Keep answers
  short and concrete. Write mathematics in Markdown with $…$; write Lean in ```lean blocks.
- When asked to change the proof, edit the files, then call the check_proof tool and read what it returns: the
  verdict, the errors with file:line, and the open goals (⊢ …) at each `sorry`. If it fails, read the error, fix it
  and check again. Don't stack several untested guesses.
- Work like a mathematician: plan on paper, then a skeleton with one `have … := by sorry` per step that checks as
  `incomplete` (never `error`), then replace one `sorry` at a time.
- Never change a theorem statement the problem gives (the check refuses it). Never leave `sorry` or `admit` in a
  finished proof, never add an `axiom`, never use `native_decide`, and don't hide failures with
  `set_option maxHeartbeats 0`. A proof is finished when check_proof says proved and the axioms are among
  propext, Quot.sound and Classical.choice.
- Don't invent lemma names: if Lean says unknown identifier or unknown constant, try `exact?`, `apply?` or `simp?`
  in a check and read the "Try this" it suggests.
- When a choice is really the user's (which of two approaches, how far to change the project), call the ask_user tool
  with the question and 2-4 short options (a few words each) instead of guessing, then end your turn: their answer
  arrives as the next message. Don't ask about things you can decide or check yourself.
- You can only touch the files in this folder. The page applies your edits to its editor after your turn."""

PROBLEM_NOTE = """
This chat is about ONE problem from Formalizer's problem bank. Proof.lean is the file in the user's editor; any other
.lean files are checked before it (the problem's own library, or lemma files the user added). The problem's theorem
statement is the test: it must stay exactly as given; only the proof (`sorry`) changes.
The user is learning. Unless they ask you to write the proof, teach: say what the goal means, suggest the next step
and the tactic to try and why, and let them type it. When they ask for a hint, give a hint, not the proof. When they
ask you to finish or fix it, edit Proof.lean and check it."""

PROJECT_NOTE = """
This chat is about ONE research project: a blueprint of lemmas leading to a main theorem. The .lean files in your
folder are checked together as one Lean file, concatenated in this order: {order} (so a file can use what the files
before it declare; there are no imports between them). A new file you create is checked after the others.
- Keep the blueprint style: each step its own `theorem` (or `def`), stated before it is used. To split a hard lemma,
  add smaller lemmas with `sorry` proofs above it and use them; the page shows each one's status.
- check_proof lists every declaration with its status: proved, sorry (its own proof is open), depends (proved, but
  uses a lemma that is still open), error, or def.
- Statements the user wrote down as fixed (listed below, if any) must stay unchanged."""

LANG_NOTE = {
    "zh-Hant": "Answer in Traditional Chinese (繁體中文, as used in Taiwan); keep Lean code and names as they are."
}


@dataclass
class Session:
    id: str
    target: str  # "problem/<id>" | "project/<id>"
    workspace: Path  # <root>/<id>/work
    order: list[str] = field(default_factory=list)  # the files, in the order they are checked
    statements: list[str] = field(default_factory=list)  # must appear unchanged
    theorems: list[str] = field(default_factory=list)  # whose axioms are reported
    claude_session: str | None = None
    cli_session: str | None = None  # a CLI agent's own session/thread id, to resume the conversation
    cli_agent: str | None = None  # which CLI that id belongs to
    sink: asyncio.Queue | None = None  # while a turn runs: where check_proof and ask_user report to the chat
    last_used: float = field(default_factory=time.monotonic)
    busy: bool = False

    @property
    def kind(self) -> str:
        return self.target.split("/", 1)[0]


_sessions: dict[str, Session] = {}
SESSION_FILE = "session.json"  # in WORK_ROOT/<id>/: what a restarted runner needs to continue the conversation
_PERSISTED = ("order", "statements", "theorems", "claude_session", "cli_session", "cli_agent")


def parse_target(target: str) -> tuple[str, str]:
    """("problem", id) or ("project", id); ValueError when the page sent something else."""
    kind, _, ident = str(target).partition("/")
    if kind == "problem" and ident in PROBLEMS:
        return kind, ident
    if kind == "project" and PROJECT_ID.fullmatch(ident):
        return kind, ident
    raise ValueError(f"unknown target {target!r}")


def _persist(s: Session) -> None:
    data = {"id": s.id, "target": s.target, "workspace": str(s.workspace), **{k: getattr(s, k) for k in _PERSISTED}}
    try:
        (WORK_ROOT / s.id / SESSION_FILE).write_text(json.dumps(data), encoding="utf-8")
    except OSError:
        pass


def _restore(session_id: str) -> Session | None:
    """A session from before a runner restart, if its folder is still there."""
    if not re.fullmatch(r"[0-9a-f]{32}", session_id or ""):
        return None
    try:
        data = json.loads((WORK_ROOT / session_id / SESSION_FILE).read_text(encoding="utf-8"))
        workspace = Path(data["workspace"])
        if data.get("id") != session_id or not workspace.is_dir() or not _inside(str(workspace), WORK_ROOT):
            return None
        s = Session(session_id, str(data["target"]), workspace)
        for k in _PERSISTED:
            if k in data:
                setattr(s, k, data[k])
    except (OSError, ValueError, KeyError, TypeError):
        return None
    _sessions[session_id] = s
    return s


_swept = 0.0


def _cleanup() -> None:
    """Idle sessions leave memory after IDLE_S; their folders stay KEEP_S so History can continue them."""
    global _swept
    now = time.monotonic()
    for sid, s in list(_sessions.items()):
        if not s.busy and now - s.last_used > IDLE_S:
            del _sessions[sid]
    if now - _swept < 3600 and _swept:
        return
    _swept = now
    cutoff = time.time() - KEEP_S
    try:
        folders = [d for d in WORK_ROOT.iterdir() if d.is_dir() and re.fullmatch(r"[0-9a-f]{32}", d.name)]
    except OSError:
        return
    for d in folders:
        marker = d / SESSION_FILE
        try:
            stale = (marker.stat().st_mtime if marker.is_file() else d.stat().st_mtime) < cutoff
        except OSError:
            continue
        if stale and d.name not in _sessions:
            shutil.rmtree(d, ignore_errors=True)


def known_session(session_id: str | None) -> bool:
    """Can the next message continue this conversation's agent session (in memory, or restorable from disk)?"""
    if not session_id or not re.fullmatch(r"[0-9a-f]{32}", session_id):
        return False
    return session_id in _sessions or (WORK_ROOT / session_id / SESSION_FILE).is_file()


def _session(session_id: str | None, target: str) -> Session:
    """The existing session for this target, or a new one with its own working copy."""
    _cleanup()
    s = _sessions.get(session_id or "") or (_restore(session_id) if session_id else None)
    if s is not None and s.target == target:
        return s
    kind, ident = parse_target(target)
    sid = uuid.uuid4().hex
    s = Session(sid, target, WORK_ROOT / sid / "work")
    s.workspace.mkdir(parents=True)
    if kind == "problem":
        p = PROBLEMS[ident]
        (s.workspace / PROBLEM_FILE).write_text(p["start"], encoding="utf-8")
        s.order, s.statements, s.theorems = [PROBLEM_FILE], list(p["statements"]), list(p["theorems"])
    _sessions[sid] = s
    _persist(s)
    return s


# --- the files ------------------------------------------------------------------------------------------------------


def _lean_files(s: Session) -> list[str]:
    """The working copy's files in check order: the page's order, then files the agent added (by name). A problem's
    Proof.lean always comes last: its extra files (a library, the reader's lemmas) are checked before it."""
    present = {p.name for p in s.workspace.glob("*.lean") if p.is_file() and FILE.fullmatch(p.name)}
    names = [n for n in s.order if n in present] + sorted(present - set(s.order))
    if s.kind == "problem":
        names = [n for n in names if n != PROBLEM_FILE] + ([PROBLEM_FILE] if PROBLEM_FILE in present else [])
    return names


def snapshot(s: Session) -> dict[str, str]:
    return {n: (s.workspace / n).read_text(encoding="utf-8", errors="replace") for n in _lean_files(s)}


def join(files: list[tuple[str, str]]) -> tuple[str, Callable[[int], tuple[str, int]]]:
    """One Lean file from several, and line → (file, line in that file); as the page's joinFiles."""
    starts: list[tuple[str, int]] = []
    parts, nxt = [], 1
    for name, code in files:
        text = code if code.endswith("\n") else code + "\n"
        starts.append((name, nxt))
        nxt += text.count("\n")
        parts.append(text)

    def where(line: int) -> tuple[str, int]:
        at = next((st for st in reversed(starts) if st[1] <= line), starts[0] if starts else ("", 1))
        return at[0], line - at[1] + 1

    return "".join(parts), where


def _write_files(s: Session, context: dict) -> None:
    """The editor is the truth: write the page's files into the working copy before the agent sees it."""
    files = context.get("files")
    if not isinstance(files, list):
        return
    clean = [
        (str(f.get("name")), f.get("code"))
        for f in files[:MAX_FILES]
        if isinstance(f, dict) and FILE.fullmatch(str(f.get("name"))) and isinstance(f.get("code"), str)
    ]
    if s.kind == "problem" and PROBLEM_FILE not in dict(clean):
        return  # the page always sends Proof.lean; without it, keep the working copy as it is
    names = [n for n, _ in clean]
    for name, code in clean:
        (s.workspace / name).write_text(code[:MAX_FILE], encoding="utf-8")
    for p in s.workspace.glob("*.lean"):  # a file the user deleted on the page
        if p.name not in names:
            p.unlink(missing_ok=True)
    s.order = names
    if s.kind == "problem":
        return  # a problem's statements and theorems come from the problem bank
    statements = context.get("statements")
    if isinstance(statements, list):
        s.statements = [str(x)[:2000] for x in statements if isinstance(x, str) and x.strip()][:20]
    main = context.get("main")
    s.theorems = [main] if isinstance(main, str) and THEOREM.fullmatch(main) else []


def _with_context(s: Session, message: str, context: dict) -> str:
    """Mirror the user's editor into the working copy and tell the agent what they are looking at."""
    _write_files(s, context)
    notes = []
    kind, ident = parse_target(s.target)
    if kind == "problem":
        p = PROBLEMS[ident]
        notes.append(
            f'The user is working on the problem "{p["title"][0]}" ({ident}, level {p["level"]}). '
            f"Proof.lean is exactly what their editor shows. The statement that must stay unchanged: "
            + "; ".join(f"`{x}`" for x in p["statements"])
        )
        notes.append(f"What the page tells them: {p['summary'][0][:1500]}")
    else:
        title = str(context.get("title") or ident)[:200]
        order = ", ".join(_lean_files(s)) or "(no files yet)"
        notes.append(
            f'The user is working on their research project "{title}". The files in your folder ({order}) are '
            "exactly what their editor holds."
        )
        if s.theorems:
            notes.append(f"The main theorem: `{s.theorems[0]}`.")
        if s.statements:
            notes.append("Statements they fixed (keep them unchanged):\n" + "\n".join(f"- `{x}`" for x in s.statements))
        if isinstance(context.get("next"), str) and context["next"].strip():
            notes.append(f"Their note on what to do next: «{context['next'].strip()[:1000]}»")
    focus = context.get("focus")
    if isinstance(focus, dict) and isinstance(focus.get("name"), str):
        where = f" in {focus['file']}" if isinstance(focus.get("file"), str) else ""
        status = f" (status: {focus['status']})" if isinstance(focus.get("status"), str) else ""
        notes.append(f"They have `{focus['name'][:200]}`{where} open{status}.")
        if isinstance(focus.get("note"), str) and focus["note"].strip():
            notes.append(f"Their note in words for it: «{focus['note'].strip()[:2000]}»")
    sel = context.get("selection")
    if isinstance(sel, dict) and isinstance(sel.get("text"), str) and sel["text"].strip():
        file = sel.get("file") if isinstance(sel.get("file"), str) and FILE.fullmatch(sel["file"]) else PROBLEM_FILE
        lines = f"{sel.get('from_line')}–{sel.get('to_line')}"
        notes.append(f"They highlighted {file} lines {lines}:\n```lean\n{sel['text'][:4000]}\n```")
    cursor = context.get("cursor")
    if isinstance(cursor, dict) and isinstance(cursor.get("line"), int):
        file = cursor.get("file") if isinstance(cursor.get("file"), str) and FILE.fullmatch(cursor["file"]) else None
        notes.append(f"Their cursor is at {file or PROBLEM_FILE} line {cursor['line']}.")
    goals = context.get("goals")
    if isinstance(goals, list) and goals:
        shown = "\n\n".join(str(g)[:1500] for g in goals[:3])
        notes.append(f"The goal view on their screen:\n```\n{shown}\n```")
    errors = context.get("errors")
    if isinstance(errors, list) and errors:
        rows = [
            f"- {e.get('file') or PROBLEM_FILE}:{e.get('line')}: {str(e.get('message', ''))[:400]}"
            for e in errors[:8]
            if isinstance(e, dict)
        ]
        notes.append("Lean's errors on their screen:\n" + "\n".join(rows))
    lang = context.get("lang")
    if lang in LANGS and lang in LANG_NOTE:
        notes.append(LANG_NOTE[lang])
    return "\n".join(f"[{n}]" for n in notes) + ("\n\n" if notes else "") + message


def system_prompt(s: Session) -> str:
    if s.kind == "problem":
        return SYSTEM + PROBLEM_NOTE
    return SYSTEM + PROJECT_NOTE.format(order=", ".join(_lean_files(s)) or "(none yet)")


# --- the tools --------------------------------------------------------------------------------------------------


def _inside(path: str, root: Path) -> bool:
    try:
        return Path(path).resolve().is_relative_to(root.resolve())
    except (OSError, ValueError):
        return False


def report(result: dict, where: Callable[[int], tuple[str, int]]) -> str:
    """A check result as text for the agent: verdict, errors and goals at file:line, axioms, declarations."""

    def at(line: int) -> str:
        if not line:
            return "(whole file)"
        file, n = where(line)
        return f"{file}:{n}"

    out = [f"Verdict: {result.get('verdict')} ({result.get('ms', '?')} ms)"]
    errors = result.get("errors") or []
    if errors:
        out.append("Errors:")
        out += [
            f"- {at(e.get('line', 0))}:{e.get('column', 0)}: {str(e.get('message', ''))[:800]}" for e in errors[:12]
        ]
    goals = result.get("goals") or []
    if goals:
        out.append("Open goals (one per `sorry`):")
        for g in goals[:12]:
            hyps = "\n".join(f"  {h}" for h in g.get("hypotheses") or [])
            case = f" (case {g['case']})" if g.get("case") else ""
            out.append(f"- {at(g.get('line', 0))}{case}:\n{hyps}{chr(10) if hyps else ''}  ⊢ {g.get('target', '')}")
    warnings = result.get("warnings") or []
    if warnings:
        out.append("Warnings:")
        out += [f"- {at(w.get('line', 0))}: {str(w.get('message', ''))[:300]}" for w in warnings[:6]]
    infos = result.get("infos") or []
    if infos:
        out.append("Messages (e.g. Try this from exact?):")
        out += [f"- {at(i.get('line', 0))}: {str(i.get('message', ''))[:600]}" for i in infos[:6]]
    for name, axioms in (result.get("axioms") or {}).items():
        out.append(f"Axioms of {name}: {', '.join(axioms) or 'none'}")
    decls = result.get("decls")
    if decls:
        out.append("Declarations:")
        for d in decls[:80]:
            file, line = where(d.get("line", 0))
            out.append(f"- {d.get('name')} ({d.get('kind')}, {file}:{line}): {d.get('status')}")
    return "\n".join(out)


async def check_in_session(s: Session) -> tuple[str, bool]:
    """The `check_proof` tool, for every agent (in-process for Claude Code, over MCP for the others): check the
    working copy with the runner. Returns (text for the agent, is_error); the chat gets a `check` event."""
    s.last_used = time.monotonic()
    names = _lean_files(s)
    if not names:
        return "There are no .lean files in your folder yet.", True
    code, where = join([(n, (s.workspace / n).read_text(encoding="utf-8", errors="replace")) for n in names])

    async def tell(event: dict) -> None:
        if s.sink is not None:
            await s.sink.put(event)

    if CHECK is None:
        return "The Lean runner is not available.", True
    try:
        result = await CHECK(code, s.theorems, s.statements, s.kind == "project")
    except TimeoutError:
        await tell({"type": "check", "verdict": "timeout", "ok": False})
        slow = (
            f"The check took longer than {int(CHECK_TIMEOUT_S)} s and was stopped. Make the slow step cheaper "
            "(smaller `decide`/`simp` goals), or tell the user to press Run in background on the page, which checks "
            "without a time limit."
        )
        return slow, True
    except Exception as e:  # noqa: BLE001 - the agent reads why the check failed
        await tell({"type": "check", "verdict": "failed", "ok": False, "message": str(e)[:300]})
        return f"The check could not run: {e}", True
    statuses = {}
    for d in result.get("decls") or []:
        statuses[d.get("status")] = statuses.get(d.get("status"), 0) + 1
    await tell(
        {
            "type": "check",
            "verdict": result.get("verdict"),
            "ok": result.get("verdict") == "proved",
            "ms": result.get("ms"),
            "errors": len(result.get("errors") or []),
            "goals": len(result.get("goals") or []),
            **({"decls": statuses} if statuses else {}),
        }
    )
    return report(result, where), False


MAX_QUESTION = 300
MAX_OPTION = 120
ASKED = (
    "The question is now on the user's screen as clickable options (and a box for their own answer). End your turn "
    "now without calling more tools, in at most one short sentence and without listing the options again; their "
    "choice arrives as the next message."
)


def ask_in_session(s: Session, question: str, options: list, multi: bool = False) -> tuple[str, bool]:
    """The `ask_user` tool: put a multiple-choice question in the chat. It doesn't wait: the turn ends and the user's
    click comes back as the next message, so a question survives a reload like the rest of the chat."""
    q = str(question or "").strip()[:MAX_QUESTION]
    opts = [str(o).strip()[:MAX_OPTION] for o in (options if isinstance(options, list) else []) if str(o).strip()]
    opts = list(dict.fromkeys(opts))[:6]
    if not q or len(opts) < 2:
        return "ask_user needs a question and 2 to 6 short, distinct options.", True
    event = {"type": "question", "id": uuid.uuid4().hex[:8], "question": q, "options": opts, "multi": bool(multi)}
    if s.sink is not None:
        s.sink.put_nowait(event)
    return ASKED, False


# --- chat tokens for the CLI agents' MCP endpoint (/mcp/<token>) -------------------------------------------------

_tokens: dict[str, str] = {}  # sha256(token) → session id, while that chat's turn runs


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def session_token(session_id: str) -> str:
    token = "fzs_" + secrets.token_urlsafe(32)
    _tokens[_hash(token)] = session_id
    return token


def revoke(token: str) -> None:
    _tokens.pop(_hash(token), None)


def session_for_token(token: str | None) -> Session | None:
    sid = _tokens.get(_hash(token)) if token else None
    return _sessions.get(sid) if sid else None


# --- one turn ---------------------------------------------------------------------------------------------------


def status() -> dict:
    """What the agent can use on this runner, for the panel. Other local agents are only looked for when the user
    clicks "Search this computer" (POST /api/agents/scan)."""
    local = local_claude()
    return {
        "enabled": ENABLED,
        "agents": [
            {"id": "claude-code", "label": "Claude Code (local)", **local},
            {
                "id": "claude-api",
                "label": "API",
                "available": ENABLED,
                "providers": [
                    {"id": "anthropic", "label": "Anthropic (Claude)", "available": True, "models": MODELS},
                    {"id": "openrouter", "label": "OpenRouter", "available": True, "models": OPENROUTER_MODELS},
                ],
            },
        ],
        "default": "claude-code" if local["available"] and local["logged_in"] is not False else "claude-api",
        "models": MODELS,
        "modes": {"local": ENABLED and LOCAL_ALLOWED, "api": ENABLED},
        "check_timeout_s": CHECK_TIMEOUT_S,
    }


def local_claude() -> dict:
    """Is Claude Code usable here without any setup? The SDK ships the CLI; a login leaves a credentials file."""
    if not (ENABLED and LOCAL_ALLOWED):
        return {"available": False, "logged_in": False}
    from .agents import scan

    return {"available": scan.executable("claude-code") is not None, "logged_in": scan.logged_in("claude-code")}


def _model_for(agent: str, provider: str, model: str | None) -> str | None:
    if agent == "claude-api":
        models = PROVIDERS.get(provider, MODELS)
        return model if model in models else models[0]
    if agent == "claude-code":
        return model if model in MODELS else MODELS[0]
    return model if model and _CLI_MODEL.match(model) else None  # a CLI: its own default unless a name is given


def files_event(s: Session, before: dict[str, str]) -> dict | None:
    """After a turn: the files the agent changed, added or removed, and the check order, for the page to apply."""
    now = snapshot(s)
    changed = {n: text for n, text in now.items() if before.get(n) != text}
    removed = [n for n in before if n not in now]
    if not changed and not removed:
        return None
    return {"type": "files", "target": s.target, "files": changed, "removed": removed, "order": list(now)}


async def chat(
    session_id: str | None,
    target: str,
    message: str,
    model: str | None,
    api_key: str | None,
    context: dict | None = None,
    agent: str = "claude-code",
    provider: str = "anthropic",
    mcp_base: str | None = None,
) -> AsyncIterator[dict]:
    """One user turn. Yields events: session, text, tool, tool_result, check, question, files, done | error.

    agent: "claude-code" (this computer's Claude Code login), "claude-api" (Claude Code with the visitor's key for
    `provider`: anthropic or openrouter), or a local CLI ("codex", "opencode", "gemini"; needs `mcp_base`, the URL
    this runner is reachable at from the same computer, so the CLI can call check_proof over MCP)."""
    from .agents import claude_code, scan

    if agent not in AGENTS:
        agent = "claude-api" if api_key else "claude-code"
    if provider not in PROVIDERS:
        provider = "anthropic"
    if agent != "claude-api" and not LOCAL_ALLOWED:
        yield {"type": "error", "message": "local agents are switched off on this runner; use the API option"}
        return
    if agent == "claude-api" and not api_key:
        name = "OpenRouter" if provider == "openrouter" else "Anthropic"
        yield {"type": "error", "message": f"enter your {name} API key in the agent settings first"}
        return
    exe = scan.executable(agent) if agent in LOCAL_CLIS else None
    if agent in LOCAL_CLIS and (exe is None or not mcp_base):
        yield {
            "type": "error",
            "message": f"{agent} was not found on this computer: search again in the agent settings",
        }
        return
    s = _session(session_id, target)
    if s.busy:
        yield {"type": "error", "message": "this chat is still answering the previous message"}
        return
    message = _with_context(s, message, context or {})
    yield {"type": "session", "id": s.id}
    before = snapshot(s)

    secrets_ = [api_key] if api_key else []
    s.busy = True
    s.sink = asyncio.Queue()
    chosen = _model_for(agent, provider, model)
    try:
        if _active.locked():  # every agent slot is answering: say so instead of waiting silently
            yield {"type": "waiting", "reason": "agents"}
        async with _active:
            if agent in ("claude-code", "claude-api"):
                env = {
                    "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1",
                    "CLAUDE_CONFIG_DIR": str(WORK_ROOT / s.id / ".claude"),
                }
                if agent == "claude-code":
                    env.pop("CLAUDE_CONFIG_DIR")  # this computer's own Claude Code login
                elif provider == "openrouter":
                    env.update(ANTHROPIC_BASE_URL=OPENROUTER_BASE, ANTHROPIC_AUTH_TOKEN=api_key, ANTHROPIC_API_KEY="")
                else:
                    env["ANTHROPIC_API_KEY"] = api_key  # the visitor's key, for this chat's process only
                hint = (
                    " — Claude Code isn't logged in on this computer: run `claude` once and log in, or switch the "
                    "agent to API and enter a key."
                    if agent == "claude-code"
                    else " — check the API key in the agent settings."
                )
                stream = claude_code.run(
                    s,
                    message,
                    model=chosen,
                    env=env,
                    system_prompt=system_prompt(s),
                    max_turns=MAX_TURNS,
                    run_tool=lambda _args: check_in_session(s),
                    sink=s.sink,
                    secrets=secrets_,
                    login_hint=hint,
                )
            else:
                stream = _cli_stream(s, agent, exe, message, chosen, mcp_base)
            delivered = False
            async for event in stream:
                if event["type"] == "done":
                    delivered = True
                    if (files := files_event(s, before)) is not None:
                        yield files
                yield event
            if not delivered and (files := files_event(s, before)) is not None:
                yield files  # ended with an error: what the agent already changed still reaches the page
    finally:
        s.busy = False
        s.sink = None
        s.last_used = time.monotonic()
        _persist(s)


def _cli_stream(s: Session, agent: str, exe: str, message: str, model: str | None, mcp_base: str):
    """A local CLI agent (Codex / OpenCode / Gemini) on the working copy, with check_proof over the chat's MCP."""
    from .agents import cli, codex, gemini, opencode

    if s.cli_agent != agent:  # a different CLI can't resume another one's conversation
        s.cli_session, s.cli_agent = None, agent
    token = session_token(s.id)
    url = f"{mcp_base.rstrip('/')}/mcp/{token}"
    first = s.cli_session is None
    rules = (
        f"{system_prompt(s)}\n\nTo check the proof, call the MCP tool `check_proof` of the `formalizer` server "
        "(shell commands are disabled; its read_file, write_file and list_files tools work on your folder too); to "
        "ask the user a multiple-choice question, call its `ask_user` tool.\n\n---\n\n"
    )
    prompt = (rules if first else "") + message
    ws = str(s.workspace)
    if agent == "codex":
        mapper, argv, env, label = codex.Mapper(), codex.command(exe, ws, model, s.cli_session, url), {}, codex.LABEL
    elif agent == "opencode":
        argv, env = opencode.command(exe, ws, model, s.cli_session), opencode.env(url)
        mapper, label = opencode.Mapper(), opencode.LABEL
    else:
        settings_file = WORK_ROOT / s.id / "gemini-settings.json"  # outside the folder the agent edits
        argv, env = gemini.command(exe, model, not first), gemini.env(settings_file, url)
        mapper, label = gemini.Mapper(), gemini.LABEL

    async def stream():
        try:
            async for event in cli.run(argv, s.workspace, env, prompt, mapper, s.sink, [token], label):
                yield event
        finally:
            s.cli_session = mapper.session or s.cli_session
            revoke(token)

    return stream()
