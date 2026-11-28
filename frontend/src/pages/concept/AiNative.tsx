/**
 * Concept ▸ AI-native mathematics (#/concept/ainative[/<section>]): the traditional workflow (one mind, paper, referees)
 * beside the AI-native one (the human as architect, AI implementing, the kernel checking, git collaboration across the
 * world), the programming ↔ mathematics analogy as tables, why line-by-line reading has to give way, mathematics
 * engineering as a new branch (with the facilities moved here from the RH maps view), and where this site thinks it
 * leads. Sections 5–7 are this site's position, not a consensus; facts about November 2026 are as on the RH page.
 */
import { useLang } from "@learnkit/web";
import { CardTabs } from "./CardTabs";
import { Callout, Figure, List, P, Page, Section, SiteLink, Sources, Table, type SectionInfo } from "../kit";
import { DependencyStacks, DivideConquer, InfoDialog, Eras, GitFlow, GoTimeline, OneMind, PaperStacks, ReadingBudget, ReversePath, TasteFunnel, TddCycle, WorkflowSwitch } from "./AiNativeFigures";

const PAGE = "ainative";

const SECTIONS: SectionInfo[] = [
  { id: "traditional", title: ["The traditional workflow: one mind does everything", "傳統工作流：一個腦袋包辦一切"] },
  { id: "architect", title: ["The AI-native workflow: the human as architect", "AI 原生工作流：人是架構師"] },
  { id: "together", title: ["One project, many hands, no borders", "一個專案、許多雙手、沒有國界"] },
  { id: "analogy", title: ["Programming ↔ mathematics: the analogy", "程式 ↔ 數學：一個類比"] },
  { id: "review", title: ["Why line-by-line reading has to give way", "為什麼逐行閱讀必須退場"] },
  { id: "engineering", title: ["Mathematics engineering: a new branch", "數學工程：一個新的分支"] },
  { id: "outlook", title: ["Cheaper mathematics, more mathematics", "更便宜的數學，更多的數學"] },
];

function Links({ items }: { items: { to: [string, string?, string?]; label: [string, string] }[] }) {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1">
      {items.map((l) => (
        <SiteLink key={l.to.join("/")} to={l.to} label={l.label} />
      ))}
    </p>
  );
}

