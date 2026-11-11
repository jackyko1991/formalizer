/** Coding Skills ▸ Verifying a proof (#/skills/verify[/<section>]). Lean code: lean/Formalizer/Pages/Verify.lean. */
import { useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, snippet, Sources, Table, TryIn, type L } from "../kit";

const PAGE = "verify";

const SECTIONS: { id: string; title: L }[] = [
  { id: "why", title: ["Accepted is not the same as proved", "被接受不等於被證明"] },
  { id: "axioms", title: ["`#print axioms`: what a proof rests on", "`#print axioms`：證明依賴什麼"] },
  { id: "sorry", title: ["`sorryAx`: an unfinished proof, even a hidden one", "`sorryAx`：未完成的證明，即使藏起來"] },
  { id: "other", title: ["Any other axiom", "其他任何公理"] },
  { id: "formalizer", title: ["How Formalizer checks a problem", "Formalizer 怎麼檢查一道題"] },
  { id: "comparator", title: ["Comparator: checking a proof you didn't write", "Comparator：檢查不是你寫的證明"] },
  { id: "ladder", title: ["How much checking is enough", "要檢查到什麼程度才夠"] },
  { id: "statement", title: ["Is it the right statement?", "陳述對嗎？"] },
  { id: "checklist", title: ["Before you trust a proof", "相信一個證明之前"] },
];

/** What Lean printed (a #print axioms answer, or a Formalizer error), in a monospace box. */
function Output({ text, error = false }: { text: string; error?: boolean }) {
  const { pick } = useLang();
  return (
    <div className={`rounded-lg border bg-white px-3 py-2 ${error ? "border-red-200" : "border-gray-200"}`}>
      <p className={`text-xs font-medium ${error ? "text-red-700" : "text-gray-500"}`}>
        {pick(error ? ["Error", "錯誤"] : ["Lean prints", "Lean 印出"])}
      </p>
      <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-gray-800">{text}</pre>
    </div>
  );
}

const NS_CONFIG = `{
  "challenge_module": "ComparatorChallenges.NavierStokes",
  "solution_module": "NavierStokes.ComparatorSolution",
  "enable_nanoda": true,
  "theorem_names": [
    "NavierStokes.Comparator.navier_stokes_breakdown_R3",
    "NavierStokes.Comparator.navier_stokes_breakdown_periodic"
  ],
  "permitted_axioms": [
    "propext",
    "Quot.sound",
    "Classical.choice"
  ]
}`;

const REF_VALIDATING = {
  label: "Lean Language Reference: Validating a Lean Proof",
  url: "https://lean-lang.org/doc/reference/latest/ValidatingProofs/",
};
const COMPARATOR = { label: "leanprover/comparator (README)", url: "https://github.com/leanprover/comparator" };

