"""The in-page agent without calling any model: detached turns (a fake agent), the chat's working copy and context,
the check_proof report, the CLI adapters' event mapping, and the chat-scoped MCP endpoint with real Lean checks."""

# ruff: noqa: F811  (sample CLI output lines are kept verbatim; the shared runner fixture)

import asyncio
import json
import sys
import time

import pytest

from backend import agent, routes_agents, turns
from backend.agents import cli, codex, gemini, opencode, scan
from tests.test_runner import client  # noqa: F401

ME = {"X-Visitor": "me-0123456789abcdef"}
OTHER = {"X-Visitor": "other-0123456789abcdef"}
CHAT = {"target": "problem/hello", "message": "explain the goal", "agent": "claude-code"}


class FakeAgent:
    """agent.chat's shape: a session event, some text, then done; a message starting with "hold" waits."""

    def __init__(self):
        self.started = 0
        self.closed = 0
        self.release = None
        self.loop = None

    def chat(self, session_id, target, message, *args, **kwargs):
        fake = self

        async def stream():
            fake.started += 1
            try:
                yield {"type": "session", "id": session_id or "s" * 32}
                for word in ("The ", "goal ", "is 4."):
                    yield {"type": "text", "delta": word}
                if message.startswith("hold"):
                    fake.loop, fake.release = asyncio.get_running_loop(), asyncio.Event()
                    await fake.release.wait()
                yield {"type": "tool", "id": "t1", "name": "mcp__formalizer__check_proof", "input": {}}
                yield {"type": "done", "cost_usd": None}
            finally:
                fake.closed += 1

        return stream()


@pytest.fixture
def fake(monkeypatch, tmp_path):
    f = FakeAgent()
    monkeypatch.setattr(agent, "chat", f.chat)
    monkeypatch.setattr(routes_agents, "TURNS", turns.TurnManager(tmp_path / "turns"))
    return f


@pytest.fixture
def work(monkeypatch, tmp_path):
    monkeypatch.setattr(agent, "WORK_ROOT", tmp_path / "agent")
    agent._sessions.clear()
    yield tmp_path / "agent"
    agent._sessions.clear()


def _until(predicate, timeout=10.0):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return
        time.sleep(0.05)
    raise AssertionError("condition not reached")


def _events(client, turn_id, start=0, headers=ME) -> list[dict]:
    with client.stream("GET", f"/api/agents/turns/{turn_id}/events?from={start}", headers=headers) as r:
        assert r.status_code == 200
        return [json.loads(line) for line in r.iter_lines() if line]


def _start(client, body=CHAT, headers=ME) -> str:
    with client.stream("POST", "/api/agents/chat", json=body, headers=headers) as r:
        assert r.status_code == 200, r.read()
        first = json.loads(next(line for line in r.iter_lines() if line))  # one event, then the page closes
    assert first["type"] == "turn" and first["message"] == body["message"]
    return first["id"]


def _status(client, turn_id, headers=ME):
    return client.get(f"/api/agents/turns/{turn_id}", headers=headers).json()["status"]


# --- detached turns ---------------------------------------------------------------------------------------------


def test_a_turn_keeps_running_after_the_page_closes(client, fake):
    turn_id = _start(client, {**CHAT, "message": "hold on"})
    _until(lambda: fake.release is not None)
    assert _status(client, turn_id) == "running" and fake.closed == 0
    fake.loop.call_soon_threadsafe(fake.release.set)  # the agent finishes while nobody watches
    _until(lambda: _status(client, turn_id) == "done")
    events = _events(client, turn_id)
    assert [e["type"] for e in events] == ["turn", "session", "text", "tool", "done"]
    assert events[2]["delta"] == "The goal is 4."  # deltas merged in the log
    assert [e["seq"] for e in events] == list(range(len(events)))
    assert _events(client, turn_id, start=3) == events[3:]  # after a reload: from where the page was


