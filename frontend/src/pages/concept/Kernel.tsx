/** Concept ▸ How Lean checks (#/concept/kernel[/<section>]). Lean code: lean/Formalizer/Pages/Kernel.lean. */
import { useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, snippet, Sources, Table, TryIn, type L, type SectionInfo } from "../kit";

const PAGE = "kernel";

const SECTIONS: SectionInfo[] = [
  { id: "pipeline", title: ["From Run to the green check", "從按下 Run 到綠色勾勾"] },
  { id: "elaboration", title: ["Parsing and elaboration: filling in what you left out", "解析與精煉（elaboration）：補上你省略的部分"] },
  { id: "terms", title: ["Tactics write a proof term", "戰術寫出一個證明項"] },
  { id: "kernel", title: ["The kernel: the only part you have to trust", "核心（kernel）：唯一需要信任的部分"] },
  { id: "axioms", title: ["Axioms: what a proof rests on", "公理：證明的根基"] },
  { id: "runner", title: [".olean files, Mathlib's cache and the local runner", ".olean 檔、Mathlib 的快取與本機執行器"] },
  { id: "recheck", title: ["Checking the checker", "檢查檢查者"] },
];

/** What Lean printed for a snippet (pasted from a real run on Lean v4.34.1). */
function Output({ text }: { text: string }) {
  const { pick } = useLang();
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <p className="border-b border-gray-200 px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
        {pick(["Lean prints", "Lean 輸出"])}
      </p>
      <pre className="overflow-x-auto px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre text-gray-800">{text}</pre>
    </div>
  );
}

/** One box of a diagram: a title and up to two lines under it. */
function Box({
  x,
  y,
  w,
  h,
  title,
  lines = [],
  tone = "plain",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines?: string[];
  tone?: "plain" | "accent" | "muted";
}) {
  const box =
    tone === "accent" ? "fill-teal-50 stroke-teal-600" : tone === "muted" ? "fill-gray-100 stroke-gray-300" : "fill-white stroke-gray-400";
  const top = y + h / 2 - (lines.length * 13) / 2 + 4;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} className={box} strokeWidth={1.4} />
      <text x={x + w / 2} y={top} textAnchor="middle" className="fill-gray-900 text-[12.5px] font-semibold">
        {title}
      </text>
      {lines.map((t, i) => (
        <text key={i} x={x + w / 2} y={top + 15 + i * 13} textAnchor="middle" className="fill-gray-500 text-[10.5px]">
          {t}
        </text>
      ))}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  dashed?: boolean;
}) {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="stroke-gray-500"
        strokeWidth={1.5}
        strokeDasharray={dashed ? "4 3" : undefined}
        markerEnd="url(#kernel-arrow)"
      />
      {label && (
        <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 6} textAnchor="middle" className="fill-gray-500 font-mono text-[10px]">
          {label}
        </text>
      )}
    </g>
  );
}

function ArrowHead() {
  return (
    <defs>
      <marker id="kernel-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" className="fill-gray-500" />
      </marker>
    </defs>
  );
}

/** Text → syntax → elaborated term → kernel → environment, with the trusted part marked. */
function PipelineFigure() {
  const { pick } = useLang();
  return (
    <svg
      viewBox="0 0 680 250"
      className="w-full max-w-[680px]"
      role="img"
      aria-label={pick(["Lean's checking pipeline", "Lean 的檢查流程"])}
    >
      <ArrowHead />
      <Box x={8} y={40} w={110} h={64} title={pick(["Your file", "你的檔案"])} lines={[pick(["plain text", "純文字"])]} />
      <Box x={150} y={40} w={110} h={64} title={pick(["Parser", "解析器"])} lines={[pick(["text → syntax", "文字 → 語法樹"])]} />
      <Box
        x={292}
        y={28}
        w={150}
        h={88}
        title={pick(["Elaborator", "精煉器"])}
        lines={[pick(["notation, implicit args,", "記號、隱式參數、"]), pick(["type classes, tactics", "型別類別、戰術"])]}
      />
      <rect x={474} y={8} width={128} height={128} rx={12} className="fill-none stroke-teal-600" strokeWidth={1.2} strokeDasharray="5 4" />
      <text x={538} y={26} textAnchor="middle" className="fill-teal-700 text-[10.5px] font-semibold">
        {pick(["trusted", "需要信任"])}
      </text>
      <Box x={486} y={40} w={104} h={64} title={pick(["Kernel", "核心"])} lines={[pick(["checks the term", "檢查證明項"])]} tone="accent" />
      <circle cx={652} cy={72} r={17} className="fill-green-600" />
      <path d="M643,72 l6,6.5 l11,-12" className="fill-none stroke-white" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <Arrow x1={118} y1={72} x2={148} y2={72} />
      <Arrow x1={260} y1={72} x2={290} y2={72} />
      <Arrow x1={442} y1={72} x2={484} y2={72} label={pick(["term", "證明項"])} />
      <Arrow x1={590} y1={72} x2={633} y2={72} />
      <text x={367} y={16} textAnchor="middle" className="fill-gray-500 text-[10.5px]">
        {pick(["large, clever, extensible: may have bugs", "龐大、聰明、可擴充：可能有 bug"])}
      </text>
      <Box
        x={150}
        y={176}
        w={452}
        h={60}
        title={pick(["Environment: everything already checked", "環境：所有已檢查過的東西"])}
        lines={[
          pick([
            "definitions and theorems loaded from .olean files (Init, Mathlib, …)",
            "從 .olean 檔載入的定義與定理（Init、Mathlib 等）",
          ]),
        ]}
        tone="muted"
      />
      <Arrow x1={367} y1={176} x2={367} y2={118} dashed />
      <Arrow x1={538} y1={176} x2={538} y2={106} dashed />
      <text x={652} y={112} textAnchor="middle" className="fill-gray-600 text-[10.5px]">
        {pick(["added", "加入環境"])}
      </text>
    </svg>
  );
}