export default function VerifySkill({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["Verifying a proof", "驗證證明"]}
      intro={[
        "Lean's kernel is a very strict checker, but it answers a narrow question: *does this proof prove this statement, from these assumptions?* Before you believe a proof, ask the other questions too: is it finished, what does it assume, and is the statement the one you meant? This page shows the tools for each.",
        "Lean 的核心（kernel）是非常嚴格的檢查者，但它只回答一個窄問題：*這個證明是否從這些假設證出了這個陳述？* 在相信一個證明之前，也要問其他問題：它完成了嗎？它假設了什麼？陳述是你想要的那個嗎？這一頁介紹回答每個問題的工具。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="why" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A Lean file with no errors can still fail to prove what you think, in three ways:",
            "一個沒有錯誤的 Lean 檔案，仍可能沒證出你以為的東西，原因有三種：",
          ]}
        />
        <List
          ordered
          items={[
            [
              "**It is unfinished.** `sorry` is only a warning, so the file compiles with a hole in it.",
              "**它沒完成。** `sorry` 只是警告，所以檔案帶著漏洞也能編譯。",
            ],
            [
              "**It assumes something.** An `axiom` declares a fact without proof; anything follows from a false one.",
              "**它假設了東西。** `axiom` 宣告一個不經證明的事實；從一個錯的假設可以推出任何東西。",
            ],
            [
              "**It proves another statement.** A changed hypothesis, an easier claim, or a different definition, and the proof is correct about the wrong thing.",
              "**它證的是另一個陳述。** 改了一個前提、換成較簡單的說法，或用了不同的定義，證明本身沒錯，卻是關於錯的東西。",
            ],
          ]}
        />
        <P
          t={[
            "The first two are mechanical: `#print axioms` catches them. The third needs a fixed statement to compare with, which is what Formalizer and Comparator provide, and in the end a human reading it.",
            "前兩種可以機械地檢查：`#print axioms` 就抓得到。第三種需要一個固定的陳述來比對，這正是 Formalizer 與 Comparator 提供的；最後，還需要有人真的去讀它。",
          ]}
        />
        <p>
          <SiteLink to={["concept", "kernel"]} label={["What the kernel checks", "核心（kernel）檢查什麼"]} />
        </p>
      </Section>

      <Section page={PAGE} id="axioms" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Write `#print axioms` and a theorem's name after the theorem. Lean follows the proof down through every lemma it uses and lists the **axioms** (facts accepted without proof) at the bottom.",
            "在定理後面寫 `#print axioms` 加上定理名字。Lean 會沿著證明往下，追過它用到的每一個引理，列出最底層的**公理**（不經證明就接受的事實）。",
          ]}
        />
        <Lean code={snippet("Verify", "print-axioms")} />
        <Output
          text={
            "'four' does not depend on any axioms\n'swap' depends on axioms: [propext, Quot.sound]\n'either' depends on axioms: [propext, Classical.choice, Quot.sound]"
          }
        />
        <P
          t={[
            "`2 + 2 = 4` by `rfl` needs nothing at all: Lean just computes. `omega` uses two axioms behind the scenes; `Classical.em` (every statement is true or false) uses three. These three are Lean's **standard axioms**, part of its logic, used all over Mathlib and accepted by mathematicians:",
            "用 `rfl` 證 `2 + 2 = 4` 什麼都不需要：Lean 直接算出來。`omega` 在背後用了兩個公理；`Classical.em`（每個陳述非真即假）用了三個。這三個是 Lean 的**標準公理**，屬於它的邏輯本身，整個 Mathlib 到處都用，數學家也都接受：",
          ]}
        />
        <Table
          head={[
            ["Axiom", "公理"],
            ["In plain words", "白話地說"],
          ]}
          rows={[
            [
              ["`propext`", "`propext`"],
              [
                "Two statements that imply each other are the same statement, so one may replace the other anywhere.",
                "兩個互相蘊含的陳述就是同一個陳述，所以在任何地方都能互相替換。",
              ],
            ],
            [
              ["`Quot.sound`", "`Quot.sound`"],
              [
                "When a type is built by declaring some things equivalent (like $\\tfrac12$ and $\\tfrac24$ as fractions), equivalent things are equal.",
                "當一個型別是藉由宣告某些東西等價而建構出來（例如分數裡的 $\\tfrac12$ 與 $\\tfrac24$），等價的東西就相等。",
              ],
            ],
            [
              ["`Classical.choice`", "`Classical.choice`"],
              [
                "If something exists, you may pick one without saying which. From it follows that every statement is true or false.",
                "如果某個東西存在，你可以挑出一個，而不必說是哪一個。由它可以推出每個陳述非真即假。",
              ],
            ],
          ]}
        />
        <P
          t={[
            "So the answer you want is *does not depend on any axioms*, or a list using only these three. Formalizer appends `#print axioms` for each problem's theorem and shows the answer on the **Axioms used** line of the Result panel.",
            "所以你想看到的回答是 *does not depend on any axioms*，或是只含這三個的清單。Formalizer 會替每一題的定理自動加上 `#print axioms`，並把答案顯示在結果面板的 **使用的公理** 那一行。",
          ]}
        />
        <TryIn ids={["hello", "add-comm"]} />
        <Sources
          items={[
            { label: "Lean Language Reference: Axioms", url: "https://lean-lang.org/doc/reference/latest/Axioms/" },
            {
              label: "Theorem Proving in Lean 4: Axioms and Computation",
              url: "https://lean-lang.org/theorem_proving_in_lean4/Axioms-and-Computation/",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="sorry" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            'Behind the scenes, `sorry` is an axiom too: `sorryAx`, which can "prove" anything. So an unfinished proof shows up in the list:',
            "在幕後，`sorry` 也是一個公理：`sorryAx`，它能「證明」任何東西。所以未完成的證明會出現在清單裡：",
          ]}
        />
        <Lean code={snippet("Verify", "print-sorry")} />
        <Output text="'later' depends on axioms: [sorryAx]" />
        <P
          t={[
            "This matters most when the `sorry` is not in the theorem itself. Below, `main` has no `sorry` and gets no warning; only `helper` does. In a long file you may never notice, but `#print axioms main` follows the proof into `helper` and finds it:",
            "當 `sorry` 不在定理本身時，這點最重要。下面的 `main` 沒有 `sorry`，也不會被警告；只有 `helper` 會。在很長的檔案裡你可能根本不會注意到，但 `#print axioms main` 會沿著證明追進 `helper`，把它找出來：",
          ]}
        />
        <Lean
          code={snippet("Verify", "hidden-sorry")}
          note={["the warning is on `helper`, not on `main`", "警告出現在 `helper`，不在 `main`"]}
        />
        <Output text="'main' depends on axioms: [sorryAx]" />
        <P
          t={[
            "On Formalizer, `sorryAx` gives the verdict *Not finished yet*, never *Proved*.",
            "在 Formalizer 上，出現 `sorryAx` 的判定是「還沒完成」，絕不會是「已證明」。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="other" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "Anyone can write `axiom my_assumption : 1 = 2` and then `theorem cheat : 1 = 2 := my_assumption`. Lean accepts it, without a warning: an axiom is a legitimate way to say \"assume this\". `#print axioms cheat` gives it away: `'cheat' depends on axioms: [my_assumption]`. A theorem that depends on an extra axiom is only true *if* that axiom is.",
            "任何人都能寫 `axiom my_assumption : 1 = 2`，再寫 `theorem cheat : 1 = 2 := my_assumption`。Lean 會接受，連警告都沒有：公理本來就是「假設這件事成立」的正當寫法。`#print axioms cheat` 會揭穿它：`'cheat' depends on axioms: [my_assumption]`。依賴額外公理的定理，只有在那個公理成立*時*才成立。",
          ]}
        />
        <P
          t={[
            "A subtler case: `native_decide` checks a fact by running compiled code instead of asking the kernel. The kernel can't see inside that run, so Lean records it as an axiom whose name contains `_native`:",
            "比較隱微的情況：`native_decide` 是靠執行編譯過的程式來檢查事實，而不是交給核心。核心看不到那次執行的內部，所以 Lean 會把它記成一個名字含 `_native` 的公理：",
          ]}
        />
        <Lean
          code={`theorem four_fast : 2 + 2 = 4 := by native_decide

#print axioms four_fast`}
          fails
          note={[
            "Lean accepts this file, but the extra axiom fails Formalizer's check, so it is not in the files CI builds.",
            "Lean 接受這段程式，但多出來的公理過不了 Formalizer 的檢查，所以它不在 CI 建置的檔案裡。",
          ]}
        />
        <Output text="'four_fast' depends on axioms: [four_fast._native.native_decide.ax_1_1]" />
        <P
          t={[
            "Formalizer accepts only the three standard axioms. Anything else turns the verdict into an error:",
            "Formalizer 只接受三個標準公理。其他任何公理都會讓判定變成錯誤：",
          ]}
        />
        <Output error text="uses non-standard axioms: four_fast._native.native_decide.ax_1_1" />
        <Sources items={[REF_VALIDATING]} />
      </Section>

      <Section page={PAGE} id="formalizer" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "In Formalizer **the statement is the test and Lean's kernel is the grader**. When you press Run, the runner on your computer does this:",
            "在 Formalizer 裡，**陳述就是測試，核心就是閱卷人**。按下執行時，你電腦上的執行器會這樣做：",
          ]}
        />
        <List
          ordered
          items={[
            [
              "**Imports.** If the file imports something this runner doesn't have (Mathlib on the Lite runner), it stops and asks for the Full runner.",
              "**匯入。** 如果檔案匯入了這個執行器沒有的東西（例如在 Lite 執行器上匯入 Mathlib），它會停下來，請你改用 Full 執行器。",
            ],
            [
              "**The statement.** Each statement of the problem (the theorem line, and any definition it is about) must appear in your file **unchanged**; only extra spaces and line breaks are ignored. Otherwise Lean is not even asked.",
              "**陳述。** 題目的每個陳述（定理那一行，以及它所談的定義）都必須**原封不動**地出現在你的檔案裡；只有多出的空白和換行會被忽略。否則根本不會交給 Lean。",
            ],
            [
              "**Lean.** The file is checked by Lean, with a `#print axioms` line added for each of the problem's theorems.",
              "**Lean。** 檔案交給 Lean 檢查，並替題目的每個定理加上一行 `#print axioms`。",
            ],
            ["**The verdict**, from what Lean said:", "**判定**，依據 Lean 的回應："],
          ]}
        />
        <Table
          head={[
            ["Verdict", "判定"],
            ["When", "什麼時候"],
          ]}
          rows={[
            [
              ["Lean found a problem", "Lean 發現了問題"],
              [
                "Lean reported an error, a problem's theorem is missing, the statement was changed, or the proof uses an axiom other than the standard three.",
                "Lean 回報了錯誤、題目的定理不見了、陳述被改過，或證明用了三個標準公理以外的公理。",
              ],
            ],
            [
              ["Not finished yet", "還沒完成"],
              [
                "No error, but a `sorry` is left (in the file, or as `sorryAx` in the axioms).",
                "沒有錯誤，但還留著 `sorry`（在檔案裡，或以 `sorryAx` 出現在公理中）。",
              ],
            ],
            [
              ["✓ Proved", "✓ 已證明"],
              [
                "No error, no `sorry`, only `propext`, `Quot.sound`, `Classical.choice`.",
                "沒有錯誤、沒有 `sorry`，只用了 `propext`、`Quot.sound`、`Classical.choice`。",
              ],
            ],
          ]}
        />
        <P
          t={[
            "Why check the statement as text? Because Lean would happily accept a proof of an easier claim. This file compiles, but it is not the problem *hello*:",
            "為什麼要把陳述當文字比對？因為 Lean 會欣然接受一個較簡單的說法的證明。這個檔案能編譯，但它不是〈hello〉這一題：",
          ]}
        />
        <Lean
          code={snippet("Verify", "changed-statement")}
          note={["Lean accepts it; Formalizer doesn't", "Lean 接受，Formalizer 不接受"]}
        />
        <Output error text="the problem's statement was changed: keep it exactly as given and only replace `sorry`" />
        <TryIn ids={["hello", "induction-double"]} />
        <p>
          <SiteLink to={["skills", "errors", "page"]} label={["Reading the Goals and Result panels", "讀懂目標與結果面板"]} />
        </p>
      </Section>

      <Section page={PAGE} id="comparator" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "A text comparison is fine for exercises you write yourself. For a proof from an untrusted source, say thousands of lines written by an AI model, the Lean FRO's **Comparator** does a stronger version of the same idea. Formalizer's research problems come from collections published as Comparator challenges, such as openai/NavierStokesAndEuler.",
            "對你自己寫的練習，比對文字就夠了。但如果證明來自不可信的來源，例如 AI 模型寫的數千行程式，Lean FRO 的 **Comparator** 會把同樣的想法做得更嚴格。Formalizer 的研究題來自以 Comparator 挑戰形式發布的題庫，例如 openai/NavierStokesAndEuler。",
          ]}
        />
        <P
          t={[
            "A **challenge** has two parts: a statement module (`Challenge.lean`), with the theorems and `sorry` as their proofs, and a JSON config naming the theorems to check and the permitted axioms. The **solution** is another module that must prove *exactly* those theorems. This is the config of the Navier–Stokes challenge:",
            "一個**挑戰**有兩部分：陳述模組（`Challenge.lean`），裡面是以 `sorry` 當證明的定理；以及一個 JSON 設定檔，列出要檢查的定理名稱與允許的公理。**解答**是另一個模組，必須證出*正好*這些定理。以下是 Navier–Stokes 挑戰的設定檔：",
          ]}
        />
        <Figure
          caption={[
            "`ComparatorChallenges/NavierStokes.json` in openai/NavierStokesAndEuler",
            "openai/NavierStokesAndEuler 中的 `ComparatorChallenges/NavierStokes.json`",
          ]}
        >
          <pre className="w-full overflow-x-auto rounded bg-white p-3 text-left font-mono text-xs text-gray-800">{NS_CONFIG}</pre>
        </Figure>
        <P t={["What Comparator does, as its README describes it:", "Comparator 做的事，依它的 README 所述："]} />
        <List
          ordered
          items={[
            [
              "Builds the challenge, then the solution, each inside a **landrun** sandbox (a Linux tool that limits what a program may read and write), so malicious code run during the build can't tamper with the checker.",
              "先建置挑戰，再建置解答，各自在 **landrun** 沙盒裡進行（landrun 是限制程式能讀寫什麼的 Linux 工具），讓建置過程中執行的惡意程式碼無法竄改檢查者。",
            ],
            [
              "Exports both with **lean4export**, a plain text format of every declaration, so the checker doesn't have to load Lean's binary files.",
              "用 **lean4export** 把兩者匯出成純文字格式，記錄每一個宣告，讓檢查者不必載入 Lean 的二進位檔。",
            ],
            [
              "Checks that every declaration used in the statements of the listed theorems is **the same** in the solution as in the challenge.",
              "檢查列出的定理，其陳述中用到的每一個宣告，在解答裡與在挑戰裡**完全相同**。",
            ],
            ["Checks that those theorems use only the `permitted_axioms`.", "檢查這些定理只用了 `permitted_axioms` 中的公理。"],
            [
              'Replays the solution through Lean\'s kernel and, if the config asks for it (`"enable_nanoda": true`, or a list of `external_kernels`), through an **independent kernel** such as nanoda, written separately in Rust.',
              '把解答重新交給 Lean 的核心檢查；如果設定檔有要求（`"enable_nanoda": true`，或列出 `external_kernels`），還會交給**獨立的核心**，例如另外用 Rust 寫成的 nanoda。',
            ],
          ]}
        />
        <P
          t={[
            "If it succeeds, each listed theorem in the solution proves the same statement as in the challenge, uses no more axioms than permitted, and is accepted by the kernel. Two kernels written by different people are unlikely to share the same bug.",
            "如果檢查成功，解答裡每個列出的定理，都證明了與挑戰相同的陳述、沒有用超出允許範圍的公理，並且被核心接受。由不同的人寫的兩個核心，不太可能有一樣的漏洞。",
          ]}
        />
        <Callout kind="note" title={["Now part of Lean", "現已併入 Lean"]}>
          <P
            t={[
              "Comparator's README says it was merged into Lean itself in release v4.35.0, as `lake comparator` and `lake check`. Formalizer pins Lean v4.34.1, the version of the openai/math challenges, where Comparator is still the standalone tool.",
              "Comparator 的 README 指出，它已在 Lean v4.35.0 版併入 Lean 本身，成為 `lake comparator` 與 `lake check`。Formalizer 固定使用 Lean v4.34.1（openai/math 挑戰所用的版本），在這個版本中 Comparator 仍是獨立的工具。",
            ]}
          />
        </Callout>
        <Callout kind="warn" title={["Holes in definitions need a human", "定義裡的空洞需要人來看"]}>
          <P
            t={[
              "A challenge may also leave a *definition* open (`definition_names`). Comparator then checks only its name, type and axioms, not that it is the intended answer: the README warns such solutions can be gamed and must always be checked by an additional, possibly human, verifier.",
              "挑戰也可能留下一個未填的*定義*（`definition_names`）。這時 Comparator 只檢查它的名字、型別與公理，不檢查它是不是預期的答案：README 提醒這類解答可能被鑽漏洞，一定要再經過另一位（可能是人類的）檢查者。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            COMPARATOR,
            { label: "Zouuup/landrun", url: "https://github.com/Zouuup/landrun" },
            { label: "leanprover/lean4export", url: "https://github.com/leanprover/lean4export" },
            { label: "ammkrn/nanoda_lib", url: "https://github.com/ammkrn/nanoda_lib" },
            { label: "openai/NavierStokesAndEuler", url: "https://github.com/openai/NavierStokesAndEuler" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="ladder" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "The Lean Language Reference describes a ladder of checks. Each rung guards against more, and costs more; which you need depends on whether the proof is an honest attempt or might be trying to fool you.",
            "Lean 語言參考手冊描述了一道檢查的階梯。每往上一階，防得越多，代價也越高；需要哪一階，取決於這個證明是誠實的嘗試，還是可能想騙你。",
          ]}
        />
        <Table
          head={[
            ["Check", "檢查"],
            ["Catches", "抓得到"],
            ["Use it for", "適用於"],
          ]}
          rows={[
            [
              ["No errors (the editor's check marks, or `lake build`)", "沒有錯誤（編輯器的勾勾，或 `lake build`）"],
              ["Unfinished steps, tactic errors, `sorry` in this theorem.", "未完成的步驟、戰術錯誤、這個定理裡的 `sorry`。"],
              ["Everyday work.", "日常工作。"],
            ],
            [
              ["`#print axioms`", "`#print axioms`"],
              [
                "Also `sorry` in lemmas it uses, custom axioms, `_native` evaluation.",
                "還有它用到的引理裡的 `sorry`、自訂公理、`_native` 執行。",
              ],
              ["Any proof you want to rely on. Formalizer does this on every Run.", "任何你想依賴的證明。Formalizer 每次執行都會做。"],
            ],
            [
              ["`lean4checker`", "`lean4checker`"],
              ["Proofs that bypassed the kernel inside Lean's own files (`.olean`).", "在 Lean 自己的檔案（`.olean`）裡繞過核心的證明。"],
              ["A project's CI.", "專案的 CI。"],
            ],
            [
              ["Comparator with an external kernel", "Comparator 加上外部核心"],
              ["Actively malicious proofs; a bug in one kernel.", "蓄意作惡的證明；單一核心的漏洞。"],
              ["Competitions, AI-generated proofs, high stakes.", "競賽、AI 生成的證明、高風險的場合。"],
            ],
          ]}
        />
        <P
          t={[
            "Even at the top, some trust remains: in Lean's logic, in the sandbox, in not every kernel sharing one bug, and in the challenge statement saying what people think it says.",
            "即使到了最上面一階，仍有一些信任無法省去：信任 Lean 的邏輯、信任沙盒、信任不是每個核心都有同一個漏洞，以及信任挑戰陳述說的正是大家以為的意思。",
          ]}
        />
        <Sources items={[REF_VALIDATING]} />
      </Section>

      <Section page={PAGE} id="statement" n={8} title={SECTIONS[7].title}>
        <P
          t={[
            "No checker can tell you whether the statement says what you meant. That is the one part a human must read. A classic trap is hypotheses that can never all be true: then the theorem is about nothing, and anything follows.",
            "沒有任何檢查工具能告訴你，陳述說的是不是你想說的。這是唯一必須由人來讀的部分。經典的陷阱是：前提不可能同時成立。這時定理談的是空無一物，任何結論都推得出來。",
          ]}
        />
        <Lean
          code={snippet("Verify", "vacuous")}
          note={["true, uses only standard axioms, and says nothing", "為真，只用標準公理，但什麼也沒說"]}
        />
        <P
          t={[
            'No natural number is below $0$, so `h` can never hold and `n = 42` is "proved". Questions to ask of any statement:',
            "沒有任何自然數小於 $0$，所以 `h` 永遠不成立，於是 `n = 42` 就被「證明」了。對任何陳述都該問的問題：",
          ]}
        />
        <List
          items={[
            [
              "Can all the hypotheses be true at once? Try a concrete example that satisfies them.",
              "所有前提能同時成立嗎？試著舉一個滿足它們的具體例子。",
            ],
            [
              "Are the types right? `Nat` has no negative numbers and `5 - 7 = 0` in `Nat`; a statement about `Nat` may not be the one about integers or reals you had in mind.",
              "型別對嗎？`Nat` 沒有負數，而且在 `Nat` 裡 `5 - 7 = 0`；關於 `Nat` 的陳述，可能不是你心中關於整數或實數的那一個。",
            ],
            [
              "What do the definitions say? A theorem about `double` is only as good as the definition of `double`; read it too.",
              "定義說了什麼？關於 `double` 的定理，好壞取決於 `double` 的定義；也要讀它。",
            ],
            [
              "Does it match the source? For a research result, compare it line by line with the statement in the paper.",
              "它與原始出處相符嗎？研究成果要逐行與論文中的陳述比對。",
            ],
          ]}
        />
        <p>
          <SiteLink to={["concept", "limits"]} label={["What formal proof can't tell you", "形式證明無法告訴你的事"]} />
        </p>
      </Section>

      <Section page={PAGE} id="checklist" n={9} title={SECTIONS[8].title}>
        <List
          ordered
          items={[
            ["**No errors.** Fix every error; read every warning.", "**沒有錯誤。** 修掉每個錯誤；讀過每個警告。"],
            [
              "**`#print axioms` on the main theorem** shows nothing, or only `propext`, `Quot.sound`, `Classical.choice`. No `sorryAx`, nothing with `_native`, no axiom you didn't expect.",
              "**對主要定理執行 `#print axioms`**，結果是沒有公理，或只有 `propext`、`Quot.sound`、`Classical.choice`。沒有 `sorryAx`、沒有含 `_native` 的名字、沒有你沒預期到的公理。",
            ],
            [
              "**The statement is unchanged.** It matches the problem or paper exactly, including the definitions it uses.",
              "**陳述沒被改過。** 它與題目或論文完全一致，包括它用到的定義。",
            ],
            [
              "**The statement means what you think.** The hypotheses can all hold; the types and definitions are the intended ones.",
              "**陳述的意思就是你以為的意思。** 前提能同時成立；型別與定義都是想要的那些。",
            ],
            [
              "**If you didn't write it and it matters**, check it with Comparator in a sandbox, with an external kernel.",
              "**如果不是你寫的，而且事關重大**，就在沙盒裡用 Comparator 檢查，並加上外部核心。",
            ],
          ]}
        />
        <Callout kind="tip" title={["Formalizer's green check covers 1 to 3", "Formalizer 的綠色勾勾涵蓋第 1 到 3 項"]}>
          <P
            t={[
              "*Proved* on a problem page means no errors, no `sorry`, only standard axioms, and the problem's statement unchanged. Item 4 was done when the problem was written; item 5 is for the research challenges.",
              "題目頁上的「已證明」代表：沒有錯誤、沒有 `sorry`、只用標準公理，而且題目的陳述沒被改過。第 4 項在出題時就已經做過；第 5 項則是針對研究挑戰。",
            ]}
          />
        </Callout>
        <TryIn ids={["hello", "gauss"]} />
        <Sources items={[REF_VALIDATING, COMPARATOR]} />
      </Section>
    </Page>
  );
}