export default function AiNativeConcept({ section }: { section: string | null }) {
  const { pick } = useLang();
  return (
    <Page
      id={PAGE}
      sections={SECTIONS}
      focus={section}
      title={["AI-native mathematics", "AI 原生數學"]}
      intro={[
        "For most of its history mathematics was done by one mind, or a few, with paper: understanding, proving, writing and checking all happened in human heads. November 2026 showed another way of working: a 17-million-line Lean proof of the Riemann hypothesis made with Claude, a refactor that cut it about 154-fold in five days, and about ninety people with their coding agents formalizing a 940-page human draft in four days. This page sets the two workflows side by side, borrows software engineering's vocabulary for the new one, and ends with where this site thinks it leads. From section 5 on, it is **this site's position, not a consensus**. One warning up front: an AI agent (such as Claude Code, Codex or Antigravity) is a collaborative tool working in a prepared environment, not a web chatbot to ask one question, and in 2026 it does not solve top-tier problems end to end on its own (section 2).",
        "在大部分的歷史裡，數學由一個人或少數幾個人，用紙筆完成：理解、證明、寫作與檢查，全都發生在人的腦袋裡。2026 年 11 月展示了另一種工作方式：一份與 Claude 合作完成、1700 萬行的黎曼猜想 Lean 證明；一次在五天內把它縮短約 154 倍的重構；以及大約九十個人帶著各自的程式代理，四天內把一份 940 頁的人寫草稿形式化。本頁把兩種工作流並排比較，借用軟體工程的詞彙來描述新的那一種，最後談本站認為它會走向哪裡。從第 5 節起是**本站的立場，不是共識**。先說一句提醒：AI 代理（例如 Claude Code、Codex 或 Antigravity）是在建置好的環境裡工作的協作工具，不是丟一個問題就等答案的網頁聊天機器人；而且在 2026 年，它不會自己從頭到尾解決頂尖難題（第 2 節）。",
      ]}
    >
      {/* ------------------------------------------------------------------------------------------------ 1 */}
      <Section page={PAGE} id="traditional" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "In the traditional workflow one person, or a small group, does everything: reads until the problem is understood, finds the idea, works out every step, writes the paper, and then waits while referees read it line by line. The check is done by people and is social: a proof is accepted when enough experts have read it and believe it.",
            "在傳統工作流裡，一個人或一個小組包辦一切：讀到把問題弄懂、找到想法、推出每一步、寫成論文，然後等審稿人逐行閱讀。檢查由人來做，而且是社會性的：當夠多的專家讀過並相信它，一個證明才被接受。",
          ]}
        />
        <Figure caption={["The traditional loop. Everything happens inside a few heads; the only output is a paper, and the only check is people reading it.", "傳統的迴圈。一切都在少數幾個腦袋裡發生；唯一的產出是論文，唯一的檢查是人去讀它。"]}>
          <OneMind />
        </Figure>
        <Table
          head={[
            ["Stage", "階段"],
            ["Who", "誰"],
            ["Tools", "工具"],
            ["How long", "多久"],
          ]}
          rows={[
            [["Understand the field", "弄懂這個領域"], ["the mathematician", "數學家"], ["books, papers, talks", "書、論文、演講"], ["years", "數年"]],
            [["Find the idea", "找到想法"], ["the mathematician", "數學家"], ["paper, blackboard, conversation", "紙、黑板、交談"], ["unpredictable", "無法預測"]],
            [["Work out every step", "推出每一步"], ["the mathematician", "數學家"], ["pencil and paper", "紙筆"], ["months to years", "數月到數年"]],
            [["Write it up", "寫成論文"], ["the mathematician", "數學家"], ["LaTeX", "LaTeX"], ["months", "數月"]],
            [["Check it", "檢查"], ["two or three referees", "兩三位審稿人"], ["reading", "閱讀"], ["months to years", "數月到數年"]],
            [["Fix the errors", "修正錯誤"], ["the author, if found", "作者（如果有人發現）"], ["errata, new versions", "勘誤、新版本"], ["sometimes decades", "有時幾十年"]],
          ]}
        />
        <P
          t={[
            "This workflow has given us almost all the mathematics we have, and its great strength is that **understanding comes built in**: whoever wrote the proof had to understand every line. Its weakness is **scale**. Everything has to fit into a few heads, and the check is only as good as the referees' attention. Alessandro Masullo worked on his proposed proof of GRH for nearly twelve years by hand; within four days of its release a crowdsourced Lean formalization had found 292 statements of the 940-page draft false as printed, and a gap in the main step that, as of 27 November 2026, is still open. A flaw in a 1989 paper by Voevodsky and Kapranov was confirmed only about fifteen years later.",
            "這套工作流帶給我們幾乎所有現有的數學，而它最大的優點是**理解是內建的**：寫出證明的人必須理解每一行。它的弱點是**規模**。一切都得裝進少數幾個腦袋，而檢查的品質取決於審稿人的專注程度。Alessandro Masullo 用紙筆花了將近十二年寫他提出的 GRH 證明；公開後四天內，一個群眾協作的 Lean 形式化就在這份 940 頁的草稿裡找出 292 條照原文寫是錯的陳述，以及主要步驟中的一個缺口，截至 2026 年 11 月 27 日仍未補上。Voevodsky 與 Kapranov 1989 年論文裡的一個錯誤，大約十五年後才被確認。",
          ]}
        />
        <Callout kind="note" title={["What computers changed before AI", "AI 之前，電腦改變了什麼"]}>
          <P
            t={[
              "Computers entered mathematics long ago, but at the edges of the same workflow: as calculators (computer algebra, numerical experiments) or as a check at the end. The four colour theorem (Appel and Haken, 1976) leaned on a computer to check cases, and was checked fully in Coq by Georges Gonthier in 2005; Thomas Hales's proof of the Kepler conjecture was finished as a formal proof (Flyspeck) in 2014. In both, people still did the mathematics; the machine came afterwards.",
              "電腦很早就進入數學，但都在同一套工作流的邊緣：當計算器（電腦代數、數值實驗），或在最後做檢查。四色定理（Appel 與 Haken，1976）靠電腦檢查大量情形，2005 年由 Georges Gonthier 在 Coq 中完整檢查；Thomas Hales 的 Kepler 猜想證明在 2014 年完成形式化證明（Flyspeck）。這兩個例子裡，數學仍由人來做，機器是事後才登場。",
            ]}
          />
        </Callout>
        <Links
          items={[
            { to: ["concept", "rh", "mirror"], label: ["The mirror case: Masullo's draft, read with Lean", "鏡像案例：用 Lean 讀 Masullo 的草稿"] },
            { to: ["concept", "views", "two-problems"], label: ["Two different problems: scale and understanding", "兩道不同的題：規模與理解"] },
          ]}
        />
        <Sources
          items={[
            { label: "G. Gonthier, Formal Proof—The Four-Color Theorem (Notices of the AMS, 2008)", url: "https://www.ams.org/notices/200811/tx081101382p.pdf" },
            { label: "T. Hales et al., A formal proof of the Kepler conjecture (arXiv:1501.02155)", url: "https://arxiv.org/abs/1501.02155" },
            { label: "R. McCorvie et al., a crowdsourced Lean formalization of Masullo's draft (GitHub)", url: "https://github.com/mccorvie/riemann-masullo" },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 2 */}
      <Section page={PAGE} id="architect" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "In the AI-native workflow **the human is the architect**. People choose the problem, fix the statement, sketch the strategy and judge the results; AI agents fill in the plan; the Lean kernel checks every step; many machines do the building. The work is split the way large software is: divide and conquer.",
            "在 AI 原生工作流裡，**人是架構師**。人選題、固定陳述、畫出策略、評判結果；AI 代理把計畫填滿；Lean 核心檢查每一步；許多台機器負責建置。工作的拆法就像大型軟體：分而治之。",
          ]}
        />
        <Callout kind="warn" title={["Read this first: an AI agent is a collaborator, not a web chatbot", "請先讀這段：AI 代理是協作工具，不是網頁聊天機器人"]}>
          <P
            t={[
              "An AI agent (such as Claude Code, Codex or Antigravity) may run on the same core model as a web chatbot (ChatGPT, Gemini or Claude in a browser). What differs is the setting: the agent works *inside a prepared environment*, your project, Lean, Mathlib, the kernel's error messages and other tools, and keeps working for hours. With that setup and tooling built for the field, it does far more than the chatbot. Pasting one question into a web chatbot may well disappoint; an agent is a tool to **collaborate** with, not an oracle to ask. And **in 2026 it does not solve top-tier problems end to end**: experts still choose the problem and the direction, write the statement, and judge the result.",
              "AI 代理（例如 Claude Code、Codex 或 Antigravity）的核心模型，可能和網頁聊天機器人（瀏覽器裡的 ChatGPT、Gemini 或 Claude）相同。差別在於工作的環境：代理在*建置好的環境裡*工作，包括你的專案、Lean、Mathlib、核心的錯誤訊息與其他工具，並且一連工作好幾個小時。有了這樣的環境建置與為該領域打造的工具，它能做的遠多於聊天機器人。把一個問題丟進網頁聊天機器人，很可能令你失望；代理是一個要與它**協作**的工具，不是一個問了就有答案的神諭。而且**在 2026 年，它不會從頭到尾自己解決頂尖難題**：選題與方向、寫陳述、評判結果，仍然要靠專家。",
            ]}
          />
          <InfoDialog id="agent" label={["Chatbot vs agent, and what guidance means", "聊天機器人與代理，以及什麼是指引"]} width="44rem">
          <P
            t={[
              "**Same core, different tool.** A chatbot, such as the web version of ChatGPT, Gemini or Claude, answers a question in a chat window. An agent, such as Claude Code, Codex or Antigravity, may use the same model, but it works *inside a project*: it reads and edits the files, runs Lean, reads the kernel's errors, tries again, and keeps going for hours, often as many copies on many machines. Proofs on the scale of this page come from agents working in a Lean repository under a person's direction, not from pasting a problem into a chat box.",
              "**核心相同，工具不同。** 聊天機器人（例如網頁版的 ChatGPT、Gemini 或 Claude）在對話框裡回答一個問題。代理（例如 Claude Code、Codex 或 Antigravity）可能用的是同一個模型，但它在*專案裡面*工作：讀檔、改檔、執行 Lean、讀核心的錯誤訊息、再試一次，一連做上好幾個小時，常常是許多份同時在許多台機器上跑。本頁這種規模的證明，來自在人的指揮下、於 Lean 儲存庫裡工作的代理，而不是把題目貼進對話框。",
            ]}
          />
          <Table
            head={[
              ["", ""],
              ["Web chatbot (e.g. ChatGPT, Gemini on the web)", "網頁聊天機器人（如網頁版 ChatGPT、Gemini）"],
              ["AI agent", "AI 代理"],
            ]}
            rows={[
              [["The model inside", "裡面的模型"], ["often the same", "常常相同"], ["often the same", "常常相同"]],
              [["The setting", "工作環境"], ["little: the conversation, perhaps a few general tools such as email or maps", "很少：只有對話，或少量通用工具，例如電子郵件、地圖"], ["a prepared environment: the project, Lean, Mathlib, tools, instructions", "建置好的環境：專案、Lean、Mathlib、工具、指示"]],
              [["Where it works", "在哪裡工作"], ["a chat window", "對話框"], ["inside your project: files, terminal, Lean", "在你的專案裡：檔案、終端機、Lean"]],
              [["How long", "做多久"], ["one answer", "一個回答"], ["hours, thousands of steps, many machines", "數小時、成千上萬步、許多台機器"]],
              [["What checks it", "誰來檢查"], ["nothing, unless you do", "沒有，除非你自己查"], ["the Lean kernel, on every attempt", "Lean 核心，每一次嘗試都查"]],
              [["What it needs from you", "需要你提供什麼"], ["a question", "一個問題"], ["a direction, a statement, a plan, and review", "方向、陳述、計畫，以及審查"]],
              [["How to use it", "怎麼用"], ["ask, read the answer", "問問題、讀答案"], ["collaborate: discuss, plan, let it work, review, repeat", "協作：討論、規劃、讓它工作、審查、再來一輪"]],
            ]}
          />
          <P
            t={[
              "**Do not expect top-tier problems to be solved end to end, at least in 2026.** No agent today takes an open problem and returns an accepted solution by itself. In every case on this site, experts chose the problem and the direction. The Riemann proof was guided by a specialist in exactly this field: Levent Alpöge is a number theorist (PhD Princeton 2020 under Manjul Bhargava, Junior Fellow of Harvard's Society of Fellows 2021–25, now a mathematician at Anthropic). In his own words, he \"guided us to the right situation\" before Claude's work began to leave him in awe, and he still calls the finished Lean proof only \"a step\" until the argument is understood and written for people. Masullo's draft was read by people working with AI, not by AI alone.",
              "**別期待頂尖難題能被從頭到尾自動解決，至少在 2026 年不行。** 今天沒有任何代理能接過一道公開難題，自己交回一個被接受的解答。本站的每一個案例裡，選題與方向都是專家定的。黎曼猜想的證明，是由這個領域本身的專家引導的：Levent Alpöge 是數論學家（2020 年普林斯頓大學博士，指導教授 Manjul Bhargava；2021–25 年哈佛學人學會 Junior Fellow；現為 Anthropic 的數學家）。用他自己的話說，是他「把我們帶到正確的情境」，之後 Claude 的工作才開始讓他驚嘆；而且在論證被理解、被寫給人看之前，他仍只把完成的 Lean 證明稱為「一步」。Masullo 的草稿，是由與 AI 一起工作的人讀出問題的，不是 AI 自己。",
            ]}
          />
          <P
            t={[
              "On hard problems an agent still needs **professional guidance**: someone who knows the field well enough to choose a promising direction, write the statement correctly, see when the agent is stuck, circling or proving the wrong thing, and judge what the result means. Without that, an agent can run for days and return nothing, or return a long, fully checked proof of a statement nobody wanted. As in software, agents make skilled people far faster; they do not replace knowing what to build.",
              "面對難題，代理仍然需要**專業的指引**：需要一個夠懂這個領域的人，去選一個有希望的方向、把陳述寫對、看出代理卡住了、在原地打轉，或是證錯了東西，並判斷結果代表什麼。少了這些，代理可能跑上好幾天、什麼都沒交回來；或交回一份又長、又完全通過檢查、卻是沒人想要的陳述的證明。就像軟體一樣，代理讓有能力的人快得多；它不會取代「知道要做什麼」。",
            ]}
          />
          <Links
            items={[
              { to: ["concept", "rh", "mirror"], label: ["Alpöge in his own words, on the RH page", "RH 頁上 Alpöge 自己的話"] },
              { to: ["agents", "skills"], label: ["Set up an agent for Lean", "為 Lean 設定代理"] },
            ]}
          />
          <Sources
            items={[
              { label: "Mathematics Genealogy Project: Levent Alpöge (Ph.D. Princeton 2020, advisor Manjul Bhargava)", url: "https://mathgenealogy.com/id.php?id=264243" },
              { label: "Harvard Mathematics: Levent Alpöge, Junior Fellow", url: "https://www.math.harvard.edu/people/alpoge-levent" },
            ]}
          />
          </InfoDialog>
        </Callout>
        <CardTabs
          testid="architect-tabs"
          tabs={[
            {
              id: "workflow",
              label: ["Two workflows", "兩種工作流"],
              body: (
                <>
        <Figure caption={["The same eight stages, two workflows: traditional above, AI-native below. Tap a stage to compare. Only the first and last stay with people alone.", "同樣八個階段，兩種工作流：上面是傳統，下面是 AI 原生。點一個階段比較看看。只有第一個與最後一個仍完全屬於人。"]}>
          <WorkflowSwitch />
        </Figure>
                </>
              ),
            },
            {
              id: "divide",
              label: ["Divide and conquer", "分而治之"],
              body: (
                <>
        <Figure caption={["Divide and conquer in seven steps, across three levels of abstraction. Solid outline: the theorem; dashed: a lemma. The outline's colour tells the state.", "分而治之的七個步驟，跨越三個抽象層次。實線外框是定理，虛線是引理；外框的顏色表示狀態。"]}>
          <DivideConquer />
        </Figure>
                </>
              ),
            },
            {
              id: "roles",
              label: ["Who leads what", "誰主導什麼"],
              body: (
                <>
        <Table
          head={[
            ["Part of the work", "工作的部分"],
            ["Who leads", "由誰主導"],
            ["What it means", "意思是"],
          ]}
          rows={[
            [["Direction", "方向"], ["people", "人"], ["Which problem, which approach, which analogy is worth trying.", "哪個問題、哪種方法、哪個類比值得一試。"]],
            [["The statement", "陳述"], ["people, with AI", "人，AI 協助"], ["Written in Lean before the proof, reviewed until it says what is meant: the spec.", "在證明之前用 Lean 寫好，審到它說的就是本意：這就是規格。"]],
            [["Implementation", "實作"], ["AI agents", "AI 代理"], ["Filling `sorry`s: thousands of small proofs, tried and retried.", "填 `sorry`：成千上萬個小證明，試了再試。"]],
            [["Divide and conquer", "分而治之"], ["people and AI", "人與 AI"], ["A blueprint of lemmas, so many hands can work at once.", "一張引理藍圖，讓很多雙手可以同時工作。"]],
            [["Large-scale compute", "大規模運算"], ["machines", "機器"], ["Search and builds spread over many machines; the original RH build needed a large server.", "搜尋與建置分散到許多台機器上；RH 原版的建置需要一台大型伺服器。"]],
            [["Checking", "檢查"], ["the kernel", "核心"], ["Every step, on every change; independent kernels for a second opinion.", "每次改動、每一步；獨立核心提供第二意見。"]],
            [["Refactoring", "重構"], ["AI, reviewed by people", "AI，由人審查"], ["The same statements, a shorter and clearer proof.", "陳述不變，證明更短、更清楚。"]],
            [["Understanding and writing", "理解與寫作"], ["people, with AI", "人，AI 協助"], ["Maps, reading guides and the paper for people, linked to the Lean.", "地圖、閱讀指南、寫給人看的論文，都與 Lean 對應。"]],
          ]}
        />
        <P
          t={[
            "The RH proof ran this way, version by version: published on 20 November 2026, certified by the Lean and Mathlib communities on 21–22 November, refactored from 17.4 million lines to 477,124 (readable) and 112,827 (compact) on 25 November, accepted by independent checkers on 25–26 November. The step still missing is the last one: a proof written for people.",
            "RH 的證明就是這樣一版一版走過來的：2026 年 11 月 20 日公開；11 月 21–22 日由 Lean 與 Mathlib 社群認證；11 月 25 日從 1740 萬行重構成 477,124 行（可讀版）與 112,827 行（精簡版）；11 月 25–26 日被獨立檢查器接受。還缺的是最後一步：寫給人看的證明。",
          ]}
        />
                </>
              ),
            },
            {
              id: "reverse",
              label: ["Reverse mathematics", "反推數學"],
              body: (
                <>
          <P
            t={[
              "A refactor shortens the *implementation* of a proof. A second way to simplify goes deeper, into the mathematics. Ordinary mathematics goes forward, from axioms to theorems. **Reverse mathematics**, begun by Harvey Friedman in 1975 and developed by Stephen Simpson and others, goes backward: given a theorem, which axioms does it really need? Its striking finding is that many theorems of ordinary mathematics are, over a weak base system, *equivalent* to one of a handful of axiom systems, the \"Big Five\": RCA₀, WKL₀, ACA₀, ATR₀ and Π¹₁-CA₀.",
              "重構縮短的是證明的*實作*。還有一種更深的簡化，深入到數學本身。平常的數學是正向的，從公理走到定理。**反推數學**（reverse mathematics）由 Harvey Friedman 在 1975 年開創、Stephen Simpson 等人發展，方向相反：給定一條定理，它真正需要哪些公理？它最驚人的發現是：許多日常數學的定理，在一個很弱的基礎系統之上，都*等價*於少數幾個公理系統之一，也就是「五大系統」：RCA₀、WKL₀、ACA₀、ATR₀ 與 Π¹₁-CA₀。",
            ]}
          />
          <Figure caption={["One proof graph, four readings. Arrows run from what is used to what it proves; walking backwards, from the theorem to what it rests on. Solid amber: axioms; dashed: lemmas; indigo: the theorem; teal: a new concept.", "同一張證明圖，四種讀法。箭頭從被用到的指向它證出的；反向走時，從定理指向它所依賴的。琥珀色實線：公理；虛線：引理；靛藍：定理；青綠：新概念。"]}>
            <ReversePath />
          </Figure>
          <P
            t={[
              "By hand, each such equivalence is a research paper. With a formal proof, the first half is mechanical: Lean knows every dependency, so a machine can trace what a proof rests on, try to remove assumptions one by one, and search for equivalences. Run at scale, that turns a long path into the shortest principle that does the job, and the patterns it finds again and again are candidates for **a new abstraction, or a new axiom** worth adopting. November 2026 gave a small instance: the crowdsourced formalization of Masullo's draft proved in Lean that its one unproved step (Theorem 12.5.1.1) is equivalent to the main claim itself, which shows exactly where the whole weight rests.",
              "用手做，每一個這樣的等價都是一篇研究論文。有了形式化證明，前一半就變成機械性的：Lean 知道每一個依賴，所以機器可以追出一個證明依賴什麼、一條條試著拿掉假設、並搜尋等價關係。大規模地跑，就能把一條長路換成能完成工作的最短原理；而它一再找到的模式，就是**新抽象、甚至新公理**的候選。2026 年 11 月有一個小小的實例：Masullo 草稿的群眾協作形式化在 Lean 中證明，草稿唯一沒證出的那一步（定理 12.5.1.1）與主要宣稱本身等價，正好顯示整個重量壓在哪裡。",
            ]}
          />
          <P
            t={[
              "**This site's view:** the refactor shortens the code; reverse analysis and abstraction shorten the mathematics. Machines make both cheap enough to run on every large proof.",
              "**本站的看法：** 重構縮短程式碼；反推分析與抽象縮短數學。機器讓這兩件事便宜到可以用在每一份大型證明上。",
            ]}
          />
          <Links
            items={[
              { to: ["concept", "limits", "axioms"], label: ["Axioms: what every proof takes on trust", "公理：每個證明都得信任的東西"] },
              { to: ["concept", "rh", "mirror"], label: ["The Masullo equivalence, on the RH page", "RH 頁上的 Masullo 等價"] },
            ]}
          />
          <Sources
            items={[
              { label: "Stanford Encyclopedia of Philosophy, Reverse Mathematics (2024)", url: "https://plato.stanford.edu/entries/reverse-mathematics/" },
              { label: "S. G. Simpson, Subsystems of Second Order Arithmetic (2nd ed., Cambridge, 2009)", url: "https://doi.org/10.1017/CBO9780511581007" },
              { label: "riemann-masullo issue #7673 (25 Nov 2026)", url: "https://github.com/mccorvie/riemann-masullo/issues/7673" },
            ]}
          />
                </>
              ),
            },
          ]}
        />
        <Links
          items={[
            { to: ["concept", "rh", "architecture"], label: ["The RH proof, version by version", "RH 證明，一版一版來看"] },
            { to: ["concept", "method", "plan"], label: ["A plan made of sorrys", "用 sorry 搭出計畫"] },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 3 */}
      <Section page={PAGE} id="together" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "**How mathematicians work together today.** Most papers are written in LaTeX, and many of them on Overleaf, a shared online editor where coauthors in different countries edit one copy, leave comments and look back through its history. Underneath, Overleaf can sync a project with git and GitHub, the same version control that software runs on, and preprints on arXiv carry their own versions, v1, v2, v3. So collaboration across borders already works, for the *words*.",
            "**數學家今天怎麼合作。** 大多數論文用 LaTeX 寫，其中很多在 Overleaf 上寫：一個共享的線上編輯器，不同國家的合作者編輯同一份稿子、留言、回看它的歷史紀錄。在底下，Overleaf 可以把專案和 git、GitHub 同步，也就是軟體所依靠的那套版本控制；arXiv 上的預印本也有自己的版本：v1、v2、v3。所以跨越國界的合作早就行得通，只是對象是*文字*。",
          ]}
        />
        <Figure caption={["The same version control underneath; a different check on top. Compiling LaTeX checks that the paper typesets, not that its mathematics is right.", "底下是同一套版本控制；上面的檢查不同。編譯 LaTeX 只檢查論文排得出版面，不檢查其中的數學對不對。"]}>
          <PaperStacks />
        </Figure>
        <P
          t={[
            "What the paper's stack lacks is a gate. Two coauthors can merge their edits without either checking the other's argument, and a referee meets the result months later. A Lean project keeps everything mathematicians already use, shared files, history, comments, and adds the check.",
            "論文這一疊缺的是一道關卡。兩位合作者可以合併彼此的修改，卻沒有人檢查對方的論證；審稿人要幾個月後才看到結果。Lean 專案保留了數學家已經在用的一切：共享的檔案、歷史、留言，再加上檢查。",
          ]}
        />
        <P
          t={[
            "Software goes one step further with the same git: branches, pull requests and continuous integration. Each contribution is a small change that a machine tests before it is merged. Contributors need not know or trust each other, live in the same country, or be awake at the same time. Lean brings this to mathematics and adds what software lacks: **a test that is complete**. If the kernel accepts a lemma, the lemma is proved, whoever wrote it.",
            "軟體用同一套 git 再多走一步：分支、pull request、持續整合。每一份貢獻都是一個小改動，在合併之前先由機器測試。貢獻者不必彼此認識或信任，不必住在同一個國家，也不必在同一個時段醒著。Lean 把這一套帶進數學，還加上軟體沒有的東西：**一個完整的測試**。只要核心接受一條引理，它就證明了，不管是誰寫的。",
          ]}
        />
        <Figure caption={["Many branches, one main. Every branch, from a person or an agent, meets the same gate before it merges. The agent's first attempt is rejected; it forks a local branch, fixes the step, merges the fix back into its own branch, and passes. Contributors are illustrative.", "許多分支，一條 main。每個分支，不論來自人還是代理，合併前都要通過同一道關卡。代理第一次被拒絕；它分出一條本地分支、修好那一步、把修正合併回自己的分支，再通過關卡。貢獻者僅為示意。"]}>
          <GitFlow />
        </Figure>
        <Table
          head={[
            ["Project", "專案"],
            ["How people worked together", "怎麼合作"],
            ["Who checked", "誰來檢查"],
            ["Scale and speed", "規模與速度"],
          ]}
          rows={[
            [
              ["**Polymath1** (2009)", "**Polymath1**（2009）"],
              ["Comments on Tim Gowers's blog", "Tim Gowers 部落格的留言"],
              ["people, reading each other", "人，互相閱讀"],
              ["An elementary proof of density Hales–Jewett outlined in about six weeks; the write-up took months.", "約六週內勾勒出密度 Hales–Jewett 定理的初等證明；寫成論文花了好幾個月。"],
            ],
            [
              ["**Liquid Tensor Experiment** (2020–22)", "**液態張量實驗**（2020–22）"],
              ["GitHub and Zulip, led by Johan Commelin", "GitHub 與 Zulip，由 Johan Commelin 帶領"],
              ["the Lean kernel", "Lean 核心"],
              ["Scholze's challenge of 5 Dec 2020, complete on 14 Jul 2022.", "Scholze 2020 年 12 月 5 日提出挑戰，2022 年 7 月 14 日完成。"],
            ],
            [
              ["**Equational Theories Project** (2024–25)", "**方程理論計畫**（2024–25）"],
              ["GitHub, with automated provers, led by Terence Tao", "GitHub 加上自動證明器，由陶哲軒帶領"],
              ["the Lean kernel", "Lean 核心"],
              ["All 22,028,942 implications between 4,694 laws settled in Lean by 14 Apr 2025.", "4,694 條定律之間全部 22,028,942 條蘊涵，到 2025 年 4 月 14 日都在 Lean 中解決。"],
            ],
            [
              ["**riemann-masullo** (Nov 2026)", "**riemann-masullo**（2026 年 11 月）"],
              ["GitHub; people and their coding agents", "GitHub；人和他們的程式代理"],
              ["the Lean kernel", "Lean 核心"],
              ["About 2,660 pull requests from about ninety people; about 13,200 theorems of a 940-page draft stated in four days.", "約九十人、約 2,660 個 pull request；四天內把 940 頁草稿中約 13,200 條定理寫成陳述。"],
            ],
          ]}
        />
        <P
          t={[
            "The change is where trust lives. In Polymath everyone had to read everyone; the project was limited by how much its strongest participants could read. With Lean, **trust moves from the person to the check**: a maintainer reviews what a pull request *states*, not every line of how it proves it. That is what lets a stranger, a student or an agent contribute, and it is why a mathematics project is no longer bounded by a department, a country or a time zone: the build runs around the clock, and the same gate stands for everyone.",
            "改變的是信任所在的地方。在 Polymath 裡，每個人都得讀每個人的東西；專案的上限，就是最強的參與者讀得了多少。有了 Lean，**信任從人身上移到檢查上**：維護者審的是 pull request *陳述了什麼*，而不是它怎麼證明的每一行。正因如此，陌生人、學生或代理都能貢獻；也因此，一個數學專案不再受限於一個系所、一個國家或一個時區：建置日夜不停，關卡對每個人都一樣。",
          ]}
        />
        <Callout kind="warn" title={["What the gate does not check", "這道關卡不檢查什麼"]}>
          <P
            t={[
              "The kernel checks proofs, not intentions. A statement with a wrong definition, or one that says something other than the paper, can pass and be merged. So the human work that does not go away in a git project is **reviewing statements and definitions**: the maintainers' job, and the reason the riemann-masullo issue tracker discusses wording, not proofs.",
              "核心檢查的是證明，不是意圖。一條定義寫錯、或說的跟論文不一樣的陳述，也可能通過並被合併。所以在 git 專案裡，不會消失的人的工作是**審查陳述與定義**：這是維護者的工作，也是 riemann-masullo 的 issue 討論的是措辭、不是證明的原因。",
            ]}
          />
          <SiteLink to={["concept", "limits", "as-written"]} label={["A proof checks the statement as written", "證明只檢查寫下來的陳述"]} />
        </Callout>
        <Sources
          items={[
            { label: "Overleaf, Git integration (documentation)", url: "https://www.overleaf.com/learn/how-to/Git_integration" },
            { label: "T. Gowers, Is massively collaborative mathematics possible? (27 Jan 2009)", url: "https://gowers.wordpress.com/2009/01/27/is-massively-collaborative-mathematics-possible/" },
            { label: "Lean community, Completion of the Liquid Tensor Experiment (14 Jul 2022)", url: "https://leanprover-community.github.io/blog/posts/lte-final" },
            { label: "T. Tao et al., The Equational Theories Project (arXiv:2512.07087)", url: "https://arxiv.org/abs/2512.07087" },
            { label: "The Equational Theories Project (project page)", url: "https://teorth.github.io/equational_theories" },
            { label: "R. McCorvie et al., a crowdsourced Lean formalization of Masullo's draft (GitHub)", url: "https://github.com/mccorvie/riemann-masullo" },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 4 */}
      <Section page={PAGE} id="analogy" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "Software engineers met this switch first, so their words fit. In Lean the fit is close to literal: a statement is a type, a proof is a program, and the kernel is a type checker.",
            "軟體工程師先遇到這個轉變，所以他們的詞彙很合用。在 Lean 裡，這個對應幾乎是字面上的：陳述是型別，證明是程式，核心是型別檢查器。",
          ]}
        />
        <Table
          head={[
            ["Software", "軟體"],
            ["Mathematics (Lean)", "數學（Lean）"],
            ["Why they match", "為什麼對得上"],
          ]}
          rows={[
            [["spec / interface", "規格／介面"], ["the formal statement (`Challenge.lean`)", "形式化陳述（`Challenge.lean`）"], ["Fixed first; everything else must satisfy it.", "最先固定；其他一切都得滿足它。"]],
            [["implementation", "實作"], ["the proof", "證明"], ["Can be rewritten freely while the interface stays.", "介面不變時，可以自由改寫。"]],
            [["layers of abstraction", "抽象層"], ["levels of lemmas: statement, main lemmas, details", "引理的層次：陳述、主要引理、細節"], ["Each layer uses only the interfaces below it.", "每一層只用到下一層的介面。"]],
            [["unit test", "單元測試"], ["a lemma checked by the kernel", "核心檢查過的引理"], ["Small, checked on its own, reused.", "小、可單獨檢查、可重複使用。"]],
            [["integration test", "整合測試"], ["the main theorem builds with no `sorry`", "主定理建置成功、沒有 `sorry`"], ["All the parts fit together.", "所有零件拼得起來。"]],
            [["continuous integration", "持續整合"], ["`lake build` on every change", "每次改動都跑 `lake build`"], ["Nothing merges unchecked.", "沒檢查過的東西不能合併。"]],
            [["code review", "程式碼審查"], ["statement and definition review", "陳述與定義的審查"], ["People check intent; machines check the rest.", "人檢查意圖；機器檢查其餘。"]],
            [["refactor", "重構"], ["a shorter proof of the same statements", "同樣陳述的更短證明"], ["17.4M → 113k lines, 25 Nov 2026.", "1740 萬 → 11.3 萬行，2026/11/25。"]],
            [["package manager", "套件管理器"], ["Mathlib, Reservoir, the build cache", "Mathlib、Reservoir、建置快取"], ["Find, version and reuse what exists.", "找到、加版本、重複使用已有的成果。"]],
            [["technical debt", "技術債"], ["`sorry`s, extra axioms, junk-value definitions", "`sorry`、多餘的公理、垃圾值定義"], ["Works today, costs later.", "今天能用，以後要還。"]],
            [["a spec bug", "規格錯誤"], ["a wrong definition", "錯誤的定義"], ["Every test passes, and the program is still wrong.", "所有測試都過了，程式還是錯的。"]],
            [["architecture document", "架構文件"], ["the blueprint", "藍圖（blueprint）"], ["The plan people read before the code.", "人在讀程式碼之前先讀的計畫。"]],
            [["user documentation", "使用者文件"], ["the paper written for people", "寫給人看的論文"], ["How humans actually use the result.", "人實際上怎麼使用這個結果。"]],
          ]}
        />
        <Figure caption={["Test-driven development's loop. Switch the labels: in Lean it is not a metaphor, it is how a proof is built.", "測試驅動開發的迴圈。切換標籤看看：在 Lean 裡這不是比喻，而是證明的實際做法。"]}>
          <TddCycle />
        </Figure>
        <P
          t={[
            "Test-driven development (TDD) writes the test first, watches it fail, makes it pass, then cleans up. Lean mathematics already works this way: the statement is written first and the proof is `sorry` (red); the kernel accepts a finished proof (green); a refactor shortens it while the statement stays (and the kernel re-checks). Large formalization projects describe the same idea as *spec-driven development*.",
            "測試驅動開發（TDD）先寫測試、看它失敗、讓它通過、再整理。Lean 數學本來就是這樣做的：先寫陳述，證明是 `sorry`（紅）；核心接受完成的證明（綠）；重構讓證明變短而陳述不變（核心再查一次）。大型形式化專案把同一個想法稱為*規格驅動開發*。",
          ]}
        />
        <Figure caption={["Three eras, developer and mathematician side by side. In the last step the mathematician's column changes the most.", "三個時代，開發者與數學家並排。最後一步裡變化最大的是數學家這一欄。"]}>
          <Eras />
        </Figure>
        <P
          t={[
            "Here is the point of the analogy. When people wrote every line, tests were a discipline many developers skipped: the author knew the code. Once AI writes most of the code, nobody knows every line, and **the only way to trust code you did not read is engineering practice**: specs, tests, CI, review. AI-native programming does not need less engineering; it needs more. Mathematics is making the same switch. A proof written by hand did not need a machine check, because its author understood every step. A proof written with AI does, and so mathematics needs engineering practice of its own.",
            "這個類比的重點在這裡。當人寫每一行的時候，測試是許多開發者會略過的紀律：作者認得程式碼。一旦 AI 寫了大部分程式，就沒有人認得每一行，**要信任你沒讀過的程式碼，唯一的辦法是工程實踐**：規格、測試、CI、審查。AI 原生的程式開發不是需要更少的工程，而是更多。數學正經歷同樣的轉變。手寫的證明不需要機器檢查，因為作者理解每一步；與 AI 一起寫的證明需要，所以數學也需要自己的工程實踐。",
          ]}
        />
        <Links
          items={[
            { to: ["concept", "method", "statement"], label: ["From words to a formal statement", "從文字到形式化陳述"] },
            { to: ["concept", "limits", "definitions"], label: ["Wrong definitions, and how to catch them", "錯誤的定義，以及怎麼抓出來"] },
          ]}
        />
        <Sources
          items={[
            { label: "Abstraction boundaries and spec driven development in pure mathematics (arXiv:2309.14870)", url: "https://arxiv.org/abs/2309.14870" },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 5 */}
      <Section page={PAGE} id="review" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "Refereeing assumes a person can read the whole proof. At the scale of the RH proof that assumption fails, and it fails for arithmetic reasons before any question of skill. Choose a reading speed and see:",
            "審稿的前提是一個人能讀完整份證明。到了 RH 證明的規模，這個前提就不成立，而且在談能力之前，光是算術就不成立。選一個閱讀速度看看：",
          ]}
        />
        <Figure caption={["Line-by-line reading time for the three editions of the same proof. The refactor moves it from a career to weeks.", "同一份證明三個版本的逐行閱讀時間。重構把它從一輩子的工作，變成幾週的工作。"]}>
          <ReadingBudget />
        </Figure>
        <P
          t={[
            "Programming hit the same wall. Nobody reviews machine-generated code line by line at scale; review moves to the interfaces, the tests, the architecture, and the spots where risk concentrates. The same move is open to mathematics, because Lean separates what must be read from what need not be:",
            "程式開發撞過同一道牆。沒有人會逐行審查大量機器生成的程式碼；審查轉移到介面、測試、架構，以及風險集中的地方。數學也可以這樣做，因為 Lean 把「必須讀的」和「不必讀的」分開了：",
          ]}
        />
        <Table
          head={[
            ["Where human attention goes", "人的注意力放在哪裡"],
            ["Traditional", "傳統"],
            ["AI-native", "AI 原生"],
          ]}
          rows={[
            [["Every step of the proof", "證明的每一步"], ["**all of it**", "**全部**"], ["the kernel does it", "交給核心"]],
            [["The statement", "陳述"], ["often implicit", "常常是隱含的"], ["**read closely**: it is the spec", "**仔細讀**：它就是規格"]],
            [["Definitions", "定義"], ["trusted from the literature", "相信文獻"], ["**read closely**, tested with examples", "**仔細讀**，用例子測試"]],
            [["Axioms", "公理"], ["rarely asked", "很少過問"], ["**audited**: `#print axioms`", "**稽核**：`#print axioms`"]],
            [["Architecture", "架構"], ["in the author's head", "在作者腦中"], ["**the blueprint and the maps**", "**藍圖與地圖**"]],
            [["Ideas", "想法"], ["mixed with checking", "和檢查混在一起"], ["**freed for it**: what is new, what generalizes", "**專心於此**：什麼是新的、什麼可推廣"]],
          ]}
        />
        <P
          t={[
            "This is why the new workflow is **not a refinement of refereeing**. An AI that helps a referee read faster still scales with the number of lines. The AI-native workflow changes *what is read*: people read the statement, the definitions, the axioms and the architecture, and spend the time saved on ideas. Everything else is machine-checked.",
            "這就是為什麼新的工作流**不是審稿的小改良**。幫審稿人讀得更快的 AI，仍然隨行數增長。AI 原生的工作流改變的是*讀什麼*：人讀陳述、定義、公理與架構，把省下來的時間花在想法上。其餘的一切都由機器檢查。",
          ]}
        />
        <Callout kind="note" title={["The other side", "另一面"]}>
          <P
            t={[
              "This moves the risk; it does not remove it. A wrong statement, checked perfectly, is still wrong, and Michael Harris's objection stands: a proof nobody understands has left the shared conversation of mathematics. Both points argue for the same thing: human attention concentrated where machines cannot help, and a proof for people as part of the work, not an afterthought.",
              "這是把風險移位，不是把它消除。一條錯的陳述，就算檢查得再完美，還是錯的；而 Michael Harris 的反對依然成立：一個沒人理解的證明，已經離開了數學共同的對話。這兩點指向同一件事：人的注意力要集中在機器幫不上忙的地方，而寫給人看的證明是工作的一部分，不是事後補上的。",
            ]}
          />
          <Links
            items={[
              { to: ["concept", "views", "sceptic"], label: ["The sceptic's case: Michael Harris", "懷疑者的論點：Michael Harris"] },
              { to: ["concept", "method", "two-languages"], label: ["One proof, two languages", "一個證明，兩種語言"] },
            ]}
          />
        </Callout>
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 6 */}
      <Section page={PAGE} id="engineering" n={6} title={SECTIONS[5].title}>
        <P
          t={[
            "Computer science has software engineering beside it: the practice of building, testing and maintaining large systems. This site expects mathematics to grow the same companion, **mathematics engineering**: the practice of building, checking, refactoring and maintaining large bodies of formal mathematics, and of turning them back into understanding. Its roles already exist in projects like Mathlib, even if few people hold them full-time:",
            "電腦科學旁邊有軟體工程：建置、測試、維護大型系統的實務。本站預期數學也會長出同樣的夥伴，**數學工程**：建置、檢查、重構與維護大量形式化數學，並把它們轉回理解的實務。它的角色在 Mathlib 這樣的專案裡已經存在，只是很少有人全職擔任：",
          ]}
        />
        <Table
          head={[
            ["Role", "角色"],
            ["What they do", "做什麼"],
            ["In software", "在軟體裡"],
          ]}
          rows={[
            [["statement designer", "陳述設計者"], ["Turns a question into a formal statement that says exactly what is meant.", "把問題寫成形式化陳述，精確說出本意。"], ["product / API designer", "產品／API 設計者"]],
            [["proof architect", "證明架構師"], ["Plans the blueprint: which lemmas, in which order, which abstractions.", "規劃藍圖：哪些引理、什麼順序、哪些抽象。"], ["software architect", "軟體架構師"]],
            [["library maintainer", "函式庫維護者"], ["Keeps Mathlib-like libraries consistent, reviewed and reusable.", "讓 Mathlib 這類函式庫保持一致、經過審查、可重複使用。"], ["open-source maintainer", "開源維護者"]],
            [["refactorer", "重構者"], ["Shortens and clarifies proofs behind fixed statements.", "在陳述固定的前提下，讓證明變短、變清楚。"], ["refactoring engineer", "重構工程師"]],
            [["infrastructure engineer", "基礎設施工程師"], ["Distributed builds, caches, sandboxes, independent kernels.", "分散式建置、快取、沙盒、獨立核心。"], ["DevOps / SRE", "DevOps／SRE"]],
            [["translator", "翻譯者"], ["Writes the proof for people, linked to the Lean, and back.", "把證明寫給人看，並與 Lean 互相對應。"], ["technical writer", "技術寫作者"]],
            [["reviewer", "審查者"], ["Judges statements, definitions and what matters.", "評判陳述、定義，以及什麼重要。"], ["code reviewer", "程式碼審查者"]],
          ]}
        />
        <Callout kind="note" title={["The facilities big mathematics needs", "大數學需要的設施"]}>
          <P
            t={[
              "Mathematics was long the last science that needed almost no instruments. For its largest problems that is changing: big physics needs shared facilities like CERN, and big mathematics is starting to need its own, with mathematics engineering and large-scale computing as basic tools:",
              "數學長久以來是最後一門幾乎不需要儀器的科學。對最大的那些問題，情況正在改變：大物理需要 CERN 這樣的共享設施，大數學也開始需要自己的設施，以數學工程與大規模運算為基本工具：",
            ]}
          />
          <List
            items={[
              [
                "**Distributed Lean**: building and checking a proof spread over many machines, rather than one large server.",
                "**分散式 Lean**：讓一份證明的建置與檢查可以分散到許多台機器上，而不必靠一台大型伺服器。",
              ],
              [
                "**A central library of formal proofs**, like Python's pip: everything already formalized can be found, versioned and reused (Lean has the beginnings: Mathlib, its shared build cache, and the package index Reservoir).",
                "**一個形式化證明的中央函式庫**，像 Python 的 pip 那樣：所有已形式化的成果都找得到、有版本、可以重複使用（Lean 已有雛形：Mathlib、它共享的建置快取，以及套件索引 Reservoir）。",
              ],
              [
                "**Instruments for seeing**, like CERN's detectors and reconstruction software: tools that turn millions of lines into shapes and structure a person can read, such as maps, dependency graphs, and natural-language proofs linked to the code. The proof maps on the RH page are this site's small front panel for such an instrument.",
                "**看得見的儀器**，像 CERN 的探測器與重建軟體：把數百萬行機器程式碼降成人看得懂的形狀與結構的工具，例如地圖、依賴圖，以及和程式碼一步步對照的自然語言證明。RH 頁上的證明地圖，就是本站為這種儀器做的一小塊前端面板。",
              ],
              [
                "**A path for new mathematics**: a new concept, once invented, enters that library and shortens everyone's next path.",
                "**一條讓新數學進來的路**：一個新概念一旦被發明，就收進這個函式庫，縮短所有人的下一條路。",
              ],
            ]}
          />
          <SiteLink to={["concept", "rh", "maps"]} label={["The two maps of the RH proof", "RH 證明的兩張地圖"]} />
        </Callout>
        <Callout kind="note" title={["pip and Mathlib: a package manager for mathematics", "pip 與 Mathlib：數學的套件管理器"]}>
          <P
            t={[
              "Python programmers rarely write their own linear algebra. They type `pip install numpy` and build on decades of shared, tested work. **Mathlib** is that for Lean: one shared library of formalized mathematics, maintained by a community, reviewed like open-source code, and reused by every project that depends on it.",
              "Python 程式設計師很少自己寫線性代數。他們打 `pip install numpy`，就站在幾十年共享、測試過的成果上。**Mathlib** 就是 Lean 的這個東西：一個共享的形式化數學函式庫，由社群維護、像開源程式碼一樣審查，並被每個依賴它的專案重複使用。",
            ]}
          />
          <Figure caption={["Two stacks. Your work sits on a shared library, which sits on the language.", "兩疊。你的工作放在共享函式庫上，函式庫放在語言上。"]}>
            <DependencyStacks />
          </Figure>
          <Table
            head={[
              ["Python", "Python"],
              ["Lean", "Lean"],
            ]}
            rows={[
              [["PyPI, the package index", "PyPI，套件索引"], ["Reservoir, the Lean package index", "Reservoir，Lean 的套件索引"]],
              [["`pip install numpy`", "`pip install numpy`"], ["`require mathlib` in the lakefile, then `lake update`", "在 lakefile 寫 `require mathlib`，再執行 `lake update`"]],
              [["`import numpy`", "`import numpy`"], ["`import Mathlib`", "`import Mathlib`"]],
              [["a lock file pins exact versions", "鎖定檔固定確切版本"], ["`lake-manifest.json` pins exact versions", "`lake-manifest.json` 固定確切版本"]],
              [["prebuilt wheels: no compiling", "預先建置的 wheel：不必編譯"], ["`lake exe cache get`: the compiled Mathlib, downloaded", "`lake exe cache get`：下載編譯好的 Mathlib"]],
              [["an upgrade can break your code", "升級可能弄壞你的程式"], ["a renamed lemma can break your proof", "一條改了名的引理可能弄壞你的證明"]],
              [["a package can still have bugs", "套件仍可能有錯誤"], ["a lemma in Mathlib is proved; the risk is in definitions and statements", "Mathlib 裡的引理都證明過；風險在定義與陳述"]],
            ]}
          />
          <P
            t={[
              "The facility big mathematics needs is this, at a larger scale: every formalized result findable, versioned and reusable, so nobody proves the same lemma twice, and a new concept, once added, shortens everyone's next proof.",
              "大數學需要的設施就是這個，只是規模更大：每一個形式化的成果都找得到、有版本、可以重複使用，所以沒有人需要把同一條引理證兩次；而一個新概念一旦加進去，就縮短了每個人的下一個證明。",
            ]}
          />
          <Links
            items={[
              { to: ["concept", "maths", "mathlib"], label: ["Mathlib: the big library", "Mathlib：龐大的數學函式庫"] },
              { to: ["skills", "mathlib"], label: ["Mathlib map", "Mathlib 地圖"] },
            ]}
          />
        </Callout>
        <P
          t={[
            "**How training changes: what Go suggests.** When AlphaGo beat Lee Sedol in 2016, many expected human Go to fade. It did not. Professionals now study with engines, and a study of 5.8 million professional moves from 1950 to 2021 found that human decisions became measurably better after superhuman AI arrived, and more novel: players began making moves never seen before. The game did not end; its training changed, and its ceiling rose.",
            "**訓練會怎麼改變：圍棋給的線索。** 2016 年 AlphaGo 擊敗李世乭時，很多人以為人類圍棋會沒落。結果沒有。職業棋手現在跟著引擎研究；一項分析 1950 到 2021 年 580 萬手職業棋步的研究發現，超人 AI 出現之後，人類的決策明顯變好，也更有新意：棋手開始下出前所未見的棋。棋沒有下完；訓練方式變了，天花板升高了。",
          ]}
        />
        <Figure caption={["Go since AlphaGo, beside mathematics since Lean. The last row is a forecast.", "AlphaGo 之後的圍棋，與 Lean 之後的數學並排。最後一列是預測。"]}>
          <GoTimeline />
        </Figure>
        <Table
          head={[
            ["", ""],
            ["Traditional", "傳統"],
            ["AI-native (this site's forecast)", "AI 原生（本站的預測）"],
          ]}
          rows={[
            [["A student learns", "學生學的是"], ["to prove by hand, chapter by chapter", "一章一章學會手寫證明"], ["to prove by hand *and* to state, plan, check and review formally", "手寫證明，*也*學會形式化地陳述、規劃、檢查與審查"]],
            [["A thesis is", "一篇博士論文是"], ["a paper or a few", "一篇或幾篇論文"], ["a paper linked to a checked Lean project", "一篇與經過檢查的 Lean 專案對應的論文"]],
            [["A working week", "一週的工作"], ["mostly working out and checking details", "大多在推細節、查細節"], ["choosing directions, directing agents, reviewing statements, explaining results", "選方向、指揮代理、審陳述、解釋結果"]],
            [["Collaboration", "合作"], ["a few coauthors, often nearby", "少數合作者，常在附近"], ["a repository, open to anyone who passes the gate", "一個儲存庫，對任何能通過關卡的人開放"]],
            [["The scarce skill", "稀缺的能力"], ["stamina for details", "對細節的耐力"], ["taste, judgement, quality control", "品味、判斷、品質把關"]],
          ]}
        />
        <Sources
          items={[
            {
              label: "M. Shin, J. Kim, B. van Opheusden, T. L. Griffiths, Superhuman artificial intelligence can improve human decision-making by increasing novelty (PNAS, 2023)",
              url: "https://doi.org/10.1073/pnas.2214840120",
            },
            { label: "Reservoir, the Lean package index", url: "https://reservoir.lean-lang.org/" },
            {
              label: "T. Tao, Unforced Euler singularity, unforced Navier–Stokes singularity, and the generalized Riemann hypothesis (20 Nov 2026)",
              url: "https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 7 */}
      <Section page={PAGE} id="outlook" n={7} title={SECTIONS[6].title}>
        <P
          t={[
            "When the cost of a result falls, people do not do less of it; they do much more. Cheaper software brought more software and more developers, not fewer; engines brought Go to more players, studying at a level once reserved for professionals. This site expects the same for mathematics.",
            "一件事的成本下降時，人不會做得更少，而是做得多得多。更便宜的軟體帶來更多軟體、更多開發者，而不是更少；引擎讓更多人能下圍棋，用過去只屬於職業棋手的水準來研究。本站預期數學也會這樣。",
          ]}
        />
        <Figure caption={["As machines produce more, the first gate (correctness) gets cheap and complete. The gates that remain are people's: is it the right question, and does it matter? Hover or tap a layer.", "機器產出得越多，第一道關卡（正確性）就越便宜、越完整。剩下的關卡屬於人：問的問題對嗎？它重要嗎？滑過或點一層看看。"]}>
          <TasteFunnel />
        </Figure>
        <P
          t={[
            "**Why the statement gate is the hard one.** The kernel's gate is cheap; the statement gate is not. A formal definition rarely stands alone: a statement about fluids rests on real numbers, derivatives, function spaces and integrals, each built on further layers of Mathlib, and confirming that the whole stack means exactly the object a mathematician or physicist has in mind takes deep expertise in both the mathematics and the library. The Navier–Stokes problem shows how much must be pinned down: the domain (all of ℝ³, or a periodic box), which initial data count (smooth, divergence-free, decaying at infinity), and what counts as a smooth solution with bounded energy, or as a blowup. Change one choice and the statement may become easier, harder or a different problem, while every proof of it still checks. In software this is the costliest kind of bug, a correct program for the wrong specification, found late and expensive to undo.",
            "**為什麼陳述這道關卡最難。** 核心那道關卡很便宜；陳述那道不是。一個形式化定義很少單獨存在：一條關於流體的陳述，建立在實數、導數、函數空間與積分之上，而每一樣又建立在 Mathlib 更底下的好幾層之上；要確認整疊東西說的，正好就是數學家或物理學家心裡想的那個對象，需要同時精通數學與這個函式庫。Navier–Stokes 問題顯示要釘死的東西有多少：定義域（整個 ℝ³，還是週期性的盒子）、哪些初始資料算數（光滑、無散度、在無窮遠處衰減），以及什麼算是能量有界的光滑解、什麼算爆破。改掉其中一個選擇，陳述就可能變得更容易、更難，或變成另一道題，而它的每個證明照樣通過檢查。在軟體裡，這是代價最高的一種錯誤：為錯的規格寫出正確的程式，發現得晚、改起來貴。",
          ]}
        />
        <Links
          items={[
            { to: ["concept", "limits", "definitions"], label: ["Wrong definitions, and how to catch them", "錯誤的定義，以及怎麼抓出來"] },
            { to: ["concept", "method", "comparator"], label: ["Comparator: is it the right theorem?", "Comparator：證的是對的定理嗎？"] },
          ]}
        />
        <Callout kind="tip" title={["This site's position (not a consensus)", "本站的立場（不是共識）"]}>
          <List
            items={[
              [
                "**Mathematics becomes more accessible.** As the cost of research falls, more people can take part: students, engineers, scientists from other fields, anyone whose pull request passes the gate. More workers, and more work.",
                "**數學會變得更容易親近。** 研究的成本下降，能參與的人就更多：學生、工程師、其他領域的科學家，任何 pull request 能通過關卡的人。更多人投入，也有更多工作。",
              ],
              [
                "**Good mathematicians will have more work, not less.** Each can direct far more than they could prove alone, and the demand for direction grows with what machines can carry out.",
                "**好的數學家會有更多工作，而不是更少。** 每個人能指揮的，遠超過自己單獨能證明的；而機器能執行得越多，對方向的需求就越大。",
              ],
              [
                "**Taste and quality control become the essential skills.** When correctness is cheap, the scarce things are choosing good questions, writing statements that mean what they should through every layer of definitions, and recognising an idea worth keeping.",
                "**品味與品質把關會成為最關鍵的能力。** 正確性變便宜之後，稀缺的是選好問題、寫出穿過每一層定義仍然意思正確的陳述，以及認出值得留下的想法。",
              ],
              [
                "**Mathematics can grow much more complicated.** Proofs too long for any one person are now possible and checkable. On 20 November 2026 Terence Tao listed, besides the Lean proof of the Riemann hypothesis, a claimed blowup for the unforced Navier–Stokes equations, \"technically human-readable\" and formalized in Lean but still needing a professionally written proof; neither result is digested yet. They look like the beginning of a new era, not its end.",
                "**數學可以變得複雜得多。** 長到任何一個人都扛不動的證明，現在做得出來、也查得了。2026 年 11 月 20 日，陶哲軒除了黎曼猜想的 Lean 證明，還列出一個宣稱的無外力 Navier–Stokes 方程爆破：「技術上人可讀」、已在 Lean 中形式化，但仍需要一份正式、專業寫成的證明；兩者都還沒被消化。它們看起來是一個新時代的開始，而不是結束。",
              ],
              [
                "**Machine proofs will be translated for people.** The refactor took the RH proof from 17.4 million lines to 113,000 in five days: from beyond any career to within reach of a small team, by the arithmetic of section 5. This site expects machine-to-human translation to follow, though as of 27 November 2026 no mathematician has read even the compact edition through, and the proof written for people is still the next milestone.",
                "**機器證明會被翻譯給人看。** 重構在五天內把 RH 證明從 1740 萬行變成 11.3 萬行：照第 5 節的算法，從任何人一輩子都讀不完，變成一個小團隊讀得完。本站預期接下來會出現從機器到人類語言的翻譯；不過截至 2026 年 11 月 27 日，還沒有數學家把精簡版從頭讀完，寫給人看的證明仍是下一個里程碑。",
              ],
              [
                "**Training and daily work will look very different**, as they did in Go and in programming: less time on details a machine can check, more on direction, statements, review and explanation.",
                "**訓練與日常工作會變得很不一樣**，就像圍棋與程式開發那樣：少花時間在機器能檢查的細節上，多花時間在方向、陳述、審查與解釋上。",
              ],
            ]}
          />
          <P
            t={[
              "**What mathematics needs is a new, AI-native workflow, with engineering practice at its core, not a small refinement of the old one.**",
              "**數學需要的是一套全新的、以工程實踐為核心的 AI 原生工作流，而不是對舊工作流的小修小補。**",
            ]}
          />
        </Callout>
        <P
          t={[
            "Formalizer is built for that workflow: problems with fixed statements, Lean as the gate, maps for seeing, and the natural-language half kept beside the code.",
            "Formalizer 就是為這套工作流而做的：陳述固定的題目、以 Lean 為關卡、看得見的地圖，以及放在程式碼旁邊的自然語言那一半。",
          ]}
        />
        <Links
          items={[
            { to: ["concept", "rh"], label: ["The Riemann case: AI + human, step by step", "黎曼案例：AI + 人，一步一步看"] },
            { to: ["concept", "rh", "architecture"], label: ["Tao's digestion ladder, on the RH page", "RH 頁上陶哲軒的消化階梯"] },
            { to: ["concept", "views", "stance"], label: ["Where Formalizer stands", "Formalizer 的立場"] },
            { to: ["problems", "research"], label: ["Try it: the research workspace", "動手試：研究工作區"] },
          ]}
        />
        <Sources
          items={[
            {
              label: "T. Tao, Unforced Euler singularity, unforced Navier–Stokes singularity, and the generalized Riemann hypothesis (20 Nov 2026)",
              url: "https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/",
            },
            { label: "C. Fefferman, Existence and smoothness of the Navier–Stokes equation (Clay Mathematics Institute, official problem description)", url: "https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf" },
            { label: "openai/NavierStokesAndEuler: the Navier–Stokes and Euler challenges in Lean (Formalizer's flagship problem)", url: "https://github.com/openai/NavierStokesAndEuler" },
          ]}
        />
        <p className="text-xs text-gray-500">{pick(["Facts about November 2026 are as of 27 November 2026, with sources on the RH page.", "關於 2026 年 11 月的事實截至 2026 年 11 月 27 日，出處見 RH 頁。"])}</p>
      </Section>
    </Page>
  );
}
