/-!
Lean code shown on the Coding Skills ▸ Verifying a proof page (frontend/src/pages/skills/Verify.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Verify

-- snippet: print-axioms
theorem four : 2 + 2 = 4 := rfl

theorem swap (a b : Nat) : a + b = b + a := by omega

theorem either (p : Prop) : p ∨ ¬p := Classical.em p

#print axioms four
#print axioms swap
#print axioms either
-- snippet: print-sorry
theorem later (n : Nat) : n + 0 = n := by
  sorry

#print axioms later
-- snippet: hidden-sorry
theorem helper (n : Nat) : n * 1 = n := by
  sorry

theorem main (n : Nat) : n * 1 + 0 = n := by
  rw [Nat.add_zero, helper]

#print axioms main
-- snippet: changed-statement
-- the problem gave:  theorem hello : 2 + 2 = 4
theorem hello : 2 + 2 = 2 + 2 := rfl
-- snippet: vacuous
theorem anything (n : Nat) (h : n < 0) : n = 42 := by
  omega
-- end

end Formalizer.Pages.Verify
