/**
 * Starting points for a research project. The demo is small enough for the Lite runner and shows the whole loop:
 * a definition, two lemmas left as `sorry`, and a main theorem already assembled from them (so it shows as
 * "depends" until the lemmas are proved). Real research problems (openai/math, Navier–Stokes) come later.
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
}

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
