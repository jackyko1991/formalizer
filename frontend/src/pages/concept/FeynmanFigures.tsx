/**
 * Concept ▸ The Feynman technique: pictures.
 *   TwoListeners  the same explanation told to a person (who nods over the gap) and to Lean (which shows the gap as a goal)
 *   GoalStepper   the worked example line by line: the code added, the goal panel Lean shows, the sentence it says
 *   SockPairs     odd + odd = even as socks: two leftover socks make one more pair
 *   OddBadLine    the tempting definition "2k − 1" on ℕ: k = 0 gives 0, so 0 counts as "odd"
 * Goal panels are copied from Lean v4.34.1's output for lean/Formalizer/Pages/Feynman.lean.
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { MONO, StepChips } from "./ProverFigures";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ two listeners

const PLANKS: { t: string; gap?: boolean }[] = [
  { t: "a = 2j + 1" },
  { t: "b = 2k + 1" },
  { t: "a + b = 2(j + k + 1)", gap: true },
  { t: "a + b is even" },
];

/** One explanation, two listeners: the person fills the missing step in silently; Lean stops at it and shows it. */
export function TwoListeners() {
  const { pick } = useLang();
  const row = (y: number, lean: boolean) =>
    PLANKS.map((p, i) => {
      const x = 130 + i * 128;
      const gap = p.gap;
      return (
        <g key={`${y}-${i}`}>
          <rect
            x={x}
            y={y}
            width={118}
            height={34}
            rx={6}
            strokeWidth={1.5}
            strokeDasharray={gap ? "5 4" : undefined}
            className={
              gap ? (lean ? "fill-red-50 stroke-red-400" : "fill-white stroke-gray-300") : "fill-teal-50 stroke-teal-500"
            }
          />
          <text
            x={x + 59}
            y={y + 21}
            textAnchor="middle"
            fontSize={11}
            fontFamily={MONO}
            className={gap ? (lean ? "fill-red-800" : "fill-gray-400") : "fill-gray-800"}
          >
            {gap && !lean ? pick(["(skipped)", "（跳過了）"]) : p.t}
          </text>
        </g>
      );
    });
  return (
    <svg viewBox="0 0 650 240" className="w-full max-w-[650px]" role="img" aria-label={pick(["Two listeners", "兩種聽眾"])}>
      <text x={130} y={16} fontSize={11} className="fill-gray-500">
        {pick(["your explanation, step by step (each box a plank of the bridge) →", "你的解釋，一步一步（每一格是橋上的一塊木板）→"])}
      </text>
      {/* a person */}
      <circle cx={40} cy={58} r={14} className="fill-amber-100 stroke-amber-500" />
      <path d="M18 98 Q40 72 62 98 Z" className="fill-amber-100 stroke-amber-500" />
      <text x={40} y={118} textAnchor="middle" fontSize={11} className="fill-gray-700 font-semibold">
        {pick(["a person", "一個人"])}
      </text>
      {row(50, false)}
      <text x={386} y={104} textAnchor="middle" fontSize={11} className="fill-amber-700">
        {pick(["“sure, makes sense” — nods, fills the gap in their head", "「嗯，有道理」──點頭，在腦中自動補上"])}
      </text>
      {/* Lean */}
      <rect x={20} y={146} width={40} height={40} rx={8} className="fill-teal-600" />
      <text x={40} y={172} textAnchor="middle" fontSize={13} className="fill-white font-semibold">
        L∃∀N
      </text>
      <text x={40} y={204} textAnchor="middle" fontSize={11} className="fill-gray-700 font-semibold">
        Lean
      </text>
      {row(150, true)}
      <text x={450} y={204} textAnchor="middle" fontSize={11} className="fill-red-700">
        {pick(["unsolved goal ⊢ a + b = 2 * (j + k + 1)", "未解決的目標 ⊢ a + b = 2 * (j + k + 1)"])}
      </text>
      <text x={450} y={222} textAnchor="middle" fontSize={11} className="fill-red-700">
        {pick(["it stops here until you give a reason", "它停在這裡，直到你給出理由"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ the worked example, step by step

const STAGES: { name: L; code: string; goal: string; fresh: string[]; say: L }[] = [
  {
    name: ["Statement", "陳述"],
    code: "theorem odd_add_odd (a b : Nat) (ha : IsOdd a) (hb : IsOdd b) :\n    IsEven (a + b) := by",
    goal: "a b : Nat\nha : IsOdd a\nhb : IsOdd b\n⊢ IsEven (a + b)",
    fresh: [],
    say: ["“Let $a$ and $b$ be odd. I claim $a + b$ is even.”", "「設 $a$、$b$ 是奇數。我主張 $a + b$ 是偶數。」"],
  },
  {
    name: ["Unpack a", "拆開 a"],
    code: "  obtain ⟨j, hj⟩ := ha",
    goal: "a b : Nat\nhb : IsOdd b\nj : Nat\nhj : a = 2 * j + 1\n⊢ IsEven (a + b)",
    fresh: ["j : Nat", "hj : a = 2 * j + 1"],
    say: ["“$a$ is odd, so $a = 2j + 1$ for some $j$.”", "「$a$ 是奇數，所以對某個 $j$ 有 $a = 2j + 1$。」"],
  },
  {
    name: ["Unpack b", "拆開 b"],
    code: "  obtain ⟨k, hk⟩ := hb",
    goal: "a b j : Nat\nhj : a = 2 * j + 1\nk : Nat\nhk : b = 2 * k + 1\n⊢ IsEven (a + b)",
    fresh: ["k : Nat", "hk : b = 2 * k + 1"],
    say: ["“Likewise $b = 2k + 1$.”", "「同樣地，$b = 2k + 1$。」"],
  },
  {
    name: ["Name the half", "說出那一半"],
    code: "  refine ⟨j + k + 1, ?_⟩",
    goal: "a b j : Nat\nhj : a = 2 * j + 1\nk : Nat\nhk : b = 2 * k + 1\n⊢ a + b = 2 * (j + k + 1)",
    fresh: ["⊢ a + b = 2 * (j + k + 1)"],
    say: [
      "“Even means twice something; I say $a + b$ is twice $j + k + 1$.” The goal changes from a word to an equation.",
      "「偶數就是某數的兩倍；我說 $a + b$ 是 $j + k + 1$ 的兩倍。」目標從一個詞變成一條等式。",
    ],
  },
  {
    name: ["Arithmetic", "算術"],
    code: "  omega",
    goal: "No goals",
    fresh: [],
    say: [
      "“$(2j + 1) + (2k + 1) = 2(j + k + 1)$.” Plain arithmetic from `hj` and `hk`; nothing is left to explain.",
      "「$(2j + 1) + (2k + 1) = 2(j + k + 1)$。」只靠 `hj` 與 `hk` 的算術；沒有剩下要解釋的。",
    ],
  },
];

/** The worked example one line at a time: what you write, what Lean then shows, and the sentence it stands for. */
export function GoalStepper() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const s = STAGES[i];
  return (
    <div className="w-full" data-testid="feynman-goal-stepper">
      <StepChips labels={STAGES.map((x, k) => `${k + 1} · ${pick(x.name)}`)} i={i} setI={setI} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["You write", "你寫"])}</p>
          <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-[12px] leading-relaxed text-gray-100" style={{ fontFamily: MONO }}>
            {STAGES.slice(1, i + 1).reduce((acc, x) => `${acc}\n${x.code}`, STAGES[0].code)}
          </pre>
          <p className="text-sm text-gray-700">
            <RichText text={pick(s.say)} />
          </p>
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["Lean shows", "Lean 顯示"])}</p>
          <div className="rounded-md border border-gray-200 bg-white p-3 text-[12px] leading-relaxed" style={{ fontFamily: MONO }}>
            {s.goal.split("\n").map((line) => (
              <div
                key={line}
                className={
                  line === "No goals"
                    ? "font-semibold text-emerald-700"
                    : s.fresh.includes(line)
                      ? "rounded bg-amber-50 text-amber-900"
                      : line.startsWith("⊢")
                        ? "text-gray-900"
                        : "text-gray-600"
                }
              >
                {line === "No goals" ? `✓ ${pick(["No goals: proved", "沒有目標了：證明完成"])}` : line}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500">{pick(["highlighted: new since the last step", "標色：上一步之後新出現的"])}</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ socks

/** a = 2·2 + 1 = 5 and b = 2·3 + 1 = 7: pairs plus one leftover sock each; together the two leftovers make a pair. */
export function SockPairs() {
  const { pick } = useLang();
  const [together, setTogether] = useState(false);
  const j = 2;
  const k = 3;
  const sock = (key: string, x: number, y: number, cls: string) => (
    <g key={key} style={{ transform: `translate(${x}px, ${y}px)` }} className="motion-safe:transition-transform motion-safe:duration-700">
      <path d="M0 0 h10 v16 q0 6 6 6 h4 v8 h-14 q-6 0 -6 -6 Z" className={cls} strokeWidth={1.2} />
    </g>
  );
  const pairs = (n: number, x0: number, y: number, cls: string, prefix: string) =>
    Array.from({ length: n }, (_, p) => [sock(`${prefix}${p}a`, x0 + p * 56, y, cls), sock(`${prefix}${p}b`, x0 + p * 56 + 24, y, cls)]);
  // leftovers: apart, then side by side as one more pair
  const la = together ? { x: 380, y: 45 } : { x: 100 + j * 56 + 10, y: 10 };
  const lb = together ? { x: 404, y: 45 } : { x: 100 + k * 56 + 10, y: 80 };
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <svg viewBox="0 0 560 200" className="w-full max-w-[560px]" role="img" aria-label={pick(["Odd plus odd as socks", "用襪子看奇數加奇數"])}>
        <text x={4} y={30} fontSize={12} fontFamily={MONO} className="fill-gray-700">
          a = 2·{j} + 1
        </text>
        <text x={4} y={100} fontSize={12} fontFamily={MONO} className="fill-gray-700">
          b = 2·{k} + 1
        </text>
        <g>{pairs(j, 100, 10, "fill-teal-100 stroke-teal-600", "a")}</g>
        <g>{pairs(k, 100, 80, "fill-sky-100 stroke-sky-600", "b")}</g>
        {sock("la", la.x, la.y, "fill-amber-200 stroke-amber-600")}
        {sock("lb", lb.x, lb.y, "fill-amber-200 stroke-amber-600")}
        <text x={300} y={190} textAnchor="middle" fontSize={12} className="fill-gray-700">
          {together
            ? pick([
                `a + b = ${2 * j + 1} + ${2 * k + 1} = 2·(${j} + ${k} + 1) = ${2 * (j + k + 1)}: ${j + k + 1} pairs, nothing left over`,
                `a + b = ${2 * j + 1} + ${2 * k + 1} = 2·(${j} + ${k} + 1) = ${2 * (j + k + 1)}：${j + k + 1} 雙，沒有落單`,
              ])
            : pick([`${j} pairs + 1 leftover, and ${k} pairs + 1 leftover`, `${j} 雙 + 1 隻落單，以及 ${k} 雙 + 1 隻落單`])}
        </text>
        {together && (
          <text x={400} y={100} textAnchor="middle" fontSize={11} className="fill-amber-700">
            {pick(["the “+ 1”s: one more pair", "兩個「+ 1」：又一雙"])}
          </text>
        )}
      </svg>
      <button
        onClick={() => setTogether((t) => !t)}
        className="rounded-md bg-(--lk-accent) px-3 py-1 text-xs font-medium text-white"
        data-testid="socks-toggle"
      >
        {together ? pick(["◂ Apart again", "◂ 分開"]) : pick(["Put them together ▸", "放在一起 ▸"])}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ the bad definition

/** Which n in 0..9 each definition calls odd: `2 * k + 1` gives 1, 3, 5, …; `2 * k - 1` on Nat also gives 0 (k = 0). */
export function OddBadLine() {
  const { pick } = useLang();
  const xs = Array.from({ length: 10 }, (_, n) => n);
  const X = (n: number) => 200 + n * 44;
  const rows: { y: number; name: string; label: string; hits: number[]; cls: string }[] = [
    { y: 50, name: "IsOdd n", label: "∃ k, n = 2 * k + 1", hits: [1, 3, 5, 7, 9], cls: "fill-teal-500" },
    { y: 110, name: "IsOddBad n", label: "∃ k, n = 2 * k - 1", hits: [0, 1, 3, 5, 7, 9], cls: "fill-teal-500" },
  ];
  return (
    <svg viewBox="0 0 640 175" className="w-full max-w-[640px]" role="img" aria-label={pick(["Two definitions of odd", "奇數的兩種定義"])}>
      {rows.map((r) => (
        <g key={r.y}>
          <text x={4} y={r.y - 4} fontSize={12} fontFamily={MONO} className="fill-gray-900 font-semibold">
            {r.name}
          </text>
          <text x={4} y={r.y + 12} fontSize={11} fontFamily={MONO} className="fill-gray-600">
            {r.label}
          </text>
          <line x1={X(0) - 14} y1={r.y} x2={X(9) + 14} y2={r.y} className="stroke-gray-300" strokeWidth={1.5} />
          {xs.map((n) => {
            const hit = r.hits.includes(n);
            const bad = hit && n === 0;
            return (
              <g key={n}>
                <circle
                  cx={X(n)}
                  cy={r.y}
                  r={hit ? 9 : 4}
                  className={bad ? "fill-red-500" : hit ? r.cls : "fill-gray-300"}
                />
                <text x={X(n)} y={r.y + 26} textAnchor="middle" fontSize={11} className={bad ? "fill-red-700 font-semibold" : "fill-gray-600"}>
                  {n}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      <text x={4} y={164} fontSize={11} className="fill-red-700">
        {pick([
          "k = 0: 2 * 0 - 1 = 0 on Nat (subtraction stops at zero), so IsOddBad 0 holds",
          "k = 0：在 Nat 上 2 * 0 - 1 = 0（減法到零就停），所以 IsOddBad 0 成立",
        ])}
      </text>
    </svg>
  );
}
