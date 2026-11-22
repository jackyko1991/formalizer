/**
 * Plain-language meanings of the tactics the problems offer as chips, for readers who have never seen Lean:
 * a one-line "what it does", a longer explanation with an everyday picture, and whether it needs Mathlib (the Full
 * runner). A chip is looked up by its first word (`rw [h₁]` → rw). tests/tactics.test.ts checks every chip has one.
 */
type L = readonly [string, string];

export interface TacticInfo {
  /** the name explained ("rfl = Reflexivity: …"), the first thing the Tutorial shows about a tactic */
  origin?: L;
  /** what it does, in a few words (shown under the chip) */
  short: L;
  /** a longer explanation with an everyday picture (shown when the chip's ⓘ is opened) */
  long: L;
  /** only in Mathlib: on the Lite runner (no Mathlib) Lean answers `unknown tactic` */
  mathlib?: boolean;
  /** the Coding Skills page and section that explain it, e.g. ["tactics", "rfl"] */
  link?: readonly [string, string];
}

export const TACTICS: Record<string, TacticInfo> = {
  sorry: {
    origin: ["sorry = an apology: \"sorry, I owe you this proof\". Lean accepts it for now but remembers the debt.", "sorry 就是「抱歉」：「抱歉，這個證明先欠著」。Lean 暫時接受，但會記下這筆債。"],
    short: ["\"I owe you a proof\"", "「先欠著一個證明」"],
    long: [
      "A placeholder: Lean accepts the file but marks the theorem as unfinished. Every problem starts with one; your job is to replace it.",
      "佔位用的：Lean 會接受這個檔案，但把定理標成未完成。每一題都從它開始；你的任務就是把它換掉。",
    ],
  },
  rfl: {
    origin: ["rfl = Reflexivity: a thing equals itself, like a face and its mirror image. When both sides come out identical, `rfl` is the whole proof.", "rfl = Reflexivity（自反性）：任何東西都等於自己，就像照鏡子。兩邊算出來一模一樣時，`rfl` 就是整個證明。"],
    short: ["both sides are the same: compute and compare", "兩邊一樣：算出來再比"],
    long: [
      "Short for \"reflexivity\": a thing equals itself. Lean works out both sides of `=` and checks they come out identical, like checking a sum on a calculator. It only works when both sides really compute to the same value.",
      "「自反性」（reflexivity）的縮寫：任何東西都等於自己。Lean 把 `=` 兩邊都算出來，看是否完全相同，就像用計算機驗算。只有兩邊真的算得出同一個值時才有效。",
    ],
    link: ["tactics", "rfl"],
  },
  decide: {
    origin: ["decide = run a decision procedure: a mechanical yes/no check that always finishes. Lean evaluates the claim and gets true or false.", "decide = 執行一個判定程序（decision procedure）：一定會結束的機械式是非檢查。Lean 直接把命題算成「真」或「假」。"],
    short: ["let Lean check it by brute computation", "讓 Lean 直接算出真假"],
    long: [
      "For a yes/no claim about concrete, finite things (small numbers, `true`/`false`), Lean evaluates it and answers. Like checking every case in a short list. It fails on statements about *every* number, because there are infinitely many.",
      "對於關於具體、有限事物（小數字、`true`/`false`）的是非題，Lean 直接計算並給出答案，就像把一張短清單逐項檢查。對於「所有數」的陳述它會失敗，因為數有無窮多個。",
    ],
    link: ["tactics", "decide"],
  },
  norm_num: {
    origin: ["norm_num = normalise numerals: bring every number expression to its simplest form (`2 + 2` becomes `4`), then compare. A Mathlib tactic.", "norm_num = normalise numerals（數字正規化）：把每個數字式子化成最簡形式（`2 + 2` 變成 `4`），再比較。屬於 Mathlib 的戰術。"],
    short: ["arithmetic with numbers (Mathlib)", "數字運算（Mathlib）"],
    long: [
      "Mathlib's calculator for statements with numerals: `2 + 2 = 4`, `7 < 10`, `3 ∣ 12`. It lives in Mathlib, so on the Lite runner (which has no Mathlib) Lean answers `unknown tactic`: that is expected, not your mistake. On a Full runner it works.",
      "Mathlib 裡處理數字陳述的計算器：`2 + 2 = 4`、`7 < 10`、`3 ∣ 12`。它屬於 Mathlib，所以在沒有 Mathlib 的 Lite 執行器上，Lean 會回答 `unknown tactic`（不認得的戰術）：這是正常的，不是你寫錯。在 Full 執行器上就能用。",
    ],
    mathlib: true,
    link: ["tactics", "mathlib"],
  },
  omega: {
    origin: ["omega = the Omega test, William Pugh's 1991 algorithm for whole-number arithmetic with +, −, < and ≤. Lean's `omega` follows his paper.", "omega = Omega 測試（Omega test），William Pugh 在 1991 年提出的整數算術演算法，處理 +、−、< 與 ≤。Lean 的 `omega` 照著他的論文實作。"],
    short: ["solves +, −, <, ≤ puzzles on whole numbers", "自動解整數的加減與大小比較"],
    long: [
      "An automatic solver for linear arithmetic on natural numbers and integers: anything built from `+`, `-`, constants times variables, `<`, `≤`, `=`. It works for *every* value of the variables, not just examples. It gives up on `a * b` (two variables multiplied).",
      "自然數與整數上「線性算術」的自動解題器：由 `+`、`-`、常數乘變數、`<`、`≤`、`=` 組成的命題都行，而且對變數的 *所有* 值都成立，不只是舉例。遇到 `a * b`（兩個變數相乘）就會放棄。",
    ],
    link: ["tactics", "omega"],
  },
  simp: {
    origin: ["simp = simplifier: it simplifies the goal with a list of rewriting rules, as you would tidy an expression on paper.", "simp = simplifier（化簡器）：用一串改寫規則把目標化簡，就像在紙上把式子整理乾淨。"],
    short: ["simplify using known rules", "用已知規則化簡"],
    long: [
      "Rewrites the goal again and again with a large list of simple facts (`x + 0 = x`, `reverse (reverse l) = l`, …) until nothing changes. If the goal becomes trivially true, it is closed. Like tidying an expression on paper.",
      "反覆用一大串簡單事實（`x + 0 = x`、`reverse (reverse l) = l`……）改寫目標，直到不再變化。如果目標變得顯然成立，就直接完成。就像在紙上把式子整理乾淨。",
    ],
    link: ["tactics", "simp"],
  },
  "simp?": {
    origin: ["simp? = simp with a question: \"simp, and tell me what you used\". A `?` at the end of a tactic's name means it suggests a line for you to paste.", "simp? = 帶著問號的 simp：「化簡，然後告訴我你用了什麼」。戰術名字結尾的 `?` 表示它會建議一行讓你貼上。"],
    short: ["simp, and say which rules it used", "simp，並告訴你用了哪些規則"],
    long: [
      "Runs `simp`, then suggests `simp only [...]` with exactly the rules it used, so your proof does not depend on the whole rule list. Click the suggestion to paste it.",
      "執行 `simp`，然後建議一行 `simp only [...]`，列出它實際用到的規則，讓你的證明不依賴整份規則表。點建議就能貼上。",
    ],
  },
  exact: {
    origin: ["exact = \"this is exactly the proof\": what you give must match the goal exactly, not roughly.", "exact = 「這正是證明」：你給的東西必須和目標完全吻合，差一點都不行。"],
    short: ["\"this is exactly the proof\"", "「這正是證明」"],
    long: [
      "Hands Lean a finished proof of the goal: a hypothesis (`exact h₂`) or a library fact applied to the right things (`exact Nat.add_comm a b`). Like answering a question by pointing at the line in the book that says it.",
      "直接交給 Lean 一個完成的證明：某個前提（`exact h₂`），或套用到正確對象上的函式庫事實（`exact Nat.add_comm a b`）。就像回答問題時，直接指出書上寫著答案的那一行。",
    ],
    link: ["tactics", "exact"],
  },
  "exact?": {
    origin: ["exact? = \"find the exact one\": `exact` with a question mark searches the library for what to write after `exact`.", "exact? = 「找出正確的那一個」：加了問號的 `exact` 會在函式庫裡搜尋 `exact` 後面該寫什麼。"],
    short: ["search the library for a fitting fact", "在函式庫裡找合適的事實"],
    long: [
      "Asks Lean to search its library for a fact that proves the goal as it stands, and suggests `exact …` if it finds one. Slow but helpful when you don't know a fact's name.",
      "請 Lean 在函式庫中搜尋能直接證明目前目標的事實，找到就建議一行 `exact …`。比較慢，但在你不知道事實名字時很好用。",
    ],
  },
  rw: {
    origin: ["rw = rewrite: replace equals by equals, as when you substitute in algebra.", "rw = rewrite（改寫）：用相等的東西代換，就像代數裡的代入。"],
    short: ["replace one side of a known equation by the other", "用已知等式把一邊換成另一邊"],
    long: [
      "Rewrite: given `h : x = y`, `rw [h]` replaces `x` by `y` everywhere in the goal. Like substituting in algebra. `rw [h₁, h₂]` does several in a row. Afterwards it tries `rfl` by itself.",
      "改寫：有了 `h : x = y`，`rw [h]` 會把目標裡所有的 `x` 換成 `y`，就像代數裡的代換。`rw [h₁, h₂]` 依序做好幾次。換完後它會自己試一次 `rfl`。",
    ],
  },
  unfold: {
    origin: ["unfold = open up a definition, like unfolding a folded map to see what is inside.", "unfold = 展開：把定義攤開，就像把摺起來的地圖打開，看看裡面有什麼。"],
    short: ["replace a name by its definition", "把名字換成它的定義"],
    long: [
      "If the goal mentions a function you defined (say `normSq`), `unfold normSq` swaps the name for what it means, so other tactics can see inside.",
      "目標裡如果出現你定義的函數（例如 `normSq`），`unfold normSq` 會把名字換成它的內容，讓其他戰術看得到裡面。",
    ],
  },
  have: {
    origin: ["have = \"we have…\": the mathematician's phrase for stating a fact on the way.", "have = 「我們有……」：數學家在途中寫下一個事實時的說法。"],
    short: ["prove a helper fact first", "先證一個輔助事實"],
    long: [
      "`have h : P := …` proves a small fact `P` on the way and names it `h`, so later steps can use it. Like writing a lemma in the margin before the main argument.",
      "`have h : P := …` 在途中先證明一個小事實 `P`，並取名為 `h`，之後的步驟就能使用它。就像在主要論證前，先在旁邊寫一個小引理。",
    ],
    link: ["structure", "have"],
  },
  intro: {
    origin: ["intro = introduce: \"let n be a natural number\" introduces n into the argument.", "intro = introduce（引入）：「設 n 為自然數」就是把 n 引入論證。"],
    short: ["\"let n be any number…\": take what is assumed", "「設 n 為任意數……」：接下假設"],
    long: [
      "For a goal `∀ n, …` or `P → Q`, `intro` names the arbitrary object (or the assumption `P`) and moves it above the line, leaving what is left to prove. Exactly \"Let n be a natural number\" in a paper proof.",
      "目標是 `∀ n, …` 或 `P → Q` 時，`intro` 替任意的對象（或假設 `P`）取名，移到橫線上方，剩下要證的留在下方。正是紙上證明的「設 n 為自然數」。",
    ],
    link: ["tactics", "intro"],
  },
  grind: {
    origin: ["grind = grind through it: patient, mechanical work. Lean's `grind` is inspired by SMT solvers: it keeps writing the facts it finds on a virtual whiteboard until the goal follows.", "grind = 「磨」過去：耐心又機械式的苦工。Lean 的 `grind` 借鏡 SMT 求解器：把找到的事實不斷寫上一塊虛擬白板，直到目標成立。"],
    short: ["a strong automatic finisher", "強力的自動收尾"],
    long: [
      "Lean's newer all-round automation: it combines rewriting, case splits and arithmetic, including multiplying things out. Try it when a goal is \"obviously\" true by algebra.",
      "Lean 較新的全能自動化：結合改寫、分情況與算術，連乘開括號都會。當目標在代數上「顯然」成立時試試它。",
    ],
  },
  revert: {
    origin: ["revert = go back: undo an `intro`, putting the hypothesis back in front of the goal.", "revert = 退回：撤銷一次 `intro`，把前提放回目標前面。"],
    short: ["put a hypothesis back into the goal", "把前提放回目標裡"],
    long: [
      "The opposite of `intro`: moves `h` from above the line back into the goal as `h → …`. Useful before induction, so the hypothesis changes along with `n`.",
      "`intro` 的反向：把橫線上方的 `h` 放回目標，變成 `h → …`。在做歸納前很有用，讓前提跟著 `n` 一起變。",
    ],
  },
  obtain: {
    origin: ["obtain = get hold of: from \"there is an x with…\" you obtain the x itself and its property.", "obtain = 取得：從「存在某個 x 使得……」取得那個 x 本身，以及它的性質。"],
    short: ["unpack \"there is an x such that…\"", "拆開「存在某個 x 使得……」"],
    long: [
      "From a hypothesis like `ha : ∃ x, a = 2 * x`, `obtain ⟨x, hx⟩ := ha` gives you the witness `x` and its property `hx`. Like \"since a is even, write a = 2x\".",
      "從像 `ha : ∃ x, a = 2 * x` 這樣的前提，`obtain ⟨x, hx⟩ := ha` 取出見證 `x` 和它的性質 `hx`。就像「因為 a 是偶數，寫成 a = 2x」。",
    ],
    link: ["structure", "obtain"],
  },
  induction: {
    origin: ["induction = mathematical induction: from the first case and one step, to every natural number.", "induction = 數學歸納法：從第一個情形和一步推進，推到每一個自然數。"],
    short: ["prove for 0, then from n to n + 1", "先證 0，再從 n 推到 n + 1"],
    long: [
      "Splits a goal about every natural number into two: the base case `zero` and the step `succ`, where you may assume the claim for `n` (called `ih`) and prove it for `n + 1`. Dominoes: the first falls, and each knocks over the next.",
      "把關於所有自然數的目標拆成兩個：起點 `zero`，以及推進 `succ`，可以假設 `n` 時成立（叫做 `ih`），證明 `n + 1` 時也成立。就像骨牌：第一張倒下，每一張都推倒下一張。",
    ],
    link: ["structure", "induction"],
  },
  calc: {
    origin: ["calc = calculation: a chain of steps written as on paper, each with its reason.", "calc = calculation（計算）：像在紙上一樣寫成一連串步驟，每一步附上理由。"],
    short: ["a chain of steps a = b = c…", "一連串的步驟 a = b = c……"],
    long: [
      "Writes the proof the way you would on paper: `calc a < b := … _ ≤ c := …`, one justified step per line, and Lean joins the chain into `a < c`.",
      "照紙上的寫法寫證明：`calc a < b := … _ ≤ c := …`，每行一步並附理由，Lean 再把整條鏈接成 `a < c`。",
    ],
    link: ["structure", "calc"],
  },
  show: {
    origin: ["show = \"we show that…\": say in your own words which goal you are proving.", "show = 「我們要證明……」：用你自己的寫法說出正在證明的目標。"],
    short: ["restate the goal in a clearer form", "用更清楚的形式重述目標"],
    long: [
      "`show P` tells Lean \"the goal is P\" in a form you choose, as long as it means the same thing. Helps both you and later tactics read the goal.",
      "`show P` 告訴 Lean「目標是 P」，用你選的形式寫出來，只要意思相同即可。讓你和之後的戰術都更容易讀懂目標。",
    ],
    link: ["structure", "show"],
  },
  generalize: {
    origin: ["generalize = make it more general: replace a specific expression by a fresh variable, and prove the claim for any value.", "generalize = 一般化：把一段特定的式子換成新變數，改證對任何值都成立的命題。"],
    short: ["give a sub-expression its own name", "替一段子式取個名字"],
    long: [
      "Replaces a complicated piece of the goal by a fresh variable, so you can reason about it as a single thing.",
      "把目標裡一段複雜的式子換成一個新變數，讓你把它當成一個整體來推理。",
    ],
  },
  apply: {
    origin: ["apply = apply a theorem: use \"if A then C\" to turn the goal C into the goal A.", "apply = 套用定理：用「若 A 則 C」把目標 C 變成目標 A。"],
    short: ["work backwards from a fact's conclusion", "從某個事實的結論往回推"],
    long: [
      "If a fact says \"A and B give C\" and your goal is C, `apply` it: the goal becomes A and B. Like \"to show C, it is enough to show A and B\".",
      "如果某個事實說「有 A 和 B 就有 C」，而你的目標是 C，就 `apply` 它：目標變成 A 和 B。就像「要證 C，只要證 A 和 B 就夠了」。",
    ],
  },
  refine: {
    origin: ["refine = make more precise, step by step: give the proof with holes `?_` now, fill them in later.", "refine = 逐步精煉：先給出帶洞 `?_` 的證明，洞之後再補。"],
    short: ["give the proof's shape, fill the holes later", "先給證明的形狀，洞之後再補"],
    long: [
      "Like `exact`, but you may leave holes `?_` that become new goals. `refine ⟨x + y, ?_⟩` says \"the witness is x + y; I'll prove its property next\".",
      "和 `exact` 類似，但可以留下洞 `?_`，它們會變成新的目標。`refine ⟨x + y, ?_⟩` 的意思是「見證是 x + y，它的性質我接著證」。",
    ],
    link: ["structure", "refine"],
  },
  cases: {
    origin: ["cases = case analysis: the mathematician's \"Case 1… Case 2…\".", "cases = 分情形討論：數學家的「情形一……情形二……」。"],
    short: ["split into cases", "分情況討論"],
    long: [
      "From `h : P ∨ Q` (or a value of a type with several shapes), `cases` gives one goal per possibility, each with its own hypothesis. \"Case 1: P holds… Case 2: Q holds…\".",
      "從 `h : P ∨ Q`（或有好幾種形狀的值），`cases` 為每種可能各開一個目標，各帶自己的前提。「情況一：P 成立……情況二：Q 成立……」",
    ],
    link: ["structure", "cases"],
  },
};

