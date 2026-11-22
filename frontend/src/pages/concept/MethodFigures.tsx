/**
 * Concept ▸ From statement to proof: pictures for the method (the Feynman way: picture first, then the code).
 *   GaussRectangle   two staircases of dots fill an n × (n + 1) rectangle: why 2 · sumTo n = n · (n + 1)
 *   TheoremAnatomy   the parts of one theorem line: name, input, statement (fixed), proof (yours)
 *   PlanStepper      the goals as a checklist, version by version: 1 → 2 → 4 → 2 → 0 sorrys
 *   ComparatorFlow   challenge + solution + config → sandboxed checks → pass; the one check it can't do
 *   TwoStreams       one proof, two languages: natural-language steps ↔ Lean lines as a ladder; one-sided failures; AI translates
 * Colours follow the site: amber = open (`sorry`), green = proved, sky = machine checks.
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { GUIDE } from "../../tutorialGuide";
import { PROBLEMS } from "../../problems";
import { Arrow, MONO, StepChips } from "./ProverFigures";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ Gauss's rectangle

/** Row i (1 ≤ i ≤ n) has i teal dots (1 + 2 + … + n) and n + 1 − i amber ones (the same sum, upside down). */
export function GaussRectangle() {
  const { pick } = useLang();
  const [n, setN] = useState(4);
  const R = 9;
  const S = 24;
  const W = (n + 1) * S;
  const H = n * S;
  const sum = (n * (n + 1)) / 2;
  return (
    <div className="flex w-full flex-col items-center gap-2" data-testid="gauss-rectangle">
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setN((k) => Math.max(1, k - 1))}
          disabled={n === 1}
          className="h-7 w-7 rounded-md border border-gray-300 bg-white disabled:opacity-40"
          aria-label="n − 1"
        >
          −
        </button>
        <span className="w-12 text-center font-mono">n = {n}</span>
        <button
          onClick={() => setN((k) => Math.min(9, k + 1))}
          disabled={n === 9}
          className="h-7 w-7 rounded-md border border-gray-300 bg-white disabled:opacity-40"
          aria-label="n + 1"
        >
          +
        </button>
      </div>
      <svg
        viewBox={`0 0 ${W + 150} ${H + 46}`}
        className="w-full max-w-[420px]"
        role="img"
        aria-label={pick(["Two copies of 1 + … + n fill an n by n + 1 rectangle", "兩份 1 + … + n 拼成 n 乘 n + 1 的長方形"])}
      >
        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n + 1 }, (_, c) => (
            <circle
              key={`${r}-${c}`}
              cx={20 + c * S + S / 2}
              cy={10 + r * S + S / 2}
              r={R}
              className={`motion-safe:transition-colors ${c <= r ? "fill-teal-500" : "fill-amber-300"}`}
            />
          )),
        )}
        {/* the two sides of the rectangle */}
        <text x={20 + W / 2} y={H + 30} textAnchor="middle" fontSize={12} className="fill-gray-600">
          n + 1 = {n + 1}
        </text>
        <text x={12} y={10 + H / 2} textAnchor="end" fontSize={12} className="fill-gray-600" transform={`rotate(-90 12 ${10 + H / 2})`}>
          n = {n}
        </text>
        <g fontSize={12}>
          <circle cx={W + 40} cy={20} r={6} className="fill-teal-500" />
          <text x={W + 52} y={24} className="fill-gray-700">
            1 + … + {n} = {sum}
          </text>
          <circle cx={W + 40} cy={44} r={6} className="fill-amber-300" />
          <text x={W + 52} y={48} className="fill-gray-700">
            {n} + … + 1 = {sum}
          </text>
          <text x={W + 34} y={78} className="fill-gray-900 font-semibold">
            {pick(["together:", "合起來："])}
          </text>
          <text x={W + 34} y={96} fontFamily={MONO} className="fill-gray-900">
            2 × {sum} = {n} × {n + 1}
          </text>
        </g>
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ anatomy of a theorem

