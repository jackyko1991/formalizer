/**
 * Concept ▸ Lean maths: pictures.
 *   TypeBoxes    types as labelled boxes: every value lives in one box; a cast ↑ crosses from Nat to Int; a function
 *                goes from box to box
 *   PropBoxes    propositions as types: a statement is a box whose elements are its proofs; a false one is empty
 *   LogicMoves   click a symbol: the goal before, the tactic, the goal(s) after (copied from Lean v4.34.1)
 *   NumberLines  one sum on ℕ, ℤ and ℝ: 2 − 3, 1 / 2, −7 / 2, 5 / 0 (ℕ stops at zero, rounds down, x / 0 = 0)
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { Arrow, MONO, StepChips } from "./ProverFigures";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ types as boxes

function Box({ x, y, w, h, title, cls }: { x: number; y: number; w: number; h: number; title: string; cls: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} className={cls} strokeWidth={1.5} />
      <rect x={x + 12} y={y - 11} width={title.length * 8 + 16} height={22} rx={6} className="fill-white stroke-gray-300" />
      <text x={x + 20} y={y + 4} fontSize={13} fontFamily={MONO} className="fill-gray-900 font-semibold">
        {title}
      </text>
    </g>
  );
}

function Val({ x, y, t, cls = "fill-gray-800" }: { x: number; y: number; t: string; cls?: string }) {
  return (
    <text x={x} y={y} fontSize={13} fontFamily={MONO} textAnchor="middle" className={cls}>
      {t}
    </text>
  );
}

/** Nat, Int and String as boxes; the two 2s are different values; ↑ casts; `double` maps the Nat box to itself. */
export function TypeBoxes() {
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 650 250" className="w-full max-w-[650px]" role="img" aria-label={pick(["Types as boxes", "型別就像盒子"])}>
      <Box x={20} y={30} w={190} h={120} title="Nat" cls="fill-teal-50 stroke-teal-500" />
      {["0", "1", "2", "3", "…"].map((t, i) => (
        <Val key={t} x={50 + i * 34} y={72} t={t} cls={t === "2" ? "fill-teal-800 font-semibold" : undefined} />
      ))}
      <Val x={115} y={110} t="21  42" cls="fill-gray-500" />
      <Box x={260} y={30} w={230} h={120} title="Int" cls="fill-sky-50 stroke-sky-500" />
      {["…", "-3", "-1", "0", "2", "…"].map((t, i) => (
        <Val key={i} x={285 + i * 36} y={72} t={t} cls={t === "2" ? "fill-sky-800 font-semibold" : undefined} />
      ))}
      <Box x={530} y={30} w={110} h={120} title="String" cls="fill-gray-50 stroke-gray-400" />
      <Val x={585} y={72} t={'"hello"'} />
      <Val x={585} y={100} t={'""  …'} />
      {/* the cast */}
      <path d="M118 58 C150 6, 400 6, 427 56" fill="none" strokeWidth={1.5} strokeDasharray="5 4" className="stroke-gray-500" />
      <polygon points="429,62 420,54 432,51" className="fill-gray-500" />
      <text x={270} y={18} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["↑ cast: (2 : Nat) becomes (2 : Int), a different value", "↑ 轉型：(2 : Nat) 變成 (2 : Int)，是另一個值"])}
      </text>
      {/* -3 has no home in Nat */}
      <text x={322} y={128} textAnchor="middle" fontSize={11} className="fill-red-600">
        {pick(["-3 lives only here", "-3 只住在這裡"])}
      </text>
      {/* a function: from box to box */}
      <rect x={60} y={185} width={150} height={40} rx={8} className="fill-white stroke-teal-500" />
      <text x={135} y={210} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900">
        double : Nat → Nat
      </text>
      <Arrow x1={99} y1={116} x2={99} y2={181} cls="stroke-teal-500" />
      <Arrow x1={170} y1={181} x2={131} y2={118} cls="stroke-teal-500" />
      <text x={240} y={202} fontSize={11} className="fill-gray-600">
        {pick(["a function takes a value from one box", "函數從一個盒子拿一個值，"])}
      </text>
      <text x={240} y={218} fontSize={11} className="fill-gray-600">
        {pick(["and returns a value in another (here the same box)", "還你另一個盒子裡的值（這裡是同一個盒子）"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ propositions as types

/** Statements as boxes whose elements are proofs. A false statement is a box nobody can put anything in. */
export function PropBoxes() {
  const { pick } = useLang();
  const boxes: { x: number; title: string; proofs: string[]; note: L; cls: string }[] = [
    {
      x: 10,
      title: "2 + 2 = 4",
      proofs: ["rfl", "two_add_two"],
      note: ["true: has a proof", "真的：有證明"],
      cls: "fill-amber-50 stroke-amber-500",
    },
    {
      x: 225,
      title: "∀ n : Nat, n + 0 = n",
      proofs: ["fun n => rfl"],
      note: ["true: a proof is a function (n ↦ a proof for n)", "真的：證明是一個函數（n ↦ 對 n 的證明）"],
      cls: "fill-amber-50 stroke-amber-500",
    },
    {
      x: 440,
      title: "2 + 2 = 5",
      proofs: [],
      note: ["false: still a type, but empty", "假的：依然是型別，但是空的"],
      cls: "fill-gray-50 stroke-gray-400",
    },
  ];
  return (
    <svg viewBox="0 0 650 200" className="w-full max-w-[650px]" role="img" aria-label={pick(["Statements as boxes of proofs", "陳述是裝證明的盒子"])}>
      {boxes.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={24} width={200} height={110} rx={12} className={b.cls} strokeWidth={1.5} />
          <rect x={b.x + 10} y={13} width={180} height={22} rx={6} className="fill-white stroke-gray-300" />
          <text x={b.x + 100} y={28} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900 font-semibold">
            {b.title}
          </text>
          {b.proofs.length === 0 ? (
            <text x={b.x + 100} y={88} textAnchor="middle" fontSize={22} className="fill-gray-300">
              ∅
            </text>
          ) : (
            b.proofs.map((p, i) => (
              <g key={p}>
                <rect x={b.x + 30} y={54 + i * 34} width={140} height={26} rx={13} className="fill-white stroke-amber-400" />
                <text x={b.x + 100} y={71 + i * 34} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
                  {p}
                </text>
              </g>
            ))
          )}
          <foreignObject x={b.x} y={140} width={200} height={40}>
            <div style={{ fontSize: 11, lineHeight: 1.3, textAlign: "center" }} className="text-gray-600">
              {pick(b.note)}
            </div>
          </foreignObject>
        </g>
      ))}
      <text x={325} y={194} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick(["“h : P” means “h is in the box P”, that is, “h proves P”", "「h : P」意思是「h 在盒子 P 裡」，也就是「h 證明了 P」"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ the logic moves

const MOVES: { sym: string; name: L; before: string; tactic: string; after: string[]; say: L }[] = [
  {
    sym: "→",
    name: ["if … then", "若……則"],
    before: "P Q : Prop\n⊢ P → Q",
    tactic: "intro hp",
    after: ["P Q : Prop\nhp : P\n⊢ Q"],
    say: ["To prove “if P then Q”: assume P (call it `hp`), then prove Q.", "要證「若 P 則 Q」：假設 P（叫它 `hp`），再證 Q。"],
  },
  {
    sym: "∀",
    name: ["for every", "對所有"],
    before: "⊢ ∀ (n : Nat), n + 0 = n",
    tactic: "intro n",
    after: ["n : Nat\n⊢ n + 0 = n"],
    say: [
      "To prove “for every n”: take an arbitrary `n` you know nothing about, and prove the claim for it.",
      "要證「對所有 n」：取一個你一無所知的任意 `n`，對它證明主張。",
    ],
  },
  {
    sym: "∃",
    name: ["there is", "存在"],
    before: "⊢ ∃ n, n + 2 = 5",
    tactic: "refine ⟨3, ?_⟩",
    after: ["⊢ 3 + 2 = 5"],
    say: ["To prove “there is an n”: name one (the witness `3`), then prove it works.", "要證「存在 n」：指出一個（見證 `3`），再證明它成立。"],
  },
  {
    sym: "∧",
    name: ["and", "且"],
    before: "P Q : Prop\nhp : P\nhq : Q\n⊢ P ∧ Q",
    tactic: "constructor",
    after: ["case left\nP Q : Prop\nhp : P\nhq : Q\n⊢ P", "case right\nP Q : Prop\nhp : P\nhq : Q\n⊢ Q"],
    say: ["To prove “P and Q”: two goals, one for each side.", "要證「P 且 Q」：變成兩個目標，兩邊各一個。"],
  },
  {
    sym: "∨",
    name: ["or (using one)", "或（使用它）"],
    before: "P Q : Prop\nh : P ∨ Q\n⊢ Q ∨ P",
    tactic: "cases h with\n| inl hp => …\n| inr hq => …",
    after: ["case inl\nP Q : Prop\nhp : P\n⊢ Q ∨ P", "case inr\nP Q : Prop\nhq : Q\n⊢ Q ∨ P"],
    say: [
      "To use “P or Q”: you don't know which, so handle both cases, each with its own hypothesis.",
      "要使用「P 或 Q」：你不知道是哪一個，所以兩種情形都要處理，各自帶著自己的前提。",
    ],
  },
];

function Panel({ text, tone }: { text: string; tone: "before" | "after" }) {
  return (
    <pre
      className={`min-w-0 overflow-x-auto rounded-md border p-2 text-[12px] leading-relaxed ${tone === "before" ? "border-amber-300 bg-amber-50 text-amber-950" : "border-emerald-300 bg-emerald-50 text-emerald-950"}`}
      style={{ fontFamily: MONO }}
    >
      {text}
    </pre>
  );
}

/** Pick a logic symbol: the goal panel before the move, the tactic, the goal panel(s) after. */
export function LogicMoves() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const m = MOVES[i];
  return (
    <div className="w-full" data-testid="logic-moves">
      <StepChips labels={MOVES.map((x) => `${x.sym}  ${pick(x.name)}`)} i={i} setI={setI} />
      <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold text-gray-500 uppercase">{pick(["Before", "之前"])}</p>
          <Panel text={m.before} tone="before" />
        </div>
        <div className="flex flex-col items-center text-center">
          <code className="rounded bg-gray-900 px-2 py-1 text-[12px] whitespace-pre text-gray-100" style={{ fontFamily: MONO }}>
            {m.tactic}
          </code>
          <span className="text-lg text-gray-400">→</span>
        </div>
        <div className="min-w-0 space-y-2">
          <p className="mb-1 text-[11px] font-semibold text-gray-500 uppercase">
            {pick(["After", "之後"])} ({m.after.length} {m.after.length === 1 ? pick(["goal", "個目標"]) : pick(["goals", "個目標"])})
          </p>
          {m.after.map((a) => (
            <Panel key={a} text={a} tone="after" />
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-700">
        <RichText text={pick(m.say)} />
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ ℕ, ℤ and ℝ

const SUMS: { expr: string; nat: number | null; int: number; real: number; why: L }[] = [
  {
    expr: "2 - 3",
    nat: 0,
    int: -1,
    real: -1,
    why: ["ℕ has no −1, so subtraction stops at 0 (truncated subtraction).", "ℕ 裡沒有 −1，所以減法停在 0（截斷減法）。"],
  },
  {
    expr: "1 / 2",
    nat: 0,
    int: 0,
    real: 0.5,
    why: ["ℕ and ℤ have no 0.5: division rounds down to 0. Only ℝ (Mathlib) gives 0.5.", "ℕ 和 ℤ 沒有 0.5：除法捨去成 0。只有 ℝ（Mathlib）得到 0.5。"],
  },
  {
    expr: "-7 / 2",
    nat: null,
    int: -4,
    real: -3.5,
    why: [
      "There is no −7 in ℕ. On ℤ, −7 = 2 · (−4) + 1: Lean's `/` keeps the remainder non-negative, so −3.5 becomes −4, not −3.",
      "ℕ 裡沒有 −7。在 ℤ 上，−7 = 2 · (−4) + 1：Lean 的 `/` 讓餘數不為負，所以 −3.5 變成 −4，而不是 −3。",
    ],
  },
  {
    expr: "5 / 0",
    nat: 0,
    int: 0,
    real: 0,
    why: [
      "No sensible answer exists, so all three return the junk value 0 (in Mathlib, `x / 0 = 0` for real `x` too). Theorems that need a real quotient ask for `b ≠ 0`.",
      "沒有合理的答案，所以三者都回傳垃圾值 0（在 Mathlib 中，實數 `x` 也有 `x / 0 = 0`）。需要真正商的定理會要求 `b ≠ 0`。",
    ],
  },
];

/** One expression on three number lines: where the answer lands in ℕ, ℤ and ℝ. */
export function NumberLines() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const s = SUMS[i];
  const X = (v: number) => 110 + (v + 5) * 50;
  const ticks = Array.from({ length: 11 }, (_, k) => k - 5);
  const lines: { y: number; name: string; sub: L; val: number | null; from: number }[] = [
    { y: 40, name: "Nat  ℕ", sub: ["0, 1, 2, …", "0, 1, 2, …"], val: s.nat, from: 0 },
    { y: 110, name: "Int  ℤ", sub: ["…, −1, 0, 1, …", "…, −1, 0, 1, …"], val: s.int, from: -5 },
    { y: 180, name: "ℝ", sub: ["Mathlib", "Mathlib"], val: s.real, from: -5 },
  ];
  return (
    <div className="w-full" data-testid="number-lines">
      <StepChips labels={SUMS.map((x) => x.expr)} i={i} setI={setI} />
      <svg viewBox="0 0 660 220" className="w-full max-w-[660px]" role="img" aria-label={`${s.expr}: ℕ, ℤ, ℝ`}>
        {lines.map((l) => (
          <g key={l.y}>
            <text x={4} y={l.y + 4} fontSize={13} fontFamily={MONO} className="fill-gray-900 font-semibold">
              {l.name}
            </text>
            <text x={4} y={l.y + 20} fontSize={10} className="fill-gray-500">
              {pick(l.sub)}
            </text>
            {l.from === 0 && (
              <text x={X(-2.5)} y={l.y + 4} textAnchor="middle" fontSize={11} className="fill-gray-400">
                {pick(["(no numbers here)", "（這裡沒有數）"])}
              </text>
            )}
            <line
              x1={l.name === "ℝ" ? X(-5) - 10 : X(l.from) - 10}
              y1={l.y}
              x2={X(5) + 10}
              y2={l.y}
              strokeWidth={l.name === "ℝ" ? 2.5 : 1.5}
              className="stroke-gray-300"
            />
            {ticks
              .filter((t) => t >= l.from)
              .map((t) => (
                <g key={t}>
                  {l.name === "ℝ" ? (
                    <line x1={X(t)} y1={l.y - 4} x2={X(t)} y2={l.y + 4} className="stroke-gray-400" />
                  ) : (
                    <circle cx={X(t)} cy={l.y} r={3} className="fill-gray-400" />
                  )}
                  <text x={X(t)} y={l.y + 18} textAnchor="middle" fontSize={10} className="fill-gray-500">
                    {t}
                  </text>
                </g>
              ))}
            {l.val === null ? (
              <text x={X(2.5)} y={l.y - 10} textAnchor="middle" fontSize={11} className="fill-red-600">
                {pick(["−7 is not a Nat: Lean rejects (-7 : Nat)", "−7 不是 Nat：Lean 拒絕 (-7 : Nat)"])}
              </text>
            ) : (
              <g className="motion-safe:transition-transform motion-safe:duration-500" style={{ transform: `translateX(${X(l.val)}px)` }}>
                <circle cx={0} cy={l.y} r={8} className={l.name === "ℝ" ? "fill-violet-500" : "fill-teal-600"} />
                <text x={0} y={l.y - 13} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900 font-semibold">
                  {l.val}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <p className="mt-1 text-sm text-gray-700">
        <code className="rounded bg-gray-100 px-1 text-gray-800" style={{ fontFamily: MONO }}>
          {s.expr}
        </code>{" "}
        <RichText text={pick(s.why)} />
      </p>
    </div>
  );
}
