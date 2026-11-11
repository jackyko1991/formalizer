/** Coding Skills ▸ Structuring a proof (#/skills/structure[/<section>]). Lean code: lean/Formalizer/Pages/Structure.lean. */
import { Callout, Lean, List, P, Page, Section, SiteLink, Sources, Table, TryIn, snippet, type SectionInfo } from "../kit";

const PAGE = "structure";

const SECTIONS: SectionInfo[] = [
  { id: "plan", title: ["A proof is a plan with steps", "證明是一份分步驟的計畫"] },
  { id: "have", title: ["`have`: prove a stepping stone first", "`have`：先證一塊墊腳石"] },
  { id: "show", title: ["`show`: say what the goal is, in your words", "`show`：用你的寫法說出目標"] },
  { id: "obtain", title: ["`obtain` / `rcases`: unpack what you know", "`obtain`／`rcases`：拆開已知的東西"] },
  { id: "cases", title: ["`cases`: one proof per case", "`cases`：每個情況各一個證明"] },
  { id: "induction", title: ["`induction`: from n to n + 1", "`induction`：從 n 推到 n + 1"] },
  { id: "calc", title: ["`calc`: a chain of steps, like on paper", "`calc`：像紙上一樣的一串步驟"] },
  { id: "refine", title: ["`refine ⟨_, ?_⟩`: fill in part, leave holes", "`refine ⟨_, ?_⟩`：填一部分，留下空格"] },
  { id: "focus", title: ["`constructor` and `·`: one goal at a time", "`constructor` 與 `·`：一次處理一個目標"] },
  { id: "lemmas", title: ["Split a long proof into lemmas", "把長證明拆成引理"] },
  { id: "worked", title: ["Worked example: n² + n is even", "完整範例：n² + n 是偶數"] },
];

