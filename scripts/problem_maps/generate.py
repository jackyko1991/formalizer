#!/usr/bin/env python3
"""Formalizer · problem maps: writes frontend/public/problems/<id>.map.json, the two-layer map of every problem.

    python scripts/problem_maps/generate.py              # from the repo root; every problem
    python scripts/problem_maps/generate.py gauss hello  # only these

Layer 1, `statement`: what the problem's statement rests on: `#statement_graph` (lean/Formalizer/DepGraph.lean) on
the theorems of its starting file: the closure of their types down to the axioms, pruned to at most 120 nodes.
Layer 2, `proof`: how the reference proof is built: `#dep_graph` on the reference solution, pruned as the runner
prunes a reader's proof (backend/check.py prune_graph).

Lite problems run on this computer's Lean (`lake env lean` in lean/, after `pixi run lean-build`). Full problems
(they import Mathlib) run in WSL (Ubuntu-24.04, ~/fz/mathproj with Mathlib built, as scripts/mathlib_graph) or, on
Linux, in --project: the DepGraph commands are pasted after `import Mathlib`, so that project needs nothing more.

Each file is small (edges as index pairs): {v, id, runner, statement: {roots, closure, truncated, axioms,
nodes: [{id, kind, module, depth, own, hidden}], edges: [i, j, …]}, proof: {roots, hidden, more,
nodes: [{id, kind, status, label?, count?}], edges: [i, j, …]}}.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from backend.check import prune_graph

LEAN = ROOT / "lean"
DEPGRAPH = LEAN / "Formalizer" / "DepGraph.lean"
OUT = ROOT / "frontend" / "public" / "problems"
_IMPORT = re.compile(r"^\s*import\s+\S+\s*$", re.MULTILINE)
PREFIXES = {"statement": "formalizer-statement-graph ", "proof": "formalizer-depgraph "}


def problems() -> list[dict]:
    out = []
    for f in sorted((ROOT / "problems").glob("*.json")):
        if f.stem != "collections":
            out += json.loads(f.read_text(encoding="utf-8"))
    return out


def lean_file(code: str, command: str, theorems: list[str], full: bool) -> str:
    body = _IMPORT.sub("", code)
    if not full:
        return f"import Formalizer.DepGraph\n{body}\n{command} {' '.join(theorems)}\n"
    # Mathlib in WSL: DepGraph's commands pasted in (scoped, so its `open`s do not leak into the problem)
    depgraph = _IMPORT.sub("", DEPGRAPH.read_text(encoding="utf-8"))
    return f"import Mathlib\nsection\n{depgraph}\nend\n{body}\n{command} {' '.join(theorems)}\n"


def run_lite(source: str) -> str:
    with tempfile.TemporaryDirectory(prefix="fz-map-") as tmp:
        path = Path(tmp) / "Map.lean"
        path.write_text(source, encoding="utf-8")
        r = subprocess.run(
            ["lake", "env", "lean", str(path)],
            cwd=LEAN,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
    return r.stdout + r.stderr


def run_full(source: str, name: str, args) -> str:
    script = (
        f"mkdir -p ~/fz/maps && cat > ~/fz/maps/{name}.lean && . ~/.elan/env && cd {args.project} && "
        f"lake env lean ~/fz/maps/{name}.lean"
    )
    cmd = ["wsl.exe", "-d", args.distro, "--", "bash", "-lc", script] if os.name == "nt" else ["bash", "-lc", script]
    r = subprocess.run(
        cmd, input=source, capture_output=True, text=True, encoding="utf-8", errors="replace", check=False
    )
    return r.stdout + r.stderr


def parse(output: str, prefix: str) -> dict:
    for line in output.splitlines():
        at = line.find(prefix)
        if at >= 0:
            return json.loads(line[at + len(prefix) :])
    raise RuntimeError(f"no `{prefix.strip()}` in Lean's output:\n{output[-3000:]}")


def compact(graph: dict, fields: list[str]) -> dict:
    """Edges as index pairs into `nodes` (the map's files stay small); unknown endpoints are dropped."""
    nodes = [{k: n[k] for k in fields if k in n} for n in graph["nodes"]]
    index = {n["id"]: i for i, n in enumerate(nodes)}
    edges: list[int] = []
    seen = set()
    for e in graph["edges"]:
        a, b = index.get(e["from"]), index.get(e["to"])
        if a is None or b is None or a == b or (a, b) in seen:
            continue
        seen.add((a, b))
        edges += [a, b]
    rest = {k: v for k, v in graph.items() if k not in ("nodes", "edges")}
    return {**rest, "nodes": nodes, "edges": edges}


def build(p: dict, args) -> dict:
    full = p["runner"] == "full"
    run = (lambda src, tag: run_full(src, f"{p['id']}-{tag}", args)) if full else (lambda src, _tag: run_lite(src))
    statement = parse(run(lean_file(p["start"], "#statement_graph", p["theorems"], full), "s"), PREFIXES["statement"])
    proof = parse(run(lean_file(p["solution"], "#dep_graph", p["theorems"], full), "p"), PREFIXES["proof"])
    proof = prune_graph(proof, p["solution"])
    return {
        "v": 1,
        "id": p["id"],
        "runner": p["runner"],
        "statement": compact(statement, ["id", "kind", "module", "depth", "own", "hidden"]),
        "proof": compact(proof, ["id", "kind", "status", "label", "count"]),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*", help="only these problems")
    ap.add_argument("--distro", default="Ubuntu-24.04")
    ap.add_argument("--project", default="~/fz/mathproj")
    ap.add_argument("--jobs", type=int, default=3)
    args = ap.parse_args()
    chosen = [p for p in problems() if not args.ids or p["id"] in args.ids]
    unknown = set(args.ids) - {p["id"] for p in chosen}
    if unknown:
        raise SystemExit(f"unknown problems: {sorted(unknown)}")
    OUT.mkdir(parents=True, exist_ok=True)
    failed = []
    with concurrent.futures.ThreadPoolExecutor(args.jobs) as pool:
        futures = {pool.submit(build, p, args): p for p in chosen}
        for f in concurrent.futures.as_completed(futures):
            p = futures[f]
            try:
                doc = f.result()
            except Exception as e:  # noqa: BLE001 (report every problem, then fail)
                failed.append(p["id"])
                print(f"{p['id']}: FAILED {e}", file=sys.stderr)
                continue
            text = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
            (OUT / f"{p['id']}.map.json").write_text(text, encoding="utf-8")
            s, pr = doc["statement"], doc["proof"]
            print(
                f"{p['id']}: statement {len(s['nodes'])} nodes / {len(s['edges']) // 2} edges "
                f"(closure {s['closure']}, axioms {s['axioms']}), proof {len(pr['nodes'])} nodes, "
                f"{len(text.encode()) / 1000:.1f} kB",
                flush=True,
            )
    if failed:
        raise SystemExit(f"failed: {failed}")


if __name__ == "__main__":
    main()
