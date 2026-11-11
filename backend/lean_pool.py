"""A pool of warm Lean REPL workers (leanprover-community/repl).

Starting Lean and loading its libraries costs seconds (with Mathlib about 3 s plus several GB of oleans), so each
worker starts once, runs a header command, and then checks many user files against that environment (env 0).

Lifecycle, because elaborating arbitrary user code can leak memory, loop or crash the process:
- a worker serves one request at a time; requests wait for a free worker;
- every request has a hard wall-clock limit: past it the worker is killed (SIGKILL) and replaced;
- a worker is retired after `max_uses` checks and replaced, so memory never builds up;
- a worker that dies (stack overflow, segfault) only loses its own request.

Protocol: one JSON object per command, followed by a blank line; the REPL answers with a JSON object followed by
a blank line.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path


class LeanTimeout(Exception):
    """The check ran past its wall-clock limit (the worker was killed)."""


class LeanCrash(Exception):
    """The worker died or answered something that isn't the REPL protocol."""


@dataclass
class WorkerConfig:
    command: list[str]  # e.g. ["lake", "env", ".lake/packages/REPL/.lake/build/bin/repl"]
    cwd: Path
    header: str = "def _formalizer_ready := 0"  # Lite: core Lean; Full: "import Mathlib"
    start_timeout_s: float = 120.0
    env: dict[str, str] = field(default_factory=dict)


class Worker:
    def __init__(self, config: WorkerConfig):
        self.config = config
        self.proc: asyncio.subprocess.Process | None = None
        self.uses = 0
        self.started = 0.0

    async def start(self) -> None:
        self.proc = await asyncio.create_subprocess_exec(
            *self.config.command,
            cwd=str(self.config.cwd),
            env={**os.environ, **self.config.env},
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
            limit=64 * 1024 * 1024,
        )
        self.started = time.monotonic()
        reply = await self._send({"cmd": self.config.header}, self.config.start_timeout_s)
        if reply.get("env") != 0:
            await self.kill()
            raise LeanCrash(f"the header did not load: {json.dumps(reply)[:500]}")

    async def check(self, code: str, timeout_s: float) -> dict:
        self.uses += 1
        return await self._send({"cmd": code, "env": 0}, timeout_s)

    async def _send(self, request: dict, timeout_s: float) -> dict:
        proc = self.proc
        if proc is None or proc.stdin is None or proc.stdout is None or proc.returncode is not None:
            raise LeanCrash("the Lean worker is not running")
        try:
            proc.stdin.write((json.dumps(request) + "\n\n").encode())
            await proc.stdin.drain()
            return await asyncio.wait_for(self._read_reply(proc.stdout), timeout_s)
        except TimeoutError:
            await self.kill()
            raise LeanTimeout(f"Lean did not finish within {timeout_s:g} s") from None
        except (BrokenPipeError, ConnectionResetError):
            await self.kill()
            raise LeanCrash("the Lean worker stopped") from None

    @staticmethod
    async def _read_reply(stdout: asyncio.StreamReader) -> dict:
        lines: list[str] = []
        while True:
            raw = await stdout.readline()
            if not raw:
                raise LeanCrash("the Lean worker stopped")
            line = raw.decode("utf-8", "replace")
            if line.strip():
                lines.append(line)
            elif lines:  # a blank line ends one reply
                try:
                    return json.loads("".join(lines))
                except json.JSONDecodeError:
                    raise LeanCrash("the Lean worker answered something that isn't JSON") from None

    async def kill(self) -> None:
        proc, self.proc = self.proc, None
        if proc is None:
            return
        if proc.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                proc.kill()
        if proc.stdin is not None:  # also for a worker that already died, so its pipe is closed in time
            proc.stdin.close()
        with contextlib.suppress(Exception):
            await asyncio.wait_for(proc.wait(), 5)

    @property
    def alive(self) -> bool:
        return self.proc is not None and self.proc.returncode is None


class LeanPool:
    """`size` warm workers; `check` borrows one, and the pool keeps the count up after kills and retirements."""

    def __init__(self, config: WorkerConfig, size: int = 2, max_uses: int = 30):
        self.config = config
        self.size = max(1, size)
        self.max_uses = max_uses
        self._free: asyncio.Queue[Worker] = asyncio.Queue()
        self._starting = 0
        self.state = "stopped"  # stopped | warming | ready | failed
        self.error: str | None = None
        self.checks = 0
        self._tasks: set[asyncio.Task] = set()

    async def start(self) -> None:
        self.state = "warming"
        results = await asyncio.gather(*(self._spawn() for _ in range(self.size)), return_exceptions=True)
        errors = [r for r in results if isinstance(r, Exception)]
        if len(errors) == self.size:
            self.state, self.error = "failed", str(errors[0])
        else:
            self.state = "ready"

    async def _spawn(self) -> None:
        self._starting += 1
        try:
            worker = Worker(self.config)
            await worker.start()
            await self._free.put(worker)
        finally:
            self._starting -= 1

    def _replace_later(self) -> None:
        """Start a replacement in the background (the request that lost its worker doesn't wait for it)."""
        task = asyncio.get_running_loop().create_task(self._spawn())
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def check(self, code: str, timeout_s: float = 10.0) -> dict:
        if self.state == "failed":
            raise LeanCrash(self.error or "Lean could not start")
        worker = await self._free.get()
        try:
            reply = await worker.check(code, timeout_s)
        except (LeanTimeout, LeanCrash):
            await worker.kill()
            self._replace_later()
            raise
        self.checks += 1
        if worker.uses >= self.max_uses:  # retire: a fresh worker frees whatever memory this one gathered
            await worker.kill()
            self._replace_later()
        else:
            await self._free.put(worker)
        return reply

    def status(self) -> dict:
        return {"state": self.state, "workers": self._free.qsize(), "starting": self._starting, "checks": self.checks}

    async def close(self) -> None:
        for task in list(self._tasks):
            task.cancel()
        while not self._free.empty():
            await self._free.get_nowait().kill()
        self.state = "stopped"
