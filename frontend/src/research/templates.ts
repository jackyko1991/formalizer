/**
 * Starting points for a research project: three demos and an empty project. Each demo is small enough for the Lite
 * runner (core Lean, no Mathlib) and shows the whole loop: definitions, lemmas left as `sorry`, and a main theorem
 * already assembled from them (so it shows as "depends" until the lemmas are proved). Every lemma was checked to be
 * provable on the Lite runner (tests/test_templates.py). Larger research problems are planned (Product roadmap).
 */
import type { L } from "../pages/kit";
import type { LeanFile } from "../runner";

export interface Template {
  id: string;
  title: L;
  about: L;
  main: string;
  statements: string[];
  files: LeanFile[];
  notes: Record<string, L>;
  /** the lemmas' finished proofs (replacing `:= by\n  sorry`): the showcase shows the project done, and
   *  tests/test_templates.py checks that they make the main theorem proved on the Lite runner */
  proofs?: Record<string, string>;
}

/** A demo with every lemma proved (its showcase). */
export function finishedFiles(t: Template): LeanFile[] {
  return t.files.map((f) => {
    let code = f.code;
    for (const [name, proof] of Object.entries(t.proofs ?? {})) {
      const head = code.indexOf(`theorem ${name} `);
      const hole = head < 0 ? -1 : code.indexOf(":= by\n  sorry", head);
      if (hole >= 0) code = code.slice(0, hole) + ":= " + proof + code.slice(hole + ":= by\n  sorry".length);
    }
    return { ...f, code };
  });
}

/** The demos that have a finished version to show. */
export const SHOWCASES = () => TEMPLATES.filter((t) => t.proofs);

