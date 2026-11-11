"""The REPL pool's lifecycle, with a fake REPL: timeouts kill, crashes recover, workers retire."""

import asyncio
import sys
from pathlib import Path

import pytest

from backend.lean_pool import LeanCrash, LeanPool, LeanTimeout, WorkerConfig

FAKE = [sys.executable, str(Path(__file__).with_name("fake_repl.py"))]


def pool(size=1, max_uses=30, header="ready"):
    return LeanPool(WorkerConfig(command=FAKE, cwd=Path("."), header=header, start_timeout_s=10), size, max_uses)


def run(coro):
    return asyncio.run(coro)


def test_a_warm_pool_answers_and_reports_ready():
    async def scenario():
        p = pool(size=2)
        await p.start()
        assert p.status()["state"] == "ready" and p.status()["workers"] == 2
        assert (await p.check("x"))["env"] == 1  # env 0 is the header
        await p.close()

    run(scenario())


def test_a_timeout_kills_the_worker_and_a_new_one_takes_its_place():
    async def scenario():
        p = pool()
        await p.start()
        first = (await p.check("PID"))["pid"]
        with pytest.raises(LeanTimeout):
            await p.check("SLEEP", timeout_s=0.5)
        for _ in range(50):  # the replacement warms in the background
            if p.status()["workers"] == 1:
                break
            await asyncio.sleep(0.1)
        second = (await p.check("PID"))["pid"]
        assert second != first
        await p.close()

    run(scenario())


def test_a_crash_loses_only_that_request():
    async def scenario():
        p = pool()
        await p.start()
        with pytest.raises(LeanCrash):
            await p.check("CRASH")
        assert (await p.check("x"))["env"] == 1  # a fresh worker
        await p.close()

    run(scenario())


def test_workers_retire_after_max_uses():
    async def scenario():
        p = pool(max_uses=2)
        await p.start()
        pids = [(await p.check("PID"))["pid"] for _ in range(4)]
        assert pids[0] == pids[1] and pids[2] == pids[3] and pids[1] != pids[2]
        assert p.status()["checks"] == 4
        await p.close()

    run(scenario())


def test_a_header_that_fails_marks_the_pool_failed():
    async def scenario():
        p = pool(header="CRASH")
        await p.start()
        assert p.status()["state"] == "failed"
        with pytest.raises(LeanCrash):
            await p.check("x")

    run(scenario())