def test_stop_cancels_the_agent(client, fake):
    turn_id = _start(client, {**CHAT, "message": "hold on"})
    _until(lambda: fake.release is not None)
    assert client.post(f"/api/agents/turns/{turn_id}/cancel", headers=ME).json()["cancelled"] is True
    _until(lambda: _status(client, turn_id) == "cancelled")
    assert fake.closed == 1 and _events(client, turn_id)[-1]["type"] == "error"


def test_conversations_are_grouped_and_private(client, fake):
    first = _start(client)
    _until(lambda: _status(client, first) == "done")
    second = _start(client, {**CHAT, "message": "and then?", "session": "s" * 32})
    _until(lambda: _status(client, second) == "done")
    other = _start(client, {**CHAT, "target": "project/odd-sum-1234", "session": "t" * 32})
    _until(lambda: _status(client, other) == "done")

    convs = client.get("/api/agents/conversations?target=problem/hello", headers=ME).json()["conversations"]
    assert [c["turns"] for c in convs] == [[first, second]] and convs[0]["title"] == "explain the goal"
    assert len(client.get("/api/agents/conversations", headers=ME).json()["conversations"]) == 2
    assert client.get("/api/agents/conversations", headers=OTHER).json()["conversations"] == []
    assert client.get(f"/api/agents/turns/{first}/events", headers=OTHER).status_code == 404
    assert client.post(f"/api/agents/turns/{first}/cancel", headers=OTHER).status_code == 404
    assert client.get("/api/agents/conversations").status_code == 400  # no visitor id
    assert client.delete(f"/api/agents/conversations/{convs[0]['id']}", headers=ME).json() == {"deleted": 2}
    stored = (routes_agents.TURNS.root / other / "turn.json").read_text(encoding="utf-8")
    assert ME["X-Visitor"] not in stored  # only the hash is kept


def test_chat_guards(client, fake):
    assert client.post("/api/agents/chat", json={**CHAT, "target": "problem/nope"}, headers=ME).status_code == 404
    assert client.post("/api/agents/chat", json={**CHAT, "target": "project/../x"}, headers=ME).status_code == 404
    assert client.post("/api/agents/chat", json=CHAT).status_code == 400  # no visitor id
    evil = {**ME, "Origin": "https://evil.example"}
    assert client.post("/api/agents/chat", json=CHAT, headers=evil).status_code == 403
    assert client.get("/api/agents/status").json()["models"] == agent.MODELS


def test_a_restart_marks_running_turns_interrupted(tmp_path):
    root = tmp_path / "turns"

    async def scenario():
        manager = turns.TurnManager(root)
        gate = asyncio.Event()

        async def stream():
            yield {"type": "session", "id": "a" * 32}
            await gate.wait()

        turn = manager.start("v", "problem/hello", "codex", "hi", stream())
        await asyncio.sleep(0.05)
        manager._close_log(turn)  # the process dies here
        return turn.id

    turn_id = asyncio.run(scenario())
    turn = turns.TurnManager(root).turns[turn_id]
    assert turn.status == "interrupted" and turn.session == "a" * 32


# --- the working copy -------------------------------------------------------------------------------------------


def test_a_problem_chat_starts_from_the_problem_and_follows_the_editor(work):
    s = agent._session(None, "problem/hello")
    assert (s.workspace / "Proof.lean").read_text() == agent.PROBLEMS["hello"]["start"]
    assert s.statements == ["theorem hello : 2 + 2 = 4"] and s.theorems == ["hello"]
    edited = "theorem hello : 2 + 2 = 4 := by\n  decide\n"
    msg = agent._with_context(
        s,
        "why?",
        {
            "files": [{"name": "Proof.lean", "code": edited}],
            "selection": {"file": "Proof.lean", "from_line": 2, "to_line": 2, "text": "decide"},
            "lang": "zh-Hant",
        },
    )
    assert (s.workspace / "Proof.lean").read_text() == edited
    assert "Hello, Lean" in msg and "lines 2–2" in msg and "繁體中文" in msg and msg.endswith("why?")
    agent._persist(s)
    agent._sessions.clear()  # the runner restarted
    again = agent._session(s.id, "problem/hello")
    assert again.id == s.id and again.theorems == ["hello"]
    assert agent._session(s.id, "problem/add-comm").id != s.id  # another problem: a new conversation
    assert agent._restore("../etc") is None and not agent.known_session("../x")


