/**
 * Concept ▸ Checking the checker (#/concept/checkers[/<section>]). Lean code: lean/Formalizer/Pages/Checkers.lean.
 * Backbone: Kevin Buzzard's four questions (Xena, 12 Nov 2026) as four gates a proof passes through; then what each
 * checker catches, the comparator workflow as test-driven development, and the Riemann re-check as a worked case
 * (fast-moving: dated "as of 22 November 2026"). Figures: CheckerFigures.tsx.
 */
import { useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, snippet, Sources, type SectionInfo } from "../kit";
import {
  CheckerStrip,
  ComparatorFlow,
  FourGates,
  KernelsAgree,
  LiteFull,
  PaperVsLean,
  RhBoard,
  SameTextFigure,
  SandboxFigure,
  TrustOnion,
} from "./CheckerFigures";

const PAGE = "checkers";

const SECTIONS: SectionInfo[] = [
  { id: "gates", title: ["“…and the proof is checked in Lean”: four gates", "「……而且證明已由 Lean 檢查」：四道關卡"] },
  { id: "statement", title: ["Gate 1: does the statement say what the paper says?", "第 1 關：陳述說的是論文說的嗎？"] },
  { id: "compile", title: ["Gate 2: does it compile?", "第 2 關：能編譯嗎？"] },
  { id: "exactly", title: ["Gate 3: does it prove exactly that, and nothing more?", "第 3 關：它證的正是那個陳述，而且沒多假設什麼嗎？"] },
  { id: "judge", title: ["Gate 4: is the judge itself sound?", "第 4 關：裁判本身可靠嗎？"] },
  { id: "trust", title: ["What a check still trusts", "檢查之後仍然要信任的東西"] },
  { id: "tools", title: ["The checkers side by side", "檢查工具並排比較"] },
  { id: "workflow", title: ["Comparator: a test written before the proof", "Comparator：在證明之前就寫好的測試"] },
  { id: "rh", title: ["A worked case: re-checking the Riemann claim", "實例：重新檢查黎曼猜想的宣稱"] },
  { id: "formalizer", title: ["What Formalizer runs for you", "Formalizer 替你跑哪些檢查"] },
];

/** What Lean printed (pasted from a real run on Lean v4.34.1). */
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

const OUT_REDEFINE = `'Formalizer.Pages.Checkers.fake_flt' does not depend on any axioms`;

const OUT_AXIOMS = `'Formalizer.Pages.Checkers.honest' does not depend on any axioms
'Formalizer.Pages.Checkers.bold' depends on axioms: [trust_me]
'Formalizer.Pages.Checkers.unfinished' depends on axioms: [sorryAx]`;

const XENA = "https://xenaproject.wordpress.com/2026/11/12/and-the-proof-is-checked-in-lean/";
const RH_REPO = "https://github.com/leanprover-community/riemann-hypothesis";

