"""Turn a REPL reply into what the problem page shows: a verdict, errors, the goals at each `sorry` (split into
hypotheses and target) and the axioms each theorem depends on.

Verdicts:
- "proved": no errors, no `sorry`, and every checked theorem uses only the standard axioms;
- "incomplete": it compiles, but some proof still has `sorry` (the work left);
- "error": Lean rejected something.

Info messages from the user's code (the "Try this" of `exact?` and `simp?`) are passed on as `infos`.
"""

from __future__ import annotations

import re

STANDARD_AXIOMS = {"propext", "Quot.sound", "Classical.choice"}
_AXIOMS = re.compile(r"^'(?P<name>.+)' (?:depends on axioms: \[(?P<list>[^\]]*)\]|does not depend on any axioms)")
_IMPORT = re.compile(r"^\s*import\s+(\S+)", re.MULTILINE)


def split_goal(goal: str) -> dict:
    """ "a b : Nat\n⊢ a + b = b + a" → hypotheses ["a b : Nat"], target "a + b = b + a" (first goal; more goals
    are listed as `others`)."""
    blocks = [b for b in re.split(r"\n\s*\n", goal.strip()) if b.strip()]
    goals = []
    for block in blocks or [goal]:
        hyps, target, case = [], "", None
        lines = block.split("\n")
        if lines[0].startswith("case "):  # the branch's name after `induction` / `cases` (e.g. "case succ")
            case, lines = lines[0][5:].strip(), lines[1:]
        for i, line in enumerate(lines):
            if line.startswith("⊢"):
                target = "\n".join([line[1:].strip(), *[ln.strip() for ln in lines[i + 1 :]]]).strip()
                break
            if line.startswith(" ") and hyps:  # a long hypothesis wrapped onto the next line
                hyps[-1] += " " + line.strip()
            else:
                hyps.append(line.strip())
        goals.append({"case": case, "hypotheses": [h for h in hyps if h], "target": target})
    first = goals[0] if goals else {"case": None, "hypotheses": [], "target": goal.strip()}
    return {**first, "others": goals[1:]}


def imports(code: str) -> list[str]:
    return _IMPORT.findall(code)


def without_imports(code: str) -> str:
    """The REPL checks against a loaded environment, so `import` lines are dropped (the runner checked that it
    has what they ask for). Line numbers are kept by leaving the lines empty."""
    return _IMPORT.sub("", code)


def axioms_request(theorems: list[str]) -> str:
    return "".join(f"\n#print axioms {name}" for name in theorems)


def summarize(reply: dict, code_lines: int, theorems: list[str]) -> dict:
    """The page's view of a check. `code_lines`: messages after this line come from the appended
    `#print axioms` commands, not from the user's code."""
    errors, warnings, infos, axioms = [], [], [], {}
    for m in reply.get("messages", []):
        line = m.get("pos", {}).get("line", 0)
        text = str(m.get("data", ""))
        found = _AXIOMS.match(text)
        if found and line > code_lines:
            listed = found.group("list")
            axioms[found.group("name")] = [a.strip() for a in listed.split(",") if a.strip()] if listed else []
            continue
        if line > code_lines and m.get("severity") == "error" and "unknown constant" in text.lower():
            errors.append(
                {
                    "line": 0,
                    "column": 0,
                    "message": f"`{re.split(r'(?i)unknown constant', text)[-1].strip().strip("`'")}` was not found: keep the theorem's name",
                }
            )
            continue
        item = {
            "line": line,
            "column": m.get("pos", {}).get("column", 0),
            "end_line": m.get("endPos", {}).get("line", line) if m.get("endPos") else line,
            "message": text,
        }
        if m.get("severity") == "error":
            errors.append(item)
        elif m.get("severity") == "warning" and "declaration uses `sorry`" not in text:
            warnings.append(item)
        elif m.get("severity") == "info" and line <= code_lines:  # e.g. "Try this: …" from `exact?` / `simp?`
            infos.append(item)
    goals = [
        {
            "line": s.get("pos", {}).get("line", 0),
            "column": s.get("pos", {}).get("column", 0),
            **split_goal(s.get("goal", "")),
        }
        for s in reply.get("sorries", [])
    ]
    uses_sorry = bool(goals) or any("sorryAx" in a for a in axioms.values())
    nonstandard = sorted(
        {a for a in (a for names in axioms.values() for a in names) if a not in STANDARD_AXIOMS and a != "sorryAx"}
    )
    missing = [t for t in theorems if t not in axioms]
    if errors or missing:
        verdict = "error"
    elif uses_sorry:
        verdict = "incomplete"
    elif nonstandard:
        verdict = "error"
        errors.append({"line": 0, "column": 0, "message": f"uses non-standard axioms: {', '.join(nonstandard)}"})
    else:
        verdict = "proved"
    return {
        "verdict": verdict,
        "errors": errors,
        "warnings": warnings,
        "infos": infos,
        "goals": goals,
        "axioms": axioms,
    }
