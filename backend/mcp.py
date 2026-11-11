"""Formalizer's MCP server, served by the local runner at POST /mcp (MCP "streamable HTTP", JSON replies only).

An AI coding agent on the same computer connects with one URL (http://localhost:8790/mcp) and gets four tools:

    runner_status   which runner is up (lite | full), the Lean version, whether the pool is ready
    list_problems   the problem bank: id, topic, level, title
    get_problem     one problem's statement, starting file and hint (never the reference solution)
    check_proof     check Lean code with the same rules as the site: statement unchanged, no sorry, axioms listed

The protocol part is small on purpose (initialize, ping, tools/list, tools/call): no sessions, no streaming, no
resources. Nothing here leaves the computer; requests from web pages on other sites are refused (Origin check).
"""

from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

PROTOCOLS = ("2025-06-18", "2025-03-26", "2024-11-05")
PROBLEMS_DIR = Path(__file__).resolve().parents[1] / "problems"
LANGS = ("en", "zh-Hant")

Check = Callable[[dict], Awaitable[dict]]
Health = Callable[[], dict]


def load_problems(folder: Path = PROBLEMS_DIR) -> dict[str, dict]:
    """Every problem by id, with its topic (the file it comes from)."""
    out: dict[str, dict] = {}
    for f in sorted(folder.glob("*.json")):
        if f.stem == "collections":
            continue
        for p in json.loads(f.read_text(encoding="utf-8")):
            out[p["id"]] = {**p, "topic": f.stem}
    return out


def _text(value: Any, lang: str) -> Any:
    """A [en, zh-Hant] pair in the asked language; anything else as it is."""
    if isinstance(value, list) and len(value) == len(LANGS) and all(isinstance(v, str) for v in value):
        return value[LANGS.index(lang)]
    return value


TOOLS: list[dict] = [
    {
        "name": "runner_status",
        "description": "Which Formalizer runner is running (lite: core Lean; full: with Mathlib), its Lean version, "
        "and whether it is ready to check proofs.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_problems",
        "description": "The Formalizer problem bank: id, topic, level (L1 one step, L2 a few steps, L3 induction or "
        "longer) and title of every problem.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "only this topic, e.g. tutorial, geometry, linear-algebra"},
                "lang": {"type": "string", "enum": list(LANGS), "default": "en"},
            },
        },
    },
    {
        "name": "get_problem",
        "description": "One problem: its statement (the test, which must stay unchanged), the starting Lean file "
        "with `sorry` where the proof goes, a hint, and tactics worth trying. The reference solution is not given.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "lang": {"type": "string", "enum": list(LANGS), "default": "en"},
            },
            "required": ["id"],
        },
    },
    {
        "name": "check_proof",
        "description": "Check Lean 4 code with the local runner. With problem_id, the problem's statement must appear "
        "unchanged and its theorems' axioms are reported. The verdict is proved (no sorry, no errors), incomplete "
        "(a sorry is left; the open goals are listed), error, or needs-runner (imports this runner lacks, e.g. "
        "Mathlib on the Lite runner). Accept a proof only when the verdict is proved and the axioms are among "
        "propext, Quot.sound and Classical.choice.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "the whole Lean file"},
                "problem_id": {"type": "string"},
                "theorems": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "theorems whose axioms to report (without problem_id)",
                },
            },
            "required": ["code"],
        },
    },
]


class McpError(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code


class Mcp:
    """The JSON-RPC side of the server; the runner passes in its check and health functions."""

    def __init__(self, check: Check, health: Health, version: str, problems: dict[str, dict] | None = None):
        self.check = check
        self.health = health
        self.version = version
        self.problems = load_problems() if problems is None else problems

    async def reply(self, message: Any) -> dict | None:
        """The answer to one JSON-RPC message, or None for a notification or a response."""
        if not isinstance(message, dict) or message.get("jsonrpc") != "2.0":
            return _error(None, -32600, "not a JSON-RPC 2.0 message")
        if "method" not in message:
            return None  # a response to something we never ask
        mid = message.get("id")
        if mid is None:
            return None  # notifications (initialized, cancelled) need no answer
        try:
            result = await self._call(message["method"], message.get("params") or {})
        except McpError as e:
            return _error(mid, e.code, str(e))
        return {"jsonrpc": "2.0", "id": mid, "result": result}

    async def _call(self, method: str, params: dict) -> dict:
        if method == "initialize":
            asked = params.get("protocolVersion")
            return {
                "protocolVersion": asked if asked in PROTOCOLS else PROTOCOLS[0],
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "formalizer", "title": "Formalizer", "version": self.version},
                "instructions": "Lean 4 problems checked on this computer. Never change a problem's statement; "
                "replace `sorry` only. Call check_proof after every change and read the goals it returns.",
            }
        if method == "ping":
            return {}
        if method == "tools/list":
            return {"tools": TOOLS}
        if method == "tools/call":
            name, args = params.get("name"), params.get("arguments") or {}
            try:
                data = await self._tool(name, args)
            except McpError:
                raise
            except Exception as e:  # noqa: BLE001 — a failed tool is a tool result the agent can read, not a protocol error
                return {"content": [{"type": "text", "text": f"{type(e).__name__}: {e}"}], "isError": True}
            return {"content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False, indent=1)}]}
        raise McpError(-32601, f"unknown method {method}")

    async def _tool(self, name: str, args: dict) -> Any:
        lang = args.get("lang", "en")
        if lang not in LANGS:
            lang = "en"
        if name == "runner_status":
            return self.health()
        if name == "list_problems":
            topic = args.get("topic")
            return [
                {"id": p["id"], "topic": p["topic"], "level": p["level"], "title": _text(p["title"], lang)}
                for p in self.problems.values()
                if not topic or p["topic"] == topic
            ]
        if name == "get_problem":
            p = self._problem(args.get("id"))
            return {
                "id": p["id"],
                "topic": p["topic"],
                "level": p["level"],
                "runner": p["runner"],
                "title": _text(p["title"], lang),
                "summary": _text(p["summary"], lang),
                "statements": p["statements"],
                "start": p["start"],
                "hint": _text(p["hint"], lang),
                "tactics_to_try": p["tactics"],
            }
        if name == "check_proof":
            code = args.get("code")
            if not isinstance(code, str):
                raise ValueError("code must be the Lean file as a string")
            body: dict = {"code": code, "theorems": list(args.get("theorems") or [])}
            if args.get("problem_id"):
                p = self._problem(args["problem_id"])
                body["theorems"], body["statements"] = p["theorems"], p["statements"]
            result = await self.check(body)
            result.pop("infos", None)  # the dependency graph's raw output; `graph` has it parsed
            return result
        raise McpError(-32602, f"unknown tool {name}")

    def _problem(self, pid: Any) -> dict:
        if pid not in self.problems:
            raise ValueError(f"no problem {pid!r}; list_problems gives the ids")
        return self.problems[pid]


def _error(mid: Any, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": mid, "error": {"code": code, "message": message}}


def local_origin(origin: str | None) -> bool:
    """Agents send no Origin; a browser does. Only pages on this computer may call the MCP endpoint."""
    if not origin:
        return True
    host = origin.split("://", 1)[-1].split("/", 1)[0]
    host = host[: host.index("]") + 1] if host.startswith("[") else host.split(":", 1)[0]
    return host in ("localhost", "127.0.0.1", "[::1]")
