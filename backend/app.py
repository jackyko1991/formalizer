"""Formalizer's local runner: checks Lean files for the site, on the user's own computer.

GET  /api/health   runner kind (lite | full), Lean version, pool state (warming | ready | failed)
POST /api/check    {code, theorems, statements} → {verdict, errors, warnings, goals, axioms, ms}
"""

from __future__ import annotations

import asyncio
import contextlib
import os
import re
import subprocess
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .check import axioms_request, imports, summarize, without_imports
from .lean_pool import LeanCrash, LeanPool, LeanTimeout, WorkerConfig

ROOT = Path(__file__).resolve().parents[1]
LEAN_DIR = Path(os.environ.get("FORMALIZER_LEAN_DIR", ROOT / "lean"))
RUNNER = os.environ.get("FORMALIZER_RUNNER", "lite")  # lite: core Lean; full: Mathlib too
POOL_SIZE = int(os.environ.get("FORMALIZER_WORKERS", "2"))
MAX_USES = int(os.environ.get("FORMALIZER_MAX_USES", "30"))
CHECK_TIMEOUT_S = float(os.environ.get("FORMALIZER_CHECK_TIMEOUT_S", "10"))
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
        header="import Mathlib" if RUNNER == "full" else "def _formalizer_ready := 0",
    ),
    size=POOL_SIZE,
    max_uses=MAX_USES,
)


@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.get_running_loop().create_task(pool.start())  # health answers "warming" meanwhile
    yield
    task.cancel()
    await pool.close()


app = FastAPI(title="Formalizer runner", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])
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


_SPACE = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _SPACE.sub(" ", text).strip()


@app.post("/api/check")
async def check(req: CheckRequest) -> dict:
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
            "goals": [],
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
            "goals": [],
            "axioms": {},
            "ms": 0,
        }
    body = without_imports(req.code)
    started = time.monotonic()
    try:
        reply = await pool.check(body + axioms_request(req.theorems), CHECK_TIMEOUT_S)
    except LeanTimeout as e:
        raise HTTPException(408, str(e)) from None
    except LeanCrash as e:
        raise HTTPException(503, str(e)) from None
    result = summarize(reply, len(body.split("\n")), req.theorems)
    return {**result, "ms": round((time.monotonic() - started) * 1000)}
