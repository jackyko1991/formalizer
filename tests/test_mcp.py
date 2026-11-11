"""The runner's MCP endpoint: the protocol without Lean (a stub check), then one real check with Lean."""

import asyncio

from fastapi.testclient import TestClient

from backend.mcp import TOOLS, Mcp, load_problems, local_origin
from tests.test_runner import REPL, client  # noqa: F401 (the shared runner fixture)

PROBLEMS = load_problems()


def call(server: Mcp, method: str, params: dict | None = None, mid: int = 1) -> dict:
    return asyncio.run(server.reply({"jsonrpc": "2.0", "id": mid, "method": method, "params": params or {}}))


async def fake_check(body: dict) -> dict:
    return {"verdict": "incomplete", "body": body, "infos": ["raw"]}


STUB = Mcp(check=fake_check, health=lambda: {"runner": "lite", "state": "ready"}, version="test")


def test_initialize_and_tools():
    init = call(STUB, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {}})["result"]
    assert init["protocolVersion"] == "2025-03-26" and "tools" in init["capabilities"]
    assert call(STUB, "initialize", {"protocolVersion": "1999-01-01"})["result"]["protocolVersion"] == "2025-06-18"
    names = [t["name"] for t in call(STUB, "tools/list")["result"]["tools"]]
    assert names == ["runner_status", "list_problems", "get_problem", "check_proof"] == [t["name"] for t in TOOLS]
    assert asyncio.run(STUB.reply({"jsonrpc": "2.0", "method": "notifications/initialized"})) is None
    assert call(STUB, "nope")["error"]["code"] == -32601


def tool(name: str, **args) -> dict:
    return call(STUB, "tools/call", {"name": name, "arguments": args})["result"]


def test_problems_never_include_the_solution():
    import json

    listed = json.loads(tool("list_problems", topic="tutorial")["content"][0]["text"])
    assert {p["id"] for p in listed} == {p["id"] for p in PROBLEMS.values() if p["topic"] == "tutorial"}
    for pid in PROBLEMS:
        got = json.loads(tool("get_problem", id=pid, lang="zh-Hant")["content"][0]["text"])
        assert "solution" not in got and "steps" not in got and got["start"] == PROBLEMS[pid]["start"]
        assert got["title"] == PROBLEMS[pid]["title"][1]
    assert tool("get_problem", id="nope")["isError"]


def test_check_proof_uses_the_problem_statement():
    import json

    out = json.loads(tool("check_proof", code="x", problem_id="hello")["content"][0]["text"])
    assert out["body"]["statements"] == PROBLEMS["hello"]["statements"] and "infos" not in out


def test_origin():
    assert local_origin(None) and local_origin("http://localhost:5181") and local_origin("http://[::1]:5181")
    assert not local_origin("https://evil.example") and not local_origin("http://localhost.evil.example")


def test_http_endpoint_without_lean():
    from backend.app import app

    c = TestClient(app)  # no `with`: the Lean pool is not started
    msg = {"jsonrpc": "2.0", "id": 7, "method": "ping"}
    assert c.post("/mcp", json=msg).json() == {"jsonrpc": "2.0", "id": 7, "result": {}}
    assert c.post("/mcp", json={"jsonrpc": "2.0", "method": "notifications/initialized"}).status_code == 202
    assert c.post("/mcp", json=msg, headers={"origin": "https://evil.example"}).status_code == 403
    assert c.get("/mcp").status_code == 405


def test_real_check_through_mcp(client):  # noqa: F811
    import json

    import pytest

    if not REPL.exists():
        pytest.skip("needs the built REPL")
    params = {"name": "check_proof", "arguments": {"code": PROBLEMS["hello"]["solution"], "problem_id": "hello"}}
    r = client.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": params}).json()
    out = json.loads(r["result"]["content"][0]["text"])
    assert out["verdict"] == "proved" and out["axioms"] == {"hello": []}