/** Browser → localhost runner → pool of warm REPL processes. */
function RunnerFigure() {
  const { pick } = useLang();
  return (
    <svg
      viewBox="0 0 640 220"
      className="w-full max-w-[640px]"
      role="img"
      aria-label={pick(["Formalizer's local runner", "Formalizer 的本機執行器"])}
    >
      <ArrowHead />
      <rect x={2} y={8} width={636} height={204} rx={12} className="fill-none stroke-gray-400" strokeWidth={1.2} strokeDasharray="5 4" />
      <text x={320} y={26} textAnchor="middle" className="fill-gray-500 text-[11px] font-semibold">
        {pick(["your computer: nothing leaves it", "你的電腦：什麼都不會送出去"])}
      </text>
      <Box x={14} y={78} w={124} h={64} title={pick(["Problem page", "題目頁"])} lines={[pick(["in your browser", "在你的瀏覽器裡"])]} />
      <Box
        x={220}
        y={70}
        w={170}
        h={80}
        title={pick(["Runner", "執行器"])}
        lines={["localhost:8790", pick(["keeps the statement, adds", "確認陳述沒變、加上"]), "#print axioms"]}
      />
      {[0, 1].map((i) => (
        <Box
          key={i}
          x={426}
          y={44 + i * 76}
          w={196}
          h={60}
          title={pick([`Lean REPL worker ${i + 1}`, `Lean REPL 工作程序 ${i + 1}`])}
          lines={[pick(["started once, header loaded", "啟動一次、載入開頭"])]}
          tone="accent"
        />
      ))}
      <Arrow x1={138} y1={104} x2={218} y2={104} label="/api/check" />
      <Arrow x1={218} y1={118} x2={138} y2={118} />
      <Arrow x1={390} y1={100} x2={424} y2={78} />
      <Arrow x1={390} y1={120} x2={424} y2={148} />
    </svg>
  );
}

const OUT_ELABORATE = `1 + 2 : Nat
@HAdd.hAdd Nat Nat Nat (@instHAdd Nat instAddNat) (@OfNat.ofNat Nat (nat_lit 1) (instOfNatNat (nat_lit 1)))
  (@OfNat.ofNat Nat (nat_lit 2) (instOfNatNat (nat_lit 2))) : Nat`;

const OUT_IMPLICIT = `@List.length : {α : Type u_1} → List α → Nat
@List.length Nat
  (@List.cons Nat (@OfNat.ofNat Nat (nat_lit 1) (instOfNatNat (nat_lit 1)))
    (@List.cons Nat (@OfNat.ofNat Nat (nat_lit 2) (instOfNatNat (nat_lit 2)))
      (@List.cons Nat (@OfNat.ofNat Nat (nat_lit 3) (instOfNatNat (nat_lit 3))) (@List.nil Nat)))) : Nat`;

const OUT_TERM = `theorem Formalizer.Pages.Kernel.and_swap : ∀ (p q : Prop), p ∧ q → q ∧ p :=
fun p q h => And.casesOn h fun hp hq => ⟨hq, hp⟩`;

const OUT_SHOW = `Try this:
  [apply] exact ⟨hp, hq⟩`;

const OUT_SMALL = `theorem Formalizer.Pages.Kernel.small : 10 < 20 :=
of_decide_eq_true (id (Eq.refl true))`;