def test_a_project_chat_mirrors_files_and_reports_the_agents_edits(work):
    s = agent._session(None, "project/odd-sum-1234")
    files = [
        {"name": "Defs.lean", "code": "def two := 2\n"},
        {"name": "Main.lean", "code": "theorem t : two = 2 := rfl\n"},
    ]
    (s.workspace / "Old.lean").write_text("-- deleted on the page\n")
    agent._with_context(
        s,
        "hi",
        {"files": [*files, {"name": "../x.lean", "code": ""}], "main": "t", "statements": ["theorem t : two = 2"]},
    )
    assert agent._lean_files(s) == ["Defs.lean", "Main.lean"] and s.theorems == ["t"]
    before = agent.snapshot(s)
    (s.workspace / "Main.lean").write_text("theorem t : two = 2 := by rfl\n")
    (s.workspace / "Extra.lean").write_text("theorem e : True := trivial\n")
    (s.workspace / "Defs.lean").unlink()
    event = agent.files_event(s, before)
    assert event["files"] == {
        "Main.lean": "theorem t : two = 2 := by rfl\n",
        "Extra.lean": "theorem e : True := trivial\n",
    }
    assert event["removed"] == ["Defs.lean"] and event["order"] == ["Main.lean", "Extra.lean"]
    assert agent.files_event(s, agent.snapshot(s)) is None


def test_join_and_report_point_at_files():
    code, where = agent.join([("A.lean", "a\nb"), ("B.lean", "c\n")])
    assert code == "a\nb\nc\n" and where(1) == ("A.lean", 1) and where(3) == ("B.lean", 1)
    text = agent.report(
        {
            "verdict": "incomplete",
            "ms": 5,
            "errors": [{"line": 3, "column": 2, "message": "boom"}],
            "goals": [{"line": 2, "hypotheses": ["n : Nat"], "target": "n = n", "case": None}],
            "axioms": {"t": ["propext"]},
            "decls": [{"name": "t", "kind": "theorem", "line": 3, "status": "sorry"}],
        },
        where,
    )
    assert "Verdict: incomplete" in text and "B.lean:1:2: boom" in text and "A.lean:2" in text
    assert "⊢ n = n" in text and "Axioms of t: propext" in text and "t (theorem, B.lean:1): sorry" in text


def test_ask_user_puts_a_question_in_the_chat(tmp_path):
    s = agent.Session("a" * 32, "problem/hello", tmp_path)
    s.sink = asyncio.Queue()
    text, is_error = agent.ask_in_session(s, " Which way? ", ["rfl", "decide", "decide", ""])
    assert not is_error and "End your turn" in text
    event = s.sink.get_nowait()
    assert event["question"] == "Which way?" and event["options"] == ["rfl", "decide"]
    assert agent.ask_in_session(s, "Only one?", ["yes"])[1] is True


# --- real Lean through the agent's tools ---------------------------------------------------------------------------


