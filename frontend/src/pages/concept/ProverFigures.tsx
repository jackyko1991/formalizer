/**
 * Concept ▸ AI provers: the pictures that open the black box (the Feynman way: draw what really happens).
 *   ProposeCheck    the one loop under every system: a model proposes Lean, the kernel decides
 *   ProverSpectrum  from Lean's own search to research-level claims: how much the AI does, and what checks it
 *   DivideConquer   a stepper: informal draft → a sketch of `sorry`s → provers fill each hole (a hard one is split
 *                   again) → all proved. Draft, Sketch, and Prove (2022) and DeepSeek-Prover-V2's subgoal pipeline
 *   SearchStrategies  many whole proofs vs a tree of tactic steps
 *   LearningLoop    why mathematics suits AI: Lean's verdict is an exact reward to learn from (AlphaProof's loop)
 * Labels are [English, Traditional Chinese]; colours follow the site: amber = open (`sorry`), green = proved.
 */
import { useLang } from "@learnkit/web";
import { useState } from "react";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Arrow({
  x1,
  y1,
  x2,
  y2,
  dashed = false,
  cls = "stroke-gray-400",
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  cls?: string;
}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number) => `${x2 - 8 * Math.cos(a + d)},${y2 - 8 * Math.sin(a + d)}`;
  return (
    <g className={cls}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.6} strokeDasharray={dashed ? "5 4" : undefined} />
      <polygon points={`${x2},${y2} ${h(0.45)} ${h(-0.45)}`} className={cls.replace("stroke-", "fill-")} />
    </g>
  );
}

/** Every AI prover, inside: propose → Lean checks → accepted, or the error goes back as the next hint. */
export function ProposeCheck() {
  const { pick } = useLang();
  return (
    <svg
      viewBox="0 0 640 230"
      className="w-full max-w-[640px]"
      role="img"
      aria-label={pick(["A model proposes, Lean checks", "模型提議，Lean 檢查"])}
    >
      <rect x={20} y={70} width={170} height={70} rx={10} className="fill-violet-50 stroke-violet-400" />
      <text x={105} y={98} textAnchor="middle" fontSize={14} className="fill-violet-900 font-semibold">
        {pick(["Language model", "語言模型"])}
      </text>
      <text x={105} y={120} textAnchor="middle" fontSize={11} className="fill-violet-800">
        {pick(["guesses: fast, fallible", "負責猜：快，但會錯"])}
      </text>
      <rect x={250} y={88} width={130} height={34} rx={6} className="fill-white stroke-gray-400" />
      <text x={315} y={110} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
        by induction n …
      </text>
      <Arrow x1={190} y1={105} x2={246} y2={105} />
      <Arrow x1={380} y1={105} x2={436} y2={105} />
      <rect x={440} y={70} width={170} height={70} rx={10} className="fill-teal-50 stroke-teal-600" />
      <text x={525} y={98} textAnchor="middle" fontSize={14} className="fill-teal-900 font-semibold">
        {pick(["Lean's kernel", "Lean 的核心"])}
      </text>
      <text x={525} y={120} textAnchor="middle" fontSize={11} className="fill-teal-800">
        {pick(["checks: slow to fool, never guesses", "負責檢查：騙不過，從不猜"])}
      </text>
      {/* accepted */}
      <Arrow x1={525} y1={140} x2={525} y2={180} cls="stroke-emerald-600" />
      <rect x={455} y={184} width={140} height={30} rx={15} className="fill-emerald-50 stroke-emerald-500" />
      <text x={525} y={204} textAnchor="middle" fontSize={12} className="fill-emerald-800">
        ✓ {pick(["a proof anyone can recheck", "任何人都能重驗的證明"])}
      </text>
      {/* rejected: the message goes back */}
      <path d="M525 70 C525 20, 105 20, 105 66" fill="none" strokeWidth={1.6} strokeDasharray="5 4" className="stroke-red-400" />
      <polygon points="105,70 100,60 110,60" className="fill-red-400" />
      <rect x={230} y={14} width={180} height={26} rx={13} className="fill-red-50 stroke-red-300" />
      <text x={320} y={31} textAnchor="middle" fontSize={11} className="fill-red-800">
        ✖ {pick(["error + goal → try again", "錯誤訊息 + 目標 → 再試"])}
      </text>
    </svg>
  );
}

