/**
 * Concept ▸ AI provers (#/concept/provers[/<section>]; the old #/agents/provers leads here): how AI theorem provers fit Lean (they propose, the kernel
 * checks), the systems (AlphaProof, DeepSeek-Prover, Goedel-Prover, Seed-Prover, Aristotle, in-editor helpers), the
 * benchmarks (miniF2F, PutnamBench). The plan for suggestions in the workspace is the Product roadmap tab (Roadmap.tsx).
 * Figures were checked against the papers and project pages in November 2026.
 */
import { useLang } from "@learnkit/web";
import { Callout, Figure, List, P, Page, Section, SiteLink, Sources, Table, type SectionInfo } from "../kit";
import { DivideConquer, LearningLoop, ProposeCheck, ProverSpectrum, SearchStrategies } from "./ProverFigures";

const PAGE = "provers";

const SECTIONS: SectionInfo[] = [
  { id: "idea", title: ["An AI prover proposes, Lean checks", "AI 證明器負責提議，Lean 負責檢查"] },
  { id: "lean-search", title: ["Before AI: Lean's own search", "在 AI 之前：Lean 自己的搜尋"] },
  { id: "inside", title: ["Inside an AI prover: no magic, three ideas", "打開 AI 證明器：沒有魔法，只有三個想法"] },
  { id: "systems", title: ["The systems, 2024–2026", "2024–2026 年的系統"] },
  { id: "helpers", title: ["In the editor: tactic suggestions", "在編輯器裡：戰術建議"] },
  { id: "benchmarks", title: ["Benchmarks: miniF2F and PutnamBench", "評測基準：miniF2F 與 PutnamBench"] },
];

