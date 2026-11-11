/** Concept ▸ From statement to proof (#/concept/method[/<section>]). Lean code: lean/Formalizer/Pages/Method.lean. */
import { CodeBlock, useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, snippet, Sources, Table, TryIn, type L } from "../kit";

const PAGE = "method";

const SECTIONS: { id: string; title: L }[] = [
  { id: "overview", title: ["The method at a glance", "方法總覽"] },
  { id: "statement", title: ["From words to a formal statement", "從文字到形式化陳述"] },
  { id: "definitions", title: ["Definitions come first", "先寫定義"] },
  { id: "plan", title: ["A plan made of sorrys", "用 sorry 搭出計畫"] },
  { id: "tactics", title: ["Tactics close the goals one by one", "戰術逐一完成目標"] },
  { id: "kernel", title: ["The kernel checks, the axioms are audited", "核心（kernel）檢查，公理接受稽核"] },
  { id: "comparator", title: ["Comparator: is it the right theorem?", "Comparator：證的是對的定理嗎？"] },
];

const STEPS: { name: L; sub: L; checker: boolean }[] = [
  { name: ["Informal statement", "白話陳述"], sub: ["the claim in words", "用文字說出主張"], checker: false },
  { name: ["Formal statement", "形式化陳述"], sub: ["the test, kept fixed", "就是測試，固定不變"], checker: false },
  { name: ["Definitions", "定義"], sub: ["tried out with #eval", "先用 #eval 試算"], checker: false },
  { name: ["Plan with sorry", "帶 sorry 的計畫"], sub: ["goals left to prove", "列出還要證的目標"], checker: false },
  { name: ["Tactics", "戰術"], sub: ["close goals one by one", "逐一完成目標"], checker: false },
  { name: ["Kernel check", "核心檢查"], sub: ["every step re-checked", "每一步重新檢查"], checker: true },
  { name: ["Axiom audit", "公理稽核"], sub: ["#print axioms", "#print axioms"], checker: true },
  { name: ["Comparator", "Comparator"], sub: ["exact statement, sandbox", "陳述相符、沙盒執行"], checker: true },
];

