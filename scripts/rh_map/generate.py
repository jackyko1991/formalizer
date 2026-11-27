#!/usr/bin/env python3
"""Formalizer · the shape of the Riemann-hypothesis proof: writes frontend/public/rh/proof-map-*.json.

    # in WSL / Linux, once (≈1.6 GB; the published source is the repository's first commit):
    git clone --depth 1 https://github.com/leanprover-community/riemann-hypothesis ~/fz/rh
    git -C ~/fz/rh fetch --depth 1 origin 40e56bab026552e089d7afcfeff08d2defb9c005
    # then, from the repo root (Python 3.10+, standard library only):
    python3 scripts/rh_map/generate.py --repo ~/fz/rh --rev 40e56bab026552e089d7afcfeff08d2defb9c005 \
        --mathlib ~/fz/mathproj/.lake/packages/mathlib

The Lean code is read as TEXT only, straight from git objects (`git ls-tree`, `git cat-file --batch`): nothing is
checked out, built or run (one does not run untrusted Lean code: tactics and `#eval` execute at build time). For each
.lean file at the given commit it records the module name, its line count and its imports (the `import` lines of the
header); it then

* groups the files into "districts" (directories): it starts from the top-level folders and keeps splitting the
  largest district into its subdirectories (the files directly in it stay as their own district) until there are
  about --target districts, so big folders get a finer grid and small ones stay whole;
* counts, for every pair of districts, how many file-level imports go from one to the other (the weighted links);
* records per district its lines, files, how many of its files import Mathlib directly, and its largest files;
* marks the statement file (src/Statements.lean: the five claims, importing only Mathlib; the re-check's
  src/Challenge.lean, added later, restates it for the comparator) and the main theorem's file (src/Main.lean);
* counts the files reachable from Main.lean along imports (what the proof actually uses, transitively).

With --mathlib it also counts Mathlib's own .lean files and lines (for the scale comparison on the page).

The refactored proof of 25 Nov 2026 (lsernau/grh-lean) keeps each edition in its own folder; --root reads one of them
as if it were the repository root, and --repo-name records where it came from:

    git clone --depth 1 https://github.com/lsernau/grh-lean ~/fz/grh-lean
    python3 scripts/rh_map/generate.py --repo ~/fz/grh-lean --rev HEAD --root grh-compact \
        --repo-name lsernau/grh-lean --target 140 --out frontend/public/rh/proof-map-compact.json
    python3 scripts/rh_map/generate.py --repo ~/fz/grh-lean --rev HEAD --root grh \
        --repo-name lsernau/grh-lean --target 160 --out frontend/public/rh/proof-map-readable.json
The per-file table goes to --files-out (TSV, not shipped). Output: compact JSON arrays, ≈1–2 MB, gzip-friendly.
"""

from __future__ import annotations

import argparse
import collections
import datetime
import heapq
import json
import re
import subprocess
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
# the original source's map; the refactored editions go to …/proof-map-compact.json and …/proof-map-readable.json
OUT = ROOT / "frontend" / "public" / "rh" / "proof-map-original.json"
STATEMENT = "src/Statements.lean"
MAIN = "src/Main.lean"
TOP_FILES = 4

IMPORT_RE = re.compile(rb"^\s*(?:public\s+|private\s+)?(?:meta\s+)?import\s+(?:all\s+)?(.+?)\s*$")


def git(repo: Path, *args: str) -> bytes:
    return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True).stdout


def list_files(repo: Path, rev: str, root: str = "") -> list[tuple[str, str, int]]:
    """[(path, blob id, size)] of every .lean file at `rev` (under `root`, with that prefix removed)."""
    out = []
    prefix = root.strip("/") + "/" if root.strip("/") else ""
    for entry in git(repo, "ls-tree", "-r", "-l", "-z", rev).split(b"\0"):
        if not entry:
            continue
        meta, path = entry.split(b"\t", 1)
        _mode, kind, sha, size = meta.split()
        p = path.decode("utf-8")
        if kind == b"blob" and p.endswith(".lean") and p.startswith(prefix):
            out.append((p.removeprefix(prefix), sha.decode(), int(size)))
    return out


