/**
 * The Tutorial mode's script for the 15 problems of problems/tutorial.json (Feynman method, beginner first).
 *
 * Per problem: which chips show at first and when the rest unlock (after a failed run, so the failure teaches the
 * tool's limit, or after solving, as "other ways"), the tools it introduces (known from then on), what every chip does
 * to THIS goal as a few frames, a coach text for the guided steps, and the proof as written on paper, mapped to the
 * lines of the reference solution.
 *
 * Every goal below was checked against Lean v4.34.1 (core, the Lite runner) with `trace_state`, except frames marked
 * `teaching`: those show a state Lean does not display when the chip runs (what the kernel computes for `rfl`, or the
 * goal between a rewrite and the `rfl` that `rw` runs by itself); their note says so. tests/tutorialGuide.test.ts
 * checks the shape against tutorial.json.
 */
type L = readonly [string, string];

/** What Lean's goal view shows when nothing is left to prove. */
export const NO_GOALS = "No goals";

export interface Frame {
  /** the goal exactly as Lean shows it (hypotheses above `⊢`; several goals separated by a blank line), or NO_GOALS */
  goal: string;
  /** what changed since the previous frame */
  note?: L;
  /** a picture of what happens inside, not a state Lean displays for this chip */
  teaching?: boolean;
}

/**
 * A chip on this problem. `frames`: where it works, from the goal it applies to (the first frame's note says when,
 * e.g. "after rw [h₁]"). `fails`: Lean's verdict in plain words where it does not work: at the start, or always (then
 * `frames` is empty). A chip may have both: it fails if clicked first, and works later.
 */
export interface TacticHere {
  frames: Frame[];
  fails?: L;
}

/**
 * The natural-language proof and the Lean proof are mirrors: neither alone is complete, the pair is. One step of the paper proof:
 * `lines` = the lines of tutorial.json `solution` (1-based, inclusive) doing it in Lean; `lean` = those lines, trimmed
 * (blank ones dropped), as anchors to find the step in the reader's own edited code by content; `goal` = Lean's goal
 * right before the step (shown for a step not written yet, at its `sorry`), absent for the statement line and defs.
 */
export interface PaperStep {
  text: L;
  lines: readonly [number, number];
  lean: string[];
  goal?: string;
}

/** A piece of the informal statement and the exact text of the problem's start file that says it in Lean. */
export interface MirrorPiece {
  human: L;
  lean: string;
}

export interface ProblemGuide {
  /** chips shown at the start (exact chip strings from tutorial.json) */
  first: string[];
  /** when the remaining chips appear */
  unlock: "after-fail" | "after-solve";
  /** shown when the rest unlock */
  unlockNote: L;
  /** tools (a chip's first word) this problem introduces; known in every later problem */
  introduces: string[];
  /** every chip of the problem, keyed by the exact chip string */
  here: Record<string, TacticHere>;
  /** the guided steps: what to read, what ⊢ means here, which tactic first and why, what success or failure looks like */
  coach: { statement: L; goal: L; tactic: L; result: L };
  /** the statement read as a mathematician would, piece by piece, each piece with its Lean text (in order) */
  statementMirror: MirrorPiece[];
  /** the proof as a mathematician writes it, in order, each step mapped to solution lines */
  paper: PaperStep[];
}

const done = (en: string, zh: string): Frame => ({ goal: NO_GOALS, note: [en, zh] });
const DONE: Frame = done("Both sides identical: `rw` closes it with `rfl` by itself. Done.", "兩邊一模一樣：`rw` 自己用 `rfl` 收尾。完成。");

// ---- goals, as Lean prints them ----
const ADD = "a b : Nat\n⊢ a + b = b + a";
const SQ = "n : Nat\nh₁ : 3 < n\nh₂ : n < 5\n⊢ n = 4";
const REV = "xs : List Nat\n⊢ xs.reverse.reverse = xs";
const CH = "a b c : Nat\nh₁ : a = b\nh₂ : b = c\n";
const RG = "a b c : Nat\n";
const LE = "a b c : Nat\nh₁ : a ≤ b\nh₂ : b ≤ c\n";
const SUCC = "n : Nat\n⊢ 0 < n + 1";
const LEN = "xs ys : List Nat\n";
const E0 = "a b : Nat\nha : ∃ k, a = 2 * k\nhb : ∃ k, b = 2 * k\n⊢ ∃ k, a + b = 2 * k";
const E1 = "a b : Nat\nhb : ∃ k, b = 2 * k\nx : Nat\nhx : a = 2 * x\n⊢ ∃ k, a + b = 2 * k";
const E2 = "a b x : Nat\nhx : a = 2 * x\ny : Nat\nhy : b = 2 * y\n⊢ ∃ k, a + b = 2 * k";
const E3 = "a b x : Nat\nhx : a = 2 * x\ny : Nat\nhy : b = 2 * y\n⊢ a + b = 2 * (x + y)";
const OR0 = "p q : Prop\nh : p ∨ q\n⊢ q ∨ p";
const ORL = "case inl\np q : Prop\nhp : p\n⊢ q ∨ p";
const ORR = "case inr\np q : Prop\nhq : q\n⊢ q ∨ p";
const D0 = "n : Nat\n⊢ double n = 2 * n";
const DZ = "case zero\n⊢ double 0 = 2 * 0";
const DS = "case succ\nn : Nat\nih : double n = 2 * n\n⊢ double (n + 1) = 2 * (n + 1)";
const DS2 = "case succ\nn : Nat\nih : double n = 2 * n\n⊢ 2 * n + 2 = 2 * (n + 1)";
const LT = "a b c : Nat\nh₁ : a < b\nh₂ : b ≤ c\n";
const G0 = "n : Nat\n⊢ 2 * sumTo n = n * (n + 1)";
const GZ = "case zero\n⊢ 2 * sumTo 0 = 0 * (0 + 1)";
const GS = "case succ\nn : Nat\nih : 2 * sumTo n = n * (n + 1)\n⊢ 2 * sumTo (n + 1) = (n + 1) * (n + 1 + 1)";
const GI = "n : Nat\nih : 2 * sumTo n = n * (n + 1)\n";
const G1 = GI + "⊢ 2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1)";
const G2 = GI + "⊢ 2 * sumTo n + 2 * (n + 1) = n * (n + 1) + 2 * (n + 1)";
const G3 = GI + "⊢ n * (n + 1) + 2 * (n + 1) = (n + 2) * (n + 1)";
const G4 = GI + "⊢ (n + 2) * (n + 1) = (n + 1) * (n + 1 + 1)";

const INDUCTION = "induction n with\n| zero => sorry\n| succ n ih => sorry";