def test_check_proof_runs_lean_on_the_working_copy(client, work):
    async def scenario():
        s = agent._session(None, "problem/hello")
        s.sink = asyncio.Queue()
        text, is_error = await agent.check_in_session(s)
        assert not is_error and "Verdict: incomplete" in text and "⊢ 2 + 2 = 4" in text
        assert (await s.sink.get())["verdict"] == "incomplete"
        (s.workspace / "Proof.lean").write_text("theorem hello : 2 + 2 = 4 := by\n  rfl\n")
        text, _ = await agent.check_in_session(s)
        assert "Verdict: proved" in text and (await s.sink.get())["ok"] is True
        (s.workspace / "Proof.lean").write_text("theorem hello : 2 + 2 = 5 := by\n  rfl\n")
        text, _ = await agent.check_in_session(s)
        assert "Verdict: error" in text and "statement was changed" in text

        p = agent._session(None, "project/demo-0001")
        agent._with_context(
            p,
            "",
            {
                "files": [
                    {"name": "Lemmas.lean", "code": "theorem step (n : Nat) : n + 0 = n := by\n  sorry\n"},
                    {"name": "Main.lean", "code": "theorem main_t (n : Nat) : n + 0 = n := step n\n"},
                ],
                "main": "main_t",
            },
        )
        text, _ = await agent.check_in_session(p)
        assert "step (theorem, Lemmas.lean:1): sorry" in text and "main_t (theorem, Main.lean:1): depends" in text

    # the runner's pool lives on the TestClient's loop: run there
    client.portal.call(scenario)


def test_chat_mcp_needs_a_live_token_and_checks_the_chats_files(client, work):
    s = agent._session(None, "problem/hello")
    rpc = lambda method, params=None, token=None: client.post(
        f"/mcp/{token}", json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    )
    assert rpc("tools/list", token="nope").status_code == 401
    token = agent.session_token(s.id)
    tools = [t["name"] for t in rpc("tools/list", token=token).json()["result"]["tools"]]
    assert tools == ["check_proof", "ask_user", "list_files", "read_file", "write_file"]
    call = lambda name, **args: rpc("tools/call", {"name": name, "arguments": args}, token).json()["result"]
    assert call("list_files")["content"][0]["text"] == "Proof.lean"
    assert call("read_file", path="../../etc/passwd").get("isError") is True
    assert call("write_file", path="sub/x.txt", content="x").get("isError") is True
    assert call("write_file", path="Proof.lean", content="theorem hello : 2 + 2 = 4 := by\n  decide\n")["content"]
    assert "Verdict: proved" in call("check_proof")["content"][0]["text"]
    assert client.post(f"/mcp/{token}", json={}, headers={"Origin": "https://evil.example"}).status_code == 403
    agent.revoke(token)
    assert rpc("tools/list", token=token).status_code == 401


# --- the CLI adapters (sample output, as in Tensorizer) -------------------------------------------------------------


def _map(mapper, sample: str) -> list[dict]:
    return [e for line in sample.strip().splitlines() for e in mapper(json.loads(line))]


CODEX_SAMPLE = """
{"type":"thread.started","thread_id":"0199a213"}
{"type":"item.completed","item":{"id":"item_4","type":"file_change","changes":[{"path":"Proof.lean","kind":"update"}],"status":"completed"}}
{"type":"item.started","item":{"id":"item_5","type":"mcp_tool_call","server":"formalizer","tool":"check_proof","arguments":{},"status":"in_progress"}}
{"type":"item.completed","item":{"id":"item_5","type":"mcp_tool_call","server":"formalizer","tool":"check_proof","arguments":{},"result":{"content":[{"type":"text","text":"Verdict: proved"}]},"status":"completed"}}
{"type":"item.completed","item":{"id":"item_3","type":"agent_message","text":"Done."}}
"""


def test_codex_maps_events_and_reaches_formalizer_over_mcp():
    m = codex.Mapper()
    assert _map(m, CODEX_SAMPLE) == [
        {"type": "tool", "id": "item_4", "name": "Edit", "input": {"file_path": "Proof.lean"}},
        {"type": "tool_result", "id": "item_4", "ok": True, "text": ""},
        {"type": "tool", "id": "item_5", "name": "mcp__formalizer__check_proof", "input": {}},
        {"type": "tool_result", "id": "item_5", "ok": True, "text": "Verdict: proved"},
        {"type": "text", "delta": "Done."},
    ]
    assert m.session == "0199a213"
    argv = codex.command("codex", "/ws", None, None, "http://127.0.0.1:8790/mcp/tok")
    assert 'mcp_servers.formalizer.url="http://127.0.0.1:8790/mcp/tok"' in argv and "features.shell_tool=false" in argv


