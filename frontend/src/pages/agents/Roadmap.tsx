/**
 * AI agent ▸ Product roadmap (#/agents/roadmap[/<section>]): Free (everything on your computer or your own account;
 * works now or soon), Pro (a hosted prover, nothing to set up; pending) and Campus (a class licence with a teacher
 * view; pending), and the principles every tier keeps. Same structure as Tensorizer's roadmap; the content is
 * Formalizer's own. The old address #/agents/provers/pro leads here.
 */
import { Callout, List, P, Page, Section, SiteLink, Table, type SectionInfo } from "../kit";

const PAGE = "roadmap";

const Yes = () => (
  <span className="font-semibold text-emerald-600" aria-label="yes">
    ✓
  </span>
);
const No = () => (
  <span className="text-gray-400" aria-label="not yet">
    –
  </span>
);

const SECTIONS: SectionInfo[] = [
  { id: "free", title: ["Free: on your computer, or your own account", "免費：在你的電腦上，或用你自己的帳號"] },
  { id: "pro", title: ["Pro: the same suggestions, nothing to set up (pending)", "Pro：同樣的建議，什麼都不用設定（籌備中）"] },
  { id: "campus", title: ["Campus: a licence for a class (pending)", "校園版：給整個班級的授權（籌備中）"] },
  { id: "research", title: ["Research demos: planned (pending)", "研究範例：規劃中（籌備中）"] },
  { id: "principles", title: ["What every tier keeps", "每一層都不變的原則"] },
];

