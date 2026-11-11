/** Concept ▸ Lean maths (#/concept/maths[/<section>]). Lean code: lean/Formalizer/Pages/LeanMaths.lean. */
import { useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, Sources, Table, TryIn, snippet, type SectionInfo } from "../kit";

const PAGE = "maths";

const SECTIONS: SectionInfo[] = [
  { id: "types", title: ["Everything has a type", "每個東西都有型別"] },
  { id: "props", title: ["Statements are types, proofs are values", "陳述是型別，證明是值"] },
  { id: "logic", title: ["The logic symbols: how to prove, how to use", "邏輯符號：怎麼證明、怎麼使用"] },
  { id: "recursion", title: ["Recursion and induction are two sides of one coin", "遞迴與歸納法是一體兩面"] },
  { id: "nat", title: ["Natural numbers: subtraction and division surprise you", "自然數：減法與除法會嚇你一跳"] },
  { id: "styles", title: ["Term proofs and tactic proofs", "項證明與戰術證明"] },
  { id: "paper", title: ["From paper to Lean, line by line", "從紙上到 Lean，逐行對照"] },
  { id: "mathlib", title: ["Mathlib: the big library", "Mathlib：龐大的數學函式庫"] },
];

const TPIL = { label: "Theorem Proving in Lean 4", url: "https://lean-lang.org/theorem_proving_in_lean4/" };
const FPIL = { label: "Functional Programming in Lean", url: "https://lean-lang.org/functional_programming_in_lean/" };
const MIL = { label: "Mathematics in Lean", url: "https://leanprover-community.github.io/mathematics_in_lean/" };

/** Three levels: values, their types, and the types' own types (Type for data, Prop for statements). */
function TypeLadder() {
  const { pick } = useLang();
  const rows = [
    { x: 90, value: "2", type: "Nat", sort: "Type" },
    { x: 300, value: "double", type: "Nat → Nat", sort: "Type" },
    { x: 510, value: "two_add_two", type: "2 + 2 = 4", sort: "Prop" },
  ];
  const levels: [number, string][] = [
    [40, pick(["values (terms)", "值（項）"])],
    [120, pick(["their types", "它們的型別"])],
    [200, pick(["kind of type", "型別的種類"])],
  ];
  return (
    <svg viewBox="0 0 620 250" className="w-full max-w-[620px]" role="img" aria-label={pick(["Values, types and kinds", "值、型別與種類"])}>
      {levels.map(([y, label]) => (
        <text key={label} x={4} y={y - 22} fontSize={11} className="fill-gray-500">
          {label}
        </text>
      ))}
      {rows.map((r) => (
        <g key={r.value} className="font-mono" fontSize={14}>
          {[
            [40, r.value, "fill-white stroke-gray-400"],
            [120, r.type, r.sort === "Prop" ? "fill-amber-50 stroke-amber-500" : "fill-teal-50 stroke-teal-600"],
            [200, r.sort, r.sort === "Prop" ? "fill-amber-100 stroke-amber-600" : "fill-teal-100 stroke-teal-700"],
          ].map(([y, label, cls], i) => (
            <g key={i}>
              <rect x={r.x - 80} y={(y as number) - 20} width={160} height={32} rx={6} className={cls as string} />
              <text x={r.x} y={(y as number) + 1} textAnchor="middle" className="fill-gray-800">
                {label}
              </text>
              {i < 2 && (
                <>
                  <line x1={r.x} y1={(y as number) + 12} x2={r.x} y2={(y as number) + 58} className="stroke-gray-400" strokeWidth={1.5} />
                  <text x={r.x + 8} y={(y as number) + 40} fontSize={13} className="fill-gray-500">
                    :
                  </text>
                </>
              )}
            </g>
          ))}
        </g>
      ))}
      <text x={300} y={245} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick([
          "read “a : B” as “a has type B”; for a statement, “h : P” means “h proves P”",
          "「a : B」讀作「a 的型別是 B」；對陳述而言，「h : P」表示「h 證明了 P」",
        ])}
      </text>
    </svg>
  );
}

