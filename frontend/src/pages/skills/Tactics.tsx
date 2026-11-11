/** Coding Skills ▸ First tactics (#/skills/tactics[/<section>]). Lean code: lean/Formalizer/Pages/Tactics.lean. */
import { Callout, Lean, List, P, Page, Section, SiteLink, Sources, Table, TryIn, snippet, type L, type SectionInfo } from "../kit";

const PAGE = "tactics";

const SECTIONS: SectionInfo[] = [
  { id: "goal", title: ["What a tactic is", "戰術是什麼"] },
  { id: "history", title: ["Where tactics come from: LCF to Lean", "戰術從哪裡來：從 LCF 到 Lean"] },
  { id: "rfl", title: ["`rfl`: both sides compute to the same thing", "`rfl`：兩邊算出來一樣"] },
  { id: "decide", title: ["`decide`: let Lean check it by computation", "`decide`：讓 Lean 用計算檢查"] },
  { id: "simp", title: ["`simp`: simplify with known rules", "`simp`：用已知規則化簡"] },
  { id: "omega", title: ["`omega`: whole-number arithmetic with + and ≤", "`omega`：只含 + 與 ≤ 的整數算術"] },
  { id: "exact", title: ["`exact`: hand Lean the finished proof", "`exact`：直接交出完成的證明"] },
  { id: "intro", title: ['`intro`: "let n be any number…"', "`intro`：「設 n 為任意數……」"] },
  { id: "constructor", title: ["`constructor`: split *and* and *if and only if*", "`constructor`：拆開「且」與「若且唯若」"] },
  {
    id: "mathlib",
    title: [
      "Next: `norm_num`, `ring`, `linarith`, `positivity` (Mathlib)",
      "接下來：`norm_num`、`ring`、`linarith`、`positivity`（Mathlib）",
    ],
  },
  { id: "table", title: ["Summary: the goal looks like … → try …", "總整理：目標長這樣 … → 試試 …"] },
];

const FAILS: L = ["the error message is the point: read it", "重點就是錯誤訊息：讀讀看"];

