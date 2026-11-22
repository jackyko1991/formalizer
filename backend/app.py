"""Formalizer's local runner: checks Lean files for the site, on the user's own computer.

GET  /api/health   runner kind (lite | full), Lean version, pool state (warming | ready | failed)
POST /api/check    {code, theorems, statements, checkers?, challenge?} → {verdict, errors, warnings, infos, goals, axioms,
                   ms, checks}: checks = one {id, verdict, message, ms} per checker asked (see checkers.py)
GET|PUT|POST /api/projects…  research projects in ~/Formalizer (see projects.py)
POST /api/jobs     the same check as a detached job (long proofs): GET /api/jobs[/{id}[/events?from=N]], cancel
POST /mcp          the same checks for an AI agent on this computer (MCP; see mcp.py)
/api/agents/…      the in-page agent: detached chat turns on a scratch copy (see routes_agents.py, agent.py)
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from . import agent, checkers
from .check import axioms_request, decls_request, depgraph_request, imports, summarize, without_imports
from .jobs import JobLimit, JobManager, visitor_hash
from .lean_pool import LeanCrash, LeanPool, LeanTimeout, WorkerConfig
from .mcp import Mcp, local_origin
from .projects import make_router
from .routes_agents import TURNS
from .routes_agents import make_router as agents_router

ROOT = Path(__file__).resolve().parents[1]
LEAN_DIR = Path(os.environ.get("FORMALIZER_LEAN_DIR", ROOT / "lean"))
RUNNER = os.environ.get("FORMALIZER_RUNNER", "lite")  # lite: core Lean; full: Mathlib too
POOL_SIZE = int(os.environ.get("FORMALIZER_WORKERS", "2"))
MAX_USES = int(os.environ.get("FORMALIZER_MAX_USES", "30"))
CHECK_TIMEOUT_S = float(os.environ.get("FORMALIZER_CHECK_TIMEOUT_S", "10"))
# a job may run for days (a long proof); 0 or less = no limit
# the in-page agent's checks share the site's pool, with a longer limit than a quick check
AGENT_CHECK_TIMEOUT_S = float(os.environ.get("FORMALIZER_AGENT_CHECK_TIMEOUT_S", "60"))
JOB_TIMEOUT_S = float(os.environ.get("FORMALIZER_JOB_TIMEOUT_S", str(7 * 86400))) or 10**9
# absolute: `lake env` on Windows does not find a relative path (and needs the .exe)
REPL = os.environ.get(
    "FORMALIZER_REPL",
    (LEAN_DIR / ".lake/packages/REPL/.lake/build/bin/repl").as_posix() + (".exe" if os.name == "nt" else ""),
)
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
    for item in [*JOBS.jobs.values(), *TURNS.turns.values()]:
        if item.task is not None and not item.task.done():
            item.task.cancel()
    await pool.close()
    await job_pool.close()


app = FastAPI(title="Formalizer runner", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])
app.include_router(make_router(ORIGINS))
VERSION = lean_version()
app.include_router(agents_router(ORIGINS, VERSION))


@app.get("/api/health")
def health() -> dict:
    return {
        "runner": RUNNER,
        "lean": VERSION,
        "provides": PROVIDES[RUNNER],
        **pool.status(),
        "error": pool.error,
        "os": sys.platform,
        "checkers": checkers.status(RUNNER),
    }


class CheckRequest(BaseModel):
    code: str = Field(max_length=200_000)
    # theorems whose axioms are reported (a problem's challenge theorems)
    theorems: list[str] = Field(default_factory=list, max_length=20)
    # statements that must appear in the code unchanged (the test may not be edited)
    statements: list[str] = Field(default_factory=list, max_length=20)
    # also list every declaration with its status (the research workspace's blueprint)
    decls: bool = False
    # the checkers to run (checkers.py; none named: checkers.DEFAULT); each answers in `checks`
    checkers: list[str] | None = Field(default=None, max_length=10)
    # the problem's starting file, with `sorry` (statement-match and comparator compare against it)
    challenge: str | None = Field(default=None, max_length=200_000)


_SPACE = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _SPACE.sub(" ", text).strip()


@app.post("/api/check")
async def check(req: CheckRequest) -> dict:
    return await run_check(req, pool, CHECK_TIMEOUT_S)


def _early(verdict: str, message: str) -> dict:
    """A result Lean never saw (needs another runner, or the statement was changed)."""
    return {
        "verdict": verdict,
        "errors": [{"line": 0, "column": 0, "message": message}],
        "warnings": [],
        "infos": [],
        "goals": [],
        "graph": None,
        "axioms": {},
        "ms": 0,
    }


# statement-match's fingerprints of a challenge, by (runner, challenge, theorems): a problem's challenge never changes
_CHALLENGES: dict[tuple, dict] = {}


async def _challenge_fingerprints(lean: LeanPool, challenge: str, names: list[str], timeout_s: float) -> dict | str:
    """The challenge's fingerprints, or why there are none (a message)."""
    key = (RUNNER, challenge, tuple(names))
    if key in _CHALLENGES:
        return _CHALLENGES[key]
    wanted = [m for m in imports(challenge) if not m.startswith(PROVIDES[RUNNER])]
    if wanted:
        return f"the challenge imports {', '.join(wanted)}: this runner ({RUNNER}) can't"
    command, nonce = checkers.fingerprint_command(names)
    reply = await lean.check(without_imports(challenge), timeout_s, then=command)
    errors = [str(m.get("data", ""))[:200] for m in reply.get("messages", []) if m.get("severity") == "error"]
    if errors:
        return f"the challenge does not compile on its own: {errors[0]}"
    found = checkers.parse_fingerprints(reply.get("then"), nonce)
    if len(_CHALLENGES) > 200:
        _CHALLENGES.pop(next(iter(_CHALLENGES)))
    _CHALLENGES[key] = found
    return found


