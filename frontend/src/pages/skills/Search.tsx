/** Coding Skills ▸ Finding lemmas (#/skills/search[/<section>]). Lean code: lean/Formalizer/Pages/Search.lean. */
import { Callout, Lean, List, P, Page, Section, SiteLink, Sources, Table, TryIn, snippet, type SectionInfo } from "../kit";

const PAGE = "search";

const SECTIONS: SectionInfo[] = [
  { id: "why", title: ["Don't prove it, find it", "不要自己證，去找"] },
  { id: "exact", title: ["`exact?`: find a lemma that closes the goal", "`exact?`：找一條能關掉目標的引理"] },
  { id: "apply", title: ["`apply?`: find a lemma that makes progress", "`apply?`：找一條能推進的引理"] },
  { id: "simp", title: ["`simp?`: which rules did `simp` use?", "`simp?`：`simp` 用了哪些規則？"] },
  { id: "rw", title: ["`rw?`: find a rewrite", "`rw?`：找一個改寫"] },
  { id: "check", title: ["`#check`: what does this name say?", "`#check`：這個名字說了什麼？"] },
  { id: "names", title: ["How library names are built", "函式庫名稱怎麼組成"] },
  { id: "dot", title: ["Dot notation: `xs.length`, `h.symm`, `h.1`", "點記法：`xs.length`、`h.symm`、`h.1`"] },
  { id: "online", title: ["Searching on the web: Mathlib docs, Loogle, LeanSearch", "上網搜尋：Mathlib 文件、Loogle、LeanSearch"] },
  { id: "workflow", title: ["A search routine", "一套搜尋流程"] },
];