const PARTS: { code: string; label: L; sub: L; cls: string; fixed: boolean }[] = [
  { code: "theorem gauss", label: ["a name", "名字"], sub: ["to cite it later", "之後引用用"], cls: "border-gray-400", fixed: true },
  {
    code: "(n : Nat)",
    label: ["an input", "輸入"],
    sub: ["“for every natural number n”", "「對每個自然數 n」"],
    cls: "border-sky-400",
    fixed: true,
  },
  {
    code: ": 2 * sumTo n = n * (n + 1)",
    label: ["the statement", "陳述"],
    sub: ["the test the proof must pass", "證明必須通過的測試"],
    cls: "border-teal-500",
    fixed: true,
  },
  { code: ":= by sorry", label: ["the proof", "證明"], sub: ["the only part you write", "唯一由你來寫的部分"], cls: "border-amber-500", fixed: false },
];

/** One theorem line taken apart: everything before `:= by` is fixed (the test); only the proof is yours. */
export function TheoremAnatomy() {
  const { pick } = useLang();
  return (
    <div className="w-full max-w-[680px] space-y-2">
      <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3">
        {PARTS.map((p) => (
          <div key={p.code} className="flex flex-col items-center">
            <code className={`border-b-4 px-1 pb-1 text-[13px] whitespace-pre text-gray-900 ${p.cls}`} style={{ fontFamily: MONO }}>
              {p.code}
            </code>
            <span className="mt-1 text-xs font-semibold text-gray-800">
              {p.fixed ? "🔒 " : "✎ "}
              {pick(p.label)}
            </span>
            <span className="text-[11px] text-gray-500">{pick(p.sub)}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-[11px] text-gray-600">
        <span>🔒 {pick(["fixed before anyone proves it (in Formalizer, written by someone else)", "在證明之前就固定（在 Formalizer 裡由別人寫好）"])}</span>
        <span>
          ✎ <RichText text={pick(["you replace `sorry`, nothing else", "你只替換 `sorry`，其他都不能動"])} />
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ the plan as a checklist

type G = "open" | "done" | "split";
interface Hole {
  id: string;
  depth: number;
  label: string;
  goal: string;
}
const HOLES: Hole[] = [
  { id: "root", depth: 0, label: "gauss", goal: "2 * sumTo n = n * (n + 1)" },
  { id: "zero", depth: 1, label: "case zero", goal: "2 * sumTo 0 = 0 * (0 + 1)" },
  { id: "succ", depth: 1, label: "case succ", goal: "2 * sumTo (n + 1) = (n + 1) * (n + 1 + 1)" },
  { id: "l1", depth: 2, label: "calc 1", goal: "2 * sumTo (n + 1) = 2 * sumTo n + 2 * (n + 1)" },
  { id: "l2", depth: 2, label: "calc 2", goal: "_ = n * (n + 1) + 2 * (n + 1)" },
  { id: "l3", depth: 2, label: "calc 3", goal: "_ = (n + 2) * (n + 1)" },
  { id: "l4", depth: 2, label: "calc 4", goal: "_ = (n + 1) * (n + 1 + 1)" },
];
const VERSIONS: { name: L; state: Record<string, G | undefined>; how: Record<string, string> }[] = [
  { name: ["Statement", "陳述"], state: { root: "open" }, how: {} },
  { name: ["Plan A", "計畫 A"], state: { root: "split", zero: "open", succ: "open" }, how: { root: "induction n" } },
  {
    name: ["Plan B", "計畫 B"],
    state: { root: "split", zero: "done", succ: "split", l1: "open", l2: "open", l3: "open", l4: "open" },
    how: { root: "induction n", zero: "rfl", succ: "calc" },
  },
  {
    name: ["Plan C", "計畫 C"],
    state: { root: "split", zero: "done", succ: "split", l1: "done", l2: "done", l3: "open", l4: "open" },
    how: { root: "induction n", zero: "rfl", succ: "calc", l1: "rw [sumTo, Nat.mul_add]", l2: "rw [ih]" },
  },
  {
    name: ["Proof", "證明"],
    state: { root: "done", zero: "done", succ: "done", l1: "done", l2: "done", l3: "done", l4: "done" },
    how: {
      root: "induction n",
      zero: "rfl",
      succ: "calc",
      l1: "rw [sumTo, Nat.mul_add]",
      l2: "rw [ih]",
      l3: "rw [Nat.add_mul n 2 (n + 1)]",
      l4: "rw [Nat.mul_comm]",
    },
  },
];
const MARK: Record<G, { m: string; cls: string }> = {
  open: { m: "◐", cls: "border-amber-300 bg-amber-50 text-amber-900" },
  done: { m: "✓", cls: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  split: { m: "↳", cls: "border-gray-200 bg-white text-gray-500" },
};

/** The goals of `gauss`, version by version: every `sorry` is an open box; the count goes 1, 2, 4, 2, 0. */
export function PlanStepper() {
  const { pick } = useLang();
  const [v, setV] = useState(0);
  const ver = VERSIONS[v];
  const count = (i: number) => Object.values(VERSIONS[i].state).filter((s) => s === "open").length;
  return (
    <div className="w-full" data-testid="plan-stepper">
      <StepChips labels={VERSIONS.map((x) => pick(x.name))} i={v} setI={setV} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_150px]">
        <ul className="min-w-0 space-y-1">
          {HOLES.map((h) => {
            const st = ver.state[h.id];
            if (!st) return null;
            return (
              <li
                key={h.id}
                className={`flex flex-wrap items-baseline gap-x-2 rounded-md border px-2 py-1 text-[12px] motion-safe:transition-colors ${MARK[st].cls}`}
                style={{ marginLeft: h.depth * 18 }}
              >
                <span className="w-4 text-center">{MARK[st].m}</span>
                <span className="text-[11px] text-gray-500">{h.label}</span>
                <code style={{ fontFamily: MONO }} className="break-all">
                  ⊢ {h.goal}
                </code>
                {ver.how[h.id] && (
                  <span className="ml-auto text-[11px] text-gray-500" style={{ fontFamily: MONO }}>
                    {st === "split" ? pick(["split by", "拆開："]) : "by"} {ver.how[h.id]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <svg viewBox="0 0 150 134" className="w-full max-w-[200px]" role="img" aria-label={pick(["sorrys left", "剩下的 sorry"])}>
          <text x={75} y={12} textAnchor="middle" fontSize={11} className="fill-gray-600">
            {pick(["sorrys left", "剩下的 sorry"])}
          </text>
          {VERSIONS.map((_, i) => {
            const c = count(i);
            return (
              <g key={i}>
                <rect
                  x={10 + i * 27}
                  y={114 - c * 18}
                  width={20}
                  height={Math.max(c * 18, 1)}
                  rx={3}
                  className={i === v ? "fill-amber-400" : "fill-amber-100"}
                />
                <text x={20 + i * 27} y={108 - c * 18} textAnchor="middle" fontSize={11} className="fill-gray-700">
                  {c}
                </text>
                <text x={20 + i * 27} y={128} textAnchor="middle" fontSize={9} className="fill-gray-500">
                  {i === 0 ? "S" : i === 4 ? "✓" : "ABC"[i - 1]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Comparator

/** Comparator as a machine: three inputs, four checks inside a sandbox, and the question left to people. */
export function ComparatorFlow() {
  const { pick } = useLang();
  const inputs: { y: number; t: string; sub: L }[] = [
    { y: 30, t: "Challenge.lean", sub: ["statements, with sorry", "陳述，證明處是 sorry"] },
    { y: 90, t: "Solution.lean", sub: ["the proofs (untrusted)", "證明（不受信任）"] },
    { y: 150, t: "config.json", sub: ["theorem names, permitted axioms", "定理名稱、許可的公理"] },
  ];
  const checks: L[] = [
    ["build both, in a sandbox", "在沙盒中建置兩者"],
    ["same statements, same definitions", "陳述相同、定義相同"],
    ["only permitted axioms", "只用許可的公理"],
    ["kernel replay (+ nanoda)", "核心重新驗算（+ nanoda）"],
  ];
  return (
    <svg viewBox="0 0 660 250" className="w-full max-w-[660px]" role="img" aria-label={pick(["How Comparator checks", "Comparator 如何檢查"])}>
      {inputs.map((b) => (
        <g key={b.t}>
          <rect x={6} y={b.y} width={180} height={44} rx={8} className="fill-white stroke-gray-400" />
          <text x={96} y={b.y + 19} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900">
            {b.t}
          </text>
          <text x={96} y={b.y + 35} textAnchor="middle" fontSize={10} className="fill-gray-500">
            {pick(b.sub)}
          </text>
          <Arrow x1={186} y1={b.y + 22} x2={214} y2={112} />
        </g>
      ))}
      <rect x={218} y={20} width={260} height={190} rx={12} className="fill-sky-50/60 stroke-sky-400" strokeDasharray="6 4" />
      <text x={348} y={38} textAnchor="middle" fontSize={11} className="fill-sky-800">
        {pick(["sandbox: the solution can't touch the checker", "沙盒：解答碰不到檢查程式"])}
      </text>
      {checks.map((c, i) => (
        <g key={i}>
          <rect x={234} y={50 + i * 38} width={228} height={30} rx={6} className="fill-white stroke-sky-300" />
          <text x={248} y={70 + i * 38} fontSize={12} className="fill-gray-800">
            {i + 1}. {pick(c)}
          </text>
        </g>
      ))}
      <Arrow x1={478} y1={112} x2={516} y2={112} cls="stroke-emerald-600" />
      <rect x={520} y={92} width={130} height={40} rx={20} className="fill-emerald-50 stroke-emerald-500" />
      <text x={585} y={117} textAnchor="middle" fontSize={13} className="fill-emerald-800 font-semibold">
        ✓ {pick(["pass", "通過"])}
      </text>
      <text x={585} y={150} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
        {pick(["any check fails → reject", "任一項不過 → 拒絕"])}
      </text>
      {/* what no machine checks */}
      <rect x={10} y={218} width={640} height={26} rx={6} className="fill-amber-50 stroke-amber-400" />
      <text x={330} y={235} textAnchor="middle" fontSize={11.5} className="fill-amber-900">
        {pick([
          "Not checked by any machine: does Challenge.lean say what the paper means? People read that.",
          "沒有機器檢查：Challenge.lean 說的是論文的意思嗎？這要靠人讀。",
        ])}
      </text>
    </svg>
  );
}


// ------------------------------------------------------------------------------------------------ one proof, two languages

type Mode = "both" | "words" | "lean" | "ai";
const MODES: { id: Mode; label: L }[] = [
  { id: "both", label: ["Both streams", "兩條都在"] },
  { id: "words", label: ["Natural language only", "只有自然語言"] },
  { id: "lean", label: ["Lean only", "只有 Lean"] },
  { id: "ai", label: ["AI translates", "AI 來翻譯"] },
];
const VERDICT: Record<Mode, { t: L; cls: string }> = {
  both: {
    t: [
      "**The mirror.** Every step is read by a person on one side and checked by the kernel on the other, and each rung says which goes with which. The pair is the proof.",
      "**鏡像。** 每一步在一邊有人讀過，在另一邊有核心檢查過，每一根橫桿都標明誰對應誰。這一對合起來才是證明。",
    ],
    cls: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  words: {
    t: [
      "**Natural language only: a gap no machine checked.** “$= (n + 2)(n + 1)$, which is $(n + 1)(n + 2)$” looks obvious, so a reader nods. Most steps like this are fine; but when one is wrong, nothing forces anyone to notice, just as a referee can miss a step.",
      "**只有自然語言：沒有機器檢查過的縫隙。** 「$= (n + 2)(n + 1)$，也就是 $(n + 1)(n + 2)$」看起來很顯然，讀者點個頭就過去了。這種步驟大多沒問題；但萬一有一步錯了，沒有任何東西逼人發現，就像審稿人也可能漏看一步。",
    ],
    cls: "border-amber-300 bg-amber-50 text-amber-900",
  },
  lean: {
    t: [
      "**Lean only: checked, but unread.** The kernel accepts every line, so the statement is true. But `rw [Nat.add_mul n 2 (n + 1)]` does not say *why* $1 + 2 + \\dots + n$ is half of $n(n + 1)$: the idea lives in the natural-language proof.",
      "**只有 Lean：檢查過，卻沒人讀。** 核心接受每一行，所以陳述成立。但 `rw [Nat.add_mul n 2 (n + 1)]` 並沒有說出 $1 + 2 + \\dots + n$ *為什麼* 是 $n(n + 1)$ 的一半：想法活在自然語言證明裡。",
    ],
    cls: "border-sky-300 bg-sky-50 text-sky-900",
  },
  ai: {
    t: [
      "**AI as the translator.** Start from either side: write the argument in natural language and let AI draft the Lean, or write Lean and let AI read it back in natural language. Its translation is a draft: the kernel checks the Lean side, and you check that the two sides say the same thing.",
      "**AI 當翻譯。** 從哪一邊開始都可以：先用自然語言寫論證，讓 AI 起草 Lean；或先寫 Lean，讓 AI 用自然語言讀回來。它的翻譯只是草稿：Lean 那一邊由核心檢查，兩邊說的是不是同一件事，由你來核對。",
    ],
    cls: "border-violet-300 bg-violet-50 text-violet-900",
  },
};

/** The rung between a natural-language step and its Lean lines: a solid link, a broken one, or AI's arrows both ways. */
function Rung({ mode, on, vertical }: { mode: Mode; on: boolean; vertical: boolean }) {
  const broken = mode === "words" || mode === "lean";
  const [stroke, fill] = on
    ? ["stroke-(--lk-accent)", "fill-(--lk-accent)"]
    : broken
      ? ["stroke-gray-300", "fill-gray-300"]
      : mode === "ai"
        ? ["stroke-violet-500", "fill-violet-500"]
        : ["stroke-gray-400", "fill-gray-400"];
  // horizontal: natural language on the left, Lean on the right; vertical (phones): one above the other
  const W = vertical ? 24 : 48;
  const H = 30;
  // drawn in a 48 × 48 frame (link at y = 24, AI's arrows at 14 and 34), squeezed to fit
  const a = vertical ? (x: number, y: number) => [y * 0.5, x * 0.62] : (x: number, y: number) => [x, (y - 24) * 0.75 + 15];
  const ln = (x1: number, y1: number, x2: number, y2: number, w = 1.6, dash?: string) => {
    const [p, q] = a(x1, y1);
    const [r, s] = a(x2, y2);
    return <line x1={p} y1={q} x2={r} y2={s} strokeWidth={w} strokeDasharray={dash} />;
  };
  const pt = (x: number, y: number) => a(x, y).join(",");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {mode === "ai" ? (
        <g className={`${stroke} motion-safe:animate-pulse`}>
          {ln(6, 14, 40, 14)}
          <polygon points={`${pt(45, 14)} ${pt(37, 9)} ${pt(37, 19)}`} className={fill} />
          {ln(8, 34, 42, 34)}
          <polygon points={`${pt(3, 34)} ${pt(11, 29)} ${pt(11, 39)}`} className={fill} />
        </g>
      ) : (
        <g className={stroke}>
          {ln(7, 24, 41, 24, on ? 2.6 : 1.8, broken ? "3 4" : undefined)}
          <circle cx={a(4, 24)[0]} cy={a(4, 24)[1]} r={3} className={fill} />
          <circle cx={a(44, 24)[0]} cy={a(44, 24)[1]} r={3} className={fill} />
        </g>
      )}
    </svg>
  );
}

/** Lines with their common indentation removed (a step's lines shown on their own). */
function dedent(lines: string[]): string {
  const cut = Math.min(...lines.map((x) => x.length - x.trimStart().length));
  return lines.map((x) => x.slice(cut)).join("\n");
}

/**
 * One proof, two languages: Gauss's sum as a natural-language proof (left) and a Lean proof (right), joined like a ladder. Each rung links a
 * natural-language step to the Lean lines that do it: the same mapping the Problems page shows (tutorialGuide.ts `paper`, lines of
 * the problem's solution). Hover or click a rung or either end to light up the pair. The chips show the two one-sided
 * failures and AI as the translator. Motion (the AI arrows' pulse, fades) only when the reader allows it.
 */
export function TwoStreams() {
  const { pick } = useLang();
  const [mode, setMode] = useState<Mode>("both");
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const sel = hover ?? pinned;
  const solution = (PROBLEMS.find((p) => p.id === "gauss")?.solution ?? "").split("\n");
  const steps = (GUIDE.gauss?.paper ?? []).map((s) => ({
    text: s.text,
    lean: dedent(solution.slice(s.lines[0] - 1, s.lines[1]).filter((x) => x.trim())),
  }));
  const paperFade = mode === "lean";
  const leanFade = mode === "words";
  const pair = (i: number) => ({
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(null),
    onClick: () => setPinned((p) => (p === i ? null : i)),
  });
  const cell = (i: number, side: "paper" | "lean") => {
    const fade = side === "paper" ? paperFade : leanFade;
    return `cursor-pointer rounded-md border-l-4 bg-white px-2 py-1.5 motion-safe:transition-[opacity,box-shadow] ${
      side === "paper" ? "border-amber-400" : "border-teal-500"
    } ${sel === i ? "ring-2 ring-(--lk-accent)" : "ring-1 ring-gray-200"} ${fade ? "opacity-25" : ""}`;
  };
  const head = (side: "paper" | "lean") => {
    const fade = side === "paper" ? paperFade : leanFade;
    return (
      <div className={`text-xs font-semibold ${side === "paper" ? "text-amber-800" : "text-teal-800"}`}>
        <span className={fade ? "opacity-40" : ""}>
          {side === "paper" ? `✎ ${pick(["Natural-language proof: for people", "自然語言證明：寫給人看"])}` : `⊢ ${pick(["Lean proof: for the machine", "Lean 證明：寫給機器看"])}`}
        </span>
        {fade && <span className="ml-1 font-normal text-gray-500">{pick(["(missing)", "（缺）"])}</span>}
        {mode === "ai" && (
          <span className="block font-normal text-violet-700">
            {side === "paper" ? pick(["start here → AI drafts Lean", "從這裡開始 → AI 起草 Lean"]) : pick(["or here → AI reads it back", "或從這裡 → AI 讀回自然語言"])}
          </span>
        )}
      </div>
    );
  };
  return (
    <div className="w-full max-w-[760px] text-left" data-testid="two-streams">
      <StepChips labels={MODES.map((m) => pick(m.label))} i={MODES.findIndex((m) => m.id === mode)} setI={(k) => setMode(MODES[k].id)} />
      <div className="mb-1 grid grid-cols-1 gap-x-1 gap-y-0.5 sm:grid-cols-[minmax(0,5fr)_52px_minmax(0,6fr)]">
        {head("paper")}
        <span className="hidden sm:block" />
        {head("lean")}
      </div>
      <ol className="space-y-4 sm:space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="grid grid-cols-1 items-center gap-x-1 sm:grid-cols-[minmax(0,5fr)_52px_minmax(0,6fr)]" data-rung={i + 1}>
            <div className={`${cell(i, "paper")} text-[13px] text-gray-800`} {...pair(i)}>
              <RichText text={pick(s.text)} />
            </div>
            <div className="flex cursor-pointer justify-center" {...pair(i)} title={pick(["the rung: this step, in both languages", "橫桿：同一步，兩種語言"])}>
              <span className="hidden sm:block">
                <Rung mode={mode} on={sel === i} vertical={false} />
              </span>
              <span className="sm:hidden">
                <Rung mode={mode} on={sel === i} vertical />
              </span>
            </div>
            <pre
              className={`${cell(i, "lean")} m-0 text-[11.5px] leading-snug whitespace-pre-wrap text-gray-900 [overflow-wrap:anywhere]`}
              style={{ fontFamily: MONO }}
              {...pair(i)}
            >
              {s.lean}
            </pre>
          </li>
        ))}
      </ol>
      <div className={`mt-3 rounded-md border px-3 py-2 text-[13px] ${VERDICT[mode].cls}`} aria-live="polite">
        <RichText text={pick(VERDICT[mode].t)} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ two pillars

type Stand = "both" | "nl" | "lean";
const STANDS: { id: Stand; label: L }[] = [
  { id: "both", label: ["Both", "兩者都有"] },
  { id: "nl", label: ["Natural language only", "只有自然語言"] },
  { id: "lean", label: ["Lean only", "只有 Lean"] },
];
const STAND_NOTE: Record<Stand, { t: L; cls: string }> = {
  both: {
    t: [
      "**Both: it stands.** People can read the natural-language proof and see why the result is true; the machine has checked every step of the Lean proof. The beams between the pillars are the step-by-step links between the two.",
      "**兩者都有：屋頂立得住。** 人讀得懂自然語言證明，看得出結果為什麼成立；機器檢查過 Lean 證明的每一步。兩根柱子之間的橫樑，就是兩者之間一步一步的對應。",
    ],
    cls: "border-emerald-300 bg-emerald-50 text-emerald-900",
  },
  nl: {
    t: [
      "**Natural language only: the Lean pillar is missing.** A gap a referee can miss stays possible, because no machine has checked the steps. Example, as of 22 November 2026: Masullo's proposed proof of GRH, written without AI, in which readers using AI reported problems within hours of the announcement.",
      "**只有自然語言：少了 Lean 那根柱子。** 審稿人可能漏看的縫隙依然可能存在，因為沒有機器檢查過每一步。例子（截至 2026 年 11 月 22 日）：Masullo 提出的 GRH 證明，寫作時沒有用 AI；公布後幾小時內，借助 AI 的讀者就回報了其中的問題。",
    ],
    cls: "border-amber-300 bg-amber-50 text-amber-900",
  },
  lean: {
    t: [
      "**Lean only: the natural-language pillar is missing.** Checked but not understood, and only a person can tell whether the statement says what was meant (in Lean, `(1 : ℕ) / 2 = 0`). Example, as of 22 November 2026: Alpöge's claimed Lean proof of the Riemann hypothesis, 17,374,215 lines, with no natural-language proof yet.",
      "**只有 Lean：少了自然語言那根柱子。** 檢查過，卻沒有被理解；而陳述說的是不是原本的意思，只有人能判斷（在 Lean 裡 `(1 : ℕ) / 2 = 0`）。例子（截至 2026 年 11 月 22 日）：Alpöge 宣稱的黎曼猜想 Lean 證明，17,374,215 行，還沒有自然語言證明。",
    ],
    cls: "border-sky-300 bg-sky-50 text-sky-900",
  },
};

/**
 * The site's position as a building: a roof ("a complete proof") on two pillars, the natural-language proof and the
 * Lean proof, with beams between them for the step-by-step mirror. Take a pillar away and the roof tilts and cracks.
 * Reduced motion: the tilted state is shown without the animation.
 */
export function TwoPillars() {
  const { pick } = useLang();
  const [s, setS] = useState<Stand>("both");
  const nlUp = s !== "lean";
  const leanUp = s !== "nl";
  // the roof pivots on the top corner of the pillar that is still standing
  const tilt = s === "nl" ? "rotate(9deg)" : s === "lean" ? "rotate(-9deg)" : "none";
  const origin = s === "lean" ? "320px 112px" : "200px 112px";
  const pillar = (x: number, up: boolean, title: L[], lines: L[], tone: "amber" | "teal") =>
    up ? (
      <g>
        <rect
          x={x}
          y={112}
          width={130}
          height={156}
          className={tone === "amber" ? "fill-amber-50 stroke-amber-500" : "fill-teal-50 stroke-teal-500"}
          strokeWidth={1.5}
        />
        {title.filter((t) => pick(t)).map((t, k) => (
          <text key={`t${k}`} x={x + 65} y={136 + k * 16} textAnchor="middle" fontSize={12} className="fill-gray-900 font-semibold">
            {pick(t)}
          </text>
        ))}
        {lines.map((t, k) => (
          <text key={k} x={x + 65} y={186 + k * 17} textAnchor="middle" fontSize={11} className="fill-gray-700">
            {pick(t)}
          </text>
        ))}
      </g>
    ) : (
      <g>
        <rect x={x} y={112} width={130} height={156} className="fill-none stroke-gray-300" strokeWidth={1.2} strokeDasharray="5 4" />
        <text x={x + 65} y={196} textAnchor="middle" fontSize={11} className="fill-gray-400">
          {pick(["(missing)", "（缺）"])}
        </text>
      </g>
    );
  return (
    <div className="w-full max-w-[560px]" data-testid="two-pillars">
      <StepChips labels={STANDS.map((x) => pick(x.label))} i={STANDS.findIndex((x) => x.id === s)} setI={(k) => setS(STANDS[k].id)} />
      <svg
        viewBox="0 0 520 290"
        className="w-full"
        role="img"
        aria-label={pick([
          "A roof, a complete proof, on two pillars: the natural-language proof and the Lean proof",
          "屋頂（完整的證明）立在兩根柱子上：自然語言證明與 Lean 證明",
        ])}
      >
        {/* the ground */}
        <line x1={20} y1={270} x2={500} y2={270} strokeWidth={2} className="stroke-gray-400" />
        {/* beams between the pillars: the step-by-step mirror */}
        {[150, 180, 210, 240].map((y) => (
          <line
            key={y}
            x1={200}
            y1={y}
            x2={320}
            y2={y}
            strokeWidth={1.6}
            strokeDasharray={s === "both" ? undefined : "3 5"}
            className={s === "both" ? "stroke-gray-400" : "stroke-gray-300"}
          />
        ))}
        {pillar(70, nlUp, [["Natural-language", "自然語言證明"], ["proof", ""]], [
          ["people read it:", "人來讀："],
          ["the ideas,", "想法，"],
          ["why it is true", "為什麼成立"],
        ], "amber")}
        {pillar(320, leanUp, [["Lean proof", "Lean 證明"]], [
          ["the machine checks it:", "機器來檢查："],
          ["every step,", "每一步，"],
          ["exactly", "精確無誤"],
        ], "teal")}
        {/* the roof */}
        <g className="motion-safe:transition-transform motion-safe:duration-700" style={{ transform: tilt, transformOrigin: origin, transformBox: "view-box" }}>
          <polygon
            points="40,112 480,112 260,48"
            strokeWidth={1.5}
            className={s === "both" ? "fill-emerald-50 stroke-emerald-500" : "fill-gray-50 stroke-gray-400"}
          />
          <text x={260} y={100} textAnchor="middle" fontSize={13} className="fill-gray-900 font-semibold">
            {pick(["A complete proof", "完整的證明"])}
            {s === "both" ? " ✓" : ""}
          </text>
          {s !== "both" && (
            <path
              d={s === "nl" ? "M368 80 l-8 10 l9 6 l-7 16" : "M152 80 l8 10 l-9 6 l7 16"}
              strokeWidth={1.6}
              className="fill-none stroke-rose-500"
            />
          )}
        </g>
      </svg>
      <div className={`mt-2 rounded-md border px-3 py-2 text-left text-[13px] ${STAND_NOTE[s].cls}`} aria-live="polite">
        <RichText text={pick(STAND_NOTE[s].t)} />
      </div>
    </div>
  );
}
