/**
 * Concept ▸ AI-native mathematics: pictures and small interactives.
 *   OneMind          the traditional loop: everything happens in one head, then referees read line by line
 *   WorkflowSwitch   the same stages as two lanes, traditional above, AI-native below: who does each
 *   DivideConquer    (with "What is a level of abstraction?" in a dialog) a stepper: statement → plan of sorrys → agents in parallel → kernel → two refactors → for people
 *   ReversePath      a proof graph walked forward, backward (what it uses), as an equivalence, then abstracted
 *   PaperStacks      a paper today (LaTeX on Overleaf, git underneath) beside a Lean project on git
 *   GitFlow          branches and merges (static), one failed check fixed on a local branch; "What is version control?" dialog
 *   DependencyStacks a Python script on NumPy beside a Lean proof on Mathlib
 *   TddCycle         red → green → refactor, as code or as mathematics
 *   Eras             three eras side by side, developer and mathematician
 *   ReadingBudget    how long line-by-line reading would take, per edition of the RH proof and reading speed
 *   GoTimeline       Go since AlphaGo, beside mathematics since November 2026
 *   TasteFunnel      many machine results, few gates; the last gates are people's
 * Colours: teal = a person, violet = AI, sky = a machine check, amber = open (`sorry`), green = proved, red = rejected.
 */
import { RichText, useLang } from "@learnkit/web";
import { useRef, useState, type ReactNode } from "react";
import { MONO, StepChips } from "./ProverFigures";

type L = readonly [string, string];

