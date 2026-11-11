/** Concept ▸ Limits of proofs (#/concept/limits[/<section>]). Lean code: lean/Formalizer/Pages/Limits.lean. */
import { useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, snippet, Sources, Table, TryIn, type SectionInfo } from "../kit";

const SECTIONS: SectionInfo[] = [
  { id: "as-written", title: ["A proof checks the statement as written", "證明只檢查寫下來的陳述"] },
  { id: "definitions", title: ["Wrong definitions, and how to catch them", "錯誤的定義，以及怎麼抓出來"] },
  { id: "junk", title: ["Junk values: 2 − 3 = 0 and 5 / 0 = 0", "垃圾值：2 − 3 = 0 與 5 / 0 = 0"] },
  { id: "sorry", title: ["`sorry`: a hole marked as a hole", "`sorry`：標明了的漏洞"] },
  { id: "axioms", title: ["Axioms: what every proof takes on trust", "公理：每個證明都默默相信的東西"] },
  { id: "trusted-base", title: ["The trusted base: kernel, build, hardware", "信任基礎：核心（kernel）、建置、硬體"] },
  { id: "comparator", title: ["What Comparator adds, and what it can't", "Comparator 多做了什麼，又做不到什麼"] },
  { id: "godel", title: ["Gödel: true but unprovable", "哥德爾：真的，卻證不出來"] },
];

/** Paper → Lean statement → proof: a person checks the first arrow, the kernel the second. */
function WhoChecksFigure() {
  const { pick } = useLang();
  const boxes = [
    { x: 10, label: pick(["The idea", "原本的想法"]), sub: pick(["paper, textbook, your head", "論文、課本、腦中"]) },
    { x: 220, label: pick(["Lean statement", "Lean 陳述"]), sub: pick(["theorem … : …", "theorem … : …"]) },
    { x: 430, label: pick(["Proof", "證明"]), sub: pick(["by …", "by …"]) },
  ];
  return (
    <svg viewBox="0 0 600 170" className="w-full max-w-[600px]" role="img" aria-label={pick(["Who checks what", "誰檢查什麼"])}>
      {boxes.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={20} width={160} height={64} rx={10} className="fill-white stroke-gray-400" strokeWidth={1.5} />
          <text x={b.x + 80} y={47} textAnchor="middle" className="fill-gray-900 text-[14px] font-semibold">
            {b.label}
          </text>
          <text x={b.x + 80} y={68} textAnchor="middle" className="fill-gray-500 text-[11px]">
            {b.sub}
          </text>
        </g>
      ))}
      {/* arrow 1: people */}
      <line x1={172} y1={52} x2={214} y2={52} className="stroke-amber-500" strokeWidth={2} strokeDasharray="5 4" />
      <path d="M214 46 L222 52 L214 58 Z" className="fill-amber-500" />
      {/* arrow 2: kernel */}
      <line x1={382} y1={52} x2={424} y2={52} className="stroke-teal-600" strokeWidth={2.5} />
      <path d="M424 46 L432 52 L424 58 Z" className="fill-teal-600" />
      <text x={195} y={112} textAnchor="middle" className="fill-amber-700 text-[12px] font-semibold">
        {pick(["checked by people", "由人檢查"])}
      </text>
      <text x={195} y={130} textAnchor="middle" className="fill-amber-700 text-[11px]">
        {pick(["(does it say what we mean?)", "（說的是我們想的嗎？）"])}
      </text>
      <text x={405} y={112} textAnchor="middle" className="fill-teal-700 text-[12px] font-semibold">
        {pick(["checked by Lean", "由 Lean 檢查"])}
      </text>
      <text x={405} y={130} textAnchor="middle" className="fill-teal-700 text-[11px]">
        {pick(["(does the proof prove it?)", "（證明真的證出來了嗎？）"])}
      </text>
      <text x={300} y={160} textAnchor="middle" className="fill-gray-500 text-[11px]">
        {pick(["A wrong statement with a perfect proof is still wrong.", "陳述錯了，證明再完美也沒用。"])}
      </text>
    </svg>
  );
}

