"""Research projects on the user's disk: ~/Formalizer/<project>/ holds plain .lean files (the working copy, which the
site autosaves) and formalizer.json (file order, notes, the next-step note, the graph layout). The free tier's one
saved version lives in <project>/.saved/ next to it; restoring swaps the two, so a restore can itself be undone.

    GET  /api/projects                  [{id, title, updated, saved}]
    GET  /api/projects/{id}             {id, files: [{name, code}], meta, saved: {label, at, summary} | null}
    PUT  /api/projects/{id}             {files, meta}           write the working copy
    POST /api/projects/{id}/save        {label, summary}        working copy → the saved version (replaces it)
    POST /api/projects/{id}/restore     {summary}?              swap the saved version and the working copy
    GET  /api/projects/{id}/saved       the saved version's files and meta (to compare before replacing it)

Everything stays on this computer. Requests from web pages of other sites are refused (Origin check); file names are
plain `Name.lean`, so nothing is written outside the project folder.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

ID = re.compile(r"[a-z0-9][a-z0-9-]{0,63}")
FILE = re.compile(r"[A-Za-z0-9_][A-Za-z0-9_-]{0,63}\.lean")
META = "formalizer.json"
SAVED = ".saved"
MAX_BYTES = 2_000_000


def root() -> Path:
    return Path(os.environ.get("FORMALIZER_PROJECTS", Path.home() / "Formalizer")).expanduser()


class LeanFile(BaseModel):
    name: str
    code: str


class Project(BaseModel):
    files: list[LeanFile] = Field(max_length=50)
    meta: dict = Field(default_factory=dict)


class SaveVersion(BaseModel):
    label: str = Field(default="", max_length=200)
    summary: dict = Field(default_factory=dict)


def folder(pid: str) -> Path:
    if not ID.fullmatch(pid):
        raise HTTPException(422, f"not a project id: {pid!r}")
    return root() / pid


def read(path: Path) -> dict | None:
    """A project folder (working copy or saved version) as {files, meta}, files in the order meta lists them."""
    if not path.is_dir():
        return None
    meta = {}
    if (path / META).exists():
        try:
            meta = json.loads((path / META).read_text(encoding="utf-8"))
        except ValueError:
            meta = {}
    present = {f.name: f for f in path.glob("*.lean") if FILE.fullmatch(f.name)}
    order = [n for n in meta.get("order", []) if n in present] + sorted(
        n for n in present if n not in meta.get("order", [])
    )
    return {"files": [{"name": n, "code": present[n].read_text(encoding="utf-8")} for n in order], "meta": meta}


def write(path: Path, project: Project) -> None:
    names = [f.name for f in project.files]
    bad = [n for n in names if not FILE.fullmatch(n)]
    if bad or len(set(names)) != len(names):
        raise HTTPException(422, f"file names must be distinct and like Name.lean: {bad or names}")
    if sum(len(f.code.encode()) for f in project.files) > MAX_BYTES:
        raise HTTPException(413, "project too large")
    path.mkdir(parents=True, exist_ok=True)
    for f in project.files:
        _atomic(path / f.name, f.code)
    for old in path.glob("*.lean"):
        if old.name not in names:
            old.unlink()
    _atomic(
        path / META, json.dumps({**project.meta, "order": names, "updated": time.time()}, ensure_ascii=False, indent=1)
    )


def _atomic(path: Path, text: str) -> None:
    tmp = path.with_name(f".{path.name}.tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(path)


def saved_info(path: Path) -> dict | None:
    info = path / SAVED / "saved.json"
    if not info.exists():
        return None
    try:
        return json.loads(info.read_text(encoding="utf-8"))
    except ValueError:
        return None


def make_router(origins: list[str]) -> APIRouter:
    router = APIRouter()

    def guard(request: Request) -> None:
        origin = request.headers.get("origin")
        if origin and origin not in origins:
            raise HTTPException(403, "only Formalizer's pages and programs on this computer may use projects")

    @router.get("/api/projects")
    def list_projects(request: Request) -> list[dict]:
        guard(request)
        out = []
        if root().is_dir():
            for p in sorted(root().iterdir()):
                if p.is_dir() and ID.fullmatch(p.name):
                    got = read(p) or {"meta": {}}
                    meta = got["meta"]
                    out.append(
                        {
                            "id": p.name,
                            "title": meta.get("title", p.name),
                            "updated": meta.get("updated"),
                            "saved": saved_info(p),
                        }
                    )
        return out

    @router.get("/api/projects/{pid}")
    def load(pid: str, request: Request) -> dict:
        guard(request)
        path = folder(pid)
        got = read(path)
        if got is None:
            raise HTTPException(404, f"no project {pid}")
        return {"id": pid, **got, "saved": saved_info(path), "folder": str(path)}

    @router.put("/api/projects/{pid}")
    def save_working(pid: str, project: Project, request: Request) -> dict:
        guard(request)
        write(folder(pid), project)
        return {"ok": True, "folder": str(folder(pid))}

    @router.get("/api/projects/{pid}/saved")
    def load_saved(pid: str, request: Request) -> dict:
        guard(request)
        got = read(folder(pid) / SAVED)
        if got is None:
            raise HTTPException(404, "no saved version")
        return {**got, "saved": saved_info(folder(pid))}

    @router.post("/api/projects/{pid}/save")
    def save_version(pid: str, body: SaveVersion, request: Request) -> dict:
        guard(request)
        path = folder(pid)
        if read(path) is None:
            raise HTTPException(404, f"no project {pid}")
        tmp = path / ".saved.tmp"
        shutil.rmtree(tmp, ignore_errors=True)
        tmp.mkdir()
        for f in [*path.glob("*.lean"), path / META]:
            if f.exists():
                shutil.copy2(f, tmp / f.name)
        info = {"label": body.label, "summary": body.summary, "at": time.time()}
        (tmp / "saved.json").write_text(json.dumps(info, ensure_ascii=False), encoding="utf-8")
        shutil.rmtree(path / SAVED, ignore_errors=True)
        tmp.rename(path / SAVED)
        return info

    @router.post("/api/projects/{pid}/restore")
    def restore(pid: str, request: Request, body: SaveVersion | None = None) -> dict:
        """Swap: the saved version becomes the working copy, and the working copy becomes the saved version."""
        guard(request)
        path = folder(pid)
        saved = read(path / SAVED)
        info = saved_info(path)
        current = read(path)
        if saved is None or current is None:
            raise HTTPException(404, "nothing to restore")
        write(path, Project(files=[LeanFile(**f) for f in saved["files"]], meta=saved["meta"]))
        old = path / ".swap.tmp"
        shutil.rmtree(old, ignore_errors=True)
        write(old, Project(files=[LeanFile(**f) for f in current["files"]], meta=current["meta"]))
        now = {"label": "before restore", "summary": body.summary if body else {}, "at": time.time()}
        (old / "saved.json").write_text(json.dumps(now, ensure_ascii=False), encoding="utf-8")
        shutil.rmtree(path / SAVED, ignore_errors=True)
        old.rename(path / SAVED)
        return {"restored": info, "saved": now}

    return router
