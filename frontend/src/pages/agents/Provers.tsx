/**
 * AI agent ▸ AI provers (#/agents/provers[/<section>]): how AI theorem provers fit Lean (they propose, the kernel
 * checks), the systems (AlphaProof, DeepSeek-Prover, Goedel-Prover, Seed-Prover, Aristotle, in-editor helpers), the
 * benchmarks (miniF2F, PutnamBench). The plan for suggestions in the workspace is the Product roadmap tab (Roadmap.tsx).
 * Figures were checked against the papers and project pages in November 2026.
 */
import { Callout, List, P, Page, Section, SiteLink, Sources, Table, type SectionInfo } from "../kit";

const PAGE = "provers";

const SECTIONS: SectionInfo[] = [
  { id: "idea", title: ["An AI prover proposes, Lean checks", "AI 證明器負責提議，Lean 負責檢查"] },
  { id: "lean-search", title: ["Before AI: Lean's own search", "在 AI 之前：Lean 自己的搜尋"] },
  { id: "systems", title: ["The systems, 2024–2026", "2024–2026 年的系統"] },
  { id: "helpers", title: ["In the editor: tactic suggestions", "在編輯器裡：戰術建議"] },
  { id: "benchmarks", title: ["Benchmarks: miniF2F and PutnamBench", "評測基準：miniF2F 與 PutnamBench"] },
];

