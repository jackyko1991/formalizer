"""Independent checkers: the frozen statement is the test, the checkers are the test runner (red → green).

Each checker answers {id, verdict, message, ms} with verdict pass | fail | unavailable | error (it could not run).

Lite (free, every OS, core Lean is enough):
- static          the solution's text, in Python: the statement is there unchanged (outside comments and strings), no
                  `sorry` / `axiom` / `native_decide` / `implemented_by` / `extern` / `unsafe` / `opaque` /
                  `debug.skipKernelTC` / code run at check time, and nothing before the statement that changes what
                  it means (notation, macros, instances, `open`, `variable`, a changed definition). Best effort: a
                  text scan can't see what a macro expands to, which is why the Lean checkers below exist.
- kernel+axioms   the runner's own check: Lean's kernel accepts the file and the theorems use only propext,
                  Quot.sound and Classical.choice (`#print axioms`).
- statement-match comparator-lite: the challenge (the problem's starting file, with `sorry`) and the solution are
                  elaborated separately, each from the bare header; the theorems' types, and every definition of the
                  file they mention (with its body), must be the same Lean terms. Catches "redefine `^` to mean 37",
                  which a text match can't see. Without a challenge file, the statements alone (`:= by sorry`).
- leanchecker     the solution is compiled to an .olean (`lake env lean -o`) and `lake env leanchecker` replays its
                  declarations through the kernel in a fresh process (ships with every toolchain since v4.28): it
                  catches environment hacking that the REPL's elaborator would hide. Takes seconds, so it is not in
                  the default set. A file that still has `sorry` fails it too (red until the proof is done).

Limits, on purpose: these are "lite" guards for honest mistakes and the common tricks. A file that runs code at check
time is refused by the static scan; the Lean checkers trust the runner's Lean and its imports. Adversarial settings
want comparator (sandboxed, separate export) and a second kernel (nanoda).

Full (Linux, WSL or a cloud runner; the paid tier on the site): external checkers, used when their programs are found
(on PATH, or FORMALIZER_<ID>_BIN = a path or a JSON list such as ["python", "fake.py"]; the same for the helpers
FORMALIZER_LANDRUN_BIN and FORMALIZER_LEAN4EXPORT_BIN). Their exact command lines follow each project's README as of
22 November 2026 (comparator: `lake env comparator config.json`; nanoda: `nanoda_bin config.json` on
`lean4export Mod`; lean4lean: `lake env lean4lean Mod`); they are exercised in tests with fake programs only:
- comparator      github.com/leanprover/comparator: builds challenge and solution in a landrun sandbox, exports them
                  with lean4export, compares statements and axioms and replays the proof (needs landrun, lean4export)
- nanoda          github.com/ammkrn/nanoda_lib: an independent type checker in Rust, on lean4export's output
- lean4lean       github.com/digama0/lean4lean: Lean's kernel written in Lean (derived from the C++ one)
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import re
import secrets
import shutil
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

STANDARD_AXIOMS = ("propext", "Quot.sound", "Classical.choice")
LITE = ("static", "kernel+axioms", "statement-match", "leanchecker")
FULL = ("comparator", "nanoda", "lean4lean")
# what /api/check runs when the request names no checkers: the quick Lite ones (leanchecker builds an .olean)
DEFAULT = ("static", "kernel+axioms", "statement-match")
TITLES = {
    "static": "Static scan",
    "kernel+axioms": "Kernel + axioms",
    "statement-match": "Statement match",
    "leanchecker": "leanchecker",
    "comparator": "Comparator",
    "nanoda": "nanoda",
    "lean4lean": "Lean4Lean",
}
EXTERNAL_TIMEOUT_S = float(os.environ.get("FORMALIZER_EXTERNAL_TIMEOUT_S", "300"))


def result(cid: str, verdict: str, message: str, ms: float = 0) -> dict:
    return {"id": cid, "verdict": verdict, "message": message, "ms": round(ms)}


def resolve(asked: list[str] | None) -> list[str]:
    """The checkers to run, in the order asked (DEFAULT when none are named); ValueError for an unknown one."""
    if asked is None:
        return list(DEFAULT)
    unknown = [c for c in asked if c not in LITE + FULL]
    if unknown:
        raise ValueError(f"unknown checkers: {', '.join(unknown)} (known: {', '.join(LITE + FULL)})")
    return list(dict.fromkeys(asked))


# --- static: the solution's text -------------------------------------------------------------------------------


def blank_comments_and_strings(code: str) -> str:
    """The code with comments (`--`, nested `/- -/`, doc comments) and string / char literals replaced by spaces,
    newlines kept, so offsets and line numbers still match."""
    out = list(code)
    i, n = 0, len(code)

    def blank(a: int, b: int) -> None:
        for k in range(a, min(b, n)):
            if out[k] != "\n":
                out[k] = " "

    while i < n:
        c = code[i]
        if code.startswith("--", i):
            j = code.find("\n", i)
            j = n if j < 0 else j
            blank(i, j)
            i = j
        elif code.startswith("/-", i):
            depth, j = 1, i + 2
            while j < n and depth:
                if code.startswith("/-", j):
                    depth, j = depth + 1, j + 2
                elif code.startswith("-/", j):
                    depth, j = depth - 1, j + 2
                else:
                    j += 1
            blank(i, j)
            i = j
        elif c == '"':
            j = i + 1
            while j < n and code[j] != '"':
                j += 2 if code[j] == "\\" else 1
            blank(i, j + 1)
            i = j + 1
        elif c == "'" and (i == 0 or not (code[i - 1].isalnum() or code[i - 1] in "_'!?.₀₁₂₃₄₅₆₇₈₉")):
            m = re.compile(r"'(?:\\.[^']*|[^\\'\n])'").match(code, i)  # a char literal: 'a', '\n', '\x41'
            if m:
                blank(i, m.end())
                i = m.end()
            else:
                i += 1
        else:
            i += 1
    return "".join(out)


_IDENT = re.compile(r"[A-Za-z_Ͱ-Ͽἀ-῿][\w'!?₀-₉.]*")
_W = r"(?<![\w.'!?])"  # a word starts here (not inside a longer identifier)
_E = r"(?![\w'!?])"
FORBIDDEN: list[tuple[re.Pattern, str]] = [
    (re.compile(_W + r"(?:sorry|admit)" + _E), "`sorry` / `admit`: a proof is missing"),
    (re.compile(_W + r"axiom" + _E), "`axiom`: a new axiom can prove anything"),
    (
        re.compile(r"(?<![\w'])(?:native_decide|ofReduceBool|ofReduceNat|trustCompiler)" + _E + r"|decide\s*\+native"),
        "`native_decide`: trusts the compiler, not the kernel",
    ),
    (re.compile(_W + r"(?:implemented_by|extern)" + _E), "`implemented_by` / `extern`: code the kernel never sees"),
    (re.compile(_W + r"unsafe" + _E), "`unsafe`"),
    (re.compile(_W + r"opaque" + _E), "`opaque`: a constant whose definition the kernel can't see"),
    (re.compile(r"set_option\s+debug\.\S*"), "`set_option debug.…` (e.g. debug.skipKernelTC: skips the kernel)"),
    (
        re.compile(r"(?<![\w.])(?:#eval|#exit|run_cmd|run_elab|run_meta)" + _E),
        "runs code while the file is checked (it can change the environment) or stops checking early",
    ),
]
_STARTS = re.compile(
    r"(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|noncomputable|partial|nonrec|unsafe|local|scoped)\s+)*"
    r"(?P<kind>def|abbrev|theorem|lemma|instance|structure|inductive|class|opaque|axiom|example|notation|infix|infixl|"
    r"infixr|prefix|postfix|macro_rules|macro|syntax|elab_rules|elab|attribute|open|variable|include|omit|namespace|"
    r"section|end|export|set_option|universe|deriving|mutual|initialize|builtin_initialize|declare_syntax_cat|"
    r"#\w+|run_cmd|run_elab|run_meta)(?![\w'])"
)
# blocks that change how a later statement is read (allowed before the statement only if the challenge has them)
REDEFINE = {
    "notation",
    "infix",
    "infixl",
    "infixr",
    "prefix",
    "postfix",
    "macro_rules",
    "macro",
    "syntax",
    "elab_rules",
    "elab",
    "instance",
    "attribute",
    "open",
    "variable",
    "include",
    "omit",
    "namespace",
    "export",
    "deriving",
    "declare_syntax_cat",
    "initialize",
    "builtin_initialize",
}
# without a challenge file there is no reference: only these are refused before the statement
REDEFINE_ALWAYS = {
    "notation",
    "infix",
    "infixl",
    "infixr",
    "prefix",
    "postfix",
    "macro_rules",
    "macro",
    "syntax",
    "elab_rules",
    "elab",
    "instance",
    "declare_syntax_cat",
}
NAMED = {"def", "abbrev", "structure", "inductive", "class", "opaque"}
PROOFS = {"theorem", "lemma", "example"}
_SPACE = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _SPACE.sub(" ", text).strip()


@dataclass
class Block:
    kind: str
    name: str | None
    start: int
    text: str  # normalised


def blocks(clean: str) -> list[Block]:
    """Top-level commands: each starts on a line at column 0 with a command keyword (with its attributes and
    modifiers); the indented lines after it belong to it."""
    found: list[Block] = []
    for m in re.finditer(r"(?m)^(?=\S)", clean):
        head = _STARTS.match(clean, m.start())
        if not head:
            continue
        kind = head.group("kind")
        attrs = " ".join(re.findall(r"@\[([^\]]*)\]", head.group(0)))
        if kind in NAMED and re.search(r"\binstance\b", attrs):
            kind = "instance"  # `@[instance] def …` is an instance
        elif kind in NAMED and re.search(r"\b(?:macro|\w*elab\w*|\w*parser\w*)\b", attrs):
            kind = "macro"  # `@[macro …] def …` / `@[term_elab …] def …` change how text is read
        name = None
        if kind in NAMED | PROOFS | {"instance", "axiom"}:
            after = re.compile(r"\s*(?:\([^)]*\)\s*)?(?P<n>[^\s:({\[⦃]+)").match(clean, head.end())
            if after and _IDENT.fullmatch(after.group("n")):
                name = after.group("n")
        found.append(Block(kind, name, m.start(), ""))
    for i, b in enumerate(found):
        end = found[i + 1].start if i + 1 < len(found) else len(clean)
        b.text = _norm(clean[b.start : end])
    return found


def _line(code: str, offset: int) -> int:
    return code.count("\n", 0, offset) + 1


def _statement_re(statement: str) -> re.Pattern:
    return re.compile(r"\s+".join(re.escape(part) for part in statement.split()))


def static_scan(code: str, statements: list[str], challenge: str | None = None) -> dict:
    """The static checker (pure Python, no Lean): see the module docstring for the rules."""
    started = time.monotonic()
    clean = blank_comments_and_strings(code)
    problems: list[str] = []
    last = -1
    for s in statements:
        m = _statement_re(s).search(clean)
        if not m:
            problems.append(f"the statement `{_norm(s)[:80]}` was changed (or appears only in a comment or string)")
        else:
            last = max(last, m.start())
    for pattern, why in FORBIDDEN:
        for m in pattern.finditer(clean):
            problems.append(f"line {_line(code, m.start())}: {why}")
            break
    notes: list[str] = []
    if last >= 0:
        used = {t.rsplit(".", 1)[-1] for s in statements for t in _IDENT.findall(s)}
        before = [b for b in blocks(clean) if b.start < last and b.kind not in PROOFS]
        if challenge is not None:
            theirs = blocks(blank_comments_and_strings(challenge))
            texts = {b.text for b in theirs}
            names = {b.name for b in theirs if b.name}
            for b in before:
                where = f"line {_line(code, b.start)}"
                if b.text in texts:
                    continue
                if b.name and b.name in names:
                    problems.append(f"{where}: `{b.name}` is defined differently from the problem's")
                elif b.kind in REDEFINE:
                    problems.append(
                        f"{where}: `{b.kind}` before the statement, not in the problem (it can change "
                        "what the statement means)"
                    )
                elif b.name and b.name.rsplit(".", 1)[-1] in used:
                    problems.append(f"{where}: defines `{b.name}`, a name the statement uses")
        else:
            for b in before:
                if b.kind in REDEFINE_ALWAYS:
                    problems.append(
                        f"line {_line(code, b.start)}: `{b.kind}` before the statement (it can change "
                        "what the statement means)"
                    )
            if any(b.kind in NAMED | {"open", "variable", "include", "attribute"} for b in before):
                notes.append("no challenge file: the definitions before the statement were not compared")
    ms = (time.monotonic() - started) * 1000
    if problems:
        return result("static", "fail", "; ".join(dict.fromkeys(problems)), ms)
    message = "statement unchanged; no sorry, axiom or other escape hatch in the text"
    return result("static", "pass", "; ".join([message, *notes]), ms)


# --- kernel + axioms: the runner's own check ---------------------------------------------------------------------


def kernel_axioms(summary: dict, ms: float) -> dict:
    verdict = summary.get("verdict")
    if verdict == "proved":
        used = sorted({a for names in summary.get("axioms", {}).values() for a in names})
        return result(
            "kernel+axioms", "pass", f"the kernel accepts it; axioms: {', '.join(used) if used else 'none'}", ms
        )
    if verdict == "incomplete":
        n = len(summary.get("goals", []))
        return result("kernel+axioms", "fail", f"a `sorry` is left ({n} open goal{'s' * (n != 1)})", ms)
    if verdict == "needs-runner":
        return result("kernel+axioms", "unavailable", summary["errors"][0]["message"], ms)
    errors = summary.get("errors") or [{"line": 0, "message": "Lean rejected it"}]
    first = errors[0]
    where = f"line {first['line']}: " if first.get("line") else ""
    return result("kernel+axioms", "fail", f"{where}{first['message'][:300]}", ms)


# --- statement-match: the theorems' types as Lean terms -------------------------------------------------------------

FINGERPRINT = r"""open Lean Elab Command

