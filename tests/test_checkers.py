"""The independent checkers (backend/checkers.py): the frozen statement is the test, the checkers are its runner.

Without Lean: the static scan (every forbidden pattern, the "redefine ^ to mean 37" trick), statement-match's
comparison, the API's shape with a stand-in Lean, the Full checkers' detection (not available on Windows or macOS)
and their adapters run against fake programs, and every problem's reference solution passing the static checker.
With real Lean (skipped when lake or the built REPL is missing): Lite-runner problems' solutions also pass
kernel+axioms and statement-match, and the ^ trick that fools the kernel check is caught.
"""

import asyncio
import json
import re
import shutil
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend import checkers
from backend.app import CheckRequest, run_check
from backend.checkers import (
    EXTERNAL,
    blank_comments_and_strings,
    compare_fingerprints,
    parse_fingerprints,
    resolve,
    static_scan,
)
from tests.test_runner import client  # noqa: F401 (the shared runner fixture)

ROOT = Path(__file__).resolve().parents[1]
PROBLEMS = [
    p
    for f in sorted((ROOT / "problems").glob("*.json"))
    if f.stem != "collections"
    for p in json.loads(f.read_text(encoding="utf-8"))
]
_BIN = ROOT / "lean" / ".lake" / "packages" / "REPL" / ".lake" / "build" / "bin"
HAS_LEAN = bool(shutil.which("lake")) and ((_BIN / "repl").exists() or (_BIN / "repl.exe").exists())
needs_lean = pytest.mark.skipif(not HAS_LEAN, reason="needs lake and `pixi run lean-build`")

POW = "theorem two_pow : 2 ^ 3 = 37"
POW_CHALLENGE = f"{POW} := by\n  sorry\n"
# the trick: `^` made to mean 37 before the statement; the statement's text is untouched and the kernel accepts it
POW_CHEAT = f"macro_rules | `($_ ^ $_) => `(37)\n\n{POW} := rfl\n"


def challenge_of(p: dict) -> str:
    files = [f["code"] if f["code"].endswith("\n") else f["code"] + "\n" for f in p.get("files") or []]
    return "".join(files) + p["start"]


def solution_of(p: dict) -> str:
    files = [f["code"] if f["code"].endswith("\n") else f["code"] + "\n" for f in p.get("files") or []]
    return "".join(files) + p["solution"]


# --- static ----------------------------------------------------------------------------------------------------------

HELLO = "theorem hello : 2 + 2 = 4"


@pytest.mark.parametrize(
    "line",
    [
        "  sorry",
        "  admit",
        "  native_decide",
        "  decide +native",
        "  exact Lean.ofReduceBool _ _ rfl",
    ],
)
def test_static_refuses_escape_hatches_in_the_proof(line):
    r = static_scan(f"{HELLO} := by\n{line}\n", [HELLO])
    assert r["verdict"] == "fail" and "line 2" in r["message"], r


@pytest.mark.parametrize(
    "extra",
    [
        "axiom cheat : 2 + 2 = 4",
        "@[implemented_by id] def f (n : Nat) : Nat := n",
        '@[extern "f"] def g (n : Nat) : Nat := n',
        "unsafe def h : Nat := 0",
        "opaque k : Nat",
        "set_option debug.skipKernelTC true",
        "run_cmd pure ()",
        "#eval 1",
        "#exit",
    ],
)
def test_static_refuses_forbidden_commands(extra):
    r = static_scan(f"{extra}\n\n{HELLO} := by\n  rfl\n", [HELLO])
    assert r["verdict"] == "fail", (extra, r)


def test_static_passes_an_honest_proof_and_ignores_comments_and_strings():
    code = f'-- no sorry here\n/- nor admit /- nested axiom -/ here -/\n{HELLO} := by\n  rfl\n\ndef s := "sorry"\n'
    r = static_scan(code, [HELLO])
    assert r["verdict"] == "pass", r
    assert "sorry" not in blank_comments_and_strings(code) and blank_comments_and_strings(code).count("\n") == 6


def test_static_needs_the_statement_in_the_code_not_in_a_comment():
    r = static_scan(f"-- {HELLO}\ntheorem hello : 1 = 1 := rfl\n", [HELLO])
    assert r["verdict"] == "fail" and "was changed" in r["message"]
    spaced = static_scan("theorem hello :\n    2 + 2 = 4 := rfl\n", [HELLO])  # whitespace doesn't matter
    assert spaced["verdict"] == "pass", spaced


def test_static_catches_the_pow_trick_with_or_without_a_challenge():
    for challenge in (POW_CHALLENGE, None):
        r = static_scan(POW_CHEAT, [POW], challenge)
        assert r["verdict"] == "fail" and "macro_rules" in r["message"], r