def test_opencode_and_gemini_name_the_formalizer_server(tmp_path):
    config = json.loads(opencode.env("http://x/mcp/t")["OPENCODE_CONFIG_CONTENT"])
    assert config["mcp"]["formalizer"]["url"] == "http://x/mcp/t" and config["permission"]["bash"] == "deny"
    gemini.env(tmp_path / "s.json", "http://x/mcp/t")
    assert json.loads((tmp_path / "s.json").read_text())["mcpServers"]["formalizer"]["httpUrl"] == "http://x/mcp/t"
    m = gemini.Mapper()
    assert (
        m({"type": "tool_use", "tool_name": "check_proof", "tool_id": "r", "parameters": {}})[0]["name"] == cli.RUN_TOOL
    )


def test_a_cli_runs_in_the_workspace_with_the_prompt_on_stdin(tmp_path):
    script = (
        "import json, os, sys; p = sys.stdin.read(); "
        "print(json.dumps({'type': 'init', 'session_id': 's9'})); "
        "print(json.dumps({'type': 'message', 'role': 'assistant', 'content': p + ' @ ' + os.getcwd()})); "
        "print('secret-token', file=sys.stderr); sys.exit(int(p == 'fail'))"
    )

    async def go(prompt):
        mapper = gemini.Mapper()
        out = [
            e
            async for e in cli.run(
                [sys.executable, "-c", script], tmp_path, {}, prompt, mapper, asyncio.Queue(), ["secret-token"]
            )
        ]
        return mapper, out

    mapper, events = asyncio.run(go("héllo"))
    assert mapper.session == "s9" and events[-1]["type"] == "done"
    _, events = asyncio.run(go("fail"))
    assert events[-1]["type"] == "error" and "secret-token" not in events[-1]["message"]


def test_scan_returns_booleans_and_versions_only(monkeypatch, tmp_path):
    fake = str(tmp_path / "secret-dir" / "bin")
    monkeypatch.setattr(scan.shutil, "which", lambda name: f"{fake}/{name}" if name == "codex" else None)
    monkeypatch.setattr(scan, "_bundled_claude", lambda: None)

    class Done:
        stdout = f"codex-cli 0.98.1 (installed at {fake})\n"
        stderr = ""

    monkeypatch.setattr(scan.subprocess, "run", lambda *a, **k: Done())
    result = scan.scan()
    assert "secret-dir" not in json.dumps(result)
    by_id = {a["id"]: a for a in result}
    assert by_id["codex"]["version"] == "0.98.1" and not by_id["claude-code"]["installed"]


def test_a_problems_extra_files_are_checked_before_proof_lean(work):
    s = agent._session(None, "problem/hello")
    files = [
        {"name": "Proof.lean", "code": "theorem hello : 2 + 2 = 4 := by\n  sorry\n"},
        {"name": "Lemmas.lean", "code": "-- mine\n"},
    ]
    agent._with_context(s, "hi", {"files": files, "statements": ["ignored"]})
    assert agent._lean_files(s) == ["Lemmas.lean", "Proof.lean"] and s.statements == ["theorem hello : 2 + 2 = 4"]
    (s.workspace / "More.lean").write_text("-- the agent's\n")
    assert agent._lean_files(s) == ["Lemmas.lean", "More.lean", "Proof.lean"]
    agent._with_context(s, "hi", {"files": [{"name": "Lemmas.lean", "code": ""}]})  # no Proof.lean: left as it was
    assert (s.workspace / "Proof.lean").is_file() and (s.workspace / "More.lean").is_file()