export default function ProversAgent({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["AI provers", "AI 證明器"]}
      intro={[
        "Programs that find Lean proofs by themselves: AlphaProof, DeepSeek-Prover and others, and the benchmarks such as miniF2F they are measured on. What they can do, what they can't, and how Formalizer will use them: as one more source of tactics, checked by Lean like every other.",
        "能自己找出 Lean 證明的程式：AlphaProof、DeepSeek-Prover 等等，以及用來衡量它們的評測基準，例如 miniF2F。它們能做什麼、不能做什麼，以及 Formalizer 打算怎麼用它們：當成又一個戰術來源，和其他戰術一樣交給 Lean 檢查。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="idea" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "Since Milner's LCF, a tactic has been a program that *proposes* a step, and the checker decides whether the step is valid. In Lean every tactic, however clever, ends as a proof term that the small kernel re-checks. An AI prover is the same idea at a larger scale: a trained model writes tactics (or whole proofs), and Lean runs them. A wrong suggestion is an error message, never a wrong theorem.",
            "從 Milner 的 LCF 開始，戰術就是一個 *提議* 下一步的程式，由檢查器決定這一步是否成立。在 Lean 裡，再聰明的戰術最後都會變成證明項，交給小小的核心（kernel）重新檢查。AI 證明器是同一個想法的放大版：訓練好的模型寫出戰術（或整個證明），由 Lean 執行。錯的建議只會變成錯誤訊息，永遠不會變成錯的定理。",
          ]}
        />
        <Callout kind="note" title={["So what still needs a person?", "那還有什麼需要人？"]}>
          <List
            items={[
              [
                "**The statement.** The kernel checks that the proof proves the statement *as written*. If the statement says something else than you meant, a perfect proof does not help.",
                "**陳述。** 核心只檢查證明是否證出 *寫下來的* 陳述。如果陳述說的不是你想的，再完美的證明也沒用。",
              ],
              [
                "**The axioms.** `#print axioms` should show only `propext`, `Quot.sound` and `Classical.choice`. A prover that reaches for `sorry` or `native_decide` has not finished.",
                "**公理。** `#print axioms` 應該只列出 `propext`、`Quot.sound` 與 `Classical.choice`。用了 `sorry` 或 `native_decide` 的證明器還沒有完成。",
              ],
              [
                "**Understanding.** A machine proof can be correct and unreadable. The dependency graph in the Result panel shows which lemmas it used.",
                "**理解。** 機器證明可以正確卻難以閱讀。結果面板裡的依賴圖會告訴你它用了哪些引理。",
              ],
            ]}
          />
          <p className="flex flex-wrap gap-4">
            <SiteLink to={["skills", "tactics", "history"]} label={["Where tactics come from", "戰術從哪裡來"]} />
            <SiteLink to={["concept", "limits"]} label={["Limits of proofs", "證明的極限"]} />
          </p>
        </Callout>
      </Section>

      <Section page={PAGE} id="lean-search" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Lean already searches for you, with no AI and nothing leaving your computer. Put one of these where the `sorry` is; Lean answers with a suggestion you can click to insert.",
            "Lean 本來就會幫你搜尋，不用 AI，也不會有任何東西離開你的電腦。把下面其中一個放在 `sorry` 的位置；Lean 會回一個建議，點一下就能插入。",
          ]}
        />
        <Table
          head={[
            ["Write", "寫"],
            ["Lean looks for", "Lean 會找"],
          ]}
          rows={[
            [
              ["`exact?`", "`exact?`"],
              ["one library lemma that closes the goal", "一條能直接關掉目標的函式庫引理"],
            ],
            [
              ["`apply?`", "`apply?`"],
              [
                "lemmas whose conclusion fits the goal, leaving their hypotheses as new goals",
                "結論符合目標的引理，把它們的前提留成新目標",
              ],
            ],
            [
              ["`rw?`", "`rw?`"],
              ["equations that can rewrite the goal", "可以改寫目標的等式"],
            ],
            [
              ["`simp?`", "`simp?`"],
              ["runs `simp` and prints the exact `simp only [...]` it used", "執行 `simp`，並印出它實際用到的 `simp only [...]`"],
            ],
          ]}
        />
        <P
          t={[
            "These are the first level of the free AI suggestions (see the Product roadmap), because they are free, fast and exact. AI provers help where they give up: proofs of several steps, or steps that need an idea.",
            "這些是免費 AI 建議的第一層（見產品路線圖），因為它們免費、快速又精確。AI 證明器幫的是它們放棄的地方：好幾步的證明，或需要一個想法的那一步。",
          ]}
        />
        <SiteLink to={["skills", "search"]} label={["Finding lemmas", "找引理"]} />
      </Section>

      <Section page={PAGE} id="systems" n={3} title={SECTIONS[2].title}>
        <Table
          head={[
            ["System", "系統"],
            ["Who, when", "誰、何時"],
            ["What to know", "要知道的事"],
          ]}
          rows={[
            [
              ["**AlphaProof**", "**AlphaProof**"],
              ["Google DeepMind; IMO July 2024, *Nature* November 2025", "Google DeepMind；2024 年 7 月 IMO，2025 年 11 月登上 *Nature*"],
              [
                "Learns like AlphaZero: reinforcement learning on millions of problems translated into Lean, and more learning on variants of the hard problem at test time. With AlphaGeometry 2 it scored at silver-medal level at IMO 2024 (AlphaProof proved problems 1, 2 and 6). Very costly (days of compute per hard problem). No public weights; DeepMind gave limited access to selected mathematicians.",
                "像 AlphaZero 那樣學習：在數百萬道翻譯成 Lean 的題目上做強化學習，考試時再針對難題的變形繼續學。和 AlphaGeometry 2 一起在 2024 年 IMO 達到銀牌水準（AlphaProof 證出第 1、2、6 題）。成本很高（一道難題要算上好幾天）。沒有公開權重；DeepMind 只開放給部分數學家有限度使用。",
              ],
            ],
            [
              ["**DeepSeek-Prover**", "**DeepSeek-Prover**"],
              ["DeepSeek; V1 and V1.5 in 2024, V2 in April 2025", "DeepSeek；2024 年 V1 與 V1.5，2025 年 4 月 V2"],
              [
                "Open weights (7B and 671B, under DeepSeek's model licence). V2 first sketches a proof as `have` sub-goals, then proves each one. The 671B model reports 88.9% on miniF2F-test (with 8192 tries per problem) and 49 PutnamBench problems. The 7B model fits on a good laptop.",
                "公開權重（7B 與 671B，採 DeepSeek 的模型授權）。V2 先把證明拆成幾個 `have` 子目標的草稿，再一個個證明。671B 模型在 miniF2F-test 上報告 88.9%（每題試 8192 次），並解出 49 道 PutnamBench 題目。7B 模型一台好一點的筆電就跑得動。",
              ],
            ],
            [
              ["**Goedel-Prover-V2**", "**Goedel-Prover-V2**"],
              ["Princeton and others; August 2025", "普林斯頓等；2025 年 8 月"],
              [
                "Open weights (8B and 32B). Trained to read Lean's error messages and correct its own proof. The 32B model reports 88.1% on miniF2F-test with 32 tries, 90.4% after self-correction.",
                "公開權重（8B 與 32B）。訓練它讀 Lean 的錯誤訊息並修正自己的證明。32B 模型在 miniF2F-test 上試 32 次報告 88.1%，自我修正後 90.4%。",
              ],
            ],
            [
              ["**Seed-Prover**", "**Seed-Prover**"],
              ["ByteDance Seed; July 2025", "字節跳動 Seed；2025 年 7 月"],
              [
                "Proves lemma by lemma and refines with Lean's feedback. At IMO 2025 it proved 5 of 6 problems in Lean (one after the contest, geometry with its own Seed-Geometry); reports 99.6% on miniF2F-test.",
                "一條一條引理地證，並依 Lean 的回饋修正。在 2025 年 IMO 用 Lean 證出 6 題中的 5 題（其中一題在比賽後完成，幾何題交給自家的 Seed-Geometry）；在 miniF2F-test 上報告 99.6%。",
              ],
            ],
            [
              ["**Aristotle**", "**Aristotle**"],
              ["Harmonic; 2025", "Harmonic；2025 年"],
              [
                "Formal solutions in Lean 4 to 5 of the 6 IMO 2025 problems (gold-medal level, by its authors' count). Offered as a service.",
                "為 2025 年 IMO 6 題中的 5 題寫出 Lean 4 形式解答（作者自己的計算是金牌水準）。以服務形式提供。",
              ],
            ],
          ]}
        />
        <P
          t={[
            "The common pattern: a language model writes Lean, Lean checks, and the error messages feed the next attempt. What differs is how they search (many independent tries, a tree of tactics, or a sketch of sub-goals) and how much compute they spend.",
            "共同的模式是：語言模型寫 Lean、Lean 檢查、錯誤訊息回饋給下一次嘗試。不同的是搜尋方式（大量獨立嘗試、戰術樹，或子目標草稿），以及花多少算力。",
          ]}
        />
        <Sources
          items={[
            {
              label: "Hubert et al., Olympiad-level formal mathematical reasoning with reinforcement learning, Nature (2025)",
              url: "https://doi.org/10.1038/s41586-025-09833-y",
            },
            {
              label: "Google DeepMind, AI achieves silver-medal standard solving IMO problems (2024)",
              url: "https://deepmind.google/discover/blog/ai-achieves-silver-medal-standard-solving-international-mathematical-olympiad-problems/",
            },
            { label: "DeepSeek-Prover-V2 (paper)", url: "https://arxiv.org/abs/2504.21801" },
            { label: "DeepSeek-Prover-V2 (code and weights)", url: "https://github.com/deepseek-ai/DeepSeek-Prover-V2" },
            { label: "Goedel-Prover-V2 (paper)", url: "https://arxiv.org/abs/2508.03613" },
            { label: "Seed-Prover (paper)", url: "https://arxiv.org/abs/2507.23726" },
            { label: "Aristotle: IMO-level automated theorem proving (paper)", url: "https://arxiv.org/abs/2510.01346" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="helpers" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "Big provers try to finish a whole theorem. For learning, a smaller tool is often better: one that suggests the *next tactic* where you are stuck, and leaves the thinking to you.",
            "大型證明器想一口氣證完整個定理。學習時，小一點的工具常常更好：在你卡住的地方建議 *下一個戰術*，思考留給你自己。",
          ]}
        />
        <Table
          head={[
            ["Tool", "工具"],
            ["How it works", "怎麼運作"],
          ]}
          rows={[
            [
              ["**Lean Copilot** (LeanDojo, 2024)", "**Lean Copilot**（LeanDojo，2024）"],
              [
                "`suggest_tactics` in a proof lists tactics from a small model running on your computer; Lean tries each and marks those that work. `search_proof` searches for a whole proof.",
                "在證明中寫 `suggest_tactics`，會列出由你電腦上的小模型產生的戰術；Lean 逐一試過，標出能用的。`search_proof` 則搜尋整個證明。",
              ],
            ],
            [
              ["**LLMLean** (CMU, 2024)", "**LLMLean**（CMU，2024）"],
              [
                '`llmstep ""` suggests the next tactic, `llmqed` tries to finish. Works with a local model through Ollama, or a cloud model if you choose.',
                '`llmstep ""` 建議下一個戰術，`llmqed` 嘗試完成證明。可透過 Ollama 用本機模型，也可以自行選擇雲端模型。',
              ],
            ],
          ]}
        />
        <Sources
          items={[
            {
              label: "Lean Copilot: Large Language Models as Copilots for Theorem Proving in Lean",
              url: "https://arxiv.org/abs/2404.12534",
            },
            { label: "LLMLean", url: "https://github.com/cmu-l3/llmlean" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="benchmarks" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "**miniF2F** is not a model but a test set: 488 competition problems (AMC, AIME, IMO, and the MATH dataset), half for validation and 244 for the test, stated formally (first in Lean 3, Metamath and Isabelle; now in Lean 4). It was published in 2021 by Kunhao Zheng, Jesse Michael Han and Stanislas Polu, and has been the standard yardstick since.",
            "**miniF2F** 不是模型，而是一套測驗題：488 道競賽題（AMC、AIME、IMO，以及 MATH 資料集），一半當驗證集、244 道當測試集，全部寫成形式陳述（最早有 Lean 3、Metamath 與 Isabelle 版本，現在有 Lean 4 版）。它由 Kunhao Zheng、Jesse Michael Han 與 Stanislas Polu 在 2021 年發表，從此成為標準量尺。",
          ]}
        />
        <List
          items={[
            [
              "**Read the budget.** *pass@32* means 32 tries per problem, and a problem counts if any try is accepted by Lean. 88.9% at pass@8192 and 88.1% at pass@32 are very different costs.",
              "**看預算。** *pass@32* 指每題試 32 次，只要有一次被 Lean 接受就算解出。pass@8192 的 88.9% 與 pass@32 的 88.1%，成本差了好幾個數量級。",
            ],
            [
              "**It is nearly used up.** Top systems now report about 99% on miniF2F-test, so newer benchmarks matter more: **PutnamBench** (Putnam competition problems, about 660, in Lean, Isabelle and Coq) and research-level sets such as the openai/math challenges this site will use.",
              "**它快被考完了。** 最強的系統在 miniF2F-test 上已報告約 99%，所以較新的基準更重要：**PutnamBench**（Putnam 競賽題，約 660 道，有 Lean、Isabelle 與 Coq 版本），以及研究等級的題組，例如本站之後會用的 openai/math 挑戰。",
            ],
            [
              "**Statements can be wrong.** Benchmark statements were formalised by people and models; a few were later found false or too easy as written. The same lesson as everywhere in Lean: check the statement.",
              "**陳述也可能錯。** 基準題的陳述是由人和模型形式化的；後來發現其中幾題照字面寫是錯的，或太容易。和 Lean 其他地方一樣的教訓：先檢查陳述。",
            ],
          ]}
        />
        <Sources
          items={[
            {
              label: "Zheng, Han, Polu, miniF2F: a cross-system benchmark for formal Olympiad-level mathematics (2021)",
              url: "https://arxiv.org/abs/2109.00110",
            },
            { label: "Tsoukalas et al., PutnamBench (2024)", url: "https://arxiv.org/abs/2407.11214" },
          ]}
        />
      </Section>
    </Page>
  );
}