/** The layers you trust when Lean says "proved", from the bottom up. */
function TrustedBaseFigure() {
  const { pick } = useLang();
  const layers = [
    { label: pick(["Hardware and operating system", "硬體與作業系統"]), cls: "fill-gray-100 stroke-gray-400" },
    {
      label: pick(["Lean build: compiler, C runtime, big-number library", "Lean 建置：編譯器、C 執行環境、大數函式庫"]),
      cls: "fill-gray-100 stroke-gray-400",
    },
    {
      label: pick(["Kernel: a small program that checks every step", "核心（kernel）：檢查每一步的小程式"]),
      cls: "fill-teal-50 stroke-teal-600",
    },
    {
      label: pick(["Axioms: propext, Quot.sound, Classical.choice", "公理：propext、Quot.sound、Classical.choice"]),
      cls: "fill-teal-50 stroke-teal-600",
    },
    {
      label: pick(["The statement and its definitions (people read these)", "陳述與它用到的定義（要靠人讀）"]),
      cls: "fill-amber-50 stroke-amber-500",
    },
  ];
  const h = 34;
  return (
    <svg viewBox="0 0 600 230" className="w-full max-w-[600px]" role="img" aria-label={pick(["The trusted base", "信任基礎"])}>
      {layers.map((l, i) => {
        const y = 190 - i * (h + 6);
        const inset = i * 14;
        return (
          <g key={i}>
            <rect x={20 + inset} y={y} width={440 - 2 * inset} height={h} rx={6} className={l.cls} strokeWidth={1.5} />
            <text x={240} y={y + 21} textAnchor="middle" className="fill-gray-800 text-[12px]">
              {l.label}
            </text>
          </g>
        );
      })}
      <text x={530} y={40} textAnchor="middle" className="fill-gray-600 text-[12px] font-semibold">
        {pick(["Your proof", "你的證明"])}
      </text>
      <text x={530} y={58} textAnchor="middle" className="fill-gray-500 text-[11px]">
        {pick(["sits on top", "建在最上面"])}
      </text>
      <line x1={530} y1={68} x2={530} y2={200} className="stroke-gray-400" strokeWidth={1.5} />
      <path d="M524 200 L530 210 L536 200 Z" className="fill-gray-400" />
      <text x={530} y={225} textAnchor="middle" className="fill-gray-500 text-[11px]">
        {pick(["trusted", "被信任的"])}
      </text>
    </svg>
  );
}

const AXIOM_CODE = `axiom oops : 1 = 2          -- "trust me: 1 equals 2"

theorem fermat (P : Prop) : P := absurd oops (by decide)
-- Lean accepts it: from 1 = 2, every statement P follows.

#print axioms fermat   -- 'fermat' depends on axioms: [oops]`;

const NATIVE_CODE = `theorem big : 2 ^ 100 % 7 = 2 := by native_decide

#print axioms big   -- 'big' depends on axioms: [big._native.native_decide.ax_1_1]`;

