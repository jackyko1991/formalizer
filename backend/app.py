"""Formalizer's local runner: checks Lean files for the site, on the user's own computer.

GET  /api/health   runner kind (lite | full), Lean version, pool state (warming | ready | failed)
POST /api/check    {code, theorems, statements} → {verdict, errors, warnings, infos, goals, axioms, ms}
GET|PUT|POST /api/projects…  research projects in ~/Formalizer (see projects.py)
POST /api/jobs     the same check as a detached job (long proofs): GET /api/jobs[/{id}[/events?from=N]], cancel
POST /mcp          the same checks for an AI agent on this computer (MCP; see mcp.py)
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import re
import subprocess
import time
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from .check import axioms_request, decls_request, depgraph_request, imports, summarize, without_imports
from .jobs import JobLimit, JobManager, visitor_hash
from .lean_pool import LeanCrash, LeanPool, LeanTimeout, WorkerConfig
from .mcp import Mcp, local_origin
from .projects import make_router

ROOT = Path(__file__).resolve().parents[1]
LEAN_DIR = Path(os.environ.get("FORMALIZER_LEAN_DIR", ROOT / "lean"))
RUNNER = os.environ.get("FORMALIZER_RUNNER", "lite")  # lite: core Lean; full: Mathlib too
POOL_SIZE = int(os.environ.get("FORMALIZER_WORKERS", "2"))
MAX_USES = int(os.environ.get("FORMALIZER_MAX_USES", "30"))
CHECK_TIMEOUT_S = float(os.environ.get("FORMALIZER_CHECK_TIMEOUT_S", "10"))
# a job may run for days (a long proof); 0 or less = no limit
JOB_TIMEOUT_S = float(os.environ.get("FORMALIZER_JOB_TIMEOUT_S", str(7 * 86400))) or 10**9
REPL = os.environ.get("FORMALIZER_REPL", ".lake/packages/REPL/.lake/build/bin/repl")
# What each runner can import. Lite has only Lean's own libraries.
PROVIDES = {"lite": ("Init", "Std", "Lean"), "full": ("Init", "Std", "Lean", "Mathlib")}
ORIGINS = [
    "https://jackyko1991.github.io",
    *[f"http://localhost:{p}" for p in range(5170, 5200)],
    *[f"http://127.0.0.1:{p}" for p in range(5170, 5200)],
]


def lean_version() -> str:
    try:
        out = subprocess.run(
            ["lean", "--version"], cwd=LEAN_DIR, capture_output=True, text=True, timeout=30, check=False
        )
        return out.stdout.strip().split(",")[0]
    except (OSError, subprocess.SubprocessError):
        return "unknown"


pool = LeanPool(
    WorkerConfig(
        command=["lake", "env", REPL],
        cwd=LEAN_DIR,
        header="import Mathlib\nimport Formalizer.DepGraph" if RUNNER == "full" else "import Formalizer.DepGraph",
    ),
    size=POOL_SIZE,
    max_uses=MAX_USES,
)
# jobs (long checks) have their own workers, started on the first job, so they never hold up the site's quick checks
job_pool = LeanPool(pool.config, size=int(os.environ.get("FORMALIZER_JOB_WORKERS", "1")), max_uses=1)
JOBS = JobManager()


@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.get_running_loop().create_task(pool.start())  # health answers "warming" meanwhile
    yield
    task.cancel()
    for job in list(JOBS.jobs.values()):
        if job.task is not None and not job.task.done():
            job.task.cancel()
    await pool.close()
    await job_pool.close()


app = FastAPI(title="Formalizer runner", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])
app.include_router(make_router(ORIGINS))
VERSION = lean_version()


@app.get("/api/health")
def health() -> dict:
    return {"runner": RUNNER, "lean": VERSION, "provides": PROVIDES[RUNNER], **pool.status(), "error": pool.error}


class CheckRequest(BaseModel):
    code: str = Field(max_length=200_000)
    # theorems whose axioms are reported (a problem's challenge theorems)
    theorems: list[str] = Field(default_factory=list, max_length=20)
    # statements that must appear in the code unchanged (the test may not be edited)
    statements: list[str] = Field(default_factory=list, max_length=20)
    # also list every declaration with its status (the research workspace's blueprint)
    decls: bool = False


_SPACE = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _SPACE.sub(" ", text).strip()


@app.post("/api/check")
async def check(req: CheckRequest) -> dict:
    return await run_check(req, pool, CHECK_TIMEOUT_S)


async def run_check(req: CheckRequest, lean: LeanPool, timeout_s: float) -> dict:
    """The check behind /api/check (quick, the site's pool) and behind jobs (long, the job pool)."""
    for name in req.theorems:
        if not re.fullmatch(r"[A-Za-z_][\w.'₀-₉]*", name):
            raise HTTPException(422, f"not a theorem name: {name!r}")
    wanted = [m for m in imports(req.code) if not m.startswith(PROVIDES[RUNNER])]
    if wanted:
        return {
            "verdict": "needs-runner",
            "errors": [
                {
                    "line": 0,
                    "column": 0,
                    "message": f"this runner ({RUNNER}) can't import {', '.join(wanted)}: start the Full runner",
                }
            ],
            "warnings": [],
            "infos": [],
            "goals": [],
            "graph": None,
            "axioms": {},
            "ms": 0,
        }
    code = _norm(req.code)
    changed = [s for s in req.statements if _norm(s) not in code]
    if changed:
        return {
            "verdict": "error",
            "errors": [
                {
                    "line": 0,
                    "column": 0,
                    "message": "the problem's statement was changed: keep it exactly as given and only replace `sorry`",
                }
            ],
            "warnings": [],
            "infos": [],
            "goals": [],
            "graph": None,
            "axioms": {},
            "ms": 0,
        }
    body = without_imports(req.code)
    started = time.monotonic()
    try:
        reply = await lean.check(
            body + axioms_request(req.theorems) + depgraph_request(req.theorems) + decls_request(req.decls),
            timeout_s,
        )
    except LeanTimeout as e:
        raise HTTPException(408, str(e)) from None
    except LeanCrash as e:
        raise HTTPException(503, str(e)) from None
    result = summarize(reply, len(body.split("\n")), req.theorems, body)
    return {**result, "ms": round((time.monotonic() - started) * 1000)}


mcp = Mcp(check=lambda body: check(CheckRequest(**body)), health=health, version="0.1")


@app.post("/mcp")
async def mcp_post(request: Request) -> Response:
    if not local_origin(request.headers.get("origin")):
        return JSONResponse({"error": "only agents and pages on this computer may use this endpoint"}, 403)
    try:
        message = await request.json()
    except ValueError:
        return JSONResponse({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "parse error"}}, 400)
    if isinstance(message, list):  # a batch (older protocol versions)
        replies = [r for r in [await mcp.reply(m) for m in message] if r is not None]
        return JSONResponse(replies) if replies else Response(status_code=202)
    reply = await mcp.reply(message)
    return JSONResponse(reply) if reply is not None else Response(status_code=202)