export const GUIDE: Record<string, ProblemGuide> = {
  hello: {
    first: ["rfl"],
    unlock: "after-solve",
    unlockNote: [
      "Solved! Two other ways to the same goal: `decide` (let Lean answer the yes/no question by computing) and `norm_num` (Mathlib's number cruncher: try it to see what the Lite runner says).",
      "完成了！還有兩條路通往同一個目標：`decide`（讓 Lean 直接算出這個是非題的答案），以及 `norm_num`（Mathlib 的數字計算器：試試看 Lite 執行器會怎麼回答）。",
    ],
    introduces: ["rfl", "decide", "norm_num"],
    here: {
      rfl: {
        frames: [
          { goal: "⊢ 2 + 2 = 4", note: ["The goal: what comes after ⊢ is what to prove.", "目標：⊢ 後面就是要證明的東西。"] },
          {
            goal: "⊢ 4 = 4",
            teaching: true,
            note: [
              "Teaching frame (Lean doesn't display this step): Lean computes the left side, 2 + 2 is 4.",
              "教學畫面（Lean 不會顯示這一步）：Lean 把左邊算出來，2 + 2 是 4。",
            ],
          },
          done("Both sides identical: a thing equals itself. Done.", "兩邊一模一樣：東西等於自己。完成。"),
        ],
      },
      decide: {
        frames: [
          { goal: "⊢ 2 + 2 = 4" },
          done(
            "Lean evaluates the yes/no question \"is 2 + 2 equal to 4?\" and gets `true`. Done.",
            "Lean 計算這個是非題「2 + 2 等於 4 嗎？」，得到 `true`。完成。",
          ),
        ],
      },
      norm_num: {
        frames: [],
        fails: [
          "Lean answers `unknown tactic`, and the goal stays unsolved. `norm_num` is part of Mathlib, and the Lite runner has only core Lean; on the Full runner it proves this in one step. Your idea is fine: the tool just isn't installed here.",
          "Lean 回答 `unknown tactic`（未知的戰術），目標仍未解決。`norm_num` 屬於 Mathlib，而 Lite 執行器只有核心 Lean；在 Full 執行器上它一步就能證完。你的想法沒錯，只是這裡沒有安裝這個工具。",
        ],
      },
    },
    coach: {
      statement: [
        "Read `theorem hello : 2 + 2 = 4`: `hello` is the name, and after the colon comes the claim, 2 + 2 = 4. That part stays fixed; you only replace `sorry`.",
        "讀讀 `theorem hello : 2 + 2 = 4`：`hello` 是名字，冒號後面是主張 2 + 2 = 4。這部分固定不動；你只要換掉 `sorry`。",
      ],
      goal: [
        "After Run, Lean shows `⊢ 2 + 2 = 4`. The ⊢ means \"still to prove\". Nothing is above it: no hypotheses, just numbers.",
        "按下執行後，Lean 顯示 `⊢ 2 + 2 = 4`。⊢ 的意思是「還要證明」。它上方什麼都沒有：沒有前提，只有數字。",
      ],
      tactic: [
        "Try `rfl`: both sides are plain numbers, so Lean can compute them and compare.",
        "試試 `rfl`：兩邊都是單純的數字，Lean 可以算出來再比較。",
      ],
      result: [
        "Success: a green check and no goals left. If Lean shows a ⊢ again, the proof isn't finished yet.",
        "成功的樣子：綠色勾勾，沒有剩下的目標。如果 Lean 又顯示 ⊢，代表證明還沒完成。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (hello):", "定理（hello）："], lean: "theorem hello" },
      { human: ["$2 + 2 = 4$.", "$2 + 2 = 4$。"], lean: ": 2 + 2 = 4" },
    ],
    paper: [
      { text: ["We want to show that $2 + 2 = 4$.", "我們要證明 $2 + 2 = 4$。"], lines: [1, 1], lean: ["theorem hello : 2 + 2 = 4 := by"] },
      {
        text: [
          "Compute the left side: $2 + 2$ is $4$. Both sides are the same number, so they are equal.",
          "把左邊算出來：$2 + 2$ 是 $4$。兩邊是同一個數，所以相等。",
        ],
        lines: [2, 2], lean: ["rfl"], goal: "⊢ 2 + 2 = 4",
      },
    ],
  },

  "add-comm": {
    first: ["rfl"],
    unlock: "after-fail",
    unlockNote: [
      "`rfl` can only compute, and `a` and `b` are unknown: there is nothing to compute. New tools: `omega` (an arithmetic solver that works for every value), `exact Nat.add_comm a b` (quote the library fact) and `simp` (the simplifier: try it and see).",
      "`rfl` 只會計算，而 `a` 和 `b` 是未知數：沒有東西可以算。新工具：`omega`（對所有值都成立的算術解題器）、`exact Nat.add_comm a b`（直接引用函式庫的事實），以及 `simp`（化簡器：試試看會怎樣）。",
    ],
    introduces: ["omega", "exact", "simp"],
    here: {
      rfl: {
        frames: [],
        fails: [
          "`rfl` failed: the left-hand side `a + b` is not definitionally equal to the right-hand side `b + a`. a and b are unknown numbers, so Lean can't compute either side to compare them.",
          "`rfl` 失敗：左邊 `a + b` 與右邊 `b + a` 並非定義上相等（not definitionally equal）。a 和 b 是未知數，Lean 沒辦法把任何一邊算出來比較。",
        ],
      },
      omega: {
        frames: [
          { goal: ADD, note: ["a and b are any natural numbers (above the line); the claim is below.", "a 和 b 是任意自然數（橫線上方）；主張在下方。"] },
          done("omega checks that the equation holds for every possible a and b at once. Done.", "omega 一次檢查所有可能的 a 和 b，等式都成立。完成。"),
        ],
      },
      "exact Nat.add_comm a b": {
        frames: [
          { goal: ADD },
          done(
            "`Nat.add_comm a b` is a library fact that states `a + b = b + a`: exactly the goal. Done.",
            "`Nat.add_comm a b` 是函式庫裡的事實，內容正是 `a + b = b + a`：和目標完全一樣。完成。",
          ),
        ],
      },
      simp: {
        frames: [],
        fails: [
          "`simp` made no progress: swapping `a + b` is not one of its simplification rules, so the goal stays as it was. Not every true fact is a simp rule.",
          "`simp` 沒有進展（made no progress）：交換 `a + b` 不在它的化簡規則裡，所以目標原封不動。不是每個成立的事實都是 simp 規則。",
        ],
      },
    },
    coach: {
      statement: [
        "`(a b : Nat)` brings in two natural numbers, any numbers at all. The claim `a + b = b + a` must hold for every choice.",
        "`(a b : Nat)` 引入兩個自然數，可以是任何數。主張 `a + b = b + a` 必須對每一種選法都成立。",
      ],
      goal: [
        "Lean shows `a b : Nat` above the line (what you have) and `⊢ a + b = b + a` below it (what to prove).",
        "Lean 在橫線上方顯示 `a b : Nat`（你有的東西），下方是 `⊢ a + b = b + a`（要證明的東西）。",
      ],
      tactic: [
        "Try `rfl` first, the tool that worked last time. Expect it to fail: seeing why is the lesson.",
        "先試 `rfl`，上一題成功的工具。預期它會失敗：看懂為什麼就是這一課的重點。",
      ],
      result: [
        "rfl fails with \"not definitionally equal\". After that, `omega` or `exact Nat.add_comm a b` finishes with no goals left.",
        "rfl 會以「not definitionally equal」失敗。接著用 `omega` 或 `exact Nat.add_comm a b` 收尾，不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (add_swap):", "定理（add_swap）："], lean: "theorem add_swap" },
      { human: ["for any natural numbers $a$ and $b$,", "對任意自然數 $a$ 與 $b$，"], lean: "(a b : Nat)" },
      { human: ["$a + b$ equals $b + a$.", "$a + b$ 等於 $b + a$。"], lean: ": a + b = b + a" },
    ],
    paper: [
      { text: ["Let $a$ and $b$ be any natural numbers; we show $a + b = b + a$.", "設 $a$、$b$ 為任意自然數；我們要證明 $a + b = b + a$。"], lines: [1, 1], lean: ["theorem add_swap (a b : Nat) : a + b = b + a := by"] },
      {
        text: [
          "Adding in either order gives the same result: this is the commutative law of addition, true for all natural numbers.",
          "不論順序，相加的結果都一樣：這是加法交換律，對所有自然數都成立。",
        ],
        lines: [2, 2], lean: ["omega"], goal: ADD,
      },
    ],
  },

  "check-cases": {
    first: ["omega"],
    unlock: "after-fail",
    unlockNote: [
      "omega handles + and multiplying by fixed numbers, but not `n * n`, an unknown times an unknown. Here there are only ten cases, so let Lean check them all: `decide`. (`rfl` is unlocked too: try it to see what it is not for.)",
      "omega 能處理 + 和乘上固定數字，但不處理 `n * n`，未知數乘未知數。這裡只有十種情形，就讓 Lean 全部檢查：`decide`。（`rfl` 也解鎖了：試試看它不適合做什麼。）",
    ],
    introduces: [],
    here: {
      omega: {
        frames: [],
        fails: [
          "omega could not prove the goal: it can't handle `n * n` (an unknown times an unknown), so it treats that product as a mystery number and finds a \"possible counterexample\".",
          "omega 無法證明這個目標：它不處理 `n * n`（未知數乘未知數），只好把這個乘積當成一個神祕的數，於是找到一個「可能的反例」。",
        ],
      },
      decide: {
        frames: [
          {
            goal: "⊢ ∀ (n : Nat), n < 10 → n * n % 10 ≠ 2",
            note: ["Lean spells out `∀ n < 10`: for every n, if n < 10 then n * n % 10 ≠ 2.", "Lean 把 `∀ n < 10` 完整寫出：對每個 n，若 n < 10，則 n * n % 10 ≠ 2。"],
          },
          {
            goal: "⊢ 0 ≠ 2 ∧ 1 ≠ 2 ∧ 4 ≠ 2 ∧ 9 ≠ 2 ∧ 6 ≠ 2 ∧ 5 ≠ 2 ∧ 6 ≠ 2 ∧ 9 ≠ 2 ∧ 4 ≠ 2 ∧ 1 ≠ 2",
            teaching: true,
            note: [
              "Teaching frame (Lean doesn't display this): the last digits of 0², 1², …, 9² are 0, 1, 4, 9, 6, 5, 6, 9, 4, 1.",
              "教學畫面（Lean 不會顯示）：0²、1²、…、9² 的個位數是 0、1、4、9、6、5、6、9、4、1。",
            ],
          },
          done("None of them is 2: every case evaluates to `true`. Done.", "沒有一個是 2：每種情形都算出 `true`。完成。"),
        ],
      },
      rfl: {
        frames: [],
        fails: [
          "`rfl` failed: it expects the goal to be a relation like `x = x`. This goal is a \"for every n…\" statement, not an equation, so reflexivity doesn't apply.",
          "`rfl` 失敗：它要求目標是像 `x = x` 這樣的關係。這個目標是「對每個 n……」的陳述，不是等式，所以自反性用不上。",
        ],
      },
    },
    coach: {
      statement: [
        "Read `∀ n < 10, n * n % 10 ≠ 2` as: for every n below 10, the last digit of n × n is not 2. `%` is the remainder, `≠` means \"not equal\".",
        "把 `∀ n < 10, n * n % 10 ≠ 2` 讀成：對每個小於 10 的 n，n × n 的個位數不是 2。`%` 是餘數，`≠` 是「不等於」。",
      ],
      goal: [
        "Lean writes the goal out in full: `⊢ ∀ (n : Nat), n < 10 → n * n % 10 ≠ 2`. The arrow → means \"if … then\". No hypotheses yet.",
        "Lean 把目標完整寫出：`⊢ ∀ (n : Nat), n < 10 → n * n % 10 ≠ 2`。箭頭 → 的意思是「若……則」。目前還沒有前提。",
      ],
      tactic: [
        "Try `omega`, the solver from the last problem. It will fail, because of `n * n`.",
        "試試 `omega`，上一題的解題器。它會失敗，原因是 `n * n`。",
      ],
      result: [
        "omega reports a possible counterexample. Then `decide` checks the ten cases and leaves no goals.",
        "omega 會回報一個可能的反例。接著 `decide` 檢查十種情形，不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (no_square_ends_in_two):", "定理（no_square_ends_in_two）："], lean: "theorem no_square_ends_in_two" },
      { human: ["for every natural number $n$ below $10$,", "對每個小於 $10$ 的自然數 $n$，"], lean: ": ∀ n < 10," },
      { human: ["the last digit of $n^2$ is not $2$.", "$n^2$ 的個位數不是 $2$。"], lean: "n * n % 10 ≠ 2" },
    ],
    paper: [
      { text: ["We show: for each $n < 10$, the last digit of $n^2$ is not $2$.", "我們要證明：對每個 $n < 10$，$n^2$ 的個位數不是 $2$。"], lines: [1, 1], lean: ["theorem no_square_ends_in_two : ∀ n < 10, n * n % 10 ≠ 2 := by"] },
      {
        text: [
          "Check all ten cases: the last digits of $0^2, 1^2, \\dots, 9^2$ are $0, 1, 4, 9, 6, 5, 6, 9, 4, 1$. None of them is $2$.",
          "逐一檢查十種情形：$0^2, 1^2, \\dots, 9^2$ 的個位數是 $0, 1, 4, 9, 6, 5, 6, 9, 4, 1$。沒有一個是 $2$。",
        ],
        lines: [2, 2], lean: ["decide"], goal: "⊢ ∀ (n : Nat), n < 10 → n * n % 10 ≠ 2",
      },
    ],
  },

  squeeze: {
    first: ["decide"],
    unlock: "after-fail",
    unlockNote: [
      "`decide` only evaluates goals without unknowns, and `n` is unknown (the hypotheses don't help it). Use `omega`, which reads h₁ and h₂ too. `simp` is unlocked as well, to try.",
      "`decide` 只能計算沒有未知數的目標，而 `n` 是未知數（前提幫不了它）。改用 `omega`，它也會讀 h₁ 和 h₂。`simp` 也解鎖了，可以試試。",
    ],
    introduces: [],
    here: {
      decide: {
        frames: [],
        fails: [
          "\"Expected type must not contain free variables\": `n` is a variable, not a specific number, so there is nothing to evaluate. decide looks only at the goal, not at h₁ and h₂.",
          "「Expected type must not contain free variables」（目標不能含有自由變數）：`n` 是變數，不是具體的數，所以沒有東西可以算。decide 只看目標，不看 h₁ 和 h₂。",
        ],
      },
      omega: {
        frames: [
          { goal: SQ, note: ["Above the line: n and the two facts about it.", "橫線上方：n，以及關於它的兩個事實。"] },
          done("omega combines h₁ (so n ≥ 4) and h₂ (so n ≤ 4): n must be 4. Done.", "omega 結合 h₁（所以 n ≥ 4）與 h₂（所以 n ≤ 4）：n 只能是 4。完成。"),
        ],
      },
      simp: {
        frames: [],
        fails: [
          "`simp` made no progress: `n = 4` has nothing to simplify, and plain `simp` does not combine the hypotheses h₁ and h₂.",
          "`simp` 沒有進展：`n = 4` 沒有東西可以化簡，而單純的 `simp` 不會把前提 h₁ 和 h₂ 結合起來。",
        ],
      },
    },
    coach: {
      statement: [
        "`(h₁ : 3 < n) (h₂ : n < 5)` are two facts you are given, with names. The claim is `n = 4`.",
        "`(h₁ : 3 < n) (h₂ : n < 5)` 是給你的兩個事實，各有名字。主張是 `n = 4`。",
      ],
      goal: [
        "Above the line (What you know): `n : Nat`, `h₁ : 3 < n`, `h₂ : n < 5`. Below: `⊢ n = 4`.",
        "橫線上方（已知）：`n : Nat`、`h₁ : 3 < n`、`h₂ : n < 5`。下方：`⊢ n = 4`。",
      ],
      tactic: [
        "Try `decide`, which just checked ten cases. It fails here: n is not a specific number.",
        "試試 `decide`，剛剛它才檢查完十種情形。這裡它會失敗：n 不是具體的數。",
      ],
      result: [
        "decide complains about free variables. Then `omega`, using h₁ and h₂, leaves no goals.",
        "decide 會抱怨有自由變數。接著 `omega` 用上 h₁ 和 h₂，不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (squeeze):", "定理（squeeze）："], lean: "theorem squeeze" },
      { human: ["let $n$ be a natural number", "設 $n$ 為自然數，"], lean: "(n : Nat)" },
      { human: ["with $3 < n$", "滿足 $3 < n$"], lean: "(h₁ : 3 < n)" },
      { human: ["and $n < 5$.", "且 $n < 5$。"], lean: "(h₂ : n < 5)" },
      { human: ["Then $n = 4$.", "則 $n = 4$。"], lean: ": n = 4" },
    ],
    paper: [
      {
        text: ["Let $n$ be a natural number with $3 < n$ and $n < 5$; we show $n = 4$.", "設自然數 $n$ 滿足 $3 < n$ 且 $n < 5$；我們要證明 $n = 4$。"],
        lines: [1, 1], lean: ["theorem squeeze (n : Nat) (h₁ : 3 < n) (h₂ : n < 5) : n = 4 := by"],
      },
      {
        text: [
          "For whole numbers, $3 < n$ means $n \\ge 4$, and $n < 5$ means $n \\le 4$. So $n = 4$.",
          "對整數來說，$3 < n$ 表示 $n \\ge 4$，$n < 5$ 表示 $n \\le 4$。所以 $n = 4$。",
        ],
        lines: [2, 2], lean: ["omega"], goal: SQ,
      },
    ],
  },

  "reverse-twice": {
    first: ["rfl", "omega"],
    unlock: "after-fail",
    unlockNote: [
      "rfl can't compute with an unknown list, and omega only knows numbers. This goal needs a known fact about lists: `simp` finds it, and `simp?` also tells you its name.",
      "rfl 沒辦法拿未知的串列來計算，omega 只認得數字。這個目標需要一條關於串列的已知事實：`simp` 會找到它，`simp?` 還會告訴你它的名字。",
    ],
    introduces: ["simp?"],
    here: {
      rfl: {
        frames: [],
        fails: [
          "`rfl` failed: `xs.reverse.reverse` is not definitionally equal to `xs`. xs is an unknown list, so Lean can't run `reverse` on it to compare.",
          "`rfl` 失敗：`xs.reverse.reverse` 與 `xs` 並非定義上相等。xs 是未知的串列，Lean 沒辦法真的對它執行 `reverse` 來比較。",
        ],
      },
      omega: {
        frames: [],
        fails: [
          "omega found no usable constraints: it works with numbers (`+`, `<`, …), and this goal is about lists.",
          "omega 找不到可用的條件（No usable constraints）：它處理的是數字（`+`、`<`……），而這個目標是關於串列的。",
        ],
      },
      simp: {
        frames: [
          { goal: REV },
          {
            goal: "xs : List Nat\n⊢ xs = xs",
            teaching: true,
            note: [
              "Teaching frame (Lean doesn't display this step): simp rewrites with the rule `List.reverse_reverse`: reversing twice gives the list back.",
              "教學畫面（Lean 不會顯示這一步）：simp 用規則 `List.reverse_reverse` 改寫：反轉兩次就回到原本的串列。",
            ],
          },
          done("Both sides identical: simp closes it. Done.", "兩邊一模一樣：simp 收尾。完成。"),
        ],
      },
      "simp?": {
        frames: [
          { goal: REV },
          done(
            "Done, and Lean adds `Try this: simp only [List.reverse_reverse]`: the one rule it used. Click it to paste the shorter, exact proof.",
            "完成，而且 Lean 附上 `Try this: simp only [List.reverse_reverse]`：它用到的唯一一條規則。點它就能貼上更短、更精確的證明。",
          ),
        ],
      },
    },
    coach: {
      statement: [
        "`xs : List Nat` is any list of numbers. `xs.reverse.reverse` means: reverse xs, then reverse the result again.",
        "`xs : List Nat` 是任意一個數字串列。`xs.reverse.reverse` 的意思是：把 xs 反轉，再把結果反轉一次。",
      ],
      goal: ["`⊢ xs.reverse.reverse = xs`: an equation between lists, with xs unknown.", "`⊢ xs.reverse.reverse = xs`：兩個串列之間的等式，而 xs 是未知的。"],
      tactic: [
        "Try `rfl` or `omega`, the tools you know. Both fail, for different reasons: read each error.",
        "試試 `rfl` 或 `omega`，你已經認識的工具。兩個都會失敗，原因不同：讀讀各自的錯誤訊息。",
      ],
      result: [
        "rfl says \"not definitionally equal\", omega says \"no usable constraints\". Then `simp` closes the goal; `simp?` also names the rule it used.",
        "rfl 說「not definitionally equal」，omega 說「No usable constraints」。接著 `simp` 結束目標；`simp?` 還會說出它用的規則。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (reverse_twice):", "定理（reverse_twice）："], lean: "theorem reverse_twice" },
      { human: ["for any list $xs$ of natural numbers,", "對任意自然數串列 $xs$，"], lean: "(xs : List Nat)" },
      { human: ["reversing $xs$ twice gives $xs$ back.", "把 $xs$ 反轉兩次會回到 $xs$。"], lean: ": xs.reverse.reverse = xs" },
    ],
    paper: [
      { text: ["Let $xs$ be any list; we show that reversing it twice gives $xs$ back.", "設 $xs$ 為任意串列；我們要證明把它反轉兩次會回到 $xs$。"], lines: [1, 1], lean: ["theorem reverse_twice (xs : List Nat) : xs.reverse.reverse = xs := by"] },
      {
        text: [
          "Reversing puts the last element first; reversing again restores the original order. This is a known fact about lists, so the two sides are equal.",
          "反轉會把最後一個元素放到最前面；再反轉一次就恢復原本的順序。這是關於串列的已知事實，所以兩邊相等。",
        ],
        lines: [2, 2], lean: ["simp"], goal: REV,
      },
    ],
  },

  "rewrite-chain": {
    first: ["exact h₂"],
    unlock: "after-fail",
    unlockNote: [
      "`exact` needs a proof of exactly the goal, and `h₂` proves `b = c`, not `a = c`. New tool: `rw` (rewrite) turns the goal into what you have: `rw [h₁]` replaces a by b. After that, `exact h₂` fits.",
      "`exact` 需要的是剛好證明目標的東西，而 `h₂` 證明的是 `b = c`，不是 `a = c`。新工具：`rw`（改寫）把目標變成你手上有的形狀：`rw [h₁]` 把 a 換成 b。之後 `exact h₂` 就吻合了。",
    ],
    introduces: ["rw"],
    here: {
      "rw [h₁]": {
        frames: [
          { goal: CH + "⊢ a = c" },
          {
            goal: CH + "⊢ b = c",
            note: ["Every a in the goal became b (h₁ says a = b). A `sorry` stays after it for what is left.", "目標裡所有的 a 都換成了 b（h₁ 說 a = b）。後面留著一個 `sorry`，代表剩下的部分。"],
          },
        ],
      },
      "rw [h₂]": {
        fails: [
          "Used first: the rewrite failed, it did not find `b` in `a = c`. There is no b in the goal yet; do `rw [h₁]` first.",
          "一開始就用：改寫失敗，在 `a = c` 裡找不到 `b`。目標裡還沒有 b；先做 `rw [h₁]`。",
        ],
        frames: [
          { goal: CH + "⊢ b = c", note: ["After `rw [h₁]`.", "在 `rw [h₁]` 之後。"] },
          {
            goal: CH + "⊢ c = c",
            teaching: true,
            note: ["b became c. (Lean doesn't display this step: rw closes it at once.)", "b 換成了 c。（Lean 不會顯示這一步：rw 立刻就收尾了。）"],
          },
          DONE,
        ],
      },
      "exact h₂": {
        fails: [
          "Used first: type mismatch. `h₂` has type `b = c` but the goal is `a = c`. exact accepts only an exact fit.",
          "一開始就用：型別不符（Type mismatch）。`h₂` 的型別是 `b = c`，但目標是 `a = c`。exact 只接受完全吻合的東西。",
        ],
        frames: [
          { goal: CH + "⊢ b = c", note: ["After `rw [h₁]`.", "在 `rw [h₁]` 之後。"] },
          done("Now the goal is `b = c`, exactly h₂. Done.", "現在目標是 `b = c`，正好就是 h₂。完成。"),
        ],
      },
      "rw [h₁, h₂]": {
        frames: [
          { goal: CH + "⊢ a = c" },
          { goal: CH + "⊢ b = c", teaching: true, note: ["h₁: a became b. (Lean doesn't stop here.)", "h₁：a 換成 b。（Lean 不會停在這裡。）"] },
          { goal: CH + "⊢ c = c", teaching: true, note: ["h₂: b became c. (Lean doesn't stop here.)", "h₂：b 換成 c。（Lean 不會停在這裡。）"] },
          DONE,
        ],
      },
    },
    coach: {
      statement: [
        "Given `h₁ : a = b` and `h₂ : b = c`, prove `a = c`: equality passes along a chain.",
        "已知 `h₁ : a = b` 與 `h₂ : b = c`，證明 `a = c`：相等可以沿著一條鏈傳下去。",
      ],
      goal: ["Three numbers and two equations above the line; `⊢ a = c` below.", "橫線上方是三個數和兩個等式；下方是 `⊢ a = c`。"],
      tactic: [
        "Try `exact h₂`: h₂ looks close to the goal. It isn't close enough, and Lean says how.",
        "試試 `exact h₂`：h₂ 看起來很接近目標。但還不夠接近，Lean 會告訴你差在哪裡。",
      ],
      result: [
        "Lean reports a type mismatch (b = c against a = c). After `rw [h₁]` the goal becomes `b = c`, and `exact h₂` finishes it.",
        "Lean 回報型別不符（b = c 對上 a = c）。`rw [h₁]` 之後目標變成 `b = c`，再用 `exact h₂` 收尾。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (chain):", "定理（chain）："], lean: "theorem chain" },
      { human: ["let $a$, $b$, $c$ be natural numbers", "設 $a$、$b$、$c$ 為自然數，"], lean: "(a b c : Nat)" },
      { human: ["with $a = b$", "滿足 $a = b$"], lean: "(h₁ : a = b)" },
      { human: ["and $b = c$.", "且 $b = c$。"], lean: "(h₂ : b = c)" },
      { human: ["Then $a = c$.", "則 $a = c$。"], lean: ": a = c" },
    ],
    paper: [
      { text: ["Suppose $a = b$ and $b = c$; we show $a = c$.", "假設 $a = b$ 且 $b = c$；我們要證明 $a = c$。"], lines: [1, 1], lean: ["theorem chain (a b c : Nat) (h₁ : a = b) (h₂ : b = c) : a = c := by"] },
      {
        text: [
          "Replace $a$ by $b$ (since $a = b$), then $b$ by $c$ (since $b = c$): the claim becomes $c = c$, which is true.",
          "把 $a$ 換成 $b$（因為 $a = b$），再把 $b$ 換成 $c$（因為 $b = c$）：主張變成 $c = c$，顯然成立。",
        ],
        lines: [2, 2], lean: ["rw [h₁, h₂]"], goal: CH + "⊢ a = c",
      },
    ],
  },

  regroup: {
    first: ["omega"],
    unlock: "after-fail",
    unlockNote: [
      "omega can't multiply unknowns. Rewrite with library facts instead, one at a time: first swap a and b (`Nat.mul_comm a b`), then move the brackets (`Nat.mul_assoc`).",
      "omega 不能處理未知數相乘。改用函式庫的事實改寫，一次一條：先交換 a 和 b（`Nat.mul_comm a b`），再移動括號（`Nat.mul_assoc`）。",
    ],
    introduces: [],
    here: {
      "rw [Nat.mul_comm a b]": {
        frames: [
          { goal: RG + "⊢ a * b * c = b * (a * c)" },
          { goal: RG + "⊢ b * a * c = b * (a * c)", note: ["`a * b` became `b * a`. A sorry stays for the rest.", "`a * b` 變成了 `b * a`。後面留著 sorry 給剩下的部分。"] },
        ],
      },
      "rw [Nat.mul_assoc]": {
        fails: [
          "Used first, it moves the brackets on the left, `a * (b * c) = b * (a * c)`, and Lean reports unsolved goals: a and b are still in the wrong order. Swap them first.",
          "一開始就用，它會移動左邊的括號，變成 `a * (b * c) = b * (a * c)`，Lean 回報目標未解決（unsolved goals）：a 和 b 的順序還是錯的。先交換它們。",
        ],
        frames: [
          { goal: RG + "⊢ b * a * c = b * (a * c)", note: ["After `rw [Nat.mul_comm a b]`.", "在 `rw [Nat.mul_comm a b]` 之後。"] },
          {
            goal: RG + "⊢ b * (a * c) = b * (a * c)",
            teaching: true,
            note: ["`(b * a) * c` became `b * (a * c)`. (Lean doesn't display this step: rw closes it at once.)", "`(b * a) * c` 變成了 `b * (a * c)`。（Lean 不會顯示這一步：rw 立刻就收尾了。）"],
          },
          DONE,
        ],
      },
      omega: {
        frames: [],
        fails: [
          "omega could not prove the goal: `a * b * c` multiplies unknowns, so it treats each product as a mystery number and finds a possible counterexample.",
          "omega 無法證明這個目標：`a * b * c` 是未知數相乘，它只好把每個乘積當成神祕的數，於是找到一個可能的反例。",
        ],
      },
    },
    coach: {
      statement: [
        "`a * b * c` means `(a * b) * c`. The claim: it equals `b * (a * c)`, the same three numbers, swapped and regrouped.",
        "`a * b * c` 的意思是 `(a * b) * c`。主張：它等於 `b * (a * c)`，同樣三個數，只是交換並重新分組。",
      ],
      goal: ["`a b c : Nat` above the line; `⊢ a * b * c = b * (a * c)` below.", "橫線上方是 `a b c : Nat`；下方是 `⊢ a * b * c = b * (a * c)`。"],
      tactic: [
        "Try `omega`, the strongest tool so far. Multiplying unknowns is out of its reach.",
        "試試 `omega`，目前最強的工具。未知數相乘超出它的能力。",
      ],
      result: [
        "omega reports a possible counterexample. Then the two rewrites, in order, leave no goals.",
        "omega 回報一個可能的反例。接著依序做兩次改寫，不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (regroup):", "定理（regroup）："], lean: "theorem regroup" },
      { human: ["for any natural numbers $a$, $b$, $c$,", "對任意自然數 $a$、$b$、$c$，"], lean: "(a b c : Nat)" },
      { human: ["$(ab)c = b(ac)$.", "$(ab)c = b(ac)$。"], lean: ": a * b * c = b * (a * c)" },
    ],
    paper: [
      { text: ["Let $a, b, c$ be natural numbers; we show $(ab)c = b(ac)$.", "設 $a, b, c$ 為自然數；我們要證明 $(ab)c = b(ac)$。"], lines: [1, 1], lean: ["theorem regroup (a b c : Nat) : a * b * c = b * (a * c) := by"] },
      {
        text: ["Swap the first two factors: $(ab)c = (ba)c$. Then regroup: $(ba)c = b(ac)$.", "交換前兩個因數：$(ab)c = (ba)c$。再重新分組：$(ba)c = b(ac)$。"],
        lines: [2, 2], lean: ["rw [Nat.mul_comm a b, Nat.mul_assoc]"], goal: RG + "⊢ a * b * c = b * (a * c)",
      },
    ],
  },

  "le-chain": {
    first: ["exact h₂"],
    unlock: "after-fail",
    unlockNote: [
      "`h₂ : b ≤ c` is not the goal `a ≤ c`, but it is one piece of it. New tool: `apply` works backwards: `apply Nat.le_trans h₁` reduces the goal to `b ≤ c`. Or give all the pieces at once with `exact Nat.le_trans h₁ h₂`; `omega` works too.",
      "`h₂ : b ≤ c` 不是目標 `a ≤ c`，但它是其中一塊。新工具：`apply` 從目標往回推：`apply Nat.le_trans h₁` 把目標化成 `b ≤ c`。也可以用 `exact Nat.le_trans h₁ h₂` 一次給齊所有的塊；`omega` 也行。",
    ],
    introduces: ["apply"],
    here: {
      "apply Nat.le_trans h₁": {
        frames: [
          { goal: LE + "⊢ a ≤ c" },
          {
            goal: LE + "⊢ b ≤ c",
            note: [
              "Nat.le_trans says: a ≤ b and b ≤ c give a ≤ c. h₁ supplied the first piece, so only `b ≤ c` is left.",
              "Nat.le_trans 說：由 a ≤ b 和 b ≤ c 得到 a ≤ c。h₁ 填好了第一塊，所以只剩下 `b ≤ c`。",
            ],
          },
        ],
      },
      "exact h₂": {
        fails: [
          "Used first: type mismatch. h₂ has type `b ≤ c` but the goal is `a ≤ c`.",
          "一開始就用：型別不符。h₂ 的型別是 `b ≤ c`，但目標是 `a ≤ c`。",
        ],
        frames: [
          { goal: LE + "⊢ b ≤ c", note: ["After `apply Nat.le_trans h₁`.", "在 `apply Nat.le_trans h₁` 之後。"] },
          done("Now h₂ fits exactly. Done.", "現在 h₂ 完全吻合。完成。"),
        ],
      },
      "exact Nat.le_trans h₁ h₂": {
        frames: [
          { goal: LE + "⊢ a ≤ c" },
          done(
            "`Nat.le_trans h₁ h₂` is a proof of `a ≤ c`: the fact with both pieces filled in. Done.",
            "`Nat.le_trans h₁ h₂` 就是 `a ≤ c` 的證明：兩塊都填好的事實。完成。",
          ),
        ],
      },
      omega: {
        frames: [{ goal: LE + "⊢ a ≤ c" }, done("omega chains the inequalities h₁ and h₂ by itself. Done.", "omega 自己把不等式 h₁ 和 h₂ 串起來。完成。")],
      },
    },
    coach: {
      statement: [
        "Given `a ≤ b` and `b ≤ c`, prove `a ≤ c`. The library calls this fact `Nat.le_trans` (transitivity).",
        "已知 `a ≤ b` 與 `b ≤ c`，證明 `a ≤ c`。函式庫把這個事實叫做 `Nat.le_trans`（遞移性）。",
      ],
      goal: ["Above: a, b, c and the two inequalities h₁, h₂. Below: `⊢ a ≤ c`.", "上方：a、b、c 和兩個不等式 h₁、h₂。下方：`⊢ a ≤ c`。"],
      tactic: ["Try `exact h₂`: it is one of the pieces, but not the whole proof.", "試試 `exact h₂`：它是其中一塊，但不是整個證明。"],
      result: [
        "Type mismatch first. Then `apply Nat.le_trans h₁` leaves `⊢ b ≤ c`, and `exact h₂` closes it.",
        "先出現型別不符。接著 `apply Nat.le_trans h₁` 留下 `⊢ b ≤ c`，再用 `exact h₂` 結束。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (le_chain):", "定理（le_chain）："], lean: "theorem le_chain" },
      { human: ["let $a$, $b$, $c$ be natural numbers", "設 $a$、$b$、$c$ 為自然數，"], lean: "(a b c : Nat)" },
      { human: ["with $a \\le b$", "滿足 $a \\le b$"], lean: "(h₁ : a ≤ b)" },
      { human: ["and $b \\le c$.", "且 $b \\le c$。"], lean: "(h₂ : b ≤ c)" },
      { human: ["Then $a \\le c$.", "則 $a \\le c$。"], lean: ": a ≤ c" },
    ],
    paper: [
      { text: ["Suppose $a \\le b$ and $b \\le c$; we show $a \\le c$.", "假設 $a \\le b$ 且 $b \\le c$；我們要證明 $a \\le c$。"], lines: [1, 1], lean: ["theorem le_chain (a b c : Nat) (h₁ : a ≤ b) (h₂ : b ≤ c) : a ≤ c := by"] },
      { text: ["$\\le$ is transitive: from $a \\le b$ and $b \\le c$ we get $a \\le c$.", "$\\le$ 具有遞移性：由 $a \\le b$ 和 $b \\le c$ 得到 $a \\le c$。"], lines: [2, 2], lean: ["exact Nat.le_trans h₁ h₂"], goal: LE + "⊢ a ≤ c" },
    ],
  },

  search: {
    first: ["decide"],
    unlock: "after-fail",
    unlockNote: [
      "decide can't evaluate a goal with an unknown n. The fact `0 < n + 1` is surely in the library: let `exact?` search for it, then paste what it finds.",
      "decide 沒辦法計算含有未知數 n 的目標。`0 < n + 1` 這個事實一定在函式庫裡：讓 `exact?` 去搜尋，再把找到的結果貼上。",
    ],
    introduces: ["exact?"],
    here: {
      "exact?": {
        frames: [
          { goal: SUCC },
          done(
            "Solved, and Lean prints `Try this: exact Nat.zero_lt_succ n`. Paste it in place of exact?: the search runs again on every check, the found line is instant.",
            "解決了，Lean 印出 `Try this: exact Nat.zero_lt_succ n`。把它貼上取代 exact?：搜尋每次檢查都會重跑，找到的那一行則是即時的。",
          ),
        ],
      },
      "exact Nat.zero_lt_succ n": {
        frames: [
          { goal: SUCC },
          done(
            "`Nat.zero_lt_succ n` proves `0 < n.succ`, and `n.succ` (the successor) is the library's name for n + 1. Done.",
            "`Nat.zero_lt_succ n` 證明 `0 < n.succ`，而 `n.succ`（後繼數）就是函式庫對 n + 1 的稱呼。完成。",
          ),
        ],
      },
      decide: {
        frames: [],
        fails: [
          "\"Expected type must not contain free variables\": n is unknown, so there is nothing to evaluate.",
          "「Expected type must not contain free variables」：n 是未知數，沒有東西可以計算。",
        ],
      },
    },
    coach: {
      statement: ["`0 < n + 1`: one more than any natural number is positive.", "`0 < n + 1`：任何自然數加一都是正數。"],
      goal: ["`n : Nat` above, `⊢ 0 < n + 1` below.", "上方是 `n : Nat`，下方是 `⊢ 0 < n + 1`。"],
      tactic: ["Try `decide` once more: it fails for the same reason as in the squeeze problem.", "再試一次 `decide`：它會失敗，原因和夾擠那一題一樣。"],
      result: [
        "Free-variable error first. Then `exact?` finds the lemma (a \"Try this\" message) and closes the goal.",
        "先出現自由變數的錯誤。接著 `exact?` 找到引理（一則「Try this」訊息），並結束目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (succ_positive):", "定理（succ_positive）："], lean: "theorem succ_positive" },
      { human: ["for any natural number $n$,", "對任意自然數 $n$，"], lean: "(n : Nat)" },
      { human: ["$0 < n + 1$.", "$0 < n + 1$。"], lean: ": 0 < n + 1" },
    ],
    paper: [
      { text: ["Let $n$ be a natural number; we show $0 < n + 1$.", "設 $n$ 為自然數；我們要證明 $0 < n + 1$。"], lines: [1, 1], lean: ["theorem succ_positive (n : Nat) : 0 < n + 1 := by"] },
      {
        text: [
          "$n + 1$ is the number after $n$, and the number after any natural number is at least $1$, so it is positive.",
          "$n + 1$ 是 $n$ 的下一個數，而任何自然數的下一個數至少是 $1$，所以它是正數。",
        ],
        lines: [2, 2], lean: ["exact Nat.zero_lt_succ n"], goal: SUCC,
      },
    ],
  },

  "length-swap": {
    first: ["omega"],
    unlock: "after-fail",
    unlockNote: [
      "omega treats `(xs ++ ys).length` as just another unknown, unrelated to xs.length and ys.length. First rewrite with the fact `List.length_append`, then swap the sum with `Nat.add_comm` (or finish with omega). `simp` is unlocked too: see how far it gets.",
      "omega 把 `(xs ++ ys).length` 當成另一個未知數，和 xs.length、ys.length 毫無關係。先用事實 `List.length_append` 改寫，再用 `Nat.add_comm` 交換和的順序（或用 omega 收尾）。`simp` 也解鎖了：看看它能走多遠。",
    ],
    introduces: [],
    here: {
      "rw [List.length_append]": {
        frames: [
          { goal: LEN + "⊢ (xs ++ ys).length = ys.length + xs.length" },
          {
            goal: LEN + "⊢ xs.length + ys.length = ys.length + xs.length",
            note: ["The length of the joined list became the sum of the two lengths. A sorry stays for the order.", "接起來的串列長度變成兩個長度的和。後面留著 sorry 處理順序。"],
          },
        ],
      },
      "rw [Nat.add_comm]": {
        fails: [
          "Used first, it swaps the only sum it finds, on the right: `(xs ++ ys).length = xs.length + ys.length`, and Lean reports unsolved goals. Rewrite with `List.length_append` first.",
          "一開始就用，它會交換它找到的唯一一個和，在右邊：變成 `(xs ++ ys).length = xs.length + ys.length`，Lean 回報目標未解決。先用 `List.length_append` 改寫。",
        ],
        frames: [
          { goal: LEN + "⊢ xs.length + ys.length = ys.length + xs.length", note: ["After `rw [List.length_append]`.", "在 `rw [List.length_append]` 之後。"] },
          {
            goal: LEN + "⊢ ys.length + xs.length = ys.length + xs.length",
            teaching: true,
            note: ["The first sum it found, on the left, was swapped. (Lean doesn't display this step: rw closes it at once.)", "它找到的第一個和（在左邊）被交換了。（Lean 不會顯示這一步：rw 立刻就收尾了。）"],
          },
          DONE,
        ],
      },
      omega: {
        fails: [
          "Used first: omega could not prove the goal. It sees three unrelated unknown numbers, `(xs ++ ys).length`, `xs.length` and `ys.length`, and finds a possible counterexample.",
          "一開始就用：omega 無法證明這個目標。它看到三個互不相關的未知數 `(xs ++ ys).length`、`xs.length` 和 `ys.length`，於是找到一個可能的反例。",
        ],
        frames: [
          { goal: LEN + "⊢ xs.length + ys.length = ys.length + xs.length", note: ["After `rw [List.length_append]`.", "在 `rw [List.length_append]` 之後。"] },
          done("Now it is `x + y = y + x` with lengths as the numbers: omega's ground. Done.", "現在它就是 `x + y = y + x`，只是數字換成長度：omega 的拿手項目。完成。"),
        ],
      },
      simp: {
        frames: [],
        fails: [
          "simp opens up the length (the goal becomes `xs.length + ys.length = ys.length + xs.length`) but has no rule to swap the sum, so Lean reports unsolved goals. After the rewrite, it makes no progress at all.",
          "simp 會展開長度（目標變成 `xs.length + ys.length = ys.length + xs.length`），但沒有交換和的規則，所以 Lean 回報目標未解決。在改寫之後再用，它完全沒有進展。",
        ],
      },
    },
    coach: {
      statement: [
        "`xs ++ ys` joins two lists. The claim: its length is `ys.length + xs.length`, the two lengths added in the other order.",
        "`xs ++ ys` 把兩個串列接起來。主張：它的長度是 `ys.length + xs.length`，兩個長度以相反順序相加。",
      ],
      goal: ["Two lists above; `⊢ (xs ++ ys).length = ys.length + xs.length` below.", "上方是兩個串列；下方是 `⊢ (xs ++ ys).length = ys.length + xs.length`。"],
      tactic: [
        "Try `omega`: it handled sums before. Here it doesn't know what `++` does to a length.",
        "試試 `omega`：它以前處理過加法。但這裡它不知道 `++` 對長度做了什麼。",
      ],
      result: [
        "omega reports a possible counterexample. Then `rw [List.length_append]` and `rw [Nat.add_comm]` (or omega) leave no goals.",
        "omega 回報一個可能的反例。接著 `rw [List.length_append]` 和 `rw [Nat.add_comm]`（或 omega）讓目標全部完成。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (length_swap):", "定理（length_swap）："], lean: "theorem length_swap" },
      { human: ["for any lists $xs$ and $ys$ of natural numbers,", "對任意自然數串列 $xs$ 與 $ys$，"], lean: "(xs ys : List Nat)" },
      { human: ["the length of $xs$ followed by $ys$ is $|ys| + |xs|$.", "$xs$ 接上 $ys$ 的長度是 $|ys| + |xs|$。"], lean: ": (xs ++ ys).length = ys.length + xs.length" },
    ],
    paper: [
      {
        text: [
          "Let $xs$ and $ys$ be lists; we show that the length of $xs$ followed by $ys$ is $|ys| + |xs|$.",
          "設 $xs$、$ys$ 為串列；我們要證明 $xs$ 接上 $ys$ 的長度是 $|ys| + |xs|$。",
        ],
        lines: [1, 1], lean: ["theorem length_swap (xs ys : List Nat) : (xs ++ ys).length = ys.length + xs.length := by"],
      },
      {
        text: [
          "The length of a joined list is the sum of the lengths, $|xs| + |ys|$; addition can be done in either order, so this is $|ys| + |xs|$.",
          "接起來的串列長度是兩個長度的和 $|xs| + |ys|$；加法不論順序，所以它等於 $|ys| + |xs|$。",
        ],
        lines: [2, 2], lean: ["rw [List.length_append, Nat.add_comm]"], goal: LEN + "⊢ (xs ++ ys).length = ys.length + xs.length",
      },
    ],
  },

  "even-sum": {
    first: ["omega"],
    unlock: "after-fail",
    unlockNote: [
      "omega can't choose a value for k in `∃ k`, and it can't look inside ha and hb. New tools: `obtain` unpacks \"a is even\" into a number x with a = 2 * x; `refine ⟨x + y, ?_⟩` names the witness and leaves its equation, which omega then finishes.",
      "omega 沒辦法替 `∃ k` 選出 k 的值，也看不進 ha 和 hb 的內部。新工具：`obtain` 把「a 是偶數」拆成一個數 x 和 a = 2 * x；`refine ⟨x + y, ?_⟩` 說出見證並留下它的等式，再交給 omega 收尾。",
    ],
    introduces: ["obtain", "refine"],
    here: {
      "obtain ⟨x, hx⟩ := ha": {
        frames: [
          { goal: E0 },
          {
            goal: E1,
            note: ["ha is used up: in its place come a number x and the fact hx : a = 2 * x.", "ha 被拆開了：取而代之的是一個數 x 和事實 hx : a = 2 * x。"],
          },
        ],
      },
      "obtain ⟨y, hy⟩ := hb": {
        frames: [
          { goal: E1, note: ["After the first obtain.", "在第一個 obtain 之後。"] },
          { goal: E2, note: ["hb unpacked the same way: y and hy : b = 2 * y.", "hb 也用同樣方式拆開：y 和 hy : b = 2 * y。"] },
        ],
      },
      "refine ⟨x + y, ?_⟩": {
        fails: [
          "Clicked before the obtains: `Unknown identifier x` (and y). The witness must be built from numbers you have; unpack ha and hb first.",
          "在 obtain 之前就用：`Unknown identifier x`（還有 y），找不到這個名字。見證必須用你手上有的數來組成；先拆開 ha 和 hb。",
        ],
        frames: [
          { goal: E2, note: ["After both obtains.", "在兩個 obtain 之後。"] },
          { goal: E3, note: ["The witness is x + y; what is left is its equation.", "見證是 x + y；剩下的是它要滿足的等式。"] },
        ],
      },
      omega: {
        fails: [
          "Used first: omega could not prove the goal. It can't pick a value for k, and the numbers hidden inside ha and hb are out of its reach.",
          "一開始就用：omega 無法證明這個目標。它沒辦法替 k 選值，而藏在 ha 和 hb 裡面的數它也拿不到。",
        ],
        frames: [
          { goal: E3, note: ["After the obtains and refine.", "在 obtain 和 refine 之後。"] },
          done(
            "With hx and hy: a + b = 2x + 2y = 2(x + y). Linear arithmetic, omega's ground. Done.",
            "有了 hx 和 hy：a + b = 2x + 2y = 2(x + y)。線性算術，omega 的拿手項目。完成。",
          ),
        ],
      },
    },
    coach: {
      statement: [
        "`ha : ∃ k, a = 2 * k` says \"a is even\": there exists a k with a = 2k. Same for b. The claim: a + b is even too.",
        "`ha : ∃ k, a = 2 * k` 表示「a 是偶數」：存在一個 k 使 a = 2k。b 也一樣。主張：a + b 也是偶數。",
      ],
      goal: [
        "Above: a, b and the two evenness facts. Below: `⊢ ∃ k, a + b = 2 * k`, an \"exists\": to prove it you must name k.",
        "上方：a、b 和兩個偶數事實。下方：`⊢ ∃ k, a + b = 2 * k`，一個「存在」：要證明它，你得說出 k 是什麼。",
      ],
      tactic: ["Try `omega` first. It fails: an ∃ needs a witness, and omega doesn't choose one.", "先試 `omega`。它會失敗：∃ 需要見證，而 omega 不會替你挑。"],
      result: [
        "omega reports a possible counterexample. Then the chips in order (obtain, obtain, refine, omega) grow What you know and leave no goals.",
        "omega 回報一個可能的反例。接著依序使用按鈕（obtain、obtain、refine、omega），已知越來越多，最後不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (even_add):", "定理（even_add）："], lean: "theorem even_add" },
      { human: ["let $a$ and $b$ be natural numbers.", "設 $a$、$b$ 為自然數。"], lean: "(a b : Nat)" },
      { human: ["If $a$ is even", "若 $a$ 是偶數"], lean: "(ha : ∃ k, a = 2 * k)" },
      { human: ["and $b$ is even,", "且 $b$ 是偶數，"], lean: "(hb : ∃ k, b = 2 * k)" },
      { human: ["then $a + b$ is even.", "則 $a + b$ 是偶數。"], lean: ": ∃ k, a + b = 2 * k" },
    ],
    paper: [
      { text: ["Suppose $a$ and $b$ are even; we show $a + b$ is even.", "假設 $a$ 和 $b$ 都是偶數；我們要證明 $a + b$ 是偶數。"], lines: [1, 1], lean: ["theorem even_add (a b : Nat) (ha : ∃ k, a = 2 * k) (hb : ∃ k, b = 2 * k) : ∃ k, a + b = 2 * k := by"] },
      { text: ["Since $a$ is even, write $a = 2x$.", "因為 $a$ 是偶數，寫成 $a = 2x$。"], lines: [2, 2], lean: ["obtain ⟨x, hx⟩ := ha"], goal: E0 },
      { text: ["Since $b$ is even, write $b = 2y$.", "因為 $b$ 是偶數，寫成 $b = 2y$。"], lines: [3, 3], lean: ["obtain ⟨y, hy⟩ := hb"], goal: E1 },
      { text: ["Take $k = x + y$; we must show $a + b = 2(x + y)$.", "取 $k = x + y$；我們要證明 $a + b = 2(x + y)$。"], lines: [4, 4], lean: ["refine ⟨x + y, ?_⟩"], goal: E2 },
      { text: ["Indeed, $a + b = 2x + 2y = 2(x + y)$.", "確實，$a + b = 2x + 2y = 2(x + y)$。"], lines: [5, 5], lean: ["omega"], goal: E3 },
    ],
  },

  "cases-or": {
    first: ["exact Or.inr hp"],
    unlock: "after-fail",
    unlockNote: [
      "There is no `hp` yet: you only have `h : p ∨ q`, and you don't know which side holds. New tool: `cases h` splits into the two possibilities, each with its own fact (`hp : p`, or `hq : q`). Finish each case with its exact chip.",
      "現在還沒有 `hp`：你只有 `h : p ∨ q`，而且不知道是哪一邊成立。新工具：`cases h` 分成兩種可能，各帶自己的事實（`hp : p`，或 `hq : q`）。再用對應的 exact 按鈕完成每一種情形。",
    ],
    introduces: ["cases"],
    here: {
      "cases h with\n| inl hp => sorry\n| inr hq => sorry": {
        frames: [
          { goal: OR0 },
          {
            goal: ORL + "\n\n" + ORR,
            note: [
              "Two goals now, one per case: in `inl` you know hp : p, in `inr` you know hq : q. Both still need q ∨ p.",
              "現在有兩個目標，每種情形一個：在 `inl` 你知道 hp : p，在 `inr` 你知道 hq : q。兩個都還要證明 q ∨ p。",
            ],
          },
        ],
      },
      "exact Or.inr hp": {
        fails: [
          "Used before `cases` (or in the inr case): `Unknown identifier hp`. hp exists only in the inl case, after h has been split.",
          "在 `cases` 之前（或在 inr 情形）使用：`Unknown identifier hp`，找不到這個名字。hp 只在 h 拆開後的 inl 情形裡存在。",
        ],
        frames: [
          { goal: ORL, note: ["In the inl case.", "在 inl 情形中。"] },
          done("`Or.inr hp` proves q ∨ p by its right side, p, using hp. Done.", "`Or.inr hp` 用 hp 證明 q ∨ p 的右邊 p。完成。"),
        ],
      },
      "exact Or.inl hq": {
        fails: [
          "Used in the inl case (or before `cases`): `Unknown identifier hq`. hq exists only in the inr case.",
          "在 inl 情形（或 `cases` 之前）使用：`Unknown identifier hq`。hq 只在 inr 情形裡存在。",
        ],
        frames: [
          { goal: ORR, note: ["In the inr case.", "在 inr 情形中。"] },
          done("`Or.inl hq` proves q ∨ p by its left side, q. Done.", "`Or.inl hq` 證明 q ∨ p 的左邊 q。完成。"),
        ],
      },
    },
    coach: {
      statement: [
        "p and q are any statements (`Prop`). Given `h : p ∨ q` (p or q), prove `q ∨ p`: \"or\" with the sides swapped.",
        "p 和 q 是任意命題（`Prop`）。已知 `h : p ∨ q`（p 或 q），證明 `q ∨ p`：左右對調的「或」。",
      ],
      goal: ["Above: p, q and h. Below: `⊢ q ∨ p`. You don't know which side of h is true.", "上方：p、q 和 h。下方：`⊢ q ∨ p`。你不知道 h 的哪一邊為真。"],
      tactic: [
        "Try `exact Or.inr hp`. It fails: there is no hp until you split h into cases.",
        "試試 `exact Or.inr hp`。它會失敗：在把 h 分成情形之前，根本沒有 hp。",
      ],
      result: [
        "Unknown identifier first. After `cases h` there are two goals; each exact chip closes one, then no goals are left.",
        "先出現 Unknown identifier。`cases h` 之後有兩個目標；每個 exact 按鈕結束其中一個，最後不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (swap_or):", "定理（swap_or）："], lean: "theorem swap_or" },
      { human: ["for any statements $p$ and $q$,", "對任意命題 $p$ 與 $q$，"], lean: "(p q : Prop)" },
      { human: ["if $p$ or $q$ holds,", "若 $p$ 或 $q$ 成立，"], lean: "(h : p ∨ q)" },
      { human: ["then $q$ or $p$ holds.", "則 $q$ 或 $p$ 成立。"], lean: ": q ∨ p" },
    ],
    paper: [
      { text: ["Suppose $p$ or $q$ holds; we show $q$ or $p$.", "假設 $p$ 或 $q$ 成立；我們要證明 $q$ 或 $p$。"], lines: [1, 1], lean: ["theorem swap_or (p q : Prop) (h : p ∨ q) : q ∨ p := by"] },
      { text: ["Consider the two cases.", "分兩種情形討論。"], lines: [2, 2], lean: ["cases h with"], goal: OR0 },
      { text: ["If $p$ holds, then \"$q$ or $p$\" holds by its second part.", "若 $p$ 成立，則「$q$ 或 $p$」由後半部成立。"], lines: [3, 3], lean: ["| inl hp => exact Or.inr hp"], goal: ORL },
      { text: ["If $q$ holds, then \"$q$ or $p$\" holds by its first part.", "若 $q$ 成立，則「$q$ 或 $p$」由前半部成立。"], lines: [4, 4], lean: ["| inr hq => exact Or.inl hq"], goal: ORR },
    ],
  },

  "induction-double": {
    first: ["omega"],
    unlock: "after-fail",
    unlockNote: [
      "omega doesn't know what `double` means: to it, `double n` is just another unknown. The definition works one step at a time, so prove the claim the same way. New tool: `induction` splits it into the start (zero) and the step (succ).",
      "omega 不知道 `double` 是什麼：對它來說，`double n` 只是另一個未知數。定義是一步一步來的，證明也照同樣方式。新工具：`induction` 把它拆成起點（zero）和推進（succ）。",
    ],
    introduces: ["induction"],
    here: {
      [INDUCTION]: {
        frames: [
          { goal: D0 },
          {
            goal: DZ + "\n\n" + DS,
            note: [
              "Two goals: the start, n = 0, and the step, where ih (the induction hypothesis) says the claim holds for n and you prove it for n + 1.",
              "兩個目標：起點 n = 0，以及推進，其中 ih（歸納假設）說主張對 n 成立，你要證明它對 n + 1 也成立。",
            ],
          },
        ],
      },
      rfl: {
        fails: [
          "In the succ case (or before induction) rfl fails: `double (n + 1)` is not definitionally equal to `2 * (n + 1)`, because n is unknown.",
          "在 succ 情形（或歸納之前）rfl 會失敗：`double (n + 1)` 與 `2 * (n + 1)` 並非定義上相等，因為 n 是未知數。",
        ],
        frames: [
          { goal: DZ, note: ["In the zero case.", "在 zero 情形中。"] },
          {
            goal: "case zero\n⊢ 0 = 0",
            teaching: true,
            note: [
              "Teaching frame (Lean doesn't display this): double 0 is 0 by the definition, and 2 * 0 computes to 0.",
              "教學畫面（Lean 不會顯示）：依定義 double 0 是 0，而 2 * 0 算出來也是 0。",
            ],
          },
          done("Both sides identical. Done.", "兩邊一模一樣。完成。"),
        ],
      },
      "simp only [double, ih]": {
        fails: [
          "In the zero case: `Unknown identifier ih`. The induction hypothesis exists only in the succ case.",
          "在 zero 情形中：`Unknown identifier ih`。歸納假設只在 succ 情形裡存在。",
        ],
        frames: [
          { goal: DS, note: ["In the succ case.", "在 succ 情形中。"] },
          {
            goal: DS2,
            note: [
              "`double (n + 1)` became `double n + 2` (one step of the definition), then `double n` became `2 * n` (by ih). A sorry stays for the rest.",
              "`double (n + 1)` 變成 `double n + 2`（定義的一步），接著 `double n` 變成 `2 * n`（用 ih）。後面留著 sorry 給剩下的部分。",
            ],
          },
        ],
      },
      omega: {
        fails: [
          "Used first: omega could not prove the goal. It treats `double n` as an unknown number, unrelated to n, and finds a possible counterexample.",
          "一開始就用：omega 無法證明這個目標。它把 `double n` 當成和 n 無關的未知數，於是找到一個可能的反例。",
        ],
        frames: [
          { goal: DS2, note: ["After `simp only [double, ih]`.", "在 `simp only [double, ih]` 之後。"] },
          done("2 * n + 2 = 2 * (n + 1) is plain linear arithmetic. Done.", "2 * n + 2 = 2 * (n + 1) 是單純的線性算術。完成。"),
        ],
      },
    },
    coach: {
      statement: [
        "`def double` defines a function step by step: `double 0 = 0`, `double (n + 1) = double n + 2`. The claim: `double n = 2 * n` for every n.",
        "`def double` 一步一步定義一個函數：`double 0 = 0`，`double (n + 1) = double n + 2`。主張：對每個 n，`double n = 2 * n`。",
      ],
      goal: [
        "`n : Nat` above, `⊢ double n = 2 * n` below. n is unknown, so double n can't be computed.",
        "上方是 `n : Nat`，下方是 `⊢ double n = 2 * n`。n 是未知數，所以 double n 算不出來。",
      ],
      tactic: [
        "Try `omega` first: it fails, because it can't see inside `double`. That is the cue for induction.",
        "先試 `omega`：它會失敗，因為它看不到 `double` 的內部。這正是該用歸納法的訊號。",
      ],
      result: [
        "omega reports a possible counterexample. After `induction`, rfl closes zero; in succ, `simp only [double, ih]` and then omega close it. No goals left.",
        "omega 回報一個可能的反例。`induction` 之後，rfl 結束 zero；在 succ 中，先 `simp only [double, ih]` 再 omega。不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Define $\\mathrm{double}$ on the natural numbers by $\\mathrm{double}(0) = 0$ and $\\mathrm{double}(n + 1) = \\mathrm{double}(n) + 2$.", "在自然數上定義 $\\mathrm{double}$：$\\mathrm{double}(0) = 0$，$\\mathrm{double}(n + 1) = \\mathrm{double}(n) + 2$。"], lean: "def double : Nat → Nat\n  | 0 => 0\n  | n + 1 => double n + 2" },
      { human: ["Theorem (double_eq):", "定理（double_eq）："], lean: "theorem double_eq" },
      { human: ["for every natural number $n$,", "對每個自然數 $n$，"], lean: "(n : Nat)" },
      { human: ["$\\mathrm{double}(n) = 2n$.", "$\\mathrm{double}(n) = 2n$。"], lean: ": double n = 2 * n" },
    ],
    paper: [
      {
        text: [
          "Recall the definition: $\\mathrm{double}(0) = 0$ and $\\mathrm{double}(n + 1) = \\mathrm{double}(n) + 2$.",
          "回顧定義：$\\mathrm{double}(0) = 0$，$\\mathrm{double}(n + 1) = \\mathrm{double}(n) + 2$。",
        ],
        lines: [1, 3], lean: ["def double : Nat → Nat","| 0 => 0","| n + 1 => double n + 2"],
      },
      {
        text: ["We show $\\mathrm{double}(n) = 2n$ for every natural number $n$, by induction on $n$.", "我們對 $n$ 做歸納，證明每個自然數 $n$ 都有 $\\mathrm{double}(n) = 2n$。"],
        lines: [5, 6], lean: ["theorem double_eq (n : Nat) : double n = 2 * n := by","induction n with"], goal: D0,
      },
      { text: ["Base case: $\\mathrm{double}(0) = 0 = 2 \\cdot 0$.", "起點：$\\mathrm{double}(0) = 0 = 2 \\cdot 0$。"], lines: [7, 7], lean: ["| zero => rfl"], goal: DZ },
      {
        text: [
          "Step: assume $\\mathrm{double}(n) = 2n$. Then $\\mathrm{double}(n + 1) = \\mathrm{double}(n) + 2 = 2n + 2$,",
          "推進：假設 $\\mathrm{double}(n) = 2n$。則 $\\mathrm{double}(n + 1) = \\mathrm{double}(n) + 2 = 2n + 2$，",
        ],
        lines: [8, 9], lean: ["| succ n ih =>","simp only [double, ih]"], goal: DS,
      },
      { text: ["and $2n + 2 = 2(n + 1)$.", "而 $2n + 2 = 2(n + 1)$。"], lines: [10, 10], lean: ["omega"], goal: DS2 },
    ],
  },

  "calc-chain": {
    first: ["exact h₁"],
    unlock: "after-fail",
    unlockNote: [
      "h₁ proves `a < b`, only the first link of the chain. New tool: `calc` writes the whole chain, a < b ≤ c < c + 1, one justified link per line. Fill its three sorrys with the exact chips. (`omega` also does it in one go.)",
      "h₁ 證明的是 `a < b`，只是鏈的第一環。新工具：`calc` 把整條鏈寫出來：a < b ≤ c < c + 1，每行一環並附上理由。用 exact 按鈕填滿它的三個 sorry。（`omega` 也能一次完成。）",
    ],
    introduces: ["calc"],
    here: {
      "calc a < b := by sorry\n  _ ≤ c := by sorry\n  _ < c + 1 := by sorry": {
        frames: [
          { goal: LT + "⊢ a < c + 1" },
          {
            goal: [LT + "⊢ a < b", LT + "⊢ b ≤ c", LT + "⊢ c < c + 1"].join("\n\n"),
            teaching: true,
            note: [
              "Teaching frame: each `by sorry` hides one small goal (click a sorry to see it). Lean already joins a < b, b ≤ c and c < c + 1 into a < c + 1.",
              "教學畫面：每個 `by sorry` 都藏著一個小目標（點 sorry 就能看到）。Lean 已經把 a < b、b ≤ c、c < c + 1 接成 a < c + 1。",
            ],
          },
        ],
      },
      "exact h₁": {
        fails: [
          "Used first: type mismatch. h₁ has type `a < b` but the goal is `a < c + 1`.",
          "一開始就用：型別不符。h₁ 的型別是 `a < b`，但目標是 `a < c + 1`。",
        ],
        frames: [{ goal: LT + "⊢ a < b", note: ["In the first calc line.", "在 calc 的第一行。"] }, done("h₁ fits exactly. Done.", "h₁ 完全吻合。完成。")],
      },
      "exact h₂": {
        frames: [{ goal: LT + "⊢ b ≤ c", note: ["In the second calc line.", "在 calc 的第二行。"] }, done("h₂ fits exactly. Done.", "h₂ 完全吻合。完成。")],
      },
      "exact Nat.lt_succ_self c": {
        frames: [
          { goal: LT + "⊢ c < c + 1", note: ["In the third calc line.", "在 calc 的第三行。"] },
          done(
            "`Nat.lt_succ_self c` proves `c < c.succ`, the library's way of writing c < c + 1. Done.",
            "`Nat.lt_succ_self c` 證明 `c < c.succ`，也就是函式庫對 c < c + 1 的寫法。完成。",
          ),
        ],
      },
      omega: {
        frames: [{ goal: LT + "⊢ a < c + 1" }, done("omega chains h₁ and h₂ by itself. Done.", "omega 自己把 h₁ 和 h₂ 串起來。完成。")],
      },
    },
    coach: {
      statement: ["Given `a < b` and `b ≤ c`, prove `a < c + 1`.", "已知 `a < b` 與 `b ≤ c`，證明 `a < c + 1`。"],
      goal: ["Above: a, b, c and the facts h₁, h₂. Below: `⊢ a < c + 1`.", "上方：a、b、c 和事實 h₁、h₂。下方：`⊢ a < c + 1`。"],
      tactic: ["Try `exact h₁`: it starts the chain, but it doesn't reach c + 1.", "試試 `exact h₁`：它是鏈的開頭，但到不了 c + 1。"],
      result: [
        "Type mismatch first. Then the calc skeleton plus three exact chips (one per sorry) leave no goals.",
        "先出現型別不符。接著用 calc 骨架，再用三個 exact 按鈕（每個 sorry 一個），不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Theorem (lt_chain):", "定理（lt_chain）："], lean: "theorem lt_chain" },
      { human: ["let $a$, $b$, $c$ be natural numbers", "設 $a$、$b$、$c$ 為自然數，"], lean: "(a b c : Nat)" },
      { human: ["with $a < b$", "滿足 $a < b$"], lean: "(h₁ : a < b)" },
      { human: ["and $b \\le c$.", "且 $b \\le c$。"], lean: "(h₂ : b ≤ c)" },
      { human: ["Then $a < c + 1$.", "則 $a < c + 1$。"], lean: ": a < c + 1" },
    ],
    paper: [
      { text: ["Suppose $a < b$ and $b \\le c$; we show $a < c + 1$.", "假設 $a < b$ 且 $b \\le c$；我們要證明 $a < c + 1$。"], lines: [1, 1], lean: ["theorem lt_chain (a b c : Nat) (h₁ : a < b) (h₂ : b ≤ c) : a < c + 1 := by"] },
      { text: ["We have $a < b$ by assumption,", "由假設，$a < b$，"], lines: [2, 2], lean: ["calc a < b := h₁"], goal: LT + "⊢ a < b" },
      { text: ["$b \\le c$ by assumption,", "由假設，$b \\le c$，"], lines: [3, 3], lean: ["_ ≤ c := h₂"], goal: LT + "⊢ b ≤ c" },
      { text: ["and $c < c + 1$. Chaining these gives $a < c + 1$.", "而且 $c < c + 1$。把它們串起來就得到 $a < c + 1$。"], lines: [4, 4], lean: ["_ < c + 1 := Nat.lt_succ_self c"], goal: LT + "⊢ c < c + 1" },
    ],
  },

  gauss: {
    first: [INDUCTION, "rfl"],
    unlock: "after-fail",
    unlockNote: [
      "rfl closes the zero case, but in the succ case `2 * sumTo (n + 1)` can't be computed with n unknown. The step needs algebra: the `calc` skeleton breaks it into four small equations, and each rw chip proves one.",
      "rfl 能結束 zero 情形，但在 succ 情形中，n 是未知數，`2 * sumTo (n + 1)` 算不出來。這一步需要代數：`calc` 骨架把它拆成四個小等式，每個 rw 按鈕證明其中一個。",
    ],
    introduces: [],
    here: {
      [INDUCTION]: {
        frames: [
          { goal: G0 },
          {
            goal: GZ + "\n\n" + GS,
            note: [
              "Two goals: the start, n = 0, and the step, with ih saying the claim holds for n.",
              "兩個目標：起點 n = 0，以及推進，其中 ih 說主張對 n 成立。",
            ],
          },
        ],
      },
      rfl: {
        fails: [
          "In the succ case rfl fails: `2 * sumTo (n + 1)` is not definitionally equal to `(n + 1) * (n + 1 + 1)`. n is unknown, so neither side can be computed.",
          "在 succ 情形中 rfl 會失敗：`2 * sumTo (n + 1)` 與 `(n + 1) * (n + 1 + 1)` 並非定義上相等。n 是未知數，兩邊都算不出來。",
        ],
        frames: [
          { goal: GZ, note: ["In the zero case.", "在 zero 情形中。"] },
          {
            goal: "case zero\n⊢ 0 = 0",
            teaching: true,
            note: [
              "Teaching frame (Lean doesn't display this): sumTo 0 is 0, so 2 * sumTo 0 is 0; and 0 * (0 + 1) is 0.",
              "教學畫面（Lean 不會顯示）：sumTo 0 是 0，所以 2 * sumTo 0 是 0；而 0 * (0 + 1) 也是 0。",
            ],
          },
          done("Both sides identical. Done.", "兩邊一模一樣。完成。"),
        ],
      },
      "calc 2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1) := by sorry\n  _ = n * (n + 1) + 2 * (n + 1) := by sorry\n  _ = (n + 2) * (n + 1) := by sorry\n  _ = (n + 1) * (n + 1 + 1) := by sorry": {
        frames: [
          { goal: GS, note: ["In the succ case.", "在 succ 情形中。"] },
          {
            goal: [G1, G2, G3, G4].join("\n\n"),
            teaching: true,
            note: [
              "Teaching frame: each `by sorry` hides one equation (click a sorry to see it). The chain runs from 2 * sumTo (n + 1) to (n + 1) * (n + 1 + 1).",
              "教學畫面：每個 `by sorry` 都藏著一個等式（點 sorry 就能看到）。這條鏈從 2 * sumTo (n + 1) 走到 (n + 1) * (n + 1 + 1)。",
            ],
          },
        ],
      },
      "rw [sumTo, Nat.mul_add]": {
        frames: [
          { goal: G1, note: ["In the first calc line.", "在 calc 的第一行。"] },
          {
            goal: GI + "⊢ 2 * (sumTo n + (n + 1)) = 2 * sumTo n + 2 * (n + 1)",
            teaching: true,
            note: [
              "`sumTo (n + 1)` unfolded by its definition into `sumTo n + (n + 1)`. (Lean doesn't display this step: rw goes straight on.)",
              "`sumTo (n + 1)` 依定義展開成 `sumTo n + (n + 1)`。（Lean 不會顯示這一步：rw 會直接繼續。）",
            ],
          },
          {
            goal: GI + "⊢ 2 * sumTo n + 2 * (n + 1) = 2 * sumTo n + 2 * (n + 1)",
            teaching: true,
            note: ["`Nat.mul_add` spread the 2 over the sum. (Not displayed either.)", "`Nat.mul_add` 把 2 分配到和上。（這一步也不會顯示。）"],
          },
          DONE,
        ],
      },
      "rw [ih]": {
        fails: [
          "On the whole succ goal: the rewrite failed, it did not find `2 * sumTo n` in `2 * sumTo (n + 1) = …`. ih fits only once sumTo has been unfolded: use it on the second calc line.",
          "直接用在整個 succ 目標上：改寫失敗，在 `2 * sumTo (n + 1) = …` 裡找不到 `2 * sumTo n`。要等 sumTo 展開後 ih 才用得上：把它用在 calc 的第二行。",
        ],
        frames: [
          { goal: G2, note: ["In the second calc line.", "在 calc 的第二行。"] },
          {
            goal: GI + "⊢ n * (n + 1) + 2 * (n + 1) = n * (n + 1) + 2 * (n + 1)",
            teaching: true,
            note: ["`2 * sumTo n` became `n * (n + 1)` by ih. (Lean doesn't display this step: rw closes it at once.)", "`2 * sumTo n` 用 ih 換成了 `n * (n + 1)`。（Lean 不會顯示這一步：rw 立刻就收尾了。）"],
          },
          DONE,
        ],
      },
      "rw [Nat.add_mul n 2 (n + 1)]": {
        frames: [
          { goal: G3, note: ["In the third calc line.", "在 calc 的第三行。"] },
          {
            goal: GI + "⊢ n * (n + 1) + 2 * (n + 1) = n * (n + 1) + 2 * (n + 1)",
            teaching: true,
            note: [
              "`(n + 2) * (n + 1)` on the right was spread into `n * (n + 1) + 2 * (n + 1)`. (Lean doesn't display this step: rw closes it at once.)",
              "右邊的 `(n + 2) * (n + 1)` 被分配成 `n * (n + 1) + 2 * (n + 1)`。（Lean 不會顯示這一步：rw 立刻就收尾了。）",
            ],
          },
          DONE,
        ],
      },
      "rw [Nat.mul_comm]": {
        frames: [
          { goal: G4, note: ["In the fourth calc line.", "在 calc 的第四行。"] },
          {
            goal: GI + "⊢ (n + 1) * (n + 2) = (n + 1) * (n + 1 + 1)",
            teaching: true,
            note: ["The factors on the left swapped. (Lean doesn't display this step.)", "左邊的兩個因數交換了。（Lean 不會顯示這一步。）"],
          },
          done(
            "`n + 2` and `n + 1 + 1` are the same number, so rw's closing `rfl` succeeds. Done.",
            "`n + 2` 和 `n + 1 + 1` 是同一個數，所以 rw 最後的 `rfl` 成功。完成。",
          ),
        ],
      },
    },
    coach: {
      statement: [
        "`sumTo n` is 1 + 2 + … + n, defined step by step: `sumTo 0 = 0`, `sumTo (n + 1) = sumTo n + (n + 1)`. The claim: `2 * sumTo n = n * (n + 1)`.",
        "`sumTo n` 是 1 + 2 + … + n，一步一步定義：`sumTo 0 = 0`，`sumTo (n + 1) = sumTo n + (n + 1)`。主張：`2 * sumTo n = n * (n + 1)`。",
      ],
      goal: [
        "`n : Nat` above, `⊢ 2 * sumTo n = n * (n + 1)` below. Like double, sumTo is defined by steps: a cue for induction.",
        "上方是 `n : Nat`，下方是 `⊢ 2 * sumTo n = n * (n + 1)`。和 double 一樣，sumTo 是一步一步定義的：該用歸納法的訊號。",
      ],
      tactic: [
        "Start with `induction`, then try `rfl` in both cases. It works in zero and fails in succ: the step needs real algebra.",
        "先用 `induction`，再在兩種情形都試試 `rfl`。它在 zero 成功、在 succ 失敗：推進這一步需要真正的代數。",
      ],
      result: [
        "rfl fails in succ (\"not definitionally equal\"). Then the calc skeleton and the four rw chips, one per line, leave no goals.",
        "rfl 在 succ 失敗（「not definitionally equal」）。接著用 calc 骨架，再用四個 rw 按鈕，每行一個，不再剩下目標。",
      ],
    },
    statementMirror: [
      { human: ["Define $S(n) = 0 + 1 + \\dots + n$ by $S(0) = 0$ and $S(n + 1) = S(n) + (n + 1)$.", "定義 $S(n) = 0 + 1 + \\dots + n$：$S(0) = 0$，$S(n + 1) = S(n) + (n + 1)$。"], lean: "def sumTo : Nat → Nat\n  | 0 => 0\n  | n + 1 => sumTo n + (n + 1)" },
      { human: ["Theorem (gauss):", "定理（gauss）："], lean: "theorem gauss" },
      { human: ["for every natural number $n$,", "對每個自然數 $n$，"], lean: "(n : Nat)" },
      { human: ["$2S(n) = n(n + 1)$.", "$2S(n) = n(n + 1)$。"], lean: ": 2 * sumTo n = n * (n + 1)" },
    ],
    paper: [
      {
        text: [
          "Write $S(n) = 1 + 2 + \\dots + n$: $S(0) = 0$ and $S(n + 1) = S(n) + (n + 1)$.",
          "記 $S(n) = 1 + 2 + \\dots + n$：$S(0) = 0$，$S(n + 1) = S(n) + (n + 1)$。",
        ],
        lines: [1, 3], lean: ["def sumTo : Nat → Nat","| 0 => 0","| n + 1 => sumTo n + (n + 1)"],
      },
      { text: ["We show $2S(n) = n(n + 1)$ by induction on $n$.", "我們對 $n$ 做歸納，證明 $2S(n) = n(n + 1)$。"], lines: [5, 6], lean: ["theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by","induction n with"], goal: G0 },
      { text: ["Base case: $2S(0) = 0 = 0 \\cdot 1$.", "起點：$2S(0) = 0 = 0 \\cdot 1$。"], lines: [7, 7], lean: ["| zero => rfl"], goal: GZ },
      {
        text: ["Step: assume $2S(n) = n(n + 1)$. Then $2S(n + 1) = 2S(n) + 2(n + 1)$", "推進：假設 $2S(n) = n(n + 1)$。則 $2S(n + 1) = 2S(n) + 2(n + 1)$"],
        lines: [8, 9], lean: ["| succ n ih =>","calc 2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1) := by rw [sumTo, Nat.mul_add]"], goal: GS,
      },
      {
        text: [
          "$= n(n + 1) + 2(n + 1)$ by the assumption, $= (n + 2)(n + 1)$, which is $(n + 1)(n + 2)$.",
          "$= n(n + 1) + 2(n + 1)$（由假設）$= (n + 2)(n + 1)$，也就是 $(n + 1)(n + 2)$。",
        ],
        lines: [10, 12], lean: ["_ = n * (n + 1) + 2 * (n + 1) := by rw [ih]","_ = (n + 2) * (n + 1) := by rw [Nat.add_mul n 2 (n + 1)]","_ = (n + 1) * (n + 1 + 1) := by rw [Nat.mul_comm]"], goal: G2,
      },
    ],
  },
};