@pytest.mark.parametrize(
    "prelude",
    [
        'local notation:65 a " + " b => a * b',
        'infixl:65 " + " => HMul.hMul',
        "instance (priority := high) myAdd : Add Nat := ⟨fun _ _ => 4⟩",
        "@[instance] def myAdd : Add Nat := ⟨fun _ _ => 4⟩",
        'syntax "foo" : term',
        'elab "foo" : term => return Lean.mkNatLit 4',
    ],
)
def test_static_refuses_notation_and_instances_before_the_statement(prelude):
    assert static_scan(f"{prelude}\n\n{HELLO} := by\n  rfl\n", [HELLO])["verdict"] == "fail", prelude
    # after the statement they can't change it (a proof's own helpers)
    assert static_scan(f"{HELLO} := by\n  rfl\n\n{prelude}\n", [HELLO])["verdict"] == "pass", prelude


GAUSS = "theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1)"
SUMTO = "def sumTo : Nat → Nat\n  | 0 => 0\n  | n + 1 => sumTo n + (n + 1)\n"


def test_static_compares_definitions_with_the_challenge():
    challenge = f"{SUMTO}\n{GAUSS} := by\n  sorry\n"
    honest = f"{SUMTO}\ntheorem helper : True := trivial\n\n{GAUSS} := by\n  sorry_free_proof\n"
    assert static_scan(honest, [GAUSS], challenge)["verdict"] == "pass"
    changed = honest.replace("sumTo n + (n + 1)", "0")
    r = static_scan(changed, [GAUSS], challenge)
    assert r["verdict"] == "fail" and "`sumTo` is defined differently" in r["message"]
    hidden = f"variable (h : False)\ninclude h\n\n{honest}"
    assert static_scan(hidden, [GAUSS], challenge)["verdict"] == "fail"
    opened = f"open Nat in\n{honest}"
    assert static_scan(opened, [GAUSS], challenge)["verdict"] == "fail"
    # without the challenge the definitions can't be compared: said so, not refused
    loose = static_scan(changed, [GAUSS])
    assert loose["verdict"] == "pass" and "not compared" in loose["message"]


# --- every problem: the reference solution passes static, the start file is red ---------------------------------------


@pytest.mark.parametrize("p", PROBLEMS, ids=[p["id"] for p in PROBLEMS])
def test_every_solution_passes_static_and_every_start_is_red(p):
    """Pure Python, any runner (Lite or Full): the solution is green, the starting file (with `sorry`) is red."""
    done = static_scan(solution_of(p), p["statements"], challenge_of(p))
    assert done["verdict"] == "pass", done
    assert static_scan(solution_of(p), p["statements"])["verdict"] == "pass"
    assert static_scan(challenge_of(p), p["statements"], challenge_of(p))["verdict"] == "fail"


# --- statement-match's comparison ---------------------------------------------------------------------------------


def test_fingerprints_are_parsed_and_compared():
    nonce = "abc"
    reply = {
        "messages": [
            {"severity": "info", "data": 'fz-abc t [["t","theorem","[]","","(C Eq [1])"],["f","def","[]","","T","V"]]'},
            {"severity": "info", "data": "fz-abc u null"},
            {"severity": "info", "data": "something else"},
        ]
    }
    fp = parse_fingerprints(reply, nonce)
    assert fp["u"] is None and fp["t"][1][0] == "f"
    assert compare_fingerprints(fp, fp, ["t"])["verdict"] == "pass"
    body = {"t": [fp["t"][0], ["f", "def", "[]", "", "T", "OTHER"]]}
    r = compare_fingerprints(fp, body, ["t"])
    assert r["verdict"] == "fail" and "f" in r["message"]
    root = {"t": [["t", "theorem", "[]", "", "(C Ne [1])"]]}
    assert "different Lean term" in compare_fingerprints(fp, root, ["t"])["message"]
    axiom = {"t": [["t", "axiom", "[]", "", "(C Eq [1])"]]}
    assert "axiom" in compare_fingerprints(fp, axiom, ["t"])["message"]
    assert compare_fingerprints(fp, {}, ["t"])["verdict"] == "fail"
    assert compare_fingerprints(fp, fp, ["u"])["verdict"] == "unavailable"


def test_the_fingerprint_command_has_a_fresh_name_each_time():
    a, na = checkers.fingerprint_command(["t"])
    _, nb = checkers.fingerprint_command(["t"])
    assert na != nb and f"#fz_statement_{na} t" in a and "NONCE" not in a