const SPECTRUM: { name: L; who: string | L; does: L; cls: string }[] = [
  {
    name: ["Lean's own search", "Lean 自己的搜尋"],
    who: "exact?  simp?",
    does: ["looks up one library lemma", "在函式庫找一條引理"],
    cls: "fill-gray-50 stroke-gray-400",
  },
  {
    name: ["Next-step helpers", "下一步助手"],
    who: "Lean Copilot · LLMLean",
    does: ["suggest the next tactic", "建議下一個戰術"],
    cls: "fill-sky-50 stroke-sky-400",
  },
  {
    name: ["Whole-proof provers", "整份證明的證明器"],
    who: "DeepSeek-Prover · Goedel-Prover",
    does: ["write a whole proof, many tries", "寫出整份證明，多次嘗試"],
    cls: "fill-violet-50 stroke-violet-400",
  },
  {
    name: ["Search + learning systems", "搜尋 + 學習系統"],
    who: "AlphaProof · Seed-Prover · Aristotle",
    does: ["plan lemmas, search, learn from Lean", "規劃引理、搜尋、從 Lean 學習"],
    cls: "fill-amber-50 stroke-amber-500",
  },
  {
    name: ["Research claims", "研究級宣稱"],
    who: ["2026: a Riemann claim, under review", "2026：黎曼猜想的宣稱，審查中"],
    does: ["open problems, with experts", "與專家合作攻開放問題"],
    cls: "fill-rose-50 stroke-rose-400",
  },
];