export default function CheckersConcept({ section }: { section: string | null }) {
  let n = 0;
  return (
    <Page
      id={PAGE}
      title={["Checking the checker", "檢查檢查者"]}
      intro={[
        "“The proof is checked in Lean” sounds final. It isn't, quite. Kevin Buzzard asks four questions before he believes it, and each one is a gate a proof has to pass. This page walks through the gates with pictures, shows the tools that guard each one, and ends with a real case: the 17-million-line Lean proof claimed for the Riemann hypothesis.",
        "「證明已由 Lean 檢查」聽起來像定案了。其實還差一點。Kevin Buzzard 在相信之前會問四個問題，每一個都是證明必須通過的關卡。這一頁用圖走過這四道關卡，介紹守住每一關的工具，最後看一個真實的例子：號稱證明黎曼猜想、長達 1700 萬行的 Lean 證明。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="gates" n={++n} title={SECTIONS[0].title}>
        <P
          t={[
            "Picture a proof as a traveller who must pass four gates. Lean's green check opens only the second gate and part of the third. Pick a submission below and watch where it is stopped.",
            "把證明想成一位旅人，必須通過四道關卡。Lean 的綠色勾勾只打開第二道，以及第三道的一部分。在下面選一份提交，看它在哪裡被攔下。",
          ]}
        />
        <Figure
          caption={[
            "Buzzard's four questions as gates. Each trick is caught at a different gate, by a different kind of checker; the first gate only by a person.",
            "Buzzard 的四個問題化成四道關卡。每種把戲在不同的關卡、被不同的檢查者攔下；第一關只有人能守。",
          ]}
        >
          <FourGates />
        </Figure>
        <List
          ordered
          items={[
            ["“Does the Lean statement match the informal statement?”", "「Lean 陳述和非形式的陳述一致嗎？」"],
            ["“does the code compile?”", "「程式碼能編譯嗎？」"],
            ["“does the code prove the theorem as stated?”", "「程式碼證明的是所陳述的定理嗎？」"],
            ["“does the code exploit a bug in Lean's official kernel?”", "「程式碼有沒有利用 Lean 官方核心的 bug？」"],
          ]}
        />
        <Sources items={[{ label: "Kevin Buzzard, “…and the proof is checked in Lean” (Xena, 12 Nov 2026)", url: XENA }]} />
      </Section>

      <Section page={PAGE} id="statement" n={++n} title={SECTIONS[1].title}>
        <P
          t={[
            "Lean checks that the proof proves *what is written*. Whether what is written is what the mathematician meant, Lean cannot know. The most famous trap is a single missing hypothesis. Buzzard's example: Fermat's Last Theorem written over the natural numbers, without saying the numbers are positive.",
            "Lean 檢查證明是否證出 *寫下來的東西*。寫下來的是不是數學家心裡想的，Lean 無從得知。最有名的陷阱是少一個假設。Buzzard 的例子：用自然數寫費馬最後定理，卻沒說這些數是正的。",
          ]}
        />
        <Figure
          caption={[
            "Top: one hypothesis lost in translation. Bottom: on ℕ, the paper's ½ lands on 0. Both compile without a word of warning.",
            "上：翻譯時弄丟了一個假設。下：在 ℕ 上，論文裡的 ½ 落在 0。兩者都能編譯，沒有任何警告。",
          ]}
        >
          <PaperVsLean />
        </Figure>
        <Lean code={snippet("Checkers", "flt-false")} note={["compiles, and is false: 0³ + 0³ = 0³", "能編譯，而且是錯的：0³ + 0³ = 0³"]} />
        <P
          t={[
            "Here the mistake makes the statement false, so at least nobody can prove it. The dangerous case is the opposite: a careless statement that is *true for the wrong reason*, so a proof arrives and the green check looks like success.",
            "這裡的錯誤讓陳述變成錯的，至少沒有人證得出來。危險的是反過來的情況：一個粗心的陳述 *因為錯的理由而成立*，於是證明出現了，綠色勾勾看起來像是成功。",
          ]}
        />
        <Lean code={snippet("Checkers", "wrong-reason")} note={["a hypothesis that can never hold proves anything", "永遠不成立的假設可以推出任何事"]} />
        <P
          t={[
            "The other trap is that Lean's arithmetic is *total*: every operation gives an answer, even where paper mathematics would say “undefined”. On ℕ, division rounds down and subtraction stops at zero:",
            "另一個陷阱是 Lean 的算術是 *全域定義* 的：每個運算都有答案，即使紙上數學會說「沒有定義」。在 ℕ 上，除法會無條件捨去，減法減到 0 就停：",
          ]}
        />
        <Lean code={snippet("Checkers", "nat-surprises")} />
        <Callout kind="warn" title={["Read every `1 / 2`", "每個 `1 / 2` 都要讀"]}>
          <P
            t={[
              "The Riemann hypothesis says the nontrivial zeros have real part 1/2. Written with natural numbers, `1 / 2` is `0`, and the statement says something else entirely. Mathlib's `riemannZeta` also has a *junk value* at s = 1, where the paper's ζ has a pole. A faithful statement must keep both out; the Riemann re-check below checked exactly these two points.",
              "黎曼猜想說非平凡零點的實部是 1/2。若用自然數寫，`1 / 2` 就是 `0`，陳述說的就完全是另一回事。Mathlib 的 `riemannZeta` 在 s = 1 也有一個 *垃圾值*，而論文裡的 ζ 在那裡是極點。忠實的陳述必須把這兩者都排除；下面的黎曼猜想重新檢查，正是檢查了這兩點。",
            ]}
          />
        </Callout>
        <P
          t={[
            "This is not a rare failure. Buzzard reports that for about 38 of 290 OpenAI theorems that came with Lean code, the code “does not even state, let alone prove, the main theorem of the paper”.",
            "這不是罕見的失誤。Buzzard 指出，在 290 個附有 Lean 程式碼的 OpenAI 定理中，約有 38 個的程式碼「連論文的主定理都沒有陳述，更別說證明了」。",
          ]}
        />
        <SiteLink to={["concept", "limits"]} label={["What a check does not tell you", "檢查沒告訴你的事"]} />
      </Section>

      <Section page={PAGE} id="compile" n={++n} title={SECTIONS[2].title}>
        <P
          t={[
            "Gate 2 sounds trivial, until the proof is huge. The formalisation of Fermat's Last Theorem is about 13 million lines, and Buzzard “very quickly ran out of memory” building it. And building is not passive: Lean is a programming language, and macros, tactics and metaprograms in the proof *run* while it compiles. Buzzard's rule:",
            "第 2 關聽起來很簡單，直到證明變得很龐大。費馬最後定理的形式化大約有 1300 萬行，Buzzard 建置時「很快就用光了記憶體」。而且建置不是被動的：Lean 是一種程式語言，證明裡的巨集、戰術、元程式在編譯時都會 *執行*。Buzzard 的守則是：",
          ]}
        />
        <Figure
          caption={[
            "The author's code runs only inside the box. What leaves it is a plain-text export, which the judge reads but never runs.",
            "作者的程式碼只在箱子裡執行。離開箱子的是純文字的匯出檔，裁判讀它，但從不執行它。",
          ]}
        >
          <SandboxFigure />
        </Figure>
        <Callout kind="warn">
          <P
            t={[
              "“do not run random Lean code on your local machine unless you sandbox it first.”",
              "「除非先放進沙盒，否則不要在你自己的電腦上執行來路不明的 Lean 程式碼。」",
            ]}
          />
        </Callout>
        <P
          t={[
            "That is why serious checks build the solution in a sandbox with no network, apart from the judge's own files, and why the outermost layer of the trust onion below is the machine itself.",
            "所以正式的檢查會在沒有網路、與裁判檔案隔開的沙盒裡建置解答，這也是下面「信任洋蔥」最外層就是機器本身的原因。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="exactly" n={++n} title={SECTIONS[3].title}>
        <P
          t={[
            "A proof can compile and still not prove the challenge, in two ways: by quietly changing what the words mean, or by quietly assuming more. The first is a *hidden redefinition*. Buzzard's example is making `x ^ n` mean 37; then “Fermat's Last Theorem” becomes 37 + 37 ≠ 37:",
            "一個證明可以編譯通過，卻沒有證出挑戰的陳述，方式有兩種：悄悄改變字詞的意思，或悄悄多假設一些東西。第一種是 *暗中重新定義*。Buzzard 的例子是讓 `x ^ n` 代表 37；於是「費馬最後定理」就變成 37 + 37 ≠ 37：",
          ]}
        />
        <Figure
          caption={[
            "Same text, different theorem. Neither has an extra axiom, so `#print axioms` sees nothing; comparing what `^` elaborates to does.",
            "文字相同，定理不同。兩者都沒有額外公理，所以 `#print axioms` 看不出來；比對 `^` 精煉後是什麼才看得出來。",
          ]}
        >
          <SameTextFigure />
        </Figure>
        <Lean code={snippet("Checkers", "redefine")} />
        <Output text={OUT_REDEFINE} />
        <P
          t={[
            "The text of `fake_flt` is character for character Fermat's statement, and its axiom list is spotless. Only comparing the *elaborated* statement, with every definition it uses, against a trusted copy reveals that this `^` is not the real one.",
            "`fake_flt` 的文字和費馬的陳述一字不差，公理清單也乾乾淨淨。只有把 *精煉後* 的陳述，連同它用到的每個定義，拿去和一份受信任的副本比對，才會發現這個 `^` 不是真的那個。",
          ]}
        />
        <P
          t={[
            "The second way is assuming more: `sorry`, a new `axiom`, or `native_decide` (which trusts the compiler). These *do* show up in `#print axioms`, which follows every lemma down to the roots:",
            "第二種是多假設：`sorry`、新寫的 `axiom`，或 `native_decide`（它信任編譯器）。這些 *會* 出現在 `#print axioms` 裡，因為它會順著每個引理一路追到根：",
          ]}
        />
        <Lean code={snippet("Checkers", "axioms")} />
        <Output text={OUT_AXIOMS} />
        <P
          t={[
            "Both checks together are what **comparator** does. In Buzzard's words, it “checks that the theorem stated in a trusted file and the theorem proved via untrusted imports are identical, and that only the axioms of mathematics are used.” Since Lean v4.35.0 it is part of Lean's build tool as `lake comparator`.",
            "把兩種檢查合在一起，就是 **comparator** 做的事。用 Buzzard 的話說，它「檢查受信任檔案裡陳述的定理，和透過不受信任的匯入所證明的定理完全相同，而且只用到數學的公理」。從 Lean v4.35.0 起，它成為 Lean 建置工具的一部分：`lake comparator`。",
          ]}
        />
        <SiteLink to={["concept", "kernel", "axioms"]} label={["Axioms: what a proof rests on", "公理：證明的根基"]} />
      </Section>

      <Section page={PAGE} id="judge" n={++n} title={SECTIONS[4].title}>
        <P
          t={[
            "Everything so far trusts Lean's kernel. The kernel is small and carefully reviewed, but it is a program. Buzzard: “This can happen. There was a soundness bug in Lean's kernel which was fixed four hours after it was discovered.” The remedy is the oldest one in engineering: ask a second, independent judge.",
            "到目前為止，一切都信任 Lean 的核心。核心小而且經過仔細審查，但它終究是一支程式。Buzzard 說：「這是可能發生的。Lean 的核心曾有一個可靠性（soundness）bug，在被發現四小時後就修好了。」解藥是工程上最古老的一招：再找一位獨立的裁判。",
          ]}
        />
        <Figure
          caption={[
            "One exported proof, several kernels. `leanchecker` replays it in Lean's own kernel (so it shares that kernel's bugs, but catches tampering with the environment); nanoda is an independent kernel in Rust; Lean4Lean is written in Lean but derived from the C++ kernel, so not fully independent.",
            "一個匯出的證明，交給多個核心。`leanchecker` 用 Lean 自己的核心重播（所以和那個核心有同樣的 bug，但能抓到竄改環境的手法）；nanoda 是用 Rust 獨立寫成的核心；Lean4Lean 用 Lean 寫成，但衍生自 C++ 核心，所以並非完全獨立。",
          ]}
        >
          <KernelsAgree />
        </Figure>
        <List
          items={[
            [
              "**leanchecker** (ships with every toolchain since v4.28.0) reloads the compiled files and replays every declaration through the kernel in a fresh process. It is “not an external verifier, as it uses the Lean kernel itself”, but it detects *environment hacking*: a metaprogram that slips a declaration in without the kernel seeing it.",
              "**leanchecker**（v4.28.0 起隨每個工具鏈發布）重新載入編譯好的檔案，在全新的程序裡把每個宣告交給核心重播。它「不是外部驗證器，因為它用的就是 Lean 核心本身」，但它能抓到 *竄改環境*：某個元程式繞過核心偷偷塞進一個宣告。",
            ],
            [
              "**nanoda** is a type checker written independently in Rust; it reads the plain-text export of the proof. A bug would have to be in both kernels, in the same way.",
              "**nanoda** 是用 Rust 獨立寫成的型別檢查器，讀取證明匯出的純文字。錯誤要過關，兩個核心得在同一處有同樣的 bug。",
            ],
            [
              "**Lean4Lean** is a kernel written in Lean itself, and its author keeps a list of the bugs it found. Being derived from the C++ kernel, it is “not really an independent implementation”.",
              "**Lean4Lean** 是用 Lean 本身寫成的核心，作者維護一份它找到的 bug 清單。由於衍生自 C++ 核心，它「其實不算獨立的實作」。",
            ],
            [
              "`lake comparator --paranoid` runs the replay in several kernels as part of one check.",
              "`lake comparator --paranoid` 把多個核心的重播當成同一次檢查的一部分。",
            ],
          ]}
        />
        <Sources
          items={[
            { label: "leanprover/lean4checker (leanchecker)", url: "https://github.com/leanprover/lean4checker" },
            { label: "ammkrn/nanoda_lib", url: "https://github.com/ammkrn/nanoda_lib" },
            { label: "digama0/lean4lean", url: "https://github.com/digama0/lean4lean" },
            { label: "Type Checking in Lean 4 (a book about the kernel)", url: "https://ammkrn.github.io/type_checking_in_lean4/" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="trust" n={++n} title={SECTIONS[5].title}>
        <P
          t={[
            "No check removes trust; it moves trust somewhere smaller. Peel the onion from the inside out: each layer is something a “checked” result still relies on, and each has its own way of being doubted.",
            "沒有任何檢查能消除信任；它只是把信任移到更小的地方。從裡到外剝這顆洋蔥：每一層都是「已檢查」的結果仍然依賴的東西，每一層也都有自己被懷疑、被檢驗的方式。",
          ]}
        />
        <Figure
          caption={[
            "The trust onion. Click a layer to see what you trust there and how to trust it less. The innermost layer, the statement, is the one only a person can check.",
            "信任洋蔥。點一層，看看你在那裡信任什麼、怎樣能少信任一點。最裡面那層「陳述」，只有人能檢查。",
          ]}
        >
          <TrustOnion />
        </Figure>
      </Section>

      <Section page={PAGE} id="tools" n={++n} title={SECTIONS[6].title}>
        <P
          t={[
            "Each tool guards some gates and not others. No single row is green everywhere, and the first column is empty except for a person.",
            "每個工具只守住部分關卡。沒有哪一列全是綠的，而第一欄除了人以外是空的。",
          ]}
        />
        <Figure
          caption={[
            "What each checker catches (✓ yes, ◐ partly, · no) and where it runs. Lite checks run on any operating system; the Full ones need the Linux sandbox, so Linux, WSL or a cloud runner.",
            "每個檢查工具能抓到什麼（✓ 能、◐ 部分、· 不能），以及在哪裡跑。Lite 檢查在任何作業系統都能跑；Full 檢查需要 Linux 沙盒，所以要 Linux、WSL 或雲端執行器。",
          ]}
        >
          <CheckerStrip />
        </Figure>
      </Section>

      <Section page={PAGE} id="workflow" n={++n} title={SECTIONS[7].title}>
        <P
          t={[
            "Programmers will recognise the shape: test-driven development. First write a test that fails; then write code until it passes; the test, not the author, decides. In comparator the frozen statement is the test, the checkers are the test runner, and the proof is the code. Step through it:",
            "寫程式的人會認得這個形狀：測試驅動開發（TDD）。先寫一個會失敗的測試，再寫程式直到它通過；由測試、而不是作者，來決定。在 comparator 裡，凍結的陳述就是測試，檢查工具是測試執行器，證明則是程式碼。一步步看：",
          ]}
        />
        <Figure
          caption={[
            "Comparator's workflow, red → green. Only the challenge file is trusted; the solution, however large and whoever wrote it, is not.",
            "Comparator 的流程，紅燈 → 綠燈。只有挑戰檔案受信任；解答不管多大、是誰寫的，都不受信任。",
          ]}
        >
          <ComparatorFlow />
        </Figure>
        <Callout kind="note" title={["One thing a test cannot do", "測試做不到的一件事"]}>
          <P
            t={[
              "A test is only as good as what it asserts. If the challenge itself is mis-stated, every check passes and the result is still wrong: gate 1 again. Comparator's own documentation warns that solutions which fill in a *definition* “must always be checked with an additional (potentially human) verifier.”",
              "測試好不好，取決於它斷言了什麼。如果挑戰本身就寫錯了，每項檢查都會通過，結果仍然是錯的：又回到第 1 關。Comparator 自己的說明文件也提醒，要填入 *定義* 的解答「一定要再由另外的（可能是人類的）驗證者檢查」。",
            ]}
          />
        </Callout>
        <Sources items={[{ label: "leanprover/comparator (now `lake comparator` in Lean ≥ v4.35.0)", url: "https://github.com/leanprover/comparator" }]} />
      </Section>

      <Section page={PAGE} id="rh" n={++n} title={SECTIONS[8].title}>
        <P
          t={[
            "On 20 November 2026 Levent Alpöge, working with Claude, announced a Lean proof of the Riemann hypothesis and of GRH for Dirichlet L-functions. A public repository re-checks it, gate by gate, starting from the source exactly as published: 175,187 files, 17,374,215 lines, about 1 GB.",
            "2026 年 11 月 20 日，Levent Alpöge 與 Claude 合作，宣布了黎曼猜想與狄利克雷 L 函數廣義黎曼猜想的 Lean 證明。一個公開的儲存庫從原封不動的發布原始碼開始，一關一關地重新檢查：175,187 個檔案、17,374,215 行、大約 1 GB。",
          ]}
        />
        <Figure
          caption={[
            "The re-check as of 22 November 2026, by gate. “✖” means that checker could not run on this proof, not that it found an error.",
            "截至 2026 年 11 月 22 日的重新檢查，按關卡排列。「✖」表示那個檢查器無法在這個證明上執行，而不是它找到錯誤。",
          ]}
        >
          <RhBoard />
        </Figure>
        <P
          t={[
            "Note the third gate. A text search finds no `sorry`, `axiom` or `native_decide`, but the proof builds some of its own declarations with metaprograms; for those, the repository says, “the kernel is the only check”. That is exactly the case comparator and a second kernel exist for. And even a passing run is not the end; in the repository's words:",
            "注意第三關。文字搜尋找不到 `sorry`、`axiom` 或 `native_decide`，但這個證明用元程式自己建出一些宣告；儲存庫說，對這些宣告而言「核心是唯一的檢查」。comparator 和第二個核心正是為這種情況而存在的。而且即使檢查通過，事情也還沒結束；用儲存庫的話說：",
          ]}
        />
        <Callout kind="warn" title={["As of 22 November 2026", "截至 2026 年 11 月 22 日"]}>
          <P
            t={[
              "“A passing run still trusts the checkers, Mathlib's definitions, Mathlib's official build cache, the exporter, and the sandboxes.” The build was still running; comparator's verdict had not been posted.",
              "「即使檢查通過，仍然要信任這些檢查工具、Mathlib 的定義、Mathlib 的官方建置快取、匯出器，以及沙盒。」當時建置仍在進行中，comparator 的判定尚未公布。",
            ]}
          />
        </Callout>
        <P
          t={[
            "And all four gates only say the Lean is right. Whether anyone *understands* why the Riemann hypothesis holds is a different question, and mathematicians disagree about how much a machine-checked proof alone settles.",
            "而且四道關卡都只說明 Lean 是對的。有沒有人 *理解* 黎曼猜想為什麼成立，是另一個問題；至於單靠機器檢查的證明能定案多少，數學家之間看法並不一致。",
          ]}
        />
        <p className="flex flex-wrap gap-4">
          <SiteLink to={["concept", "rh"]} label={["The Riemann case, in full", "黎曼猜想的完整故事"]} />
          <SiteLink to={["concept", "views"]} label={["What mathematicians think", "數學家怎麼看"]} />
        </p>
        <Sources items={[{ label: "leanprover-community/riemann-hypothesis (re-check)", url: RH_REPO }]} />
      </Section>

      <Section page={PAGE} id="formalizer" n={++n} title={SECTIONS[9].title}>
        <P
          t={[
            "Formalizer uses the same gates, at two sizes. Every check you run gets the Lite set; research-level problems can add the Full set.",
            "Formalizer 使用同樣的關卡，分成兩種規模。你執行的每次檢查都有 Lite 這一套；研究級的題目可以再加上 Full 這一套。",
          ]}
        />
        <Figure
          caption={[
            "Lite runs wherever Lean runs; Full needs the Linux sandbox, so Linux, WSL or a cloud runner.",
            "Lite 在任何能跑 Lean 的地方都能跑；Full 需要 Linux 沙盒，所以要 Linux、WSL 或雲端執行器。",
          ]}
        >
          <LiteFull />
        </Figure>
        <List
          items={[
            [
              "**Lite, for everyone, on any OS:** the problem's statement is frozen (you cannot prove an easier one), the axiom list must be within `propext`, `Quot.sound`, `Classical.choice`, a static scan flags `sorry`, `axiom`, `native_decide` and friends, and `leanchecker` replays the result in a fresh kernel.",
              "**Lite，人人都有，任何作業系統：** 題目的陳述被凍結（你不能改證比較簡單的陳述）、公理清單只能在 `propext`、`Quot.sound`、`Classical.choice` 之內、靜態掃描會標出 `sorry`、`axiom`、`native_decide` 之類的東西，而 `leanchecker` 會在全新的核心裡重播結果。",
            ],
            [
              "**Full, in Research, on Linux, WSL or a cloud runner:** `lake comparator --paranoid` in its sandbox, nanoda as an independent kernel, and Lean4Lean.",
              "**Full，在 Research 裡，於 Linux、WSL 或雲端執行器上：** 在沙盒中執行 `lake comparator --paranoid`、以 nanoda 作為獨立核心，以及 Lean4Lean。",
            ],
            [
              "**Gate 1 stays with you.** Read the statement. No tool on this page can do that part.",
              "**第 1 關留給你。** 讀陳述。這一頁上沒有任何工具能替你做這件事。",
            ],
          ]}
        />
        <p className="flex flex-wrap gap-4">
          <SiteLink to={["concept", "kernel"]} label={["How Lean checks", "Lean 如何檢查"]} />
          <SiteLink to={["concept", "limits"]} label={["Limits of proofs", "證明的極限"]} />
        </p>
        <Sources
          items={[
            { label: "Kevin Buzzard, “…and the proof is checked in Lean” (Xena, 12 Nov 2026)", url: XENA },
            { label: "leanprover-community/riemann-hypothesis", url: RH_REPO },
            { label: "leanprover/comparator", url: "https://github.com/leanprover/comparator" },
            { label: "leanprover/lean4checker", url: "https://github.com/leanprover/lean4checker" },
            { label: "ammkrn/nanoda_lib", url: "https://github.com/ammkrn/nanoda_lib" },
            { label: "digama0/lean4lean", url: "https://github.com/digama0/lean4lean" },
          ]}
        />
      </Section>
    </Page>
  );
}
