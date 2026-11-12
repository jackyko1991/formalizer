"""HTTP routes of the in-page agent (from Tensorizer's routes_agents.py; Formalizer's runner is always local, so
there is no cloud connector).

GET    /api/agents/status                       what the panel can offer (Claude Code here?, API providers, models)
POST   /api/agents/scan                         which agent CLIs are on this computer (only when the user asks)
POST   /api/agents/chat                         one chat turn, detached; streams its events as NDJSON
GET    /api/agents/turns/<id>[/events?from=N]   a turn's state / its events again (after a reload)
POST   /api/agents/turns/<id>/cancel            the Stop button
GET    /api/agents/conversations[?target=]      this browser's chats, newest first (History)
DELETE /api/agents/conversations/<id>
POST   /mcp/<token>                             a running chat's tools for a CLI agent (chat_mcp.py)

The API mode sends the visitor's key in the X-Agent-Key header: passed to that chat's agent process only, never
stored or logged.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from . import agent, turns
from .chat_mcp import ChatMcp
from .jobs import visitor_hash
from .mcp import local_origin

TURNS = turns.TurnManager(
    Path(os.environ.get("FORMALIZER_TURNS", Path.home() / ".cache" / "formalizer" / "turns")).expanduser()
)
_VISITOR = re.compile(r"[A-Za-z0-9_-]{16,128}")


class ChatRequest(BaseModel):
    target: str = Field(max_length=200)  # problem/<id> | project/<id>
    message: str = Field(max_length=8000)
    session: str | None = Field(None, max_length=80)
    model: str | None = Field(None, max_length=100)
    # What is on screen: {files [{name, code}], title, main, statements, next, focus {name, file, status, note},
    # selection {file, from_line, to_line, text}, cursor {file, line}, goals [str], errors [{file, line, message}],
    # lang}
    context: dict | None = None
    agent: str = "claude-code"  # claude-code | codex | opencode | gemini (LOCAL) or claude-api (API)
    provider: str = "anthropic"  # API: anthropic | openrouter
    # the History entry this message continues: kept together even when the agent session has to start again
    conversation: str | None = Field(None, max_length=80)


def make_router(origins: list[str], version: str = "0.1") -> APIRouter:
    router = APIRouter()

    def guard(request: Request) -> None:
        origin = request.headers.get("origin")
        if origin and origin not in origins:
            raise HTTPException(403, "this page may not use the agent")
        if not agent.ENABLED:
            raise HTTPException(403, "the agent is switched off on this runner (FORMALIZER_AGENT=0)")

    def visitor(request: Request) -> str:
        v = (request.headers.get("x-visitor") or "").strip()
        if not _VISITOR.fullmatch(v):
            raise HTTPException(400, "missing or malformed X-Visitor header")
        return visitor_hash(v)

    def own(turn_id: str, request: Request) -> turns.Turn:
        turn = TURNS.get(turn_id, visitor(request))
        if turn is None:  # someone else's turn looks the same as no turn
            raise HTTPException(404, "unknown turn")
        return turn

    def follow(turn: turns.Turn, start: int) -> StreamingResponse:
        async def events():
            async for event in TURNS.events(turn, max(0, start)):
                yield json.dumps(event, ensure_ascii=False) + "\n"

        return StreamingResponse(events(), media_type="application/x-ndjson", headers={"Cache-Control": "no-cache"})

    @router.get("/api/agents/status")
    def agents_status(request: Request) -> dict:
        guard(request)
        return agent.status()

    @router.post("/api/agents/scan")
    async def scan_agents(request: Request) -> dict:
        """Look for agent CLIs on this computer. Only booleans, version numbers and labels come back."""
        guard(request)
        if not agent.LOCAL_ALLOWED:
            raise HTTPException(403, "local agents are switched off on this runner")
        from .agents import scan

        return {"agents": await run_in_threadpool(scan.scan)}

    @router.post("/api/agents/chat")
    async def agents_chat(req: ChatRequest, request: Request) -> StreamingResponse:
        """One chat turn with the chosen agent. It runs detached (turns.py): this response only follows its log, so
        closing or reloading the page does not stop the agent. The first event is {"type": "turn", "id"}."""
        guard(request)
        who = visitor(request)
        try:
            agent.parse_target(req.target)
        except ValueError:
            raise HTTPException(404, "unknown problem or project") from None
        key = request.headers.get("x-agent-key") or None
        message = req.message
        # continuing an earlier chat whose agent session is gone: the new session starts with what was said
        if req.conversation and not agent.known_session(req.session) and (recap := TURNS.recap(who, req.conversation)):
            message = (
                "[This continues an earlier conversation with the user. What was said so far (oldest first, "
                f"possibly shortened):\n{recap}\n]\n\n{req.message}"
            )
        server = request.scope.get("server") or ("127.0.0.1", 8790)
        stream = agent.chat(
            req.session,
            req.target,
            message,
            req.model,
            key,
            req.context,
            req.agent,
            req.provider,
            f"http://127.0.0.1:{server[1]}",
        )
        turn = TURNS.start(who, req.target, req.agent, req.message, stream, req.conversation)
        return follow(turn, 0)

    @router.get("/api/agents/turns/{turn_id}/events")
    async def turn_events(turn_id: str, request: Request, start: int = Query(0, alias="from")) -> StreamingResponse:
        """A turn's events from number ?from=N (each with its "seq"), then live until it ends."""
        return follow(own(turn_id, request), start)

    @router.get("/api/agents/turns/{turn_id}")
    def turn_status(turn_id: str, request: Request) -> dict:
        return own(turn_id, request).summary()

    @router.post("/api/agents/turns/{turn_id}/cancel")
    def turn_cancel(turn_id: str, request: Request) -> dict:
        turn = own(turn_id, request)
        return {"cancelled": TURNS.cancel(turn), **turn.summary()}

    @router.get("/api/agents/conversations")
    def conversations(request: Request, target: str | None = None) -> dict:
        return {"conversations": TURNS.conversations(visitor(request), target)}

    @router.delete("/api/agents/conversations/{conversation_id}")
    def delete_conversation(conversation_id: str, request: Request) -> dict:
        who = visitor(request)
        found = [c for c in TURNS.conversations(who) if c["id"] == conversation_id]
        if not found:
            raise HTTPException(404, "unknown conversation")
        for turn_id in found[0]["turns"]:
            if (turn := TURNS.get(turn_id, who)) is not None:
                TURNS.delete(turn)
        return {"deleted": len(found[0]["turns"])}

    @router.post("/mcp/{token}", include_in_schema=False)
    async def chat_mcp(token: str, request: Request) -> Response:
        if not local_origin(request.headers.get("origin")):
            return JSONResponse({"error": "only agents on this computer may use this endpoint"}, 403)
        s = agent.session_for_token(token)
        if s is None:
            return JSONResponse(
                {"jsonrpc": "2.0", "id": None, "error": {"code": -32001, "message": "unknown or expired chat token"}},
                status_code=401,
            )
        try:
            message = await request.json()
        except ValueError:
            return JSONResponse(
                {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "parse error"}}, 400
            )
        server = ChatMcp(s, version)
        if isinstance(message, list):
            replies = [r for r in [await server.reply(m) for m in message] if r is not None]
            return JSONResponse(replies) if replies else Response(status_code=202)
        reply = await server.reply(message)
        return JSONResponse(reply) if reply is not None else Response(status_code=202)

    @router.get("/mcp/{token}", include_in_schema=False)
    def chat_mcp_get(token: str) -> Response:
        return Response(status_code=405, headers={"Allow": "POST"})

    return router