/** The same staircase twice: a recursive definition climbs it, and so does a proof by induction. */
function Staircase() {
  const { pick } = useLang();
  const steps = [0, 1, 2, 3, 4];
  const rows: { y: number; title: string; base: string; step: string; cls: string }[] = [
    {
      y: 30,
      title: pick(["definition", "定義"]),
      base: "oddSum 0 = 0",
      step: pick(["oddSum (n+1) from oddSum n", "由 oddSum n 算出 oddSum (n+1)"]),
      cls: "fill-teal-50 stroke-teal-600",
    },
    {
      y: 140,
      title: pick(["proof", "證明"]),
      base: pick(["case zero: rfl", "zero 情形：rfl"]),
      step: pick(["case succ: use ih for k", "succ 情形：用 k 的 ih"]),
      cls: "fill-amber-50 stroke-amber-500",
    },
  ];
  return (
    <svg viewBox="0 0 620 230" className="w-full max-w-[620px]" role="img" aria-label={pick(["Recursion and induction", "遞迴與歸納法"])}>
      <defs>
        <marker id="maths-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="fill-gray-500" />
        </marker>
      </defs>
      {rows.map((r) => (
        <g key={r.title}>
          <text x={4} y={r.y + 26} fontSize={12} className="fill-gray-600 font-semibold">
            {r.title}
          </text>
          {steps.map((n, i) => (
            <g key={n}>
              <rect x={90 + i * 100} y={r.y} width={56} height={40} rx={6} className={r.cls} />
              <text x={118 + i * 100} y={r.y + 25} textAnchor="middle" fontSize={14} className="fill-gray-800 font-mono">
                {n === 4 ? "…" : n}
              </text>
              {i < steps.length - 1 && (
                <path
                  d={`M${148 + i * 100},${r.y + 20} L${188 + i * 100},${r.y + 20}`}
                  className="stroke-gray-500"
                  strokeWidth={1.5}
                  markerEnd="url(#maths-arrow)"
                />
              )}
            </g>
          ))}
          <text x={118} y={r.y + 60} textAnchor="middle" fontSize={11} className="fill-gray-600 font-mono">
            {r.base}
          </text>
          <text x={368} y={r.y + 60} textAnchor="middle" fontSize={11} className="fill-gray-600">
            {pick(["each arrow: ", "每個箭頭："])}
            {r.step}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function LeanMathsConcept({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["Lean maths", "Lean 數學"]}
      intro={[
        "The handful of ideas you need to *read* Lean: what a type is, why a proof is a value, what each logic symbol asks of you, and the few places where Lean's numbers do not behave like school numbers. No mathematics beyond school is assumed; every example on this page is checked by Lean.",
        "讀懂 Lean 需要的幾個觀念：型別是什麼、為什麼證明也是一個值、每個邏輯符號要你做什麼，以及 Lean 的數字和學校教的數字不一樣的幾個地方。不需要超過中學程度的數學；本頁每個例子都經過 Lean 檢查。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="types" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "In Lean every expression has a **type**, written after a colon: `2 : Nat` reads “2 is a natural number”. A type is like a label saying what kind of thing something is, and Lean refuses to mix kinds by accident. `Nat` is the counting numbers $0, 1, 2, \\dots$; `Int` adds the negatives; `String` is text. The same symbol `2` can be a `Nat` or an `Int`; you pick with `(2 : Int)`.",
            "在 Lean 裡，每個運算式都有一個**型別**，寫在冒號後面：`2 : Nat` 讀作「2 是一個自然數」。型別就像一張標籤，說明某個東西是哪一類，而 Lean 不會讓你不小心把不同類混在一起。`Nat` 是用來數數的 $0, 1, 2, \\dots$；`Int` 再加上負數；`String` 是文字。同一個符號 `2` 可以是 `Nat` 也可以是 `Int`，用 `(2 : Int)` 指定。",
          ]}
        />
        <P
          t={[
            "Two commands let you ask Lean questions: `#check e` shows the type of `e`, and `#eval e` computes its value. The comments after `--` show what Lean answers.",
            "有兩個指令可以向 Lean 發問：`#check e` 顯示 `e` 的型別，`#eval e` 算出它的值。`--` 後面的註解就是 Lean 的回答。",
          ]}
        />
        <Lean code={snippet("LeanMaths", "types")} />
        <P
          t={[
            "A **function** has an arrow type. `Nat → Nat` means “give me a natural number and I give you back a natural number”. A function of two inputs is written `Nat → Nat → Nat`, and you apply it by writing the inputs after it with spaces, no parentheses: `add 2 3`, not `add(2, 3)`.",
            "**函數**的型別帶有箭頭。`Nat → Nat` 的意思是「給我一個自然數，我還你一個自然數」。兩個輸入的函數寫成 `Nat → Nat → Nat`，使用時把輸入用空格接在後面，不加括號：寫 `add 2 3`，不是 `add(2, 3)`。",
          ]}
        />
        <Lean code={snippet("LeanMaths", "functions")} />
        <Lean
          code={"#check (-3 : Nat)   -- there are no negative natural numbers"}
          fails
          note={[
            "Lean answers “failed to synthesize `Neg Nat`”: it knows no way to negate a `Nat`.",
            "Lean 回答「failed to synthesize `Neg Nat`」：它不知道怎麼對 `Nat` 取負號。",
          ]}
        />
        <TryIn ids={["hello"]} />
        <Sources items={[TPIL, FPIL]} />
      </Section>

      <Section page={PAGE} id="props" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Here is the idea that makes Lean work. A statement such as `2 + 2 = 4` is itself a type, of the kind `Prop` (proposition). A **proof** of the statement is a value of that type. So `h : 2 + 2 = 4` reads “`h` is a proof that 2 + 2 = 4”, exactly as `n : Nat` reads “`n` is a natural number”. Checking a proof is then the same job as checking a type, which a small program (the kernel) can do mechanically.",
            "讓 Lean 能運作的關鍵想法是：像 `2 + 2 = 4` 這樣的陳述，本身就是一個型別，屬於 `Prop`（命題）這一類。這個陳述的**證明**，就是這個型別的一個值。所以 `h : 2 + 2 = 4` 讀作「`h` 是 2 + 2 = 4 的證明」，就像 `n : Nat` 讀作「`n` 是一個自然數」一樣。於是檢查證明就變成檢查型別，而這件事一個小程式（核心（kernel））就能機械地做完。",
          ]}
        />
        <Figure
          caption={[
            "Every value has a type, and every type has a kind: data types live in `Type`, statements live in `Prop`.",
            "每個值都有型別，每個型別也有自己的種類：資料型別屬於 `Type`，陳述屬於 `Prop`。",
          ]}
        >
          <TypeLadder />
        </Figure>
        <P
          t={[
            "A false statement like `2 + 2 = 5` is still a perfectly good type; it simply has no values, so nobody can ever write a proof of it. `rfl` (“reflexivity”: both sides are the same once computed) is a proof of `2 + 2 = 4`.",
            "像 `2 + 2 = 5` 這種錯誤的陳述，依然是一個合格的型別，只是它沒有任何值，所以誰也寫不出它的證明。`rfl`（「自反性」：兩邊算完之後一模一樣）就是 `2 + 2 = 4` 的一個證明。",
          ]}
        />
        <Lean code={snippet("LeanMaths", "props")} />
        <P
          t={[
            "`def` and `theorem` are the same mechanism: both give a name to a value of some type. The difference is what you care about. With `def` you care *which* value it is (`five` computes to 5). With `theorem` you only care *that* a value exists, so Lean never looks inside it again.",
            "`def` 和 `theorem` 是同一套機制：兩者都替某個型別的值取一個名字。差別在於你在乎什麼。用 `def` 時，你在乎它*是哪一個*值（`five` 算出來是 5）。用 `theorem` 時，你只在乎這樣的值*存在*，所以 Lean 之後不會再看它的內容。",
          ]}
        />
        <Lean code={snippet("LeanMaths", "def-vs-theorem")} />
        <Lean
          code={"theorem wrong : 2 + 2 = 5 := rfl"}
          fails
          note={["`rfl` cannot prove it: the two sides compute to 4 and 5.", "`rfl` 證不出來：兩邊算出來分別是 4 和 5。"]}
        />
        <Callout kind="note" title={["The name for this idea", "這個想法的名字"]}>
          <P
            t={[
              "Reading statements as types and proofs as values is called the **Curry–Howard correspondence**, after the logicians Haskell Curry and William Howard. You do not need the name to use Lean, but it is what to search for if you want the full story.",
              "把陳述當成型別、把證明當成值，這個對應叫做 **Curry–Howard 對應**，以邏輯學家 Haskell Curry 和 William Howard 命名。使用 Lean 不需要知道這個名字，但想深入了解時，可以用它來搜尋。",
            ]}
          />
        </Callout>
        <P t={["How the kernel checks these values is the subject of another page: ", "核心如何檢查這些值，另一頁會詳細說明："]} />
        <SiteLink to={["concept", "kernel"]} label={["How Lean checks", "Lean 如何檢查"]} />
        <Sources
          items={[
            TPIL,
            { label: "Wikipedia: Curry–Howard correspondence", url: "https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="logic" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "Each logic symbol is a kind of statement, and each comes with two recipes: how to **prove** it when it is your goal, and how to **use** it when it is a hypothesis you already have. This table is worth keeping open while you work; `P` and `Q` stand for any statements, `h` for a hypothesis.",
            "每個邏輯符號都是一種陳述，各自附帶兩套做法：當它是你的目標時，怎麼**證明**它；當它是你手上已有的前提時，怎麼**使用**它。做題時值得把這張表放在旁邊；`P`、`Q` 代表任意陳述，`h` 代表一個前提。",
          ]}
        />
        <Table
          head={[
            ["Symbol, read as", "符號與讀法"],
            ["To prove it (goal)", "要證明它（目標）"],
            ["To use it (hypothesis `h`)", "要使用它（前提 `h`）"],
          ]}
          rows={[
            [
              ["`P → Q` if P then Q", "`P → Q` 若 P 則 Q"],
              ["`intro hp`, then prove `Q`", "`intro hp`，然後證明 `Q`"],
              ["`h hp` gives `Q`; or `apply h` to turn goal `Q` into `P`", "`h hp` 得到 `Q`；或用 `apply h` 把目標 `Q` 換成 `P`"],
            ],
            [
              ["`∀ x, P x` for every x", "`∀ x, P x` 對所有 x"],
              ["`intro x`, then prove `P x`", "`intro x`，然後證明 `P x`"],
              ["`h 5` gives `P 5`: plug in a value", "`h 5` 得到 `P 5`：代入一個值"],
            ],
            [
              ["`∃ x, P x` there is some x", "`∃ x, P x` 存在某個 x"],
              [
                "`⟨w, proof⟩` or `exact ⟨w, proof⟩`: name a witness `w` and prove `P w`",
                "`⟨w, proof⟩` 或 `exact ⟨w, proof⟩`：指出一個見證 `w`，並證明 `P w`",
              ],
              ["`obtain ⟨w, hw⟩ := h`", "`obtain ⟨w, hw⟩ := h`"],
            ],
            [
              ["`P ∧ Q` P and Q", "`P ∧ Q` P 且 Q"],
              ["`constructor` (two goals), or `⟨hp, hq⟩`", "`constructor`（變成兩個目標），或 `⟨hp, hq⟩`"],
              ["`h.1`, `h.2`, or `obtain ⟨hp, hq⟩ := h`", "`h.1`、`h.2`，或 `obtain ⟨hp, hq⟩ := h`"],
            ],
            [
              ["`P ∨ Q` P or Q", "`P ∨ Q` P 或 Q"],
              ["`Or.inl hp` / `Or.inr hq` (tactics `left` / `right`)", "`Or.inl hp` / `Or.inr hq`（戰術 `left` / `right`）"],
              ["`cases h` or `rcases h with hp | hq`: one case for each side", "`cases h` 或 `rcases h with hp | hq`：兩邊各一種情形"],
            ],
            [
              ["`¬ P` not P (means `P → False`)", "`¬ P` 非 P（意思是 `P → False`）"],
              ["`intro hp`, then reach `False`", "`intro hp`，然後推出 `False`"],
              ["`h hp` gives `False`; `absurd hp h` proves anything", "`h hp` 得到 `False`；`absurd hp h` 可證明任何目標"],
            ],
            [
              ["`P ↔ Q` P if and only if Q", "`P ↔ Q` P 若且唯若 Q"],
              ["`constructor`: prove both directions", "`constructor`：兩個方向都要證"],
              ["`h.1`, `h.2`, or `rw [h]` to swap P for Q", "`h.1`、`h.2`，或用 `rw [h]` 把 P 換成 Q"],
            ],
            [
              ["`a = b` equals", "`a = b` 相等"],
              ["`rfl`, `decide`, `simp`, `omega`", "`rfl`、`decide`、`simp`、`omega`"],
              ["`rw [h]` replaces `a` by `b`", "`rw [h]` 把 `a` 換成 `b`"],
            ],
            [
              ["`a ≠ b` not equal (means `a = b → False`)", "`a ≠ b` 不相等（意思是 `a = b → False`）"],
              ["`decide` for concrete numbers; else `intro h` and reach `False`", "具體數字用 `decide`；否則 `intro h` 再推出 `False`"],
              ["`h hab` gives `False` from a proof `hab : a = b`", "給一個證明 `hab : a = b`，`h hab` 得到 `False`"],
            ],
            [
              ["`a < b` less than", "`a < b` 小於"],
              ["`decide` for concrete numbers, `omega` for whole-number arithmetic", "具體數字用 `decide`，整數算術用 `omega`"],
              ["`omega` uses it; on `Nat`, `a < b` means `a + 1 ≤ b`", "`omega` 會使用它；在 `Nat` 上，`a < b` 的意思是 `a + 1 ≤ b`"],
            ],
          ]}
        />
        <P t={["The same recipes, as code that Lean accepts:", "同樣的做法，寫成 Lean 接受的程式碼："]} />
        <Lean code={snippet("LeanMaths", "logic-1")} />
        <Lean code={snippet("LeanMaths", "logic-2")} />
        <Callout kind="tip" title={["Look at the goal first", "先看目標"]}>
          <P
            t={[
              "When stuck, read the outermost symbol of the goal and look up its “to prove” recipe. Then read each hypothesis and look up its “to use” recipe. A surprising number of proofs are nothing more than that.",
              "卡住的時候，先看目標最外層的符號，查它「要證明它」的做法；再看每個前提，查它「要使用它」的做法。很多證明其實就只是這樣而已。",
            ]}
          />
        </Callout>
        <TryIn ids={["even-sum", "cases-or", "squeeze"]} />
        <P t={["All the tactics named here, with more examples: ", "這裡提到的所有戰術與更多例子："]} />
        <SiteLink to={["skills", "tactics"]} label={["First tactics", "第一批戰術"]} />
        <Sources items={[TPIL, MIL]} />
      </Section>

      <Section page={PAGE} id="recursion" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "Lean builds the natural numbers from two pieces: `0`, and “one more than `n`”, written `n + 1`. A function on `Nat` is usually defined the same way, by saying what it does at `0` and how to get the answer at `n + 1` from the answer at `n`. This is **recursion**. Below, `oddSum n` adds up the first `n` odd numbers: $1 + 3 + \\dots + (2n-1)$.",
            "Lean 用兩塊積木造出自然數：`0`，以及「比 `n` 多一」，寫成 `n + 1`。`Nat` 上的函數通常也照這個方式定義：說清楚它在 `0` 時是多少，以及怎麼從 `n` 的答案得到 `n + 1` 的答案。這就是**遞迴**。下面的 `oddSum n` 把前 `n` 個奇數加起來：$1 + 3 + \\dots + (2n-1)$。",
          ]}
        />
        <P
          t={[
            "A proof about such a function follows the same shape: **induction** proves the claim at `0` (case `zero`), then shows that if it holds at `k` (the induction hypothesis `ih`) it holds at `k + 1` (case `succ`). Each case of the proof lines up with one line of the definition, which is why `rw [oddSum]` can unfold exactly one step.",
            "關於這種函數的證明也是同一個形狀：**歸納法**先證明 `0` 的情形（`zero` 情形），再證明「若在 `k` 成立（歸納假設 `ih`），則在 `k + 1` 也成立」（`succ` 情形）。證明的每個情形都對應到定義的一行，所以 `rw [oddSum]` 剛好可以展開一步。",
          ]}
        />
        <Figure
          caption={[
            "The definition climbs from `0` one step at a time; the induction proof climbs the very same staircase.",
            "定義從 `0` 開始一次爬一階；歸納法的證明爬的是同一座樓梯。",
          ]}
        >
          <Staircase />
        </Figure>
        <Lean code={snippet("LeanMaths", "recursion")} />
        <P
          t={[
            "Lists work the same way: a list is either empty `[]` or an element in front of a shorter list `x :: xs`, so list functions recurse on that shape and list proofs use induction on it.",
            "串列（list）也是一樣：串列要嘛是空的 `[]`，要嘛是一個元素接在一個較短的串列前面 `x :: xs`，所以串列的函數依這個形狀遞迴，串列的證明也依它做歸納。",
          ]}
        />
        <TryIn ids={["induction-double", "reverse-twice", "gauss"]} />
        <Sources
          items={[TPIL, FPIL, { label: "Wikipedia: Mathematical induction", url: "https://en.wikipedia.org/wiki/Mathematical_induction" }]}
        />
      </Section>

      <Section page={PAGE} id="nat" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "`Nat` has no negative numbers, yet `3 - 5` must still be *some* natural number, because every function must return a value of its type. Lean's answer is `0`: subtraction on `Nat` stops at zero (sometimes called truncated subtraction). Division rounds down, and dividing by zero gives `0` rather than an error.",
            "`Nat` 裡沒有負數，但 `3 - 5` 還是得是*某個*自然數，因為每個函數都必須回傳它型別裡的一個值。Lean 的答案是 `0`：`Nat` 的減法到零就停（有時稱為截斷減法）。除法會無條件捨去，而除以零得到 `0`，不會出錯。",
          ]}
        />
        <Lean code={snippet("LeanMaths", "nat-surprises")} />
        <Callout kind="warn" title={["A classic trap", "經典陷阱"]}>
          <P
            t={[
              "School rules like $(a - b) + b = a$ are **false** on `Nat` when $b > a$. If a statement involves subtraction or division, ask whether it should really be about `Int` (or, with Mathlib, `ℝ`), or add a hypothesis such as `b ≤ a`. `omega` knows these rules and is the quickest way to settle such goals.",
              "像 $(a - b) + b = a$ 這種學校規則，在 `Nat` 上當 $b > a$ 時是**錯的**。如果陳述裡有減法或除法，先想想它是不是應該用 `Int`（或在 Mathlib 中用 `ℝ`），或者加上 `b ≤ a` 這類前提。`omega` 懂這些規則，是解決這類目標最快的方法。",
            ]}
          />
        </Callout>
        <P
          t={[
            "Why Lean chooses this, and what else a correct-looking statement can hide: ",
            "Lean 為什麼這樣設計，以及一個看起來正確的陳述還可能藏著什麼：",
          ]}
        />
        <SiteLink to={["concept", "limits"]} label={["Limits of proofs", "證明的限度"]} />
        <TryIn ids={["squeeze"]} />
        <Sources items={[TPIL]} />
      </Section>

      <Section page={PAGE} id="styles" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "Since a proof is a value, you can simply write the value down: that is a **term proof**. Or you can write `by` followed by **tactics**, step-by-step instructions that Lean follows to build the value for you, showing you the remaining goal after each step. Both end up as the same kind of object, and the kernel checks both the same way.",
            "既然證明是一個值，你可以直接把這個值寫出來：這叫**項證明**。或者你可以寫 `by`，後面接上**戰術**：一步一步的指示，Lean 照著做，替你把值造出來，並在每一步之後顯示剩下的目標。兩者最後得到的是同一種東西，核心也用同樣的方式檢查它們。",
          ]}
        />
        <Lean code={snippet("LeanMaths", "term-vs-tactic")} />
        <List
          items={[
            [
              "**Term proofs** are short and good for small facts: `⟨h.2, h.1⟩` says “the pair of the second part and the first part”.",
              "**項證明**簡短，適合小事實：`⟨h.2, h.1⟩` 的意思是「由第二部分和第一部分組成的一對」。",
            ],
            [
              "**Tactic proofs** are easier to write and read for anything longer, because Lean shows the goal and the hypotheses (已知) after every line.",
              "**戰術證明**對較長的證明來說更好寫也更好讀，因為 Lean 在每一行之後都會顯示目標和前提（已知）。",
            ],
            [
              "You can mix them: `exact ⟨n, by omega⟩` is a term containing a small tactic proof, as in the ∃ example above.",
              "兩者可以混用：`exact ⟨n, by omega⟩` 是一個項，裡面包著一小段戰術證明，就像上面 ∃ 的例子。",
            ],
          ]}
        />
        <TryIn ids={["add-comm", "rewrite-chain", "calc-chain"]} />
        <Sources items={[TPIL]} />
      </Section>

      <Section page={PAGE} id="paper" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "Take the statement “the square of an even number is even”. On paper you would write a short argument; in Lean every phrase of it becomes a piece of syntax. Here “even” is spelled out as “equals `2 * k` for some `k`”.",
            "以「偶數的平方是偶數」這個陳述為例。在紙上你會寫一段簡短的論證；在 Lean 裡，論證的每一句話都對應到一段語法。這裡把「偶數」直接寫成「對某個 `k` 等於 `2 * k`」。",
          ]}
        />
        <Table
          head={[
            ["On paper", "紙上"],
            ["In Lean", "Lean 裡"],
          ]}
          rows={[
            [
              ["Let $n$ be a natural number.", "設 $n$ 為自然數。"],
              ["`(n : Nat)`", "`(n : Nat)`"],
            ],
            [
              ["Suppose $n$ is even, i.e. $n = 2k$ for some $k$.", "假設 $n$ 是偶數，也就是對某個 $k$ 有 $n = 2k$。"],
              ["`(h : ∃ k, n = 2 * k)`", "`(h : ∃ k, n = 2 * k)`"],
            ],
            [
              ["Then $n^2$ is even.", "則 $n^2$ 是偶數。"],
              ["`: ∃ m, n * n = 2 * m`", "`: ∃ m, n * n = 2 * m`"],
            ],
            [
              ["Proof. Write $n = 2k$.", "證明：寫成 $n = 2k$。"],
              ["`obtain ⟨k, hk⟩ := h`", "`obtain ⟨k, hk⟩ := h`"],
            ],
            [
              ["Take $m = kn$: indeed $n \\cdot n = 2k \\cdot n = 2(kn)$.", "取 $m = kn$：確實 $n \\cdot n = 2k \\cdot n = 2(kn)$。"],
              ["`exact ⟨k * n, by rw [hk, Nat.mul_assoc]⟩`", "`exact ⟨k * n, by rw [hk, Nat.mul_assoc]⟩`"],
            ],
          ]}
        />
        <Lean code={snippet("LeanMaths", "even-square")} />
        <P
          t={[
            "Notice what the paper version leaves implicit and Lean makes you say: the type of $n$, the fact that “even” is an ∃, and the exact witness $m$. Writing those down is most of the work of formalising.",
            "注意紙上的版本省略了哪些東西，而 Lean 要你明確寫出來：$n$ 的型別、「偶數」其實是一個 ∃，以及確切的見證 $m$。把這些寫清楚，就是形式化的主要工作。",
          ]}
        />
        <TryIn ids={["even-sum"]} />
        <P t={["The full method for turning a statement into a proof: ", "把陳述變成證明的完整方法："]} />
        <SiteLink to={["concept", "method"]} label={["From statement to proof", "從陳述到證明"]} />
        <Sources items={[MIL]} />
      </Section>

      <Section page={PAGE} id="mathlib" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            "Core Lean knows `Nat`, `Int`, lists and logic. **Mathlib** is the community's mathematics library built on top of it: the real numbers `ℝ`, matrices, primes, calculus, algebra and much more, with a very large number of theorems you can cite by name. It is big, so it only runs on the **Full** runner; everything else on this page runs on the Lite runner.",
            "核心 Lean 認得 `Nat`、`Int`、串列和邏輯。**Mathlib** 是社群在它之上建立的數學函式庫：實數 `ℝ`、矩陣、質數、微積分、代數等等，還有大量可以直接用名字引用的定理。它很龐大，所以只能在 **Full** 執行器上跑；本頁其他程式碼都在 Lite 執行器上跑。",
          ]}
        />
        <Lean
          runner="mathlib"
          code={`import Mathlib

-- ℝ, the real numbers; ring does school algebra
example (x : ℝ) : (x + 1) ^ 2 = x ^ 2 + 2 * x + 1 := by ring

-- primes: norm_num checks a concrete one
example : Nat.Prime 7 := by norm_num

-- the type of 2 × 2 real matrices
#check Matrix (Fin 2) (Fin 2) ℝ`}
        />
        <P
          t={[
            "Mathlib already defines `Even n` as “$n = r + r$ for some $r$”, so the statement from the previous section can be written with it directly:",
            "Mathlib 已經把 `Even n` 定義為「對某個 $r$ 有 $n = r + r$」，所以上一節的陳述可以直接這樣寫：",
          ]}
        />
        <Lean
          runner="mathlib"
          code={`import Mathlib

example (n : ℕ) (h : Even n) : Even (n * n) := by
  obtain ⟨k, rfl⟩ := h
  exact ⟨k * (k + k), by ring⟩`}
        />
        <Callout kind="tip" title={["Finding the right name", "找到正確的名字"]}>
          <P
            t={[
              "Mathlib names follow patterns (`Nat.Prime`, `Even`, `mul_comm`), and tactics such as `exact?` search it for you. ",
              "Mathlib 的命名有規律（`Nat.Prime`、`Even`、`mul_comm`），而 `exact?` 這類戰術可以替你搜尋。",
            ]}
          />
          <SiteLink to={["skills", "search"]} label={["Finding lemmas", "尋找引理"]} />
        </Callout>
        <TryIn ids={["search", "regroup"]} />
        <Sources
          items={[
            MIL,
            { label: "Mathlib documentation", url: "https://leanprover-community.github.io/mathlib4_docs/" },
            { label: "Mathlib overview", url: "https://leanprover-community.github.io/mathlib-overview.html" },
          ]}
        />
      </Section>
    </Page>
  );
}