export default function RoadmapAgent({ section }: { section: string | null }) {
  return (
    <Page
      id={PAGE}
      title={["Product roadmap", "產品路線圖"]}
      intro={[
        "What Formalizer offers for free, and what Pro and Campus will add. The free tier keeps everything that runs on your computer or on an account you already have; the paid tiers sell convenience (hosting, no setup), never the checking itself.",
        "Formalizer 免費提供什麼，以及 Pro 與校園版會多做什麼。免費層保留所有在你電腦上、或用你已有帳號就能跑的東西；付費層賣的是方便（託管、免設定），從來不是檢查本身。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section page={PAGE} id="free" n={1} title={SECTIONS[0].title}>
        <Callout kind="warn" title={["Mostly pending", "大多仍在籌備中"]}>
          <P t={["Everything ticked ✓ is free today. The rest is the plan.", "打了 ✓ 的，今天就能免費使用；其餘是計畫。"]} />
        </Callout>
        <P
          t={[
            "No sign-up, nothing locked away. Every AI suggestion is checked by your runner before it is shown, so a suggestion you see is one Lean already accepts.",
            "不必註冊，沒有任何功能被鎖住。每個 AI 建議在顯示前都先由你的執行器檢查過，所以你看到的建議都是 Lean 已經接受的。",
          ]}
        />
        <Table
          head={[
            ["Free", "免費"],
            ["What you get", "你得到什麼"],
            ["Needs", "需要"],
            ["Available now", "現在可用"],
          ]}
          rows={[
            [
              ["Problems and checking", "題目與檢查"],
              [
                "every problem, the goal view, the dependency graph, checked by Lean on your computer",
                "所有題目、目標檢視、依賴圖，由你電腦上的 Lean 檢查",
              ],
              ["the runner", "執行器"],
              <Yes />,
            ],
            [
              ["Research workspace", "研究工作區"],
              [
                "**one project**: a blueprint of lemmas, notes in words beside the Lean, an autosaved working copy, **one saved version**, unlimited exports to plain .lean files, and three demos to start from",
                "**一個專案**：引理藍圖、Lean 旁的文字筆記、自動儲存的工作副本、**一個已存版本**、不限次數匯出成一般的 .lean 檔，以及三個可以直接開始的範例",
              ],
              ["the runner (projects in ~/Formalizer), or this browser", "執行器（專案存在 ~/Formalizer），或這個瀏覽器"],
              <Yes />,
            ],
            [
              ["Your agent", "你的代理"],
              [
                "your own AI coding agent works on problems through Formalizer's skill and MCP server",
                "你自己的 AI 程式代理透過 Formalizer 的 skill 與 MCP 伺服器來做題",
              ],
              ["an agent such as Claude Code", "一個代理，例如 Claude Code"],
              <Yes />,
            ],
            [
              ["Ask Lean", "問 Lean"],
              [
                "`exact?`, `apply?`, `rw?`, `simp?` at the `sorry` you click",
                "在你點選的 `sorry` 上執行 `exact?`、`apply?`、`rw?`、`simp?`",
              ],
              ["the runner", "執行器"],
              <No />,
            ],
            [
              ["Your model", "你的模型"],
              [
                "an open prover in your own Ollama (DeepSeek-Prover-V2-7B, Goedel-Prover-V2-8B), or a model of your choice with your own API key",
                "你自己 Ollama 裡的開放證明器（DeepSeek-Prover-V2-7B、Goedel-Prover-V2-8B），或用你自己的 API 金鑰呼叫你選的模型",
              ],
              [
                "Ollama and a model download (several GB, enough memory), or an API key. With a key, your proof goes to that provider: your choice.",
                "Ollama 與模型下載（數 GB，記憶體要夠），或一把 API 金鑰。用金鑰時，你的證明會送到那家服務商：由你決定。",
              ],
              <No />,
            ],
          ]}
        />
        <p className="flex flex-wrap gap-4">
          <SiteLink to={["research"]} label={["Research workspace", "研究工作區"]} />
          <SiteLink to={["agents", "skills"]} label={["Agent skill", "代理 Skill"]} />
          <SiteLink to={["agents", "mcp"]} label={["MCP server", "MCP 伺服器"]} />
        </p>
      </Section>

      <Section page={PAGE} id="pro" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Many computers can't run an 8B model well, and setting up Ollama or an API key is a hurdle of its own. Pro is a button next to the `sorry`: a hosted prover proposes tactics, Lean checks them, and only checked ones come back. No download, no key, no fan noise.",
            "很多電腦跑不太動 8B 模型，而設定 Ollama 或 API 金鑰本身就是一道門檻。Pro 是 `sorry` 旁的一個按鈕：由託管的證明器提議戰術、Lean 檢查，只送回檢查通過的。不用下載、不用金鑰、風扇也不會狂轉。",
          ]}
        />
        <P
          t={[
            "This is the one place where your proof leaves your computer, and only when you press the button. Before the first time, a notice lists exactly what is sent.",
            "這是你的證明唯一會離開你電腦的地方，而且只在你按下按鈕時。第一次之前，會有一則說明列出到底送出什麼。",
          ]}
        />
        <P
          t={[
            "Pro also lifts the free tier's limits on research: more than one project, and more than one saved version of each.",
            "Pro 也放寬免費版在研究上的限制：可以有多個專案，每個專案也能存多個版本。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="campus" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "Students open the site in a browser and sign in: checking and an AI tutor run in a hosted sandbox, so no one installs Lean. The tutor gives hints in a mode the teacher chooses.",
            "學生用瀏覽器打開網站登入：檢查與 AI 助教都在託管的沙盒裡執行，誰都不必安裝 Lean。助教依老師選定的模式給提示。",
          ]}
        />
        <List
          items={[
            [
              "**Teacher view:** each student's blueprint, the goal where each one has been stuck longest, and a heatmap of the lemmas where the class gets stuck.",
              "**老師檢視：** 每位學生的藍圖、每個人卡最久的目標，以及全班卡關引理的熱圖。",
            ],
            [
              "**Said plainly to students:** a label shows that the teacher can see their work.",
              "**明白告訴學生：** 有標籤說明老師看得到他們的作業。",
            ],
          ]}
        />
      </Section>

      <Section page={PAGE} id="research" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "The three demos today (odd numbers and squares, Nicomachus's cubes, Fibonacci numbers and the gcd) run on the Lite runner. These larger ones are planned; most need Mathlib, so the Full runner.",
            "目前的三個範例（奇數與平方數、尼科馬庫斯的立方和、費波那契數與最大公因數）都能在 Lite 執行器上跑。下面這些較大的範例在規劃中；大多需要 Mathlib，也就是 Full 執行器。",
          ]}
        />
        <Table
          head={[
            ["Demo", "範例"],
            ["What you would do", "你會做什麼"],
            ["Available now", "現在可用"],
          ]}
          rows={[
            [
              ["Infinitely many primes (Euclid)", "質數有無限多個（歐幾里得）"],
              ["a classic blueprint: $n! + 1$ has a prime factor larger than $n$", "經典的藍圖：$n! + 1$ 有一個大於 $n$ 的質因數"],
              <No />,
            ],
            [
              ["$\\sqrt 2$ is irrational", "$\\sqrt 2$ 是無理數"],
              ["parity lemmas leading to a contradiction", "用奇偶性引理推出矛盾"],
              <No />,
            ],
            [
              ["The Riemann hypothesis: read the statement", "黎曼猜想：讀懂陳述"],
              [
                "Mathlib's `RiemannHypothesis` unfolded line by line, and how a posted proof would be checked against it (a claim from November 2026 is under review)",
                "逐行展開 Mathlib 的 `RiemannHypothesis`，以及一個公開的證明要怎麼對照它來檢查（2026 年 11 月的一個宣稱仍在審查中）",
              ],
              <No />,
            ],
            [
              ["Navier–Stokes and Euler certificates", "Navier–Stokes 與 Euler 證書"],
              ["read OpenAI's certified statements and run the checker yourself", "讀懂 OpenAI 認證的陳述，親手執行檢查"],
              <No />,
            ],
            [
              ["Open problems from Formal Conjectures", "Formal Conjectures 裡的未解問題"],
              [
                "statements only: formalized open problems to read, split into lemmas and try",
                "只有陳述：讀懂已形式化的未解問題，拆成引理來嘗試",
              ],
              <No />,
            ],
          ]}
        />
        <SiteLink to={["research"]} label={["Research workspace: the three demos", "研究工作區：三個範例"]} />
      </Section>

      <Section page={PAGE} id="principles" n={5} title={SECTIONS[4].title}>
        <List
          items={[
            [
              "**Same grading in every tier.** An AI proof goes through the same check as yours: statement unchanged, no `sorry`, standard axioms only, and its dependency graph shown.",
              "**每一層都是同樣的評分。** AI 的證明和你的走同一套檢查：陳述不變、沒有 `sorry`、只用標準公理，並顯示它的依賴圖。",
            ],
            [
              "**Always visible where it runs:** each check and suggestion says ⌂ *on this computer*, ↗ *your provider* or ☁ *hosted*.",
              "**在哪裡執行一定看得到：** 每個檢查與建議都標明 ⌂ *本機*、↗ *你的服務商* 或 ☁ *託管*。",
            ],
            [
              "**Hidden until asked:** suggestions appear only when you ask for them at a `sorry`, like the Proof switch.",
              "**不問就不顯示：** 只有你在某個 `sorry` 上主動要求時才會出現建議，和「答案」開關一樣。",
            ],
            [
              "**Open core:** the runner, the checking and the free workspace are open source (Apache-2.0), and your work is plain Lean that opens without Formalizer.",
              "**開放核心：** 執行器、檢查與免費工作區都是開源的（Apache-2.0），你的作品是一般的 Lean 檔，不用 Formalizer 也能打開。",
            ],
          ]}
        />
        <SiteLink to={["concept", "provers"]} label={["AI provers: what they can and can't do", "AI 證明器：能做與不能做的事"]} />
      </Section>
    </Page>
  );
}
