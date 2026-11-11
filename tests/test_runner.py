"""The runner end to end with real Lean (skipped when the toolchain or the built REPL is missing)."""

import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
REPL = ROOT / "lean" / ".lake" / "packages" / "REPL" / ".lake" / "build" / "bin" / "repl"
pytestmark = pytest.mark.skipif(
    not (shutil.which("lake") and REPL.exists()), reason="needs lake and `pixi run lean-build`"
)

HELLO = "theorem hello : 2 + 2 = 4 := by\n  sorry\n"
BODY = {"theorems": ["hello"], "statements": ["theorem hello : 2 + 2 = 4"]}


@pytest.fixture(scope="module")
def client():
    os.environ["FORMALIZER_WORKERS"] = "1"
    from backend.app import app

    with TestClient(app) as c:
        for _ in range(600):
            if c.get("/api/health").json()["state"] != "warming":
                break
            import time

            time.sleep(0.1)
        assert c.get("/api/health").json()["state"] == "ready"
        yield c


def check(client, code, **extra):
    r = client.post("/api/check", json={"code": code, **BODY, **extra})
    assert r.status_code == 200, r.text
    return r.json()


def test_hello_world_from_sorry_to_proved(client):
    health = client.get("/api/health").json()
    assert health["runner"] == "lite" and health["lean"].startswith("Lean (version 4.34")
    open_ = check(client, HELLO)
    assert open_["verdict"] == "incomplete" and open_["goals"][0]["target"] == "2 + 2 = 4"
    done = check(client, HELLO.replace("sorry", "rfl"))
    assert done["verdict"] == "proved" and done["axioms"] == {"hello": []}
    for tactic in ("decide", "simp", "omega"):  # core Lean: no Mathlib needed
        assert check(client, HELLO.replace("sorry", tactic))["verdict"] == "proved", tactic


def test_wrong_proofs_and_changed_statements_are_rejected(client):
    wrong = check(client, HELLO.replace("sorry", "exact Nat.lt_irrefl 4"))
    assert wrong["verdict"] == "error" and wrong["errors"][0]["line"] == 2
    cheat = check(client, "theorem hello : 1 = 1 := rfl")
    assert cheat["verdict"] == "error" and "statement was changed" in cheat["errors"][0]["message"]
    mathlib = check(client, "import Mathlib\n" + HELLO)
    assert mathlib["verdict"] == "needs-runner"
