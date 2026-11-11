/-! Problem 0, hello world: the reference solution, built in CI to prove the statement checks. -/

theorem hello : 2 + 2 = 4 := by rfl

theorem add_comm_example (a b : Nat) : a + b = b + a := Nat.add_comm a b
