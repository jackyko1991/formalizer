"""Detached jobs: the manager on its own (replay, cancel, ownership, restart), then real Lean jobs over HTTP."""

import asyncio
import json
import time

from backend.jobs import JobManager
from tests.test_runner import client  # noqa: F401 (the shared runner fixture)

VISITOR = "test-visitor-0123456789"


def collect(manager, job, start=0):
    async def go():
        return [e async for e in manager.events(job, start, poll_s=0.05)]

    return go()


def test_manager_replay_cancel_restart_and_ownership(tmp_path):
    async def scenario():
        m = JobManager(tmp_path, workers=1)

        async def quick():
            yield {"type": "result", "result": {"verdict": "proved", "ms": 3}}

        async def forever():
            await asyncio.sleep(3600)
            yield {"type": "result", "result": {}}

        a = m.start("me", "check", "hello", quick)
        b = m.start("me", "check", "long", forever)
        c = m.start("me", "check", "waits", quick)  # behind b: one worker
        events = await collect(m, a)
        assert [e["type"] for e in events] == ["queued", "running", "result"] and a.status == "done"
        assert [e["seq"] for e in events] == [0, 1, 2]
        await asyncio.sleep(0.05)
        assert b.status == "running" and c.status == "queued" and m.position(c) == 1
        assert m.cancel(b)
        assert [e["type"] for e in await collect(m, b)][-1] == "error" and b.status == "cancelled"
        await collect(m, c)
        assert c.status == "done"
        assert [e["type"] for e in await collect(m, a, start=2)] == ["result"]  # replay from N
        assert m.get(a.id, "someone else") is None and [j.id for j in m.mine("me")] == [c.id, b.id, a.id]
        # a runner restart: a job that was running is failed, its log kept
        d = m.start("me", "check", "cut", forever)
        await asyncio.sleep(0.05)
        d.task.cancel()  # as at shutdown, but the record is rewritten as if it never ended
        await asyncio.sleep(0.05)
        rec = json.loads((tmp_path / d.id / "job.json").read_text())
        rec["status"] = "running"
        (tmp_path / d.id / "job.json").write_text(json.dumps(rec))
        again = JobManager(tmp_path)
        assert again.jobs[d.id].status == "failed" and again.jobs[d.id].error == "runner restarted"
        assert again.jobs[a.id].status == "done"

    asyncio.run(scenario())


def test_lean_job_over_http(client, tmp_path, monkeypatch):  # noqa: F811
    from backend import app as runner

    monkeypatch.setattr(runner, "JOBS", JobManager(tmp_path))
    h = {"X-Visitor": VISITOR}
    assert client.post("/api/jobs", json={"code": "x"}).status_code == 400  # no visitor
    body = {"code": "theorem hello : 2 + 2 = 4 := by\n  rfl\n", "theorems": ["hello"], "label": "hello"}
    job = client.post("/api/jobs", json=body, headers=h).json()
    assert job["status"] in ("queued", "running") and job["label"] == "hello"
    lines = client.get(f"/api/jobs/{job['id']}/events?from=0", headers=h).text.splitlines()
    events = [json.loads(x) for x in lines]
    assert events[-1]["type"] == "result" and events[-1]["result"]["verdict"] == "proved"
    # after a "reload": the job is listed, and its log replays from any point
    listed = client.get("/api/jobs", headers=h).json()
    assert listed[0]["id"] == job["id"] and listed[0]["result"]["verdict"] == "proved"
    assert [
        json.loads(x)["type"] for x in client.get(f"/api/jobs/{job['id']}/events?from=2", headers=h).text.splitlines()
    ] == ["result"]
    assert client.get(f"/api/jobs/{job['id']}", headers={"X-Visitor": "another-visitor-0123456"}).status_code == 404


def test_long_lean_job_can_be_stopped(client, tmp_path, monkeypatch):  # noqa: F811
    from backend import app as runner

    monkeypatch.setattr(runner, "JOBS", JobManager(tmp_path))
    h = {"X-Visitor": VISITOR}
    job = client.post("/api/jobs", json={"code": "#eval IO.sleep 600000\n", "label": "slow"}, headers=h).json()
    for _ in range(100):
        if client.get(f"/api/jobs/{job['id']}", headers=h).json()["status"] == "running":
            break
        time.sleep(0.1)
    assert client.post(f"/api/jobs/{job['id']}/cancel", headers=h).json() == {"cancelled": True}
    for _ in range(50):
        info = client.get(f"/api/jobs/{job['id']}", headers=h).json()
        if info["status"] == "cancelled":
            break
        time.sleep(0.1)
    assert info["status"] == "cancelled"
    # the job workers recover: the next job still runs
    again = client.post("/api/jobs", json={"code": "theorem t : True := trivial\n", "label": "t"}, headers=h).json()
    events = [json.loads(x) for x in client.get(f"/api/jobs/{again['id']}/events", headers=h).text.splitlines()]
    assert events[-1]["type"] == "result" and events[-1]["result"]["verdict"] == "proved"
