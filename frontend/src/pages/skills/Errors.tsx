/** Coding Skills ▸ Reading goals and errors (#/skills/errors[/<section>]). Lean code: lean/Formalizer/Pages/Errors.lean. */
import { RichText, useLang } from "@learnkit/web";
import { Callout, Lean, List, P, Page, Section, SiteLink, snippet, Sources, Table, TryIn, type L } from "../kit";

const PAGE = "errors";

const SECTIONS: { id: string; title: L }[] = [
  { id: "goal", title: ["Reading a goal", "讀懂一個目標"] },
  { id: "cases", title: ["Case names and several goals", "情形名稱與多個目標"] },
  { id: "page", title: ["What the problem page shows", "題目頁面顯示什麼"] },
  { id: "anatomy", title: ["How to read any error", "怎麼讀任何一個錯誤"] },
  { id: "unsolved", title: ["`unsolved goals` and `No goals to be solved`", "`unsolved goals` 與 `No goals to be solved`"] },
  { id: "mismatch", title: ["`Type mismatch`", "`Type mismatch`"] },
  { id: "unknown", title: ["`Unknown identifier` and `Unknown constant`", "`Unknown identifier` 與 `Unknown constant`"] },
  { id: "synth", title: ["`failed to synthesize`", "`failed to synthesize`"] },
  { id: "omega", title: ["`omega could not prove the goal`", "`omega could not prove the goal`"] },
  { id: "decide", title: ["`decide` and free variables", "`decide` 與自由變數"] },
  { id: "rewrite", title: ["`rewrite` failed: pattern not found", "`rewrite` 失敗：找不到樣式"] },
  { id: "sorry", title: ["declaration uses `sorry`", "declaration uses `sorry`"] },
  { id: "formalizer", title: ["Formalizer's own messages", "Formalizer 自己的訊息"] },
  { id: "cheatsheet", title: ["Cheat sheet", "速查表"] },
];

/** A goal as the Goals panel draws it: hypotheses (new ones green), a line, then ⊢ the target. */
function Goal({
  line,
  kase,
  hyps,
  fresh = [],
  target,
}: {
  line?: number;
  kase?: string;
  hyps: string[];
  fresh?: string[];
  target: string;
}) {
  const { pick } = useLang();
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {(line !== undefined || kase) && (
        <p className="border-b border-gray-100 bg-gray-50 px-3 py-1 text-[11px] text-gray-500">
          {line !== undefined && pick([`Goal at the sorry on line ${line}`, `第 ${line} 行 sorry 處的目標`])}
          {kase && <span className="ml-2 rounded bg-gray-200 px-1.5 font-mono text-gray-700">case {kase}</span>}
        </p>
      )}
      <div className="px-3 py-2 font-mono text-xs leading-relaxed">
        {hyps.map((h) => (
          <p key={h} className={fresh.includes(h) ? "rounded bg-green-50 text-green-800" : "text-gray-700"}>
            {h}
          </p>
        ))}
        <p className="mt-0.5 border-t border-gray-200 pt-0.5 text-gray-900">⊢ {target}</p>
      </div>
    </div>
  );
}

/** What Lean printed: an error as the Result panel shows it (red), a note under "Lean also says" (blue), or a plain warning. */
function Said({ line, text, kind = "error" }: { line?: number; text: string; kind?: "error" | "note" | "warning" }) {
  const { pick } = useLang();
  const head: L =
    kind === "error"
      ? line
        ? [`Error on line ${line}`, `第 ${line} 行的錯誤`]
        : ["Error", "錯誤"]
      : kind === "note"
        ? [`Lean also says · line ${line}`, `Lean 還說 · 第 ${line} 行`]
        : [`Warning on line ${line}`, `第 ${line} 行的警告`];
  const style = {
    error: ["border-red-200", "text-red-700"],
    note: ["border-sky-200", "text-sky-800"],
    warning: ["border-amber-200", "text-amber-800"],
  }[kind];
  return (
    <div className={`rounded-lg border bg-white px-3 py-2 ${style[0]}`}>
      <p className={`text-xs font-medium ${style[1]}`}>{pick(head)}</p>
      <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-gray-800">{text}</pre>
    </div>
  );
}

/** A short bold label and its explanation, for "what it means" / "the usual fix". */
function Labeled({ label, t }: { label: L; t: L }) {
  const { pick } = useLang();
  return (
    <p>
      <span className="font-semibold text-gray-900">{pick(label)} </span>
      <RichText text={pick(t)} />
    </p>
  );
}
const MEANS: L = ["What it means:", "意思："];
const FIX: L = ["The usual fix:", "常見的修法："];