export default function ProversConcept({ section }: { section: string | null }) {
  const { pick } = useLang();
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
        <Figure
          caption={[
            "The one loop inside every AI prover: the model guesses, Lean's kernel decides. A wrong guess only costs a try; its error message becomes the next hint.",
            "每個 AI 證明器裡都是同一個迴圈：模型負責猜，Lean 的核心負責判定。猜錯只是浪費一次嘗試；錯誤訊息變成下一次的提示。",
          ]}
        >
          <ProposeCheck />
        </Figure>
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

      <Section page={PAGE} id="inside" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            'An AI prover is often described as a black box that "does mathematics". Opened up, the systems below combine three understandable ideas. None of them needs you to trust the model: Lean checks everything that survives.',
            "AI 證明器常被說成一個會「做數學」的黑盒子。打開來看，下面這些系統是由三個可以理解的想法組合起來的。沒有一個需要你相信模型：留下來的每一樣東西都由 Lean 檢查。",
          ]}
        />
        <p className="text-base font-semibold text-gray-900">1 · {pick(["Divide and conquer with sorry", "用 sorry 各個擊破"])}</p>
        <P
          t={[
            "The same method this site teaches people: write the plan as a skeleton of `sorry`s, then close one hole at a time. *Draft, Sketch, and Prove* (2022) turned an informal proof into a formal sketch with holes for an automated prover to fill, and DeepSeek-Prover-V2 trains on proofs made this way: its large model splits a problem into subgoals, and a smaller prover solves each. Step through it:",
            "和本站教人的方法一樣：先用一個個 `sorry` 寫出證明骨架，再一次補一個洞。*Draft, Sketch, and Prove*（2022）把非形式證明變成帶洞的形式骨架，再由自動證明器補洞；DeepSeek-Prover-V2 就是用這樣做出來的證明來訓練：大模型把問題拆成子目標，較小的證明器逐一解決。一步一步看：",
          ]}
        />
        <Figure
          caption={[
            "Divide and conquer: a hard proof becomes several small ones; a hole that resists is split again. Amber = still `sorry`, green = proved by Lean.",
            "各個擊破：一個難的證明變成幾個小的；攻不下的洞再拆開。琥珀色 = 還是 `sorry`，綠色 = Lean 已證明。",
          ]}
        >
          <DivideConquer />
        </Figure>
        <p className="text-base font-semibold text-gray-900">
          2 · {pick(["Search: try many, keep what Lean accepts", "搜尋：多試幾次，留下 Lean 接受的"])}
        </p>
        <P
          t={[
            "A model's single guess is often wrong, so provers make many and let Lean sort them. Some write whole proofs again and again and keep the one that checks (results are reported as *pass@k*: solved within k tries). Others grow a tree of single tactic steps, where Lean computes each new goal and the model only judges which branch looks promising, as AlphaZero judged positions in Go.",
            "模型猜一次常常會錯，所以證明器猜很多次，讓 Lean 來篩選。有的一次次寫出整份證明，留下通過檢查的那一份（結果寫成 *pass@k*：k 次嘗試之內解出）。有的長出一棵由單一戰術步驟構成的樹：每個新目標由 Lean 算出，模型只判斷哪個分支比較有希望，就像 AlphaZero 在圍棋裡評估局面。",
          ]}
        />
        <Figure
          caption={[
            "Two ways to search. Either way the model never decides what is true: Lean computes every goal and accepts or rejects every proof.",
            "兩種搜尋方式。不論哪一種，模型都不決定什麼是對的：每個目標都由 Lean 算出，每個證明都由 Lean 接受或拒絕。",
          ]}
        >
          <SearchStrategies />
        </Figure>
        <p className="text-base font-semibold text-gray-900">3 · {pick(["Learning from Lean's verdict", "從 Lean 的判定中學習"])}</p>
        <P
          t={[
            "Why is mathematics suddenly a frontier for AI? Because a proof checker gives an exact, free, tireless answer: right or wrong. That is a perfect training signal. AlphaProof had about a million informal problems turned into formal statements by a formalizer network, then trained its solver network by proving or disproving them, AlphaZero-style, for weeks before IMO 2024. Proofs Lean accepts become lessons; harder problems come next.",
            "為什麼數學突然成了 AI 的前沿？因為證明檢查器給出精確、免費、不知疲倦的答案：對或錯。這是完美的訓練訊號。AlphaProof 先由一個形式化網路把大約一百萬道非形式題目轉成形式化陳述，再讓解題網路以 AlphaZero 的方式證明或否證它們，在 2024 年 IMO 前訓練了好幾週。Lean 接受的證明成為教材，接著換更難的題目。",
          ]}
        />
        <Figure
          caption={[
            "The learning loop: no human grader is needed, because Lean's ✓ or ✖ is the reward. This is what makes AI in mathematics a genuinely new direction: progress can be checked, not just claimed.",
            "學習迴圈：不需要人來改，因為 Lean 的 ✓ 或 ✖ 就是獎勵。這正是 AI 做數學成為真正新方向的原因：進展可以被檢查，而不只是被宣稱。",
          ]}
        >
          <LearningLoop />
        </Figure>
        <Callout kind="note" title={["The same method as yours", "和你用的是同一套方法"]}>
          <P
            t={[
              "Plan with `sorry`, check often, read the goal, split what is hard: the strategies that work for AI provers are the habits this site teaches. The difference is speed and patience: a prover can try ten thousand times; you can understand why the one that worked works.",
              "用 `sorry` 規劃、經常檢查、讀懂目標、把難的拆開：對 AI 證明器有效的策略，正是本站教的習慣。差別在速度與耐心：證明器可以試一萬次；而你能理解成功的那一次為什麼成功。",
            ]}
          />
          <SiteLink to={["concept", "method"]} label={["The method: a plan made of sorrys", "方法：用 sorry 搭出計畫"]} />
        </Callout>
        <Sources
          items={[
            { label: "Jiang et al., Draft, Sketch, and Prove (arXiv 2210.12283)", url: "https://arxiv.org/abs/2210.12283" },
            { label: "DeepSeek-Prover-V2: subgoal decomposition (arXiv 2504.21801)", url: "https://arxiv.org/abs/2504.21801" },
            {
              label: "Google DeepMind: AlphaProof's training loop (2024)",
              url: "https://deepmind.google/discover/blog/ai-achieves-silver-medal-standard-solving-international-mathematical-olympiad-problems/",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="systems" n={4} title={SECTIONS[3].title}>
        <Figure
          caption={[
            "From Lean's own search to research-level claims: the further right, the more the AI does. What never moves is the bottom row.",
            "從 Lean 自己的搜尋到研究級的宣稱：越往右，AI 做得越多。永遠不變的是最下面那一列。",
          ]}
        >
          <ProverSpectrum />
        </Figure>
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
        <Callout title={["Beyond olympiads: a claim under review (November 2026)", "超越奧林匹亞：審查中的宣稱（2026 年 11 月）"]}>
          <P
            t={[
              "Levent Alpöge, a mathematician at Anthropic, posted a claimed proof of the Riemann hypothesis found with Claude, published as Lean. Whether it stands now rests on the same two questions as every problem here: is the Lean statement the right one, and does the check pass with only the standard axioms? Experts are still reviewing it.",
              "Anthropic 的數學家 Levent Alpöge 發布了一個與 Claude 合作找到、以 Lean 公開的黎曼猜想證明宣稱。它是否成立，取決於和本站每一題相同的兩個問題：Lean 的陳述對不對？檢查是否只用標準公理就能通過？專家仍在審查中。",
            ]}
          />
          <SiteLink
            to={["concept", "history", "riemann-2026"]}
            label={["Lean history: the card and its sources", "Lean 歷史：這張卡片與來源"]}
          />
        </Callout>
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

      <Section page={PAGE} id="helpers" n={5} title={SECTIONS[4].title}>
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

      <Section page={PAGE} id="benchmarks" n={6} title={SECTIONS[5].title}>
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