export default function StructureSkill({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["Structuring a proof", "組織證明"]}
      intro={[
        "One tactic is enough for small facts. Larger proofs need structure: intermediate facts, cases, induction, chains of equalities. This page shows the tools that give a Lean proof the shape of a proof on paper, then puts them together in one longer example.",
        "小事實用一個戰術就夠了。比較大的證明需要結構：中間事實、分情況、歸納法、一連串等式。這一頁介紹讓 Lean 證明有紙上證明樣子的工具，最後把它們組合成一個較長的範例。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="plan" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            'On paper you write: *"First note that … . Now take the two cases … . In the first case …"*. Each of these phrases has a Lean counterpart:',
            "在紙上你會寫：*「首先注意到……。接著分兩種情況……。第一種情況下……」*。這些句子在 Lean 裡都有對應：",
          ]}
        />
        <Table
          head={[
            ["On paper", "紙上"],
            ["In Lean", "Lean 裡"],
          ]}
          rows={[
            [
              ["*First note that* $P$, because …", "*首先注意到* $P$，因為……"],
              ["`have h : P := …`", "`have h : P := …`"],
            ],
            [
              ["*We must show* …", "*我們要證明*……"],
              ["`show …`", "`show …`"],
            ],
            [
              ["*Since* $a$ *is even, write* $a = 2x$", "*因為* $a$ *是偶數，設* $a = 2x$"],
              ["`obtain ⟨x, hx⟩ := ha`", "`obtain ⟨x, hx⟩ := ha`"],
            ],
            [
              ["*Case 1: … Case 2: …*", "*情況一：…… 情況二：……*"],
              ["`cases h with | inl … | inr …`", "`cases h with | inl … | inr …`"],
            ],
            [
              ["*By induction on* $n$", "*對* $n$ *做歸納*"],
              ["`induction n with | zero … | succ m ih …`", "`induction n with | zero … | succ m ih …`"],
            ],
            [
              ["$a = b = c < d$", "$a = b = c < d$"],
              ["`calc`", "`calc`"],
            ],
            [
              ["*Take* $k = 5$*; then …*", "*取* $k = 5$*，則……*"],
              ["`refine ⟨5, ?_⟩`", "`refine ⟨5, ?_⟩`"],
            ],
            [
              ["*We prove both parts*", "*兩部分分別證明*"],
              ["`constructor` then `·`", "`constructor` 再用 `·`"],
            ],
            [
              ["*By Lemma 1*", "*由引理 1*"],
              ["a separate `theorem`, used by name", "另一個 `theorem`，用名字引用"],
            ],
          ]}
        />
        <P
          t={[
            "Keep the goal panel open while you write: after every line it shows what is known (above the line) and what is left (after `⊢`). Structure is how you keep that panel readable.",
            "寫的時候讓目標面板一直開著：每一行之後，它都會顯示已知（橫線上方）和剩下要證的（`⊢` 後面）。結構就是讓這個面板保持好讀的方法。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="have" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "`have name : statement := proof` proves an intermediate fact and adds it to what you know, under that name. The main goal does not change. Here two facts are proved, then combined:",
            "`have 名字 : 陳述 := 證明` 先證一個中間事實，並以這個名字加入已知。主要目標不變。這裡先證兩個事實，再把它們組合起來：",
          ]}
        />
        <Lean code={snippet("Structure", "have")} />
        <P
          t={[
            "When the stepping stone needs its own tactics, write `:= by` and indent them below. Then a tactic like `omega` can use it with the other hypotheses:",
            "如果墊腳石本身需要戰術，寫 `:= by`，在下面縮排寫戰術。之後像 `omega` 這樣的戰術就能把它和其他前提一起使用：",
          ]}
        />
        <Lean code={snippet("Structure", "have-by")} />
        <Callout kind="tip" title={["Why bother", "為什麼要這樣做"]}>
          <P
            t={[
              "`omega` can't see inside `List.length`, but once `have` has turned the list fact into arithmetic (`hlen`), it can finish. `have` is how you hand an automatic tactic the one fact it was missing.",
              "`omega` 看不進 `List.length` 裡面，但只要 `have` 把串列的事實變成算術（`hlen`），它就能收尾。`have` 就是把自動戰術缺的那一個事實交給它的方法。",
            ]}
          />
        </Callout>
      </Section>

      <Section page={PAGE} id="show" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "`show statement` replaces the goal with another way of writing it, for example with a definition unfolded. Lean accepts it only if the two are the same by computation, so it also checks your understanding of the goal:",
            "`show 陳述` 把目標換成另一種寫法，例如把定義展開。只有兩者經計算確實相同時 Lean 才接受，所以它同時也檢查你是否看懂了目標：",
          ]}
        />
        <Lean code={snippet("Structure", "show")} />
        <Lean
          fails
          note={["`double 3` is `3 + 3`, not `3 * 3`", "`double 3` 是 `3 + 3`，不是 `3 * 3`"]}
          code={`example : double 3 = 6 := by
  show 3 * 3 = 6
-- error: 'show' tactic failed, pattern  3 * 3 = 6
--   is not definitionally equal to target  double 3 = 6`}
        />
        <TryIn ids={["induction-double"]} />
      </Section>

      <Section page={PAGE} id="obtain" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "A hypothesis can contain several things packed together. `h : ∃ k, a = 2 * k` holds a number *and* a fact about it; `h : P ∧ Q` holds two facts. `obtain pattern := h` unpacks it and names the pieces. The pattern `⟨x, hx⟩` (type `\\<` and `\\>`) has one name per piece:",
            "一個前提裡可能打包了好幾樣東西。`h : ∃ k, a = 2 * k` 裡有一個數 *和* 一個關於它的事實；`h : P ∧ Q` 裡有兩個事實。`obtain 樣式 := h` 會把它拆開並替每一塊取名。樣式 `⟨x, hx⟩`（輸入 `\\<` 和 `\\>`）每一塊對應一個名字：",
          ]}
        />
        <Lean code={snippet("Structure", "obtain")} />
        <P
          t={[
            "For `P ∨ Q` (*or*) you don't get both pieces but one of two cases, written with `|`. `rcases` is the same tool used as a tactic name; `rcases h with h1 | h3` gives one goal per case:",
            "對 `P ∨ Q`（「或」），你拿到的不是兩塊，而是兩種情況之一，用 `|` 寫。`rcases` 是同一個工具的戰術名稱；`rcases h with h1 | h3` 每種情況給一個目標：",
          ]}
        />
        <Lean code={snippet("Structure", "rcases")} />
        <Table
          head={[
            ["Hypothesis", "前提"],
            ["Pattern", "樣式"],
            ["You get", "得到"],
          ]}
          rows={[
            [
              ["`h : ∃ x, P x`", "`h : ∃ x, P x`"],
              ["`⟨x, hx⟩`", "`⟨x, hx⟩`"],
              ["`x` and `hx : P x`", "`x` 與 `hx : P x`"],
            ],
            [
              ["`h : P ∧ Q`", "`h : P ∧ Q`"],
              ["`⟨hp, hq⟩`", "`⟨hp, hq⟩`"],
              ["`hp : P` and `hq : Q`", "`hp : P` 與 `hq : Q`"],
            ],
            [
              ["`h : P ∨ Q`", "`h : P ∨ Q`"],
              ["`hp | hq`", "`hp | hq`"],
              ["two goals: one with `hp`, one with `hq`", "兩個目標：一個有 `hp`，一個有 `hq`"],
            ],
            [
              ["`h : ∃ x, P x ∧ Q x`", "`h : ∃ x, P x ∧ Q x`"],
              ["`⟨x, hp, hq⟩`", "`⟨x, hp, hq⟩`"],
              ["patterns nest: `x`, `hp`, `hq`", "樣式可以巢狀：`x`、`hp`、`hq`"],
            ],
          ]}
        />
        <TryIn ids={["even-sum"]} />
      </Section>

      <Section page={PAGE} id="cases" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "`cases h with` splits on the ways `h` can have been made, with one named branch `| name … => proof` per way. For `p ∨ q` the branches are `inl` (the left side holds) and `inr` (the right side holds):",
            "`cases h with` 依照 `h` 可能的形成方式分情況，每一種方式一個具名分支 `| 名字 … => 證明`。對 `p ∨ q`，分支是 `inl`（左邊成立）和 `inr`（右邊成立）：",
          ]}
        />
        <Lean code={snippet("Structure", "cases-or")} />
        <P
          t={[
            "On a natural number, the cases are `zero` (it is 0) and `succ m` (it is `m + 1` for some `m`):",
            "對自然數，情況是 `zero`（它是 0）和 `succ m`（它是某個 `m` 的 `m + 1`）：",
          ]}
        />
        <Lean code={snippet("Structure", "cases-nat")} />
        <P
          t={[
            "Lean checks that every case is handled. Forget one and it says so:",
            "Lean 會檢查是否每個情況都處理了。漏掉一個，它會告訴你：",
          ]}
        />
        <Lean
          fails
          note={["the `succ` branch is missing", "少了 `succ` 分支"]}
          code={`example (n : Nat) : n = 0 ∨ 0 < n := by
  cases n with
  | zero => left; rfl
-- error: Alternative \`succ\` has not been provided`}
        />
        <TryIn ids={["cases-or"]} />
      </Section>

      <Section page={PAGE} id="induction" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "Induction proves a statement for every `n` in two steps: it is true for `0`, and if it is true for `m` then it is true for `m + 1`. `induction n with` creates exactly those two goals; in the `succ m ih` branch, `ih` (the *induction hypothesis*) is the statement for `m`.",
            "歸納法分兩步證明對每個 `n` 都成立的陳述：對 `0` 成立；若對 `m` 成立，則對 `m + 1` 也成立。`induction n with` 正好產生這兩個目標；在 `succ m ih` 分支中，`ih`（*歸納假設*）就是對 `m` 的陳述。",
          ]}
        />
        <Lean code={snippet("Structure", "induction")} />
        <P
          t={[
            "Here `show` unfolds `sumTo (m + 1)` by its definition, `rw` expands the product $(m+1)(m+1)$ so that `omega` sees only sums, and `omega` finishes using `ih`. Induction works the same way on lists, with the cases `nil` (empty list) and `cons x xs` (first element `x`, then the rest `xs`):",
            "這裡 `show` 依定義展開 `sumTo (m + 1)`，`rw` 把乘積 $(m+1)(m+1)$ 展開，讓 `omega` 只看到加法，最後 `omega` 用 `ih` 收尾。對串列也一樣做歸納，情況是 `nil`（空串列）與 `cons x xs`（第一個元素 `x`，接著其餘的 `xs`）：",
          ]}
        />
        <Lean code={snippet("Structure", "induction-list")} />
        <TryIn ids={["induction-double", "gauss"]} />
        <Sources
          items={[
            {
              label: "Theorem Proving in Lean 4: Induction and Recursion",
              url: "https://lean-lang.org/theorem_proving_in_lean4/Induction-and-Recursion/",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="calc" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "`calc` writes a chain $a < b \\le c < c + 1$ as on paper: one step per line, each with its own justification after `:=`. `_` stands for the right side of the previous line. Lean combines the steps (here `<` with `≤` gives `<`):",
            "`calc` 像在紙上一樣寫出一串 $a < b \\le c < c + 1$：每行一步，每一步在 `:=` 後面附上自己的理由。`_` 代表上一行的右邊。Lean 會把各步組合起來（這裡 `<` 接 `≤` 得到 `<`）：",
          ]}
        />
        <Lean code={snippet("Structure", "calc")} />
        <P
          t={[
            "Each justification can be a lemma name, a hypothesis, or `by` followed by tactics. When you don't know how to justify a step yet, write `by sorry` there and fill it in later: Lean checks the rest of the chain meanwhile.",
            "每一步的理由可以是引理名稱、前提，或 `by` 接上戰術。還不知道某一步怎麼證時，先寫 `by sorry`，之後再補：同時 Lean 會檢查鏈的其餘部分。",
          ]}
        />
        <TryIn ids={["calc-chain", "gauss"]} />
      </Section>

      <Section page={PAGE} id="refine" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            "`⟨a, b⟩` builds an `∃` or `∧` from its pieces. `refine` lets you give some pieces now and mark the others `?_`: each `?_` becomes a new goal. For *there exists*, the first piece is the example (the *witness*):",
            "`⟨a, b⟩` 用各個部分組出 `∃` 或 `∧`。`refine` 讓你先給一些部分，把其他標成 `?_`：每個 `?_` 都會變成新目標。對「存在」，第一個部分是那個例子（*見證*）：",
          ]}
        />
        <Lean code={snippet("Structure", "refine")} />
        <P
          t={[
            "Write `?_`, not `_`, for the holes you want to prove next. A plain `_` asks Lean to fill the hole itself, and it can't:",
            "要留給自己接著證的空格寫 `?_`，不是 `_`。單獨的 `_` 是請 Lean 自己填，而它填不出來：",
          ]}
        />
        <Lean
          fails
          note={["use `?_` for goals you will prove", "你要自己證的目標用 `?_`"]}
          code={`example : ∃ n : Nat, n + n = 10 ∧ n < 6 := by
  refine ⟨5, _, _⟩
-- error: don't know how to synthesize placeholder for argument \`left\`
-- context:
-- ⊢ 5 + 5 = 10`}
        />
        <TryIn ids={["even-sum"]} />
      </Section>

      <Section page={PAGE} id="focus" n={9} title={SECTIONS[8].title}>
        <P
          t={[
            "`constructor` splits `P ∧ Q` into `P` and `Q`, and `P ↔ Q` into `P → Q` and `Q → P`. Several goals are then open at once. Start each with `·` (type `\\.`) and indent its proof: Lean then works on that goal only, and complains if the block doesn't finish it, so a mistake stays local.",
            "`constructor` 把 `P ∧ Q` 拆成 `P` 與 `Q`，把 `P ↔ Q` 拆成 `P → Q` 與 `Q → P`。這時會同時有好幾個目標。每個目標用 `·`（輸入 `\\.`）開頭並縮排寫它的證明：Lean 就只處理那個目標；若該區塊沒證完，它會抱怨，錯誤因此留在局部。",
          ]}
        />
        <Lean code={snippet("Structure", "focus")} />
        <Callout kind="tip" title={["Without the dots", "不寫點的話"]}>
          <P
            t={[
              "The proof would still run (tactics apply to the first open goal), but you lose track of which goal each line is for, and an error in the first part shows up as a confusing error in the second.",
              "證明仍然能跑（戰術會作用在第一個未完成的目標上），但你會搞不清楚每一行是給哪個目標的，而且第一部分的錯誤會在第二部分變成令人困惑的錯誤。",
            ]}
          />
        </Callout>
        <SiteLink to={["skills", "tactics", "constructor"]} label={["First tactics: constructor", "第一批戰術：constructor"]} />
      </Section>

      <Section page={PAGE} id="lemmas" n={10} title={SECTIONS[9].title}>
        <P
          t={[
            "When a `have` grows to more than a few lines, or you need the same fact twice, make it its own `theorem` above the main one and use it by name. A lemma has its own statement, so you can test it alone and its errors stay inside it.",
            "當一個 `have` 長到好幾行，或同一個事實要用兩次時，就把它寫成主定理上方的獨立 `theorem`，再用名字引用。引理有自己的陳述，可以單獨測試，它的錯誤也只留在它自己裡面。",
          ]}
        />
        <List
          items={[
            [
              "**Give it the most general statement** you can: variables instead of numbers, no hypotheses it doesn't use.",
              "**陳述盡量一般化**：用變數而不是具體數字，不放用不到的前提。",
            ],
            [
              "**Name it like the library does** (`consecutive_even`, `length_append'`): see the naming rules on *Finding lemmas*.",
              "**像函式庫那樣命名**（`consecutive_even`、`length_append'`）：命名規則見《尋找引理》。",
            ],
            [
              "**Write the statements first, proofs `sorry`**: if the main theorem follows from the lemmas, you know the plan works before proving anything hard.",
              "**先寫陳述，證明先放 `sorry`**：如果主定理能由引理推出，你就在證任何難的東西之前確定了計畫可行。",
            ],
          ]}
        />
        <SiteLink to={["skills", "search", "names"]} label={["How library names are built", "函式庫名稱怎麼組成"]} />
      </Section>

      <Section page={PAGE} id="worked" n={11} title={SECTIONS[10].title}>
        <P
          t={[
            '**Claim:** for every natural number $n$, $n^2 + n$ is even. **Plan on paper:** $n^2 + n = n(n+1)$, a product of two consecutive numbers; one of them is even. Proving "one of them is even" needs cases on parity, so instead prove by induction that $n(n+1)$ is even: from $m(m+1) = 2k$, $(m+1)(m+2) = m(m+1) + 2(m+1) = 2k + 2(m+1)$.',
            "**命題：** 對每個自然數 $n$，$n^2 + n$ 是偶數。**紙上的計畫：** $n^2 + n = n(n+1)$，是兩個連續數的乘積；其中一個是偶數。要證「其中一個是偶數」得分奇偶情況，所以改用歸納法證 $n(n+1)$ 是偶數：由 $m(m+1) = 2k$ 得 $(m+1)(m+2) = m(m+1) + 2(m+1) = 2k + 2(m+1)$。",
          ]}
        />
        <Lean code={snippet("Structure", "worked")} />
        <List
          ordered
          items={[
            [
              "**Split into a lemma:** `consecutive_even` is the real work; the main theorem only rearranges.",
              "**拆出引理：** 真正的工作在 `consecutive_even`；主定理只是重新整理。",
            ],
            [
              "**`induction n with`**: the `zero` case is $0 \\cdot 1 = 2 \\cdot 0$, true by computation.",
              "**`induction n with`**：`zero` 情況是 $0 \\cdot 1 = 2 \\cdot 0$，計算即成立。",
            ],
            [
              "**`obtain ⟨k, hk⟩ := ih`**: the induction hypothesis says *some* `k` works for `m`; unpack it.",
              "**`obtain ⟨k, hk⟩ := ih`**：歸納假設說對 `m` 有 *某個* `k`；把它拆開。",
            ],
            [
              "**`refine ⟨k + (m + 1), ?_⟩`**: choose the new witness; what remains is the equation.",
              "**`refine ⟨k + (m + 1), ?_⟩`**：選定新的見證；剩下的是等式。",
            ],
            [
              "**`calc`**: the paper computation line by line, each step justified by one rewrite (`Nat.mul_comm`, `Nat.add_mul`, `hk`) and the last by `omega`.",
              "**`calc`**：把紙上的計算逐行寫出，每一步用一個改寫說明（`Nat.mul_comm`、`Nat.add_mul`、`hk`），最後一步用 `omega`。",
            ],
            [
              "**Main theorem:** `have h` turns $n \\cdot n + n$ into $n(n+1)$, `obtain` takes the `k` from the lemma, and `⟨k, by rw [h, hk]⟩` assembles the answer.",
              "**主定理：** `have h` 把 $n \\cdot n + n$ 變成 $n(n+1)$，`obtain` 從引理取出 `k`，`⟨k, by rw [h, hk]⟩` 組出答案。",
            ],
          ]}
        />
        <TryIn ids={["gauss", "even-sum"]} />
        <Sources
          items={[
            { label: "Theorem Proving in Lean 4: Tactics", url: "https://lean-lang.org/theorem_proving_in_lean4/Tactics/" },
            { label: "Mathematics in Lean: Logic", url: "https://leanprover-community.github.io/mathematics_in_lean/C03_Logic.html" },
            {
              label: "Lean Language Reference: Tactic Reference",
              url: "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/Tactic-Reference/",
            },
          ]}
        />
      </Section>
    </Page>
  );
}
