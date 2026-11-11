/-!
Lean code shown on the Concept ▸ The Feynman technique page (frontend/src/pages/concept/Feynman.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Feynman

-- snippet: definitions
/-- `n` is even: it is twice some natural number `k`. -/
def IsEven (n : Nat) : Prop := ∃ k, n = 2 * k

/-- `n` is odd: it is one more than twice some natural number `k`. -/
def IsOdd (n : Nat) : Prop := ∃ k, n = 2 * k + 1

-- Tiny examples, checked by hand and by Lean: 6 = 2 * 3 and 7 = 2 * 3 + 1.
example : IsEven 6 := ⟨3, rfl⟩
example : IsOdd 7 := ⟨3, rfl⟩
-- end

-- snippet: statement
theorem odd_add_odd_v1 (a b : Nat) (ha : IsOdd a) (hb : IsOdd b) : IsEven (a + b) := by
  sorry
-- end

-- snippet: gaps
theorem odd_add_odd_v2 (a b : Nat) (ha : IsOdd a) (hb : IsOdd b) : IsEven (a + b) := by
  obtain ⟨j, hj⟩ := ha          -- hj : a = 2 * j + 1
  obtain ⟨k, hk⟩ := hb          -- hk : b = 2 * k + 1
  refine ⟨j + k + 1, ?_⟩        -- "a + b is twice j + k + 1": now prove a + b = 2 * (j + k + 1)
  sorry                         -- the gap: why is that true?
-- end

-- snippet: finished
theorem odd_add_odd (a b : Nat) (ha : IsOdd a) (hb : IsOdd b) : IsEven (a + b) := by
  obtain ⟨j, hj⟩ := ha
  obtain ⟨k, hk⟩ := hb
  refine ⟨j + k + 1, ?_⟩
  omega                         -- a + b = (2j + 1) + (2k + 1) = 2(j + k + 1): plain arithmetic
-- end

-- snippet: refactor
/-- The two "+ 1"s make one extra pair: (2j + 1) + (2k + 1) = 2(j + k + 1). -/
theorem two_ones_make_a_pair (j k : Nat) : (2 * j + 1) + (2 * k + 1) = 2 * (j + k + 1) := by
  omega

theorem odd_add_odd' (a b : Nat) (ha : IsOdd a) (hb : IsOdd b) : IsEven (a + b) := by
  obtain ⟨j, hj⟩ := ha
  obtain ⟨k, hk⟩ := hb
  have sum_is : a + b = (2 * j + 1) + (2 * k + 1) := by rw [hj, hk]
  have pair : (2 * j + 1) + (2 * k + 1) = 2 * (j + k + 1) := two_ones_make_a_pair j k
  exact ⟨j + k + 1, sum_is.trans pair⟩
-- end

-- snippet: bad-definition
/-- A tempting but wrong definition: "one less than an even number". -/
def IsOddBad (n : Nat) : Prop := ∃ k, n = 2 * k - 1

-- On natural numbers 2 * 0 - 1 is 0 (subtraction stops at zero), so 0 counts as "odd".
example : IsOddBad 0 := ⟨0, rfl⟩
-- end

-- snippet: audit
#print axioms odd_add_odd_v1   -- 'odd_add_odd_v1' depends on axioms: [sorryAx]   (a gap is still open)
#print axioms odd_add_odd      -- no sorryAx in the list: nothing was skipped
-- end

end Formalizer.Pages.Feynman
