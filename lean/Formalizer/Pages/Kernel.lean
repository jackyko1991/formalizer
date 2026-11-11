/-!
Lean code shown on the Concept ▸ How Lean checks page (frontend/src/pages/concept/Kernel.tsx).
Core Lean only (the Lite runner); built by CI. A snippet is the text from `-- snippet: <name>` to the next
`-- snippet:` or `-- end` line.
-/

namespace Formalizer.Pages.Kernel

-- snippet: elaborate
#check (1 + 2 : Nat)
set_option pp.explicit true in
#check (1 + 2 : Nat)
-- end

-- snippet: implicit
#check @List.length
set_option pp.explicit true in
#check List.length [1, 2, 3]
-- end

-- snippet: tactic-term
theorem and_swap (p q : Prop) (h : p ∧ q) : q ∧ p := by
  obtain ⟨hp, hq⟩ := h
  exact ⟨hq, hp⟩

#print and_swap
-- end

-- snippet: show-term
example (p q : Prop) (hp : p) (hq : q) : p ∧ q := by
  show_term constructor <;> assumption
-- end

-- snippet: by-computation
theorem two_two : 2 + 2 = 4 := rfl

theorem small : 10 < 20 := by decide

theorem big : 123456 * 654321 = 80779853376 := by decide

#print small
-- end

-- snippet: axioms
theorem pe (a b : Prop) (h : a ↔ b) : a = b := propext h

theorem em' (p : Prop) : p ∨ ¬p := Classical.em p

theorem todo (n : Nat) : n * 1 = n := by sorry

#print axioms two_two
#print axioms pe
#print axioms em'
#print axioms todo
-- end

end Formalizer.Pages.Kernel