export default function ErrorsSkill({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["Reading goals and errors", "讀懂目標與錯誤"]}
      intro={[
        "Lean talks to you in two ways: the **goal**, which says what is left to prove, and **messages**, which say what went wrong. Both look cryptic at first, but there are only a handful of shapes. This page shows each one on a tiny example, with the exact text Lean v4.34.1 prints, what it means, and the usual fix.",
        "Lean 用兩種方式跟你說話：**目標**告訴你還剩什麼要證明，**訊息**告訴你哪裡出錯。一開始兩者都像天書，但其實只有少數幾種樣子。這一頁用小例子逐一示範，附上 Lean v4.34.1 實際印出的原文、它的意思，以及常見的修法。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="goal" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            'A goal is a little form with two parts. **Above the line** are the hypotheses: the things you may use, each written `name : what it is`. **Below the line**, after `⊢` (read it as "prove"), is the target: the one thing you must show. Here is the goal of the problem *Chain of equalities* before any step:',
            "目標就像一張分成兩部分的小表格。**線的上方**是前提（面板上寫作「已知」）：你可以使用的東西，每一行寫成 `名字 : 它是什麼`。**線的下方**、`⊢`（讀作「要證明」）之後的是要證的結論：你必須證出的那一件事。以下是〈等式鏈〉這一題在還沒走任何一步時的目標：",
          ]}
        />
        <Goal line={2} hyps={["a b c : Nat", "h₁ : a = b", "h₂ : b = c"]} target="a = c" />
        <List
          items={[
            [
              "`a b c : Nat`: three natural numbers ($0, 1, 2, \\dots$) called `a`, `b` and `c`. Several names of the same type share one line.",
              "`a b c : Nat`：三個自然數（$0, 1, 2, \\dots$），名字是 `a`、`b`、`c`。同型別的多個名字會擠在同一行。",
            ],
            [
              "`h₁ : a = b`: a *fact* you are given, named `h₁`. You refer to it by its name, e.g. `rw [h₁]` or `exact h₁`.",
              "`h₁ : a = b`：一個已知的*事實*，名字叫 `h₁`。用名字來引用它，例如 `rw [h₁]` 或 `exact h₁`。",
            ],
            [
              "`⊢ a = c`: what is still to prove. Every tactic changes this form: it rewrites the target, adds a hypothesis, or closes the goal.",
              "`⊢ a = c`：還要證明的東西。每個戰術都會改變這張表：改寫結論、加入一個前提，或結束這個目標。",
            ],
          ]}
        />
        <P
          t={[
            "After `rw [h₁]` the target becomes `b = c`; the hypotheses stay. Reading the goal after each step is the single most useful habit in Lean: it tells you exactly where you are.",
            "做完 `rw [h₁]` 之後，結論變成 `b = c`，前提則保持不變。每走一步就讀一次目標，是寫 Lean 最有用的習慣：它會精確告訴你現在在哪裡。",
          ]}
        />
        <Goal hyps={["a b c : Nat", "h₁ : a = b", "h₂ : b = c"]} target="b = c" />
        <TryIn ids={["hello", "rewrite-chain"]} />
      </Section>

      <Section page={PAGE} id="cases" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Some tactics split the work into several goals, each with a **case name** on its first line. `induction n` gives two: `case zero` (prove it for $0$) and `case succ` (prove it for $k + 1$, knowing it for $k$).",
            "有些戰術會把工作拆成好幾個目標，每個目標的第一行有一個**情形名稱**（case）。`induction n` 會拆成兩個：`case zero`（對 $0$ 證明）與 `case succ`（已知對 $k$ 成立，證明對 $k + 1$ 也成立）。",
          ]}
        />
        <Lean code={snippet("Errors", "two-cases")} note={["each `sorry` holds one goal", "每個 `sorry` 各留著一個目標"]} />
        <Goal line={7} kase="zero" hyps={[]} target="double 0 = 2 * 0" />
        <Goal line={8} kase="succ" hyps={["k : Nat", "ih : double k = 2 * k"]} target="double (k + 1) = 2 * (k + 1)" />
        <P
          t={[
            "In `case succ`, `ih` is the **induction hypothesis**: the statement for `k`, which you may use to prove it for `k + 1`. In `case zero` there is nothing above the line: nothing is needed.",
            "在 `case succ` 裡，`ih` 是**歸納假設**：對 `k` 成立的那個陳述，你可以拿它來證明對 `k + 1` 也成立。`case zero` 的線上方什麼都沒有：不需要任何前提。",
          ]}
        />
        <P
          t={[
            "Other splitters: `constructor` on `p ∧ q` gives `case left` (prove `p`) and `case right` (prove `q`); `cases h` on `h : p ∨ q` gives `case inl` and `case inr`. With several goals, the next tactic works on the **first** one only. Write each part under a `·` (a bullet) so you can see which goal it belongs to.",
            "其他會拆目標的戰術：對 `p ∧ q` 用 `constructor` 會得到 `case left`（證 `p`）與 `case right`（證 `q`）；對 `h : p ∨ q` 用 `cases h` 會得到 `case inl` 與 `case inr`。有多個目標時，下一個戰術只作用在**第一個**目標上。把每一部分寫在一個 `·`（項目符號）底下，就看得出它屬於哪個目標。",
          ]}
        />
        <TryIn ids={["induction-double", "cases-or", "gauss"]} />
      </Section>

      <Section page={PAGE} id="page" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "When you press **Run** on a problem, the file goes to the Lean runner on your computer and two panels fill in.",
            "在題目頁按下**執行**，檔案會送到你電腦上的 Lean 執行器，然後兩個面板會填上內容。",
          ]}
        />
        <P
          t={[
            "**Goals** shows one card for each `sorry` still in the file: the goal Lean wants at that spot, with its line number and case name. If the card has more goals waiting behind it, it says *and n more goal(s)*. Hypotheses that were **not there on the previous run** are highlighted in green, so you see what your last step added. In *Even plus even*, after `obtain ⟨m, hm⟩ := ha` the old `ha` is gone and two new hypotheses appear:",
            "**目標**面板為檔案中每個還在的 `sorry` 顯示一張卡片：Lean 在那個位置要你證明的目標，附上行號與情形名稱。如果後面還有其他目標在排隊，卡片會寫「還有 n 個目標」。**上一次執行時沒有**的前提會以綠色標示，讓你一眼看出上一步加了什麼。在〈偶數加偶數〉中，做完 `obtain ⟨m, hm⟩ := ha` 之後，原來的 `ha` 不見了，多出兩個新前提：",
          ]}
        />
        <Goal
          line={3}
          hyps={["a b : Nat", "hb : ∃ k, b = 2 * k", "m : Nat", "hm : a = 2 * m"]}
          fresh={["m : Nat", "hm : a = 2 * m"]}
          target="∃ k, a + b = 2 * k"
        />
        <P t={["**Result** starts with a verdict:", "**結果**面板最上面是判定："]} />
        <Table
          head={[
            ["Verdict", "判定"],
            ["When", "什麼時候"],
          ]}
          rows={[
            [
              ["✓ Proved", "✓ 已證明"],
              [
                "No errors, no `sorry` left, and the theorem uses only the standard axioms (see *Verifying a proof*).",
                "沒有錯誤、沒有剩下的 `sorry`，而且定理只用了標準公理（見〈驗證證明〉）。",
              ],
            ],
            [
              ["Not finished yet", "還沒完成"],
              [
                "Lean accepts the file, but a `sorry` is still there: the work left is in the Goals panel.",
                "Lean 接受這個檔案，但還留著 `sorry`：剩下的工作在目標面板裡。",
              ],
            ],
            [
              ["Lean found a problem", "Lean 發現了問題"],
              ["At least one error; each is shown with its line.", "至少有一個錯誤；每個錯誤都附上行號。"],
            ],
            [
              ["Needs the Full runner", "需要 Full 執行器"],
              [
                "The file imports Mathlib but the Lite runner (core Lean only) is running.",
                "檔案匯入了 Mathlib，但正在跑的是 Lite 執行器（只有核心 Lean）。",
              ],
            ],
          ]}
        />
        <P
          t={[
            "Under the verdict come the errors, then a blue box **Lean also says** with everything that is not an error: the *Try this* suggestion of `exact?` or `simp?` (copy it into your proof), and warnings such as an unused hypothesis. Last, the line **Axioms used** lists, for the checked theorem, the axioms it rests on, or *none*.",
            "判定底下是錯誤，接著是藍色的 **Lean 還說** 方塊，放所有不算錯誤的訊息：`exact?` 或 `simp?` 的 *Try this* 建議（把它抄進你的證明裡），以及像「前提沒用到」這類警告。最後一行 **使用的公理** 列出被檢查的定理所依賴的公理，或寫「無」。",
          ]}
        />
        <Said kind="note" line={2} text={"Try this:\n  [apply] exact Nat.zero_lt_succ n"} />
        <Said
          kind="note"
          line={3}
          text={
            "Variable name `h` is not explicitly referenced.\n\nHint: The binding can be removed (if unused) or named `_` (if used implicitly). Alternatively, prefix the name with `_` to silence this warning:\n  [apply] _h\n\nNote: This linter can be disabled with `set_option linter.unusedVariables false`"
          }
        />
        <P
          t={[
            "A warning does not stop a proof from counting: the verdict can still be *Proved*. Read it anyway; an unused hypothesis often means you proved something easier than you meant to.",
            "警告不會讓證明不算數：判定仍然可以是「已證明」。不過還是讀一下；前提沒用到，常常表示你證出的東西比原本想證的還簡單。",
          ]}
        />
        <TryIn ids={["even-sum", "search"]} />
      </Section>

      <Section page={PAGE} id="anatomy" n={4} title={SECTIONS[3].title}>
        <List
          ordered
          items={[
            [
              "**Find the line.** The page says *Error on line N*. Lean puts some errors where the trouble *starts*, not where you stopped: `unsolved goals` points at the `by` that opened the proof.",
              "**先找行號。** 頁面會寫「第 N 行的錯誤」。有些錯誤 Lean 標在問題*開始*的地方，而不是你停下的地方：`unsolved goals` 會指向開始證明的那個 `by`。",
            ],
            [
              "**Read the first line of the message.** It names the kind of problem: `Type mismatch`, `Unknown identifier`, `unsolved goals` … The sections below cover the common ones.",
              "**讀訊息的第一行。** 它說出問題的種類：`Type mismatch`、`Unknown identifier`、`unsolved goals`……下面各節會介紹常見的幾種。",
            ],
            [
              "**Read the rest as data.** Indented lines are Lean terms (what it found, what it expected); a goal printed at the end is the state at that point, read it like section 1.",
              "**把其餘部分當資料讀。** 縮排的行是 Lean 的項（它找到什麼、它期待什麼）；最後印出的目標是那個位置的狀態，照第 1 節的方式讀。",
            ],
            [
              "**Fix the first error first.** One mistake often causes more errors further down; they may disappear on their own.",
              "**先修第一個錯誤。** 一個錯常常在後面引出更多錯誤；修好第一個，後面的可能就自己消失了。",
            ],
          ]}
        />
        <Callout kind="tip" title={["`Hint:` lines are worth reading", "`Hint:` 開頭的行值得一讀"]}>
          <P
            t={[
              "Recent versions of Lean add a `Hint:` to many messages, sometimes with the exact change to make (after `[apply]`). Messages are in English; you don't need to understand every word, only the shape.",
              "新版的 Lean 會在很多訊息後面加上 `Hint:`，有時還直接給出該做的修改（在 `[apply]` 之後）。訊息是英文的；不必每個字都懂，只要認得它的樣子。",
            ]}
          />
        </Callout>
      </Section>

      <Section page={PAGE} id="unsolved" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "You stopped before the proof was finished. `constructor` split `p ∧ q` into two goals; `exact hp` closed the first; nothing closed the second.",
            "你在證明完成前就停了。`constructor` 把 `p ∧ q` 拆成兩個目標；`exact hp` 結束了第一個；第二個沒有人處理。",
          ]}
        />
        <Lean
          fails
          code={`theorem two_steps (p q : Prop) (hp : p) (hq : q) : p ∧ q := by
  constructor
  exact hp`}
        />
        <Said line={1} text={"unsolved goals\ncase right\np q : Prop\nhp : p\nhq : q\n⊢ q"} />
        <Labeled
          label={MEANS}
          t={[
            "the goals listed are still open when the proof ends. The message prints them in full, so it tells you what to do next: here, prove `q`.",
            "證明結束時，列出的目標還沒解決。訊息會把它們完整印出來，所以它也告訴你下一步：這裡就是要證 `q`。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            "add the missing steps (`exact hq`). While you work, end with `sorry` instead: the page then shows the open goal in the Goals panel and the verdict is *Not finished yet* instead of an error.",
            "補上缺的步驟（`exact hq`）。還在寫的時候，就以 `sorry` 結尾：頁面會在目標面板顯示還沒解決的目標，判定是「還沒完成」而不是錯誤。",
          ]}
        />
        <Lean code={snippet("Errors", "unsolved-fixed")} />
        <P t={["The mirror image: a step **after** the proof is already done.", "反過來的情況：證明**已經**結束了，後面還多寫了一步。"]} />
        <Lean
          fails
          code={`theorem hello : 2 + 2 = 4 := by
  rfl
  rfl`}
        />
        <Said line={3} text="No goals to be solved" />
        <Labeled
          label={FIX}
          t={["delete the extra step: the first `rfl` already finished the proof.", "刪掉多餘的那一步：第一個 `rfl` 就已經完成證明了。"]}
        />
        <TryIn ids={["cases-or", "even-sum"]} />
      </Section>

      <Section page={PAGE} id="mismatch" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "You handed Lean a proof of the wrong statement. `h` proves `a ≤ b`; the goal is `a < b + 1`. A human sees these say the same thing for whole numbers; Lean needs them to be *literally* the same.",
            "你交給 Lean 的證明，證的是另一個陳述。`h` 證明的是 `a ≤ b`，目標卻是 `a < b + 1`。人一看就知道對整數來說兩者是一回事；Lean 卻要求它們*字面上*一樣。",
          ]}
        />
        <Lean
          fails
          code={`theorem wrong_fact (a b : Nat) (h : a ≤ b) : a < b + 1 := by
  exact h`}
        />
        <Said line={2} text={"Type mismatch\n  h\nhas type\n  a ≤ b\nbut is expected to have type\n  a < b + 1"} />
        <Labeled
          label={MEANS}
          t={[
            'read it as "`h` proves `a ≤ b`, but here a proof of `a < b + 1` is needed". In Lean a proof\'s *type* is the statement it proves, hence the word.',
            "讀成「`h` 證明的是 `a ≤ b`，但這裡需要的是 `a < b + 1` 的證明」。在 Lean 裡，證明的*型別*就是它所證的陳述，所以訊息才說 type。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            "compare the two lines and bridge the gap with a library fact that turns one into the other (find it with `exact?`), or let a tactic do it: `omega` proves this goal on its own.",
            "比較這兩行，用一個能把前者變成後者的函式庫事實補上落差（用 `exact?` 找），或交給戰術處理：這個目標 `omega` 自己就能證。",
          ]}
        />
        <Lean code={snippet("Errors", "mismatch-fixed")} />
        <p>
          <SiteLink to={["skills", "search"]} label={["Finding facts in the library", "在函式庫裡找事實"]} />
        </p>
        <TryIn ids={["le-chain", "calc-chain"]} />
      </Section>

      <Section page={PAGE} id="unknown" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "Lean does not know a name you used: a typo, a variable that isn't there, or a lemma that doesn't exist.",
            "Lean 不認得你用的某個名字：打錯字、根本沒有的變數，或不存在的引理。",
          ]}
        />
        <Lean
          fails
          code={`theorem swap (a b : Nat) : a + b = b + a := by
  exact Nat.add_comm a c`}
        />
        <Said line={2} text="Unknown identifier `c`" />
        <Lean
          fails
          code={`theorem swap (a b : Nat) : a + b = b + a := by
  exact Nat.add_comm_swap a b`}
        />
        <Said line={2} text="Unknown constant `Nat.add_comm_swap`" />
        <Labeled
          label={MEANS}
          t={[
            "the name in backticks is not a hypothesis in the goal and not a definition or lemma Lean has loaded. Lean doesn't guess: `Nat.add_comm_swap` sounds plausible, but no such lemma exists.",
            "反引號裡的名字既不是目標裡的前提，也不是 Lean 已載入的定義或引理。Lean 不會用猜的：`Nat.add_comm_swap` 聽起來很合理，但這個引理並不存在。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            "check the spelling against the goal (`c` is not among `a b : Nat`). For lemma names, don't invent them: search with `exact?`, or look the name up in the documentation. Lemmas that need Mathlib are unknown on the Lite runner.",
            "對照目標檢查拼字（`a b : Nat` 裡沒有 `c`）。引理名字不要自己編：用 `exact?` 搜尋，或到文件裡查。需要 Mathlib 的引理在 Lite 執行器上也會是 unknown。",
          ]}
        />
        <Lean code={snippet("Errors", "unknown-fixed")} />
        <TryIn ids={["add-comm", "search"]} />
        <Sources
          items={[
            {
              label: "Lean Language Reference: error explanation lean.unknownIdentifier",
              url: "https://lean-lang.org/doc/reference/latest/Error-Explanations/About___--unknownIdentifier/",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="synth" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            "Lean doesn't know how to do an operation on this type. Below, `Point` is a new kind of object; nobody said what `p + p` means for points.",
            "Lean 不知道怎麼在這個型別上做某個運算。下面的 `Point` 是新定義的東西，沒有人說過兩個點的 `p + p` 是什麼意思。",
          ]}
        />
        <Lean
          fails
          code={`structure Point where
  x : Nat
  y : Nat

example (p : Point) : p + p = p + p := rfl`}
        />
        <Said
          line={5}
          text={
            "failed to synthesize instance of type class\n  HAdd Point Point ?m.3\n\nHint: Type class instance resolution failures can be inspected with the `set_option trace.Meta.synthInstance true` command."
          }
        />
        <Labeled
          label={MEANS}
          t={[
            'symbols like `+`, `<` or `0` work on a type only if someone registered an **instance** saying how. `HAdd Point Point ?m.3` is the instance for "adding a `Point` to a `Point`" (`?m.3` stands for "some result type, not known yet"). Lean searched and found none.',
            "像 `+`、`<`、`0` 這些符號，只有在有人登記了說明做法的**實例**（instance）時，才能用在某個型別上。`HAdd Point Point ?m.3` 就是「把 `Point` 加上 `Point`」的實例（`?m.3` 代表「某個還不知道的結果型別」）。Lean 找過了，沒找到。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            "usually the types are not what you think: check for a missing type annotation, or a number Lean read as `Nat` when you meant something else. If the operation really is missing, define it with an `instance`:",
            "通常是型別跟你以為的不一樣：檢查是否少了型別標註，或某個數被 Lean 讀成 `Nat`，而你想的是別的型別。如果真的缺了這個運算，就用 `instance` 定義它：",
          ]}
        />
        <Lean code={snippet("Errors", "synth-fixed")} />
        <P
          t={[
            "The same message appears with `decide` when a statement is not something Lean can check by computation (next sections).",
            "當陳述不是 Lean 能用計算來檢查的東西時，`decide` 也會給出同樣的訊息（見後面幾節）。",
          ]}
        />
        <Sources
          items={[
            {
              label: "Lean Language Reference: error explanation lean.synthInstanceFailed",
              url: "https://lean-lang.org/doc/reference/latest/Error-Explanations/About___--synthInstanceFailed/",
            },
            { label: "Lean Language Reference: Type Classes", url: "https://lean-lang.org/doc/reference/latest/Type-Classes/" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="omega" n={9} title={SECTIONS[8].title}>
        <P
          t={[
            "`omega` decides facts about whole numbers built with `+`, `-`, comparisons and multiplication by fixed numbers. When it fails, it doesn't just say no: it describes numbers that would break your claim.",
            "`omega` 能判定由 `+`、`-`、比較，以及乘上固定數字所組成的整數事實。失敗時它不只說「不行」：它還會描述會讓你的說法不成立的數。",
          ]}
        />
        <Lean
          fails
          code={`theorem small (n : Nat) (h : n < 5) : n < 3 := by
  omega`}
        />
        <Said
          line={2}
          text={"omega could not prove the goal:\na possible counterexample may satisfy the constraints\n  3 ≤ a ≤ 4\nwhere\n a := ↑n"}
        />
        <Labeled
          label={MEANS}
          t={[
            "read it from the bottom: `a` is `n`; any `n` with $3 \\le n \\le 4$ satisfies `h` but not the target. Indeed $n = 3$: $3 < 5$, but not $3 < 3$. The statement is **false**; no tactic will prove it.",
            "從下往上讀：`a` 就是 `n`；任何滿足 $3 \\le n \\le 4$ 的 `n` 都符合 `h`，卻不符合結論。確實，$n = 3$ 時 $3 < 5$，但 $3 < 3$ 不成立。這個陳述是**錯的**，沒有任何戰術證得出來。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            "plug the counterexample in by hand. If it really breaks the claim, the statement (or an earlier step) is wrong. If it doesn't, `omega` is missing a fact: it sees only hypotheses about numbers, so add the one it needs with `have`.",
            "親手把反例代進去。如果它真的推翻了你的說法，就是陳述（或前面某一步）錯了。如果沒有，就是 `omega` 少了某個事實：它只看得到關於數字的前提，用 `have` 把它需要的那一條加進來。",
          ]}
        />
        <P
          t={[
            'A counterexample can also be fake. `omega` treats `n * n` as an unknown number of its own (it does not multiply variables), so it "finds" $n > n \\cdot n$ possible:',
            "反例也可能是假的。`omega` 把 `n * n` 當成另一個自己不認識的數（它不會把變數相乘），所以它「發現」$n > n \\cdot n$ 是可能的：",
          ]}
        />
        <Lean
          fails
          code={`theorem sq (n : Nat) : n * n ≥ n := by
  omega`}
        />
        <Said
          line={2}
          text={
            "omega could not prove the goal:\na possible counterexample may satisfy the constraints\n  b ≥ 0\n  a ≥ 0\n  a - b ≥ 1\nwhere\n a := ↑n\n b := ↑n * ↑n"
          }
        />
        <P
          t={[
            "The claim is true; `omega` just can't see it. Such goals need another tool: `induction`, a library lemma, or (with Mathlib) `nlinarith`.",
            "這個說法是對的，只是 `omega` 看不出來。這種目標要用別的工具：`induction`、函式庫的引理，或（有 Mathlib 時）`nlinarith`。",
          ]}
        />
        <Lean code={snippet("Errors", "omega-fixed")} note={["the corrected statement", "改正後的陳述"]} />
        <TryIn ids={["squeeze", "calc-chain"]} />
      </Section>

      <Section page={PAGE} id="decide" n={10} title={SECTIONS[9].title}>
        <P
          t={[
            "`decide` proves a statement by *computing* whether it is true. That only works when there is nothing unknown in it.",
            "`decide` 是靠*計算*出陳述的真假來證明它。只有在陳述裡沒有未知數時，這才行得通。",
          ]}
        />
        <Lean
          fails
          code={`theorem small_square (n : Nat) (h : n < 3) : n * n < 9 := by
  decide`}
        />
        <Said
          line={2}
          text={
            "Expected type must not contain free variables\n  n * n < 9\n\nHint: Use the `+revert` option to automatically clean up and revert free variables"
          }
        />
        <Labeled
          label={MEANS}
          t={[
            "a **free variable** is a name like `n` that stands for some number you don't know. Lean can't compute `n * n < 9` without knowing `n`.",
            "**自由變數**是像 `n` 這樣代表某個未知數的名字。不知道 `n` 是多少，Lean 就算不出 `n * n < 9`。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            'state it as "for every `n` below 3": then there are only three cases and Lean checks each. `decide +revert` does that move for you. For statements about *all* numbers, use another tactic (`omega`, `simp`, `induction`).',
            "改寫成「對每一個小於 3 的 `n`」：這樣只有三種情形，Lean 會逐一檢查。`decide +revert` 會替你做這個轉換。如果陳述是關於*所有*數，就改用別的戰術（`omega`、`simp`、`induction`）。",
          ]}
        />
        <Lean code={snippet("Errors", "decide-fixed")} />
        <P
          t={[
            "Without a bound, there are infinitely many cases, so no computation can check them all. The error is then `failed to synthesize` a `Decidable` instance:",
            "沒有上界時，情形有無限多個，任何計算都檢查不完。這時錯誤會是找不到 `Decidable` 實例的 `failed to synthesize`：",
          ]}
        />
        <Lean fails code={`example : ∀ n : Nat, n = n := by decide`} />
        <Said
          line={1}
          text={
            "failed to synthesize\n  Decidable (∀ (n : Nat), n = n)\n\nHint: Additional diagnostic information may be available using the `set_option diagnostics true` command."
          }
        />
        <TryIn ids={["check-cases", "hello"]} />
      </Section>

      <Section page={PAGE} id="rewrite" n={11} title={SECTIONS[10].title}>
        <P
          t={[
            "`rw [h]` with `h : x = y` looks for `x` in the target and replaces it by `y`. If there is no `x` in the target, it fails.",
            "`rw [h]`（其中 `h : x = y`）會在結論裡找 `x`，把它換成 `y`。結論裡如果沒有 `x`，就會失敗。",
          ]}
        />
        <Lean
          fails
          code={`theorem chain (a b c : Nat) (h₁ : a = b) (h₂ : b = c) : a = c := by
  rw [h₂]`}
        />
        <Said
          line={2}
          text={
            "Tactic `rewrite` failed: Did not find an occurrence of the pattern\n  b\nin the target expression\n  a = c\n\na b c : Nat\nh₁ : a = b\nh₂ : b = c\n⊢ a = c"
          }
        />
        <Labeled
          label={MEANS}
          t={[
            "`h₂ : b = c` rewrites `b`, but the target `a = c` has no `b` yet. The goal at the end of the message shows the state at that point.",
            "`h₂ : b = c` 會改寫 `b`，但結論 `a = c` 裡還沒有 `b`。訊息最後印出的目標就是那個位置的狀態。",
          ]}
        />
        <Labeled
          label={FIX}
          t={[
            "rewrite in the right order (`h₁` first turns `a` into `b`), or backwards with `rw [← h]` to replace `y` by `x`. If the target shows the pattern but `rw` still can't find it, the two differ in a hidden way, e.g. `a + b` versus `b + a`, or a different grouping: `a * b * c` is `(a * b) * c`.",
            "照正確的順序改寫（先用 `h₁` 把 `a` 換成 `b`），或用 `rw [← h]` 反方向把 `y` 換成 `x`。如果結論看起來明明有那個樣式、`rw` 卻還是找不到，那就是兩者有看不出的差別，例如 `a + b` 與 `b + a`，或括號分組不同：`a * b * c` 其實是 `(a * b) * c`。",
          ]}
        />
        <Lean code={snippet("Errors", "rw-fixed")} />
        <TryIn ids={["rewrite-chain", "regroup", "length-swap"]} />
      </Section>

      <Section page={PAGE} id="sorry" n={12} title={SECTIONS[11].title}>
        <Lean
          code={`theorem later (n : Nat) : n + 0 = n := by
  sorry`}
          note={["Lean accepts this, with a warning", "Lean 接受這段，但會給警告"]}
        />
        <Said kind="warning" line={1} text="declaration uses `sorry`" />
        <Labeled
          label={MEANS}
          t={[
            '`sorry` is a placeholder: "I\'ll prove this later". Lean accepts the rest of the file, so you can work on one piece at a time, but it marks the theorem as unfinished. It is a warning, not an error.',
            "`sorry` 是個佔位符：「這個晚點再證」。Lean 會接受檔案的其他部分，讓你一次處理一塊，但會把這個定理標成未完成。這是警告，不是錯誤。",
          ]}
        />
        <P
          t={[
            "Formalizer doesn't show this warning in *Lean also says*; it gives the verdict *Not finished yet* and puts each `sorry`'s goal in the Goals panel instead. Every problem starts this way: replacing the `sorry` is the exercise.",
            "Formalizer 不會把這個警告放在「Lean 還說」裡；它改給「還沒完成」的判定，並把每個 `sorry` 的目標放進目標面板。每一題都是這樣開始的：換掉 `sorry` 就是題目本身。",
          ]}
        />
        <Callout kind="warn" title={["A `sorry` can hide", "`sorry` 可能藏起來"]}>
          <P
            t={[
              "If a theorem uses a lemma that has a `sorry`, only the lemma gets the warning. To know whether a theorem is *really* finished, ask `#print axioms`: it reports `sorryAx`.",
              "如果一個定理用到了含 `sorry` 的引理，只有那個引理會被警告。想知道一個定理是否*真的*完成，就問 `#print axioms`：它會回報 `sorryAx`。",
            ]}
          />
          <p>
            <SiteLink
              to={["skills", "verify", "sorry"]}
              label={["Verifying a proof: finding a hidden sorry", "驗證證明：找出藏起來的 sorry"]}
            />
          </p>
        </Callout>
        <TryIn ids={["hello"]} />
      </Section>

      <Section page={PAGE} id="formalizer" n={13} title={SECTIONS[12].title}>
        <P
          t={[
            "A few messages come from Formalizer, not from Lean. They appear under *Error* without a line number.",
            "有幾則訊息來自 Formalizer，而不是 Lean。它們出現在「錯誤」底下，沒有行號。",
          ]}
        />
        <Said text="the problem's statement was changed: keep it exactly as given and only replace `sorry`" />
        <P
          t={[
            "Each problem's statement is its test: Formalizer checks that it appears in your file **exactly** as given (extra spaces and line breaks don't matter) before asking Lean anything. Renaming the theorem, editing a hypothesis or \"simplifying\" the claim all count as changes. Press **Reset** to get the original back, then write only where `sorry` was.",
            "每一題的陳述就是它的測試：在問 Lean 之前，Formalizer 會先確認陳述**一字不差**地出現在你的檔案裡（多出的空白和換行不算）。改定理名字、改前提，或把結論「簡化」，都算是改動。按**重設**取回原本的內容，然後只在 `sorry` 的位置寫東西。",
          ]}
        />
        <Said text="this runner (lite) can't import Mathlib: start the Full runner" />
        <P
          t={[
            "The file has `import Mathlib`, but the Lite runner has only core Lean. Start the Full runner from the runner button at the top right.",
            "檔案裡有 `import Mathlib`，但 Lite 執行器只有核心 Lean。請從右上角的執行器按鈕啟動 Full 執行器。",
          ]}
        />
        <Said text="uses non-standard axioms: …" />
        <P
          t={[
            "The proof compiles but rests on an assumption beyond Lean's three standard axioms, so it doesn't count.",
            "證明能編譯，但它依賴 Lean 三個標準公理以外的假設，所以不算數。",
          ]}
        />
        <p>
          <SiteLink to={["skills", "verify", "formalizer"]} label={["How Formalizer checks a problem", "Formalizer 怎麼檢查一道題"]} />
        </p>
      </Section>

      <Section page={PAGE} id="cheatsheet" n={14} title={SECTIONS[13].title}>
        <Table
          head={[
            ["Lean says", "Lean 說"],
            ["Usually", "通常是"],
            ["Try", "試試"],
          ]}
          rows={[
            [
              ["`unsolved goals`", "`unsolved goals`"],
              ["The proof stops too early.", "證明太早結束了。"],
              [
                "Read the goals it prints; add steps, or end with `sorry` while working.",
                "讀它印出的目標；補上步驟，或在寫的過程中以 `sorry` 結尾。",
              ],
            ],
            [
              ["`No goals to be solved`", "`No goals to be solved`"],
              ["A step after the proof was done.", "證明完成後還多了一步。"],
              ["Delete it.", "刪掉它。"],
            ],
            [
              ["`Type mismatch`", "`Type mismatch`"],
              ["A proof of a different statement.", "給了另一個陳述的證明。"],
              [
                "Compare *has type* with *expected*; bridge with a lemma, `omega` or `simp`.",
                "比較 *has type* 與 *expected*；用引理、`omega` 或 `simp` 補上落差。",
              ],
            ],
            [
              ["`Unknown identifier` / `Unknown constant`", "`Unknown identifier` / `Unknown constant`"],
              ["A typo or an invented name.", "打錯字或自己編的名字。"],
              ["Check the goal's names; search with `exact?`.", "對照目標裡的名字；用 `exact?` 搜尋。"],
            ],
            [
              ["`failed to synthesize`", "`failed to synthesize`"],
              ["An operation the type doesn't have.", "這個型別沒有這種運算。"],
              ["Check the types; for `decide`, bound the variable.", "檢查型別；用 `decide` 時，給變數一個上界。"],
            ],
            [
              ["`omega could not prove the goal`", "`omega could not prove the goal`"],
              ["A false claim, or a missing fact.", "說法是錯的，或少了一個事實。"],
              ["Test the counterexample by hand.", "親手驗算反例。"],
            ],
            [
              ["`Expected type must not contain free variables`", "`Expected type must not contain free variables`"],
              ["`decide` with an unknown number.", "對含未知數的陳述用了 `decide`。"],
              ["`decide +revert`, or another tactic.", "`decide +revert`，或換別的戰術。"],
            ],
            [
              ["Tactic `rewrite` failed", "Tactic `rewrite` failed"],
              ["The left side isn't in the target.", "左邊那一項不在結論裡。"],
              ["Change the order, or use `rw [← h]`.", "換個順序，或用 `rw [← h]`。"],
            ],
            [
              ["declaration uses `sorry`", "declaration uses `sorry`"],
              ["Unfinished, on purpose.", "刻意留下的未完成部分。"],
              ["Replace each `sorry`.", "把每個 `sorry` 換掉。"],
            ],
          ]}
        />
        <Sources
          items={[
            { label: "Theorem Proving in Lean 4: Tactics", url: "https://lean-lang.org/theorem_proving_in_lean4/Tactics/" },
            {
              label: "Lean Language Reference: Tactic Reference",
              url: "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/Tactic-Reference/",
            },
            { label: "Lean Language Reference: Error Explanations", url: "https://lean-lang.org/doc/reference/latest/Error-Explanations/" },
          ]}
        />
      </Section>
    </Page>
  );
}