type Who = "human" | "ai" | "machine" | "both";
const WHO: Record<Who, { label: L; cls: string; dot: string }> = {
  human: { label: ["person", "人"], cls: "bg-teal-50 text-teal-800 ring-teal-200", dot: "bg-teal-500" },
  ai: { label: ["AI", "AI"], cls: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500" },
  machine: { label: ["machine check", "機器檢查"], cls: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  both: { label: ["person + AI", "人 + AI"], cls: "bg-gradient-to-r from-teal-50 to-violet-50 text-gray-800 ring-gray-200", dot: "bg-gradient-to-r from-teal-500 to-violet-500" },
};

export function WhoLegend({ only }: { only?: Who[] }) {
  const { pick } = useLang();
  return (
    <div className="flex flex-wrap justify-center gap-3 text-[11px] text-gray-600">
      {(only ?? (["human", "ai", "machine"] as Who[])).map((w) => (
        <span key={w} className="flex items-center gap-1">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${WHO[w].dot}`} />
          {pick(WHO[w].label)}
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ one mind

const LOOP: { label: L; x: number; y: number }[] = [
  { label: ["understand", "理解"], x: 150, y: 66 },
  { label: ["discover", "發現"], x: 228, y: 140 },
  { label: ["work out", "推導細節"], x: 150, y: 214 },
  { label: ["write", "寫成論文"], x: 72, y: 140 },
];

/** Everything in one head; one paper out; referees read it line by line, months or years later. */
export function OneMind() {
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 620 258" className="w-full max-w-[620px]" role="img" aria-label={pick(["The traditional workflow: one mind, one paper, referees", "傳統工作流：一個腦袋、一篇論文、審稿人"])}>
      <defs>
        <marker id="om-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-gray-400" />
        </marker>
      </defs>
      {/* the head */}
      {/* the label sits above the head, clear of its outline */}
      <ellipse cx={150} cy={140} rx={140} ry={112} className="fill-teal-50 stroke-teal-300" strokeWidth={1.5} />
      <text x={150} y={16} textAnchor="middle" fontSize={11} className="fill-teal-800 font-semibold">
        {pick(["one mind (or a few)", "一個腦袋（或幾個）"])}
      </text>
      <circle cx={150} cy={140} r={76} fill="none" className="stroke-teal-300" strokeDasharray="4 4" />
      {LOOP.map((s) => (
        <g key={s.label[0]}>
          <rect x={s.x - 40} y={s.y - 13} width={80} height={26} rx={13} className="fill-white stroke-teal-500" />
          <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize={11} className="fill-gray-800">
            {pick(s.label)}
          </text>
        </g>
      ))}
      <text x={150} y={144} textAnchor="middle" fontSize={10} className="fill-teal-700">
        {pick(["years", "數年"])}
      </text>
      {/* the paper and the referees, level with the head's centre */}
      <g transform="translate(0 22)">
      <line x1={298} y1={118} x2={350} y2={118} className="stroke-gray-400" strokeWidth={1.5} markerEnd="url(#om-arrow)" />
      <g>
        <path d="M356 76 h52 l14 14 v70 h-66 z" className="fill-white stroke-gray-400" />
        {[96, 106, 116, 126, 136, 146].map((y) => (
          <line key={y} x1={364} x2={412} y1={y} y2={y} className="stroke-gray-300" />
        ))}
        <text x={389} y={176} textAnchor="middle" fontSize={11} className="fill-gray-700">
          {pick(["the paper", "論文"])}
        </text>
      </g>
      <line x1={428} y1={118} x2={470} y2={118} className="stroke-gray-400" strokeWidth={1.5} markerEnd="url(#om-arrow)" />
      {/* referees */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${490 + i * 38} ${92})`}>
          <circle cx={12} cy={8} r={8} className="fill-teal-500" />
          <path d="M0 34 q12 -22 24 0 z" className="fill-teal-500" />
        </g>
      ))}
      <text x={548} y={148} textAnchor="middle" fontSize={11} className="fill-gray-800 font-semibold">
        {pick(["referees", "審稿人"])}
      </text>
      <text x={548} y={164} textAnchor="middle" fontSize={10} className="fill-gray-600">
        {pick(["read line by line", "逐行閱讀"])}
      </text>
      <text x={548} y={178} textAnchor="middle" fontSize={10} className="fill-gray-600">
        {pick(["months to years", "數月到數年"])}
      </text>
      <text x={430} y={222} textAnchor="middle" fontSize={10} className="fill-gray-500">
        {pick(["no machine anywhere checks a step", "整個過程沒有任何一步由機器檢查"])}
      </text>
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ workflow switch

const STAGES: { label: L; then: Who; now: Who; thenNote: L; nowNote: L }[] = [
  {
    label: ["Choose the problem", "選題"],
    then: "human",
    now: "human",
    thenNote: ["From taste and the literature.", "憑品味與文獻。"],
    nowNote: ["Still people: direction is the architect's job.", "仍然是人：方向是架構師的工作。"],
  },
  {
    label: ["Fix the statement", "固定陳述"],
    then: "human",
    now: "both",
    thenNote: ["Written in words, sometimes refined as the proof goes.", "用文字寫，常常邊證邊改。"],
    nowNote: ["A formal statement first, written with AI's help and reviewed by people: the spec, frozen before the proof.", "先寫形式化陳述，AI 幫忙寫、人來審：這是規格，證明之前就凍結。"],
  },
  {
    label: ["Plan the proof", "規劃證明"],
    then: "human",
    now: "both",
    thenNote: ["In one head, or on a blackboard.", "在一個腦袋裡，或黑板上。"],
    nowNote: ["A blueprint: a tree of lemmas, each a `sorry` to fill. People sketch it, AI proposes and splits.", "藍圖：一棵引理樹，每一條都是待填的 `sorry`。人畫草圖，AI 提議並拆分。"],
  },
  {
    label: ["Work out the details", "推導細節"],
    then: "human",
    now: "ai",
    thenNote: ["Pencil and paper, for months or years.", "紙筆，好幾個月或好幾年。"],
    nowNote: ["Many agents at once, on many machines, each on one `sorry`.", "許多代理同時在許多台機器上，各自處理一條 `sorry`。"],
  },
  {
    label: ["Check every step", "檢查每一步"],
    then: "human",
    now: "machine",
    thenNote: ["Referees read it, months or years later, and can miss things.", "審稿人幾個月或幾年後來讀，可能漏看。"],
    nowNote: ["The Lean kernel, on every change, plus independent kernels.", "每次改動都由 Lean 核心檢查，再加上獨立核心。"],
  },
  {
    label: ["Simplify", "簡化"],
    then: "human",
    now: "ai",
    thenNote: ["Second and third proofs, often decades later.", "第二、第三個證明，常常是幾十年後。"],
    nowNote: ["Refactor: the same statements, a shorter proof, re-checked at once (17.4M → 113k lines in five days).", "重構：陳述不變、證明變短，馬上重新檢查（五天內 1740 萬 → 11.3 萬行）。"],
  },
  {
    label: ["Understand and explain", "理解與解釋"],
    then: "human",
    now: "both",
    thenNote: ["Built in: the author understood every line.", "內建的：作者理解每一行。"],
    nowNote: ["No longer automatic: maps, reading guides and a paper for people, drafted with AI, linked to the Lean.", "不再是自動的：地圖、閱讀指南、寫給人看的論文，由 AI 協助起草，並與 Lean 對應。"],
  },
  {
    label: ["Judge what matters", "判斷什麼重要"],
    then: "human",
    now: "human",
    thenNote: ["The community, over years.", "數學社群，經年累月。"],
    nowNote: ["Still people: taste and quality control.", "仍然是人：品味與品質把關。"],
  },
];

/**
 * The same eight stages as two lanes on one axis: traditional above, AI-native below, so each column compares one
 * stage. A tap on a column shows both notes. Wider than a phone: it scrolls sideways inside the figure.
 */
export function WorkflowSwitch() {
  const { pick } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const lanes: { key: "then" | "now"; label: L }[] = [
    { key: "then", label: ["Traditional", "傳統"] },
    { key: "now", label: ["AI-native", "AI 原生"] },
  ];
  const cols = "grid-cols-[84px_repeat(8,minmax(76px,1fr))]";
  const sel = open === null ? null : STAGES[open];
  return (
    <div className="w-full space-y-3" data-testid="workflow-switch">
      {/* padded so the selected column's outline is never clipped by the scroll box */}
      <div className="overflow-x-auto p-1">
        <div className={`grid min-w-[700px] gap-x-1.5 gap-y-3.5 ${cols}`}>
          {/* stage headers */}
          <span />
          {STAGES.map((s, i) => (
            <button
              key={s.label[0]}
              onClick={() => setOpen(open === i ? null : i)}
              aria-pressed={open === i}
              className={`rounded-md px-1 py-1 text-center text-xs leading-tight ${open === i ? "bg-gray-800 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <span className={`block text-[10px] ${open === i ? "text-gray-300" : "text-gray-400"}`}>{i + 1}</span>
              {pick(s.label)}
            </button>
          ))}
          {/* the two lanes */}
          {lanes.map((lane, li) => (
            <div key={lane.key} className="contents">
              <span className={`flex items-center text-xs font-semibold ${li === 0 ? "text-gray-600" : "text-(--lk-accent)"}`}>{pick(lane.label)}</span>
              {STAGES.map((s, i) => {
                const who = s[lane.key];
                const changed = s.then !== s.now;
                return (
                  <button
                    key={s.label[0]}
                    onClick={() => setOpen(open === i ? null : i)}
                    aria-label={`${pick(s.label)}: ${pick(lane.label)}, ${pick(WHO[who].label)}`}
                    className={`relative flex h-11 items-center justify-center rounded-md px-1 text-center text-[11px] font-medium ring-1 ${WHO[who].cls} ${
                      open === i ? "outline-2 outline-offset-1 outline-gray-800" : ""
                    }`}
                  >
                    {pick(WHO[who].label)}
                    {/* a change between the lanes: a small down arrow on the AI-native cell */}
                    {li === 1 && changed && <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 text-[9px] leading-none text-gray-400">▼</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-[4.5rem] rounded-md bg-white p-3 text-xs ring-1 ring-gray-200">
        {sel ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {lanes.map((lane) => (
              <p key={lane.key}>
                <span className="font-semibold text-gray-800">
                  {pick(sel.label)} · {pick(lane.label)}:
                </span>{" "}
                <RichText text={pick(lane.key === "then" ? sel.thenNote : sel.nowNote)} />
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">{pick(["Tap a stage to compare the two workflows there. ▼ marks a stage that changes hands.", "點一個階段，比較兩種工作流在那裡的差別。▼ 表示這個階段換了人做。"])}</p>
        )}
      </div>
      <WhoLegend only={["human", "both", "ai", "machine"]} />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ divide and conquer

type NodeState = "open" | "work" | "done" | "fail";
interface TreeNode {
  id: string;
  x: number;
  y: number;
  parent?: string;
  label: string;
}
const ROW = [34, 100, 168];
const leaf = (id: string, x: number, parent: string, label: string): TreeNode => ({ id, x, y: ROW[2], parent, label });

/** The plan: the theorem, three lemmas, seven leaves. */
const PLAN: TreeNode[] = [
  { id: "T", x: 320, y: ROW[0], label: "theorem" },
  { id: "A", x: 150, y: ROW[1], parent: "T", label: "A" },
  { id: "B", x: 360, y: ROW[1], parent: "T", label: "B" },
  { id: "C", x: 530, y: ROW[1], parent: "T", label: "C" },
  leaf("A1", 80, "A", "A₁"),
  leaf("A2", 150, "A", "A₂"),
  leaf("A3", 220, "A", "A₃"),
  leaf("B1", 320, "B", "B₁"),
  leaf("B2", 400, "B", "B₂"),
  leaf("C1", 490, "C", "C₁"),
  leaf("C2", 570, "C", "C₂"),
];
/** Refactor ①: A₁ and A₂ turn out to be one argument, A₁₂. */
const MERGE1: TreeNode[] = [
  ...PLAN.filter((n) => n.id !== "A1" && n.id !== "A2"),
  leaf("A12", 115, "A", "A₁₂"),
];
/** Refactor ②: A and B share their argument and become one lemma, AB. */
const MERGE2: TreeNode[] = [
  ...MERGE1.filter((n) => n.id !== "A" && n.id !== "B").map((n) => (n.parent === "A" || n.parent === "B" ? { ...n, parent: "AB" } : n)),
  { id: "AB", x: 264, y: ROW[1], parent: "T", label: "AB" },
];
const LEAVES = ["A1", "A2", "A3", "B1", "B2", "C1", "C2"];

const STEPS: { chip: L; text: L; tree: TreeNode[]; state: (id: string) => NodeState; agents?: boolean; kernel?: boolean; prose?: boolean }[] = [
  {
    chip: ["1 statement", "1 陳述"],
    text: [
      "**The architect fixes the statement.** One theorem, written in Lean before any proof exists: this is the spec, and nothing below may change it.",
      "**架構師固定陳述。** 一條定理，在任何證明出現之前就用 Lean 寫好：這是規格，下面的一切都不能改動它。",
    ],
    tree: PLAN.filter((n) => n.id === "T"),
    state: () => "open",
  },
  {
    chip: ["2 plan", "2 計畫"],
    text: [
      "**Divide, level by level.** People and AI split the theorem into main lemmas (level 1), and each of those into smaller ones (level 2). Every level is a level of abstraction: above it, you need only the statements below, not their proofs. Every box is still a `sorry`, and Lean already checks that the pieces fit together.",
      "**一層一層分割。** 人與 AI 把定理拆成主要引理（第 1 層），每條再拆成更小的引理（第 2 層）。每一層都是一個抽象層次：在它上面，只需要下一層的陳述，不需要它們的證明。每個方框都還是 `sorry`，而 Lean 已經在檢查這些零件拼不拼得起來。",
    ],
    tree: PLAN,
    state: () => "open",
  },
  {
    chip: ["3 conquer", "3 攻克"],
    text: [
      "**Conquer, in parallel.** Agents take one `sorry` each, on many machines at once. Some attempts fail (red); they are thrown away and tried again. Nobody has to read a failed attempt.",
      "**平行攻克。** 代理各取一條 `sorry`，同時在許多台機器上跑。有些嘗試會失敗（紅色），丟掉再試就好。沒有人需要讀失敗的嘗試。",
    ],
    tree: PLAN,
    state: (id) => (id === "B2" ? "fail" : LEAVES.includes(id) ? (id === "A1" || id === "C1" ? "done" : "work") : "open"),
    agents: true,
  },
  {
    chip: ["4 check", "4 檢查"],
    text: [
      "**The kernel checks everything, on every change.** When no `sorry` is left and the kernel accepts, the theorem is proved, however many hands and machines wrote the pieces. Independent kernels can check again.",
      "**每次改動，核心都檢查全部。** 一旦沒有 `sorry` 了、核心也接受，定理就證明了，不管零件出自多少雙手、多少台機器。獨立的核心還可以再查一次。",
    ],
    tree: PLAN,
    state: () => "done",
    kernel: true,
  },
  {
    chip: ["5 refactor", "5 重構"],
    text: [
      "**Refactor: merge two lemmas.** A₁ and A₂ turn out to be the same argument in two forms, so they become one lemma, A₁₂; A₃ stays. The statement on top does not move, and the kernel re-checks at once.",
      "**重構：合併兩條引理。** A₁ 與 A₂ 其實是同一個論證的兩種寫法，於是合成一條引理 A₁₂；A₃ 不變。最上面的陳述不動，核心立刻重新檢查。",
    ],
    tree: MERGE1,
    state: (id) => (id === "A12" ? "work" : "done"),
    kernel: true,
  },
  {
    chip: ["6 abstract", "6 抽象"],
    text: [
      "**Refactor: raise the abstraction.** A and B turn out to be two cases of one more general lemma, AB, over the same pieces. A better abstraction at level 1 makes the proof shorter *and* easier to read from the top: fewer, more general lemmas. The November 2026 refactor of the RH proof (17.4 million lines to 113,000 in five days) worked in the same spirit: the statements stayed, what was underneath was rewritten.",
      "**重構：提高抽象層次。** A 與 B 其實是同一條更一般的引理 AB 的兩個特例，底下仍是同樣的零件。第 1 層有了更好的抽象，證明就更短，也更容易從上往下讀：引理更少、更一般。2026 年 11 月 RH 證明的重構（五天內從 1740 萬行變成 11.3 萬行）也是同樣的精神：陳述不動，底下的東西改寫。",
    ],
    tree: MERGE2,
    state: (id) => (id === "AB" ? "work" : "done"),
    kernel: true,
  },
  {
    chip: ["7 explain", "7 解釋"],
    text: [
      "**Explain.** Finally the proof is written for people: a natural-language argument linked step by step to the Lean, drafted with AI and judged by mathematicians. This is the step the RH proof is still waiting for.",
      "**解釋。** 最後把證明寫給人看：一份自然語言的論證，一步一步對應到 Lean，由 AI 協助起草、由數學家評判。RH 的證明還在等這一步。",
    ],
    tree: MERGE2,
    state: () => "done",
    prose: true,
  },
];

/** The outline says the state; the fill says the kind (theorem or lemma), so the two never compete. */
const STATE_CLS: Record<NodeState, { stroke: string; swatch: string; label: L }> = {
  open: { stroke: "stroke-amber-500", swatch: "border-amber-500", label: ["open (`sorry`)", "未填（`sorry`）"] },
  work: { stroke: "stroke-violet-500", swatch: "border-violet-500", label: ["in progress", "進行中"] },
  done: { stroke: "stroke-emerald-600", swatch: "border-emerald-600", label: ["checked", "已檢查"] },
  fail: { stroke: "stroke-red-500", swatch: "border-red-500", label: ["failed attempt", "失敗的嘗試"] },
};
/** Kind is the outline's pattern (and the fill): the theorem solid on indigo, a lemma dashed on white. */
const KIND = {
  theorem: { fill: "fill-indigo-100", dash: undefined, width: 2.5 },
  lemma: { fill: "fill-white", dash: "4 3", width: 1.75 },
};

/** The three rows are levels of abstraction: what is claimed, the outline of how, the details. */
const LEVELS: { y: number; name: L; sub: L }[] = [
  { y: ROW[0], name: ["level 0 · statement", "第 0 層 · 陳述"], sub: ["what is true", "什麼是真的"] },
  { y: ROW[1], name: ["level 1 · main lemmas", "第 1 層 · 主要引理"], sub: ["the outline of how", "怎麼證的大綱"] },
  { y: ROW[2], name: ["level 2 · details", "第 2 層 · 細節"], sub: ["the steps underneath", "底下的步驟"] },
];
const DX = 150; // the tree sits right of the level labels

/** Divide and conquer, step by step: the plan as a tree of sorrys, filled in parallel, checked, refactored twice, explained. */
export function DivideConquer() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const tree = step.tree;
  const at = (id: string) => tree.find((q) => q.id === id)!;
  return (
    <div className="w-full max-w-[740px]" data-testid="divide-conquer">
      <StepChips labels={STEPS.map((s) => pick(s.chip))} i={i} setI={setI} />
      {/* above the picture, in the flow: the explainer button never sits on the tree */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span>{pick(["↑ more abstract", "↑ 越往上越抽象"])}</span>
        <AbstractionExplainer />
      </div>
      <svg viewBox="0 0 830 270" className="w-full" role="img" aria-label={pick(step.chip)}>
        {/* levels of abstraction, most abstract on top */}
        {LEVELS.map((l) => (
          <g key={l.y}>
            <line x1={8} x2={830} y1={l.y} y2={l.y} className="stroke-gray-200" strokeDasharray="2 4" />
            <rect x={6} y={l.y - 15} width={132} height={30} className="fill-gray-50" />
            <text x={8} y={l.y - 2} fontSize={10} className="fill-gray-800 font-semibold">
              {pick(l.name)}
            </text>
            <text x={8} y={l.y + 11} fontSize={9} className="fill-gray-500">
              {pick(l.sub)}
            </text>
          </g>
        ))}
        <g transform={`translate(${DX} 0)`}>
        {tree.map((n) => {
          if (!n.parent) return null;
          const p = at(n.parent);
          return <line key={`e-${n.id}`} x1={p.x} y1={p.y + 13} x2={n.x} y2={n.y - 13} className="stroke-gray-300" />;
        })}
        {tree.map((n) => {
          const st = step.state(n.id);
          const w = n.id === "T" ? 90 : 50;
          const kind = KIND[n.id === "T" ? "theorem" : "lemma"];
          return (
            <g key={n.id} className="motion-safe:transition-transform motion-safe:duration-500" style={{ transform: `translate(${n.x}px, ${n.y}px)` }}>
              <rect
                x={-w / 2}
                y={-13}
                width={w}
                height={26}
                rx={6}
                className={`${kind.fill} ${STATE_CLS[st].stroke}`}
                strokeWidth={kind.width}
                strokeDasharray={kind.dash}
              />
              <text y={4} textAnchor="middle" fontSize={11} fontFamily={MONO} className={n.id === "T" ? "fill-indigo-900 font-semibold" : "fill-gray-800"}>
                {n.id === "T" ? pick(["theorem", "定理"]) : n.label}
                {st === "done" ? " ✓" : st === "fail" ? " ✗" : ""}
              </text>
            </g>
          );
        })}
        {step.agents &&
          LEAVES.map((id) => {
            const n = at(id);
            return (
              <g key={`ag-${id}`} transform={`translate(${n.x} ${n.y + 36})`}>
                <rect x={-14} y={-9} width={28} height={18} rx={4} className="fill-violet-500" />
                <text y={4} textAnchor="middle" fontSize={9} className="fill-white">
                  AI
                </text>
              </g>
            );
          })}
        {step.agents && (
          <text x={320} y={236} textAnchor="middle" fontSize={10} className="fill-gray-500">
            {pick(["seven agents, seven machines, at the same time", "七個代理、七台機器，同時進行"])}
          </text>
        )}
        {step.kernel && (
          <g>
            <rect x={170} y={214} width={300} height={34} rx={8} className="fill-sky-50 stroke-sky-500" />
            <text x={320} y={235} textAnchor="middle" fontSize={11} className="fill-sky-800">
              {pick(["Lean kernel ✓ (and independent kernels ✓)", "Lean 核心 ✓（以及獨立核心 ✓）"])}
            </text>
          </g>
        )}
        {step.prose && (
          <g>
            <rect x={606} y={20} width={68} height={160} rx={6} className="fill-white stroke-teal-500" />
            {[44, 62, 80, 98, 116, 134, 152].map((y) => (
              <line key={y} x1={616} x2={664} y1={y} y2={y} className="stroke-teal-200" />
            ))}
            <text x={640} y={198} textAnchor="middle" fontSize={10} className="fill-teal-800">
              {pick(["for people", "給人看"])}
            </text>
            {[
              [365, ROW[0]],
              [555, ROW[1]],
              [595, ROW[2]],
            ].map(([x, y]) => (
              <line key={y} x1={x} y1={y} x2={606} y2={y} className="stroke-teal-400" strokeDasharray="3 3" />
            ))}
          </g>
        )}
        </g>
      </svg>
      <div className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-5 rounded-sm border-2 border-solid border-gray-600 bg-indigo-100" />
          {pick(["theorem", "定理"])}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-5 rounded-sm border-2 border-dashed border-gray-500 bg-white" />
          {pick(["lemma", "引理"])}
        </span>
        <span className="text-gray-300">|</span>
        {(Object.keys(STATE_CLS) as NodeState[]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-5 rounded-sm border-2 bg-white ${STATE_CLS[k].swatch}`} />
            <RichText text={pick(STATE_CLS[k].label)} />
          </span>
        ))}
      </div>
      <p className="min-h-[3.5rem] text-sm text-gray-700">
        <RichText text={pick(step.text)} />
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ explainer dialogs

/**
 * A small pill button that opens a dialog (the native <dialog>: Esc, × or a click outside closes it), like the RH
 * page's "What is a refactor?". The body renders only while open.
 */
function InfoDialog({ id, label, width, children }: { id: string; label: L; width: string; children: ReactNode }) {
  const { pick } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);
  const open = () => {
    setShown(true);
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-0.5 text-xs text-teal-800 hover:bg-teal-100"
        data-testid={`${id}-open`}
      >
        {pick(label)}
      </button>
      <dialog
        ref={ref}
        onClose={() => setShown(false)}
        onClick={(e) => e.target === ref.current && close()}
        aria-labelledby={`${id}-title`}
        className="m-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-gray-900/45"
        style={{ width: `min(${width}, calc(100vw - 2rem))` }}
        data-testid={`${id}-dialog`}
      >
        {shown && (
          <div className="space-y-4 p-5 text-sm leading-relaxed text-gray-800 sm:p-6">
            <div className="flex items-start gap-3">
              <h3 id={`${id}-title`} className="flex-1 text-xl font-semibold text-gray-900">
                {pick(label)}
              </h3>
              <button
                type="button"
                onClick={close}
                className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label={pick(["Close (Esc)", "關閉（Esc）"])}
              >
                ×
              </button>
            </div>
            {children}
          </div>
        )}
      </dialog>
    </>
  );
}

// ------------------------------------------------------------------------------------------------ levels of abstraction

const LAYERS: { sw: L; ma: L; sub: L }[] = [
  { sw: ["interface", "介面"], ma: ["statement (level 0)", "陳述（第 0 層）"], sub: ["what callers rely on / what is claimed", "呼叫者依賴的／宣稱的"] },
  { sw: ["modules", "模組"], ma: ["main lemmas (level 1)", "主要引理（第 1 層）"], sub: ["the outline of how", "怎麼做的大綱"] },
  { sw: ["functions", "函式"], ma: ["details (level 2)", "細節（第 2 層）"], sub: ["the steps underneath", "底下的步驟"] },
];

/** Software layers beside proof levels, then two special lemmas replaced by one general one. */
function AbstractionPicture() {
  const { pick } = useLang();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-x-2 gap-y-1.5 text-xs">
        <p className="text-center font-semibold text-gray-500">{pick(["Software", "軟體"])}</p>
        <span />
        <p className="text-center font-semibold text-gray-500">{pick(["Mathematics (Lean)", "數學（Lean）"])}</p>
        {LAYERS.map((l, k) => (
          <div key={k} className="contents">
            <div className="rounded-md bg-gray-50 px-2 py-2 text-center text-gray-800 ring-1 ring-gray-200" style={{ marginInline: `${k * 10}px` }}>
              {pick(l.sw)}
            </div>
            <span className="self-center text-gray-400">↔</span>
            <div className={`rounded-md px-2 py-1.5 text-center ring-1 ${k === 0 ? "bg-indigo-50 ring-indigo-300" : "bg-white ring-gray-300"}`} style={{ marginInline: `${k * 10}px` }}>
              <span className="block text-gray-800">{pick(l.ma)}</span>
              <span className="block text-[10px] text-gray-500">{pick(l.sub)}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-500">
        {pick(["Each layer uses only the statements of the layer below, never their proofs.", "每一層只用到下一層的陳述，從不用到它們的證明。"])}
      </p>
      <div className="grid items-center gap-2 text-xs sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-1 rounded-md bg-white p-2 ring-1 ring-gray-200">
          <p className="font-semibold text-gray-600">{pick(["Before: two special lemmas", "之前：兩條特例引理"])}</p>
          <code className="block rounded bg-gray-50 px-2 py-1 text-[11px]" style={{ fontFamily: MONO }}>
            lemma A : P 2
          </code>
          <code className="block rounded bg-gray-50 px-2 py-1 text-[11px]" style={{ fontFamily: MONO }}>
            lemma B : P 3
          </code>
        </div>
        <span className="text-center text-gray-400">→</span>
        <div className="space-y-1 rounded-md bg-white p-2 ring-1 ring-teal-300">
          <p className="font-semibold text-teal-800">{pick(["After: one general lemma", "之後：一條一般的引理"])}</p>
          <code className="block rounded bg-teal-50 px-2 py-1 text-[11px]" style={{ fontFamily: MONO }}>
            lemma AB (n : ℕ) : P n
          </code>
          <span className="block text-[11px] text-gray-500">{pick(["A and B are now `AB 2` and `AB 3`.", "A 與 B 現在就是 `AB 2` 和 `AB 3`。"]).replace(/`/g, "")}</span>
        </div>
      </div>
    </div>
  );
}

/** "What is a level of abstraction?": a button in the figure that opens a dialog, like the RH page's refactor explainer. */
function AbstractionExplainer() {
  const { pick } = useLang();
  return (
    <InfoDialog id="abstraction" label={["What is a level of abstraction?", "什麼是抽象層次？"]} width="40rem">
            <p>
              <RichText
                text={pick([
                  "The rows of the tree are **levels of abstraction**, as in software: an interface, the modules behind it, the functions behind those. Each level needs only the *statements* of the level below, not their proofs. So people can think at the top while machines work at the bottom, and a change underneath cannot break what is above as long as the statements hold.",
                  "這棵樹的每一列都是一個**抽象層次**，就像軟體：一個介面、介面後面的模組、模組後面的函式。每一層只需要下一層的*陳述*，不需要它們的證明。所以人可以在上層思考、機器在下層工作，而只要陳述成立，底下怎麼改都不會弄壞上面。",
                ])}
              />
            </p>
            <AbstractionPicture />
            <p>
              <RichText
                text={pick([
                  "Where the levels are drawn is the architect's main design decision. A good abstraction (one general lemma instead of two special ones) makes a proof shorter, easier to divide among many hands, and easier for a person to read from the top down. Finding such abstractions is also where new mathematics usually lives.",
                  "層次畫在哪裡，是架構師最主要的設計決定。好的抽象（用一條一般的引理取代兩條特例）讓證明更短、更容易分給許多雙手，也更容易讓人從上往下讀。找到這樣的抽象，通常也就是新數學所在的地方。",
                ])}
              />
            </p>
    </InfoDialog>
  );
}

// ------------------------------------------------------------------------------------------------ reverse path

type RKind = "axiom" | "lemma" | "theorem" | "new";
interface RNode {
  id: string;
  x: number;
  y: number;
  kind: RKind;
  label: L;
}
const RN: RNode[] = [
  { id: "base", x: 90, y: 230, kind: "axiom", label: ["base", "基礎"] },
  { id: "ind", x: 210, y: 230, kind: "axiom", label: ["induction", "歸納"] },
  { id: "comp", x: 330, y: 230, kind: "axiom", label: ["comprehension", "概括"] },
  { id: "choice", x: 450, y: 230, kind: "axiom", label: ["choice", "選擇"] },
  { id: "extra", x: 570, y: 230, kind: "axiom", label: ["extra axiom", "額外公理"] },
  { id: "L1", x: 120, y: 162, kind: "lemma", label: ["L₁", "L₁"] },
  { id: "L2", x: 240, y: 162, kind: "lemma", label: ["L₂", "L₂"] },
  { id: "L3", x: 360, y: 162, kind: "lemma", label: ["L₃", "L₃"] },
  { id: "L4", x: 510, y: 162, kind: "lemma", label: ["L₄", "L₄"] },
  { id: "M1", x: 180, y: 96, kind: "lemma", label: ["M₁", "M₁"] },
  { id: "M2", x: 330, y: 96, kind: "lemma", label: ["M₂", "M₂"] },
  { id: "M3", x: 510, y: 96, kind: "lemma", label: ["M₃", "M₃"] },
  { id: "T", x: 300, y: 30, kind: "theorem", label: ["theorem", "定理"] },
  { id: "N", x: 300, y: 130, kind: "new", label: ["new concept", "新概念"] },
];
/** from → to: the lower node is used to prove the upper one */
const RE: [string, string][] = [
  ["base", "L1"],
  ["ind", "L1"],
  ["base", "L2"],
  ["comp", "L2"],
  ["comp", "L3"],
  ["ind", "L3"],
  ["choice", "L4"],
  ["extra", "L4"],
  ["L1", "M1"],
  ["L2", "M1"],
  ["L2", "M2"],
  ["L3", "M2"],
  ["L4", "M3"],
  ["M1", "T"],
  ["M2", "T"],
];
const USED = new Set(["T", "M1", "M2", "L1", "L2", "L3", "base", "ind", "comp"]);
/** after the abstraction: L₂, L₃ and M₂ (a pattern found twice) become one new concept */
const RE_ABS: [string, string][] = [
  ["base", "L1"],
  ["ind", "L1"],
  ["L1", "M1"],
  ["base", "N"],
  ["ind", "N"],
  ["comp", "N"],
  ["N", "M1"],
  ["M1", "T"],
  ["N", "T"],
];

const RSTEPS: { chip: L; text: L; mode: "forward" | "backward" | "equiv" | "abstract" }[] = [
  {
    chip: ["1 forward", "1 正向"],
    mode: "forward",
    text: [
      "**Forward, the usual direction.** Start from axioms, prove lemmas, reach the theorem. The path is whatever its authors found: often longer than needed, and it may lean on axioms it does not really need.",
      "**正向，平常的方向。** 從公理出發，證明引理，抵達定理。這條路是作者碰巧找到的那一條：常常比需要的長，也可能依賴其實用不到的公理。",
    ],
  },
  {
    chip: ["2 backward", "2 反向"],
    mode: "backward",
    text: [
      "**Backward: what does the theorem really rest on?** Lean records every dependency, so a machine can walk the graph back from the theorem and mark exactly which lemmas and axioms are used. Here the branch through choice and the extra axiom is never reached. For axioms, `#print axioms` does this in one command.",
      "**反向：這條定理真正依賴什麼？** Lean 記下每一個依賴，所以機器可以從定理沿著圖往回走，標出真正用到的引理與公理。這裡經過「選擇」與「額外公理」的那一支根本沒被走到。對公理來說，`#print axioms` 一行指令就做到這件事。",
    ],
  },
  {
    chip: ["3 equivalence", "3 等價"],
    mode: "equiv",
    text: [
      "**Reverse mathematics: the theorem as an axiom.** Reverse mathematics goes further. Over a weak base, it proves the theorem *equivalent* to one principle: then that principle is exactly what the theorem needs, no more and no less. The classic case: over the base system RCA₀, the Bolzano–Weierstrass theorem is equivalent to arithmetical comprehension (ACA₀).",
      "**反推數學：把定理當成公理。** 反推數學更進一步。在一個很弱的基礎之上，它證明定理與某一條原理*等價*：那條原理就正好是這條定理所需要的，不多也不少。經典例子：在基礎系統 RCA₀ 之上，Bolzano–Weierstrass 定理等價於算術概括（ACA₀）。",
    ],
  },
  {
    chip: ["4 abstraction", "4 抽象"],
    mode: "abstract",
    text: [
      "**Abstraction: a new concept shortens the path.** When the backward walk finds the same pattern again and again (here L₂, L₃ and M₂), it can be named and proved once: a new definition, or a new principle worth adopting as an axiom. Every path through it gets shorter, as the RH refactor shortened its proof behind fixed statements.",
      "**抽象：一個新概念縮短了路。** 當反向走訪一再遇到同樣的模式（這裡是 L₂、L₃ 與 M₂），就可以替它命名、只證明一次：一個新定義，或一條值得採用為公理的新原理。每條經過它的路都變短了，就像 RH 的重構在陳述不變之下縮短了證明。",
    ],
  },
];

const RFILL: Record<RKind, string> = {
  axiom: "fill-amber-50",
  lemma: "fill-white",
  theorem: "fill-indigo-100",
  new: "fill-teal-100",
};

/** A proof graph walked forward, then backward (what it really uses), then read as an equivalence, then abstracted. */
export function ReversePath() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const step = RSTEPS[i];
  const abs = step.mode === "abstract";
  const nodes = RN.filter((n) => (abs ? !["L2", "L3", "M2", "L4", "M3", "choice", "extra"].includes(n.id) : n.id !== "N"));
  const edges = abs ? RE_ABS : RE;
  const at = (id: string) => RN.find((n) => n.id === id)!;
  const faded = (id: string) => (step.mode === "backward" || step.mode === "equiv") && !USED.has(id);
  const lit = (a: string, b: string) => step.mode === "backward" && USED.has(a) && USED.has(b);
  return (
    <div className="w-full max-w-[740px]" data-testid="reverse-path">
      <StepChips labels={RSTEPS.map((s) => pick(s.chip))} i={i} setI={setI} />
      <svg viewBox="0 0 740 274" className="w-full" role="img" aria-label={pick(step.chip)}>
        <text x={4} y={234} fontSize={9} className="fill-gray-500">
          {pick(["axioms", "公理"])}
        </text>
        {/* the graph sits right of the row label */}
        <g transform="translate(40 0)">
        {/* arrowheads 60% along each edge (markerMid on a three-point polyline), so crossing edges keep apart; one marker per colour */}
        <defs>
          {[
            ["rp-gray", "fill-gray-400"],
            ["rp-violet", "fill-violet-500"],
            ["rp-faint", "fill-gray-200"],
          ].map(([id, cls]) => (
            <marker key={id} id={id} viewBox="0 0 10 10" refX={5} refY={5} markerWidth={8} markerHeight={8} markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className={cls} />
            </marker>
          ))}
        </defs>
        {edges.map(([a, b]) => {
          const p = at(a);
          const q = at(b);
          const off = faded(a) || faded(b);
          const on = lit(a, b);
          // forward: from what is used up to what it proves; backward (lit): from the theorem down to what it uses
          const [x1, y1, x2, y2] = on ? [q.x, q.y + 12, p.x, p.y - 12] : [p.x, p.y - 12, q.x, q.y + 12];
          return (
            <polyline
              key={`${a}-${b}`}
              points={`${x1},${y1} ${x1 + 0.6 * (x2 - x1)},${y1 + 0.6 * (y2 - y1)} ${x2},${y2}`}
              fill="none"
              strokeWidth={on ? 2.2 : 1.3}
              markerMid={`url(#${off ? "rp-faint" : on ? "rp-violet" : "rp-gray"})`}
              className={off ? "stroke-gray-200" : on ? "stroke-violet-500" : "stroke-gray-400"}
            />
          );
        })}
        {step.mode === "equiv" && (
          <g>
            {/* out to the right and back under the axiom row, so it crosses no box */}
            <path
              d={`M${at("T").x + 50} ${at("T").y} C 700 30, 700 266, 660 266 L ${at("comp").x} 266 L ${at("comp").x} ${at("comp").y + 12}`}
              fill="none"
              className="stroke-teal-600"
              strokeWidth={2}
            />
            <rect x={606} y={130} width={92} height={34} rx={6} className="fill-white stroke-teal-600" />
            <text x={652} y={144} textAnchor="middle" fontSize={11} className="fill-teal-800 font-semibold">
              ⇔
            </text>
            <text x={652} y={158} textAnchor="middle" fontSize={9} className="fill-teal-800">
              {pick(["over the base", "在基礎之上"])}
            </text>
          </g>
        )}
        {nodes.map((n) => {
          const w = n.kind === "lemma" ? 46 : n.kind === "new" ? 108 : 100;
          const off = faded(n.id);
          const key = step.mode === "equiv" && (n.id === "T" || n.id === "comp");
          return (
            <g key={n.id} opacity={off ? 0.35 : 1}>
              <rect
                x={n.x - w / 2}
                y={n.y - 12}
                width={w}
                height={24}
                rx={6}
                className={`${RFILL[n.kind]} ${key ? "stroke-teal-600" : n.kind === "theorem" ? "stroke-indigo-500" : n.kind === "axiom" ? "stroke-amber-500" : n.kind === "new" ? "stroke-teal-600" : "stroke-gray-400"}`}
                strokeWidth={key || n.kind === "theorem" || n.kind === "new" ? 2.2 : 1.4}
                strokeDasharray={n.kind === "lemma" ? "4 3" : undefined}
              />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={11} fontFamily={n.kind === "lemma" ? MONO : undefined} className="fill-gray-800">
                {pick(n.label)}
              </text>
              {off && n.kind === "axiom" && (
                <text x={n.x} y={n.y + 24} textAnchor="middle" fontSize={9} className="fill-gray-500">
                  {pick(["not needed", "用不到"])}
                </text>
              )}
            </g>
          );
        })}
        </g>
      </svg>
      <p className="min-h-[4.5rem] text-sm text-gray-700">
        <RichText text={pick(step.text)} />
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ paper vs Lean project

const PAPER_STACKS: { title: L; layers: { name: L; sub: L; cls: string }[]; check: { text: L; cls: string } }[] = [
  {
    title: ["A paper today", "今天的論文"],
    layers: [
      { name: ["`paper.tex`, in LaTeX", "`paper.tex`，用 LaTeX 寫"], sub: ["the words and the formulas", "文字與公式"], cls: "bg-white ring-gray-300" },
      { name: ["Overleaf", "Overleaf"], sub: ["one shared online copy: live co-editing, comments, history", "一份共享的線上稿：即時共同編輯、留言、歷史紀錄"], cls: "bg-emerald-50 ring-emerald-300" },
      { name: ["git, underneath", "底下是 git"], sub: ["Overleaf projects can sync with git and GitHub", "Overleaf 專案可以和 git、GitHub 同步"], cls: "bg-orange-50 ring-orange-300" },
    ],
    check: { text: ["the build checks: **it typesets**", "建置檢查的是：**排得出版面**"], cls: "bg-amber-50 text-amber-900 ring-amber-300" },
  },
  {
    title: ["A Lean project", "Lean 專案"],
    layers: [
      { name: ["`Proof.lean`, in Lean", "`Proof.lean`，用 Lean 寫"], sub: ["the statements and the proofs", "陳述與證明"], cls: "bg-white ring-gray-300" },
      { name: ["GitHub", "GitHub"], sub: ["branches, pull requests, review, issues", "分支、pull request、審查、issue"], cls: "bg-gray-50 ring-gray-300" },
      { name: ["git, underneath", "底下是 git"], sub: ["every version, every author", "每一版、每一位作者"], cls: "bg-orange-50 ring-orange-300" },
    ],
    check: { text: ["the build checks: **every step of every proof**", "建置檢查的是：**每個證明的每一步**"], cls: "bg-sky-50 text-sky-900 ring-sky-300" },
  },
];

/** Today's paper (LaTeX on Overleaf, git underneath) beside a Lean project on git: same version control, different checks. */
export function PaperStacks() {
  const { pick } = useLang();
  return (
    <div className="grid w-full max-w-[620px] gap-4 p-1 sm:grid-cols-2" data-testid="paper-stacks">
      {PAPER_STACKS.map((s, k) => (
        <div key={k} className="space-y-1.5">
          <p className="text-center text-xs font-semibold text-gray-600">{pick(s.title)}</p>
          {s.layers.map((l, j) => (
            <div key={j} className={`rounded-md px-2.5 py-1.5 text-center ring-1 ${l.cls}`}>
              <p className="text-xs font-semibold text-gray-800">
                <RichText text={pick(l.name)} />
              </p>
              <p className="text-[11px] text-gray-600">{pick(l.sub)}</p>
            </div>
          ))}
          <div className={`rounded-md px-2.5 py-1.5 text-center text-xs ring-1 ${s.check.cls}`}>
            <RichText text={pick(s.check.text)} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ git flow

interface Branch {
  who: L;
  /** commit fill */
  fill: string;
  /** the lane this branch runs on, and the lane it leaves and returns to (main, or another branch) */
  y: number;
  base: number;
  fork: number;
  merge: number;
  items: { kind: "commit" | "gate"; x: number; ok?: boolean }[];
  /** the merge commit's fill when it returns to a branch rather than main */
  mergeFill?: string;
}
const MAIN_Y = 150;
const BRANCHES: Branch[] = [
  {
    who: ["a graduate student", "研究生"],
    fill: "fill-sky-500",
    y: 66,
    base: MAIN_Y,
    fork: 60,
    merge: 300,
    items: [
      { kind: "commit", x: 120 },
      { kind: "commit", x: 165 },
      { kind: "commit", x: 210 },
      { kind: "gate", x: 255, ok: true },
    ],
  },
  {
    who: ["an agent, overnight", "代理，跑了一整夜"],
    fill: "fill-violet-500",
    y: 222,
    base: MAIN_Y,
    fork: 120,
    merge: 505,
    items: [
      { kind: "commit", x: 180 },
      { kind: "commit", x: 225 },
      { kind: "gate", x: 270, ok: false },
      { kind: "gate", x: 460, ok: true },
    ],
  },
  {
    // a branch of a branch: the failed check is fixed locally, then merged back before trying the gate again
    who: ["fixed locally", "在本地修正"],
    fill: "fill-violet-300",
    y: 292,
    base: 222,
    fork: 295,
    merge: 425,
    mergeFill: "fill-violet-500",
    items: [{ kind: "commit", x: 360 }],
  },
  {
    who: ["a professor", "教授"],
    fill: "fill-amber-500",
    y: 66,
    base: MAIN_Y,
    fork: 330,
    merge: 545,
    items: [
      { kind: "commit", x: 390 },
      { kind: "commit", x: 435 },
      { kind: "gate", x: 480, ok: true },
    ],
  },
  {
    who: ["a high-school student", "高中生"],
    fill: "fill-rose-400",
    y: 222,
    base: MAIN_Y,
    fork: 565,
    merge: 755,
    items: [
      { kind: "commit", x: 625 },
      { kind: "commit", x: 670 },
      { kind: "gate", x: 710, ok: true },
    ],
  },
];
const R = 24; // corner radius of a branch

/** Out of the base lane, along the branch's lane, back into the base lane. */
function branchPath(b: Branch): string {
  const s = b.y < b.base ? -1 : 1;
  const { fork: f, merge: m, base, y } = b;
  return (
    `M${f} ${base} Q${f + R} ${base} ${f + R} ${base + s * R} V${y - s * R} Q${f + R} ${y} ${f + 2 * R} ${y}` +
    ` H${m - 2 * R} Q${m - R} ${y} ${m - R} ${y - s * R} V${base + s * R} Q${m - R} ${base} ${m} ${base}`
  );
}

const VC_TERMS: { term: L; code: L; maths: L }[] = [
  { term: ["commit", "提交（commit）"], code: ["a saved change, with who, when and why", "一次存下的改動，記下誰、何時、為什麼"], maths: ["a lemma added or a proof changed", "加了一條引理、改了一個證明"] },
  { term: ["branch", "分支（branch）"], code: ["your own line of work, apart from main", "你自己的一條工作線，與 main 分開"], maths: ["an attempt at one `sorry`, without disturbing anyone", "嘗試填一個 `sorry`，不打擾任何人"] },
  { term: ["local fix", "本地修正"], code: ["a branch of your branch, merged back when it works", "從你的分支再分出去，修好了再合併回來"], maths: ["repairing a step the kernel rejected", "修補一個被核心拒絕的步驟"] },
  { term: ["pull request", "pull request"], code: ["asking for your branch to join main", "請求把你的分支併入 main"], maths: ["offering a proof to the project", "把一個證明提交給專案"] },
  { term: ["CI check", "CI 檢查"], code: ["tests run automatically on every pull request", "每個 pull request 都自動跑測試"], maths: ["the Lean kernel checks every step", "Lean 核心檢查每一步"] },
  { term: ["merge", "合併（merge）"], code: ["the branch joins main; everyone builds on it", "分支併入 main；大家都在它上面繼續"], maths: ["the lemma enters the shared library", "引理進入共享的函式庫"] },
  { term: ["history", "歷史（history）"], code: ["every past version kept; any change can be undone", "每個過去的版本都留著；任何改動都能撤回"], maths: ["every version of the proof, dated and citable", "證明的每一版都有日期、可以引用"] },
];

/** "What is version control?": a button in the git figure that opens a dialog with the terms, for code and for maths. */
function VersionControlExplainer() {
  const { pick } = useLang();
  return (
    <InfoDialog id="vc" label={["What is version control?", "什麼是版本控制？"]} width="44rem">
            <p>
              <RichText
                text={pick([
                  "**Version control** records every change to a project as a *commit*: what changed, who made it, when and why. Nothing is overwritten and nothing is lost, so any version can be recovered and any change undone. *Branches* let many people work at once without getting in each other's way, and *merging* brings their work together. **git** is the tool almost all software uses; GitHub hosts git projects so anyone, anywhere, can propose a change.",
                  "**版本控制**把專案的每一次改動記成一個 *commit*：改了什麼、誰改的、何時、為什麼。沒有東西會被覆蓋、也沒有東西會遺失，所以任何版本都能找回，任何改動都能撤回。*分支* 讓許多人同時工作而不互相干擾，*合併* 再把大家的工作匯集起來。**git** 是幾乎所有軟體都在用的工具；GitHub 託管 git 專案，讓任何地方的任何人都能提出改動。",
                ])}
              />
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">{pick(["Term", "名詞"])}</th>
                    <th className="px-3 py-2">{pick(["In software", "在軟體裡"])}</th>
                    <th className="px-3 py-2">{pick(["In a Lean project", "在 Lean 專案裡"])}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {VC_TERMS.map((r) => (
                    <tr key={r.term[0]}>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">{pick(r.term)}</td>
                      <td className="px-3 py-2">{pick(r.code)}</td>
                      <td className="px-3 py-2">
                        <RichText text={pick(r.maths)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <RichText
                text={pick([
                  "Mathematics has had versions for a long time (preprints, errata, the second edition), but not this. In a git project every version of a proof is kept and dated, every change is checked by the kernel before it joins, and a mistake found later can be traced to the exact commit that introduced it.",
                  "數學早就有版本（預印本、勘誤、第二版），但不是這樣的。在 git 專案裡，證明的每一版都保留並標上日期，每一次改動在併入之前都經過核心檢查，而之後發現的錯誤，可以追溯到引入它的那一個 commit。",
                ])}
              />
            </p>
    </InfoDialog>
  );
}

const PIPELINE: { step: L; sw: L; lean: L }[] = [
  { step: ["commit", "提交"], sw: ["a change", "一個改動"], lean: ["a lemma, a proof", "一條引理、一個證明"] },
  { step: ["build", "建置"], sw: ["compile", "編譯"], lean: ["`lake build`", "`lake build`"] },
  { step: ["test", "測試"], sw: ["unit + integration tests", "單元 + 整合測試"], lean: ["the kernel checks every step; no `sorry`; `#print axioms`", "核心檢查每一步；沒有 `sorry`；`#print axioms`"] },
  { step: ["merge", "合併"], sw: ["join main", "併入 main"], lean: ["join the library", "併入函式庫"] },
  { step: ["deliver", "交付"], sw: ["release, docs, website", "發行版、文件、網站"], lean: ["build cache, docs, blueprint, a tagged version to cite", "建置快取、文件、藍圖、可引用的標記版本"] },
];

/** "Unit tests and CI/CD": what they are, the pipeline for software and for a Lean project, and why the kernel is a stronger test. */
function CiCdExplainer() {
  const { pick } = useLang();
  return (
    <InfoDialog id="cicd" label={["What are unit tests and CI/CD?", "什麼是單元測試與 CI/CD？"]} width="46rem">
      <p>
        <RichText
          text={pick([
            "A **unit test** is a small program that checks one piece of code: given this input, expect that output. An *integration test* checks that the pieces work together. **CI** (continuous integration) runs all the tests automatically on every proposed change, so nothing joins main unchecked. **CD** (continuous delivery) then builds and publishes what passed, such as a release, the documentation or a website, without anyone doing it by hand.",
            "**單元測試**是一段小程式，檢查一小塊程式碼：給這個輸入，就該得到那個輸出。*整合測試*檢查各部分合起來能不能運作。**CI**（持續整合）在每一個提出的改動上自動跑所有測試，所以沒有東西能未經檢查就併入 main。**CD**（持續交付）再把通過的東西建置並發布出去，例如發行版、文件或網站，不需要任何人動手。",
          ])}
        />
      </p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[72px_repeat(5,1fr)] gap-1.5 text-[11px]">
          <span />
          {PIPELINE.map((p, k) => (
            <div key={k} className="relative rounded-md bg-gray-800 px-1 py-1.5 text-center font-semibold text-white">
              {pick(p.step)}
              {k < PIPELINE.length - 1 && <span className="absolute top-1/2 -right-[9px] z-10 -translate-y-1/2 text-gray-400">▶</span>}
            </div>
          ))}
          <span className="self-center font-semibold text-gray-500">{pick(["Software", "軟體"])}</span>
          {PIPELINE.map((p, k) => (
            <div key={k} className="rounded-md bg-gray-50 px-1.5 py-1.5 text-center text-gray-700 ring-1 ring-gray-200">
              {pick(p.sw)}
            </div>
          ))}
          <span className="self-center font-semibold text-(--lk-accent)">Lean</span>
          {PIPELINE.map((p, k) => (
            <div key={k} className={`rounded-md px-1.5 py-1.5 text-center text-gray-800 ring-1 ${k === 2 ? "bg-sky-50 ring-sky-300" : "bg-white ring-teal-200"}`}>
              <RichText text={pick(p.lean)} />
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-gray-500">{pick(["The pipeline runs on every change, for everyone, around the clock.", "這條管線在每一次改動上執行，對每個人都一樣，日夜不停。"])}</p>
      </div>
      <p>
        <RichText
          text={pick([
            "One difference matters. Software tests check *some* inputs, so passing tests make bugs less likely but never rule them out. The Lean kernel checks *every* step, so a green build means the proof is correct, of the statement as written. That is why AI-native mathematics can lean on CI even harder than AI-native programming, and why the human review moves to the statements. Mathlib already works this way: every pull request is built and checked by CI before review, and the compiled library is shared as a cache so nobody rebuilds it from scratch.",
            "有一個差別很重要。軟體測試只檢查*一部分*輸入，所以測試通過只讓錯誤變少，永遠無法排除錯誤。Lean 核心檢查*每一步*，所以建置全綠就代表證明是對的，對寫下來的那個陳述而言。這就是為什麼 AI 原生數學比 AI 原生程式開發更能倚靠 CI，也是為什麼人的審查轉移到陳述上。Mathlib 早就這樣運作：每個 pull request 在審查之前都先由 CI 建置並檢查，編譯好的函式庫以快取共享，沒有人需要從頭重建。",
          ])}
        />
      </p>
    </InfoDialog>
  );
}

const STACKS: { title: L; layers: L[] }[] = [
  { title: ["Python", "Python"], layers: [["your script", "你的程式"], ["NumPy, SciPy (from PyPI, via pip)", "NumPy、SciPy（來自 PyPI，用 pip 安裝）"], ["Python", "Python"]] },
  { title: ["Lean", "Lean"], layers: [["your proof", "你的證明"], ["Mathlib (via Lake; listed on Reservoir)", "Mathlib（用 Lake 取得；列在 Reservoir）"], ["Lean core", "Lean 核心"]] },
];

/** Two dependency stacks side by side: a Python script on NumPy, a Lean proof on Mathlib. */
export function DependencyStacks() {
  const { pick } = useLang();
  return (
    <div className="grid w-full max-w-[560px] grid-cols-2 gap-4 p-1" data-testid="dependency-stacks">
      {STACKS.map((s, k) => (
        <div key={k} className="space-y-1">
          <p className="text-center text-xs font-semibold text-gray-600">{pick(s.title)}</p>
          {s.layers.map((l, j) => (
            <div key={j} className="flex flex-col items-center">
              <div
                className={`w-full rounded-md px-2 py-2 text-center text-xs ring-1 ${
                  j === 0 ? "bg-white ring-gray-300" : j === 1 ? (k === 1 ? "bg-teal-50 ring-teal-300" : "bg-sky-50 ring-sky-300") : "bg-gray-100 ring-gray-300"
                }`}
              >
                {pick(l)}
              </div>
              {j < s.layers.length - 1 && <span className="text-[10px] leading-4 text-gray-400">↓ {pick(["depends on", "依賴"])}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Contributors on their own branches, one fixing a failed check on a local branch; each passes the kernel before it merges into main. Static. */
export function GitFlow() {
  const { pick } = useLang();
  return (
    <div className="w-full max-w-[740px] space-y-2" data-testid="git-flow">
      <div className="flex flex-wrap justify-end gap-2">
        <VersionControlExplainer />
        <CiCdExplainer />
      </div>
      <svg viewBox="0 0 800 340" className="w-full" role="img" aria-label={pick(["Branches merge into main only through the kernel", "分支只能通過核心才能合併進 main"])}>
        {/* main */}
        <line x1={30} x2={780} y1={MAIN_Y} y2={MAIN_Y} className="stroke-gray-900" strokeWidth={3.5} />
        {/* main runs forward in time: an arrowhead at its end */}
        <path d={`M796 ${MAIN_Y} L778 ${MAIN_Y - 9} L778 ${MAIN_Y + 9} Z`} className="fill-gray-900" />
        <text x={24} y={MAIN_Y - 14} fontSize={13} className="fill-emerald-600 font-bold">
          main
        </text>
        {/* lines first, so the circles sit on top */}
        {BRANCHES.map((b, k) => (
          <path key={k} d={branchPath(b)} fill="none" className="stroke-gray-900" strokeWidth={3.5} strokeLinejoin="round" />
        ))}
        {/* merge commits: on main, or back on the branch a local fix came from */}
        <circle cx={60} cy={MAIN_Y} r={12} className="fill-emerald-600 stroke-gray-900" strokeWidth={2.5} />
        {BRANCHES.map((b, k) => (
          <circle key={k} cx={b.merge} cy={b.base} r={12} className={`${b.base === MAIN_Y ? "fill-emerald-600" : b.mergeFill} stroke-gray-900`} strokeWidth={2.5} />
        ))}
        {BRANCHES.map((b, k) => {
          const above = b.y < b.base;
          return (
            <g key={k}>
              <text x={b.fork + 2 * R} y={above ? b.y - 22 : b.y + 32} fontSize={11.5} className="fill-gray-700 font-semibold">
                {pick(b.who)}
              </text>
              {b.items.map((it, j) =>
                it.kind === "commit" ? (
                  <circle key={j} cx={it.x} cy={b.y} r={12} className={`${b.fill} stroke-gray-900`} strokeWidth={2.5} />
                ) : (
                  <g key={j}>
                    <rect
                      x={it.x - 11}
                      y={b.y - 11}
                      width={22}
                      height={22}
                      rx={3}
                      transform={`rotate(45 ${it.x} ${b.y})`}
                      className={`${it.ok ? "fill-sky-100" : "fill-red-50"} stroke-sky-600`}
                      strokeWidth={2}
                    />
                    <text x={it.x} y={b.y + 4.5} textAnchor="middle" fontSize={12} className={it.ok ? "fill-emerald-700 font-bold" : "fill-red-600 font-bold"}>
                      {it.ok ? "✓" : "✗"}
                    </text>
                    {/* on the main side of the lane, where there is room */}
                    {!it.ok && (
                      <text x={it.x} y={above ? b.y + 34 : b.y - 24} textAnchor="middle" fontSize={10} className="fill-red-600">
                        {pick(["rejected", "被拒絕"])}
                      </text>
                    )}
                  </g>
                ),
              )}
            </g>
          );
        })}
        <g fontSize={10.5}>
          <rect x={652} y={316} width={13} height={13} rx={2} transform="rotate(45 658.5 322.5)" className="fill-sky-100 stroke-sky-600" strokeWidth={1.5} />
          <text x={674} y={326} className="fill-gray-600">
            {pick(["the kernel (CI)", "核心（CI）"])}
          </text>
        </g>
      </svg>
      <p className="text-center text-[11px] text-gray-500">
        {pick([
          "Nobody here needs to know, meet or trust anyone else, or be awake at the same hour. The gate is the same for everyone.",
          "這裡沒有人需要認識、見過或信任其他人，也不必在同一個時段醒著。關卡對每個人都一樣。",
        ])}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ TDD cycle

const TDD: { cls: string; code: L; math: L }[] = [
  {
    cls: "fill-red-100 stroke-red-500",
    code: ["Red: write a failing test", "紅：先寫一個會失敗的測試"],
    math: ["Red: state the theorem, proof `sorry`", "紅：寫下定理，證明是 `sorry`"],
  },
  {
    cls: "fill-emerald-100 stroke-emerald-600",
    code: ["Green: make it pass", "綠：讓測試通過"],
    math: ["Green: the kernel accepts, no `sorry`", "綠：核心接受，沒有 `sorry`"],
  },
  {
    cls: "fill-sky-100 stroke-sky-500",
    code: ["Refactor: clean up, tests still pass", "重構：整理程式碼，測試仍通過"],
    math: ["Refactor: shorter proof, same statement", "重構：證明更短，陳述不變"],
  },
];

/** Test-driven development's loop, labelled for code or for Lean mathematics. */
export function TddCycle() {
  const { pick } = useLang();
  const [math, setMath] = useState(true);
  const pts = [
    { x: 210, y: 44 },
    { x: 298, y: 197 },
    { x: 122, y: 197 },
  ];
  return (
    <div className="flex w-full max-w-[460px] flex-col items-center gap-2" data-testid="tdd-cycle">
      <div role="tablist" className="flex rounded-full bg-white p-1 text-xs ring-1 ring-gray-200">
        {[false, true].map((m) => (
          <button
            key={String(m)}
            role="tab"
            aria-selected={math === m}
            onClick={() => setMath(m)}
            className={`rounded-full px-3 py-1 ${math === m ? "bg-(--lk-accent) text-white" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {pick(m ? ["Mathematics (Lean)", "數學（Lean）"] : ["Code", "程式"])}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 420 250" className="w-full" role="img" aria-label="red, green, refactor">
        {/* the loop: a circle through the three boxes, an arrowhead midway between each pair (clockwise) */}
        <circle cx={210} cy={146} r={102} fill="none" className="stroke-gray-300" strokeWidth={2} />
        {[-30, 90, 210].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const x = 210 + 102 * Math.cos(a);
          const y = 146 + 102 * Math.sin(a);
          return <polygon key={deg} points="-6,-5 6,0 -6,5" transform={`translate(${x} ${y}) rotate(${deg + 90})`} className="fill-gray-500" />;
        })}
        {TDD.map((s, k) => (
          <g key={k} transform={`translate(${pts[k].x} ${pts[k].y})`}>
            <rect x={-76} y={-24} width={152} height={48} rx={10} className={s.cls} strokeWidth={1.5} />
            <foreignObject x={-72} y={-21} width={144} height={42}>
              <div className="flex h-full items-center justify-center text-center text-[11px] leading-tight text-gray-800">
                <RichText text={pick(math ? s.math : s.code)} />
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ three eras

const ERAS: { chip: L; dev: L[]; math: L[] }[] = [
  {
    chip: ["Hand-crafted", "手工"],
    dev: [
      ["The developer writes every line.", "開發者寫每一行。"],
      ["Tests are a discipline many skip: the author knows the code.", "測試是許多人略過的紀律：作者自己認得程式碼。"],
      ["Trust comes from the author.", "信任來自作者。"],
    ],
    math: [
      ["The mathematician writes every line.", "數學家寫每一行。"],
      ["A machine check is not even possible: the author understood each step.", "連機器檢查都不可能：作者理解每一步。"],
      ["Trust comes from the author and the referees.", "信任來自作者與審稿人。"],
    ],
  },
  {
    chip: ["Tooled", "工具化"],
    dev: [
      ["Version control, tests, continuous integration, code review.", "版本控制、測試、持續整合、程式碼審查。"],
      ["Teams of hundreds work on one codebase.", "數百人的團隊共用一份程式碼。"],
      ["Trust comes from the tests and the review.", "信任來自測試與審查。"],
    ],
    math: [
      ["Computer algebra; machine-checked landmarks (four colours, Kepler); Mathlib.", "電腦代數；機器檢查的里程碑（四色、Kepler）；Mathlib。"],
      ["Formalization mostly *after* the paper, by specialists.", "形式化多半在論文*之後*，由專家來做。"],
      ["Trust still comes mainly from the referees.", "信任仍主要來自審稿人。"],
    ],
  },
  {
    chip: ["AI-native", "AI 原生"],
    dev: [
      ["Agents write most of the code; people specify, design and review.", "代理寫大部分程式；人負責規格、設計與審查。"],
      ["Nobody reads every generated line, so specs, tests and CI are no longer optional.", "沒有人會讀每一行生成的程式碼，所以規格、測試與 CI 不再是可有可無。"],
      ["Trust comes from the tests, so engineering practice decides quality.", "信任來自測試，所以工程實踐決定品質。"],
    ],
    math: [
      ["Agents write most of the proof; people choose, state, plan and judge.", "代理寫大部分證明；人負責選題、陳述、規劃與評判。"],
      ["Nobody reads 17 million lines, so the formal statement and the kernel are no longer optional.", "沒有人會讀 1700 萬行，所以形式化陳述與核心不再是可有可無。"],
      ["Trust comes from the kernel and the statement review: mathematics engineering.", "信任來自核心與陳述審查：數學工程。"],
    ],
  },
];

/** Developer and mathematician, side by side, in three eras. */
export function Eras() {
  const { pick } = useLang();
  const [i, setI] = useState(2);
  const e = ERAS[i];
  const col = (title: L, items: L[], cls: string) => (
    <div className={`rounded-md bg-white p-3 ring-1 ${cls}`}>
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(title)}</p>
      <ul className="space-y-1 text-sm text-gray-800">
        {items.map((t, k) => (
          <li key={k} className="flex gap-1.5">
            <span className="text-gray-400">{["✎", "⚙", "✓"][k]}</span>
            <RichText text={pick(t)} />
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="w-full max-w-[680px] p-1" data-testid="eras">
      <StepChips labels={ERAS.map((x, k) => `${k + 1} · ${pick(x.chip)}`)} i={i} setI={setI} />
      <div className="grid gap-2 sm:grid-cols-2">
        {col(["Developer", "開發者"], e.dev, "ring-gray-200")}
        {col(["Mathematician", "數學家"], e.math, i === 2 ? "ring-teal-300" : "ring-gray-200")}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ reading budget

const EDITIONS: { label: L; lines: number }[] = [
  { label: ["RH, original (20 Nov)", "RH 原版（11/20）"], lines: 17_374_215 },
  { label: ["RH, readable edition (25 Nov)", "RH 可讀版（11/25）"], lines: 477_124 },
  { label: ["RH, compact edition (25 Nov)", "RH 精簡版（11/25）"], lines: 112_827 },
];
const RATES = [5, 10, 30];
const HOURS_PER_YEAR = 1_800;

/** Line-by-line reading time at a chosen speed, per edition, on a log scale; assumptions on screen. */
export function ReadingBudget() {
  const { pick } = useLang();
  const [rate, setRate] = useState(10);
  const hours = (lines: number) => lines / rate / 60;
  const max = Math.log10(hours(EDITIONS[0].lines) * 1.2);
  const min = Math.log10(1);
  const fmt = (h: number) =>
    h >= HOURS_PER_YEAR
      ? pick([`${(h / HOURS_PER_YEAR).toFixed(1)} working years`, `${(h / HOURS_PER_YEAR).toFixed(1)} 個工作年`])
      : h >= 40
        ? pick([`${Math.round(h / 40)} working weeks`, `${Math.round(h / 40)} 個工作週`])
        : pick([`${Math.round(h)} hours`, `${Math.round(h)} 小時`]);
  return (
    <div className="w-full max-w-[640px] space-y-3" data-testid="reading-budget">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-600">{pick(["A careful reader checks", "一位仔細的讀者每分鐘檢查"])}</span>
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => setRate(r)}
            aria-pressed={rate === r}
            className={`rounded-full px-2.5 py-0.5 ${rate === r ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {r}
          </button>
        ))}
        <span className="text-gray-600">{pick(["lines a minute", "行"])}</span>
      </div>
      <div className="space-y-2">
        {EDITIONS.map((e) => {
          const h = hours(e.lines);
          const w = Math.max(2, ((Math.log10(Math.max(h, 1)) - min) / (max - min)) * 100);
          return (
            <div key={e.lines}>
              <div className="flex justify-between text-xs text-gray-700">
                <span>
                  {pick(e.label)} · <span className="font-mono">{e.lines.toLocaleString("en-US")}</span> {pick(["lines", "行"])}
                </span>
                <span className="font-semibold">{fmt(h)}</span>
              </div>
              <div className="mt-0.5 h-3 rounded bg-gray-200">
                <div className="h-3 rounded bg-amber-400 motion-safe:transition-[width]" style={{ width: `${w}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-500">
        {pick([
          `Log scale. Assumptions, not measurements: one reader, ${HOURS_PER_YEAR.toLocaleString("en-US")} working hours a year, reading only (no thinking, no backtracking). Line counts are whole files, as on the RH page.`,
          `對數刻度。這是假設，不是測量：一位讀者、一年 ${HOURS_PER_YEAR.toLocaleString("en-US")} 個工作小時、只讀不想也不回頭。行數是整個檔案的行數，與 RH 頁相同。`,
        ])}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Go and mathematics

const GO: { year: string; go?: L; maths?: L }[] = [
  { year: "2016", go: ["AlphaGo beats Lee Sedol, 4–1.", "AlphaGo 以 4:1 擊敗李世乭。"] },
  { year: "2017", go: ["AlphaGo Zero learns from self-play alone.", "AlphaGo Zero 只靠自我對弈學會下棋。"] },
  {
    year: "2016–21",
    go: [
      "Professionals study with engines; their move quality rises and their moves get more novel (5.8 million moves, 1950–2021).",
      "職業棋手跟著引擎研究；他們的棋步品質提升，也更有新意（1950–2021 年的 580 萬手棋）。",
    ],
  },
  { year: "2022", maths: ["The Liquid Tensor Experiment is complete in Lean.", "液態張量實驗在 Lean 中完成。"] },
  { year: "2025", maths: ["The Equational Theories Project settles 22 million implications in Lean.", "方程理論計畫在 Lean 中解決 2200 萬條蘊涵。"] },
  {
    year: "Nov 2026",
    maths: [
      "A Lean proof of RH, with Claude; a crowd formalizes a 940-page draft in days; Terence Tao lists a claimed Navier–Stokes blowup with a Lean formalization, its professional write-up still owed.",
      "與 Claude 合作的 RH Lean 證明；群眾幾天內形式化一份 940 頁的草稿；陶哲軒列出一個宣稱的 Navier–Stokes 爆破，已有 Lean 形式化，但正式寫成的證明還欠著。",
    ],
  },
  { year: "next", maths: ["Training and daily work change, as they did in Go.", "訓練與日常工作改變，就像圍棋那樣。"] },
];

/** Go since AlphaGo beside mathematics since Lean: two lanes on one time axis. */
export function GoTimeline() {
  const { pick } = useLang();
  return (
    <div className="w-full max-w-[640px]" data-testid="go-timeline">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 text-xs">
        <p className="pb-2 text-right font-semibold text-gray-700">{pick(["Go", "圍棋"])}</p>
        <span />
        <p className="pb-2 font-semibold text-gray-700">{pick(["Mathematics", "數學"])}</p>
        {GO.map((r) => (
          <div key={r.year} className="contents">
            <div className="pb-3 text-right text-gray-700">{r.go && <RichText text={pick(r.go)} />}</div>
            <div className="relative flex flex-col items-center">
              <span className={`z-10 rounded-full px-2 py-0.5 font-mono text-[10px] ${r.year === "next" ? "bg-white text-gray-500 ring-1 ring-dashed ring-gray-300" : "bg-gray-800 text-white"}`}>
                {r.year === "next" ? pick(["next", "接下來"]) : r.year}
              </span>
              <span className="absolute top-4 bottom-0 w-px bg-gray-300" />
            </div>
            <div className="pb-3 text-gray-700">{r.maths && <RichText text={pick(r.maths)} />}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ taste funnel

const GATES: { label: L; who: Who; w: number; q: L }[] = [
  { label: ["what machines can produce", "機器能產出的"], who: "ai", w: 560, q: ["Proofs, lemmas, conjectures, counterexamples: more every year.", "證明、引理、猜想、反例：一年比一年多。"] },
  { label: ["is it correct?", "對嗎？"], who: "machine", w: 440, q: ["The kernel answers, cheaply and completely.", "核心來回答，便宜又完整。"] },
  { label: ["is it the right statement?", "陳述對嗎？"], who: "human", w: 330, q: ["Definitions, axioms, the spec: people, with AI's help.", "定義、公理、規格：由人來判斷，AI 協助。"] },
  { label: ["does it matter? is there an idea?", "重要嗎？有新想法嗎？"], who: "human", w: 220, q: ["Taste: what to ask next, what to keep, what to explain.", "品味：下一步問什麼、留下什麼、解釋什麼。"] },
  { label: ["mathematics people use", "人們使用的數學"], who: "human", w: 130, q: ["Understood, taught, built on.", "被理解、被教授、被延伸。"] },
];

/** The cheaper the first gate, the more the last gates matter, and those are people's. */
export function TasteFunnel() {
  const { pick } = useLang();
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="w-full max-w-[600px] space-y-2" data-testid="taste-funnel">
      <svg viewBox="0 0 600 250" className="w-full" role="img" aria-label={pick(["From machine output to mathematics: the gates", "從機器產出到數學：一道道關卡"])}>
        {GATES.map((g, k) => {
          const y = 8 + k * 48;
          const next = GATES[k + 1]?.w ?? g.w * 0.8;
          const x0 = (600 - g.w) / 2;
          const x1 = (600 - next) / 2;
          const fill = g.who === "ai" ? "fill-violet-100" : g.who === "machine" ? "fill-sky-100" : "fill-teal-100";
          return (
            <g key={k} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} onClick={() => setHover(k)} className="cursor-pointer">
              <path d={`M${x0} ${y} H${x0 + g.w} L${x1 + next} ${y + 42} H${x1} Z`} className={`${fill} ${hover === k ? "stroke-gray-700" : "stroke-white"}`} strokeWidth={1.5} />
              <text x={300} y={y + 25} textAnchor="middle" fontSize={11.5} className="fill-gray-800">
                {pick(g.label)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="min-h-[1.5rem] text-center text-xs text-gray-700">
        {hover === null ? pick(["Hover or tap a layer.", "滑過或點一層看看。"]) : pick(GATES[hover].q)}
      </p>
      <WhoLegend />
    </div>
  );
}