def test_checker_names():
    assert resolve(None) == list(checkers.DEFAULT) and "leanchecker" not in checkers.DEFAULT
    assert resolve(["static", "static", "nanoda"]) == ["static", "nanoda"]
    with pytest.raises(ValueError):
        resolve(["static", "vibes"])


# --- the API with a stand-in Lean -----------------------------------------------------------------------------------


class FakeLean:
    """Answers like the REPL: the theorems' axioms after the code, and fingerprints for the `then` command (the
    same rows on both sides, unless `differ` names a theorem whose type should look different in the solution)."""

    def __init__(self, differ: str = ""):
        self.differ = differ
        self.calls: list[str] = []

    async def check(self, code: str, timeout_s: float = 10, then: str | None = None) -> dict:
        self.calls.append(code)
        lines = code.split("\n")
        messages = []
        for i, line in enumerate(lines, 1):
            m = re.match(r"#print axioms (\S+)", line)
            if m:
                messages.append({"severity": "info", "pos": {"line": i, "column": 0},
                                 "data": f"'{m.group(1)}' does not depend on any axioms"})  # fmt: skip
        reply: dict = {"messages": messages, "env": 1}
        if then is not None:
            nonce = re.search(r"(?m)^#fz_statement_(\w+) (.*)$", then)
            names = nonce.group(2).split()
            solution = "#print axioms" in code
            reply["then"] = {
                "messages": [
                    {
                        "severity": "info",
                        "data": f"fz-{nonce.group(1)} {n} "
                        + json.dumps([[n, "theorem", "[]", "", "OTHER" if solution and n == self.differ else "T"]]),
                    }
                    for n in names
                ]
            }
        return reply


def run(req: CheckRequest, lean) -> dict:
    from backend import app

    app._CHALLENGES.clear()  # the challenge cache must not keep the stand-in's answers for the real Lean tests
    try:
        return asyncio.run(run_check(req, lean, 10))
    finally:
        app._CHALLENGES.clear()


def test_api_shape_with_a_stand_in_lean():
    code = f"{HELLO} := by\n  rfl\n"
    out = run(CheckRequest(code=code, theorems=["hello"], statements=[HELLO]), FakeLean())
    assert out["verdict"] == "proved"
    assert [c["id"] for c in out["checks"]] == list(checkers.DEFAULT)
    assert all(set(c) == {"id", "verdict", "message", "ms"} for c in out["checks"])
    assert {c["id"]: c["verdict"] for c in out["checks"]} == {
        "static": "pass",
        "kernel+axioms": "pass",
        "statement-match": "pass",
    }
    caught = run(CheckRequest(code=code, theorems=["hello"], statements=[HELLO]), FakeLean(differ="hello"))
    assert {c["id"]: c["verdict"] for c in caught["checks"]}["statement-match"] == "fail"
    only = run(CheckRequest(code=code, theorems=["hello"], statements=[HELLO], checkers=["static"]), FakeLean())
    assert [c["id"] for c in only["checks"]] == ["static"]


def test_api_without_lean_early_answers_and_unknown_checkers():
    from backend.app import app

    c = TestClient(app)  # no `with`: the Lean pool is not started; these answers never reach it
    mathlib = c.post("/api/check", json={"code": "import Mathlib\n" + HELLO + " := by\n  sorry\n"}).json()
    if mathlib["verdict"] == "needs-runner":  # the Lite runner
        assert {x["id"]: x["verdict"] for x in mathlib["checks"]} == {
            "static": "fail",
            "kernel+axioms": "unavailable",
            "statement-match": "unavailable",
        }
    changed = c.post("/api/check", json={"code": "theorem hello : 1 = 1 := rfl", "statements": [HELLO]}).json()
    assert changed["verdict"] == "error"
    assert [(x["id"], x["verdict"]) for x in changed["checks"]] == [
        ("static", "fail"),
        ("kernel+axioms", "fail"),
        ("statement-match", "unavailable"),
    ]
    assert c.post("/api/check", json={"code": "x", "checkers": ["vibes"]}).status_code == 422
    health = c.get("/api/health").json()
    listed = {x["id"]: x for x in health["checkers"]}
    assert set(listed) == set(checkers.LITE + checkers.FULL) and health["os"] == sys.platform
    assert listed["static"]["available"] and listed["static"]["tier"] == "lite" and listed["nanoda"]["tier"] == "full"
    if not sys.platform.startswith("linux"):
        assert not any(listed[f]["available"] for f in checkers.FULL)
        assert "not available on this OS" in listed["comparator"]["reason"]