const OUT_AXIOMS = `'Formalizer.Pages.Kernel.two_two' does not depend on any axioms
'Formalizer.Pages.Kernel.pe' depends on axioms: [propext]
'Formalizer.Pages.Kernel.em'' depends on axioms: [propext, Classical.choice, Quot.sound]
'Formalizer.Pages.Kernel.todo' depends on axioms: [sorryAx]`;

const AXIOM_ROWS: (readonly [L, L])[] = [
  [
    ["`propext`", "`propext`"],
    [
      "Two statements that imply each other are equal: from `a ↔ b` you get `a = b`. Used all the time by `simp`.",
      "互相蘊含的兩個陳述相等：由 `a ↔ b` 得到 `a = b`。`simp` 經常用到。",
    ],
  ],
  [
    ["`Quot.sound`", "`Quot.sound`"],
    [
      'Things that are declared equivalent become equal once you pass to the quotient ("glue equivalent things together"). It is also what makes `funext` (two functions with the same values are equal) a theorem.',
      "宣告為等價的東西，取商之後就相等（「把等價的東西黏在一起」）。`funext`（每一點取值都相同的兩個函數相等）也是靠它證出來的。",
    ],
  ],
  [
    ["`Classical.choice`", "`Classical.choice`"],
    [
      'From "there is some x" you may pick one, without saying how. It gives the law of excluded middle (`p ∨ ¬p` for every `p`), the backbone of proof by contradiction.',
      "從「存在某個 x」就能挑出一個，而不必說怎麼挑。排中律（任何 `p` 都有 `p ∨ ¬p`）由它而來，這是反證法的基礎。",
    ],
  ],
  [
    ["`sorryAx` (not allowed)", "`sorryAx`（不允許）"],
    [
      'What `sorry` turns into: "trust me, this holds". It proves anything, so a proof that uses it is not finished.',
      "`sorry` 背後的東西：「相信我，這成立」。它能證明任何事，所以用到它的證明還沒完成。",
    ],
  ],
];