/** The eight steps as a snake: 1–4 left to right, 5–8 right to left underneath. */
function Pipeline() {
  const { pick } = useLang();
  const W = 132;
  const H = 58;
  const GAP = 24;
  const X0 = 10;
  const pos = (i: number) => {
    const row = i < 4 ? 0 : 1;
    const col = row === 0 ? i : 7 - i;
    return { x: X0 + col * (W + GAP), y: 14 + row * 104 };
  };
  return (
    <svg
      viewBox="0 0 640 236"
      className="w-full max-w-[640px]"
      role="img"
      aria-label={pick(["The Formalizer method in eight steps", "Formalizer 方法的八個步驟"])}
    >
      <defs>
        <marker id="method-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-gray-400" />
        </marker>
      </defs>
      {STEPS.map((s, i) => {
        const { x, y } = pos(i);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={W}
              height={H}
              rx={8}
              className={s.checker ? "fill-sky-50 stroke-sky-400" : "fill-teal-50 stroke-teal-500"}
              strokeWidth={1.5}
            />
            <circle cx={x + 14} cy={y + 15} r={9} className={s.checker ? "fill-sky-500" : "fill-teal-600"} />
            <text x={x + 14} y={y + 19} textAnchor="middle" className="fill-white text-[11px] font-semibold">
              {i + 1}
            </text>
            <text x={x + 28} y={y + 20} className="fill-gray-900 text-[12px] font-semibold">
              {pick(s.name)}
            </text>
            <text x={x + W / 2} y={y + 44} textAnchor="middle" className="fill-gray-600 text-[11px]">
              {pick(s.sub)}
            </text>
          </g>
        );
      })}
      {[0, 1, 2].map((i) => {
        const a = pos(i);
        return (
          <line
            key={`r${i}`}
            x1={a.x + W + 2}
            y1={a.y + H / 2}
            x2={a.x + W + GAP - 2}
            y2={a.y + H / 2}
            className="stroke-gray-400"
            strokeWidth={1.5}
            markerEnd="url(#method-arrow)"
          />
        );
      })}
      <line
        x1={pos(3).x + W / 2}
        y1={pos(3).y + H + 2}
        x2={pos(4).x + W / 2}
        y2={pos(4).y - 2}
        className="stroke-gray-400"
        strokeWidth={1.5}
        markerEnd="url(#method-arrow)"
      />
      {[4, 5, 6].map((i) => {
        const a = pos(i);
        return (
          <line
            key={`l${i}`}
            x1={a.x - 2}
            y1={a.y + H / 2}
            x2={a.x - GAP + 2}
            y2={a.y + H / 2}
            className="stroke-gray-400"
            strokeWidth={1.5}
            markerEnd="url(#method-arrow)"
          />
        );
      })}
      {/* the loop back from tactics to the plan: tactics often show the plan needs another step */}
      <path
        d={`M ${pos(4).x + 30} ${pos(4).y} C ${pos(4).x + 30} ${pos(4).y - 26}, ${pos(3).x + 30} ${pos(3).y + H + 26}, ${pos(3).x + 30} ${pos(3).y + H}`}
        className="fill-none stroke-amber-400"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        markerEnd="url(#method-arrow)"
      />
      <text x={pos(3).x - 6} y={pos(3).y + H + 30} textAnchor="end" className="fill-amber-600 text-[11px]">
        {pick(["stuck? refine the plan", "卡住了？修改計畫"])}
      </text>
      <rect x={X0} y={200} width={12} height={12} rx={3} className="fill-teal-50 stroke-teal-500" />
      <text x={X0 + 18} y={210} className="fill-gray-600 text-[11px]">
        {pick(["you write", "你來寫"])}
      </text>
      <rect x={X0 + 110} y={200} width={12} height={12} rx={3} className="fill-sky-50 stroke-sky-400" />
      <text x={X0 + 128} y={210} className="fill-gray-600 text-[11px]">
        {pick(["the machine checks", "機器檢查"])}
      </text>
    </svg>
  );
}

/** What the goal panel shows at a point of the proof (copied from Lean's output). */
function Goals({ text }: { text: string }) {
  const { pick } = useLang();
  return <CodeBlock code={text} title={pick(["Goal panel", "目標面板"])} />;
}

const GOAL_START = `n : Nat
⊢ 2 * sumTo n = n * (n + 1)`;

const GOAL_PLAN1 = `case zero
⊢ 2 * sumTo 0 = 0 * (0 + 1)

case succ
n : Nat
ih : 2 * sumTo n = n * (n + 1)
⊢ 2 * sumTo (n + 1) = (n + 1) * (n + 1 + 1)`;

const OMEGA_FAILS = `def sumTo : Nat → Nat
  | 0 => 0
  | n + 1 => sumTo n + (n + 1)

theorem gauss (n : Nat) : 2 * sumTo n = n * (n + 1) := by
  omega   -- error: omega could not prove the goal`;

const COMPARATOR_CONFIG = `{
  "challenge_module": "Challenge",
  "solution_module": "Solution",
  "theorem_names": ["gauss"],
  "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"]
}`;

