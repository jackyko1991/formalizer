"""Detached jobs: Lean checks that keep going after the page is closed or reloaded, and can be watched again later.
Ported from Tensorizer (tensorizer_physics/jobs.py): the same append-only event log, ownership by visitor hash,
replay-then-follow, and restart handling.

    job = JOBS.start(visitor, "check", label, run)     # run: async iterator of events, started in the background
    async for event in JOBS.events(job, start=0): ...  # replay from event N, then follow live
    JOBS.cancel(job)

Each job lives in <root>/<id>/: job.json (status, times, result summary) and events.ndjson (one event per line, each
with its `seq`): queued {position}, running, result {result}, error {message}. Jobs wait their turn for the job
workers (FORMALIZER_JOB_WORKERS, default 1), separate from the site's quick checks, so a proof that runs for days never
blocks them.

Ownership: the browser keeps a random visitor id and sends it as X-Visitor; only its hash is stored, and a visitor
sees only their own jobs. A runner restart marks jobs that were queued or running as failed ("runner restarted").
Finished jobs are deleted FORMALIZER_JOB_TTL_S after they end (default 7 days; 0 = kept).
"""

from __future__ import annotations

import asyncio
import contextlib
import hashlib
import json
import os
import secrets
import shutil
import time
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from pathlib import Path

ACTIVE = ("queued", "running")
FINISHED = ("done", "failed", "cancelled")
RECORD = ("id", "visitor", "kind", "label", "status", "created", "started", "finished", "error", "result", "events")
QUEUE_MAX = int(os.environ.get("FORMALIZER_QUEUE_MAX", "20"))
JOB_TTL_S = float(os.environ.get("FORMALIZER_JOB_TTL_S", str(7 * 86400)))


def visitor_hash(visitor: str) -> str:
    """What is stored for a visitor id (never the id itself)."""
    return hashlib.sha256(f"formalizer-visitor:{visitor}".encode()).hexdigest()[:32]


def default_root() -> Path:
    return Path(os.environ.get("FORMALIZER_JOBS", Path.home() / ".cache" / "formalizer" / "jobs")).expanduser()


class JobLimit(Exception):
    """The queue is full (→ HTTP 503)."""


@dataclass(eq=False)
class Job:
    id: str
    visitor: str
    kind: str
    label: str = ""  # the page's name for what is checked (a problem id, a project id)
    status: str = "queued"
    created: float = field(default_factory=time.time)
    started: float | None = None
    finished: float | None = None
    error: str | None = None
    result: dict | None = None  # a summary: {"verdict", "ms"}
    events: int = 0
    # in memory only
    task: asyncio.Task | None = None
    cancel_requested: bool = False
    _wake: asyncio.Event | None = None
    _log: object = None

    def summary(self, position: int | None = None) -> dict:
        end = self.finished or time.time()
        return {
            "id": self.id,
            "kind": self.kind,
            "label": self.label,
            "status": self.status,
            "created": self.created,
            "started": self.started,
            "finished": self.finished,
            "elapsed": round(end - self.created, 1),
            "position": position,
            "events": self.events,
            "error": self.error,
            "result": self.result,
        }

    def record(self) -> dict:
        return {k: getattr(self, k) for k in RECORD}


Run = Callable[[], AsyncIterator[dict]]