/** The glossary entry for a chip (looked up by its first word), or undefined. */
export function explainTactic(chip: string): TacticInfo | undefined {
  const head = chip.trim().match(/^[^\s[(]+/)?.[0] ?? "";
  return TACTICS[head];
}

/** The parts of a problem's start file `[def …] theorem name args : claim := by sorry`, for the clickable statement;
 * `defs` holds any definitions before the theorem (e.g. `def sumTo : Nat → Nat …`). null when the file has another
 * shape (imports, several theorems…). */
export function statementParts(start: string): { defs: string; name: string; args: string; claim: string } | null {
  const text = start.trim();
  const at = text.search(/^theorem\s/m);
  if (at < 0) return null;
  const defs = text.slice(0, at).trim();
  // only plain definitions may come first
  if (defs && !/^(?:def|abbrev)\s/.test(defs)) return null;
  if (defs && /^(?:theorem|import|open|namespace|variable)\s/m.test(defs)) return null;
  const m = text.slice(at).match(/^theorem\s+(\S+)\s*((?:[({[⦃][^:]*?:[^)}\]⦄]*[)}\]⦄]\s*)*):\s*([\s\S]+?)\s*:=\s*by\s+sorry$/u);
  return m ? { defs, name: m[1], args: m[2].trim(), claim: m[3].trim() } : null;
}
