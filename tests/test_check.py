"""Turning REPL replies (recorded from Lean 4.34.1) into the page's verdict, goals and axioms."""

from backend.check import axioms_request, imports, split_goal, summarize, without_imports

SORRY = {
    "sorries": [
        {"proofState": 0, "pos": {"line": 1, "column": 32}, "goal": "⊢ 2 + 2 = 4", "endPos": {"line": 1, "column": 37}}
    ],
    "messages": [
        {
            "severity": "warning",
            "pos": {"line": 1, "column": 8},
            "endPos": {"line": 1, "column": 13},
            "data": "declaration uses `sorry`",
        },
        {
            "severity": "info",
            "pos": {"line": 2, "column": 0},
            "endPos": {"line": 2, "column": 6},
            "data": "'hello' depends on axioms: [sorryAx]",
        },
    ],
    "env": 1,
}
PROVED = {
    "messages": [
        {
            "severity": "info",
            "pos": {"line": 2, "column": 0},
            "endPos": {"line": 2, "column": 6},
            "data": "'hello' does not depend on any axioms",
        }
    ],
    "env": 2,
}
ERROR = {
    "messages": [
        {
            "severity": "error",
            "pos": {"line": 2, "column": 2},
            "endPos": {"line": 2, "column": 7},
            "data": "Tactic `introN` failed: There are no additional binders or `let` bindings in the goal to introduce\n\na b : Nat\n⊢ a + b = b + a",
        }
    ],
    "env": 3,
}


def test_sorry_is_incomplete_with_its_goal():
    r = summarize(SORRY, 1, ["hello"])
    assert r["verdict"] == "incomplete"
    assert r["goals"] == [{"line": 1, "column": 32, "hypotheses": [], "target": "2 + 2 = 4", "others": []}]
    assert r["axioms"] == {"hello": ["sorryAx"]} and r["warnings"] == []


def test_a_finished_proof_with_no_axioms_is_proved():
    r = summarize(PROVED, 1, ["hello"])
    assert r["verdict"] == "proved" and r["axioms"] == {"hello": []} and not r["errors"]


def test_errors_are_reported_with_their_place():
    r = summarize(ERROR, 3, ["t"])
    assert r["verdict"] == "error"
    assert r["errors"][0]["line"] == 2 and "introN" in r["errors"][0]["message"]


def test_standard_axioms_are_fine_others_are_not():
    msg = lambda axioms: {
        "messages": [
            {"severity": "info", "pos": {"line": 5, "column": 0}, "data": f"'t' depends on axioms: [{axioms}]"}
        ]
    }
    assert summarize(msg("propext, Classical.choice, Quot.sound"), 4, ["t"])["verdict"] == "proved"
    bad = summarize(msg("propext, myAxiom"), 4, ["t"])
    assert bad["verdict"] == "error" and "myAxiom" in bad["errors"][0]["message"]


def test_a_renamed_theorem_is_an_error():
    reply = {"messages": [{"severity": "error", "pos": {"line": 3, "column": 0}, "data": "unknown constant 'hello'"}]}
    r = summarize(reply, 2, ["hello"])
    assert r["verdict"] == "error" and "hello" in r["errors"][0]["message"]


def test_goals_split_into_hypotheses_and_target():
    g = split_goal("a b : Nat\nh : a ≤ b\n⊢ a + b = b + a")
    assert g == {"hypotheses": ["a b : Nat", "h : a ≤ b"], "target": "a + b = b + a", "others": []}
    two = split_goal("x : Nat\n⊢ x = x\n\ny : Nat\n⊢ y + 0 = y")
    assert two["target"] == "x = x" and two["others"] == [{"hypotheses": ["y : Nat"], "target": "y + 0 = y"}]
    wrapped = split_goal("h : a very long hypothesis that\n  wraps here\n⊢ True")
    assert wrapped["hypotheses"] == ["h : a very long hypothesis that wraps here"]


def test_imports_are_found_and_blanked_keeping_line_numbers():
    code = "import Mathlib\nimport Mathlib.Tactic\n\ntheorem t : True := trivial"
    assert imports(code) == ["Mathlib", "Mathlib.Tactic"]
    assert without_imports(code).split("\n")[3] == "theorem t : True := trivial"
    assert axioms_request(["a", "b"]) == "\n#print axioms a\n#print axioms b"