class JobManager:
    def __init__(self, root: Path | None = None, workers: int | None = None):
        self.root = root or default_root()
        self.jobs: dict[str, Job] = {}
        self.workers = workers or int(os.environ.get("FORMALIZER_JOB_WORKERS", "1"))
        self._slots: asyncio.Semaphore | None = None
        self._load()

    # --- storage

    def _dir(self, job: Job) -> Path:
        return self.root / job.id

    def _save(self, job: Job) -> None:
        d = self._dir(job)
        d.mkdir(parents=True, exist_ok=True)
        tmp = d / "job.json.tmp"
        tmp.write_text(json.dumps(job.record()), encoding="utf-8")
        tmp.replace(d / "job.json")

    def _load(self) -> None:
        """Read every job from disk; ones that were queued or running when the runner stopped have failed."""
        if not self.root.is_dir():
            return
        for d in self.root.iterdir():
            try:
                rec = json.loads((d / "job.json").read_text(encoding="utf-8"))
                job = Job(**{k: rec[k] for k in RECORD if k in rec})
            except (OSError, ValueError, TypeError, KeyError):
                shutil.rmtree(d, ignore_errors=True)  # a half-written job folder
                continue
            job.events = _count_lines(d / "events.ndjson")
            if job.status not in FINISHED:
                job.status, job.error, job.finished = "failed", "runner restarted", time.time()
                self._append(job, {"type": "error", "message": "runner restarted"})
                self._close_log(job)
                self._save(job)
            self.jobs[job.id] = job

    def _append(self, job: Job, event: dict) -> None:
        if job._log is None:
            self._dir(job).mkdir(parents=True, exist_ok=True)
            job._log = open(self._dir(job) / "events.ndjson", "a", encoding="utf-8")  # noqa: SIM115
        job._log.write(json.dumps({**event, "seq": job.events}, ensure_ascii=False) + "\n")
        job._log.flush()
        job.events += 1
        self._wake(job)

    @staticmethod
    def _wake(job: Job) -> None:
        """Wake every follower: each waits on the event it saw before reading, so none misses an append."""
        if job._wake is not None:
            old, job._wake = job._wake, asyncio.Event()
            old.set()

    @staticmethod
    def _close_log(job: Job) -> None:
        if job._log is not None:
            job._log.close()
            job._log = None

    # --- lifecycle

    def start(self, visitor: str, kind: str, label: str, run: Run) -> Job:
        """Create a job and start it on the running event loop; raises JobLimit before anything starts."""
        self.prune()
        if sum(j.status == "queued" for j in self.jobs.values()) >= QUEUE_MAX:
            raise JobLimit("the queue is full: wait for a job to finish")
        if self._slots is None:
            self._slots = asyncio.Semaphore(self.workers)
        job = Job(secrets.token_hex(8), visitor, kind, label[:200])
        job._wake = asyncio.Event()
        self.jobs[job.id] = job
        self._save(job)
        self._append(job, {"type": "queued", "position": self.position(job)})
        job.task = asyncio.get_running_loop().create_task(self._run(job, run))
        return job

    def position(self, job: Job) -> int | None:
        """Place in the line (1 = next), while queued."""
        if job.status != "queued":
            return None
        waiting = sorted((j for j in self.jobs.values() if j.status == "queued"), key=lambda j: j.created)
        return waiting.index(job) + 1

    async def _run(self, job: Job, run: Run) -> None:
        try:
            async with self._slots:
                job.status, job.started = "running", time.time()
                self._save(job)
                self._append(job, {"type": "running"})
                async for event in run():
                    if event.get("type") == "result":
                        res = event.get("result") or {}
                        job.result = {"verdict": res.get("verdict"), "ms": res.get("ms")}
                    self._append(job, event)
            if job.result is None:
                raise RuntimeError("the job produced no result")
            self._end(job, "done", None)
        except asyncio.CancelledError:  # cancel(), or the runner shutting down
            message = "cancelled" if job.cancel_requested else "runner stopped"
            self._append(job, {"type": "error", "message": message})
            self._end(job, "cancelled" if job.cancel_requested else "failed", message)
        except Exception as e:  # noqa: BLE001 - a job must always end with a status
            self._append(job, {"type": "error", "message": str(e) or type(e).__name__})
            self._end(job, "failed", str(e) or type(e).__name__)

    def _end(self, job: Job, status: str, error: str | None) -> None:
        job.status, job.error, job.finished = status, error, time.time()
        self._close_log(job)
        self._save(job)
        self._wake(job)

    def cancel(self, job: Job) -> bool:
        """Stop a queued or running job (its Lean worker is killed); False when it had already ended."""
        if job.status not in ACTIVE:
            return False
        job.cancel_requested = True
        if job.task is not None and not job.task.done():
            job.task.cancel()
        return True

    # --- reading

    def get(self, job_id: str, visitor: str) -> Job | None:
        job = self.jobs.get(job_id)
        return job if job is not None and job.visitor == visitor else None  # someone else's: as if missing

    def mine(self, visitor: str) -> list[Job]:
        self.prune()
        return sorted((j for j in self.jobs.values() if j.visitor == visitor), key=lambda j: -j.created)

    async def events(self, job: Job, start: int = 0, poll_s: float = 5.0) -> AsyncIterator[dict]:
        """The job's events from number `start`, then new ones as they come, until the job has ended."""
        path = self._dir(job) / "events.ndjson"
        index, offset, buffer = 0, 0, b""
        while True:
            wake = job._wake
            ended = job.status in FINISHED  # read before the file, so the last events are never missed
            if path.is_file():
                with open(path, "rb") as f:  # noqa: ASYNC230 - a small append-only log, read in pieces
                    f.seek(offset)
                    chunk = f.read()
                offset += len(chunk)
                buffer += chunk
                *lines, buffer = buffer.split(b"\n")
                for line in lines:
                    if index >= start and line:
                        yield json.loads(line)
                    index += 1
            if ended or wake is None:
                return
            with contextlib.suppress(TimeoutError):
                await asyncio.wait_for(wake.wait(), poll_s)

    def prune(self, now: float | None = None) -> int:
        """Delete jobs that ended more than JOB_TTL_S ago; returns how many."""
        if not JOB_TTL_S:
            return 0
        now = time.time() if now is None else now
        old = [j for j in self.jobs.values() if j.status in FINISHED and j.finished and now - j.finished > JOB_TTL_S]
        for job in old:
            self.jobs.pop(job.id, None)
            self._close_log(job)
            shutil.rmtree(self._dir(job), ignore_errors=True)
        return len(old)


def _count_lines(path: Path) -> int:
    try:
        with open(path, "rb") as f:
            return sum(1 for line in f if line.strip())
    except OSError:
        return 0
