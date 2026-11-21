"""The research demos (frontend/src/research/templates.ts) on the Lite runner: as shipped, the lemmas are open and the
main theorem waits on them; with the lemmas proved (solutions kept here, not on the site), the main theorem is proved
with standard axioms only. So every demo is finishable without Mathlib."""

# ruff: noqa: F811  (the shared runner fixture)

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from tests.test_runner import client  # noqa: F401

ROOT = Path(__file__).resolve().parents[1]

SOLUTIONS = {
    "odd-sum": {
        "oddSum_succ": "rfl",
        "square_succ": "by\n  simp only [Nat.add_mul, Nat.mul_add, Nat.mul_one, Nat.one_mul]\n  omega",
    },
    "nicomachus": {
        "two_triangle": (
            "by\n  induction n with\n  | zero => rfl\n  | succ k ih =>\n"
            "    simp only [triangle, Nat.mul_add, ih, Nat.add_mul, Nat.mul_one, Nat.one_mul]\n    omega"
        ),
        "triangle_sq_succ": (
            "by\n  have h := two_triangle n\n  show (triangle n + (n + 1)) * (triangle n + (n + 1)) = _\n"
            "  generalize triangle n = t at *\n"
            "  have expand : (t + (n + 1)) * (t + (n + 1)) = t * t + 2 * t * (n + 1) + (n + 1) * (n + 1) := by\n"
            "    simp only [Nat.add_mul, Nat.mul_add, Nat.two_mul, Nat.mul_one, Nat.one_mul, Nat.mul_comm n t]\n"
            "    omega\n"
            "  rw [expand, h, Nat.mul_assoc n, Nat.mul_assoc (n + 1), Nat.succ_mul n ((n + 1) * (n + 1)), Nat.add_assoc]"
        ),
    },
    "fib-coprime": {
        "gcd_fib_step": "by\n  rw [fib_add_two, Nat.gcd_comm (fib n) (fib (n + 1)), Nat.add_comm, Nat.gcd_add_self_right]",
    },
}


def templates() -> list[dict]:
    node = shutil.which("node")
    if node is None:
        pytest.skip("node is needed to read templates.ts")
    script = "import('./frontend/src/research/templates.ts').then(m => console.log(JSON.stringify(m.TEMPLATES)))"
    out = subprocess.run([node, "-e", script], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def solve(code: str, proofs: dict[str, str]) -> str:
    """Replace each named lemma's `:= by\\n  sorry` with its proof."""
    for name, proof in proofs.items():
        head = code.index(f"theorem {name} ")
        hole = code.index(":= by\n  sorry", head)
        code = code[:hole] + ":= " + proof + code[hole + len(":= by\n  sorry") :]
    return code


def check(client, t: dict, files: list[dict]) -> dict:
    code = "".join(f["code"] if f["code"].endswith("\n") else f["code"] + "\n" for f in files)
    body = {"code": code, "theorems": [t["main"]], "statements": t["statements"], "decls": True}
    r = client.post("/api/check", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_three_demos_and_an_empty_project():
    assert [t["id"] for t in templates()] == ["odd-sum", "nicomachus", "fib-coprime", "empty"]


@pytest.mark.parametrize("tid", list(SOLUTIONS))
def test_each_demo_opens_with_work_to_do_and_can_be_finished(client, tid):
    t = next(t for t in templates() if t["id"] == tid)
    shipped = check(client, t, t["files"])
    status = {d["name"]: d["status"] for d in shipped["decls"]}
    assert shipped["verdict"] == "incomplete" and status[t["main"]] == "depends", status
    assert {n for n, s in status.items() if s == "sorry"} == set(SOLUTIONS[tid])
    assert set(t["notes"]) <= set(status)  # every note belongs to a declaration

    solved = [
        {**f, "code": solve(f["code"], SOLUTIONS[tid]) if f["name"] == "Lemmas.lean" else f["code"]} for f in t["files"]
    ]
    done = check(client, t, solved)
    assert done["verdict"] == "proved", done["errors"]
    assert all(d["status"] in ("proved", "def") for d in done["decls"])