@app.get("/mcp")
def mcp_get() -> Response:
    return Response(status_code=405, headers={"Allow": "POST"})  # no server-to-agent stream


class JobRequest(CheckRequest):
    # what the page calls it (a problem or project id), to find the job again after a reload
    label: str = Field(default="", max_length=200)


def _visitor(x_visitor: str | None) -> str:
    if not x_visitor or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", x_visitor):
        raise HTTPException(400, "missing or invalid X-Visitor")
    return visitor_hash(x_visitor)


@app.post("/api/jobs")
async def start_job(req: JobRequest, x_visitor: str | None = Header(default=None)) -> dict:
    visitor = _visitor(x_visitor)

    async def run():
        if job_pool.state in ("stopped", "failed"):
            await job_pool.start()
        try:
            result = await run_check(req, job_pool, JOB_TIMEOUT_S)
        except HTTPException as e:
            raise RuntimeError(str(e.detail)) from None
        yield {"type": "result", "result": result}

    try:
        job = JOBS.start(visitor, "check", req.label, run)
    except JobLimit as e:
        raise HTTPException(503, str(e)) from None
    return job.summary(JOBS.position(job))


@app.get("/api/jobs")
def list_jobs(x_visitor: str | None = Header(default=None)) -> list[dict]:
    return [j.summary(JOBS.position(j)) for j in JOBS.mine(_visitor(x_visitor))]


def _job(job_id: str, x_visitor: str | None):
    job = JOBS.get(job_id, _visitor(x_visitor))
    if job is None:
        raise HTTPException(404, "no such job")
    return job


@app.get("/api/jobs/{job_id}")
def job_info(job_id: str, x_visitor: str | None = Header(default=None)) -> dict:
    job = _job(job_id, x_visitor)
    return job.summary(JOBS.position(job))


@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str, x_visitor: str | None = Header(default=None)) -> dict:
    return {"cancelled": JOBS.cancel(_job(job_id, x_visitor))}


@app.get("/api/jobs/{job_id}/events")
async def job_events(
    job_id: str, x_visitor: str | None = Header(default=None), start: int = Query(0, alias="from")
) -> StreamingResponse:
    """NDJSON: the job's events from number N (?from=N), then live ones until it ends."""
    job = _job(job_id, x_visitor)

    async def lines():
        async for event in JOBS.events(job, start):
            yield json.dumps(event, ensure_ascii=False) + "\n"

    return StreamingResponse(lines(), media_type="application/x-ndjson")
