/-!
Lean code shown on the Concept ▸ Lean maths page (frontend/src/pages/concept/LeanMaths.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.LeanMaths

-- snippet: types
#check 2             -- 2 : Nat
#check (2 : Int)     -- 2 : Int
#check (-3 : Int)    -- -3 : Int
#check "hello"       -- "hello" : String
#eval 2 + 3          -- 5
#eval (2 : Int) - 7  -- -5
-- snippet: functions
def double (n : Nat) : Nat := 2 * n

#check (double)      -- double : Nat → Nat
#eval double 21      -- 42

def add (a b : Nat) : Nat := a + b

#check (add)         -- add : Nat → Nat → Nat
#eval add 2 3        -- 5
-- snippet: props
#check 2 + 2 = 4     -- 2 + 2 = 4 : Prop
#check 2 + 2 = 5     -- 2 + 2 = 5 : Prop   (a statement can be false)

theorem two_add_two : 2 + 2 = 4 := rfl

#check two_add_two   -- two_add_two : 2 + 2 = 4
-- snippet: def-vs-theorem
def five : Nat := 2 + 3            -- a value of type Nat
theorem five_eq : 2 + 3 = 5 := rfl -- a value of type 2 + 3 = 5

#eval five                         -- 5
#check five_eq                     -- five_eq : 2 + 3 = 5
-- snippet: logic-1
-- →  prove: intro      use: apply it to a proof of the left side
example (P Q : Prop) (hpq : P → Q) (hp : P) : Q := hpq hp

-- ∀  prove: intro n    use: apply it to a particular number
example : ∀ n : Nat, n + 0 = n := by
  intro n
  rfl

example (h : ∀ n : Nat, n < n + 1) : 5 < 6 := h 5

-- ∃  prove: ⟨witness, proof⟩    use: obtain ⟨w, hw⟩ := h
example : ∃ n : Nat, n + 2 = 5 := ⟨3, rfl⟩

example (h : ∃ n : Nat, n > 7) : ∃ m : Nat, m > 6 := by
  obtain ⟨n, hn⟩ := h
  exact ⟨n, by omega⟩
-- snippet: logic-2
-- ∧  prove: constructor (or ⟨hp, hq⟩)    use: h.1, h.2
example (P Q : Prop) (hp : P) (hq : Q) : P ∧ Q := by
  constructor
  · exact hp
  · exact hq

example (P Q : Prop) (h : P ∧ Q) : Q := h.2

-- ∨  prove: Or.inl / Or.inr    use: cases h
example : 2 = 3 ∨ 2 < 3 := Or.inr (by decide)

example (P Q : Prop) (h : P ∨ Q) : Q ∨ P := by
  cases h with
  | inl hp => exact Or.inr hp
  | inr hq => exact Or.inl hq

-- ¬  ¬ P means P → False
example : ¬ (2 = 3) := by decide

example (P : Prop) (hp : P) (hn : ¬ P) : False := hn hp

-- ↔  prove: constructor (both directions)    use: h.1, h.2
example (P Q : Prop) (h : P ↔ Q) (hp : P) : Q := h.1 hp
-- snippet: recursion
def oddSum : Nat → Nat
  | 0     => 0
  | n + 1 => oddSum n + (2 * n + 1)

#eval oddSum 4       -- 16 = 1 + 3 + 5 + 7

theorem oddSum_eq (n : Nat) : oddSum n = n * n := by
  induction n with
  | zero => rfl
  | succ k ih =>
    rw [oddSum, ih, Nat.add_mul, Nat.mul_add]
    omega
-- snippet: nat-surprises
#eval (3 : Nat) - 5   -- 0   (there is no -2 in Nat)
#eval (3 : Int) - 5   -- -2
#eval (7 : Nat) / 2   -- 3   (rounded down)
#eval (7 : Nat) / 0   -- 0   (division by zero is defined to be 0)

example : (3 : Nat) - 5 + 5 = 5 := rfl   -- not 3!
-- snippet: term-vs-tactic
-- a term proof: write the proof down directly
theorem swap_term (P Q : Prop) (h : P ∧ Q) : Q ∧ P :=
  ⟨h.2, h.1⟩

-- a tactic proof: give Lean instructions that build the same term
theorem swap_tactic (P Q : Prop) (h : P ∧ Q) : Q ∧ P := by
  obtain ⟨hp, hq⟩ := h
  constructor
  · exact hq
  · exact hp
-- snippet: even-square
theorem even_square (n : Nat) (h : ∃ k, n = 2 * k) : ∃ m, n * n = 2 * m := by
  obtain ⟨k, hk⟩ := h
  exact ⟨k * n, by rw [hk, Nat.mul_assoc]⟩
-- end

end Formalizer.Pages.LeanMaths