/** From Lean's own search to research claims: the AI does more and more, and Lean's kernel checks every one. */
export function ProverSpectrum() {
  const { pick } = useLang();
  const w = 124;
  return (
    <svg
      viewBox="0 0 660 250"
      className="w-full max-w-[660px]"
      role="img"
      aria-label={pick(["The range of AI provers", "AI 證明器的光譜"])}
    >
      <Arrow x1={14} y1={22} x2={646} y2={22} cls="stroke-gray-500" />
      <text x={14} y={14} fontSize={11} className="fill-gray-500">
        {pick(["the AI does a little", "AI 做得少"])}
      </text>
      <text x={646} y={14} textAnchor="end" fontSize={11} className="fill-gray-500">
        {pick(["the AI does a lot", "AI 做得多"])}
      </text>
      {SPECTRUM.map((s, i) => {
        const x = 10 + i * (w + 6);
        return (
          <g key={i}>
            <rect x={x} y={38} width={w} height={130} rx={8} className={s.cls} />
            <foreignObject x={x + 6} y={44} width={w - 12} height={120}>
              <div style={{ fontSize: 12, lineHeight: 1.3 }} className="text-gray-800">
                <div style={{ fontWeight: 600 }}>{pick(s.name)}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, marginTop: 4 }} className="text-gray-600">
                  {typeof s.who === "string" ? s.who : pick(s.who)}
                </div>
                <div style={{ marginTop: 6, fontSize: 11 }} className="text-gray-700">
                  {pick(s.does)}
                </div>
              </div>
            </foreignObject>
            <line x1={x + w / 2} y1={168} x2={x + w / 2} y2={196} strokeWidth={1.5} className="stroke-teal-500" />
          </g>
        );
      })}
      <rect x={10} y={196} width={640} height={36} rx={8} className="fill-teal-600" />
      <text x={330} y={219} textAnchor="middle" fontSize={13} className="fill-white font-semibold">
        {pick(["The same small kernel checks every one of them", "每一個都由同一個小小的核心檢查"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ divide and conquer

type St = "open" | "work" | "done" | "fail" | "none";
interface Stage {
  title: L;
  text: L;
  nodes: Record<"main" | "h1" | "h2" | "h3" | "h2a" | "h2b", St>;
  lean: string;
}
const STAGES: Stage[] = [
  {
    title: ["1 · Draft in words", "1 · 先用文字打草稿"],
    text: [
      "A large model first writes the proof the way a person would on paper: the idea and its steps, no Lean yet. This is the part language models are best at, and where they also make mistakes.",
      "大模型先像人在紙上那樣寫出證明：想法與步驟，還沒有 Lean。這是語言模型最擅長的部分，也是它們會犯錯的地方。",
    ],
    nodes: { main: "open", h1: "none", h2: "none", h3: "none", h2a: "none", h2b: "none" },
    lean: "-- 1. reduce to the case n ≥ 1\n-- 2. bound each term by the previous one\n-- 3. sum the bounds",
  },
  {
    title: ["2 · A sketch made of sorrys", "2 · 用 sorry 搭出骨架"],
    text: [
      "Each step of the draft becomes a `have … := by sorry` in Lean, and the main proof is assembled from them. Lean checks the sketch at once: it must say *incomplete* (holes left), never *error* (a step that doesn't fit). The hard proof is now three smaller ones.",
      "草稿的每一步變成 Lean 裡的 `have … := by sorry`，主證明由它們組成。Lean 立刻檢查這個骨架：它必須是 *未完成*（還有洞），而不能是 *錯誤*（某一步接不上）。一個困難的證明，變成三個比較小的。",
    ],
    nodes: { main: "open", h1: "open", h2: "open", h3: "open", h2a: "none", h2b: "none" },
    lean: "theorem t : P := by\n  have h1 : A := by sorry\n  have h2 : B := by sorry\n  have h3 : C := by sorry\n  exact combine h1 h2 h3",
  },
  {
    title: ["3 · Fill each hole, in parallel", "3 · 同時填每一個洞"],
    text: [
      "Each `sorry` is now a small, separate goal, sent to a prover (often a smaller, faster model) with many tries each. Lean checks every attempt. Here `h1` and `h3` close; `h2` resists.",
      "每個 `sorry` 都是一個獨立的小目標，交給證明器（常是較小、較快的模型），各自嘗試很多次。Lean 檢查每一次嘗試。這裡 `h1` 與 `h3` 完成了；`h2` 還攻不下。",
    ],
    nodes: { main: "open", h1: "done", h2: "fail", h3: "done", h2a: "none", h2b: "none" },
    lean: "  have h1 : A := by omega          -- ✓\n  have h2 : B := by sorry          -- ✖ no try worked\n  have h3 : C := by simp [h1]      -- ✓",
  },
  {
    title: ["4 · Split the hard one again", "4 · 把難的那個再拆開"],
    text: [
      "A hole that resists is decomposed the same way: a smaller sketch for `h2` alone. This is recursion, exactly like a mathematician splitting a lemma, and it is what DeepSeek-Prover-V2's training pipeline does with its large model.",
      "攻不下的洞用同樣的方法拆開：只為 `h2` 再搭一個小骨架。這就是遞迴，和數學家把引理拆小一模一樣；DeepSeek-Prover-V2 的訓練流程正是讓大模型這樣做。",
    ],
    nodes: { main: "open", h1: "done", h2: "work", h3: "done", h2a: "done", h2b: "done" },
    lean: "  have h2 : B := by\n    have h2a : B₁ := by linarith   -- ✓\n    have h2b : B₂ := by exact foo  -- ✓\n    exact h2a.trans h2b",
  },
  {
    title: ["5 · No sorry left: proved", "5 · 沒有 sorry：證明完成"],
    text: [
      "When no `sorry` is left, Lean checks the whole proof once more, and `#print axioms` shows only the standard three. Nothing in the result depends on trusting the model: it could have guessed wildly; only what Lean accepted remains.",
      "當沒有任何 `sorry`，Lean 再檢查一次整個證明，`#print axioms` 只列出標準的三個。結果完全不需要相信模型：它可以亂猜；留下來的只有 Lean 接受的部分。",
    ],
    nodes: { main: "done", h1: "done", h2: "done", h3: "done", h2a: "done", h2b: "done" },
    lean: "theorem t : P := by …   -- ✓ proved\n#print axioms t\n-- propext, Quot.sound, Classical.choice",
  },
];
const NODE: Record<Exclude<St, "none">, { cls: string; mark: string }> = {
  open: { cls: "fill-amber-50 stroke-amber-500", mark: "◐" },
  work: { cls: "fill-sky-50 stroke-sky-500", mark: "↻" },
  done: { cls: "fill-emerald-50 stroke-emerald-500", mark: "✓" },
  fail: { cls: "fill-red-50 stroke-red-400", mark: "✖" },
};

/** The divide-and-conquer strategy, step by step: draft → sketch of sorrys → fill each → split the hard one → done. */
export function DivideConquer() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const s = STAGES[i];
  const pos: Record<keyof Stage["nodes"], [number, number, string]> = {
    main: [150, 34, "t : P"],
    h1: [50, 110, "h1 : A"],
    h2: [150, 110, "h2 : B"],
    h3: [250, 110, "h3 : C"],
    h2a: [105, 186, "h2a"],
    h2b: [195, 186, "h2b"],
  };
  const edges: [keyof Stage["nodes"], keyof Stage["nodes"]][] = [
    ["main", "h1"],
    ["main", "h2"],
    ["main", "h3"],
    ["h2", "h2a"],
    ["h2", "h2b"],
  ];
  return (
    <div className="w-full" data-testid="divide-conquer">
      <div className="mb-3 flex flex-wrap gap-1">
        {STAGES.map((st, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            aria-pressed={k === i}
            className={`rounded-full px-3 py-1 text-xs ${k === i ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {pick(st.title)}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        <svg viewBox="0 0 300 220" className="w-full max-w-[300px]" role="img" aria-label={pick(s.title)}>
          {edges.map(([a, b]) =>
            s.nodes[b] === "none" ? null : (
              <line
                key={b}
                x1={pos[a][0]}
                y1={pos[a][1] + 16}
                x2={pos[b][0]}
                y2={pos[b][1] - 16}
                strokeWidth={1.5}
                className="stroke-gray-300"
              />
            ),
          )}
          {(Object.keys(pos) as (keyof Stage["nodes"])[]).map((k) => {
            const st = s.nodes[k];
            if (st === "none") return null;
            const [x, y, label] = pos[k];
            return (
              <g key={k} style={{ transition: "opacity 300ms" }}>
                <rect x={x - 44} y={y - 16} width={88} height={32} rx={8} className={NODE[st].cls} strokeWidth={1.6} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
                  {NODE[st].mark} {label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="min-w-0 space-y-2">
          <p className="text-sm leading-relaxed text-gray-700">
            {pick(s.text)
              .split(/(`[^`]+`|\*[^*]+\*)/)
              .map((part, k) =>
                part.startsWith("`") ? (
                  <code key={k} className="rounded bg-gray-100 px-1 text-[0.9em]">
                    {part.slice(1, -1)}
                  </code>
                ) : part.startsWith("*") ? (
                  <em key={k}>{part.slice(1, -1)}</em>
                ) : (
                  part
                ),
              )}
          </p>
          <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-[12px] leading-relaxed text-gray-100">{s.lean}</pre>
          <div className="flex gap-2">
            <button
              onClick={() => setI((k) => Math.max(0, k - 1))}
              disabled={i === 0}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs disabled:opacity-40"
            >
              ◂ {pick(["Back", "上一步"])}
            </button>
            <button
              onClick={() => setI((k) => Math.min(STAGES.length - 1, k + 1))}
              disabled={i === STAGES.length - 1}
              className="rounded-md bg-(--lk-accent) px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
              data-testid="divide-next"
            >
              {pick(["Next step", "下一步"])} ▸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Two ways to search: many whole proofs at once, or a tree of single tactic steps. */
export function SearchStrategies() {
  const { pick } = useLang();
  const tries = [0, 1, 2, 3, 4, 5, 6, 7];
  const tree: { x: number; y: number; s: "ok" | "dead" | "open" | "goal" }[] = [
    { x: 470, y: 50, s: "open" },
    { x: 410, y: 110, s: "dead" },
    { x: 470, y: 110, s: "open" },
    { x: 530, y: 110, s: "dead" },
    { x: 440, y: 170, s: "dead" },
    { x: 500, y: 170, s: "goal" },
  ];
  const links: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 4],
    [2, 5],
  ];
  const fill = {
    ok: "fill-emerald-50 stroke-emerald-500",
    dead: "fill-red-50 stroke-red-300",
    open: "fill-amber-50 stroke-amber-500",
    goal: "fill-emerald-100 stroke-emerald-600",
  };
  return (
    <svg viewBox="0 0 640 250" className="w-full max-w-[640px]" role="img" aria-label={pick(["Two ways to search", "兩種搜尋方式"])}>
      <text x={150} y={20} textAnchor="middle" fontSize={13} className="fill-gray-900 font-semibold">
        {pick(["Many whole proofs", "大量整份證明"])}
      </text>
      {tries.map((k) => (
        <g key={k}>
          <rect
            x={30 + (k % 4) * 62}
            y={40 + Math.floor(k / 4) * 70}
            width={52}
            height={56}
            rx={6}
            className={k === 5 ? fill.ok : "fill-white stroke-gray-300"}
          />
          {[0, 1, 2, 3].map((l) => (
            <line
              key={l}
              x1={36 + (k % 4) * 62}
              x2={(l === 3 ? 60 : 76) + (k % 4) * 62}
              y1={52 + l * 11 + Math.floor(k / 4) * 70}
              y2={52 + l * 11 + Math.floor(k / 4) * 70}
              strokeWidth={2}
              className={k === 5 ? "stroke-emerald-400" : "stroke-gray-200"}
            />
          ))}
          <text
            x={74 + (k % 4) * 62}
            y={92 + Math.floor(k / 4) * 70}
            textAnchor="end"
            fontSize={10}
            className={k === 5 ? "fill-emerald-700" : "fill-red-400"}
          >
            {k === 5 ? "✓" : "✖"}
          </text>
        </g>
      ))}
      <text x={150} y={205} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["write the whole proof many times;", "把整份證明寫很多次；"])}
      </text>
      <text x={150} y={221} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["keep one Lean accepts (“pass@k”)", "留下 Lean 接受的那一份（「pass@k」）"])}
      </text>
      <line x1={320} y1={30} x2={320} y2={230} className="stroke-gray-200" />
      <text x={470} y={20} textAnchor="middle" fontSize={13} className="fill-gray-900 font-semibold">
        {pick(["A tree of tactic steps", "一棵戰術步驟樹"])}
      </text>
      {links.map(([a, b]) => (
        <line
          key={b}
          x1={tree[a].x}
          y1={tree[a].y + 12}
          x2={tree[b].x}
          y2={tree[b].y - 12}
          strokeWidth={1.5}
          className={tree[b].s === "dead" ? "stroke-red-200" : "stroke-emerald-400"}
        />
      ))}
      {tree.map((n, k) => (
        <g key={k}>
          <circle cx={n.x} cy={n.y} r={12} className={fill[n.s]} strokeWidth={1.6} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={10} className="fill-gray-700">
            {n.s === "dead" ? "✖" : n.s === "goal" ? "✓" : "⊢"}
          </text>
        </g>
      ))}
      <text x={470} y={205} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["each node is a goal; Lean runs one tactic;", "每個節點是一個目標；Lean 執行一個戰術；"])}
      </text>
      <text x={470} y={221} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["the model says which branch looks promising", "模型判斷哪個分支比較有希望"])}
      </text>
    </svg>
  );
}

