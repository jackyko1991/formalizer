"""Every problem file in problems/ (one per topic: tutorial, geometry, linear-algebra, research, imo, pitfalls): each
problem is well formed, and with real Lean a Lite problem's starting file is incomplete, its reference solution is
proved, and pressing its chips in order (as the page does) reaches a proof. The Lean part is skipped when the toolchain
or the built REPL is missing; CI builds both. Full problems (they import Mathlib) are checked statically here, and
compiled with Mathlib when FORMALIZER_MATHLIB names a Lake project that has it (e.g. ~/fz/mathproj)."""

import json
import os
import re
import subprocess
from pathlib import Path

import pytest

from tests.test_runner import REPL, client  # noqa: F401 (the shared runner fixture)

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    f.stem: json.loads(f.read_text(encoding="utf-8"))
    for f in sorted((ROOT / "problems").glob("*.json"))
    if f.stem != "collections"
}
COLLECTIONS = json.loads((ROOT / "problems" / "collections.json").read_text(encoding="utf-8"))
PROBLEMS = [p for problems in FILES.values() for p in problems]
IDS = [p["id"] for p in PROBLEMS]
LITE = [p for p in PROBLEMS if p["runner"] == "lite"]
FULL = [p for p in PROBLEMS if p["runner"] == "full"]
SORRY = re.compile(r"\bsorry\b")
# words a reference solution may not contain: it must be a real proof, with no escape hatch
FORBIDDEN = re.compile(r"\b(sorry|admit|axiom|native_decide|implemented_by|extern|unsafe)\b")
MATHLIB = os.environ.get("FORMALIZER_MATHLIB")


def insert_chip(code: str, chip: str, step: bool) -> str:
    """Mirror of `insertChip` in frontend/src/runner.ts: the chip replaces the first `sorry`; its further lines are
    indented to that column; a step chip keeps a `sorry` after it for what is left."""
    m = SORRY.search(code)
    if not m:
        return code
    indent = " " * (m.start() - (code.rfind("\n", 0, m.start()) + 1))
    text = chip.replace("\n", "\n" + indent) + (f"\n{indent}sorry" if step else "")
    return code[: m.start()] + text + code[m.end() :]


def test_problems_are_well_formed():
    assert set(FILES) == {"tutorial", "geometry", "linear-algebra", "research", "imo", "pitfalls"}, (
        "a new topic also needs frontend/src/problems.ts"
    )
    assert len(IDS) == len(set(IDS)) and len(FILES["tutorial"]) >= 15
    for p in PROBLEMS:
        assert re.fullmatch(r"[a-z0-9-]+", p["id"]), p["id"]
        assert p["level"] in ("L1", "L2", "L3") and p["runner"] in ("lite", "full")
        for key in ("title", "summary", "hint"):
            assert len(p[key]) == 2 and all(s.strip() for s in p[key]), f"{p['id']}: {key} needs en + zh-Hant"
        assert SORRY.search(p["start"]) and not SORRY.search(p["solution"]), p["id"]
        for s in p["statements"]:
            assert s in p["start"] and s in p["solution"], f"{p['id']}: statement missing"
        assert set(p["steps"]) <= set(p["tactics"]), p["id"]
        assert not FORBIDDEN.search(p["solution"]), f"{p['id']}: the reference solution must be a real proof"
        if p["runner"] == "lite":
            assert "import" not in p["start"], f"{p['id']}: the Lite track is core Lean only"
        else:
            assert p["start"].startswith("import Mathlib\n") and p["solution"].startswith("import Mathlib\n"), p["id"]
        for tag in p.get("tags", []):
            assert len(tag) == 2 and all(s.strip() for s in tag), f"{p['id']}: a tag needs en + zh-Hant"
    for name, problems in FILES.items():
        levels = [p["level"] for p in problems]
        assert levels == sorted(levels), f"{name}: problems are listed level by level"
    for level in ("L1", "L2", "L3"):
        assert [p["level"] for p in FILES["tutorial"]].count(level) >= 3, level


def test_imported_problems_name_their_source():
    """The IMO problems are ported from compfiles (Apache-2.0): each names the exact file at a pinned commit, its
    licence and authors, and NOTICE credits the project."""
    assert len(FILES["imo"]) >= 5
    notice = (ROOT / "NOTICE").read_text(encoding="utf-8")
    url = re.compile(r"https://github\.com/dwrensha/compfiles/blob/[0-9a-f]{40}/Compfiles/Imo\d{4}P\d\.lean")
    for p in FILES["imo"]:
        src = p["source"]
        assert p["runner"] == "full" and p["tags"][0][0].startswith("IMO "), p["id"]
        assert url.fullmatch(src["url"]) and src["licence"] == "Apache-2.0" and src["authors"].strip(), p["id"]
        assert src["name"] in notice and len(src["changes"]) == 2, p["id"]


