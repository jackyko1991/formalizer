#!/usr/bin/env python3
"""Formalizer · Mathlib map generator: writes frontend/public/mathlib/ (the data of #/skills/mathlib).

    python scripts/mathlib_graph/generate.py            # from the repo root, on Windows (runs Lean in WSL) or Linux

Needs a Lean project with Mathlib built (`lake exe cache get`), by default ~/fz/mathproj in WSL Ubuntu-24.04
(toolchain and Mathlib tag v4.34.1): see --distro / --project. Lean runs Gen.lean three times (graph, modules, info);
each run imports all of Mathlib (~10 s) and the graph run walks the proof terms of the curated theorems (a few
minutes). The raw output is kept in the system temp folder (fz-mathlib-raw) and `--reuse` skips the Lean runs, to
tune the pruning below without waiting for Lean.

    python scripts/mathlib_graph/generate.py --only RiemannHypothesis

regenerates one curated theorem only (after adding it to curated.json, or changing its entry): one graph run and one
info run for that theorem, then its t/<n>.json and its entry in index.json are rewritten in place (n = its position in
curated.json) and every other file is left as it is. Its raw output goes to fz-mathlib-raw/only, so `--reuse` still
reuses the last full run.

What it writes (all plain JSON, gzip-friendly):
  index.json       meta (versions, date), the curated theorems (curated.json + statement, module, axioms, closure
                   size, areas), and the names of every declaration shown in some theorem's graph (for search)
  t/<n>.json       one theorem's pruned dependency graph: nodes (name, kind, module, depth, hidden deps,
                   statement, docstring, line), edges, the guided path, and every axiom with a path to it
  galaxy.json      every Mathlib module (name, theorems, definitions, district) and the import graph aggregated
                   into districts (Mathlib.Algebra.Group, Mathlib.Topology.Algebra, …)

Pruning (Gen.lean has already collapsed instances and auxiliary declarations): a theorem's full closure has
thousands of declarations, so each graph keeps the root, a shortest path to each axiom it uses, its guided path and
a path to a few landmarks (ℕ, ℤ, ℚ, ℝ, Cauchy sequences, quotients…, plus the theorem's own "keep" list in
curated.json), then fills up to --max-nodes with its nearest
dependencies, most-used first (up to --max-nodes, or the theorem's own "maxNodes"). Each node records how many
of its dependencies were left out.
"""

from __future__ import annotations

import argparse
import collections
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "frontend" / "public" / "mathlib"
RAW = Path(tempfile.gettempdir()) / "fz-mathlib-raw"

AXIOMS = ["propext", "Quot.sound", "Classical.choice"]
LANDMARKS = [
    "Nat",
    "Int",
    "Rat",
    "Real",
    "Complex",
    "CauSeq",
    "CauSeq.Completion.Cauchy",
    "IsCauSeq",
    "Quotient",
    "Quot",
    "Setoid",
    "Eq",
    "funext",
    "Set",
    "Finset",
    "Multiset",
    "List",
    "Fin",
    "ZMod",
    "Nat.Prime",
    "Polynomial",
    "Matrix",
    "Filter",
    "Filter.Tendsto",
    "TopologicalSpace",
    "MetricSpace",
    "Real.pi",
    "Real.exp",
    "Real.sqrt",
    "deriv",
    "MeasureTheory.Measure",
    "Group",
    "Monoid",
    "Ring",
    "Field",
    "Classical.choose",
    "Exists",
    "Or",
    "Not",
]
SIG_MAX, DOC_MAX = 600, 320


def wsl_path(p: Path) -> str:
    if os.name != "nt":
        return str(p)
    drive, rest = str(p.resolve()).split(":", 1)
    return f"/mnt/{drive.lower()}{rest.replace(os.sep, '/')}"


def run_lean(args, mode: str, names: list[str] | None = None, raw: Path = RAW) -> None:
    raw.mkdir(parents=True, exist_ok=True)
    if names is not None:
        (raw / f"names_{mode}.txt").write_text("\n".join(names) + "\n", encoding="utf-8")
    env = f"FZ_MODE={mode} FZ_OUT='{wsl_path(raw)}'" + (
        f" FZ_NAMES='{wsl_path(raw / f'names_{mode}.txt')}'" if names else ""
    )
    script = f". ~/.elan/env; cd {args.project} && {env} lake env lean '{wsl_path(HERE / 'Gen.lean')}'"
    cmd = ["wsl.exe", "-d", args.distro, "--", "bash", "-lc", script] if os.name == "nt" else ["bash", "-lc", script]
    print(f"[lean] {mode} …", flush=True)
    r = subprocess.run(cmd, text=True, encoding="utf-8", errors="replace", capture_output=True, check=False)
    sys.stderr.write(r.stderr[-4000:])
    if r.returncode != 0:
        sys.stdout.write(r.stdout[-4000:])
        raise SystemExit(f"Lean failed in mode {mode}")


