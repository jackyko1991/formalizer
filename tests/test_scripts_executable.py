"""A script that starts with a shebang must be committed executable (ruff's EXE001 flags it on Linux CI, but Windows
has no executable bit, so check git's index instead, which works everywhere)."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_shebang_scripts_are_executable_in_git():
    listing = subprocess.run(
        ["git", "ls-files", "-s", "--", "*.py"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout
    bad = []
    for line in listing.splitlines():
        mode, _, _, path = line.split(maxsplit=3)
        file = ROOT / path
        if file.is_file() and file.read_text(encoding="utf-8", errors="ignore").startswith("#!") and mode != "100755":
            bad.append(path)
    assert not bad, f"run `git update-index --chmod=+x` on: {bad}"