def test_collections_are_well_formed():
    """Collections are ordered learning paths across topics (the 🧭 bar on a problem page)."""
    ids = [c["id"] for c in COLLECTIONS]
    assert len(ids) == len(set(ids))
    for c in COLLECTIONS:
        assert re.fullmatch(r"[a-z0-9-]+", c["id"]), c["id"]
        for key in ("title", "summary"):
            assert len(c[key]) == 2 and all(s.strip() for s in c[key]), f"{c['id']}: {key} needs en + zh-Hant"
        assert len(c["items"]) >= 2 and len(c["items"]) == len(set(c["items"])), c["id"]
        unknown = [i for i in c["items"] if i not in IDS]
        assert not unknown, f"{c['id']}: unknown problems {unknown}"


def check(client, p, code):  # noqa: F811
    r = client.post("/api/check", json={"code": code, "theorems": p["theorems"], "statements": p["statements"]})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.skipif(not REPL.exists(), reason="needs `pixi run lean-build`")
@pytest.mark.parametrize("p", LITE, ids=[p["id"] for p in LITE])
def test_start_is_open_and_the_solution_is_proved(client, p):  # noqa: F811
    start = check(client, p, p["start"])
    assert start["verdict"] == "incomplete" and start["goals"], start
    done = check(client, p, p["solution"])
    assert done["verdict"] == "proved", done
    assert all(set(a) <= {"propext", "Quot.sound", "Classical.choice"} for a in done["axioms"].values())


@pytest.mark.skipif(not REPL.exists(), reason="needs `pixi run lean-build`")
@pytest.mark.parametrize("p", LITE, ids=[p["id"] for p in LITE])
def test_the_chips_in_order_reach_a_proof(client, p):  # noqa: F811
    """A learner pressing the chips left to right: a chip that Lean rejects is undone (some are there to show an
    error), the others must keep the file compiling until one finishes the proof."""
    code = p["start"]
    for chip in p["tactics"]:
        tried = insert_chip(code, chip, chip in p["steps"])
        result = check(client, p, tried)
        if result["verdict"] == "error":
            assert chip not in p["steps"] and "sorry" not in chip, f"{chip!r}: {result['errors']}"
            continue
        code = tried
        if result["verdict"] == "proved":
            return
    pytest.fail(f"the chips never finish the proof; last file:\n{code}")


def lean_with_mathlib(tmp_path, code):
    f = tmp_path / "Check.lean"
    f.write_text(code, encoding="utf-8")
    cmd = ["lake", "env", "lean", str(f)]
    r = subprocess.run(cmd, cwd=MATHLIB, capture_output=True, text=True, timeout=1800, check=False)
    return r.returncode, r.stdout + r.stderr


@pytest.mark.skipif(not MATHLIB, reason="set FORMALIZER_MATHLIB to a Lake project with Mathlib")
@pytest.mark.parametrize("p", FULL, ids=[p["id"] for p in FULL])
def test_full_problems_compile_with_mathlib(tmp_path, p):
    """A Full problem's start compiles with only `sorry` left; its reference solution compiles with none."""
    code, out = lean_with_mathlib(tmp_path, p["start"])
    assert code == 0 and "declaration uses `sorry`" in out, out
    code, out = lean_with_mathlib(tmp_path, p["solution"])
    assert code == 0 and "sorry" not in out, out


# --- the dependency graph (lean/Formalizer/DepGraph.lean, pruned by backend/check.py) ---


def by_id(problem_id):
    return next(p for p in PROBLEMS if p["id"] == problem_id)


@pytest.mark.skipif(not REPL.exists(), reason="needs `pixi run lean-build`")
def test_gauss_has_a_clear_dependency_graph(client):  # noqa: F811
    """The guaranteed example: Gauss's sum (L3, induction) → its definition and the library lemmas it cites → axioms."""
    p = by_id("gauss")
    graph = check(client, p, p["solution"])["graph"]
    nodes = {n["id"]: n for n in graph["nodes"]}
    edges = {(e["from"], e["to"]) for e in graph["edges"]}
    assert graph["roots"] == ["gauss"] and nodes["gauss"]["status"] == "proved"
    assert nodes["sumTo"]["kind"] == "def" and ("gauss", "sumTo") in edges
    for lemma in ("Nat.mul_add", "Nat.add_mul", "Nat.mul_comm"):  # named in the proof
        assert nodes[lemma]["kind"] == "library" and ("gauss", lemma) in edges
    assert {n["id"] for n in graph["nodes"] if n["kind"] == "axiom"} == {"propext"}
    assert len(nodes) <= 8, sorted(nodes)
    unfinished = check(client, p, p["start"])["graph"]
    assert {n["id"]: n["status"] for n in unfinished["nodes"]}["gauss"] == "sorry"
    assert "sorryAx" in {n["id"] for n in unfinished["nodes"]}


@pytest.mark.skipif(not REPL.exists(), reason="needs `pixi run lean-build`")
@pytest.mark.parametrize("p", FILES["tutorial"], ids=[p["id"] for p in FILES["tutorial"]])
def test_every_tutorial_graph_is_small_and_standard(client, p):  # noqa: F811
    graph = check(client, p, p["solution"])["graph"]
    ids = {n["id"] for n in graph["nodes"]}
    assert set(p["theorems"]) <= ids and len(ids) <= 12, sorted(ids)
    assert {n["id"] for n in graph["nodes"] if n["kind"] == "axiom"} <= {"propext", "Quot.sound", "Classical.choice"}