def test_jobs_accept_checkers():
    from backend.app import JobRequest

    req = JobRequest(code="x", checkers=["static", "leanchecker"], challenge="y", label="p")
    assert req.checkers == ["static", "leanchecker"] and req.challenge == "y"
    with pytest.raises(HTTPException):
        asyncio.run(run_check(CheckRequest(code="x", checkers=["nope"]), FakeLean(), 1))


# --- the Full checkers: detection and adapters with fake programs ----------------------------------------------------

FAKE = """import json, os, sys
log = os.environ["FAKE_LOG"]
with open(log, "a", encoding="utf-8") as f:
    f.write(json.dumps({"name": sys.argv[1], "argv": sys.argv[2:], "lean_path": os.environ.get("LEAN_PATH", "")}) + "\\n")
if sys.argv[1] == "lean4export":
    print('{"export": "' + sys.argv[-1] + '"}')
for arg in sys.argv[2:]:
    if arg.endswith(".json"):
        with open(arg, encoding="utf-8") as f:
            config = json.load(f)
        with open(log, "a", encoding="utf-8") as f:
            f.write(json.dumps({"config": config}) + "\\n")
print("ok" if os.environ.get("FAKE_FAIL") != sys.argv[1] else "kernel rejects it")
sys.exit(1 if os.environ.get("FAKE_FAIL") == sys.argv[1] else 0)
"""


@pytest.fixture
def fakes(tmp_path, monkeypatch):
    script = tmp_path / "fake.py"
    script.write_text(FAKE, encoding="utf-8")
    log = tmp_path / "log.ndjson"
    monkeypatch.setenv("FAKE_LOG", str(log))
    for name in ("comparator", "nanoda", "lean4lean", "landrun", "lean4export"):
        monkeypatch.setenv(f"FORMALIZER_{name.upper()}_BIN", json.dumps([sys.executable, str(script), name]))
    work = tmp_path / "work"
    work.mkdir()
    (work / f"{checkers.MODULE}.olean").write_bytes(b"")
    (work / f"{checkers.CHALLENGE_MODULE}.olean").write_bytes(b"")

    def entries():
        return [json.loads(x) for x in log.read_text(encoding="utf-8").splitlines()] if log.exists() else []

    return work, entries


def test_full_checkers_are_unavailable_off_linux(fakes):
    for cid, ext in EXTERNAL.items():
        for platform in ("win32", "darwin"):
            ok, why = ext.detect(platform)
            assert not ok and "not available on this OS" in why, cid
        assert ext.detect("linux")[0], cid  # the fakes are found
    rows = {r["id"]: r for r in checkers.status("lite", "win32")}
    assert all(not rows[c]["available"] for c in checkers.FULL)


def test_full_checkers_need_their_programs(monkeypatch):
    for name in ("comparator", "nanoda", "lean4lean", "landrun", "lean4export"):
        monkeypatch.setenv(f"FORMALIZER_{name.upper()}_BIN", "")
    monkeypatch.setenv("PATH", "")
    ok, why = EXTERNAL["nanoda"].detect("linux")
    assert not ok and "nanoda_bin" in why
    monkeypatch.setenv("FORMALIZER_COMPARATOR_BIN", "/opt/comparator")
    ok, why = EXTERNAL["comparator"].detect("linux")
    assert not ok and "landrun" in why and "lean4export" in why


@pytest.mark.parametrize("cid", list(EXTERNAL))
def test_full_adapters_run_their_programs(fakes, cid, monkeypatch):
    work, entries = fakes
    r = asyncio.run(EXTERNAL[cid].run(work, ["t"], work, [], 30, platform="linux"))
    assert r["verdict"] == "pass" and r["id"] == cid, r
    log = entries()
    names = [e["name"] for e in log if "name" in e]
    assert cid in names and str(work) in log[0]["lean_path"]
    configs = [e["config"] for e in log if "config" in e]
    if cid == "comparator":
        assert configs[0]["challenge_module"] == checkers.CHALLENGE_MODULE
        assert configs[0]["solution_module"] == checkers.MODULE and configs[0]["theorem_names"] == ["t"]
        assert configs[0]["permitted_axioms"] == ["propext", "Quot.sound", "Classical.choice"]
    elif cid == "nanoda":
        assert names[0] == "lean4export"  # the export first, then the checker on it
        assert configs[0]["permitted_axioms"] == ["propext", "Quot.sound", "Classical.choice"]
        assert "FzSolution" in (work / f"{checkers.MODULE}.ndjson").read_text(encoding="utf-8")
    else:
        assert log[0]["argv"] == [checkers.MODULE]
    monkeypatch.setenv("FAKE_FAIL", cid)
    failed = asyncio.run(EXTERNAL[cid].run(work, ["t"], work, [], 30, platform="linux"))
    assert failed["verdict"] == "fail" and "kernel rejects it" in failed["message"]


