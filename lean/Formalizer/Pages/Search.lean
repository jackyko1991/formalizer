/-!
Lean code shown on the Coding Skills ▸ Finding lemmas page (frontend/src/pages/skills/Search.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Search

-- snippet: exact-q
-- Lean answers:  Try this: exact Nat.zero_lt_succ n
example (n : Nat) : 0 < n + 1 := by
  exact?

-- snippet: exact-q-done
-- …and you paste the answer in, so the proof no longer searches:
theorem succ_positive (n : Nat) : 0 < n + 1 := by
  exact Nat.zero_lt_succ n

-- snippet: apply-q
-- Lean answers:  Try this: exact Nat.lt_of_lt_of_le h₁ h₂
example (a b c : Nat) (h₁ : a < b) (h₂ : b ≤ c) : a < c := by
  apply?

-- snippet: simp-q
-- Lean answers:  Try this: simp only [List.reverse_reverse]
example (xs : List Nat) : xs.reverse.reverse = xs := by
  simp?

-- snippet: rw-q
-- Lean lists rewrites that fit; the first one is
--   rw [List.length_append]
-- and it is applied, leaving  xs.length + ys.length = ys.length + xs.length
example (xs ys : List Nat) : (xs ++ ys).length = ys.length + xs.length := by
  rw?
  omega

-- snippet: rw-done
theorem length_swap (xs ys : List Nat) : (xs ++ ys).length = ys.length + xs.length := by
  rw [List.length_append, Nat.add_comm]

-- snippet: check
#check Nat.add_comm        -- Nat.add_comm (n m : Nat) : n + m = m + n
#check List.length_append  -- (as ++ bs).length = as.length + bs.length
#check Nat.lt_of_lt_of_le  -- n < m → m ≤ k → n < k
#check 2 + 2 = 4           -- 2 + 2 = 4 : Prop
#eval 2 ^ 10               -- 1024

-- snippet: dot
example (xs : List Nat) : xs.length = List.length xs := rfl

example (a b : Nat) : b + a = a + b := (Nat.add_comm a b).symm

example (p q : Prop) (h : p ∧ q) : q ∧ p := ⟨h.2, h.1⟩

example (a b : Nat) (h : a < b + 1 ↔ a ≤ b) (hab : a ≤ b) : a < b + 1 := h.mpr hab

-- end

end Formalizer.Pages.Search