def lake_manifest(args) -> dict:
    script = f"cat {args.project}/lake-manifest.json; echo; cat {args.project}/lean-toolchain"
    cmd = ["wsl.exe", "-d", args.distro, "--", "bash", "-lc", script] if os.name == "nt" else ["bash", "-lc", script]
    out = subprocess.run(cmd, text=True, encoding="utf-8", capture_output=True, check=False).stdout
    body, _, toolchain = out.rpartition("}")
    try:
        manifest = json.loads(body + "}")
    except json.JSONDecodeError:
        manifest = {"packages": []}
    # a version tag when the project pins one (mathlib v4.34.1), else the exact commit
    revs = {
        p["name"]: p["inputRev"] if re.fullmatch(r"v\d[\w.\-]*", p.get("inputRev") or "") else p.get("rev", "")
        for p in manifest.get("packages", [])
    }
    return {"lean": toolchain.strip().split(":")[-1], "packages": revs}


def district(mod: str) -> str:
    parts = mod.split(".")
    if parts[0] != "Mathlib":
        return parts[0]
    return ".".join(parts[:3]) if len(parts) > 3 else ".".join(parts[:2])


def area(mod: str) -> str:
    parts = mod.split(".")
    return parts[1] if parts[0] == "Mathlib" and len(parts) > 2 else parts[0]


def bfs(adj: list[list[int]], src: int):
    dist, parent = {src: 0}, {src: -1}
    q = collections.deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
    return dist, parent


def path_to(parent: dict[int, int], v: int) -> list[int]:
    out = []
    while v != -1:
        out.append(v)
        v = parent[v]
    return out[::-1]


def prune(g, root: int, tour: list[str], idx: dict[str, int], max_nodes: int, indeg_global: list[int], keep_names=()):
    adj = g["adj"]
    dist, parent = bfs(adj, root)
    keep: dict[int, None] = {root: None}
    axioms = [idx[a] for a in AXIOMS if a in idx and idx[a] in dist]
    other_axioms = [i for i in dist if g["nodes"][i][1] == "axiom" and i not in axioms]
    for a in axioms + other_axioms:
        keep.update(dict.fromkeys(path_to(parent, a)))
    # guided path: root → tour[0] → tour[1] → … → (last axiom reached), segment by segment
    chain = [root]
    for w in tour:
        if w not in idx or idx[w] not in dist:
            print(f"   tour waypoint {w} not below {g['nodes'][root][0]}: skipped", file=sys.stderr)
            continue
        d2, p2 = bfs(adj, chain[-1])
        if idx[w] not in d2:
            print(f"   tour waypoint {w} not below {g['nodes'][chain[-1]][0]}: skipped", file=sys.stderr)
            continue
        chain += path_to(p2, idx[w])[1:]
    if tour and chain[-1] != root:
        d2, p2 = bfs(adj, chain[-1])
        ax = [a for a in axioms if a in d2]
        if ax and g["nodes"][chain[-1]][1] != "axiom":
            chain += path_to(p2, min(ax, key=lambda a: d2[a]))[1:]
    keep.update(dict.fromkeys(chain))
    for name in keep_names:
        if name in idx and idx[name] in dist:
            keep.update(dict.fromkeys(path_to(parent, idx[name])))
        else:
            print(f"   keep {name} not below {g['nodes'][root][0]}: skipped", file=sys.stderr)
    for name in LANDMARKS:
        if name in idx and idx[name] in dist and len(keep) < max_nodes * 0.6:
            keep.update(dict.fromkeys(path_to(parent, idx[name])))
    # fill with the nearest dependencies, most used first, a few per level
    caps = {1: 34, 2: 30, 3: 20}
    taken = collections.Counter(dist[k] for k in keep)
    for v in sorted(dist, key=lambda v: (dist[v], -indeg_global[v], g["nodes"][v][0])):
        if len(keep) >= max_nodes:
            break
        lvl = dist[v]
        if v in keep or taken[lvl] >= caps.get(lvl, 12):
            continue
        keep[v] = None
        taken[lvl] += 1
    kept = list(keep)
    pos = {v: i for i, v in enumerate(kept)}
    edges, hidden = [], []
    for v in kept:
        shown = 0
        for w in adj[v]:
            if w in pos:
                edges += [pos[v], pos[w]]
                shown += 1
        hidden.append(len(adj[v]) - shown)
    return kept, pos, dist, edges, hidden, [pos[c] for c in chain], axioms + other_axioms, parent