export default function MethodConcept({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["From statement to proof", "從陳述到證明"]}
      intro={[
        "In Formalizer, every problem is a mathematical claim written in Lean. **The statement is the test**: it is fixed before anyone writes a proof, and Lean's kernel decides whether a proof passes. This page walks one small theorem, Gauss's sum $1 + 2 + \\dots + n$, through every step, from a sentence in words to a proof a machine has checked.",
        "在 Formalizer 裡，每一道題目都是用 Lean 寫下的數學主張。**陳述本身就是測試**：它在任何人動手證明之前就已固定，而證明能不能通過，由 Lean 的核心（kernel）決定。本頁帶著一個小定理，高斯求和 $1 + 2 + \\dots + n$，走完每一步：從一句話，到一個機器檢查過的證明。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="overview" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A proof on paper is checked by a reader, who may be tired, or may skim the step that looked obvious. A proof in Lean is checked by a program, line by line, and it either passes or it doesn't. The price is that everything must be said exactly: what the claim is, what each word means, and why each step follows.",
            "紙上的證明由讀者檢查，而讀者可能累了，也可能跳過看起來顯然的那一步。Lean 的證明則由程式逐行檢查，只有通過與不通過兩種結果。代價是每件事都得說得精確：主張是什麼、每個詞是什麼意思、每一步為什麼成立。",
          ]}
        />
        <P
          t={[
            "Formalizer splits that work into eight steps. The first five are yours; the last three are done by machines that don't trust you (or any AI that helped you).",
            "Formalizer 把這件事拆成八個步驟。前五步由你來寫；後三步交給機器，而這些機器既不信任你，也不信任任何幫過你的 AI。",
          ]}
        />
        <Figure
          caption={[
            "The method. Steps 4 and 5 go round in a loop: a tactic that gets stuck usually means the plan needs one more intermediate step.",
            "整個方法。第 4、5 步會來回循環：某個戰術卡住，通常表示計畫還需要多一個中間步驟。",
          ]}
        >
          <Pipeline />
        </Figure>
        <Callout kind="tip" title={["The statement comes first", "陳述先行"]}>
          <P
            t={[
              "In software, writing the tests before the code keeps you honest: you decide what *correct* means before you are tempted to bend it. In Formalizer the statement plays that role, and it is written before the proof, by someone else, and frozen.",
              "寫程式時先寫測試，可以讓人保持誠實：在你想遷就結果之前，就先決定什麼叫 *正確*。在 Formalizer 裡，陳述扮演這個角色：它在證明之前寫好、由別人寫好，而且凍結不動。",
            ]}
          />
        </Callout>
      </Section>

      <Section page={PAGE} id="statement" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "**Step 1, in words.** The story goes that the young Gauss, told to add the numbers from 1 to 100, paired them from both ends: $1 + 100$, $2 + 99$, … fifty pairs of $101$, so $5050$. In general: *for every natural number $n$, $1 + 2 + \\dots + n = \\frac{n(n+1)}{2}$.*",
            "**第 1 步，用文字說。** 相傳年幼的高斯被要求把 1 加到 100，他把頭尾的數配對：$1 + 100$、$2 + 99$……共五十對 $101$，所以是 $5050$。一般來說：*對每個自然數 $n$，$1 + 2 + \\dots + n = \\frac{n(n+1)}{2}$。*",
          ]}
        />
        <P
          t={[
            "**Step 2, in Lean.** Each phrase of the sentence becomes a precise piece of the statement:",
            "**第 2 步，寫成 Lean。** 句子裡的每個片語，都變成陳述中一個精確的部分：",
          ]}
        />
        <Table
          head={[
            ["In words", "文字"],
            ["In Lean", "Lean"],
            ["Why", "原因"],
          ]}
          rows={[
            [
              ["for every natural number $n$", "對每個自然數 $n$"],
              ["`(n : Nat)`", "`(n : Nat)`"],
              [
                "`n` is an input of the theorem: the proof must work for whatever `n` it is given.",
                "`n` 是定理的輸入：無論給的是哪個 `n`，證明都必須成立。",
              ],
            ],
            [
              ["$1 + 2 + \\dots + n$", "$1 + 2 + \\dots + n$"],
              ["`sumTo n`", "`sumTo n`"],
              [
                "The dots “…” are not Lean. We define a function that means exactly this (next section).",
                "「……」不是 Lean 的語法。我們要定義一個函式，精確表達這個意思（見下一節）。",
              ],
            ],
            [
              ["$= \\frac{n(n+1)}{2}$", "$= \\frac{n(n+1)}{2}$"],
              ["`2 * sumTo n = n * (n + 1)`", "`2 * sumTo n = n * (n + 1)`"],
              [
                "On `Nat`, `/` rounds down (`7 / 2 = 3`), so a statement with division can quietly mean something else. Multiplying both sides by 2 avoids division altogether.",
                "在 `Nat` 上，`/` 會無條件捨去（`7 / 2 = 3`），所以含除法的陳述可能悄悄變成別的意思。兩邊同乘以 2，就完全避開了除法。",
              ],
            ],
          ]}
        />
        <Lean
          code={snippet("Method", "statement")}
          note={["The statement, with `sorry` where the proof will go.", "陳述本身，證明的位置先放 `sorry`。"]}
        />
        <P
          t={[
            "`sorry` means “I owe you a proof”. Lean accepts it with a warning, so you can write the statement first and the proof later. **In Formalizer, everything before `:= by` is fixed**: you may only replace the `sorry`. If you could edit the statement, you could always win by proving something easier.",
            "`sorry` 的意思是「先欠著一個證明」。Lean 會接受它，但會發出警告，所以你可以先寫陳述、之後再補證明。**在 Formalizer 裡，`:= by` 之前的一切都固定不變**：你只能替換 `sorry`。如果可以改陳述，你永遠可以改成更簡單的東西來「贏」。",
          ]}
        />
        <Callout kind="warn" title={["A proof of the wrong statement is still a proof", "證明錯的陳述，依然是一個證明"]}>
          <P
            t={[
              "Lean checks that the proof proves the statement. It cannot check that the statement says what you meant. This one is true, Lean accepts it, and it tells us nothing about Gauss's sum:",
              "Lean 檢查的是證明是否證出了陳述，它無法檢查陳述是否表達了你的本意。下面這個陳述是對的、Lean 也接受，但它對高斯求和什麼都沒說：",
            ]}
          />
          <Lean code={snippet("Method", "weak")} />
          <P
            t={[
              "So read the statement slowly, phrase by phrase, and compare it with the sentence in words. That reading is the one step no machine does for you.",
              "所以要慢慢讀陳述，一個片語一個片語地和文字版本對照。這一步是沒有任何機器能替你做的。",
            ]}
          />
        </Callout>
        <TryIn ids={["hello", "add-comm"]} />
      </Section>

      <Section page={PAGE} id="definitions" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "**Step 3.** A statement can only use words Lean already knows. “$1 + 2 + \\dots + n$” is not one of them, so we define it, the way you would explain it to a computer: the sum up to $0$ is $0$, and the sum up to $n + 1$ is the sum up to $n$, plus $n + 1$.",
            "**第 3 步。** 陳述只能使用 Lean 已經認得的詞。「$1 + 2 + \\dots + n$」不在其中，所以我們要定義它，就像向電腦解釋一樣：加到 $0$ 的和是 $0$；加到 $n + 1$ 的和，是加到 $n$ 的和再加上 $n + 1$。",
          ]}
        />
        <Lean
          code={snippet("Method", "definition")}
          note={["`#eval` runs the function: Lean prints 10 and 5050.", "`#eval` 會執行這個函式：Lean 印出 10 和 5050。"]}
        />
        <P
          t={[
            "Before proving anything, **try the definition on small numbers**. A definition with an off-by-one mistake (say, adding `n` instead of `n + 1`) makes a perfectly checkable theorem about the wrong thing, and `#eval` catches that in a second. In Formalizer the definitions a problem needs are part of its statement: they are fixed too.",
            "在證明任何東西之前，**先用小的數字試試定義**。定義若差了一（例如加的是 `n` 而不是 `n + 1`），就會得到一個完全可以檢查、卻講錯對象的定理；`#eval` 一秒就能抓出這種錯。在 Formalizer 裡，題目需要的定義是陳述的一部分，同樣固定不變。",
          ]}
        />
        <Callout kind="note" title={["Defined step by step, proved step by step", "一步一步定義，一步一步證明"]}>
          <P
            t={[
              "`sumTo` is defined by saying what happens at `0` and how to go from `n` to `n + 1`. That shape is a strong hint for the proof: **induction** follows the same two cases.",
              "`sumTo` 的定義說明了在 `0` 時的值，以及如何從 `n` 走到 `n + 1`。這個形狀是證明的強烈提示：**歸納法** 正好走同樣的兩種情形。",
            ]}
          />
        </Callout>
        <TryIn ids={["induction-double"]} />
      </Section>

      <Section page={PAGE} id="plan" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "**Step 4.** Don't try to write the whole proof at once. Write its *shape*, with a `sorry` in every hole, and let Lean tell you what each hole still needs. The **goal panel** shows it: above the line `⊢` is what you know (hypotheses, 已知), below it is what is left to prove. At the start there is one goal:",
            "**第 4 步。** 不要想一次寫完整個證明。先寫出它的 *形狀*，每個缺口放一個 `sorry`，讓 Lean 告訴你每個缺口還需要什麼。**目標面板** 會顯示這些資訊：`⊢` 上方是已知的東西（前提），下方是還要證明的目標。一開始只有一個目標：",
          ]}
        />
        <Goals text={GOAL_START} />
        <P
          t={[
            "**Plan A: induction.** One `sorry` becomes two, one for each case. They are smaller problems, and the panel shows exactly what each one asks. In the `succ` case Lean hands us `ih`, the claim for `n`, to use for `n + 1`.",
            "**計畫 A：歸納法。** 一個 `sorry` 變成兩個，每種情形一個。它們是比較小的問題，面板精確顯示各自要證什麼。在 `succ` 情形中，Lean 給了我們 `ih`，也就是對 `n` 成立的主張，可以拿來證明 `n + 1` 的情形。",
          ]}
        />
        <Lean code={snippet("Method", "plan1")} />
        <Goals text={GOAL_PLAN1} />
        <P
          t={[
            "**Plan B: close the easy case, break up the hard one.** The `zero` case is plain arithmetic, `rfl` closes it. For the `succ` case, write the calculation as a chain of small equalities with `calc`, each with its own `sorry`. You can check the chain makes sense *before* you justify any link: if Lean accepts the plan, the links are all that is left.",
            "**計畫 B：先收掉簡單的情形，再拆開困難的那個。** `zero` 情形只是算術，`rfl` 就能完成。`succ` 情形則用 `calc` 寫成一串小等式，每個環節各放一個 `sorry`。你可以在證明任何環節 *之前*，先確認整條鏈說得通：只要 Lean 接受這個計畫，剩下的就只有這些環節。",
          ]}
        />
        <Lean code={snippet("Method", "plan2")} />
        <P
          t={[
            "**Plan C: fill the links you can.** The first two links are a rewrite each: unfold `sumTo` and spread the `2 *`; then use the induction hypothesis `ih`. Two `sorry`s remain.",
            "**計畫 C：填上會的環節。** 前兩個環節各用一次改寫：展開 `sumTo` 並把 `2 *` 分配進去；接著使用歸納假設 `ih`。還剩兩個 `sorry`。",
          ]}
        />
        <Lean code={snippet("Method", "plan3")} />
        <Table
          head={[
            ["Version", "版本"],
            ["`sorry`s left", "剩下的 `sorry`"],
            ["What changed", "改了什麼"],
          ]}
          rows={[
            [
              ["Statement", "陳述"],
              ["1", "1"],
              ["the whole proof is one hole", "整個證明是一個缺口"],
            ],
            [
              ["Plan A", "計畫 A"],
              ["2", "2"],
              ["induction: a start and a step", "歸納法：起點與推進"],
            ],
            [
              ["Plan B", "計畫 B"],
              ["4", "4"],
              ["`zero` closed; `succ` split into 4 small links", "`zero` 完成；`succ` 拆成 4 個小環節"],
            ],
            [
              ["Plan C", "計畫 C"],
              ["2", "2"],
              ["two links proved by `rw`", "兩個環節用 `rw` 證完"],
            ],
            [
              ["Proof", "證明"],
              ["0", "0"],
              ["the last two links (next section)", "最後兩個環節（見下一節）"],
            ],
          ]}
        />
        <P
          t={[
            "The count goes *up* before it goes down, and that is the point: one hard hole becomes several easy ones. Every version in between is accepted by Lean, so you always know where you stand.",
            "`sorry` 的數量先 *增加* 再減少，這正是重點：一個困難的缺口變成好幾個簡單的。中間的每個版本 Lean 都接受，所以你隨時知道自己進行到哪裡。",
          ]}
        />
        <SiteLink to={["skills", "structure"]} label={["More on structuring proofs", "更多關於證明的結構"]} />
      </Section>

      <Section page={PAGE} id="tactics" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "**Step 5.** A **tactic** is an instruction that turns the current goal into simpler goals, or closes it. Each `sorry` is replaced by a tactic that closes its goal, and Lean re-checks after every edit. The two remaining links are pure algebra: collect $n(n+1) + 2(n+1)$ into $(n+2)(n+1)$ with `Nat.add_mul`, then swap the factors with `Nat.mul_comm`.",
            "**第 5 步。** **戰術** 是一個指令，把目前的目標變成更簡單的目標，或直接完成它。每個 `sorry` 都換成一個能完成其目標的戰術，而每改一次，Lean 就重新檢查一次。剩下的兩個環節是純代數：用 `Nat.add_mul` 把 $n(n+1) + 2(n+1)$ 合併成 $(n+2)(n+1)$，再用 `Nat.mul_comm` 交換兩個因數。",
          ]}
        />
        <Lean code={snippet("Method", "done")} note={["No `sorry` left: no warning.", "沒有 `sorry` 了：也沒有警告。"]} />
        <P
          t={[
            "Why not one clever tactic? Some exist. `omega` decides linear arithmetic, but here unknowns are multiplied together ($n \\times n$) and it knows nothing about `sumTo`, so it gives up:",
            "為什麼不用一個聰明的戰術一次解決？確實有這種戰術。`omega` 能判定線性算術，但這裡有未知數相乘（$n \\times n$），而且它對 `sumTo` 一無所知，所以會放棄：",
          ]}
        />
        <Lean code={OMEGA_FAILS} fails />
        <P
          t={[
            "With Mathlib, the algebra in the `succ` case shrinks to one line: `ring` proves any identity that holds by the rules of $+$ and $\\times$.",
            "有了 Mathlib，`succ` 情形中的代數可以縮成一行：`ring` 能證明任何只靠 $+$ 與 $\\times$ 的規則就成立的恆等式。",
          ]}
        />
        <Lean
          runner="mathlib"
          code={`def sumTo : ℕ → ℕ
  | 0 => 0
  | n + 1 => sumTo n + (n + 1)

theorem gauss (n : ℕ) : 2 * sumTo n = n * (n + 1) := by
  induction n with
  | zero => rfl
  | succ n ih =>
    rw [sumTo, Nat.mul_add, ih]
    ring`}
        />
        <TryIn ids={["calc-chain", "gauss"]} />
        <SiteLink to={["skills", "tactics"]} label={["The tactics you will use most", "最常用的戰術"]} />
      </Section>

      <Section page={PAGE} id="kernel" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "**Step 6.** Tactics are big, clever programs, and clever programs have bugs. So they don't have the last word. Behind the scenes, every tactic writes down a complete, explicit proof (a *proof term*), and Lean's **kernel**, a small program whose only job is to check such terms, checks it from scratch. To trust the result you need to trust the kernel, not the tactics.",
            "**第 6 步。** 戰術是龐大而聰明的程式，聰明的程式就會有錯誤。所以它們不是最後的裁判。在幕後，每個戰術都會寫出一個完整、明確的證明（*證明項*），再由 Lean 的 **核心（kernel）**，一個唯一工作就是檢查這種證明項的小程式，從頭檢查一遍。要相信結果，你只需要相信核心，而不是戰術。",
          ]}
        />
        <P
          t={[
            "**Step 7.** A proof can also lean on **axioms**: facts assumed without proof. `#print axioms` lists every axiom a theorem depends on, following all the lemmas it uses:",
            "**第 7 步。** 證明也可能依賴 **公理**：不經證明就假定的事實。`#print axioms` 會追蹤定理用到的所有引理，列出它依賴的每一條公理：",
          ]}
        />
        <Lean code={snippet("Method", "audit")} note={["The comments are what Lean prints.", "註解是 Lean 印出的內容。"]} />
        <Table
          head={[
            ["Axiom", "公理"],
            ["Verdict", "判定"],
            ["What it says, roughly", "大意"],
          ]}
          rows={[
            [
              ["`propext`", "`propext`"],
              ["standard", "標準"],
              ["two statements that imply each other are equal", "互相蘊含的兩個陳述相等"],
            ],
            [
              ["`Quot.sound`", "`Quot.sound`"],
              ["standard", "標準"],
              [
                "things declared equivalent are equal once you pass to the quotient (it also gives: functions with equal values are equal)",
                "宣告為等價的東西，取商之後就相等（也由此得出：值都相同的函式相等）",
              ],
            ],
            [
              ["`Classical.choice`", "`Classical.choice`"],
              ["standard", "標準"],
              [
                "from a type known to be non-empty you may pick an element; it gives “every statement is true or false”",
                "已知非空的型別，可以從中取出一個元素；由它可推出「每個陳述非真即假」",
              ],
            ],
            [
              ["`sorryAx`", "`sorryAx`"],
              ["**unfinished**", "**尚未完成**"],
              ["a `sorry` is still somewhere in the proof, perhaps in a lemma it uses", "證明裡某處仍有 `sorry`，可能藏在它用到的引理中"],
            ],
            [
              ["anything else", "其他任何公理"],
              ["**rejected**", "**不接受**"],
              [
                "anyone can write `axiom`, including `axiom cheat : False`; then everything is “provable”",
                "任何人都能寫 `axiom`，包括 `axiom cheat : False`；那樣一來任何事都「證得出來」",
              ],
            ],
          ]}
        />
        <P
          t={[
            "The three standard axioms are the ones nearly all of Mathlib uses, and the ones ordinary mathematics takes for granted. Our finished `gauss` needs only `propext`, which it inherits from the library lemma `Nat.add_mul`.",
            "這三條標準公理幾乎是整個 Mathlib 都在用的，也是一般數學視為理所當然的。我們完成的 `gauss` 只需要 `propext`，是從函式庫引理 `Nat.add_mul` 繼承來的。",
          ]}
        />
        <SiteLink to={["concept", "kernel"]} label={["How Lean checks", "Lean 如何檢查"]} />
        <SiteLink to={["skills", "verify"]} label={["Checking a finished proof", "檢查完成的證明"]} />
        <Sources
          items={[
            { label: "Theorem Proving in Lean 4: Tactics", url: "https://lean-lang.org/theorem_proving_in_lean4/tactics.html" },
            {
              label: "Theorem Proving in Lean 4: Axioms and Computation",
              url: "https://lean-lang.org/theorem_proving_in_lean4/axioms_and_computation.html",
            },
            { label: "Lean Language Reference", url: "https://lean-lang.org/doc/reference/latest/" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="comparator" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "**Step 8.** For a tutorial problem you can see the whole file. For a research problem, the solution may be thousands of lines, perhaps written with the help of an AI, and nobody wants to read it all. What must be checked is short: does it prove **exactly** the challenge statement, using only the standard axioms?",
            "**第 8 步。** 教學題的整個檔案你都看得到。研究題的解答則可能長達數千行，也許是在 AI 協助下寫成的，沒人想全部讀完。真正需要檢查的事情很短：它證明的 **正是** 挑戰的陳述嗎？只用了標準公理嗎？",
          ]}
        />
        <P
          t={[
            "That is what the Lean FRO's **Comparator** checks. It takes two Lean modules, the *challenge* (the fixed statements, with `sorry`) and the *solution*, and a small configuration:",
            "這正是 Lean FRO 的 **Comparator** 所檢查的。它接收兩個 Lean 模組，*挑戰*（固定的陳述，證明處是 `sorry`）與 *解答*，再加上一份簡短的設定：",
          ]}
        />
        <CodeBlock code={COMPARATOR_CONFIG} title="config.json" />
        <List
          items={[
            [
              "**Same statement.** Each named theorem in the solution must have exactly the type stated in the challenge, with the definitions it mentions unchanged. A solution can't slip in an easier statement or a redefined `sumTo`.",
              "**陳述相同。** 解答中每個列名的定理，型別必須與挑戰中的陳述完全一致，其中提到的定義也不能改動。解答無法偷換成較簡單的陳述，或重新定義 `sumTo`。",
            ],
            [
              "**Permitted axioms only.** Like `#print axioms`, but enforced: `sorryAx` or a home-made `axiom` fails the check.",
              "**只用許可的公理。** 就像 `#print axioms`，但會強制執行：出現 `sorryAx` 或自製的 `axiom` 就不通過。",
            ],
            [
              "**Sandboxed.** Building a Lean file runs code (tactics and macros are programs), so the solution is built in a sandbox (landrun) where it cannot tamper with the checker.",
              "**在沙盒中執行。** 建置 Lean 檔案時會執行程式碼（戰術與巨集都是程式），所以解答在沙盒（landrun）中建置，無法竄改檢查程式。",
            ],
            [
              "**A second kernel.** Lean's kernel always replays the solution; on top of that, the proofs can be exported and re-checked by an independent kernel such as nanoda, so a single bug in one kernel would not be enough to fool it.",
              "**第二個核心。** Lean 的核心一定會重新驗算解答；此外，證明還可以匯出，交給 nanoda 這類獨立的核心再檢查一次，如此一來，單一核心裡的一個錯誤不足以騙過它。",
            ],
          ]}
        />
        <P
          t={[
            "This is the whole method in one tool: the statement is the test, the kernel is the grader, and the checking is done by machines that trust no one. Formalizer's research problems, including the Navier–Stokes and Euler challenges, are graded this way.",
            "這就是整個方法濃縮成一個工具：陳述就是測試，核心就是閱卷人，而檢查交給不信任任何人的機器。Formalizer 的研究題，包括 Navier–Stokes 與 Euler 挑戰，都用這種方式批改。",
          ]}
        />
        <Callout kind="note" title={["What a pass does not mean", "通過不代表什麼"]}>
          <P
            t={[
              "A pass means the proof is correct *for that statement*. Whether the statement captures the mathematics people care about is still a question for people, which is why step 2 matters as much as step 8.",
              "通過代表證明 *對那個陳述* 是正確的。至於陳述是否抓住了大家真正在意的數學，仍然要由人來判斷；這也是為什麼第 2 步和第 8 步一樣重要。",
            ]}
          />
        </Callout>
        <SiteLink to={["concept", "limits"]} label={["What formal proof can't do", "形式證明做不到的事"]} />
        <Sources
          items={[
            { label: "leanprover/comparator", url: "https://github.com/leanprover/comparator" },
            { label: "ammkrn/nanoda_lib (independent Lean kernel)", url: "https://github.com/ammkrn/nanoda_lib" },
            { label: "Mathematics in Lean", url: "https://leanprover-community.github.io/mathematics_in_lean/" },
          ]}
        />
      </Section>
    </Page>
  );
}
