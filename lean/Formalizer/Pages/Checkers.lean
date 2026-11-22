/-!
Lean code shown on the Concept ▸ Checking the checker page (frontend/src/pages/concept/Checkers.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line. Some of these examples are deliberately *bad* statements or *bad* proofs: they
compile, which is the point (gate 1 and gate 3 are about things Lean happily accepts).
-/

namespace Formalizer.Pages.Checkers

-- snippet: nat-surprises
example : (1 : Nat) / 2 = 0 := by decide   -- division on ℕ rounds down
example : (2 : Nat) - 3 = 0 := by decide   -- subtraction on ℕ stops at 0
example : (7 : Nat) / 0 = 0 := by decide   -- and x / 0 is defined: it is 0
-- end

-- snippet: flt-false
/-- Fermat's Last Theorem, written carelessly: no `0 < a`. -/
def CarelessFLT : Prop := ∀ a b c n : Nat, n ≥ 3 → a ^ n + b ^ n ≠ c ^ n

/-- It compiles, and it is false: take a = b = c = 0. -/
theorem careless_flt_false : ¬ CarelessFLT :=
  fun h => h 0 0 0 3 (by decide) rfl
-- end

-- snippet: wrong-reason
/-- "Every n below 0 is 42." True, proved, and says nothing: no n is below 0. -/
theorem below_zero (n : Nat) (h : n < 0) : n = 42 :=
  absurd h (Nat.not_lt_zero n)
-- end

-- snippet: redefine
section Sneaky
/-- A hidden redefinition: from here on, `a ^ n` means 37. -/
local instance : Pow Nat Nat := ⟨fun _ _ => 37⟩

/-- The statement *reads* like Fermat's Last Theorem, and the "proof" is two lines. -/
theorem fake_flt : ∀ a b c n : Nat, n ≥ 3 → a ^ n + b ^ n ≠ c ^ n := by
  intro a b c n _ h
  exact absurd h (by decide : ¬ (37 + 37 = 37))
end Sneaky

#print axioms fake_flt   -- the axiom check sees nothing wrong
-- end

-- snippet: axioms
axiom trust_me : 1 = 2

theorem honest (n : Nat) : n + 0 = n := rfl
theorem bold : 1 = 2 := trust_me
theorem unfinished : 2 + 2 = 4 := by sorry

#print axioms honest
#print axioms bold
#print axioms unfinished
-- end

end Formalizer.Pages.Checkers