export const TEMPLATES: Template[] = [
  {
    id: "odd-sum",
    title: ["Odd numbers add up to squares", "奇數加起來是平方數"],
    about: [
      "$1 + 3 + 5 + \\dots + (2n-1) = n^2$, as a small blueprint: a definition, two lemmas and the main theorem. The main proof is already written; it waits on the lemmas.",
      "$1 + 3 + 5 + \\dots + (2n-1) = n^2$，做成一張小藍圖：一個定義、兩條引理和主定理。主證明已經寫好；它在等兩條引理。",
    ],
    main: "odd_sum_eq_square",
    statements: ["theorem odd_sum_eq_square (n : Nat) : oddSum n = n * n"],
    files: [
      {
        name: "Defs.lean",
        code: "/-- `oddSum n` = 1 + 3 + 5 + … + (2n − 1), the first n odd numbers -/\ndef oddSum : Nat → Nat\n  | 0 => 0\n  | n + 1 => oddSum n + (2 * n + 1)\n",
      },
      {
        name: "Lemmas.lean",
        code: "theorem oddSum_succ (n : Nat) : oddSum (n + 1) = oddSum n + (2 * n + 1) := by\n  sorry\n\ntheorem square_succ (n : Nat) : (n + 1) * (n + 1) = n * n + (2 * n + 1) := by\n  sorry\n",
      },
      {
        name: "Main.lean",
        code: "theorem odd_sum_eq_square (n : Nat) : oddSum n = n * n := by\n  induction n with\n  | zero => rfl\n  | succ k ih => rw [oddSum_succ, ih, square_succ]\n",
      },
    ],
    notes: {
      oddSum: [
        "The sum of the first $n$ odd numbers, defined step by step: add $2n+1$ to go from $n$ to $n+1$.",
        "前 $n$ 個奇數的和，一步一步定義：從 $n$ 到 $n+1$ 時加上 $2n+1$。",
      ],
      oddSum_succ: [
        "One more odd number: the sum up to $n+1$ is the sum up to $n$ plus $2n+1$. This is just the definition read aloud.",
        "多加一個奇數：到 $n+1$ 的和，等於到 $n$ 的和加上 $2n+1$。這只是把定義唸出來。",
      ],
      square_succ: [
        "$(n+1)^2 = n^2 + 2n + 1$: expand the product, then it is arithmetic.",
        "$(n+1)^2 = n^2 + 2n + 1$：把乘積展開，剩下的就是算術。",
      ],
      odd_sum_eq_square: [
        "**Main theorem.** By induction on $n$: for $n = 0$ both sides are $0$; from $n$ to $n+1$, add $2n+1$ to both sides and use the two lemmas.",
        "**主定理。** 對 $n$ 做歸納：$n = 0$ 時兩邊都是 $0$；從 $n$ 到 $n+1$，兩邊各加 $2n+1$，再用上兩條引理。",
      ],
    },
    proofs: {
      oddSum_succ: "rfl",
      square_succ: "by\n  simp only [Nat.add_mul, Nat.mul_add, Nat.mul_one, Nat.one_mul]\n  omega",
    },
  },
  {
    id: "nicomachus",
    title: ["Cubes add up to a square (Nicomachus)", "立方數加起來是平方數（尼科馬庫斯）"],
    about: [
      "$1^3 + 2^3 + \\dots + n^3 = (1 + 2 + \\dots + n)^2$. Two lemmas: Gauss's formula for $1 + \\dots + n$, and how the square of a triangular number grows by a cube.",
      "$1^3 + 2^3 + \\dots + n^3 = (1 + 2 + \\dots + n)^2$。兩條引理：$1 + \\dots + n$ 的高斯公式，以及三角形數的平方每一步恰好多一個立方。",
    ],
    main: "nicomachus",
    statements: ["theorem nicomachus (n : Nat) : cubeSum n = triangle n * triangle n"],
    files: [
      {
        name: "Defs.lean",
        code: "/-- `triangle n` = 1 + 2 + … + n -/\ndef triangle : Nat → Nat\n  | 0 => 0\n  | n + 1 => triangle n + (n + 1)\n\n/-- `cubeSum n` = 1³ + 2³ + … + n³ -/\ndef cubeSum : Nat → Nat\n  | 0 => 0\n  | n + 1 => cubeSum n + (n + 1) * (n + 1) * (n + 1)\n",
      },
      {
        name: "Lemmas.lean",
        code: "theorem two_triangle (n : Nat) : 2 * triangle n = n * (n + 1) := by\n  sorry\n\ntheorem triangle_sq_succ (n : Nat) :\n    triangle (n + 1) * triangle (n + 1) = triangle n * triangle n + (n + 1) * (n + 1) * (n + 1) := by\n  sorry\n",
      },
      {
        name: "Main.lean",
        code: "theorem nicomachus (n : Nat) : cubeSum n = triangle n * triangle n := by\n  induction n with\n  | zero => rfl\n  | succ k ih => rw [cubeSum, ih, triangle_sq_succ]\n",
      },
    ],
    notes: {
      triangle: ["The triangular numbers $T_n = 1 + 2 + \\dots + n$.", "三角形數 $T_n = 1 + 2 + \\dots + n$。"],
      cubeSum: ["The sum of the first $n$ cubes.", "前 $n$ 個立方數的和。"],
      two_triangle: [
        "Gauss: $2T_n = n(n+1)$. Induction on $n$; in the step, expand the products and the rest is linear arithmetic (`simp only [Nat.mul_add, Nat.add_mul, …]`, then `omega`).",
        "高斯：$2T_n = n(n+1)$。對 $n$ 歸納；在遞推步驟中把乘積展開，剩下的就是線性算術（先 `simp only [Nat.mul_add, Nat.add_mul, …]`，再 `omega`）。",
      ],
      triangle_sq_succ: [
        "$T_{n+1}^2 = (T_n + (n+1))^2 = T_n^2 + 2T_n(n+1) + (n+1)^2$, and $2T_n = n(n+1)$ turns the middle term into $n(n+1)^2$: together $(n+1)^3$. The heart of the proof.",
        "$T_{n+1}^2 = (T_n + (n+1))^2 = T_n^2 + 2T_n(n+1) + (n+1)^2$，再用 $2T_n = n(n+1)$ 把中間項變成 $n(n+1)^2$：合起來就是 $(n+1)^3$。這是證明的核心。",
      ],
      nicomachus: [
        "**Main theorem.** Induction on $n$: each step adds $(n+1)^3$ to the left side, and `triangle_sq_succ` says the right side grows by exactly that.",
        "**主定理。** 對 $n$ 歸納：每一步左邊加上 $(n+1)^3$，而 `triangle_sq_succ` 說右邊恰好也多了這麼多。",
      ],
    },
    proofs: {
      two_triangle:
        "by\n  induction n with\n  | zero => rfl\n  | succ k ih =>\n    simp only [triangle, Nat.mul_add, ih, Nat.add_mul, Nat.mul_one, Nat.one_mul]\n    omega",
      triangle_sq_succ:
        "by\n  have h := two_triangle n\n  show (triangle n + (n + 1)) * (triangle n + (n + 1)) = _\n  generalize triangle n = t at *\n  have expand : (t + (n + 1)) * (t + (n + 1)) = t * t + 2 * t * (n + 1) + (n + 1) * (n + 1) := by\n    simp only [Nat.add_mul, Nat.mul_add, Nat.two_mul, Nat.mul_one, Nat.one_mul, Nat.mul_comm n t]\n    omega\n  rw [expand, h, Nat.mul_assoc n, Nat.mul_assoc (n + 1), Nat.succ_mul n ((n + 1) * (n + 1)), Nat.add_assoc]",
    },
  },
  {
    id: "fib-coprime",
    title: ["Neighbouring Fibonacci numbers are coprime", "相鄰的費波那契數互質"],
    about: [
      "$\\gcd(F_n, F_{n+1}) = 1$ for every $n$. The idea is Euclid's: subtracting one number from another doesn't change their gcd, so one lemma carries the gcd down the sequence to $\\gcd(0, 1) = 1$.",
      "對每個 $n$，$\\gcd(F_n, F_{n+1}) = 1$。想法來自歐幾里得：從一個數減去另一個數，最大公因數不變；所以一條引理就能把最大公因數一路往下帶到 $\\gcd(0, 1) = 1$。",
    ],
    main: "fib_coprime",
    statements: ["theorem fib_coprime (n : Nat) : Nat.gcd (fib n) (fib (n + 1)) = 1"],
    files: [
      {
        name: "Defs.lean",
        code: "/-- the Fibonacci numbers 0, 1, 1, 2, 3, 5, 8, … -/\ndef fib : Nat → Nat\n  | 0 => 0\n  | 1 => 1\n  | n + 2 => fib n + fib (n + 1)\n",
      },
      {
        name: "Lemmas.lean",
        code: "theorem fib_add_two (n : Nat) : fib (n + 2) = fib n + fib (n + 1) := rfl\n\ntheorem gcd_fib_step (n : Nat) :\n    Nat.gcd (fib (n + 1)) (fib (n + 2)) = Nat.gcd (fib n) (fib (n + 1)) := by\n  sorry\n",
      },
      {
        name: "Main.lean",
        code: "theorem fib_coprime (n : Nat) : Nat.gcd (fib n) (fib (n + 1)) = 1 := by\n  induction n with\n  | zero => rfl\n  | succ k ih => rw [gcd_fib_step, ih]\n",
      },
    ],
    notes: {
      fib: ["$F_0 = 0$, $F_1 = 1$, and each next number is the sum of the two before.", "$F_0 = 0$、$F_1 = 1$，之後每個數都是前兩個的和。"],
      fib_add_two: [
        "The definition read aloud; `rfl` proves it because Lean computes the left side to the right side.",
        "把定義唸出來；`rfl` 就能證明，因為 Lean 會把左邊算成右邊。",
      ],
      gcd_fib_step: [
        "$\\gcd(F_{n+1}, F_n + F_{n+1}) = \\gcd(F_{n+1}, F_n) = \\gcd(F_n, F_{n+1})$: adding a multiple of one number to the other keeps the gcd. In Lean: `fib_add_two`, then `Nat.gcd_comm` and a lemma like `Nat.gcd_add_self_right` (try `exact?` or `rw?`).",
        "$\\gcd(F_{n+1}, F_n + F_{n+1}) = \\gcd(F_{n+1}, F_n) = \\gcd(F_n, F_{n+1})$：把一個數的倍數加到另一個數上，最大公因數不變。在 Lean 裡：先用 `fib_add_two`，再用 `Nat.gcd_comm` 和像 `Nat.gcd_add_self_right` 這樣的引理（試試 `exact?` 或 `rw?`）。",
      ],
      fib_coprime: [
        "**Main theorem.** Induction on $n$: $\\gcd(F_0, F_1) = \\gcd(0, 1) = 1$, and `gcd_fib_step` moves each step back to the previous one.",
        "**主定理。** 對 $n$ 歸納：$\\gcd(F_0, F_1) = \\gcd(0, 1) = 1$，而 `gcd_fib_step` 把每一步帶回前一步。",
      ],
    },
    proofs: {
      gcd_fib_step: "by\n  rw [fib_add_two, Nat.gcd_comm (fib n) (fib (n + 1)), Nat.add_comm, Nat.gcd_add_self_right]",
    },
  },
  {
    id: "empty",
    title: ["Empty project", "空白專案"],
    about: ["Your own statement, lemmas and notes, from a blank file.", "你自己的陳述、引理與筆記，從空白檔案開始。"],
    main: "main_theorem",
    statements: [],
    files: [{ name: "Main.lean", code: "theorem main_theorem : True := by\n  sorry\n" }],
    notes: {},
  },
];
