"""The MCP endpoint of one agent chat (POST /mcp/<token>): the tools a CLI agent (Codex, OpenCode, Gemini) uses on
that chat's working copy, as Tensorizer's session tokens. The token is made when the turn starts, passed only to that
agent process, and revoked when the turn ends.

    check_proof   check the working copy with the runner (the same check as the page; see agent.check_in_session)
    ask_user      put a multiple-choice question in the chat
    list_files    the working copy's .lean files, in check order
    read_file     one of them
    write_file    create or replace one (a file name like Lemmas.lean; no folders)

Tool calls are shown in the chat by the CLI's own event stream, so nothing is mirrored here.
"""

from __future__ import annotations

from typing import Any

from . import agent
from .mcp import Mcp, McpError

TOOLS: list[dict] = [
    {
        "name": "check_proof",
        "description": "Check the Lean files of this chat's working copy with Formalizer's runner, exactly as the page "
        "checks them. Returns the verdict (proved | incomplete | error | needs-runner), errors and open goals with "
        "file:line, the axioms used and, for a project, every declaration's status. Call it after every change.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "ask_user",
        "description": "Ask the user a multiple-choice question in their Formalizer chat when a decision is theirs: "
        "2-4 short options of a few words each (multi=true lets them pick several; they can also type their own). "
        "Then end your turn: the answer arrives as the next message.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "question": {"type": "string"},
                "options": {"type": "array", "items": {"type": "string"}},
                "multi": {"type": "boolean"},
            },
            "required": ["question", "options"],
        },
    },
    {
        "name": "list_files",
        "description": "The .lean files of this chat's working copy, in the order they are checked.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "read_file",
        "description": "Read one .lean file of the working copy (its name, e.g. Proof.lean or Lemmas.lean).",
        "inputSchema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
    },
    {
        "name": "write_file",
        "description": "Create or replace one .lean file of the working copy (a plain name such as Lemmas.lean).",
        "inputSchema": {
            "type": "object",
            "properties": {"path": {"type": "string"}, "content": {"type": "string"}},
            "required": ["path", "content"],
        },
    },
]


class ChatMcp(Mcp):
    """The protocol of mcp.Mcp with this chat's tools; `session` is the chat the token belongs to."""

    def __init__(self, session: agent.Session, version: str):
        super().__init__(check=None, health=dict, version=version, problems={})  # type: ignore[arg-type]
        self.session = session

    async def _call(self, method: str, params: dict) -> dict:
        if method == "initialize":
            reply = await super()._call(method, params)
            reply["instructions"] = (
                "This chat's Lean files on the user's computer. Never change a given theorem statement; replace "
                "`sorry` only. Call check_proof after every change and read the goals it returns."
            )
            return reply
        if method == "tools/list":
            return {"tools": TOOLS}
        if method == "tools/call":
            name, args = params.get("name"), params.get("arguments") or {}
            try:
                text, is_error = await self._chat_tool(name, args)
            except McpError:
                raise
            except Exception as e:  # noqa: BLE001 - a failed tool is a result the agent can read
                text, is_error = f"{type(e).__name__}: {e}", True
            return {"content": [{"type": "text", "text": text}], **({"isError": True} if is_error else {})}
        return await super()._call(method, params)

    async def _chat_tool(self, name: Any, args: dict) -> tuple[str, bool]:
        s = self.session
        if name == "check_proof":
            return await agent.check_in_session(s)
        if name == "ask_user":
            return agent.ask_in_session(s, args.get("question", ""), args.get("options") or [], bool(args.get("multi")))
        if name == "list_files":
            return "\n".join(agent._lean_files(s)) or "(no files)", False
        if name in ("read_file", "write_file"):
            path = str(args.get("path") or "").split("/")[-1]
            if not agent.FILE.fullmatch(path) or (s.kind == "problem" and path != agent.PROBLEM_FILE):
                allowed = agent.PROBLEM_FILE if s.kind == "problem" else "a plain name ending in .lean"
                return f"give a file name of this folder: {allowed}", True
            target = s.workspace / path
            if name == "read_file":
                if not target.is_file():
                    return f"no such file: {path}", True
                return target.read_text(encoding="utf-8", errors="replace"), False
            content = args.get("content")
            if not isinstance(content, str) or len(content) > agent.MAX_FILE:
                return "content must be the whole file as a string (at most 200 000 characters)", True
            target.write_text(content, encoding="utf-8")
            return f"Wrote {path} ({len(content)} characters).", False
        raise McpError(-32602, f"unknown tool {name}")