export default function TacticsSkill({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["First tactics", "第一批戰術"]}
      intro={[
        "A handful of tactics proves most of the tutorial. For each one: what it does in one sentence, when it works, when it fails (with the failing case, so you recognise the error), and a minimal example. Every example marked *checked by Lean in CI* really compiles.",
        "少數幾個戰術就能證完大部分教學題。每個戰術都有：一句話說明它做什麼、什麼時候有用、什麼時候會失敗（附上失敗的例子，讓你認得那個錯誤），以及一個最小範例。標示 *已由 Lean 在 CI 中檢查* 的範例都真的能編譯。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="goal" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A proof in Lean starts with a **goal**: the statement still to be proved, shown in the panel after the symbol `⊢`. Above it are the **hypotheses**: what you may use. A **tactic** is one instruction that changes the goal: it either closes it, or replaces it with one or more easier goals. The proof is done when no goal is left.",
            "Lean 裡的證明從一個 **目標** 開始：還沒證明的陳述，在面板中顯示於符號 `⊢` 後面。它上方是 **前提**（面板寫「已知」）：你可以使用的東西。**戰術** 是一道改變目標的指令：要嘛直接關掉目標，要嘛換成一個或幾個比較容易的目標。沒有目標剩下時，證明就完成了。",
          ]}
        />
        <Lean code={snippet("Tactics", "first-proof")} />
        <P
          t={[
            "`by` switches to tactic mode; each following line is one tactic. Here a single tactic, `rfl`, closes the goal `2 + 2 = 4`.",
            "`by` 會切換到戰術模式；後面每一行是一個戰術。這裡只用一個戰術 `rfl` 就關掉了目標 `2 + 2 = 4`。",
          ]}
        />
        <Callout kind="tip" title={["When a tactic fails", "戰術失敗時"]}>
          <P
            t={[
              "Nothing breaks: Lean underlines the tactic and says why. A failed tactic is information: it tells you what kind of goal you have. The usual messages are explained on the page about errors.",
              "什麼都不會壞：Lean 會在該戰術下畫線並說明原因。失敗的戰術也是資訊：它告訴你手上的目標是哪一種。常見訊息在錯誤訊息那一頁有說明。",
            ]}
          />
          <SiteLink to={["skills", "errors"]} label={["Reading error messages", "讀懂錯誤訊息"]} />
        </Callout>
      </Section>

      <Section page={PAGE} id="history" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            'Tactics were invented by **Robin Milner** for **LCF**, a proof checker he began at Stanford in 1972 and rebuilt at Edinburgh (*Edinburgh LCF*, 1979). To write tactics safely he designed a programming language for them, **ML** (the "meta language" of LCF), the ancestor of Standard ML and OCaml. Milner received the Turing Award in 1991, for LCF, ML and his work on concurrency.',
            "戰術是 **Robin Milner** 為 **LCF** 發明的。LCF 是他 1972 年在史丹佛開始做的證明檢查器，後來在愛丁堡重建（*Edinburgh LCF*，1979）。為了安全地撰寫戰術，他替戰術設計了一個程式語言 **ML**（LCF 的「後設語言」），它是 Standard ML 與 OCaml 的祖先。Milner 在 1991 年獲得圖靈獎，表彰他在 LCF、ML 與並行計算上的工作。",
          ]}
        />
        <P
          t={[
            "In LCF a tactic is a function $\\text{tactic} : \\text{goal} \\to \\text{goal list} \\times (\\text{thm list} \\to \\text{thm})$. It splits a goal into smaller subgoals and hands back a *validation*: once you have proved the subgoals, it rebuilds the theorem from them. Why a buggy tactic can't fool LCF: theorems have their own type `thm`, and only the rules of the logic can create a value of that type. LCF never builds a proof term; the type system is the guard.",
            "在 LCF 裡，戰術是一個函數 $\\text{tactic} : \\text{goal} \\to \\text{goal list} \\times (\\text{thm list} \\to \\text{thm})$。它把一個目標拆成較小的子目標，並交回一個 *驗證函數*：等子目標都證完，再用它們重建出定理。為什麼有錯的戰術騙不了 LCF：定理有自己的型別 `thm`，而只有邏輯的推論規則能產生這個型別的值。LCF 從不建出證明項；把關的是型別系統。",
          ]}
        />
        <P
          t={[
            "HOL, Isabelle, Coq (now Rocq) and Lean all inherited tactics. Lean 4 changes two things. First, a goal is a **hole** in a proof term that is being built: `constructor` on `p ∧ q` fills the hole with `⟨?_, ?_⟩`, and the two new holes `?_` become your next goals; when no hole is left, the term is finished. Second, the finished term is **checked again by the kernel**, so you trust the small kernel rather than the tactics (the de Bruijn criterion, see How Lean checks).",
            "HOL、Isabelle、Coq（現名 Rocq）與 Lean 都繼承了戰術。Lean 4 改了兩件事。第一，目標是一個正在建構中的證明項裡的 **洞**：對 `p ∧ q` 用 `constructor`，會把洞填成 `⟨?_, ?_⟩`，而兩個新的洞 `?_` 就成為你接下來的目標；當沒有洞剩下，證明項就完成了。第二，完成的證明項會 **再交給核心檢查一次**，所以你信任的是小小的核心，而不是戰術（de Bruijn 準則，見「Lean 如何檢查」）。",
          ]}
        />
        <Lean
          code={snippet("Tactics", "holes")}
          note={[
            "`show_term` prints the term a tactic wrote: the `?_` are the holes left for the next steps.",
            "`show_term` 印出戰術寫下的證明項：`?_` 就是留給下一步的洞。",
          ]}
        />
        <Table
          head={[
            ["", ""],
            ["LCF (1979)", "LCF（1979）"],
            ["Lean 4", "Lean 4"],
          ]}
          rows={[
            [
              ["A tactic is", "戰術是"],
              ["an ML function: goal → subgoals + validation", "一個 ML 函數：目標 → 子目標 + 驗證函數"],
              ["a Lean program that fills holes in a proof term", "一個填補證明項裡的洞的 Lean 程式"],
            ],
            [
              ["It builds", "它建出"],
              ["the theorem itself (no proof term)", "定理本身（沒有證明項）"],
              ["a proof term", "一個證明項"],
            ],
            [
              ["You trust", "你信任的是"],
              ["the type `thm`: only the logic's rules make theorems", "型別 `thm`：只有邏輯規則能產生定理"],
              ["the kernel, which re-checks the term", "核心，它會重新檢查證明項"],
            ],
            [
              ["Tactics are written in", "戰術用什麼寫"],
              ["ML", "ML"],
              ["Lean itself", "Lean 本身"],
            ],
          ]}
        />
        <P
          t={[
            "Because Lean's tactics are Lean programs, you can make your own from existing ones. This one tries the one-step tactics of this page in turn:",
            "因為 Lean 的戰術就是 Lean 程式，你可以用現有的戰術組出自己的戰術。下面這個會依序嘗試本頁的一步戰術：",
          ]}
        />
        <Lean code={snippet("Tactics", "one-step")} />
        <Callout kind="note" title={["Is a tactic AI?", "戰術是 AI 嗎？"]}>
          <P
            t={[
              "No. A tactic is an ordinary, deterministic program: the same goal gives the same result. AI provers (History, part IV) decide *which* tactics to try; whatever they choose, the kernel still checks the finished term.",
              "不是。戰術是普通、確定性的程式：同樣的目標得到同樣的結果。AI 證明器（歷史頁第四部）決定 *要試哪些* 戰術；不論它們選了什麼，完成的證明項仍由核心檢查。",
            ]}
          />
        </Callout>
        <TryIn ids={["even-sum", "cases-or"]} />
        <SiteLink to={["concept", "kernel"]} label={["Concept ▸ How Lean checks", "概念 ▸ Lean 如何檢查"]} />
        <Sources
          items={[
            {
              label: "Mike Gordon, From LCF to HOL: a short history (2000)",
              url: "https://www.cl.cam.ac.uk/archive/mjcg/papers/HolHistory.pdf",
            },
            { label: "Gordon, Milner, Wadsworth, Edinburgh LCF (LNCS 78, 1979)", url: "https://doi.org/10.1007/3-540-09724-4" },
            { label: "Robin Milner (Wikipedia)", url: "https://en.wikipedia.org/wiki/Robin_Milner" },
            {
              label: "Metaprogramming in Lean 4: Tactics",
              url: "https://leanprover-community.github.io/lean4-metaprogramming-book/main/09_tactics.html",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="rfl" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "**What it does:** proves `a = b` when Lean, by unfolding definitions and computing, gets the same thing on both sides.",
            "**做什麼：** 當 Lean 展開定義、計算之後，兩邊得到同一個東西時，證明 `a = b`。",
          ]}
        />
        <Lean code={snippet("Tactics", "rfl")} />
        <P
          t={[
            "**When it fails:** when the two sides are only equal *for a reason*, not by computation. `a + b = b + a` is true for every `a` and `b`, but with letters instead of numbers there is nothing to compute:",
            "**什麼時候失敗：** 兩邊只是「有理由」相等，而不是算出來相等的時候。`a + b = b + a` 對所有 `a`、`b` 都成立，但字母不是數字，沒有東西可以算：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example (a b : Nat) : a + b = b + a := by rfl
-- error: The left-hand side  a + b
--   is not definitionally equal to the right-hand side  b + a`}
        />
        <P
          t={[
            "A subtler case: `[] ++ xs = xs` is `rfl` (joining starts from the left list, which is empty), but `xs ++ [] = xs` is not, because Lean doesn't know what `xs` looks like. Use `simp` there.",
            "比較微妙的例子：`[] ++ xs = xs` 可以用 `rfl`（串接從左邊的串列開始算，而它是空的），但 `xs ++ [] = xs` 不行，因為 Lean 不知道 `xs` 長什麼樣子。那裡改用 `simp`。",
          ]}
        />
        <TryIn ids={["hello", "induction-double", "gauss"]} />
      </Section>

      <Section page={PAGE} id="decide" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "**What it does:** proves a statement about concrete, finite things (numbers, `∧`, `∨`, `¬`, `∀ n < 10`) by running a checking program and looking at the answer `true`.",
            "**做什麼：** 證明關於具體、有限事物的陳述（數字、`∧`、`∨`、`¬`、`∀ n < 10`），方法是執行一個檢查程式，看到答案是 `true`。",
          ]}
        />
        <Lean code={snippet("Tactics", "decide")} />
        <P
          t={[
            "**When it fails:** when the statement mentions a variable that could be anything. Lean can't try infinitely many numbers:",
            "**什麼時候失敗：** 陳述裡有一個可以是任何值的變數時。Lean 無法試遍無限多個數：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example (n : Nat) : n + 0 = n := by decide
-- error: Expected type must not contain free variables`}
        />
        <P
          t={[
            "It also gives up when the computation is too big (a huge range of cases). For a statement about every `n`, use `omega`, `simp` or induction.",
            "計算量太大時（要檢查的情況太多）它也會放棄。對「所有 `n`」的陳述，改用 `omega`、`simp` 或歸納法。",
          ]}
        />
        <TryIn ids={["hello", "check-cases"]} />
      </Section>

      <Section page={PAGE} id="simp" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "**What it does:** rewrites the goal again and again with a large list of library facts marked as simplification rules (`xs.reverse.reverse = xs`, `a + 0 = a`, `xs ++ [] = xs`, …) until nothing changes; if the goal becomes `True`, it is proved.",
            "**做什麼：** 用一大串標記為化簡規則的函式庫事實（`xs.reverse.reverse = xs`、`a + 0 = a`、`xs ++ [] = xs` ……）反覆改寫目標，直到不再變化；如果目標變成 `True`，就證完了。",
          ]}
        />
        <Lean code={snippet("Tactics", "simp")} />
        <P
          t={[
            "`simp` does not look at your hypotheses unless you list them: `simp [h]` adds `h` to its rules.",
            "除非你列出來，`simp` 不會去看你的前提：`simp [h]` 會把 `h` 加進它的規則。",
          ]}
        />
        <Lean code={snippet("Tactics", "simp-hyp")} />
        <P
          t={[
            "**When it fails:** when no rule applies. Swapping the order of a sum is not a simplification (it would loop forever), so:",
            "**什麼時候失敗：** 沒有規則可用的時候。交換加法的順序不算化簡（不然會無限循環），所以：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example (a b : Nat) : a + b = b + a := by simp
-- error: \`simp\` made no progress`}
        />
        <P
          t={[
            "`simp` may also stop with a goal that is simpler but not closed; then continue with another tactic. To see which rules it used, write `simp?` (see the page on finding lemmas).",
            "`simp` 也可能停在一個比較簡單、但還沒關掉的目標；那就接著用別的戰術。想知道它用了哪些規則，寫 `simp?`（見尋找引理那一頁）。",
          ]}
        />
        <TryIn ids={["reverse-twice", "induction-double"]} />
      </Section>

      <Section page={PAGE} id="omega" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "**What it does:** proves goals about natural numbers and integers built from `+`, `-`, multiplication by a fixed number (`2 * n`), `/` and `%` by a fixed number, `=`, `<`, `≤`, using the hypotheses of that kind. It decides such statements completely: if `omega` fails, the claim does not follow from those facts alone.",
            "**做什麼：** 證明由 `+`、`-`、乘以固定數字（`2 * n`）、除以或對固定數字取餘（`/`、`%`）、`=`、`<`、`≤` 組成的自然數與整數目標，並會使用同類的前提。這類陳述它能完全判定：如果 `omega` 失敗，表示光靠這些事實推不出結論。",
          ]}
        />
        <Lean code={snippet("Tactics", "omega")} />
        <Callout kind="note" title={["Subtraction on `Nat` stops at 0", "`Nat` 的減法停在 0"]}>
          <P
            t={[
              'On natural numbers, `3 - 5 = 0`. `omega` knows this, which is why `a - 5 ≤ a` is easy for it and why some "obvious" facts about subtraction are false on `Nat`.',
              "在自然數上 `3 - 5 = 0`。`omega` 知道這件事，所以 `a - 5 ≤ a` 對它很簡單，也因此有些關於減法的「顯然」事實在 `Nat` 上其實是錯的。",
            ]}
          />
        </Callout>
        <P
          t={[
            "**When it fails:** when two variables are multiplied together. `omega` treats `a * b` and `b * a` as two unrelated unknowns:",
            "**什麼時候失敗：** 兩個變數相乘時。`omega` 把 `a * b` 和 `b * a` 當成兩個無關的未知數：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example (a b : Nat) : a * b = b * a := by omega
-- error: omega could not prove the goal:
-- a possible counterexample may satisfy the constraints ...
--  c := ↑b * ↑a
--  d := ↑a * ↑b`}
        />
        <P
          t={[
            "There, use a library lemma (`exact Nat.mul_comm a b`) or, with Mathlib, `ring`.",
            "這時改用函式庫引理（`exact Nat.mul_comm a b`），或在有 Mathlib 時用 `ring`。",
          ]}
        />
        <TryIn ids={["add-comm", "squeeze", "even-sum"]} />
      </Section>

      <Section page={PAGE} id="exact" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "**What it does:** closes the goal with a term whose type is exactly the goal: a hypothesis, or a library lemma applied to the right arguments.",
            "**做什麼：** 用一個型別剛好等於目標的項關掉目標：可以是一個前提，或是套上正確參數的函式庫引理。",
          ]}
        />
        <Lean code={snippet("Tactics", "exact")} />
        <P
          t={[
            'Read `Nat.le_trans h₁ h₂` as "the library fact *≤ is transitive*, applied to `h₁ : a ≤ b` and `h₂ : b ≤ c`": its result is `a ≤ c`, which is the goal.',
            "把 `Nat.le_trans h₁ h₂` 讀成「函式庫事實 *≤ 有遞移性*，套用在 `h₁ : a ≤ b` 和 `h₂ : b ≤ c` 上」：結果是 `a ≤ c`，正好是目標。",
          ]}
        />
        <P
          t={[
            "**When it fails:** when the term proves something *almost* like the goal. Lean does not try to fix it for you:",
            "**什麼時候失敗：** 當這個項證明的東西「幾乎」等於目標時。Lean 不會幫你修正：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example (a b : Nat) : b + a = a + b := by
  exact Nat.add_comm a b
-- error: Type mismatch
--   Nat.add_comm a b
-- has type  a + b = b + a
-- but is expected to have type  b + a = a + b`}
        />
        <P
          t={[
            "Fix: `exact Nat.add_comm b a`. When you don't know the lemma's name, `exact?` searches for it.",
            "修正：`exact Nat.add_comm b a`。不知道引理名稱時，`exact?` 會幫你找。",
          ]}
        />
        <SiteLink to={["skills", "search"]} label={["Finding lemmas", "尋找引理"]} />
        <TryIn ids={["add-comm", "le-chain", "search", "cases-or"]} />
      </Section>

      <Section page={PAGE} id="intro" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            '**What it does:** when the goal is "for every `n`, …" (`∀ n, …`) or "if `p` then …" (`p → …`), `intro` names the `n` (or the assumption `p`) and moves it above the line, leaving the rest as the goal. It is the Lean version of "let `n` be any number" or "assume `p`".',
            "**做什麼：** 當目標是「對每個 `n`，……」（`∀ n, …`）或「若 `p` 則……」（`p → …`）時，`intro` 替 `n`（或假設 `p`）取名並移到橫線上方，剩下的部分成為目標。這就是 Lean 版的「設 `n` 為任意數」或「假設 `p`」。",
          ]}
        />
        <Lean code={snippet("Tactics", "intro")} />
        <P
          t={[
            "**When it fails:** when there is nothing to introduce, because the goal has no `∀` or `→` in front:",
            "**什麼時候失敗：** 沒有東西可以引入的時候，因為目標前面沒有 `∀` 或 `→`：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example : 2 + 2 = 4 := by
  intro h
-- error: There are no additional binders or \`let\` bindings in the goal to introduce`}
        />
        <P
          t={[
            "A variable written before the colon, as in `theorem add_swap (a b : Nat) : …`, is already above the line: no `intro` needed.",
            "寫在冒號前面的變數，例如 `theorem add_swap (a b : Nat) : …`，本來就在橫線上方：不需要 `intro`。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="constructor" n={9} title={SECTIONS[8].title}>
        <P
          t={[
            "**What it does:** splits a goal `P ∧ Q` (*and*) into two goals `P` and `Q`, and a goal `P ↔ Q` (*if and only if*) into the two directions `P → Q` and `Q → P`. The `·` (type `\\.`) starts the proof of each goal in turn.",
            "**做什麼：** 把目標 `P ∧ Q`（「且」）拆成 `P` 與 `Q` 兩個目標，把 `P ↔ Q`（「若且唯若」）拆成兩個方向 `P → Q` 與 `Q → P`。`·`（輸入 `\\.`）依序開始每個目標的證明。",
          ]}
        />
        <Lean code={snippet("Tactics", "constructor")} />
        <P
          t={[
            "**When it fails:** on a goal that has no way to be built, like `False`. And on `P ∨ Q` (*or*) it silently picks the left side, which may be the wrong one:",
            "**什麼時候失敗：** 目標根本沒有建構方式時，例如 `False`。而對 `P ∨ Q`（「或」），它會默默選左邊，可能選錯：",
          ]}
        />
        <Lean
          fails
          note={FAILS}
          code={`example (p q : Prop) (hq : q) : p ∨ q := by
  constructor   -- chose the left side: the goal is now p
  exact hq
-- error: Type mismatch  hq  has type  q  but is expected to have type  p`}
        />
        <P
          t={[
            "For *or*, say which side with `left` or `right`; for *there exists*, give the example with `exists`:",
            "對「或」，用 `left` 或 `right` 指定哪一邊；對「存在」，用 `exists` 給出例子：",
          ]}
        />
        <Lean code={snippet("Tactics", "left-right-exists")} />
        <SiteLink to={["skills", "structure"]} label={["Structuring a proof", "組織證明"]} />
      </Section>

      <Section page={PAGE} id="mathlib" n={10} title={SECTIONS[9].title}>
        <Callout kind="warn" title={["These need Mathlib", "這些需要 Mathlib"]}>
          <P
            t={[
              "`norm_num`, `ring`, `linarith` and `positivity` are not part of Lean itself but of **Mathlib**, the large community library. The Lite runner (core Lean only) answers that they need the Full runner. The examples below are not compiled by CI.",
              "`norm_num`、`ring`、`linarith` 和 `positivity` 不屬於 Lean 本身，而屬於社群的大型函式庫 **Mathlib**。Lite 執行器（只有核心 Lean）會回答它們需要 Full 執行器。以下範例沒有經過 CI 編譯。",
            ]}
          />
        </Callout>
        <Table
          head={[
            ["Tactic", "戰術"],
            ["What it does", "做什麼"],
            ["Fails when", "什麼時候失敗"],
          ]}
          rows={[
            [
              ["`norm_num`", "`norm_num`"],
              [
                "Arithmetic with concrete numbers, including fractions and real numbers: `(2 : ℚ) / 4 = 1 / 2`.",
                "具體數字的算術，包括分數與實數：`(2 : ℚ) / 4 = 1 / 2`。",
              ],
              ["The goal has variables that need a real argument.", "目標裡有變數，需要真正的論證。"],
            ],
            [
              ["`ring`", "`ring`"],
              [
                "Equalities that follow from the rules of algebra alone (expand, collect terms): $(a+b)^2 = a^2 + 2ab + b^2$.",
                "只靠代數規則（展開、合併同類項）就成立的等式：$(a+b)^2 = a^2 + 2ab + b^2$。",
              ],
              [
                "The equality needs a hypothesis (`ring` ignores them), or it is an inequality.",
                "等式需要用到前提（`ring` 不看前提），或者它是不等式。",
              ],
            ],
            [
              ["`linarith`", "`linarith`"],
              [
                "Inequalities that follow by adding up hypotheses (linear: no variable times variable), over ℚ, ℝ, ℤ, ℕ.",
                "把前提加加減減就能得到的不等式（線性：沒有變數乘變數），適用於 ℚ、ℝ、ℤ、ℕ。",
              ],
              [
                "The argument needs a product of variables, such as $x \\cdot y > 0$ from $x > 0$ and $y > 0$.",
                "論證需要變數相乘，例如從 $x > 0$ 和 $y > 0$ 推出 $x \\cdot y > 0$。",
              ],
            ],
            [
              ["`positivity`", "`positivity`"],
              [
                "Goals `0 < e`, `0 ≤ e` or `e ≠ 0`, read off from the shape of `e`: squares, sums of positives, absolute values…",
                "形如 `0 < e`、`0 ≤ e` 或 `e ≠ 0` 的目標，從 `e` 的形狀判斷：平方、正數的和、絕對值……",
              ],
              ["Positivity depends on a subtraction, as in `0 < x - 1`.", "正負取決於減法，例如 `0 < x - 1`。"],
            ],
          ]}
        />
        <Lean
          runner="mathlib"
          code={`example : (2 : ℚ) / 4 + 1 / 4 = 3 / 4 := by norm_num

example (a b : ℤ) : (a + b) ^ 2 = a ^ 2 + 2 * a * b + b ^ 2 := by ring

example (x y : ℚ) (h₁ : x < y) (h₂ : y ≤ 3) : x < 3 := by linarith

example (x : ℝ) : 0 < x ^ 2 + 1 := by positivity`}
        />
        <P
          t={[
            "In core Lean, the closest you have is `decide`/`rfl` for concrete numbers and `omega` for linear facts about `Nat` and `Int`.",
            "在核心 Lean 裡，最接近的是：具體數字用 `decide`／`rfl`，`Nat` 與 `Int` 的線性事實用 `omega`。",
          ]}
        />
        <TryIn ids={["hello"]} />
      </Section>

      <Section page={PAGE} id="table" n={11} title={SECTIONS[10].title}>
        <P
          t={[
            "Look at the goal after `⊢` and pick the first tactic to try. If it fails, the error tells you which row you are really in.",
            "看 `⊢` 後面的目標，挑第一個要試的戰術。失敗的話，錯誤訊息會告訴你實際上該看哪一列。",
          ]}
        />
        <Table
          head={[
            ["The goal looks like …", "目標長這樣 …"],
            ["Try …", "試試 …"],
          ]}
          rows={[
            [
              ["Numbers only: `2 + 2 = 4`, `91 % 7 = 0`, `3 < 5`", "只有數字：`2 + 2 = 4`、`91 % 7 = 0`、`3 < 5`"],
              ["`rfl` or `decide` (Mathlib: `norm_num`)", "`rfl` 或 `decide`（Mathlib：`norm_num`）"],
            ],
            [
              ["A check over finitely many cases: `∀ n < 10, …`", "有限多種情況的檢查：`∀ n < 10, …`"],
              ["`decide`", "`decide`"],
            ],
            [
              [
                "`+`, `-`, `<`, `≤` on `Nat`/`Int` with letters: `a + b = b + a`, `n < 5 → …`",
                "`Nat`／`Int` 上含字母的 `+`、`-`、`<`、`≤`：`a + b = b + a`、`n < 5 → …`",
              ],
              ["`omega`", "`omega`"],
            ],
            [
              ["Variables multiplied together: `a * b = b * a`", "變數相乘：`a * b = b * a`"],
              ["a library lemma with `exact`/`rw` (Mathlib: `ring`)", "用 `exact`／`rw` 套函式庫引理（Mathlib：`ring`）"],
            ],
            [
              ["Lists and functions: `xs.reverse.reverse = xs`", "串列與函式：`xs.reverse.reverse = xs`"],
              ["`simp`", "`simp`"],
            ],
            [
              ["Exactly a hypothesis `h`, or a known fact", "剛好是某個前提 `h`，或已知事實"],
              [
                "`exact h`, `exact Nat.le_trans h₁ h₂`, or search with `exact?`",
                "`exact h`、`exact Nat.le_trans h₁ h₂`，或用 `exact?` 搜尋",
              ],
            ],
            [
              ["`a = c` and you have `h : a = b`", "`a = c`，而你有 `h : a = b`"],
              ["`rw [h]` (rewrite `a` into `b`), then continue", "`rw [h]`（把 `a` 改寫成 `b`），再繼續"],
            ],
            [
              ["`∀ x, …` or `P → Q`", "`∀ x, …` 或 `P → Q`"],
              ["`intro x` / `intro hp`", "`intro x`／`intro hp`"],
            ],
            [
              ["`P ∧ Q` or `P ↔ Q`", "`P ∧ Q` 或 `P ↔ Q`"],
              ["`constructor`, then `·` for each part", "`constructor`，再用 `·` 證每一部分"],
            ],
            [
              ["`P ∨ Q`", "`P ∨ Q`"],
              ["`left` or `right`", "`left` 或 `right`"],
            ],
            [
              ["`∃ x, …`", "`∃ x, …`"],
              ["`exists 7` or `refine ⟨7, ?_⟩`", "`exists 7` 或 `refine ⟨7, ?_⟩`"],
            ],
            [
              ["A statement about every `n` that needs the previous case", "關於每個 `n`、需要用到前一個情況的陳述"],
              ["`induction n with …`", "`induction n with …`"],
            ],
            [
              ["Ordered field inequalities, `0 < x ^ 2 + 1`, `(a+b)^2 = …`", "有序體上的不等式、`0 < x ^ 2 + 1`、`(a+b)^2 = …`"],
              ["Mathlib: `linarith`, `positivity`, `ring`", "Mathlib：`linarith`、`positivity`、`ring`"],
            ],
          ]}
        />
        <List
          items={[
            [
              "The tactics `rw`, `induction` and `refine` are covered with the other proof-building tools in *Structuring a proof*.",
              "`rw`、`induction`、`refine` 等戰術和其他組織證明的工具一起，在《組織證明》中介紹。",
            ],
          ]}
        />
        <SiteLink to={["skills", "structure"]} label={["Structuring a proof", "組織證明"]} />
        <Sources
          items={[
            { label: "Theorem Proving in Lean 4: Tactics", url: "https://lean-lang.org/theorem_proving_in_lean4/Tactics/" },
            { label: "Lean Language Reference: Tactic Proofs", url: "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/" },
            { label: "Mathematics in Lean", url: "https://leanprover-community.github.io/mathematics_in_lean/" },
            { label: "Mathlib documentation", url: "https://leanprover-community.github.io/mathlib4_docs/" },
          ]}
        />
      </Section>
    </Page>
  );
}
