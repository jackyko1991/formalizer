/-!
Lean code shown on the Coding Skills ▸ Structuring a proof page (frontend/src/pages/skills/Structure.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Structure

-- snippet: have
example (a b : Nat) (h₁ : a < b) : a + a < b + b := by
  have h₂ : a + a < b + a := Nat.add_lt_add_right h₁ a
  have h₃ : b + a < b + b := Nat.add_lt_add_left h₁ b
  exact Nat.lt_trans h₂ h₃

-- snippet: have-by
example (xs : List Nat) (h : xs.length = 3) : (xs ++ xs).length = 6 := by
  have hlen : (xs ++ xs).length = xs.length + xs.length := by
    simp
  omega

-- snippet: suffices
example (xs : List Nat) (h : xs.length = 3) : (xs ++ xs).length = 6 := by
  suffices hlen : (xs ++ xs).length = xs.length + xs.length by
    omega
  simp

-- snippet: show
def double (n : Nat) : Nat := n + n

example : double 3 = 6 := by
  show 3 + 3 = 6
  rfl

-- snippet: obtain
example (a b : Nat) (ha : ∃ k, a = 2 * k) (hb : ∃ k, b = 2 * k) : ∃ k, a + b = 2 * k := by
  obtain ⟨x, hx⟩ := ha      -- ha says: some x has a = 2 * x
  obtain ⟨y, hy⟩ := hb
  exact ⟨x + y, by omega⟩

example (p q : Prop) (h : p ∧ q) : q ∧ p := by
  obtain ⟨hp, hq⟩ := h      -- an ∧ splits into its two halves
  exact ⟨hq, hp⟩

-- snippet: rcases
example (n : Nat) (h : n = 1 ∨ n = 3) : n % 2 = 1 := by
  rcases h with h1 | h3    -- an ∨ gives two cases
  · rw [h1]
  · rw [h3]

-- snippet: cases-or
theorem swap_or (p q : Prop) (h : p ∨ q) : q ∨ p := by
  cases h with
  | inl hp => exact Or.inr hp
  | inr hq => exact Or.inl hq

-- snippet: cases-nat
example (n : Nat) : n = 0 ∨ 0 < n := by
  cases n with
  | zero => left; rfl
  | succ m => right; exact Nat.zero_lt_succ m

-- snippet: induction
def sumTo : Nat → Nat
  | 0 => 0
  | n + 1 => sumTo n + (n + 1)

theorem sumTo_le (n : Nat) : sumTo n ≤ n * n := by
  induction n with
  | zero => decide
  | succ m ih =>
    -- ih : sumTo m ≤ m * m
    show sumTo m + (m + 1) ≤ (m + 1) * (m + 1)
    rw [Nat.add_mul, Nat.mul_add, Nat.one_mul, Nat.mul_one]
    omega

-- snippet: induction-list
theorem length_append' (xs ys : List Nat) : (xs ++ ys).length = xs.length + ys.length := by
  induction xs with
  | nil => simp
  | cons x xs ih => simp [ih]; omega

-- snippet: calc
theorem lt_chain (a b c : Nat) (h₁ : a < b) (h₂ : b ≤ c) : a < c + 1 :=
  calc a < b := h₁
    _ ≤ c := h₂
    _ < c + 1 := Nat.lt_succ_self c

-- snippet: refine
example : ∃ n : Nat, n + n = 10 ∧ n < 6 := by
  refine ⟨5, ?_, ?_⟩   -- the witness is 5; two goals remain
  · rfl
  · decide

-- snippet: focus
example (n : Nat) : n + 1 = 3 ↔ n = 2 := by
  constructor
  · intro h      -- goal 1:  n + 1 = 3 → n = 2
    omega
  · intro h      -- goal 2:  n = 2 → n + 1 = 3
    rw [h]
-- end

-- The worked example, built the way it was planned: a skeleton of `sorry`s, filled one at a time.
namespace Plan1
-- snippet: plan-1
theorem consecutive_even (n : Nat) : ∃ k, n * (n + 1) = 2 * k := by
  sorry

theorem square_add_even (n : Nat) : ∃ k, n * n + n = 2 * k := by
  have h : n * n + n = n * (n + 1) := by
    sorry
  obtain ⟨k, hk⟩ := consecutive_even n
  exact ⟨k, by rw [h, hk]⟩
-- end
end Plan1

namespace Plan2
theorem consecutive_even (n : Nat) : ∃ k, n * (n + 1) = 2 * k := by
  sorry
-- snippet: plan-2
theorem square_add_even (n : Nat) : ∃ k, n * n + n = 2 * k := by
  have h : n * n + n = n * (n + 1) := by
    rw [Nat.mul_add, Nat.mul_one]
  obtain ⟨k, hk⟩ := consecutive_even n
  exact ⟨k, by rw [h, hk]⟩
-- end
end Plan2

namespace Plan3
-- snippet: plan-3
theorem consecutive_even (n : Nat) : ∃ k, n * (n + 1) = 2 * k := by
  induction n with
  | zero => sorry
  | succ m ih => sorry
-- end
end Plan3

namespace Plan4
-- snippet: plan-4
theorem consecutive_even (n : Nat) : ∃ k, n * (n + 1) = 2 * k := by
  induction n with
  | zero => exact ⟨0, rfl⟩
  | succ m ih =>
    obtain ⟨k, hk⟩ := ih
    refine ⟨k + (m + 1), ?_⟩
    calc (m + 1) * (m + 1 + 1)
        = (m + 2) * (m + 1) := by sorry
      _ = m * (m + 1) + 2 * (m + 1) := by sorry
      _ = 2 * k + 2 * (m + 1) := by sorry
      _ = 2 * (k + (m + 1)) := by sorry
-- end
end Plan4

-- snippet: worked
/-- Helper lemma: the product of two consecutive numbers is even. -/
theorem consecutive_even (n : Nat) : ∃ k, n * (n + 1) = 2 * k := by
  induction n with
  | zero => exact ⟨0, rfl⟩
  | succ m ih =>
    obtain ⟨k, hk⟩ := ih                -- hk : m * (m + 1) = 2 * k
    refine ⟨k + (m + 1), ?_⟩
    calc (m + 1) * (m + 1 + 1)
        = (m + 2) * (m + 1) := by rw [Nat.mul_comm]
      _ = m * (m + 1) + 2 * (m + 1) := by rw [Nat.add_mul]
      _ = 2 * k + 2 * (m + 1) := by rw [hk]
      _ = 2 * (k + (m + 1)) := by omega

/-- Main theorem: n² + n is even, using the lemma. -/
theorem square_add_even (n : Nat) : ∃ k, n * n + n = 2 * k := by
  have h : n * n + n = n * (n + 1) := by
    rw [Nat.mul_add, Nat.mul_one]
  obtain ⟨k, hk⟩ := consecutive_even n
  exact ⟨k, by rw [h, hk]⟩

-- end

end Formalizer.Pages.Structure
