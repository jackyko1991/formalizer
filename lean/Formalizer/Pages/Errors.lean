/-!
Lean code shown on the Coding Skills ▸ Reading goals and errors page (frontend/src/pages/skills/Errors.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Errors

-- snippet: two-cases
def double : Nat → Nat
  | 0 => 0
  | n + 1 => double n + 2

theorem double_eq (n : Nat) : double n = 2 * n := by
  induction n with
  | zero => sorry
  | succ k ih => sorry
-- snippet: unsolved-fixed
theorem two_steps (p q : Prop) (hp : p) (hq : q) : p ∧ q := by
  constructor
  exact hp
  exact hq
-- snippet: mismatch-fixed
theorem wrong_fact (a b : Nat) (h : a ≤ b) : a < b + 1 := by
  exact Nat.lt_succ_of_le h
-- snippet: unknown-fixed
theorem swap (a b : Nat) : a + b = b + a := by
  exact Nat.add_comm a b
-- snippet: synth-fixed
structure Point where
  x : Nat
  y : Nat

instance : Add Point where
  add p q := ⟨p.x + q.x, p.y + q.y⟩

example (p : Point) : p + p = p + p := rfl
-- snippet: omega-fixed
theorem small (n : Nat) (h : n < 3) : n < 5 := by
  omega
-- snippet: decide-fixed
theorem small_squares : ∀ n < 3, n * n < 9 := by
  decide

theorem small_square (n : Nat) (h : n < 3) : n * n < 9 := by
  decide +revert
-- snippet: rw-fixed
theorem chain (a b c : Nat) (h₁ : a = b) (h₂ : b = c) : a = c := by
  rw [h₁]
  rw [h₂]
-- end

end Formalizer.Pages.Errors