export default function KernelConcept({ section }: { section: string | null }) {
  let n = 0;
  return (
    <Page
      id={PAGE}
      title={["How Lean checks", "Lean 如何檢查"]}
      intro={[
        "You press **Run**, and a second later the problem page shows a green check or a red error. This page follows your proof through Lean on the way: how your text becomes a precise mathematical object, which part of Lean actually decides whether it is a proof, what a proof is allowed to assume, and how Formalizer runs all of this on your own computer.",
        "按下 **Run**，一秒後題目頁顯示綠色勾勾或紅色錯誤。這一頁跟著你的證明走一趟 Lean：你寫的文字怎麼變成精確的數學物件、Lean 裡真正決定「這是不是證明」的是哪一部分、證明可以假設什麼，以及 Formalizer 怎麼在你自己的電腦上完成這一切。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="pipeline" n={++n} title={SECTIONS[0].title}>
        <P
          t={[
            "Lean reads your file one command at a time (`theorem`, `def`, `#check`, …). Each command goes through the same stations, and only when the last one agrees is it added to the collection of facts later commands may use.",
            "Lean 一次讀檔案裡的一個指令（`theorem`、`def`、`#check` 等）。每個指令都經過同樣幾站，只有最後一站點頭，它才會被加入後面指令可以使用的事實集合。",
          ]}
        />
        <Figure
          caption={[
            "The pipeline for one command. Everything left of the dashed box helps you *write* a proof; only the kernel inside it decides whether it *is* one.",
            "一個指令的流程。虛線框左邊的一切都在幫你 *寫出* 證明；只有框裡的核心決定它 *是不是* 證明。",
          ]}
        >
          <PipelineFigure />
        </Figure>
        <List
          ordered
          items={[
            [
              "**Parsing.** The text is cut into a tree of syntax: which part is the statement, which is the proof, where each tactic begins and ends. A typo or a missing `:=` stops here.",
              "**解析。** 文字被切成一棵語法樹：哪裡是陳述、哪裡是證明、每個戰術從哪裡開始到哪裡結束。打錯字或少了 `:=` 會在這裡就停下來。",
            ],
            [
              "**Elaboration.** The syntax is turned into a fully explicit *term*: every hidden argument and every type is filled in, and your tactics run here, one by one, building the proof term piece by piece. Almost every error you will see (type mismatch, unsolved goals, unknown identifier) comes from this step.",
              "**精煉（elaboration）。** 語法被轉成完全明確的 *項*（term）：每個隱藏的參數、每個型別都補齊，你的戰術也在這裡一個個執行，一塊塊拼出證明項。你會遇到的錯誤（型別不符、目標未解決、找不到名稱）幾乎都來自這一步。",
            ],
            [
              "**The kernel.** A small, separate type checker receives the finished term and checks it against the statement, with no tactics and no shortcuts. If it agrees, the theorem joins the *environment* and you get the green check.",
              "**核心（kernel）。** 一個小而獨立的型別檢查器收到完成的項，拿它和陳述對照檢查，沒有戰術也沒有捷徑。它同意了，定理才加入 *環境*，你才看到綠色勾勾。",
            ],
          ]}
        />
        <Sources
          items={[
            {
              label: "de Moura & Ullrich, The Lean 4 Theorem Prover and Programming Language (CADE 2021)",
              url: "https://doi.org/10.1007/978-3-030-79876-5_37",
            },
            { label: "Theorem Proving in Lean 4", url: "https://lean-lang.org/theorem_proving_in_lean4/" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="elaboration" n={++n} title={SECTIONS[1].title}>
        <P
          t={[
            "Written mathematics leaves a lot unsaid, and so does Lean code. When you write `1 + 2`, you don't say which `+` you mean (on natural numbers? integers? matrices?) or what kind of thing `1` is. The elaborator works it out. `#check` shows the short form; with the option `pp.explicit` Lean shows what it really built:",
            "數學寫作省略了很多東西，Lean 程式碼也一樣。寫 `1 + 2` 時，你沒說是哪一種 `+`（自然數？整數？矩陣？），也沒說 `1` 是什麼東西。精煉器會把這些推出來。`#check` 顯示簡短的寫法；打開 `pp.explicit` 選項，Lean 就會顯示它真正建出來的東西：",
          ]}
        />
        <Lean code={snippet("Kernel", "elaborate")} />
        <Output text={OUT_ELABORATE} />
        <P
          t={[
            'Three things were filled in. The **notation** `+` became the function `HAdd.hAdd`. The **types** `Nat Nat Nat` were inferred from the `: Nat` you wrote. And an **instance** `instHAdd Nat instAddNat` was found by *type class* search: a lookup table of "how to add natural numbers", "how to compare integers", and so on, which Lean consults whenever an operation needs one. Even the numerals `1` and `2` went through it (`OfNat.ofNat`).',
            "補上的東西有三種。**記號** `+` 變成函數 `HAdd.hAdd`。**型別** `Nat Nat Nat` 從你寫的 `: Nat` 推出來。還有一個 **實例** `instHAdd Nat instAddNat`，是靠 *型別類別*（type class）搜尋找到的：那像是一張查詢表，記著「自然數怎麼相加」、「整數怎麼比大小」等等，運算需要時 Lean 就去查。連數字 `1` 和 `2` 也經過這一步（`OfNat.ofNat`）。",
          ]}
        />
        <P
          t={[
            "**Implicit arguments** are the curly-brace arguments in a signature. `List.length` works for lists of anything, so it takes the kind of element `α` as an argument, but in braces `{α : …}`: you never write it, the elaborator reads it off the list you pass.",
            "**隱式參數** 是簽名裡用大括號寫的參數。`List.length` 適用於任何東西的串列，所以它把元素的種類 `α` 當成參數，但放在大括號 `{α : …}` 裡：你從來不用寫，精煉器會從你傳進去的串列看出來。",
          ]}
        />
        <Lean code={snippet("Kernel", "implicit")} />
        <Output text={OUT_IMPLICIT} />
        <Callout kind="tip" title={["Why this matters for errors", "這對錯誤訊息有什麼影響"]}>
          <P
            t={[
              "When Lean says *type mismatch* about two things that look identical on screen, they usually differ in something the elaborator filled in: a hidden type (`Nat` against `Int`) or an instance. Turning on `set_option pp.explicit true in` before the command shows the difference.",
              "當 Lean 說兩個在畫面上看起來一模一樣的東西 *型別不符*，差別通常在精煉器補上的部分：某個隱藏的型別（`Nat` 和 `Int`）或某個實例。在指令前加上 `set_option pp.explicit true in`，差別就看得到了。",
            ]}
          />
          <SiteLink to={["skills", "errors"]} label={["Reading Lean's errors", "看懂 Lean 的錯誤訊息"]} />
        </Callout>
      </Section>

      <Section page={PAGE} id="terms" n={++n} title={SECTIONS[2].title}>
        <P
          t={[
            "In Lean a proof is not a list of steps: it is a *term*, an expression like a program, whose type is the statement it proves. Tactics are a convenient way to write that term without typing it out. Each tactic fills in a piece, leaving holes (the goals you see in the panel) for the next ones. When no holes are left, the term is complete. `#print` shows the term a tactic proof produced:",
            "在 Lean 裡，證明不是一串步驟，而是一個 *項*：一個像程式一樣的運算式，它的型別就是它所證明的陳述。戰術是一種方便的寫法，讓你不必親手打出整個項。每個戰術填上一塊，留下空洞（就是面板上看到的目標）給後面的戰術。空洞都填滿了，項就完成了。`#print` 會顯示戰術證明產生的項：",
          ]}
        />
        <Lean code={snippet("Kernel", "tactic-term")} />
        <Output text={OUT_TERM} />
        <P
          t={[
            "Read it as a recipe: given `p`, `q` and a proof `h` of `p ∧ q`, take `h` apart into `hp` and `hq` (that was `obtain`), then put them back together in the other order (that was `exact`). The tactic names are gone; only the term is kept, and only the term is checked.",
            "把它當成食譜來讀：給定 `p`、`q` 和 `p ∧ q` 的證明 `h`，把 `h` 拆成 `hp` 和 `hq`（這是 `obtain` 做的），再用相反的順序組回去（這是 `exact` 做的）。戰術的名字都不見了；留下來的只有項，被檢查的也只有項。",
          ]}
        />
        <P
          t={[
            "`show_term` does the same for a single tactic while you write: it runs the tactic and suggests the term it made.",
            "`show_term` 則是在你寫的時候，對單一戰術做同樣的事：執行戰術，並提示它產生的項。",
          ]}
        />
        <Lean code={snippet("Kernel", "show-term")} />
        <Output text={OUT_SHOW} />
        <P
          t={[
            "Powerful tactics such as `simp` or `omega` can write very long terms, thousands of steps you never see. That is fine: you don't have to read them, because the kernel will.",
            "像 `simp` 或 `omega` 這種強大的戰術，可能寫出非常長的項，有成千上萬步是你看不到的。這沒關係：你不必讀它們，因為核心會讀。",
          ]}
        />
        <TryIn ids={["even-sum", "cases-or"]} />
      </Section>

      <Section page={PAGE} id="kernel" n={++n} title={SECTIONS[3].title}>
        <P
          t={[
            "The elaborator is large and clever, and anyone can extend it: Mathlib alone adds a great many tactics of its own. Large, clever code has bugs. So Lean does not trust it. The term it produces goes to the **kernel**, a separate and deliberately small type checker that knows nothing about tactics, notation or type classes. It only checks that each piece of the term fits the next, by a short list of fixed rules, and that the whole term has exactly the type of the statement.",
            "精煉器龐大又聰明，而且誰都能擴充它：光是 Mathlib 就自己加了大量戰術。龐大又聰明的程式碼一定有 bug。所以 Lean 不信任它。它產生的項會交給 **核心**：一個獨立、刻意保持小巧的型別檢查器，它對戰術、記號、型別類別一無所知，只依照一小組固定規則，檢查項的每一塊是否接得上，以及整個項的型別是否正好是陳述。",
          ]}
        />
        <Callout kind="note" title={["The de Bruijn criterion", "de Bruijn 準則"]}>
          <P
            t={[
              "A proof assistant should produce proofs that a small, simple checker can verify on its own. Then you only have to trust that checker, not the tactics, not the automation, not whoever (or whatever, such as an AI) wrote the proof. A buggy tactic can fail to find a proof or build a wrong term, but the kernel will reject the wrong term. The idea is named after N. G. de Bruijn, whose Automath system (1967) worked this way.",
              "證明輔助工具應該產生能由一個小而簡單的檢查器單獨驗證的證明。這樣你只需要信任那個檢查器，不必信任戰術、自動化工具，也不必信任寫出證明的人（或是 AI 之類的東西）。有 bug 的戰術可能找不到證明，或是建出錯誤的項，但錯誤的項會被核心拒絕。這個想法以 N. G. de Bruijn 命名，他的 Automath 系統（1967）就是這樣運作的。",
            ]}
          />
        </Callout>
        <P
          t={[
            'Checking sometimes means **computing**. Many statements about concrete numbers are proved by letting the kernel evaluate both sides. `rfl` says "both sides compute to the same value". `decide` asks a built-in yes/no procedure, and the kernel runs it to confirm the answer is `true`:',
            "檢查有時就是 **計算**。很多關於具體數字的陳述，是讓核心把兩邊算出來而證明的。`rfl` 的意思是「兩邊算出來是同一個值」。`decide` 則交給一個內建的是非判定程序，由核心執行它，確認答案是 `true`：",
          ]}
        />
        <Lean code={snippet("Kernel", "by-computation")} />
        <Output text={OUT_SMALL} />
        <P
          t={[
            'The whole proof of `10 < 20` is `Eq.refl true`: "`true` equals `true`", which only works because the kernel computed the decision procedure down to `true`. The kernel has built-in fast arithmetic for natural numbers, so `big` is checked instantly too. If the statement is false, the computation says so:',
            "`10 < 20` 的整個證明就是 `Eq.refl true`：「`true` 等於 `true`」。這之所以成立，是因為核心把判定程序算到了 `true`。核心內建了自然數的快速算術，所以 `big` 也一下子就檢查完了。陳述若是錯的，計算會告訴你：",
          ]}
        />
        <Lean code={"theorem wrong : 2 + 2 = 5 := by decide"} fails />
        <Output
          text={`error: Tactic \`decide\` proved that the proposition
  2 + 2 = 5
is false`}
        />
        <Callout kind="warn" title={["`native_decide` trusts more", "`native_decide` 需要信任更多"]}>
          <P
            t={[
              "`native_decide` looks like `decide` but runs the computation as compiled machine code instead of in the kernel. It is faster, but the kernel no longer sees the computation, so you also trust the compiler. Lean records this as an extra axiom (`#print axioms` lists one named after the theorem, ending in `native_decide.ax_1_1`), and Formalizer's runner does not accept it as a finished proof.",
              "`native_decide` 看起來和 `decide` 很像，但它把計算交給編譯好的機器碼執行，而不是在核心裡算。這樣比較快，但核心看不到那段計算，所以你還得信任編譯器。Lean 會把這記成一條額外的公理（`#print axioms` 會列出一條以定理命名、結尾是 `native_decide.ax_1_1` 的公理），Formalizer 的執行器不會把它當成完成的證明。",
            ]}
          />
        </Callout>
        <TryIn ids={["hello", "check-cases", "reverse-twice"]} />
        <Sources
          items={[
            { label: "Type Checking in Lean 4 (a book about the kernel)", url: "https://ammkrn.github.io/type_checking_in_lean4/" },
            { label: "Theorem Proving in Lean 4", url: "https://lean-lang.org/theorem_proving_in_lean4/" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="axioms" n={++n} title={SECTIONS[4].title}>
        <P
          t={[
            "Every proof eventually rests on things accepted without proof: **axioms**. The kernel's rules are one part; on top of them, ordinary mathematics in Lean uses just three axioms, and all of Mathlib is built on them. You can ask which axioms a theorem uses, following every lemma it depends on, all the way down:",
            "每個證明最終都建立在不經證明就接受的東西上：**公理**。核心的規則是其中一部分；在此之上，Lean 裡的一般數學只用到三條公理，整個 Mathlib 都建立在它們上面。你可以問一個定理用了哪些公理，Lean 會順著它依賴的每個引理一路往下追：",
          ]}
        />
        <Lean code={snippet("Kernel", "axioms")} />
        <Output text={OUT_AXIOMS} />
        <Table
          head={[
            ["Axiom", "公理"],
            ["What it says", "它說了什麼"],
          ]}
          rows={AXIOM_ROWS}
        />
        <P
          t={[
            "`two_two` needs no axiom at all: it is pure computation. `em'` (excluded middle) needs all three. `todo` still has a `sorry`, and it shows: `sorryAx` is in its list.",
            "`two_two` 完全不需要公理：它是純粹的計算。`em'`（排中律）三條都要。`todo` 裡還有 `sorry`，於是 `sorryAx` 出現在它的清單裡。",
          ]}
        />
        <Callout kind="warn" title={["Anyone can write `axiom`", "誰都能寫 `axiom`"]}>
          <P
            t={[
              "The command `axiom cheat : 1 = 2` is accepted by Lean without complaint, and from it anything follows. The kernel cannot stop this: an axiom is, by definition, not checked. That is why the statement alone is not enough, and why the axiom list is part of every check. When you press Run, Formalizer appends `#print axioms` for the problem's theorem and shows the green check only if the list contains nothing beyond `propext`, `Quot.sound` and `Classical.choice`. With `sorryAx` you get *incomplete*; with any other axiom, an error.",
              "指令 `axiom cheat : 1 = 2` 會被 Lean 照單全收，而從它可以推出任何東西。核心擋不住這件事：公理的定義就是不經檢查。所以光看陳述是不夠的，公理清單也是每次檢查的一部分。按下 Run 時，Formalizer 會替題目的定理加上 `#print axioms`，只有清單裡除了 `propext`、`Quot.sound`、`Classical.choice` 之外什麼都沒有，才給綠色勾勾。有 `sorryAx` 的話顯示 *未完成*；有其他任何公理則是錯誤。",
            ]}
          />
        </Callout>
        <SiteLink to={["skills", "verify"]} label={["Making sure a proof is really done", "確認證明真的完成"]} />
        <Sources
          items={[
            {
              label: "Theorem Proving in Lean 4: Axioms and Computation",
              url: "https://lean-lang.org/theorem_proving_in_lean4/Axioms-and-Computation/",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="runner" n={++n} title={SECTIONS[5].title}>
        <P
          t={[
            "Checking a file is fast, but only because the things it imports have been checked already. When Lean finishes a file it saves the result, every definition and theorem as an elaborated, kernel-checked term, in a compiled **.olean** file. The next file that writes `import` loads that .olean directly instead of checking it all over again. Core Lean ships with the .olean files of its own library.",
            "檢查一個檔案很快，但前提是它匯入的東西都已經檢查過了。Lean 檢查完一個檔案，會把結果（每個定義和定理，都已精煉並通過核心檢查）存進一個編譯好的 **.olean** 檔。下一個寫 `import` 的檔案直接載入那個 .olean，不必全部重新檢查。Lean 本身就附帶了自己函式庫的 .olean 檔。",
          ]}
        />
        <P
          t={[
            "Mathlib is far bigger, with thousands of files. Building it from source on a laptop takes hours, so you normally don't: the Mathlib project builds it once on its servers for each version, and running `lake exe cache get` in a project that uses Mathlib downloads the ready .olean files (several GB) instead. Formalizer's Full runner gets its Mathlib the same way.",
            "Mathlib 大得多，有好幾千個檔案。在筆電上從原始碼建置要好幾個小時，所以通常不這樣做：Mathlib 專案在伺服器上為每個版本建置一次，在使用 Mathlib 的專案裡執行 `lake exe cache get`，就能直接下載建好的 .olean 檔（好幾 GB）。Formalizer 的 Full 執行器就是這樣取得 Mathlib 的。",
          ]}
        />
        <P
          t={[
            "**Formalizer's runner.** Proofs are checked on your own computer; nothing is sent to a server. The runner is a small program you start once (`pixi run runner`); it listens at `localhost:8790`, and the problem page talks to it from your browser. Starting Lean and loading its libraries takes seconds (with Mathlib, several GB of .olean files), far too slow to do on every Run. So the runner keeps a **pool of warm Lean processes**: each one is a Lean REPL that is started once, loads its header (`import Mathlib` on the Full runner), and then checks one submission after another against that loaded environment.",
            "**Formalizer 的執行器。** 證明在你自己的電腦上檢查，不會送到任何伺服器。執行器是一個你啟動一次（`pixi run runner`）的小程式，在 `localhost:8790` 等候，題目頁從你的瀏覽器和它溝通。啟動 Lean 並載入函式庫要花好幾秒（有 Mathlib 的話要載入好幾 GB 的 .olean 檔），每次按 Run 都重來就太慢了。所以執行器維持一個 **預熱好的 Lean 程序池**：每個程序都是一個 Lean REPL，只啟動一次，載入開頭（Full 執行器是 `import Mathlib`），之後就在這個已載入的環境裡一份接一份地檢查提交的證明。",
          ]}
        />
        <Figure
          caption={[
            "Formalizer's runner: everything inside the dashed box runs on your machine. Two warm workers by default.",
            "Formalizer 的執行器：虛線框裡的一切都在你的電腦上執行。預設有兩個預熱好的工作程序。",
          ]}
        >
          <RunnerFigure />
        </Figure>
        <List
          items={[
            [
              "Before Lean sees your code, the runner checks that the problem's statement is still there unchanged: proving an easier statement doesn't count.",
              "在 Lean 看到你的程式碼之前，執行器先確認題目的陳述原封不動：證明一個比較簡單的陳述不算數。",
            ],
            [
              "It appends `#print axioms` for the problem's theorem, sends the file to a free worker, and turns Lean's reply into what you see: errors, the goals left at each `sorry`, and the verdict (*proved*, *incomplete* or *error*).",
              "它替題目的定理加上 `#print axioms`，把檔案交給一個空閒的工作程序，再把 Lean 的回覆整理成你看到的樣子：錯誤、每個 `sorry` 處剩下的目標，以及判定（*已證明*、*未完成* 或 *錯誤*）。",
            ],
            [
              "Each check has a time limit (10 s by default). A worker that runs past it, or crashes, is killed and replaced; only that one request is lost.",
              "每次檢查都有時間限制（預設 10 秒）。超時或當掉的工作程序會被終止並換一個新的；只會影響那一次請求。",
            ],
            [
              "A worker is retired after a number of checks (30 by default) and a fresh one started, so memory never piles up.",
              "工作程序檢查了一定次數（預設 30 次）之後就退休、換一個新的，記憶體才不會越積越多。",
            ],
          ]}
        />
        <Sources
          items={[
            { label: "Mathlib 4 (README: getting the cache)", url: "https://github.com/leanprover-community/mathlib4" },
            { label: "leanprover-community/repl", url: "https://github.com/leanprover-community/repl" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="recheck" n={++n} title={SECTIONS[6].title}>
        <P
          t={[
            "The kernel is small, but it is still a program, and the elaborator runs in the same process: in principle a malicious or buggy extension could slip something into the environment without the kernel ever seeing it. For results that matter, proofs are checked again, by separate tools:",
            "核心雖小，終究也是一支程式，而且精煉器和它跑在同一個程序裡：理論上，惡意或有 bug 的擴充功能可能把東西偷偷塞進環境，而核心從頭到尾沒看過。對於重要的結果，證明會再由獨立的工具檢查一次：",
          ]}
        />
        <List
          items={[
            [
              "**lean4checker** reloads the compiled .olean files and replays every declaration through the kernel again, in a fresh process with no tactics or extensions loaded. Since Lean v4.28.0 it ships with every Lean toolchain as `leanchecker` (run `lake env leanchecker` in a project).",
              "**lean4checker** 重新載入編譯好的 .olean 檔，在一個沒有載入任何戰術或擴充功能的全新程序裡，把每個宣告再交給核心檢查一遍。從 Lean v4.28.0 起，它以 `leanchecker` 的名字隨每個 Lean 工具鏈發布（在專案裡執行 `lake env leanchecker`）。",
            ],
            [
              "**lean4export** writes the declarations out in a plain text format, and **nanoda** is a second kernel, written independently in Rust, that type-checks that export. A bug would have to be in both kernels, in the same way, to let a false proof through.",
              "**lean4export** 把宣告輸出成純文字格式，**nanoda** 則是用 Rust 獨立寫成的第二個核心，負責對這份輸出做型別檢查。錯誤的證明要能過關，兩個核心得在同一個地方有同樣的 bug。",
            ],
            [
              "**Comparator**, from the Lean FRO, puts it together for a proof you didn't write (a contest entry, an AI's output): inside a sandbox it checks that the solution proves *exactly* the fixed challenge statement, uses only the three standard axioms, and is accepted by Lean's kernel, optionally by nanoda as well. From Lean v4.35.0 the same checks are built into Lean's build tool as `lake comparator` and `lake check`. Formalizer's hardest problems, the research-level ones, are Comparator challenges.",
              "Lean FRO 的 **Comparator** 把這些組合起來，用來檢查不是你寫的證明（比賽作品、AI 的產出）：它在沙盒裡確認解答證明的 *正是* 固定的挑戰陳述、只用了三條標準公理，並被 Lean 的核心接受，也可以選擇再交給 nanoda 檢查。從 Lean v4.35.0 起，同樣的檢查已併入 Lean 的建置工具，成為 `lake comparator` 與 `lake check`。Formalizer 最難的研究級題目，就是 Comparator 挑戰。",
            ],
          ]}
        />
        <P
          t={[
            "Put together, the chain of trust is short: the kernel's rules (checked twice, by two independent programs), three axioms, and a statement you read yourself. Everything else, however long, can be wrong without harm, because it will be caught.",
            "整理起來，信任的鏈條很短：核心的規則（由兩個獨立程式各檢查一次）、三條公理，以及一個你自己讀過的陳述。其餘的一切，不管多長，錯了也無妨，因為一定會被抓到。",
          ]}
        />
        <Callout kind="tip">
          <P
            t={[
              "The one part no checker can do for you is the statement: Lean confirms the proof proves *what is written*, not what you meant. Read the statement carefully.",
              "唯一沒有檢查器能替你做的，是陳述本身：Lean 確認證明證的是 *寫下來的東西*，而不是你心裡想的東西。請仔細讀陳述。",
            ]}
          />
          <SiteLink to={["concept", "limits"]} label={["What a check does not tell you", "檢查沒告訴你的事"]} />
        </Callout>
        <Sources
          items={[
            { label: "leanprover/lean4checker", url: "https://github.com/leanprover/lean4checker" },
            { label: "ammkrn/nanoda_lib", url: "https://github.com/ammkrn/nanoda_lib" },
            { label: "leanprover/lean4export", url: "https://github.com/leanprover/lean4export" },
            { label: "leanprover/comparator", url: "https://github.com/leanprover/comparator" },
          ]}
        />
      </Section>
    </Page>
  );
}
