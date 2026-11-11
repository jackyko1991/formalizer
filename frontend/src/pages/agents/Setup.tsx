/**
 * AI agent ▸ Skills (#/agents/skills) and ▸ MCP (#/agents/mcp): the visitor's own AI coding agent, set up the
 * Formalizer way. The install steps and configs are learnkit's (AgentSetup); the skill is
 * plugins/formalizer/skills/formalizer/SKILL.md (served by scripts/agent_skill.py), the MCP server is the runner's /mcp.
 */
import { McpSetup, ShellCommand, SkillSetup, TwoLists, useAgentChoice, useLang, type SkillSite } from "@learnkit/web";
import { runnerUrl } from "../../runner";
import { useRunner } from "../../RunnerPanel";
import { SiteLink, type L } from "../kit";

const PUBLIC = "https://jackyko1991.github.io/formalizer/generated/agent/";
const SITE: SkillSite = {
  slug: "formalizer",
  repo: "jackyko1991/formalizer",
  publicFiles: PUBLIC,
  files: `${import.meta.env.BASE_URL}generated/agent/`,
};
const AGENT_KEY = "formalizer.agent";

function Frame({ title, intro, children }: { title: L; intro: L; children: React.ReactNode }) {
  const { pick } = useLang();
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 pt-6 pb-16">
      <header>
        <p className="text-sm font-medium text-(--lk-accent)">{pick(["AI agent", "AI 代理"])}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{pick(title)}</h1>
        <p className="mt-3 text-gray-600">{pick(intro)}</p>
      </header>
      {children}
    </div>
  );
}

const LOOP: L[] = [
  ["Read the statement and say what it claims; never edit it.", "讀陳述，說出它在講什麼；絕不修改它。"],
  ["Plan on paper, then a skeleton of `have` steps, each `sorry`.", "先在紙上規劃，再寫出由 `have` 組成、每步都是 `sorry` 的骨架。"],
  ["Replace one `sorry` at a time, and check after each change.", "一次換掉一個 `sorry`，每改一次就檢查一次。"],
  ["Read the goal (`⊢ …`) before choosing the next tactic.", "選下一個戰術之前，先讀目標（`⊢ …`）。"],
  ["Finish at *proved*, with only the standard axioms.", "以 *proved* 收尾，而且只用標準公理。"],
];
const RULES: L[] = [
  ["No `sorry`, `admit`, new `axiom` or `native_decide`.", "不留 `sorry`、`admit`、新的 `axiom`，也不用 `native_decide`。"],
  ["No invented lemma names: search with `exact?`, `apply?`, `rw?`.", "不捏造引理名稱：用 `exact?`、`apply?`、`rw?` 搜尋。"],
  ["When you are learning: the next step and why, not the whole proof.", "你在學習時：給下一步與理由，而不是整個證明。"],
  ["Long proofs: a blueprint of small lemmas, leaves first.", "長證明：先列出小引理的藍圖，從葉子證起。"],
];

export function SkillsAgent() {
  const { pick } = useLang();
  const [agent, setAgent] = useAgentChoice(AGENT_KEY);
  return (
    <Frame
      title={["Agent skill", "代理 Skill"]}
      intro={[
        "Teach your own AI coding agent (Claude Code, Codex and others) to write Lean the Formalizer way: the statement is the test, every step is checked by Lean, and when you are learning it gives hints instead of answers.",
        "教你自己的 AI 程式代理（Claude Code、Codex 等）用 Formalizer 的方式寫 Lean：陳述就是測驗，每一步都交給 Lean 檢查；你在學習時，它給提示而不是答案。",
      ]}
    >
      <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700" data-testid="skill-teaches">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{pick(["What the skill teaches", "這個 skill 教什麼"])}</h2>
        <TwoLists
          left={{ title: pick(["The loop", "循環"]), items: LOOP.map(pick) }}
          right={{ title: pick(["Rules", "規則"]), items: RULES.map(pick) }}
        />
      </section>
      <SkillSetup
        site={SITE}
        agent={agent}
        onAgent={setAgent}
        tryPrompt={pick([
          "Help me prove Gauss's sum in Formalizer's tutorial, one step at a time.",
          "陪我一步一步證明 Formalizer 教學題裡的高斯求和。",
        ])}
      />
      <p className="text-sm text-gray-600">
        {pick([
          "With the MCP server too, the agent checks every step with your runner itself.",
          "再加上 MCP 伺服器，代理就能自己用你的執行器檢查每一步。",
        ])}{" "}
        <SiteLink to={["agents", "mcp"]} label={["MCP", "MCP"]} />
      </p>
    </Frame>
  );
}

const TOOLS: L[] = [
  ["`runner_status`: which runner is up (Lite or Full), its Lean version", "`runner_status`：哪個執行器在跑（Lite 或 Full）、Lean 版本"],
  ["`list_problems`: the problem bank", "`list_problems`：題庫"],
  ["`get_problem`: statement, starting file, hint (never the solution)", "`get_problem`：陳述、起始檔、提示（絕不含解答）"],
  [
    "`check_proof`: the site's check: verdict, errors, goals, axioms, dependency graph",
    "`check_proof`：和網站一樣的檢查：判定、錯誤、目標、公理、依賴圖",
  ],
];
const MCP_RULES: L[] = [
  ["Runs inside your runner: nothing leaves your computer", "在你的執行器裡執行：沒有東西離開你的電腦"],
  ["Answers agents on this computer only; web pages of other sites are refused", "只回應這台電腦上的代理；其他網站的網頁一律拒絕"],
  [
    "The same rules as the site: statement unchanged, no `sorry`, standard axioms",
    "和網站同樣的規則：陳述不變、沒有 `sorry`、只用標準公理",
  ],
  ["Reads the problem bank; never edits your files", "只讀題庫；絕不修改你的檔案"],
];

export function McpAgent() {
  const { pick } = useLang();
  const { runner } = useRunner();
  const [agent, setAgent] = useAgentChoice(AGENT_KEY);
  const url = `${runnerUrl()}/mcp`;
  return (
    <Frame
      title={["MCP server", "MCP 伺服器"]}
      intro={[
        "Give your agent Formalizer's checker as tools. The runner on your computer is also an MCP server, so the agent can read a problem, check each step with real Lean, and see the same goals and errors you do.",
        "把 Formalizer 的檢查器變成代理的工具。你電腦上的執行器同時也是 MCP 伺服器，代理可以讀題、用真正的 Lean 檢查每一步，看到和你一樣的目標與錯誤訊息。",
      ]}
    >
      <section className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700" data-testid="mcp-gives">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{pick(["What the agent gets", "代理會得到什麼"])}</h2>
        <TwoLists
          left={{ title: pick(["Tools", "工具"]), items: TOOLS.map(pick), numbered: false }}
          right={{ title: pick(["Rules", "規則"]), items: MCP_RULES.map(pick) }}
        />
      </section>
      <McpSetup
        name="Formalizer"
        slug="formalizer"
        url={url}
        running={runner === "checking" ? null : runner !== null}
        start={
          runner === null || runner === "checking" ? (
            <ShellCommand
              text={"git clone https://github.com/jackyko1991/formalizer\ncd formalizer && pixi run lean-build && pixi run runner"}
            />
          ) : null
        }
        agent={agent}
        onAgent={setAgent}
        tryPrompt={pick([
          "Use the formalizer tools: pick an L2 tutorial problem and prove it, checking every step.",
          "用 formalizer 工具：挑一道 L2 教學題證明它，每一步都要檢查。",
        ])}
      />
    </Frame>
  );
}
