---
name: formalizer
description: Prove, explain and check Lean 4 theorems the Formalizer way. The statement is the test and Lean's kernel is the grader. Keep the statement, replace `sorry` step by step, check every step with the local Lean runner, and accept only the standard axioms. Use when writing or debugging a Lean 4 proof, tutoring someone through one, formalising a maths statement, or working on a Formalizer problem.
license: Apache-2.0
---

# The Formalizer way

Formalizer (https://github.com/jackyko1991/formalizer) teaches formal mathematics in Lean 4. Its one rule:
**the statement is the test, and Lean's kernel is the grader.** A problem is a fixed Lean statement with `sorry` where
the proof goes. A solution counts only when Lean accepts it with no `sorry`, the statement unchanged, and only the
standard axioms `propext`, `Quot.sound` and `Classical.choice`.

## Checking: the local runner

Lean runs on the user's computer. Start the runner from a clone of the repository:

```sh
pixi run lean-build   # once: builds the Lean project and the REPL
pixi run runner       # http://localhost:8790 (Lite: core Lean). The Full runner adds Mathlib.
```

- **With the MCP server** (`http://localhost:8790/mcp`), use the tools:
  - `runner_status`
  - `list_problems`
  - `get_problem` (statement, starting file, hint; never the solution)
  - `check_proof` (`code`, optional `problem_id`)
- **Without MCP**, post to the same runner:

  ```sh
  curl -s localhost:8790/api/check -H 'content-type: application/json' \
    -d '{"code": "theorem t : 2 + 2 = 4 := by\n  rfl\n", "theorems": ["t"], "statements": ["theorem t : 2 + 2 = 4"]}'
  ```

- **In a Lean project**, run `lake env lean File.lean`, and add `#print axioms t` at the end.

The verdict is one of:

| Verdict | Meaning |
|---|---|
| `proved` | no errors, no `sorry` |
| `incomplete` | a `sorry` is left; `goals` shows what is still to prove |
| `error` | Lean rejected the code; see `errors` with line and column |
| `needs-runner` | the code imports something this runner lacks, e.g. Mathlib on the Lite runner |

## The loop: one step, then check

1. **Read the statement** and say in words what it claims. Never edit it, not even to "fix" it. If it looks false
   or mis-stated, stop and tell the user.
2. **Plan on paper first.** Write the informal proof, then the skeleton in Lean with one `have` per step, each
   ending in `sorry`:
   ```lean
   theorem t (n : Nat) : P n := by
     have h1 : A := by sorry
     have h2 : B := by sorry
     exact final h1 h2
   ```
3. **Check the skeleton.** It must give `incomplete`, never `error`, before you fill anything in.
4. **Replace one `sorry` at a time.** After each change, check again and **read the goal** (`⊢ …`) and the
   hypotheses before writing the next tactic. Don't stack several guesses untested.
5. **Finish:** the verdict is `proved`, and the axioms are a subset of `propext`, `Quot.sound` and `Classical.choice`.

## Which tactic: the goal looks like … → try …

| Goal | Try |
|---|---|
| a closed computation, `2 + 2 = 4` | `rfl`, `decide` |
| `+`, `≤`, `<` on `Nat` or `Int`, linear | `omega` |
| simplifies with known rules | `simp`, then `simp?` to see which rules it used |
| `A ∧ B`, `A ↔ B` | `constructor` |
| `∀ x, …` or `A → B` | `intro x` |
| `∃ x, P x` | `exact ⟨w, proof⟩` or `refine ⟨w, ?_⟩` |
| a statement about every `n : Nat` | `induction n with \| zero => … \| succ k ih => …` |
| an equation to rewrite with `h : a = b` | `rw [h]` (`rw [← h]` for right to left) |
| a library lemma probably exists | `exact?`, `apply?`, `rw?` (search; then paste the suggestion) |
| ring or field algebra (Mathlib) | `ring`, `field_simp`, `linarith`, `nlinarith`, `positivity`, `norm_num` |

## Never

- **Never change the statement,** including its name, binders, hypotheses and types. The runner refuses a changed
  statement.
- **Never leave a `sorry`, `admit` or new `axiom`,** and never use `native_decide`. It adds the axiom
  `Lean.ofReduceBool` and trusts the compiler.
- **Don't hide failures** with `set_option maxHeartbeats 0` or `decide` on huge goals. Ask instead.
- **Don't invent lemma names.** If Lean says `Unknown constant` or `unknown identifier`, search with `exact?` or the
  Mathlib docs.

## Tutoring

When the user is learning, as on Formalizer's problem pages:

- **Give the next step, not the whole proof.** Name the tactic and why it fits the goal, and let them type it.
  Reveal a full proof only when asked.
- **Explain each error in plain words:** what Lean expected, and what it got.
- **Connect to the mathematics.** `induction` is proof by induction, `intro` is "let x be arbitrary", and
  `constructor` splits "and".

## Research-level problems

Long proofs, such as the openai/math challenges or the Navier–Stokes statements with Mathlib, follow the same loop
on a larger scale:

- **Write a blueprint:** a list of lemmas, each a separate `theorem` with `sorry`, and the main theorem assembled
  from them. Check that the assembly is `incomplete`, not `error`, before proving any lemma.
- **Prove the leaves first,** and keep each lemma small enough to check in seconds.
- **Report progress per lemma:** proved, open or blocked. When you are blocked, report the exact goal you are
  stuck on.
