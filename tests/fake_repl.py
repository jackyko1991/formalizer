"""A stand-in for the Lean REPL that speaks its protocol, for testing the pool without Lean.

Commands: "SLEEP" never answers, "CRASH" exits, "PID" answers with this process id, anything else answers {"env": n}.
"""

import json
import os
import sys
import time

env = -1
buffer = []
for line in sys.stdin:
    if line.strip():
        buffer.append(line)
        continue
    if not buffer:
        continue
    request = json.loads("".join(buffer))
    buffer = []
    cmd = request.get("cmd", "")
    if cmd == "SLEEP":
        time.sleep(3600)
    if cmd == "CRASH":
        sys.exit(3)
    env += 1
    reply = {"env": env, "pid": os.getpid()} if cmd == "PID" else {"env": env}
    sys.stdout.write(json.dumps(reply, indent=1) + "\n\n")
    sys.stdout.flush()
