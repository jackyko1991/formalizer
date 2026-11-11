/-!
Lean code shown on the Concept ▸ Limits of proofs page (frontend/src/pages/concept/Limits.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.

Two snippets use `sorry` on purpose (section 3 of the page): Lean warns "declaration uses `sorry`" for them.
-/

namespace Formalizer.Pages.Limits

-- snippet: vacuous
-- "If n is smaller than itself, then n is a million."
-- True, and Lean accepts it: no number is smaller than itself, so the promise is never tested.
theorem vacuous (n : Nat) (h : n < n) : n = 1000000 :=
  absurd h (Nat.lt_irrefl n)

-- snippet: bad-sum
-- Meant to add up a list, but the head `x` is forgotten: the answer is always 0.
def badSum : List Nat → Nat
  | [] => 0
  | _ :: xs => badSum xs

-- A proud-looking theorem about it, and Lean accepts the proof.
theorem badSum_append (xs ys : List Nat) : badSum (xs ++ ys) = badSum xs + badSum ys := by
  induction xs with
  | nil => simp [badSum]
  | cons x xs ih => simp [badSum, ih]

-- snippet: bad-sum-eval
#eval badSum [1, 2, 3]   -- 0   (should be 6: the definition is wrong)

-- snippet: bad-prime
-- "n is prime if no number d with 2 ≤ d < n divides it." Looks right...
def isPrimeBad (n : Nat) : Bool :=
  (List.range n).all fun d => d < 2 || n % d != 0

#eval (List.range 12).filter isPrimeBad   -- [0, 1, 2, 3, 5, 7, 11]: 0 and 1 slipped in

-- The fix: a prime is at least 2.
def isPrime (n : Nat) : Bool :=
  2 ≤ n && (List.range n).all fun d => d < 2 || n % d != 0

#eval (List.range 12).filter isPrime      -- [2, 3, 5, 7, 11]

-- Small checks you can keep in the file: Lean re-runs them on every build.
example : isPrime 1 = false := by decide
example : isPrime 7 = true := by decide
example : isPrime 9 = false := by decide

-- snippet: junk
-- Natural numbers (0, 1, 2, ...) have no negatives, so subtraction stops at 0.
example : (2 : Nat) - 3 = 0 := by decide
example : (0 : Nat) - 1 = 0 := by decide
-- Division rounds down, and dividing by 0 gives 0.
example : (7 : Nat) / 2 = 3 := by decide
example : (5 : Nat) / 0 = 0 := by decide
example : (5 : Int) / 0 = 0 := by decide

-- snippet: junk-hyp
-- The junk never leaks into a real theorem: one that needs "b ≤ a" asks for it.
example (a b : Nat) (h : b ≤ a) : a - b + b = a := Nat.sub_add_cancel h

-- Without the condition the statement is false, and Lean can show that too.
example : ¬ ((2 : Nat) - 3 + 3 = 2) := by decide

-- snippet: sorry-false
-- `sorry` means "trust me". Lean accepts the file with a warning, even for a false statement.
theorem twoPlusTwo : 2 + 2 = 5 := by
  sorry

#print axioms twoPlusTwo   -- 'twoPlusTwo' depends on axioms: [sorryAx]

-- snippet: sorry-spread
-- Anything proved *from* it inherits the sorry, however far away.
theorem useIt : 2 + 2 ≠ 4 := by
  have h := twoPlusTwo
  omega

#print axioms useIt        -- 'useIt' depends on axioms: [propext, sorryAx, Quot.sound]

-- snippet: print-axioms
-- Computation alone: no axioms at all.
theorem plain : 2 + 2 = 4 := rfl

-- "Every statement is true or false": classical logic, which uses the three standard axioms.
theorem excludedMiddle (p : Prop) : p ∨ ¬p := Classical.em p

#print axioms plain           -- 'plain' does not depend on any axioms
#print axioms excludedMiddle  -- 'excludedMiddle' depends on axioms: [propext, Classical.choice, Quot.sound]
-- end

end Formalizer.Pages.Limits