export default function LimitsConcept({ section }: { section: string | null }) {
  return (
    <Page
      id="limits"
      title={["Limits of proofs", "證明的限度"]}
      intro={[
        "When Lean says **proved**, it is very hard to fool. But it answers a narrow question: *does this proof prove this statement, from these axioms?* It cannot tell you whether the statement is the one you meant, whether your definitions are right, or whether the machine underneath is sound. This page goes through what a machine-checked proof does and does not tell you, with small examples you can run.",
        "Lean 說**已證明**的時候，它是很難被騙的。但它回答的問題很窄：*這個證明，從這些公理出發，真的證出了這個陳述嗎？* 它沒辦法告訴你這個陳述是不是你本來想說的、你的定義對不對，或底下的機器是否可靠。這一頁逐項說明機器檢查過的證明能告訴你什麼、不能告訴你什麼，每一項都附上可以執行的小例子。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Callout kind="note" title={["In one sentence", "一句話總結"]}>
        <P
          t={[
            "Lean checks the **step from statement to proof** perfectly. The **step from idea to statement** is still checked by people, and the whole thing rests on a small, deliberately boring base you choose to trust.",
            "Lean 把**從陳述到證明**這一步檢查得滴水不漏；**從想法到陳述**這一步仍要靠人檢查，而整件事建立在一個刻意做得很小、很無聊、你選擇相信的基礎上。",
          ]}
        />
      </Callout>

      <Section page="limits" id="as-written" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A Lean theorem has two parts: the **statement** (after the colon) and the **proof** (after `:=`). Lean checks that the proof fits the statement, symbol by symbol. It never asks whether the statement says what you had in mind. If the statement is wrong, a correct proof of it is worthless. This is called a **misformalization**, and it is the most common way a formal proof goes wrong.",
            "Lean 定理有兩部分：**陳述**（冒號後面）和**證明**（`:=` 後面）。Lean 會一個符號一個符號地檢查證明是否符合陳述，但它從不問這個陳述是不是你心裡想的那件事。陳述寫錯了，就算證明完全正確也毫無價值。這叫做**形式化錯誤**（misformalization），是形式證明最常出錯的地方。",
          ]}
        />
        <Figure
          caption={["Two arrows, two different checkers. Lean only guards the second one.", "兩個箭頭，兩種檢查者。Lean 只守住第二個。"]}
        >
          <WhoChecksFigure />
        </Figure>
        <P
          t={[
            'The easiest way to write a statement that is too weak is a **hypothesis that can never hold**. "If $n < n$, then $n$ is a million" is true, because no number is smaller than itself, so the "if" never happens. Lean accepts it, and it tells you nothing about a million.',
            "最容易寫出太弱的陳述的方式，是放一個**永遠不可能成立的前提**。「如果 $n < n$，那麼 $n$ 等於一百萬」是真的，因為沒有數會小於自己，「如果」根本不會發生。Lean 接受它，但它對一百萬什麼也沒說。",
          ]}
        />
        <Lean code={snippet("Limits", "vacuous")} />
        <Callout kind="warn" title={["Read the hypotheses", "讀一讀前提"]}>
          <P
            t={[
              "When a hard-looking theorem is proved surprisingly fast, look at the hypotheses first. Can they all be true at once? Try one concrete example where they hold. If you can't find one, the theorem may be empty.",
              "一個看起來很難的定理被很快證完時，先看前提：它們能同時成立嗎？試著找一個讓前提都成立的具體例子。如果找不到，這個定理可能是空的。",
            ]}
          />
        </Callout>
        <TryIn ids={["hello", "check-cases"]} />
      </Section>

      <Section page="limits" id="definitions" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Statements are built from **definitions**, and a definition can be wrong too. Below, `badSum` is meant to add up a list but forgets the first element at every step, so it always returns 0. A tidy theorem about it is easy to prove, and the proof is correct. It just isn't about sums.",
            "陳述是由**定義**組成的，而定義也可能寫錯。下面的 `badSum` 原本要把串列加總，但每一步都漏掉第一個元素，所以永遠回傳 0。關於它的一個漂亮定理很容易證，證明也是對的，只是它講的根本不是加總。",
          ]}
        />
        <Lean code={snippet("Limits", "bad-sum")} />
        <P
          t={[
            "The cure is cheap: **run the definition** on a few inputs before proving anything about it. `#eval` computes and prints the answer.",
            "解法很便宜：在證明任何東西之前，先拿幾個輸入**跑跑看這個定義**。`#eval` 會算出答案並印出來。",
          ]}
        />
        <Lean code={snippet("Limits", "bad-sum-eval")} />
        <P
          t={[
            "Subtler mistakes hide at the edges. This prime test looks right, but listing its results shows that 0 and 1 count as prime. The fix adds `2 ≤ n`, and a few `example … := by decide` lines pin the behaviour down so that Lean re-checks it on every build.",
            "更隱微的錯誤藏在邊界上。這個質數判斷看起來沒問題，但把結果列出來就會發現 0 和 1 被當成了質數。修正方法是加上 `2 ≤ n`，再寫幾行 `example … := by decide` 把行為固定下來，讓 Lean 每次建置都重新檢查一次。",
          ]}
        />
        <Lean code={snippet("Limits", "bad-prime")} />
        <List
          items={[
            ["Try the **edge cases**: 0, 1, the empty list, negative numbers.", "試試**邊界情況**：0、1、空串列、負數。"],
            [
              "Check **one example you know by heart** (the sum of `[1, 2, 3]` is 6).",
              "檢查**一個你很熟的例子**（`[1, 2, 3]` 的總和是 6）。",
            ],
            [
              "Prefer definitions from a shared library such as Mathlib: many people have already used them, so mistakes are rare.",
              "盡量用共用函式庫（例如 Mathlib）裡的定義：已經有很多人用過，出錯的機會很小。",
            ],
          ]}
        />
        <p>
          <SiteLink
            to={["skills", "verify"]}
            label={["More checks of this kind: Coding Skills ▸ Verifying a proof", "更多這類檢查：程式技巧 ▸ 驗證證明"]}
          />
        </p>
        <TryIn ids={["reverse-twice", "induction-double"]} />
      </Section>

      <Section page="limits" id="junk" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "In Lean every function must give an answer for every input. So what is `2 - 3` for natural numbers (0, 1, 2, …), which have no negatives? And what is `5 / 0`? Lean's answer to both is **0**. These are called **junk values**: answers nobody would use, filled in so the function is defined everywhere.",
            "在 Lean 裡，每個函數對每個輸入都必須給出答案。那麼在自然數（0、1、2、…，沒有負數）裡，`2 - 3` 是多少？`5 / 0` 又是多少？Lean 對兩者的答案都是 **0**。這些叫做**垃圾值**（junk value）：沒有人真的會拿來用的答案，只是為了讓函數處處有定義而填上的。",
          ]}
        />
        <Lean code={snippet("Limits", "junk")} />
        <P
          t={[
            'This looks like a bug, but it is a **design choice**, and it is safe. A junk value never makes a false statement provable, because every theorem that needs ordinary behaviour asks for it in a hypothesis. "$a - b + b = a$" holds only when $b \\le a$, and the library theorem says exactly that. Leave the condition out and the statement is false, and Lean can show that too.',
            "這看起來像 bug，其實是**刻意的設計**，而且是安全的。垃圾值不會讓錯誤的陳述變得可以證明，因為每個需要「正常行為」的定理都會在前提裡把條件要回來。「$a - b + b = a$」只在 $b \\le a$ 時成立，函式庫裡的定理就是這樣寫的。拿掉這個條件，陳述就是錯的，Lean 也能證明它錯。",
          ]}
        />
        <Lean code={snippet("Limits", "junk-hyp")} />
        <Callout kind="warn" title={["Where junk does bite: misformalization", "垃圾值真正會咬人的地方：形式化錯誤"]}>
          <P
            t={[
              "Junk values cannot break Lean, but they can make *your statement* say something you did not mean. A statement about `a - b` on natural numbers, written for a case where $b > a$ can happen, is silently about 0. When a formula has subtraction or division, ask: which type are these numbers, and can the bad case occur?",
              "垃圾值弄不壞 Lean，但會讓*你的陳述*說出你沒打算說的話。在自然數上寫 `a - b`，如果 $b > a$ 的情況可能發生，那個陳述就悄悄變成在講 0。公式裡有減法或除法時，問問自己：這些數是什麼型別？壞情況會不會出現？",
            ]}
          />
        </Callout>
        <P
          t={[
            "Kevin Buzzard's FAQ below explains the choice at length, including why mathematicians lose nothing by it.",
            "下面 Kevin Buzzard 的 FAQ 詳細解釋了這個設計，以及為什麼數學家不會因此損失任何東西。",
          ]}
        />
        <TryIn ids={["squeeze", "le-chain"]} />
        <Sources
          items={[
            {
              label: "Kevin Buzzard (Xena): Division by zero in type theory: a FAQ",
              url: "https://xenaproject.wordpress.com/2020/07/05/division-by-zero-in-type-theory-a-faq/",
            },
          ]}
        />
      </Section>

      <Section page="limits" id="sorry" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "`sorry` closes any goal without a proof. It is how every Formalizer problem starts: the statement is given and `sorry` marks where your proof goes. Lean accepts a file with `sorry`, even for a **false** statement, but it prints a warning and quietly records an axiom called `sorryAx`.",
            "`sorry` 可以不經證明就關掉任何目標。Formalizer 的每一題都是這樣開始的：陳述已經寫好，`sorry` 標出你的證明該放的位置。Lean 會接受含有 `sorry` 的檔案，就算陳述是**錯的**也一樣，但它會印出警告，並默默記下一個叫 `sorryAx` 的公理。",
          ]}
        />
        <Lean
          code={snippet("Limits", "sorry-false")}
          note={["Lean warns: declaration uses `sorry`.", "Lean 警告：declaration uses `sorry`。"]}
        />
        <P
          t={[
            "The record travels: anything proved *from* a sorried theorem depends on `sorryAx` too, however many steps away. `#print axioms` shows it, so a hidden `sorry` cannot hide.",
            "這個紀錄會一路跟著走：任何*用到*含 `sorry` 定理所證出的東西，不管隔了幾步，也都依賴 `sorryAx`。`#print axioms` 會把它顯示出來，所以藏起來的 `sorry` 藏不住。",
          ]}
        />
        <Lean code={snippet("Limits", "sorry-spread")} />
        <P t={["Formalizer's runner looks at exactly this when you press Run:", "Formalizer 的執行器按下執行時看的就是這些："]} />
        <Table
          head={[
            ["What Lean reports", "Lean 回報的情況"],
            ["Verdict on the problem page", "題目頁上的結果"],
          ]}
          rows={[
            [
              ["An error", "有錯誤"],
              ["**Lean found a problem.**", "**Lean 發現了問題。**"],
            ],
            [
              ["No errors, but a `sorry` (or `sorryAx`) is left", "沒有錯誤，但還留著 `sorry`（或 `sorryAx`）"],
              ["**Not finished yet**, with the goal at each `sorry`", "**還沒完成**，並列出每個 `sorry` 處的目標"],
            ],
            [
              ["No `sorry`, but an axiom outside the standard three", "沒有 `sorry`，但用了標準三個以外的公理"],
              ["**Lean found a problem**: *uses non-standard axioms*", "**Lean 發現了問題**：*uses non-standard axioms*"],
            ],
            [
              ["No errors, no `sorry`, only standard axioms", "沒有錯誤、沒有 `sorry`、只用標準公理"],
              ["**✓ Proved**, with the axiom list shown", "**✓ 已證明**，並顯示用到的公理"],
            ],
          ]}
        />
        <TryIn ids={["hello"]} />
      </Section>

      <Section page="limits" id="axioms" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "An **axiom** is a statement accepted without proof. Every proof system has a few; the question is which ones. Lean's standard library uses three, and `#print axioms` tells you which a theorem relies on:",
            "**公理**是不經證明就接受的陳述。每個證明系統都有幾個，問題是哪幾個。Lean 的標準函式庫用三個，`#print axioms` 會告訴你某個定理依賴哪些：",
          ]}
        />
        <Table
          head={[
            ["Axiom", "公理"],
            ["In plain words", "白話"],
          ]}
          rows={[
            [
              ["`propext`", "`propext`"],
              [
                "Two statements that imply each other are equal (interchangeable everywhere).",
                "互相蘊含的兩個陳述是相等的（在任何地方都可以互換）。",
              ],
            ],
            [
              ["`Quot.sound`", "`Quot.sound`"],
              [
                'When you glue things together by a rule ("same remainder mod 12"), glued things are equal. It also gives *function extensionality*: functions with the same outputs are equal.',
                "用某個規則把東西黏在一起時（例如「除以 12 餘數相同」），黏在一起的東西就相等。它也推出*函數外延性*：輸出都一樣的函數是相等的。",
              ],
            ],
            [
              ["`Classical.choice`", "`Classical.choice`"],
              [
                "If something exists, you may pick one, even without a recipe. It gives the law of excluded middle: every statement is true or false.",
                "只要某個東西存在，就可以挑出一個，即使沒有具體做法。它推出排中律：每個陳述非真即假。",
              ],
            ],
          ]}
        />
        <Lean code={snippet("Limits", "print-axioms")} />
        <P
          t={[
            "These three are accepted by almost all working mathematicians and are believed to be consistent with each other. A new `axiom` is different: you can write *anything* after `axiom`, and Lean will believe it. One false axiom is enough to prove every statement, including false ones.",
            "這三個幾乎所有數學家都接受，也被相信彼此不會矛盾。自己加的 `axiom` 就不同了：`axiom` 後面可以寫*任何東西*，Lean 都會照單全收。只要一個錯誤的公理，就能證明所有陳述，包括錯的。",
          ]}
        />
        <Lean
          code={AXIOM_CODE}
          note={[
            "Lean accepts this file; it is kept out of the checked files on purpose, because it adds a false axiom.",
            "Lean 會接受這個檔案；它刻意不放進受檢查的檔案裡，因為它加了一個錯誤的公理。",
          ]}
        />
        <P
          t={[
            "`#print axioms` gives the trick away, and Formalizer (like Comparator) rejects any proof whose list holds anything beyond `propext`, `Quot.sound` and `Classical.choice`.",
            "`#print axioms` 會把這個把戲揭穿，而 Formalizer（和 Comparator 一樣）會拒絕任何用到 `propext`、`Quot.sound`、`Classical.choice` 以外公理的證明。",
          ]}
        />
        <Callout kind="note" title={["`native_decide`: trusting the compiler", "`native_decide`：相信編譯器"]}>
          <P
            t={[
              "`decide` asks the kernel to compute the answer step by step. `native_decide` instead compiles the check to machine code and runs it, which is much faster but means trusting the whole compiler, not just the kernel. In Lean v4.34.1 it records that trust as an extra axiom, so Formalizer rejects it like any other non-standard axiom.",
              "`decide` 讓核心一步一步把答案算出來；`native_decide` 則是把檢查編譯成機器碼再執行，快得多，但代價是要相信整個編譯器，而不只是核心。在 Lean v4.34.1 裡，這份信任會被記成一個額外的公理，所以 Formalizer 會像對待其他非標準公理一樣拒絕它。",
            ]}
          />
          <Lean
            code={NATIVE_CODE}
            note={[
              "Lean accepts this, but the axiom is not one of the standard three; kept out of the checked files.",
              "Lean 會接受，但這個公理不屬於標準三個；所以不放進受檢查的檔案。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            {
              label: "Theorem Proving in Lean 4: Axioms and Computation",
              url: "https://lean-lang.org/theorem_proving_in_lean4/axioms_and_computation.html",
            },
          ]}
        />
      </Section>

      <Section page="limits" id="trusted-base" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            'Even with no `sorry` and only standard axioms, "proved" means "proved, *assuming the checker works*". The pieces you trust are called the **trusted base**:',
            "就算沒有 `sorry`、只用標準公理，「已證明」的意思也是「已證明，*前提是檢查程式沒壞*」。你必須信任的那些部分，稱為**信任基礎**（trusted base）：",
          ]}
        />
        <Figure
          caption={[
            "Everything above the kernel (tactics, automation, the editor) can be buggy without breaking soundness: whatever it produces is re-checked by the kernel.",
            "核心以上的一切（戰術、自動化、編輯器）就算有 bug 也不會破壞可靠性：它們產生的東西都會再由核心檢查一次。",
          ]}
        >
          <TrustedBaseFigure />
        </Figure>
        <List
          items={[
            [
              "**The kernel.** A small program that checks every proof term. It is kept small on purpose so that people can read it.",
              "**核心（kernel）。** 一個檢查每個證明項的小程式。刻意寫得很小，讓人讀得完。",
            ],
            [
              "**The Lean build.** The kernel is compiled C++, run with the rest of Lean; a bug in the compiler or a library it uses could in principle matter.",
              "**Lean 的建置。** 核心是編譯過的 C++，和 Lean 的其餘部分一起執行；編譯器或它用到的函式庫有 bug，理論上可能有影響。",
            ],
            [
              "**The hardware and operating system.** Very unlikely to be the weak link, but still trusted.",
              "**硬體與作業系統。** 極不可能是最弱的一環，但仍然是被信任的一部分。",
            ],
          ]}
        />
        <P
          t={[
            "The standard way to shrink this risk is an **independent checker**: a second program, written separately (sometimes in another language), that re-checks the same proofs. Tools such as `lean4checker` re-run the Lean kernel on a finished project, and external kernels such as nanoda check exported proofs on their own. For a false proof to slip through, all of them would have to make the same mistake.",
            "降低這種風險的標準做法是**獨立檢查器**：另一支分開撰寫（有時用別的語言寫）的程式，把同樣的證明再檢查一遍。像 `lean4checker` 這類工具會對完成的專案重新跑一次 Lean 核心，nanoda 這類外部核心則獨立檢查匯出的證明。錯誤的證明要溜過去，它們得全部犯同一個錯。",
          ]}
        />
        <p>
          <SiteLink
            to={["concept", "kernel"]}
            label={["How the kernel checks a proof: Concept ▸ How Lean checks", "核心如何檢查證明：概念 ▸ Lean 如何檢查"]}
          />
        </p>
        <Sources
          items={[
            {
              label: "Lean Language Reference: Validating a Lean Proof",
              url: "https://lean-lang.org/doc/reference/latest/ValidatingProofs/",
            },
          ]}
        />
      </Section>

      <Section page="limits" id="comparator" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "On Formalizer's harder problems a solution is judged by **Comparator**, a tool from the Lean developers. You give it a *challenge* file (the statement, with `sorry`), a *solution* file, the names of the theorems, and the list of permitted axioms. It then:",
            "Formalizer 較難的題目會用 **Comparator** 來評判，這是 Lean 開發團隊做的工具。你給它一個*題目*檔（陳述，證明寫 `sorry`）、一個*解答*檔、定理名稱，以及允許的公理清單。接著它會：",
          ]}
        />
        <List
          ordered
          items={[
            [
              "builds both files inside a **sandbox**, because building a Lean file can run arbitrary code and the solution is not trusted;",
              "在**沙盒**裡建置兩個檔案，因為建置 Lean 檔案可以執行任意程式碼，而解答是不被信任的；",
            ],
            [
              "checks that each theorem in the solution has **exactly the same statement** as in the challenge, down to every definition the statement uses, so a solution cannot quietly prove an easier statement or redefine a word;",
              "檢查解答裡每個定理的陳述和題目**完全相同**，連陳述用到的每個定義都要一致，所以解答不能偷偷證一個比較簡單的陳述，或重新定義某個詞；",
            ],
            [
              "checks that the proofs use **only the permitted axioms** (on Formalizer: `propext`, `Quot.sound`, `Classical.choice`);",
              "檢查證明**只用了允許的公理**（在 Formalizer 上是 `propext`、`Quot.sound`、`Classical.choice`）；",
            ],
            [
              "replays the solution through the Lean kernel, and optionally through independent external kernels as well.",
              "把解答交給 Lean 核心重新檢查一遍，也可以選擇再交給獨立的外部核心檢查。",
            ],
          ]}
        />
        <P
          t={[
            'What Comparator **cannot** do is say whether the challenge statement is the right one. If the challenge misstates a theorem from a paper (a missing hypothesis, a wrong definition, a junk value in the wrong place), Comparator will happily confirm a proof of the wrong thing. Someone has to read the challenge statement next to the paper and agree that they say the same thing. Its own documentation lists "no human error in the challenge statement" among the things it assumes.',
            "Comparator **做不到**的，是判斷題目的陳述本身對不對。如果題目把論文裡的定理寫錯了（少了前提、定義錯了、垃圾值出現在不該出現的地方），Comparator 照樣會確認一個證錯東西的證明。必須有人把題目陳述和論文並排讀過，確認兩者說的是同一件事。它自己的文件也把「題目陳述沒有人為錯誤」列為前提之一。",
          ]}
        />
        <Callout kind="tip" title={["The division of labour", "分工"]}>
          <P
            t={[
              "Machines check the proof; people check the statement. That is why a good formal statement is short, uses standard definitions, and comes with a few sanity-check examples.",
              "機器檢查證明，人檢查陳述。這也是為什麼好的形式化陳述要短、用標準定義，並附上幾個合理性檢查的例子。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            { label: "leanprover/comparator (GitHub)", url: "https://github.com/leanprover/comparator" },
            {
              label: "Lean Language Reference: Validating a Lean Proof",
              url: "https://lean-lang.org/doc/reference/latest/ValidatingProofs/",
            },
          ]}
        />
      </Section>

      <Section page="limits" id="godel" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            "There is also a limit no tool can remove. In 1931 Kurt Gödel showed that any consistent system of axioms strong enough to do ordinary arithmetic has **true statements it cannot prove**, and that such a system cannot prove its own consistency. Lean is such a system, so some true statements about numbers have no proof in Lean.",
            "還有一個任何工具都消除不了的限度。1931 年，哥德爾（Kurt Gödel）證明了：任何不自相矛盾、又強到能做一般算術的公理系統，都有**真的卻證不出來的陳述**，而且這樣的系統無法證明自己不矛盾。Lean 就是這樣的系統，所以有些關於數的真命題在 Lean 裡沒有證明。",
          ]}
        />
        <P
          t={[
            "In practice this almost never gets in the way. The statements Gödel's theorem produces are specially constructed, and the mathematics people actually work on, including every problem on this site, is far inside what Lean's axioms can reach. When a proof is hard to find, the reason is that it is hard, not that it does not exist.",
            "實際上這幾乎從不礙事。哥德爾定理造出來的陳述是特別構造的，而大家實際在做的數學，包括本站所有題目，都遠在 Lean 公理能觸及的範圍之內。證明難找，是因為它難，而不是因為它不存在。",
          ]}
        />
        <TryIn ids={["gauss"]} />
        <Sources
          items={[
            {
              label: "Wikipedia: Gödel's incompleteness theorems",
              url: "https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems",
            },
          ]}
        />
      </Section>
    </Page>
  );
}