def clip(s: str, n: int) -> str:
    s = re.sub(r"[ \t]+\n", "\n", s.strip())
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def analyse(args, curated: list[dict], g: dict) -> list[tuple]:
    """Prune every root of the raw graph `g` (curated: the curated.json entries, by name)."""
    if g["missing"]:
        print("missing in Mathlib:", g["missing"], file=sys.stderr)
    mods, nodes, adj = g["mods"], g["nodes"], g["adj"]
    idx = {n[0]: i for i, n in enumerate(nodes)}
    indeg = [0] * len(nodes)
    for a in adj:
        for w in a:
            indeg[w] += 1
    waypoints = sorted(
        {w for t in curated for w in t.get("tour", []) + t.get("keep", [])} | set(LANDMARKS) | set(AXIOMS)
    )
    for w in waypoints:
        if w not in idx:
            print(f"landmark / waypoint {w} is in no closure", file=sys.stderr)
    by_name = {t["name"]: t for t in curated}
    results = []
    for name, root, closure in g["roots"]:
        t = by_name[name]
        kept, _pos, dist, edges, hidden, chain, axioms, _ = prune(
            g, root, t.get("tour", []), idx, t.get("maxNodes", args.max_nodes), indeg, t.get("keep", [])
        )
        areas = collections.Counter(area(mods[nodes[v][2]]) for v in dist if nodes[v][2] >= 0)
        results.append((t, root, closure, kept, dist, edges, hidden, chain, axioms, areas))
        print(
            f"{name}: closure {closure}, kept {len(kept)}, edges {len(edges) // 2}, axioms "
            f"{[nodes[a][0] for a in axioms]}, path {len(chain)}"
        )
    return results


def load_info(args, results: list[tuple], g: dict, raw: Path) -> dict:
    shown = sorted({g["nodes"][v][0] for r in results for v in r[3]})
    info_file = raw / "raw_info.json"
    if (
        not args.reuse
        or not info_file.exists()
        or not set(shown) <= set(json.loads(info_file.read_text(encoding="utf-8")))
    ):
        run_lean(args, "info", shown, raw)
    return json.loads(info_file.read_text(encoding="utf-8"))