def test_comparator_needs_the_challenge(fakes):
    work, _ = fakes
    (work / f"{checkers.CHALLENGE_MODULE}.olean").unlink()
    r = asyncio.run(EXTERNAL["comparator"].run(work, ["t"], work, [], 30, platform="linux"))
    assert r["verdict"] == "unavailable" and "challenge" in r["message"]


def test_programs_off_linux_are_reported_not_run():
    out = asyncio.run(checkers.run_programs(["nanoda", "lean4lean"], "x", None, ["t"], ROOT, platform="win32"))
    assert [(r["id"], r["verdict"]) for r in out] == [("nanoda", "unavailable"), ("lean4lean", "unavailable")]


# --- with real Lean -----------------------------------------------------------------------------------------------

LITE_PROBLEMS = [p for p in PROBLEMS if p.get("runner", "lite") == "lite"]


def checks(client, code, theorems, statements, challenge, wanted):  # noqa: F811
    r = client.post(
        "/api/check",
        json={
            "code": code,
            "theorems": theorems,
            "statements": statements,
            "challenge": challenge,
            "checkers": wanted,
        },
    )
    assert r.status_code == 200, r.text
    return {c["id"]: c for c in r.json()["checks"]}


@needs_lean
@pytest.mark.parametrize("p", LITE_PROBLEMS, ids=[p["id"] for p in LITE_PROBLEMS])
def test_lite_solutions_pass_the_lean_checkers(client, p):  # noqa: F811
    wanted = ["static", "kernel+axioms", "statement-match"]
    done = checks(client, solution_of(p), p["theorems"], p["statements"], challenge_of(p), wanted)
    assert all(c["verdict"] == "pass" for c in done.values()), done
    start = checks(client, challenge_of(p), p["theorems"], p["statements"], challenge_of(p), wanted)
    assert start["kernel+axioms"]["verdict"] == "fail" and start["statement-match"]["verdict"] == "pass", start


@needs_lean
def test_the_pow_trick_fools_the_kernel_check_but_not_the_others(client):  # noqa: F811
    wanted = ["static", "kernel+axioms", "statement-match"]
    got = checks(client, POW_CHEAT, ["two_pow"], [POW], POW_CHALLENGE, wanted)
    assert got["kernel+axioms"]["verdict"] == "pass"  # 37 = 37 by rfl: the kernel is right about what it was given
    assert got["static"]["verdict"] == "fail" and got["statement-match"]["verdict"] == "fail", got
    changed_def = solution_of(by_id("gauss")).replace("sumTo n + (n + 1)", "sumTo n + (n + 1) + 0")
    p = by_id("gauss")
    got = checks(client, changed_def, p["theorems"], p["statements"], challenge_of(p), ["statement-match"])
    assert got["statement-match"]["verdict"] == "fail" and "sumTo" in got["statement-match"]["message"], got


def by_id(pid: str) -> dict:
    return next(p for p in PROBLEMS if p["id"] == pid)


@needs_lean
def test_leanchecker_replays_a_solution_and_refuses_a_sorry(client):  # noqa: F811
    p = by_id("gauss")
    done = checks(client, solution_of(p), p["theorems"], p["statements"], challenge_of(p), ["leanchecker"])
    assert done["leanchecker"]["verdict"] == "pass", done
    start = checks(client, challenge_of(p), p["theorems"], p["statements"], challenge_of(p), ["leanchecker"])
    assert start["leanchecker"]["verdict"] == "fail" and "sorry" in start["leanchecker"]["message"]


def test_mcp_check_proof_passes_checkers_and_the_challenge():
    from backend.mcp import TOOLS, Mcp, load_problems

    seen: list[dict] = []

    async def fake_check(body: dict) -> dict:
        seen.append(body)
        return {"verdict": "proved", "checks": []}

    problems = load_problems()
    server = Mcp(check=fake_check, health=dict, version="test", problems=problems)
    args = {"code": "x", "problem_id": "hello", "checkers": ["static", "leanchecker"]}
    asyncio.run(
        server.reply(
            {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "check_proof", "arguments": args}}
        )
    )
    assert seen[0]["checkers"] == ["static", "leanchecker"] and seen[0]["challenge"] == problems["hello"]["start"]
    schema = next(t for t in TOOLS if t["name"] == "check_proof")["inputSchema"]["properties"]["checkers"]
    assert set(schema["items"]["enum"]) == set(checkers.LITE + checkers.FULL)
