"""Start the local Lean runner: python -m backend.serve [--port 8790]"""

from __future__ import annotations

import argparse

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Formalizer's local Lean runner")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8790)
    args = parser.parse_args()
    print(f"Formalizer runner on http://{args.host}:{args.port} (open the site and choose This computer)")
    uvicorn.run("backend.app:app", host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