def read_blobs(repo: Path, shas: list[str]):
    """Yield the contents of the blobs, in order, through one `git cat-file --batch` process."""
    proc = subprocess.Popen(
        ["git", "-C", str(repo), "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE
    )
    assert proc.stdin and proc.stdout

    def feed() -> None:
        for s in shas:
            proc.stdin.write(s.encode() + b"\n")
        proc.stdin.close()

    threading.Thread(target=feed, daemon=True).start()
    for _ in shas:
        header = proc.stdout.readline().split()
        size = int(header[2])
        data = proc.stdout.read(size)
        proc.stdout.read(1)  # the newline after each object
        yield data
    proc.wait()


def strip_comments(text: bytes) -> bytes:
    text = re.sub(rb"/-.*?-/", b"", text, flags=re.DOTALL)
    return re.sub(rb"--[^\n]*", b"", text)


def header_imports(data: bytes) -> list[str]:
    """The modules imported by the file's header (the `import` lines before the first other command)."""
    head = strip_comments(data[:200_000])
    out = []
    for line in head.split(b"\n"):
        s = line.strip()
        if not s or s in (b"module", b"prelude"):
            continue
        m = IMPORT_RE.match(s)
        if not m:
            break
        for tok in m.group(1).split():
            out.append(tok.decode("utf-8", "replace").replace("«", "").replace("»", ""))
    return out


def module_of(path: str) -> str:
    p = path.removeprefix("src/")
    return p[: -len(".lean")].replace("/", ".")


def count_lines(data: bytes) -> int:
    """Lines as `wc -l` counts them (newline characters)."""
    return data.count(b"\n")


def mathlib_size(path: Path) -> dict:
    files = lines = 0
    for f in (path / "Mathlib").rglob("*.lean"):
        files += 1
        lines += f.read_bytes().count(b"\n")
    rev = ""
    try:
        rev = git(path, "describe", "--tags", "--always").decode().strip()
    except subprocess.CalledProcessError:
        pass
    return {"files": files, "lines": lines, "version": rev}


def make_districts(files: list[dict], target: int) -> dict[str, str]:
    """Directory of each file → its district, splitting the largest districts first until about `target` remain."""
    # lines under each directory, and its subdirectories
    lines_under: collections.Counter[str] = collections.Counter()
    children: dict[str, set[str]] = collections.defaultdict(set)
    direct: collections.Counter[str] = collections.Counter()
    for f in files:
        parts = f["path"].split("/")[:-1]
        direct["/".join(parts)] += f["lines"]
        for k in range(1, len(parts) + 1):
            d = "/".join(parts[:k])
            lines_under[d] += f["lines"]
            if k > 1:
                children["/".join(parts[: k - 1])].add(d)
    start = sorted(children["src"]) if "src" in children else sorted({p.split("/")[0] for p in lines_under})
    live = set(start)
    residual: set[str] = set()  # districts holding only the files directly in a directory that was split
    heap = [(-lines_under[d], d) for d in start if children.get(d)]
    heapq.heapify(heap)
    while heap and len(live) + len(residual) < target:
        _, d = heapq.heappop(heap)
        kids = children.get(d, set())
        grow = len(kids) - 1 + (1 if direct[d] else 0)
        if len(live) + len(residual) + grow > target * 1.15:
            continue
        live.discard(d)
        if direct[d]:
            residual.add(d)
        for k in kids:
            live.add(k)
            if children.get(k):
                heapq.heappush(heap, (-lines_under[k], k))

    def district(dirpath: str) -> str:
        if dirpath in residual:
            return dirpath
        parts = dirpath.split("/")
        for k in range(len(parts), 0, -1):
            d = "/".join(parts[:k])
            if d in live:
                return d
        return dirpath or "src"

    return {d: district(d) for d in {"/".join(f["path"].split("/")[:-1]) for f in files}}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", type=Path, required=True, help="a clone of leanprover-community/riemann-hypothesis")
    ap.add_argument("--rev", default="40e56bab026552e089d7afcfeff08d2defb9c005", help="the commit to read")
    ap.add_argument("--target", type=int, default=900, help="about how many districts")
    ap.add_argument("--root", default="", help="read only this folder of the repository, as if it were the root")
    ap.add_argument("--repo-name", default="leanprover-community/riemann-hypothesis", help="owner/name, for links")
    ap.add_argument("--mathlib", type=Path, help="a Mathlib checkout, to count its files and lines")
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--files-out", type=Path, help="also write the per-file table (path, module, lines, imports)")
    args = ap.parse_args()
    repo = args.repo.expanduser()

    commit = git(repo, "rev-parse", args.rev).decode().strip()
    commit_date = git(repo, "show", "-s", "--format=%cI", commit).decode().strip()
    entries = list_files(repo, commit, args.root)
    if args.root:  # an edition folder: its sources only (src/), not scripts/ or the comparator's Challenge.lean
        entries = [e for e in entries if e[0].startswith("src/")]
    print(f"{commit[:8]}: {len(entries)} .lean files", flush=True)
    files = []
    for (path, _sha, size), data in zip(entries, read_blobs(repo, [e[1] for e in entries])):
        imps = header_imports(data)
        files.append(
            {"path": path, "module": module_of(path), "lines": count_lines(data), "bytes": size, "imports": imps}
        )
    total_lines = sum(f["lines"] for f in files)
    print(f"{total_lines:,} lines", flush=True)
    if args.files_out:
        with args.files_out.expanduser().open("w", encoding="utf-8") as fh:
            for f in files:
                fh.write(f"{f['path']}\t{f['module']}\t{f['lines']}\t{' '.join(f['imports'])}\n")

    by_module = {f["module"]: i for i, f in enumerate(files)}
    # the statement and the main theorem are single files: they get districts of their own, so they show as stars
    special = {p: p[: -len(".lean")] for p in (STATEMENT, MAIN) if module_of(p) in by_module}
    dirs = make_districts([f for f in files if f["path"] not in special], args.target)
    names = [special.get(f["path"]) or dirs["/".join(f["path"].split("/")[:-1])] for f in files]
    dnames = sorted(set(names))
    didx = {d: i for i, d in enumerate(dnames)}
    fd = [didx[n] for n in names]

    links: collections.Counter[tuple[int, int]] = collections.Counter()
    internal = external = mathlib_files = 0
    adj: list[list[int]] = []
    for i, f in enumerate(files):
        out = []
        direct_mathlib = False
        for m in f["imports"]:
            j = by_module.get(m)
            if j is None:
                external += 1
                direct_mathlib |= m == "Mathlib" or m.startswith("Mathlib.")
                continue
            internal += 1
            out.append(j)
            if fd[i] != fd[j]:
                links[(fd[i], fd[j])] += 1
        f["mathlib"] = direct_mathlib
        mathlib_files += direct_mathlib
        adj.append(out)

    # what Main.lean reaches along imports (itself included)
    main_i = by_module.get(module_of(MAIN))
    seen = {main_i} if main_i is not None else set()
    stack = list(seen)
    while stack:
        for j in adj[stack.pop()]:
            if j not in seen:
                seen.add(j)
                stack.append(j)
    reach_lines = sum(files[j]["lines"] for j in seen)

    def top_of(d: str) -> str:
        parts = d.split("/")
        return parts[1] if parts[0] == "src" and len(parts) > 1 else parts[0]

    tops = sorted({top_of(d) for d in dnames})
    tidx = {t: i for i, t in enumerate(tops)}
    members: dict[int, list[int]] = collections.defaultdict(list)
    for i, d in enumerate(fd):
        members[d].append(i)
    rows = []
    for k, d in enumerate(dnames):
        mem = members[k]
        flags = 0
        if any(files[i]["path"] == STATEMENT for i in mem):
            flags |= 1
        if any(files[i]["path"] == MAIN for i in mem):
            flags |= 2
        if d in special.values():
            flags |= 4
        biggest = sorted(mem, key=lambda i: -files[i]["lines"])[:TOP_FILES]
        prefix = d + "/"
        rows.append(
            [
                d.removeprefix("src/"),
                tidx[top_of(d)],
                sum(files[i]["lines"] for i in mem),
                len(mem),
                sum(files[i]["mathlib"] for i in mem),
                sum(1 for i in mem if i in seen),
                flags,
                [[files[i]["path"].removeprefix(prefix).removeprefix("src/"), files[i]["lines"]] for i in biggest],
            ]
        )
    link_rows = [[a, b, w] for (a, b), w in sorted(links.items())]

    doc = {
        "meta": {
            "repo": args.repo_name,
            "root": args.root.strip("/"),
            "commit": commit,
            "commitDate": commit_date,
            "fetched": datetime.date.today().isoformat(),
            "files": len(files),
            "lines": total_lines,
            "bytes": sum(f["bytes"] for f in files),
            "mathlibFiles": mathlib_files,
            "importsInternal": internal,
            "importsExternal": external,
            "reachable": {"files": len(seen), "lines": reach_lines},
            "statement": STATEMENT,
            "main": MAIN,
            "districts": len(rows),
            "links": len(link_rows),
            "mathlib": mathlib_size(args.mathlib.expanduser()) if args.mathlib else None,
        },
        "fields": {
            "districts": ["name", "top", "lines", "files", "mathlibFiles", "reachableFiles", "flags", "topFiles"],
            "flags": {"1": "statement", "2": "main theorem", "4": "single file"},
            "links": ["from", "to", "imports"],
        },
        "tops": tops,
        "districts": rows,
        "links": link_rows,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {args.out}: {len(rows)} districts, {len(link_rows)} links, {args.out.stat().st_size / 1e6:.2f} MB")
    print(json.dumps(doc["meta"], indent=1))


if __name__ == "__main__":
    main()
