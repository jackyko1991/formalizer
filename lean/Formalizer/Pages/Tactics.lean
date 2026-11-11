/-!
Lean code shown on the Coding Skills ▸ First tactics page (frontend/src/pages/skills/Tactics.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Tactics

-- snippet: first-proof
theorem two_plus_two : 2 + 2 = 4 := by
  rfl

-- snippet: rfl
example : 2 + 2 = 4 := by rfl
example : 10 * 10 = 100 := by rfl
example : "Lean".length = 4 := by rfl
example (xs : List Nat) : [] ++ xs = xs := by rfl

-- snippet: decide
example : 91 % 7 = 0 := by decide
example : 3 < 5 ∧ 5 ≠ 6 := by decide
-- every n below 10: Lean checks all ten cases
example : ∀ n < 10, n * n % 10 ≠ 2 := by decide

-- snippet: simp
example (xs : List Nat) : xs.reverse.reverse = xs := by simp
example (xs : List Nat) : (xs ++ []).length = xs.length := by simp
example (a : Nat) : a + 0 = a * 1 := by simp

-- snippet: simp-hyp
-- `simp [h]` also uses the hypothesis `h : a = b` as a rewriting rule
example (a b : Nat) (h : a = b) : a + 0 = b := by simp [h]

-- snippet: omega
example (a b : Nat) : a + b = b + a := by omega
example (n : Nat) (h₁ : 3 < n) (h₂ : n < 5) : n = 4 := by omega
example (a b : Nat) (h : a + 2 ≤ b) : a < b := by omega
example (a : Nat) : a - 5 ≤ a := by omega

-- snippet: exact
example (a b : Nat) : a + b = b + a := by
  exact Nat.add_comm a b

example (a b c : Nat) (h₁ : a ≤ b) (h₂ : b ≤ c) : a ≤ c := by
  exact Nat.le_trans h₁ h₂

example (p : Prop) (hp : p) : p := by
  exact hp

-- snippet: intro
example : ∀ n : Nat, n + 0 = n := by
  intro n
  rfl

example (p q : Prop) : p → q → p := by
  intro hp hq
  exact hp

-- snippet: constructor
example : 2 + 2 = 4 ∧ 3 < 5 := by
  constructor
  · rfl
  · decide

example (n : Nat) : n + 1 = 3 ↔ n = 2 := by
  constructor
  · intro h
    omega
  · intro h
    omega

-- snippet: left-right-exists
example (p q : Prop) (hq : q) : p ∨ q := by
  right
  exact hq

example : ∃ n : Nat, n * n = 49 := by
  exists 7

-- end

-- snippet: holes
example (p q : Prop) (hp : p) (hq : q) : p ∧ q := by
  show_term constructor -- Lean prints: Try this: refine ⟨?_, ?_⟩
  · exact hp
  · exact hq

-- snippet: one-step
/-- A tactic made of tactics: try each one-step tactic in turn. -/
macro "one_step" : tactic => `(tactic| first | rfl | decide | omega | simp)

example : 2 + 2 = 4 := by one_step
example (a b : Nat) : a + b = b + a := by one_step
example (xs : List Nat) : xs.reverse.reverse = xs := by one_step
-- end

end Formalizer.Pages.Tactics
