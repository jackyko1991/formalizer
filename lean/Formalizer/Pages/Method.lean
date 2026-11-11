/-!
Lean code shown on the Concept ▸ From statement to proof page (frontend/src/pages/concept/Method.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Method

-- snippet: definition
/-- `sumTo n` is 1 + 2 + … + n, built one step at a time. -/
def sumTo : Nat → Nat
  | 0 => 0
  | n + 1 => sumTo n + (n + 1)

-- Test the definition before proving anything about it.
#eval sumTo 4    -- 10  (1 + 2 + 3 + 4)
#eval sumTo 100  -- 5050, Gauss's answer
-- end

namespace Statement
-- snippet: statement
theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  sorry
-- end
end Statement

namespace Weak
-- snippet: weak
-- True, checked by Lean, and useless: it says nothing about sumTo.
theorem gauss_weak (n : Nat) : 2 * sumTo n ≥ 0 := by
  omega
-- end
end Weak

namespace Plan1
-- snippet: plan1
theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => sorry          -- the start: n = 0
  | succ n ih => sorry     -- the step: from n to n + 1
-- end
end Plan1

namespace Plan2
-- snippet: plan2
theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => rfl            -- closed: both sides compute to 0
  | succ n ih =>
    calc 2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1) := by sorry
      _ = n * (n + 1) + 2 * (n + 1) := by sorry
      _ = (n + 2) * (n + 1) := by sorry
      _ = (n + 1) * (n + 1 + 1) := by sorry
-- end
end Plan2

namespace Plan3
-- snippet: plan3
theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => rfl
  | succ n ih =>
    calc 2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1) := by rw [sumTo, Nat.mul_add]
      _ = n * (n + 1) + 2 * (n + 1) := by rw [ih]
      _ = (n + 2) * (n + 1) := by sorry
      _ = (n + 1) * (n + 1 + 1) := by sorry
-- end
end Plan3

-- snippet: done
theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => rfl
  | succ n ih =>
    calc 2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1) := by rw [sumTo, Nat.mul_add]
      _ = n * (n + 1) + 2 * (n + 1) := by rw [ih]
      _ = (n + 2) * (n + 1) := by rw [Nat.add_mul n 2 (n + 1)]
      _ = (n + 1) * (n + 1 + 1) := by rw [Nat.mul_comm]
-- end

-- snippet: audit
#print axioms gauss
-- 'Formalizer.Pages.Method.gauss' depends on axioms: [propext]

#print axioms Plan3.gauss
-- 'Formalizer.Pages.Method.Plan3.gauss' depends on axioms: [sorryAx]
-- end

end Formalizer.Pages.Method
