/**
 * The tutorial track's problems (Lite runner: core Lean, no Mathlib). Each has a fixed statement (the test) and a
 * starting file with `sorry` where the proof goes. Text is [English, Traditional Chinese].
 */
import type { Localized } from "@learnkit/web";

export interface Problem {
  id: string;
  level: "L1" | "L2" | "L3";
  runner: "lite" | "full";
  title: Localized;
  /** what the statement says, in plain words (RichText) */
  summary: Localized;
  /** the statements that must stay exactly as given */
  statements: string[];
  /** theorems whose axioms are reported */
  theorems: string[];
  /** the file the user starts from */
  start: string;
  /** tactics offered as one-click chips */
  tactics: string[];
  /** a hint shown under the result (RichText) */
  hint: Localized;
}

export const PROBLEMS: Problem[] = [
  {
    id: "hello",
    level: "L1",
    runner: "lite",
    title: ["Hello, Lean: 2 + 2 = 4", "你好，Lean：2 + 2 = 4"],
    summary: [
      "Your first proof. The statement `theorem hello : 2 + 2 = 4` is the test: it stays as it is. Your job is to replace `sorry` (\"I owe you a proof\") with something Lean accepts. Press **Run** first to see the goal Lean wants you to prove.",
      "你的第一個證明。陳述 `theorem hello : 2 + 2 = 4` 就是測試，要保持原樣。你的任務是把 `sorry`（「先欠著一個證明」）換成 Lean 接受的內容。先按 **執行**，看看 Lean 要你證明的目標。",
    ],
    statements: ["theorem hello : 2 + 2 = 4"],
    theorems: ["hello"],
    start: "theorem hello : 2 + 2 = 4 := by\n  sorry\n",
    tactics: ["rfl", "decide", "norm_num"],
    hint: [
      "`rfl` says \"both sides compute to the same thing\": Lean works out `2 + 2` and gets `4`. `decide` asks Lean to check the claim by computation. (`norm_num` lives in Mathlib, so the Lite runner says it needs the Full runner.)",
      "`rfl` 的意思是「兩邊算出來一樣」：Lean 會算出 `2 + 2` 等於 `4`。`decide` 則請 Lean 用計算檢查這個命題。（`norm_num` 屬於 Mathlib，所以 Lite 執行器會說需要 Full 執行器。）",
    ],
  },
  {
    id: "add-comm",
    level: "L1",
    runner: "lite",
    title: ["Order doesn't matter: a + b = b + a", "順序不重要：a + b = b + a"],
    summary: [
      "Now the statement is about **every** pair of natural numbers `a` and `b`, so Lean can't just compute it. Run it: the goal shows the two numbers as hypotheses (`a b : Nat`) above the line and what to prove below it.",
      "這次的陳述是關於 **任意** 一對自然數 `a` 與 `b`，Lean 沒辦法直接算出來。執行看看：目標會把兩個數列為前提（`a b : Nat`），放在橫線上方，要證明的內容在下方。",
    ],
    statements: ["theorem add_swap (a b : Nat) : a + b = b + a"],
    theorems: ["add_swap"],
    start: "theorem add_swap (a b : Nat) : a + b = b + a := by\n  sorry\n",
    tactics: ["omega", "exact Nat.add_comm a b", "simp", "rfl"],
    hint: [
      "This fact is already in Lean's library as `Nat.add_comm`: `exact Nat.add_comm a b` uses it. `omega` proves it on its own, because it decides linear arithmetic over the natural numbers. `rfl` fails here: try it to read the error.",
      "這個事實已在 Lean 的函式庫裡，名叫 `Nat.add_comm`：`exact Nat.add_comm a b` 直接引用它。`omega` 也能自己證出來，因為它能判定自然數上的線性算術。`rfl` 在這裡會失敗：試試看，讀讀錯誤訊息。",
    ],
  },
];
