"""The two-layer map: `#statement_graph` through /api/check (`maps: true`, real Lean: skipped without it) and the
precomputed map of every problem (frontend/public/problems/<id>.map.json, scripts/problem_maps/generate.py)."""

import json
from pathlib import Path

import pytest

from tests.test_runner import REPL, client  # noqa: F401 (the shared runner fixture)

ROOT = Path(__file__).resolve().parents[1]
PROBLEMS = [
    p
    for f in sorted((ROOT / "problems").glob("*.json"))
    if f.stem != "collections"
    for p in json.loads(f.read_text(encoding="utf-8"))
]
MAPS = ROOT / "frontend" / "public" / "problems"
STATEMENT_KINDS = {"theorem", "def", "type", "class", "structure", "axiom", "opaque", "quot", "other"}
PROOF_KINDS = {"theorem", "def", "library", "tactics", "axiom"}
GAUSS = "def sumTo : Nat → Nat\n  | 0 => 0\n  | n + 1 => sumTo n + (n + 1)\n\ntheorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by\n  sorry\n"


def well_formed(graph: dict, ids_from_edges) -> set[str]:
    ids = [n["id"] for n in graph["nodes"]]
    assert len(ids) == len(set(ids)), "duplicate nodes"
    for a, b in ids_from_edges(graph):
        assert a in ids and b in ids and a != b
    return set(ids)


def live_edges(graph):
    return [(e["from"], e["to"]) for e in graph["edges"]]


@pytest.mark.skipif(not REPL.exists(), reason="needs `pixi run lean-build`")
def test_statement_graph_through_check(client):  # noqa: F811
    body = {"code": GAUSS, "theorems": ["gauss"], "statements": []}
    plain = client.post("/api/check", json=body).json()
    assert "statementGraph" not in plain  # only when asked: ordinary checks stay fast
    r = client.post("/api/check", json={**body, "maps": True}).json()
    g = r["statementGraph"]
    ids = well_formed(g, live_edges)
    nodes = {n["id"]: n for n in g["nodes"]}
    assert g["roots"] == ["gauss"] and nodes["gauss"]["depth"] == 0 and nodes["gauss"]["own"]
    # the reader's own definition, the names in the statement, and no proof: the statement only
    assert nodes["sumTo"]["own"] and nodes["sumTo"]["kind"] == "def" and nodes["sumTo"]["depth"] == 1
    assert {"Nat", "Eq", "HMul.hMul", "HAdd.hAdd"} <= ids
    assert not any(n["own"] for i, n in nodes.items() if i not in ("gauss", "sumTo"))
    # helpers and instances are folded into their users
    assert not any("match_" in i or "brecOn" in i or i.startswith("inst") for i in ids)
    assert ("gauss", "sumTo") in live_edges(g) and r["graph"]["roots"] == ["gauss"]


@pytest.mark.skipif(not REPL.exists(), reason="needs `pixi run lean-build`")
def test_statement_graph_keeps_a_path_to_each_axiom(client):  # noqa: F811
    # `open Classical`: the `if` decides `p` with Classical.propDecidable, an instance resting on Classical.choice
    code = "open Classical in\ntheorem pick (p : Prop) : (if p then 1 else 0) ≤ 1 := by\n  sorry\n"
    g = client.post("/api/check", json={"code": code, "theorems": ["pick"], "statements": [], "maps": True}).json()[
        "statementGraph"
    ]
    nodes = {n["id"]: n for n in g["nodes"]}
    assert "Classical.choice" in g["axioms"] and nodes["Classical.choice"]["kind"] == "axiom"
    # a path from the root down to the axiom
    adj: dict[str, list[str]] = {}
    for a, b in live_edges(g):
        adj.setdefault(a, []).append(b)
    seen, todo = {"pick"}, ["pick"]
    while todo:
        for b in adj.get(todo.pop(), []):
            if b not in seen:
                seen.add(b)
                todo.append(b)
    assert "Classical.choice" in seen


@pytest.mark.parametrize("p", PROBLEMS, ids=[p["id"] for p in PROBLEMS])
def test_every_problem_has_a_two_layer_map(p):
    path = MAPS / f"{p['id']}.map.json"
    assert path.exists(), "run scripts/problem_maps/generate.py"
    assert path.stat().st_size <= 60_000
    doc = json.loads(path.read_text(encoding="utf-8"))
    assert doc["id"] == p["id"] and doc["runner"] == p["runner"]

    def pairs(g):
        e = g["edges"]
        assert len(e) % 2 == 0 and all(isinstance(i, int) and 0 <= i < len(g["nodes"]) for i in e)
        return [(g["nodes"][e[k]]["id"], g["nodes"][e[k + 1]]["id"]) for k in range(0, len(e), 2)]

    s = doc["statement"]
    ids = well_formed(s, pairs)
    assert s["roots"] == p["theorems"] and set(s["roots"]) <= ids
    assert 1 <= len(s["nodes"]) <= 120 and s["closure"] >= len(s["nodes"])
    for n in s["nodes"]:
        assert n["kind"] in STATEMENT_KINDS and isinstance(n["module"], str) and n["depth"] >= 0
        assert n["own"] == (n["module"] == "")
    # every axiom the statement rests on is drawn
    assert isinstance(s["axioms"], list) and set(s["axioms"]) <= ids
    assert all(n["kind"] == "axiom" for n in s["nodes"] if n["id"] in s["axioms"])

    pr = doc["proof"]
    ids = well_formed(pr, pairs)
    assert set(p["theorems"]) <= ids
    assert all(n["kind"] in PROOF_KINDS for n in pr["nodes"])
    assert not any(n["id"] == "sorryAx" for n in pr["nodes"])  # the reference proof is complete
    assert {n["id"] for n in pr["nodes"] if n["kind"] == "axiom"} <= {"propext", "Quot.sound", "Classical.choice"}


def test_mathlib_statements_rest_on_the_axioms():
    doc = json.loads((MAPS / "geo-pythagoras-euclid.map.json").read_text(encoding="utf-8"))
    assert set(doc["statement"]["axioms"]) == {"propext", "Quot.sound", "Classical.choice"}