def write_theorem(k: int, result: tuple, g: dict, info: dict) -> tuple[dict, list[str]]:
    """Write t/<k>.json; return the theorem's index.json entry and the names its graph shows."""
    t, root, closure, kept, dist, edges, hidden, chain, axioms, areas = result
    mods, nodes = g["mods"], g["nodes"]
    rows, shown = [], []
    for i, v in enumerate(kept):
        n, kind, m = nodes[v]
        inf = info.get(n, {})
        rows.append(
            [
                n,
                kind,
                mods[m] if m >= 0 else "",
                dist[v],
                hidden[i],
                clip(inf.get("sig", ""), SIG_MAX),
                clip(inf.get("doc", ""), DOC_MAX),
                inf.get("line", 0),
            ]
        )
        shown.append(n)
    doc = {
        "root": t["name"],
        "fields": ["name", "kind", "module", "depth", "hidden", "sig", "doc", "line"],
        "nodes": rows,
        "edges": edges,
        "path": chain,
        "axioms": [nodes[a][0] for a in axioms],
    }
    (OUT / "t" / f"{k}.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    inf = info.get(t["name"], {})
    entry = {
        "name": t["name"],
        "en": t["en"],
        "zh": t["zh"],
        "module": mods[nodes[root][2]],
        "sig": clip(inf.get("sig", ""), SIG_MAX),
        "line": inf.get("line", 0),
        "closure": closure,
        "axioms": [nodes[a][0] for a in axioms],
        "areas": dict(areas.most_common(8)),
        "depth": max(dist.values()),
        "file": f"t/{k}.json",
    }
    return entry, shown


def only(args, curated: list[dict]) -> None:
    """Regenerate the named curated theorems in place, leaving the rest of frontend/public/mathlib as it is."""
    raw = RAW / "only"
    pos = {t["name"]: k for k, t in enumerate(curated)}
    unknown = [n for n in args.only if n not in pos]
    if unknown:
        raise SystemExit(f"not in curated.json: {unknown}")
    chosen = [curated[pos[n]] for n in args.only]
    if not args.reuse:
        run_lean(args, "graph", [t["name"] for t in chosen], raw)
    g = json.loads((raw / "raw_graph.json").read_text(encoding="utf-8"))
    results = analyse(args, chosen, g)
    info = load_info(args, results, g, raw)
    index = json.loads((OUT / "index.json").read_text(encoding="utf-8"))
    theorems, names = index["theorems"], index["names"]
    for result in results:
        k = pos[result[0]["name"]]
        if k > len(theorems):
            raise SystemExit(f"{result[0]['name']} is at position {k} of curated.json: run the full generator first")
        entry, shown = write_theorem(k, result, g, info)
        if k == len(theorems):
            theorems.append(entry)
        else:
            theorems[k] = entry
        for ks in names.values():
            if k in ks:
                ks.remove(k)
        for n in shown:
            names.setdefault(n, []).append(k)
            names[n].sort()
    index["names"] = {n: ks for n, ks in sorted(names.items()) if ks}
    index["meta"]["updated"] = datetime.date.today().isoformat()
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"updated {OUT}: {', '.join(args.only)}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--distro", default="Ubuntu-24.04")
    ap.add_argument("--project", default="~/fz/mathproj")
    ap.add_argument("--max-nodes", type=int, default=110)
    ap.add_argument("--reuse", action="store_true", help="reuse the raw Lean output of the last run")
    ap.add_argument("--only", nargs="+", metavar="NAME", help="regenerate only these curated theorems, in place")
    args = ap.parse_args()

    curated = json.loads((HERE / "curated.json").read_text(encoding="utf-8"))["theorems"]
    if args.only:
        return only(args, curated)
    names = [t["name"] for t in curated]
    if not args.reuse:
        run_lean(args, "graph", names)
        run_lean(args, "modules")
    g = json.loads((RAW / "raw_graph.json").read_text(encoding="utf-8"))
    modules = json.loads((RAW / "raw_modules.json").read_text(encoding="utf-8"))
    results = analyse(args, curated, g)
    info = load_info(args, results, g, RAW)

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "t").mkdir(parents=True)
    theorems, where = [], collections.defaultdict(list)
    for k, result in enumerate(results):
        entry, shown = write_theorem(k, result, g, info)
        theorems.append(entry)
        for n in shown:
            where[n].append(k)

    # galaxy: modules and districts
    mod_names = [m[0] for m in modules]
    seen_mod = {}
    for i, m in enumerate(mod_names):
        seen_mod.setdefault(m, i)
    dnames: dict[str, int] = {}
    mrows, links = [], collections.Counter()
    for name, imports, thms, defs in modules:
        if not name.startswith(("Mathlib", "Init", "Std", "Batteries", "Lean")):
            continue
        d = dnames.setdefault(district(name), len(dnames))
        mrows.append([name, thms, defs, d])
        for imp in set(imports):
            if imp in seen_mod:
                e = dnames.setdefault(district(imp), len(dnames))
                if e != d:
                    links[(d, e)] += 1
    dsum = collections.defaultdict(lambda: [0, 0, 0])
    for name, thms, defs, d in mrows:
        s = dsum[d]
        s[0] += 1
        s[1] += thms
        s[2] += defs
    districts = [[n, *dsum[i]] for n, i in sorted(dnames.items(), key=lambda kv: kv[1])]
    galaxy = {
        "fields": {
            "modules": ["name", "theorems", "definitions", "district"],
            "districts": ["name", "modules", "theorems", "definitions"],
            "links": ["from", "to", "imports"],
        },
        "modules": mrows,
        "districts": districts,
        "links": [[a, b, w] for (a, b), w in sorted(links.items())],
    }
    (OUT / "galaxy.json").write_text(json.dumps(galaxy, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    meta = lake_manifest(args)
    index = {
        "meta": {
            "sample": False,
            "generated": datetime.date.today().isoformat(),
            "lean": meta["lean"],
            "mathlib": meta["packages"].get("mathlib", ""),
            "packages": meta["packages"],
            "modules": len(mrows),
            "maxNodes": args.max_nodes,
        },
        "theorems": theorems,
        "names": {n: ks for n, ks in sorted(where.items())},
    }
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.rglob("*.json"))
    print(f"wrote {OUT}: {len(theorems)} theorems, {len(mrows)} modules, {total / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