async def run_check(req: CheckRequest, lean: LeanPool, timeout_s: float) -> dict:
    """The check behind /api/check (quick, the site's pool) and behind jobs (long, the job pool), with the checkers
    asked for (checkers.py) in `checks`."""
    for name in req.theorems:
        if not re.fullmatch(r"[A-Za-z_][\w.'₀-₉]*", name):
            raise HTTPException(422, f"not a theorem name: {name!r}")
    try:
        asked = checkers.resolve(req.checkers)
    except ValueError as e:
        raise HTTPException(422, str(e)) from None
    checks: dict[str, dict] = {}
    if "static" in asked:
        checks["static"] = checkers.static_scan(req.code, req.statements, req.challenge)
    in_lean = [c for c in asked if c != "static"]

    def done(result: dict) -> dict:
        return {**result, "checks": [checks[c] for c in asked]}

    wanted = [m for m in imports(req.code) if not m.startswith(PROVIDES[RUNNER])]
    if wanted:
        message = f"this runner ({RUNNER}) can't import {', '.join(wanted)}: start the Full runner"
        checks.update({c: checkers.result(c, "unavailable", message) for c in in_lean})
        return done(_early("needs-runner", message))
    code = _norm(req.code)
    changed = [s for s in req.statements if _norm(s) not in code]
    if changed:
        message = "the problem's statement was changed: keep it exactly as given and only replace `sorry`"
        checks.update({c: checkers.result(c, "unavailable", "not run: the statement was changed") for c in in_lean})
        if "kernel+axioms" in checks:
            checks["kernel+axioms"] = checkers.result("kernel+axioms", "fail", message)
        return done(_early("error", message))

    names = req.theorems or checkers.statement_names(req.statements)
    command = nonce = None
    if "statement-match" in asked:
        if names:
            command, nonce = checkers.fingerprint_command(names)
        else:
            checks["statement-match"] = checkers.result("statement-match", "unavailable", "no theorem to compare")
    challenge = req.challenge or (checkers.challenge_from_statements(req.statements) if req.statements else None)
    if command and not challenge:
        checks["statement-match"] = checkers.result("statement-match", "unavailable", "no statement or challenge file")
        command = None
    programs = [c for c in asked if c in ("leanchecker", *checkers.FULL)]

    body = without_imports(req.code)
    started = time.monotonic()
    main = asyncio.ensure_future(
        lean.check(
            body + axioms_request(req.theorems) + depgraph_request(req.theorems) + decls_request(req.decls),
            timeout_s,
            then=command,
        )
    )
    side = asyncio.ensure_future(_challenge_fingerprints(lean, challenge, names, timeout_s)) if command else None
    external = asyncio.ensure_future(
        checkers.run_programs(programs, req.code, req.challenge, names, LEAN_DIR, timeout_s=checkers.EXTERNAL_TIMEOUT_S)
    )
    try:
        reply = await main
    except (LeanTimeout, LeanCrash) as e:
        for task in (side, external):
            if task is not None:
                task.cancel()
        raise HTTPException(408 if isinstance(e, LeanTimeout) else 503, str(e)) from None
    ms = (time.monotonic() - started) * 1000
    then = reply.pop("then", None)
    result = summarize(reply, len(body.split("\n")), req.theorems, body)
    if "kernel+axioms" in asked:
        checks["kernel+axioms"] = checkers.kernel_axioms(result, ms)
    if side is not None:
        try:
            theirs = await side
        except (LeanTimeout, LeanCrash) as e:
            theirs = f"the challenge could not be checked: {e}"
        side_ms = (time.monotonic() - started) * 1000
        if isinstance(theirs, str):
            if not req.challenge:
                theirs += " (send the problem's starting file as `challenge`)"
            checks["statement-match"] = checkers.result("statement-match", "unavailable", theirs, side_ms)
        else:
            mine = checkers.parse_fingerprints(then, nonce or "")
            checks["statement-match"] = checkers.compare_fingerprints(theirs, mine, names, side_ms)
    for r in await external:
        checks[r["id"]] = r
    return done({**result, "ms": round(ms)})


async def agent_check(code: str, theorems: list[str], statements: list[str], decls: bool) -> dict:
    """check_proof for the in-page agent (agent.CHECK): TimeoutError past AGENT_CHECK_TIMEOUT_S."""
    try:
        req = CheckRequest(code=code, theorems=theorems, statements=statements, decls=decls)
        return await run_check(req, pool, AGENT_CHECK_TIMEOUT_S)
    except HTTPException as e:
        if e.status_code == 408:
            raise TimeoutError(str(e.detail)) from None
        raise RuntimeError(str(e.detail)) from None
    except ValueError as e:  # pydantic: the files are too large
        raise RuntimeError(str(e)[:300]) from None


agent.CHECK, agent.CHECK_TIMEOUT_S = agent_check, AGENT_CHECK_TIMEOUT_S

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
