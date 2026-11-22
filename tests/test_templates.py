"""The research demos (frontend/src/research/templates.ts) on the Lite runner: as shipped, the lemmas are open and the
main theorem waits on them; with the template's own proofs filled in (its showcase), the main theorem is proved with
standard axioms only. So every demo is finishable without Mathlib, and every showcase is really finished."""

# ruff: noqa: F811  (the shared runner fixture)

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from tests.test_runner import client  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]


def templates() -> list[dict]:
    node = shutil.which("node")
    if node is None:
        pytest.skip("node is needed to read templates.ts")
    script = (
        "import('./frontend/src/research/templates.ts').then(m => console.log(JSON.stringify("
        "m.TEMPLATES.map(t => ({...t, finished: m.finishedFiles(t)})))))"
    )
    out = subprocess.run([node, "-e", script], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


def check(client, t: dict, files: list[dict]) -> dict:
    code = "".join(f["code"] if f["code"].endswith("\n") else f["code"] + "\n" for f in files)
    body = {"code": code, "theorems": [t["main"]], "statements": t["statements"], "decls": True}
    r = client.post("/api/check", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_three_demos_and_an_empty_project():
    assert [t["id"] for t in templates()] == ["odd-sum", "nicomachus", "fib-coprime", "empty"]


@pytest.mark.parametrize("tid", ["odd-sum", "nicomachus", "fib-coprime"])
def test_each_demo_opens_with_work_to_do_and_can_be_finished(client, tid):
    t = next(t for t in templates() if t["id"] == tid)
    shipped = check(client, t, t["files"])
    status = {d["name"]: d["status"] for d in shipped["decls"]}
    assert shipped["verdict"] == "incomplete" and status[t["main"]] == "depends", status
    assert {n for n, s in status.items() if s == "sorry"} == set(t["proofs"])
    assert set(t["notes"]) <= set(status)  # every note belongs to a declaration

    solved = t["finished"]  # exactly what the showcase shows
    assert solved != t["files"]
    done = check(client, t, solved)
    assert done["verdict"] == "proved", done["errors"]
    assert all(d["status"] in ("proved", "def") for d in done["decls"])
