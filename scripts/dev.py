"""Start the Lean runner and the Vite dev server together; Ctrl+C stops both (as Tensorizer's scripts/dev.py).

    pixi run dev        →  open http://localhost:5180  (runner on :8790)

- The runner restarts when backend/ or problems/ change (watched here, not with uvicorn --reload, whose reloader can
  hang on Windows and keep serving old code). Lean workers start again, so the first check after a restart is slower.
- Vite updates the page live (React Fast Refresh).
- If either server crashes it is restarted (after printing its exit code).
- Lean comes from elan: ~/.elan/bin is put on PATH when it exists, so `lake` is found even if the shell doesn't have it.
"""

from __future__ import annotations

import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NPM = "npm.cmd" if os.name == "nt" else "npm"
PORT = 5180  # the runner accepts pages from localhost:5170-5199
WATCHED = [(ROOT / "backend", "*.py"), (ROOT / "problems", "*.json")]
ELAN = Path.home() / ".elan" / "bin"
ENV = {**os.environ, "PATH": f"{ELAN}{os.pathsep}{os.environ.get('PATH', '')}" if ELAN.is_dir() else os.environ["PATH"]}

SERVERS = {
    "runner": {"args": [sys.executable, "-m", "backend.serve"], "cwd": ROOT},
    # its own port (other learnkit sites' dev servers use 5173); Vite takes the next one if it is busy and says so
    "web": {"args": [NPM, "run", "dev", "--", "--port", str(PORT)], "cwd": ROOT / "frontend"},
}


def start(name: str) -> subprocess.Popen:
    spec = SERVERS[name]
    return subprocess.Popen(spec["args"], cwd=spec["cwd"], env=ENV)


def stop(proc: subprocess.Popen) -> None:
    if proc.poll() is None:
        if os.name == "nt":  # the whole tree, Lean workers included
            subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True, check=False)
        else:
            proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


def snapshot() -> dict[Path, float]:
    return {f: f.stat().st_mtime for d, pattern in WATCHED for f in d.rglob(pattern)}


def port_busy(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def main() -> None:
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt))  # kill: stop both, as Ctrl+C
    # the site imports @learnkit/web from the vendor/learnkit submodule; a plain clone leaves it empty and the page
    # renders nothing (Vite: "Failed to resolve import @learnkit/web")
    if not (ROOT / "vendor" / "learnkit" / "web" / "src" / "index.ts").is_file():
        print("[dev] vendor/learnkit is empty; checking out the submodule (git submodule update --init)", flush=True)
        subprocess.run(["git", "submodule", "update", "--init"], cwd=ROOT, check=True)
    if not (ROOT / "frontend" / "node_modules").is_dir():
        subprocess.run([NPM, "install", "--no-audit", "--no-fund"], cwd=ROOT / "frontend", check=True)
    if port_busy(8790):  # a runner started by hand: use it, and leave it alone
        print("[dev] a runner is already on :8790; using it (stop it to let dev restart the runner on changes)")
        del SERVERS["runner"]
    procs = {name: start(name) for name in SERVERS}
    seen = snapshot()
    print(f"\n  Formalizer dev: http://localhost:{PORT}  (runner on :8790)  — Ctrl+C to stop\n", flush=True)
    try:
        while True:
            time.sleep(1)
            now = snapshot()
            if now != seen and "runner" in procs:
                seen = now
                print("\n[dev] runner code changed — restarting the runner\n", flush=True)
                stop(procs["runner"])
                procs["runner"] = start("runner")
                continue
            for name, proc in procs.items():
                if proc.poll() is not None:
                    print(f"\n[dev] {name} exited with code {proc.returncode} — restarting in 2 s\n", flush=True)
                    time.sleep(2)
                    procs[name] = start(name)
    except KeyboardInterrupt:
        pass
    finally:
        for proc in procs.values():
            stop(proc)


if __name__ == "__main__":
    main()