export default function SearchSkill({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["Finding lemmas", "尋找引理"]}
      intro={[
        "Lean's library already contains thousands of proved facts: `a + b = b + a`, the length of two joined lists, `a < b` and `b ≤ c` give `a < c`… Most of a real proof is finding the right one and using it. This page shows the tools that search for you, and how names are built so you can guess them.",
        "Lean 的函式庫裡已有成千上萬條證好的事實：`a + b = b + a`、兩個串列接起來的長度、由 `a < b` 與 `b ≤ c` 得到 `a < c`……真正寫證明時，大部分工夫在於找到對的那一條並用上它。這一頁介紹會幫你搜尋的工具，以及名稱的構成方式，讓你能猜出名字。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="why" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A fact in the library is called a **lemma** or **theorem**; each has a name, like `Nat.add_comm`, and a statement, like `n + m = m + n`. Using it is one line: `exact Nat.add_comm a b`. Proving it yourself might take ten. So before proving a small fact, look for it. There are three ways:",
            "函式庫裡的事實叫做 **引理** 或 **定理**；每一條都有名字（例如 `Nat.add_comm`）和陳述（例如 `n + m = m + n`）。使用它只要一行：`exact Nat.add_comm a b`；自己證可能要十行。所以在證明小事實之前，先找找看。有三種方法：",
          ]}
        />
        <List
          ordered
          items={[
            ["ask Lean to search, with the tactics ending in `?` (sections 2–5);", "請 Lean 搜尋：用結尾是 `?` 的戰術（第 2–5 節）；"],
            [
              "guess the name from the naming rules and check it with `#check` (sections 6–8);",
              "依命名規則猜名字，再用 `#check` 確認（第 6–8 節）；",
            ],
            ["search the web (section 9).", "上網搜尋（第 9 節）。"],
          ]}
        />
        <Callout kind="note" title={["Core Lean or Mathlib?", "核心 Lean 還是 Mathlib？"]}>
          <P
            t={[
              "All tools on this page except the web search are built into Lean itself (v4.34.1, the version Formalizer uses). They search whatever is loaded: on the Lite runner that is core Lean's library (`Nat`, `Int`, `List`, logic); on the Full runner it is all of Mathlib.",
              "除了上網搜尋，本頁所有工具都內建在 Lean 本身（Formalizer 使用的 v4.34.1）。它們搜尋目前載入的內容：在 Lite 執行器上是核心 Lean 的函式庫（`Nat`、`Int`、`List`、邏輯）；在 Full 執行器上則是整個 Mathlib。",
            ]}
          />
        </Callout>
      </Section>

      <Section page={PAGE} id="exact" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Write `exact?` where the proof should go. Lean searches the library for a lemma that, with your hypotheses, proves the goal exactly, and answers with a line starting with **Try this**:",
            "在證明的位置寫 `exact?`。Lean 會在函式庫中搜尋一條引理，搭配你的前提剛好證出目標，並回覆一行以 **Try this** 開頭的建議：",
          ]}
        />
        <Lean code={snippet("Search", "exact-q")} />
        <P
          t={[
            "Copy the suggestion over the `exact?` (in an editor, click it). Then the proof no longer depends on a search, and you have learned a name:",
            "把建議貼上取代 `exact?`（在編輯器裡點一下即可）。這樣證明就不再依賴搜尋，你也學到了一個名字：",
          ]}
        />
        <Lean code={snippet("Search", "exact-q-done")} />
        <P
          t={[
            "**When it fails:** when the goal is not a single library fact away. It then reports that it could not find a lemma. Split the goal into smaller steps (see *Structuring a proof*) and search for each. A search can also take several seconds on the Full runner, because Mathlib is big.",
            "**什麼時候失敗：** 目標和函式庫事實之間不只差一步時。它會回報找不到引理。把目標拆成小步驟（見《組織證明》），每一步再分別搜尋。在 Full 執行器上搜尋也可能要好幾秒，因為 Mathlib 很大。",
          ]}
        />
        <TryIn ids={["search"]} />
      </Section>

      <Section page={PAGE} id="apply" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "`apply?` searches more widely: it also lists lemmas whose conclusion fits the goal but that leave new goals to prove (for example the hypotheses of the lemma). If one closes the goal completely, it suggests it with `exact`:",
            "`apply?` 搜尋得更廣：它也會列出結論符合目標、但會留下新目標（例如引理本身的前提）要證的引理。如果有一條能完全關掉目標，它會用 `exact` 的形式建議：",
          ]}
        />
        <Lean code={snippet("Search", "apply-q")} />
        <P
          t={[
            "Use it when `exact?` finds nothing: a suggestion like `refine Nat.lt_of_lt_of_le ?_ h₂` still tells you which lemma to build on, and the `?_` is what remains to prove.",
            "當 `exact?` 找不到東西時就用它：像 `refine Nat.lt_of_lt_of_le ?_ h₂` 這樣的建議仍然告訴你該以哪條引理為基礎，`?_` 就是剩下要證的部分。",
          ]}
        />
        <TryIn ids={["le-chain", "calc-chain"]} />
      </Section>

      <Section page={PAGE} id="simp" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "`simp` uses hundreds of rules silently. `simp?` does the same work, then tells you the few rules it actually used, as a `simp only [...]` line:",
            "`simp` 會默默使用上百條規則。`simp?` 做同樣的事，然後告訴你它實際用到的那幾條規則，寫成一行 `simp only [...]`：",
          ]}
        />
        <Lean code={snippet("Search", "simp-q")} />
        <P
          t={[
            "Two uses: you learn the lemma's name (`List.reverse_reverse`), and `simp only [...]` is faster and keeps working when the library's list of simp rules changes.",
            "兩個用處：你學到引理的名字（`List.reverse_reverse`）；而且 `simp only [...]` 比較快，函式庫的化簡規則清單變動時也不會壞掉。",
          ]}
        />
        <TryIn ids={["reverse-twice", "induction-double"]} />
      </Section>

      <Section page={PAGE} id="rw" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "`rw?` looks for equations in the library whose left side appears in your goal, lists each with the goal it would produce, and applies the first one. Expect a long list; the first suggestions are usually the useful ones.",
            "`rw?` 會在函式庫中找出左邊出現在你目標裡的等式，逐條列出套用後會得到的目標，並套用第一條。清單通常很長；最前面的幾條通常就是有用的。",
          ]}
        />
        <Lean code={snippet("Search", "rw-q")} />
        <P t={["Once you know the names, write the rewrites yourself:", "知道名字之後，就自己寫出改寫："]} />
        <Lean code={snippet("Search", "rw-done")} />
        <TryIn ids={["length-swap", "regroup"]} />
      </Section>

      <Section page={PAGE} id="check" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "`#check name` prints the statement of a lemma: what it needs and what it gives. It is how you confirm a guessed name, or find the order of its arguments. `#eval` computes a value, useful to test a definition on an example.",
            "`#check 名稱` 會印出一條引理的陳述：它需要什麼、給出什麼。用它來確認猜到的名字，或查出參數的順序。`#eval` 則計算一個值，適合拿例子測試定義。",
          ]}
        />
        <Lean code={snippet("Search", "check")} />
        <P
          t={[
            "How to read the answer: names in `( )` are arguments you pass (`Nat.add_comm a b`); names in `{ }` are filled in by Lean from the rest; everything before the last `→` is a hypothesis you must supply. So `Nat.lt_of_lt_of_le h₁ h₂` needs `h₁ : n < m` and `h₂ : m ≤ k`, and gives `n < k`. If the name doesn't exist, Lean says `Unknown identifier`: guess again.",
            "怎麼讀回答：`( )` 裡的名字是你要傳入的參數（`Nat.add_comm a b`）；`{ }` 裡的由 Lean 從其他部分自動推出；最後一個 `→` 之前的都是你必須提供的前提。所以 `Nat.lt_of_lt_of_le h₁ h₂` 需要 `h₁ : n < m` 和 `h₂ : m ≤ k`，給出 `n < k`。如果名字不存在，Lean 會說 `Unknown identifier`：再猜一次。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="names" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "Library names are not random: a name is the statement read aloud, in a fixed vocabulary. It starts with the type it is about (`Nat.`, `List.`, `Int.`), then describes the left side of the statement, with `_` between words.",
            "函式庫的名字不是隨便取的：名字就是把陳述用固定詞彙唸出來。開頭是它所談的型別（`Nat.`、`List.`、`Int.`），接著描述陳述的左邊，詞與詞之間用 `_` 隔開。",
          ]}
        />
        <Table
          head={[
            ["Name", "名稱"],
            ["Statement", "陳述"],
            ["How to read it", "怎麼讀"],
          ]}
          rows={[
            [
              ["`Nat.add_comm`", "`Nat.add_comm`"],
              ["`n + m = m + n`", "`n + m = m + n`"],
              ["`add` is *comm*utative", "`add` 有 *交換律*（comm）"],
            ],
            [
              ["`Nat.mul_assoc`", "`Nat.mul_assoc`"],
              ["`n * m * k = n * (m * k)`", "`n * m * k = n * (m * k)`"],
              ["`mul` is *assoc*iative: regroup", "`mul` 有 *結合律*（assoc）：重新分組"],
            ],
            [
              ["`Nat.zero_add` / `Nat.add_zero`", "`Nat.zero_add`／`Nat.add_zero`"],
              ["`0 + n = n` / `n + 0 = n`", "`0 + n = n`／`n + 0 = n`"],
              ["the left side, read left to right", "左邊，從左往右唸"],
            ],
            [
              ["`List.length_append`", "`List.length_append`"],
              ["`(as ++ bs).length = as.length + bs.length`", "`(as ++ bs).length = as.length + bs.length`"],
              ["the `length` of an `append`: outer function first", "`append` 的 `length`：外層函式先唸"],
            ],
            [
              ["`List.reverse_reverse`", "`List.reverse_reverse`"],
              ["`as.reverse.reverse = as`", "`as.reverse.reverse = as`"],
              ["`reverse` of `reverse`", "`reverse` 的 `reverse`"],
            ],
            [
              ["`Nat.mul_add`", "`Nat.mul_add`"],
              ["`n * (m + k) = n * m + n * k`", "`n * (m + k) = n * m + n * k`"],
              ["a `mul` of an `add`: distributing", "`add` 外面乘一個 `mul`：分配律"],
            ],
            [
              ["`Nat.le_trans`", "`Nat.le_trans`"],
              ["`n ≤ m → m ≤ k → n ≤ k`", "`n ≤ m → m ≤ k → n ≤ k`"],
              ["`le` (≤) is *trans*itive", "`le`（≤）有 *遞移性*（trans）"],
            ],
            [
              ["`Nat.lt_irrefl`", "`Nat.lt_irrefl`"],
              ["`¬n < n`", "`¬n < n`"],
              ["`lt` (<) is *irrefl*exive: never `n < n`", "`lt`（<）*非自反*（irrefl）：不會有 `n < n`"],
            ],
            [
              ["`Nat.lt_of_lt_of_le`", "`Nat.lt_of_lt_of_le`"],
              ["`n < m → m ≤ k → n < k`", "`n < m → m ≤ k → n < k`"],
              ["conclusion first, then `_of_` each hypothesis", "先唸結論，再用 `_of_` 接上每個前提"],
            ],
            [
              ["`Nat.lt_add_one_iff`", "`Nat.lt_add_one_iff`"],
              ["`m < n + 1 ↔ m ≤ n`", "`m < n + 1 ↔ m ≤ n`"],
              ["`_iff`: an *if and only if*, usable in both directions", "`_iff`：「若且唯若」，兩個方向都能用"],
            ],
            [
              ["`Nat.succ_ne_zero`", "`Nat.succ_ne_zero`"],
              ["`n + 1 ≠ 0`", "`n + 1 ≠ 0`"],
              ["`ne` = ≠; also `pos` = `0 <`, `nonneg` = `0 ≤`", "`ne` = ≠；另有 `pos` = `0 <`、`nonneg` = `0 ≤`"],
            ],
          ]}
        />
        <P
          t={[
            'The vocabulary: `add` +, `sub` −, `mul` ×, `div` /, `mod` %, `pow` ^, `neg` −x, `succ` n+1, `le` ≤, `lt` <, `eq` =, `ne` ≠, `zero` 0, `one` 1, `comm`, `assoc`, `left`/`right` (which side), `cancel`, `self` (the same thing twice, as in `Nat.lt_succ_self : n < n + 1`). So to find "multiplying both sides of ≤ by k", guess `Nat.mul_le_mul_left` and `#check` it.',
            "詞彙表：`add` 加、`sub` 減、`mul` 乘、`div` 除、`mod` 取餘、`pow` 次方、`neg` 負號、`succ` n+1、`le` ≤、`lt` <、`eq` =、`ne` ≠、`zero` 0、`one` 1、`comm` 交換、`assoc` 結合、`left`/`right`（哪一側）、`cancel` 消去、`self`（同一個東西出現兩次，例如 `Nat.lt_succ_self : n < n + 1`）。所以想找「≤ 兩邊同乘 k」，就猜 `Nat.mul_le_mul_left`，再 `#check` 一下。",
          ]}
        />
        <Sources items={[{ label: "Mathlib naming conventions", url: "https://leanprover-community.github.io/contribute/naming.html" }]} />
      </Section>

      <Section page={PAGE} id="dot" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            "If `xs` is a `List`, then `xs.length` means `List.length xs`: Lean looks up `length` in the namespace of `xs`'s type. The same works for proofs: if `h` is an equation (`Eq`), `h.symm` is `Eq.symm h`, the equation read backwards. For `h : P ∧ Q`, `h.1` and `h.2` are the two halves; for `h : P ↔ Q`, `h.mp` goes left to right and `h.mpr` right to left.",
            "如果 `xs` 是一個 `List`，那 `xs.length` 就是 `List.length xs`：Lean 會到 `xs` 的型別的命名空間裡找 `length`。證明也一樣：若 `h` 是一個等式（`Eq`），`h.symm` 就是 `Eq.symm h`，把等式反過來讀。對 `h : P ∧ Q`，`h.1` 與 `h.2` 是兩半；對 `h : P ↔ Q`，`h.mp` 從左推到右，`h.mpr` 從右推到左。",
          ]}
        />
        <Lean code={snippet("Search", "dot")} />
        <P
          t={[
            "Dot notation only finds names that exist in that namespace. `h₁ : a ≤ b` has type `LE.le a b`, and core Lean has no `Nat.le.trans`, so this fails on the Lite runner (Mathlib adds `LE.le.trans`, and there it works):",
            "點記法只能找到該命名空間裡確實存在的名字。`h₁ : a ≤ b` 的型別是 `LE.le a b`，而核心 Lean 沒有 `Nat.le.trans`，所以在 Lite 執行器上會失敗（Mathlib 加了 `LE.le.trans`，在那裡就可以）：",
          ]}
        />
        <Lean
          fails
          note={["on core Lean; write `Nat.le_trans h₁ h₂` instead", "在核心 Lean 上；改寫成 `Nat.le_trans h₁ h₂`"]}
          code={`example (a b c : Nat) (h₁ : a ≤ b) (h₂ : b ≤ c) : a ≤ c := h₁.trans h₂
-- error: Invalid field \`trans\`: The environment does not contain \`Nat.le.trans\``}
        />
      </Section>

      <Section page={PAGE} id="online" n={9} title={SECTIONS[8].title}>
        <P t={["When you need Mathlib, or want to browse, three websites help:", "需要 Mathlib，或想瀏覽時，有三個網站可以幫忙："]} />
        <Table
          head={[
            ["Site", "網站"],
            ["What you type", "輸入什麼"],
            ["Good for", "適合"],
          ]}
          rows={[
            [
              [
                "**Mathlib docs** https://leanprover-community.github.io/mathlib4_docs/",
                "**Mathlib 文件** https://leanprover-community.github.io/mathlib4_docs/",
              ],
              ["part of a name: `add_comm`, `length_append`", "名字的一部分：`add_comm`、`length_append`"],
              ["reading a lemma's exact statement and the file around it", "閱讀引理的精確陳述與所在檔案"],
            ],
            [
              ["**Loogle** https://loogle.lean-lang.org", "**Loogle** https://loogle.lean-lang.org"],
              [
                'constants, a name piece in quotes, or a pattern with `_` and `?a`: `List.length, List.reverse` · `"comm"` · `?a * ?b = ?b * ?a` · `|- _ < _ + 1`',
                '常數、加引號的名字片段，或用 `_` 與 `?a` 的樣式：`List.length, List.reverse`・`"comm"`・`?a * ?b = ?b * ?a`・`|- _ < _ + 1`',
              ],
              ["finding a lemma by the shape of its statement", "依陳述的形狀找引理"],
            ],
            [
              ["**LeanSearch** https://leansearch.net", "**LeanSearch** https://leansearch.net"],
              ["plain English: *the length of a reversed list is the same*", "用英文白話描述：*the length of a reversed list is the same*"],
              ["when you don't know any of the words in the name", "完全猜不到名字裡的詞時"],
            ],
          ]}
        />
        <P
          t={[
            'In Loogle, separate filters with commas and they must all match; `|-` (or `⊢`) means "the conclusion looks like". These sites search Mathlib, which includes core Lean, so a name they show may still need the Full runner: check it with `#check` on the runner you use.',
            "在 Loogle 裡，用逗號隔開的條件必須全部符合；`|-`（或 `⊢`）表示「結論長得像」。這些網站搜尋的是 Mathlib（其中包含核心 Lean），所以它們給出的名字可能需要 Full 執行器：在你使用的執行器上用 `#check` 確認。",
          ]}
        />
        <Sources
          items={[
            { label: "Mathlib documentation", url: "https://leanprover-community.github.io/mathlib4_docs/" },
            { label: "Loogle", url: "https://loogle.lean-lang.org" },
            { label: "LeanSearch", url: "https://leansearch.net" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="workflow" n={10} title={SECTIONS[9].title}>
        <List
          ordered
          items={[
            ['Read the goal and say it in words: "the length of a joined list".', "讀目標，用文字說出來：「接起來的串列的長度」。"],
            ["Try `exact?`. If it finds something, paste the suggestion and move on.", "試 `exact?`。找到了就貼上建議，繼續往下。"],
            [
              "If the goal is an equation that needs reshaping, try `rw?` or `simp?` and keep the useful step.",
              "如果目標是需要整理的等式，試 `rw?` 或 `simp?`，留下有用的那一步。",
            ],
            [
              "Otherwise guess a name from the vocabulary (`List.length_append`) and `#check` it.",
              "否則依照詞彙表猜名字（`List.length_append`），再 `#check`。",
            ],
            ["Still nothing: Loogle with the shape, LeanSearch with words.", "還是沒有：用 Loogle 搜形狀，用 LeanSearch 搜文字。"],
            [
              "Nothing anywhere: the fact is probably not in the library in that form. Prove it as your own small lemma.",
              "到處都找不到：這個事實大概沒有以這種形式收在函式庫裡。把它當成你自己的小引理證出來。",
            ],
          ]}
        />
        <SiteLink to={["skills", "structure"]} label={["Structuring a proof: splitting off a lemma", "組織證明：拆出引理"]} />
        <Sources
          items={[
            {
              label: "Lean Language Reference: Tactic Reference",
              url: "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/Tactic-Reference/",
            },
            { label: "Theorem Proving in Lean 4: Tactics", url: "https://lean-lang.org/theorem_proving_in_lean4/Tactics/" },
            { label: "Mathematics in Lean", url: "https://leanprover-community.github.io/mathematics_in_lean/" },
          ]}
        />
      </Section>
    </Page>
  );
}