/-- An expression as text with de Bruijn indices (binder names and metadata don't count). -/
partial def fzSer_NONCE : Expr → String
  | .bvar i => s!"#{i}"
  | .fvar _ => "?f"
  | .mvar _ => "?m"
  | .sort u => s!"(S {u})"
  | .const n us => s!"(C {n} {us})"
  | .app f a => s!"(A {fzSer_NONCE f} {fzSer_NONCE a})"
  | .lam _ t b bi => s!"(L {repr bi} {fzSer_NONCE t} {fzSer_NONCE b})"
  | .forallE _ t b bi => s!"(P {repr bi} {fzSer_NONCE t} {fzSer_NONCE b})"
  | .letE _ t v b _ => s!"(Z {fzSer_NONCE t} {fzSer_NONCE v} {fzSer_NONCE b})"
  | .lit (.natVal n) => s!"(N {n})"
  | .lit (.strVal s) => s!"(T {s.quote})"
  | .mdata _ e => fzSer_NONCE e
  | .proj s i e => s!"(J {s} {i} {fzSer_NONCE e})"

/-- Each theorem's type and every declaration of this file it reaches (definitions with their bodies; theorems by
their type only), as one JSON info message per theorem. -/
elab "#fz_statement_NONCE " ids:ident* : command => do
  let env ← getEnv
  for id in ids do
    let n? ← try pure (some (← liftCoreM (realizeGlobalConstNoOverload id))) catch _ => pure none
    let some n := n? | logInfo m!"fz-NONCE {id.getId} null"
    let mut todo : Array Name := #[n]
    let mut seen : NameSet := {}
    let mut out : Array Json := #[]
    while todo.size > 0 do
      let c := todo.back!
      todo := todo.pop
      if seen.contains c then continue
      seen := seen.insert c
      if (env.getModuleIdxFor? c).isSome then continue
      let some ci := env.find? c | out := out.push (toJson [c.toString, "unknown"]); continue
      let (kind, vals, extra) : String × Array Expr × String := match ci with
        | .axiomInfo a => ("axiom", #[], s!"{a.isUnsafe}")
        | .defnInfo d => ("def", #[d.value], s!"{repr d.safety}")
        | .thmInfo _ => ("theorem", #[], "")
        | .opaqueInfo d => ("opaque", #[d.value], s!"{d.isUnsafe}")
        | .quotInfo _ => ("quot", #[], "")
        | .inductInfo i => ("inductive", #[], s!"{i.numParams} {i.numIndices} {i.all} {i.ctors} {i.isRec} {i.isUnsafe}")
        | .ctorInfo k => ("ctor", #[], s!"{k.induct} {k.cidx} {k.numParams} {k.numFields} {k.isUnsafe}")
        | .recInfo r => ("rec", #[], s!"{r.all}")
      out := out.push (toJson ([c.toString, kind, toString ci.levelParams, extra, fzSer_NONCE ci.type] ++
        (vals.map fzSer_NONCE).toList))
      for e in #[ci.type] ++ vals do
        for d in e.getUsedConstants do
          todo := todo.push d
      match ci with
      | .inductInfo i => todo := todo ++ i.ctors.toArray
      | .ctorInfo k => todo := todo.push k.induct
      | _ => pure ()
    logInfo m!"fz-NONCE {n} {(toJson out).compress}"
"""


def fingerprint_command(theorems: list[str], nonce: str | None = None) -> tuple[str, str]:
    """The Lean command (run after the checked file, in its environment) that prints each theorem's fingerprint, and
    its nonce: the file can't define or shadow a command whose name it can't know."""
    nonce = nonce or secrets.token_hex(6)
    return FINGERPRINT.replace("NONCE", nonce) + f"\n#fz_statement_{nonce} {' '.join(theorems)}\n", nonce


def parse_fingerprints(reply: dict | None, nonce: str) -> dict[str, list | None]:
    """{theorem: [declaration rows] or None when it does not exist} from the fingerprint command's reply."""
    out: dict[str, list | None] = {}
    marker = f"fz-{nonce} "
    for m in (reply or {}).get("messages", []):
        text = str(m.get("data", ""))
        if not text.startswith(marker):
            continue
        name, _, data = text[len(marker) :].partition(" ")
        try:
            out[name] = None if data == "null" else json.loads(data)
        except ValueError:
            out[name] = None
    return out


def fingerprint_errors(reply: dict | None) -> list[str]:
    return [str(m.get("data", ""))[:200] for m in (reply or {}).get("messages", []) if m.get("severity") == "error"]


def compare_fingerprints(
    challenge: dict[str, list | None], solution: dict[str, list | None], theorems: list[str], ms: float = 0
) -> dict:
    """statement-match's verdict from both sides' fingerprints."""
    missing = [t for t in theorems if challenge.get(t) is None]
    if missing:
        return result("statement-match", "unavailable", f"the challenge does not declare {', '.join(missing)}", ms)
    for t in theorems:
        mine = solution.get(t)
        if mine is None:
            return result(
                "statement-match", "fail", f"`{t}` is not in the solution (or Lean rejected its statement)", ms
            )
        theirs = challenge[t]
        if mine == theirs:
            continue
        if mine and theirs and mine[0][1] != theirs[0][1]:
            return result(
                "statement-match", "fail", f"`{t}` is a {mine[0][1]} here, a {theirs[0][1]} in the problem", ms
            )
        if mine and theirs and mine[0] != theirs[0]:
            return result(
                "statement-match",
                "fail",
                f"`{t}`'s statement elaborates to a different Lean term than "
                "the problem's (notation, an instance or a definition changed what it means)",
                ms,
            )
        a = {row[0]: row for row in theirs}
        b = {row[0]: row for row in mine}
        diff = sorted(k for k in a.keys() | b.keys() if a.get(k) != b.get(k))
        return result(
            "statement-match",
            "fail",
            f"`{t}` depends on definitions that differ from the problem's: {', '.join(diff[:5])}",
            ms,
        )
    deps = sum(len(challenge[t] or []) - 1 for t in theorems)
    extra = f", with the {deps} declaration{'s' * (deps != 1)} of the file they use" if deps else ""
    return result("statement-match", "pass", f"same Lean terms as the problem: {', '.join(theorems)}{extra}", ms)


def statement_names(statements: list[str]) -> list[str]:
    """`theorem foo …` → foo (when the request names no theorems)."""
    out = []
    for s in statements:
        m = re.search(r"(?:theorem|lemma|def|abbrev)\s+([^\s:({\[⦃]+)", s)
        if m:
            out.append(m.group(1))
    return out


def challenge_from_statements(statements: list[str]) -> str:
    return "".join(f"{s} := by\n  sorry\n\n" for s in statements)


# --- leanchecker and the Full checkers: programs run on a compiled module --------------------------------------------

MODULE = "FzSolution"
CHALLENGE_MODULE = "FzChallenge"


async def run_process(cmd: list[str], cwd: Path, timeout_s: float, env: dict | None = None) -> tuple[int, str]:
    """(exit code, output tail); exit code -1 on a timeout (the process is killed), -2 when it can't start."""
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(cwd),
            env={**os.environ, **(env or {})},
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
    except OSError as e:
        return -2, str(e)
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout_s)
    except TimeoutError:
        with contextlib.suppress(ProcessLookupError):
            proc.kill()
        with contextlib.suppress(Exception):
            await asyncio.wait_for(proc.wait(), 5)
        return -1, f"timed out after {timeout_s:g} s"
    except asyncio.CancelledError:
        with contextlib.suppress(ProcessLookupError):
            proc.kill()
        raise
    return proc.returncode or 0, out.decode("utf-8", "replace")[-2000:]


def _lean_path(work: Path) -> dict:
    return {"LEAN_PATH": os.pathsep.join(p for p in (str(work), os.environ.get("LEAN_PATH", "")) if p)}


async def build_module(
    code: str, work: Path, module: str, lean_dir: Path, lake: list[str], timeout_s: float
) -> tuple[str, str]:
    """Compile `code` to work/<module>.olean with the project's Lean (its imports resolve as in the project).
    → ("ok" | "sorry" | "error" | "timeout", output)."""
    src = work / f"{module}.lean"
    src.write_text(code, encoding="utf-8")
    cmd = [
        *lake,
        "env",
        "lean",
        f"--root={work.as_posix()}",
        src.as_posix(),
        "-o",
        (work / f"{module}.olean").as_posix(),
    ]
    code_, out = await run_process(cmd, lean_dir, timeout_s)
    if code_ == -1:
        return "timeout", out
    if code_ != 0 or not (work / f"{module}.olean").exists():
        return "error", out
    return ("sorry" if "declaration uses 'sorry'" in out or "declaration uses `sorry`" in out else "ok"), out


def _tail(out: str, n: int = 300) -> str:
    lines = [ln for ln in out.strip().splitlines() if ln.strip()]
    return (" · ".join(lines[-3:]))[-n:] if lines else "no output"


def lake_available() -> bool:
    return shutil.which("lake") is not None


def leanchecker_available() -> tuple[bool, str]:
    if not lake_available():
        return False, "needs lake (elan) on PATH"
    return True, "ships with the Lean toolchain (v4.28 and later)"


async def run_leanchecker(work: Path, lean_dir: Path, lake: list[str], timeout_s: float) -> dict:
    started = time.monotonic()
    rc, out = await run_process([*lake, "env", "leanchecker", MODULE], lean_dir, timeout_s, _lean_path(work))
    ms = (time.monotonic() - started) * 1000
    if rc == -1:
        return result("leanchecker", "error", out, ms)
    if rc == -2:
        return result("leanchecker", "unavailable", out, ms)
    if rc != 0:
        return result("leanchecker", "fail", _tail(out), ms)
    return result("leanchecker", "pass", "the kernel replayed every declaration in a fresh process", ms)


def program(binary: str, key: str) -> list[str] | None:
    """A program's command line: FORMALIZER_<KEY>_BIN (a path, or a JSON list such as ["python", "fake.py"]), else
    `binary` found on PATH; None when neither."""
    override = os.environ.get(f"FORMALIZER_{key.upper()}_BIN", "").strip()
    if override.startswith("["):
        try:
            parts = json.loads(override)
        except ValueError:
            return None
        return [str(x) for x in parts] if isinstance(parts, list) and parts else None
    if override:
        return [override]
    found = shutil.which(binary)
    return [found] if found else None


@dataclass
class External:
    """A Full checker: a program found on PATH (or FORMALIZER_<ID>_BIN), plus the programs it needs."""

    id: str
    binary: str
    needs: tuple[str, ...] = ()
    needs_challenge: bool = False

    def command(self) -> list[str] | None:
        return program(self.binary, self.id)

    def helper(self, name: str) -> list[str] | None:
        return program(name, name)

    def detect(self, platform: str = sys.platform) -> tuple[bool, str]:
        if not platform.startswith("linux"):
            return False, "not available on this OS: Full checkers run on Linux, WSL or the cloud runner"
        if self.command() is None:
            return False, f"`{self.binary}` not found (PATH or FORMALIZER_{self.id.upper()}_BIN)"
        missing = [n for n in self.needs if self.helper(n) is None]
        if missing:
            return False, f"needs {', '.join(missing)}"
        return True, f"found {self.command()[0]}"

    def invocation(self, work: Path, theorems: list[str], lake: list[str], paranoid: bool = False) -> list[str]:
        """The command line; writes the config file it needs into `work`."""
        cmd = self.command() or [self.binary]
        env_prefix = [*lake, "env"] if lake else []
        if self.id == "comparator":
            config = {
                "challenge_module": CHALLENGE_MODULE,
                "solution_module": MODULE,
                "theorem_names": theorems,
                "permitted_axioms": list(STANDARD_AXIOMS),
                "enable_nanoda": False,
            }
            (work / "comparator.json").write_text(json.dumps(config), encoding="utf-8")
            return [*env_prefix, *cmd, (work / "comparator.json").as_posix(), *(["--paranoid"] if paranoid else [])]
        if self.id == "nanoda":
            config = {
                "export_file_path": (work / f"{MODULE}.ndjson").as_posix(),
                "permitted_axioms": list(STANDARD_AXIOMS),
                "unpermitted_axiom_hard_error": True,
                "nat_extension": True,
                "string_extension": True,
            }
            (work / "nanoda.json").write_text(json.dumps(config), encoding="utf-8")
            return [*cmd, (work / "nanoda.json").as_posix()]
        return [*env_prefix, *cmd, MODULE]  # lean4lean: like leanchecker

    async def run(
        self,
        work: Path,
        theorems: list[str],
        lean_dir: Path,
        lake: list[str],
        timeout_s: float,
        platform: str = sys.platform,
        paranoid: bool = False,
    ) -> dict:
        started = time.monotonic()
        ok, why = self.detect(platform)
        if not ok:
            return result(self.id, "unavailable", why)
        if self.needs_challenge and not (work / f"{CHALLENGE_MODULE}.olean").exists():
            return result(self.id, "unavailable", "needs the challenge file (the problem's starting file)")
        env = _lean_path(work)
        if self.id == "nanoda":  # lean4export writes the module's declarations for nanoda to read
            export = self.helper("lean4export") or ["lean4export"]
            rc, out = await self._export(export, lake, lean_dir, work, timeout_s, env)
            if rc != 0:
                return result(self.id, "error", f"lean4export: {_tail(out)}", (time.monotonic() - started) * 1000)
        rc, out = await run_process(self.invocation(work, theorems, lake, paranoid), lean_dir, timeout_s, env)
        ms = (time.monotonic() - started) * 1000
        if rc == -1:
            return result(self.id, "error", out, ms)
        if rc == -2:
            return result(self.id, "unavailable", out, ms)
        if rc != 0:
            return result(self.id, "fail", _tail(out), ms)
        return result(self.id, "pass", f"{TITLES[self.id]} accepts it: {_tail(out, 160)}", ms)

    @staticmethod
    async def _export(
        export: list[str], lake: list[str], lean_dir: Path, work: Path, timeout_s: float, env: dict
    ) -> tuple[int, str]:
        """lean4export's whole output into work/FzSolution.ndjson (it can be large: written straight to the file)."""
        target = work / f"{MODULE}.ndjson"
        try:
            with target.open("wb") as f:
                proc = await asyncio.create_subprocess_exec(
                    *([*lake, "env"] if lake else []),
                    *export,
                    MODULE,
                    cwd=str(lean_dir),
                    env={**os.environ, **env},
                    stdout=f,
                    stderr=asyncio.subprocess.PIPE,
                )
                _, err = await asyncio.wait_for(proc.communicate(), timeout_s)
        except TimeoutError:
            with contextlib.suppress(ProcessLookupError):
                proc.kill()
            return -1, f"timed out after {timeout_s:g} s"
        except OSError as e:
            return -2, str(e)
        return proc.returncode or 0, err.decode("utf-8", "replace")[-2000:]


EXTERNAL = {
    "comparator": External("comparator", "comparator", needs=("landrun", "lean4export"), needs_challenge=True),
    "nanoda": External("nanoda", "nanoda_bin", needs=("lean4export",)),
    "lean4lean": External("lean4lean", "lean4lean"),
}


def status(runner: str, platform: str = sys.platform) -> list[dict]:
    """What /api/health reports: every checker, whether this runner can run it here, and why not."""
    out = []
    for cid in LITE + FULL:
        if cid in ("static", "kernel+axioms", "statement-match"):
            ok, why = True, "built in"
        elif cid == "leanchecker":
            ok, why = leanchecker_available()
        else:
            ok, why = EXTERNAL[cid].detect(platform)
        out.append(
            {
                "id": cid,
                "title": TITLES[cid],
                "tier": "lite" if cid in LITE else "full",
                "available": ok,
                "reason": why,
                "default": cid in DEFAULT,
            }
        )
    return out


async def run_programs(
    wanted: list[str],
    code: str,
    challenge: str | None,
    theorems: list[str],
    lean_dir: Path,
    lake: list[str] | None = None,
    timeout_s: float = EXTERNAL_TIMEOUT_S,
    platform: str = sys.platform,
) -> list[dict]:
    """leanchecker and the Full checkers: compile the solution (and the challenge, for comparator) once in a scratch
    folder, then run each program on it."""
    lake = ["lake"] if lake is None else lake
    if not wanted:
        return []
    out: dict[str, dict] = {}
    runnable = []
    for cid in wanted:
        ok, why = leanchecker_available() if cid == "leanchecker" else EXTERNAL[cid].detect(platform)
        if ok:
            runnable.append(cid)
        else:
            out[cid] = result(cid, "unavailable", why)
    if runnable:
        work = Path(tempfile.mkdtemp(prefix="formalizer-check-"))
        try:
            started = time.monotonic()
            built, log = await build_module(code, work, MODULE, lean_dir, lake, timeout_s)
            if "comparator" in runnable and challenge:
                await build_module(challenge, work, CHALLENGE_MODULE, lean_dir, lake, timeout_s)
            ms = (time.monotonic() - started) * 1000
            if built != "ok":
                why = {
                    "timeout": ("error", f"building the module timed out after {timeout_s:g} s"),
                    "error": ("fail", f"Lean rejects the file: {_tail(log)}"),
                    "sorry": ("fail", "a `sorry` is left"),
                }[built]
                for cid in runnable:
                    out[cid] = result(cid, why[0], why[1], ms)
            else:
                jobs = [
                    run_leanchecker(work, lean_dir, lake, timeout_s)
                    if cid == "leanchecker"
                    else EXTERNAL[cid].run(work, theorems, lean_dir, lake, timeout_s, platform)
                    for cid in runnable
                ]
                for cid, r in zip(runnable, await asyncio.gather(*jobs), strict=True):
                    out[cid] = {**r, "ms": r["ms"] + round(ms)}
        finally:
            shutil.rmtree(work, ignore_errors=True)
    return [out[c] for c in wanted]