/** Why mathematics suits AI: Lean's verdict is an exact, free reward, so a prover can practise on its own. */
export function LearningLoop() {
  const { pick } = useLang();
  const boxes: { x: number; y: number; t: L; sub: L; cls: string }[] = [
    {
      x: 20,
      y: 40,
      t: ["Problems", "題目"],
      sub: ["informal ones turned formal", "把非形式題目轉成形式化"],
      cls: "fill-gray-50 stroke-gray-400",
    },
    {
      x: 230,
      y: 40,
      t: ["The model tries", "模型嘗試"],
      sub: ["many attempts each", "每題嘗試很多次"],
      cls: "fill-violet-50 stroke-violet-400",
    },
    { x: 440, y: 40, t: ["Lean checks", "Lean 檢查"], sub: ["✓ or ✖, exactly", "✓ 或 ✖，毫不含糊"], cls: "fill-teal-50 stroke-teal-600" },
    {
      x: 230,
      y: 160,
      t: ["It learns", "從中學習"],
      sub: ["from the proofs Lean accepted", "從 Lean 接受的證明"],
      cls: "fill-emerald-50 stroke-emerald-500",
    },
  ];
  return (
    <svg viewBox="0 0 640 240" className="w-full max-w-[640px]" role="img" aria-label={pick(["The learning loop", "學習迴圈"])}>
      {boxes.map((b) => (
        <g key={b.x + b.y}>
          <rect x={b.x} y={b.y} width={180} height={60} rx={10} className={b.cls} />
          <text x={b.x + 90} y={b.y + 26} textAnchor="middle" fontSize={14} className="fill-gray-900 font-semibold">
            {pick(b.t)}
          </text>
          <text x={b.x + 90} y={b.y + 46} textAnchor="middle" fontSize={11} className="fill-gray-600">
            {pick(b.sub)}
          </text>
        </g>
      ))}
      <Arrow x1={200} y1={70} x2={226} y2={70} />
      <Arrow x1={410} y1={70} x2={436} y2={70} />
      <path d="M530 100 C530 190, 440 190, 414 190" fill="none" strokeWidth={1.6} className="stroke-emerald-500" />
      <polygon points="410,190 419,185 419,195" className="fill-emerald-500" />
      <path d="M230 190 C120 190, 110 140, 110 104" fill="none" strokeWidth={1.6} className="stroke-emerald-500" />
      <polygon points="110,100 105,110 115,110" className="fill-emerald-500" />
      <text x={545} y={150} fontSize={11} className="fill-emerald-700">
        {pick(["a reward", "獎勵"])}
      </text>
      <text x={20} y={150} fontSize={11} className="fill-emerald-700">
        {pick(["harder problems", "更難的題目"])}
      </text>
      <text x={320} y={20} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick(["no human grader needed: the checker never tires and cannot be talked round", "不需要人來改：檢查器不會累，也說服不了"])}
      </text>
    </svg>
  );
}
