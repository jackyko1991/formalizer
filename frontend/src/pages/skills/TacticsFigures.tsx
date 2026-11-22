/**
 * Coding Skills ▸ First tactics: the pictures (the Feynman way: draw the goal, then watch a tactic change it).
 *   TacticShapes      what any tactic does to one goal: close it, change it, or split it
 *   TacticStepper     step through intro / constructor / rw / cases / induction and watch the goal panel change
 *   AutomationMatrix  rfl, decide, simp, omega as boxes: which goals each one closes, with Lean's real answer
 * Also exports GoalView and GoalStepper, used by the Structure figures.
 * Every goal state drawn here is what Lean v4.34.1 prints (checked with `trace_state`); the code of each stepper is
 * in lean/Formalizer/Pages/Tactics.lean (snippets `step-*`), so CI compiles it.
 * Colours follow the site: amber = still open, green = new or proved, sky = the part a tactic is about to touch.
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { snippet } from "../kit";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

// ------------------------------------------------------------------------------------------------ goal view

/** A piece of a target: plain text, or a highlighted subterm ("next": a tactic is about to rewrite it; "new": just written). */
export type Seg = string | readonly [string, "next" | "new"];
export interface GoalState {
  kase?: string;
  /** hypotheses; `fresh` ones were added by the last tactic (green) */
  hyps: { t: string; fresh?: boolean }[];
  target: Seg[];
}

const SEG_CLS = {
  next: "rounded bg-sky-100 px-0.5 text-sky-900 ring-1 ring-sky-300",
  new: "rounded bg-emerald-100 px-0.5 text-emerald-900 ring-1 ring-emerald-300",
} as const;

/** One goal as Lean's goal panel shows it: case name, hypotheses, a line, ⊢ target. */
export function GoalView({ g, first = false }: { g: GoalState; first?: boolean }) {
  const { pick } = useLang();
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white motion-safe:transition-colors motion-safe:duration-300 ${first ? "border-amber-400" : "border-gray-200"}`}
    >
      {(g.kase || first) && (
        <p className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1 text-[11px] text-gray-500">
          {g.kase && <span className="rounded bg-gray-200 px-1.5 font-mono text-gray-700">case {g.kase}</span>}
          {first && <span className="text-amber-700">{pick(["← the next tactic works here", "← 下一個戰術作用在這裡"])}</span>}
        </p>
      )}
      <div className="px-3 py-2 font-mono text-xs leading-relaxed">
        {g.hyps.map((h) => (
          <p
            key={h.t}
            className={`motion-safe:transition-colors motion-safe:duration-500 ${h.fresh ? "rounded bg-emerald-50 text-emerald-800" : "text-gray-700"}`}
          >
            {h.t}
          </p>
        ))}
        <p className="mt-0.5 border-t border-gray-300 pt-0.5 text-gray-900">
          ⊢{" "}
          {g.target.map((s, i) =>
            typeof s === "string" ? (
              <span key={i}>{s}</span>
            ) : (
              <span key={i} className={SEG_CLS[s[1]]}>
                {s[0]}
              </span>
            ),
          )}
        </p>
      </div>
    </div>
  );
}

export interface Step {
  /** the line of code just run (0-based index into the stepper's code lines; 0 = the statement, before any tactic) */
  line: number;
  goals: GoalState[];
  note: L;
}

/**
 * A stepper: the code on the left with the line just run marked, the goal panel on the right after that line.
 * `code` is checked Lean (a snippet); each step points at one of its lines.
 */
export function GoalStepper({ code, steps, testId }: { code: string; steps: Step[]; testId?: string }) {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const s = steps[Math.min(i, steps.length - 1)];
  const lines = code.split("\n");
  return (
    <div className="w-full space-y-3" data-testid={testId}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-[12px] leading-relaxed text-gray-300">
          {lines.map((l, k) => (
            <div
              key={k}
              className={`-mx-1 rounded px-1 motion-safe:transition-colors motion-safe:duration-300 ${
                k === s.line ? "bg-sky-700/60 text-white" : k < s.line ? "text-gray-100" : "text-gray-500"
              }`}
            >
              {l || " "}
            </div>
          ))}
        </pre>
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            {pick(s.goals.length === 0 ? ["Goals", "目標"] : [`Goals (${s.goals.length})`, `目標（${s.goals.length}）`])}
          </p>
          {s.goals.length === 0 ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              ✓ {pick(["No goals: proved", "沒有目標：證明完成"])}
            </div>
          ) : (
            s.goals.map((g, k) => <GoalView key={`${i}-${k}`} g={g} first={s.goals.length > 1 && k === 0} />)
          )}
        </div>
      </div>
      <p className="min-h-[3rem] text-sm leading-relaxed text-gray-700">
        <RichText text={pick(s.note)} />
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setI((k) => Math.max(0, k - 1))}
          disabled={i === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs disabled:opacity-40"
        >
          ◂ {pick(["Back", "上一步"])}
        </button>
        <button
          onClick={() => setI((k) => Math.min(steps.length - 1, k + 1))}
          disabled={i === steps.length - 1}
          className="rounded-md bg-(--lk-accent) px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          data-testid={testId ? `${testId}-next` : undefined}
        >
          {pick(["Run the next line", "執行下一行"])} ▸
        </button>
        <span className="ml-1 flex gap-1" aria-hidden>
          {steps.map((_, k) => (
            <span key={k} className={`h-1.5 w-4 rounded-full ${k <= i ? "bg-(--lk-accent)" : "bg-gray-200"}`} />
          ))}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ what a tactic does

/** One goal in, then: no goal (closed), one changed goal, or several goals. */
export function TacticShapes() {
  const { pick } = useLang();
  const goal = (x: number, y: number, w: number, label: string, cls = "fill-amber-50 stroke-amber-500") => (
    <g>
      <rect x={x} y={y} width={w} height={34} rx={7} className={cls} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
        {label}
      </text>
    </g>
  );
  const rows: { y: number; tac: string; what: L }[] = [
    { y: 20, tac: "rfl", what: ["closes it", "直接關掉"] },
    { y: 90, tac: "intro n", what: ["changes it", "把它換掉"] },
    { y: 160, tac: "constructor", what: ["splits it", "拆成幾個"] },
  ];
  return (
    <svg
      viewBox="0 0 640 220"
      className="w-full max-w-[640px]"
      role="img"
      aria-label={pick(["Three things a tactic can do to a goal", "戰術對目標能做的三件事"])}
    >
      {rows.map((r) => (
        <g key={r.tac}>
          <text x={14} y={r.y + 22} fontSize={12} className="fill-gray-500">
            {pick(r.what)}
          </text>
          {goal(96, r.y, 170, r.tac === "rfl" ? "⊢ 2 + 2 = 4" : r.tac === "intro n" ? "⊢ ∀ n, n + 0 = n" : "⊢ 2 + 2 = 4 ∧ 3 < 5")}
          <line x1={270} y1={r.y + 17} x2={330} y2={r.y + 17} strokeWidth={1.6} className="stroke-gray-400" />
          <polygon points={`336,${r.y + 17} 328,${r.y + 12} 328,${r.y + 22}`} className="fill-gray-400" />
          <rect x={269} y={r.y + 1} width={66} height={14} rx={3} className="fill-gray-900" />
          <text x={302} y={r.y + 12} textAnchor="middle" fontSize={9.5} fontFamily={MONO} className="fill-white">
            {r.tac}
          </text>
        </g>
      ))}
      {/* closed */}
      <rect x={342} y={20} width={130} height={34} rx={17} className="fill-emerald-50 stroke-emerald-500" strokeWidth={1.5} />
      <text x={407} y={42} textAnchor="middle" fontSize={12} className="fill-emerald-800">
        ✓ {pick(["no goal left", "沒有目標了"])}
      </text>
      {/* changed */}
      <rect x={342} y={90} width={200} height={34} rx={7} className="fill-amber-50 stroke-amber-500" strokeWidth={1.5} />
      <text x={352} y={111} fontSize={12} fontFamily={MONO} className="fill-gray-800">
        <tspan className="fill-emerald-700">n : Nat</tspan> ⊢ n + 0 = n
      </text>
      {/* split */}
      {goal(342, 160, 120, "⊢ 2 + 2 = 4")}
      {goal(470, 160, 100, "⊢ 3 < 5")}
      <text x={590} y={182} fontSize={11} className="fill-gray-500">
        {pick(["2 goals", "2 個目標"])}
      </text>
      <text x={320} y={214} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick(["amber = still to prove; the proof is done when no amber box is left", "琥珀色 = 還要證；沒有琥珀色方塊時，證明就完成了"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ the stepper

const H = (t: string, fresh = false) => ({ t, fresh });

const DEMOS: { id: string; label: string; code: string; steps: Step[] }[] = [
  {
    id: "intro",
    label: "intro",
    code: snippet("Tactics", "step-intro"),
    steps: [
      {
        line: 0,
        goals: [{ hyps: [H("p q : Prop")], target: ["p → q → p"] }],
        note: [
          "The goal is an *if … then …*: if `p`, then (if `q`, then `p`). Nothing is assumed yet except that `p` and `q` are statements.",
          "目標是一個「若……則……」：若 `p`，則（若 `q` 則 `p`）。目前除了 `p`、`q` 是命題以外，什麼都還沒假設。",
        ],
      },
      {
        line: 1,
        goals: [{ hyps: [H("p q : Prop"), H("hp : p", true), H("hq : q", true)], target: ["p"] }],
        note: [
          '`intro hp hq` is "assume `p`, call it `hp`; assume `q`, call it `hq`". The two assumptions move **above the line** (green) and only the conclusion `p` is left below.',
          "`intro hp hq` 就是「假設 `p`，叫它 `hp`；假設 `q`，叫它 `hq`」。兩個假設移到 **橫線上方**（綠色），橫線下只剩結論 `p`。",
        ],
      },
      {
        line: 2,
        goals: [],
        note: [
          "`exact hp`: the goal is `p` and `hp` is a proof of `p`, so it fits exactly. No goal is left.",
          "`exact hp`：目標是 `p`，而 `hp` 就是 `p` 的證明，剛好吻合。沒有目標剩下。",
        ],
      },
    ],
  },
  {
    id: "constructor",
    label: "constructor",
    code: snippet("Tactics", "step-constructor"),
    steps: [
      {
        line: 0,
        goals: [{ hyps: [], target: ["2 + 2 = 4 ∧ 3 < 5"] }],
        note: ["One goal, an *and*: two facts to prove.", "一個目標，是個「且」：要證兩件事。"],
      },
      {
        line: 1,
        goals: [
          { kase: "left", hyps: [], target: ["2 + 2 = 4"] },
          { kase: "right", hyps: [], target: ["3 < 5"] },
        ],
        note: [
          "`constructor` splits it: two goals, named `left` and `right`. The next tactic works on the **first** one (amber frame).",
          "`constructor` 把它拆開：兩個目標，名叫 `left` 和 `right`。下一個戰術作用在 **第一個**（琥珀色框）。",
        ],
      },
      {
        line: 2,
        goals: [{ kase: "right", hyps: [], target: ["3 < 5"] }],
        note: ["`· rfl` closes `left` by computation; `right` is now the only goal.", "`· rfl` 用計算關掉 `left`；現在只剩 `right`。"],
      },
      { line: 3, goals: [], note: ["`· decide` checks `3 < 5`. Done.", "`· decide` 檢查 `3 < 5`。完成。"] },
    ],
  },
  {
    id: "rw",
    label: "rw",
    code: snippet("Tactics", "step-rw"),
    steps: [
      {
        line: 0,
        goals: [{ hyps: [H("a b c : Nat"), H("h₁ : a = b"), H("h₂ : b = c")], target: [["a", "next"], " = c"] }],
        note: [
          "`rw [h₁]` will look for the left side of `h₁ : a = b`, that is `a`, in the target (blue).",
          "`rw [h₁]` 會在目標裡找 `h₁ : a = b` 的左邊，也就是 `a`（藍色）。",
        ],
      },
      {
        line: 1,
        goals: [{ hyps: [H("a b c : Nat"), H("h₁ : a = b"), H("h₂ : b = c")], target: [["b", "new"], " = c"] }],
        note: [
          "Every `a` became `b` (green). The hypotheses don't change: `rw` rewrites the target only, unless you write `rw [h₁] at h`.",
          "每個 `a` 都換成了 `b`（綠色）。前提不變：`rw` 只改寫目標，除非你寫 `rw [h₁] at h`。",
        ],
      },
      {
        line: 2,
        goals: [],
        note: [
          "`rw [h₂]` turns `b` into `c`, giving `c = c`, and `rw` closes a goal of the form `x = x` on its own (it tries `rfl` after rewriting).",
          "`rw [h₂]` 把 `b` 換成 `c`，得到 `c = c`；`rw` 改寫後會自己試 `rfl`，所以 `x = x` 這種目標當場就關掉了。",
        ],
      },
    ],
  },
  {
    id: "cases",
    label: "cases",
    code: snippet("Tactics", "step-cases"),
    steps: [
      {
        line: 0,
        goals: [{ hyps: [H("p q : Prop"), H("h : p ∨ q")], target: ["q ∨ p"] }],
        note: [
          "We know `p ∨ q` but not *which* side holds. On paper: *case 1, `p` holds; case 2, `q` holds*.",
          "我們知道 `p ∨ q`，但不知道是 *哪一邊* 成立。紙上會寫：*情況一，`p` 成立；情況二，`q` 成立*。",
        ],
      },
      {
        line: 1,
        goals: [
          { kase: "inl", hyps: [H("p q : Prop"), H("hp : p", true)], target: ["q ∨ p"] },
          { kase: "inr", hyps: [H("p q : Prop"), H("hq : q", true)], target: ["q ∨ p"] },
        ],
        note: [
          "`cases h with` branches: in case `inl` we have `hp : p`, in case `inr` we have `hq : q`. The hypothesis `h` is gone from both: it has been taken apart. Same target, different facts.",
          "`cases h with` 分出兩支：情況 `inl` 有 `hp : p`，情況 `inr` 有 `hq : q`。兩邊的 `h` 都不見了：它被拆開了。目標一樣，已知的事實不同。",
        ],
      },
      {
        line: 2,
        goals: [{ kase: "inr", hyps: [H("p q : Prop"), H("hq : q")], target: ["q ∨ p"] }],
        note: ["`p` holds, so the right side of `q ∨ p` does: `Or.inr hp`.", "`p` 成立，所以 `q ∨ p` 的右邊成立：`Or.inr hp`。"],
      },
      { line: 3, goals: [], note: ["`q` holds: the left side, `Or.inl hq`. Both cases done.", "`q` 成立：左邊，`Or.inl hq`。兩種情況都完成。"] },
    ],
  },
  {
    id: "induction",
    label: "induction",
    code: snippet("Tactics", "step-induction"),
    steps: [
      {
        line: 0,
        goals: [{ hyps: [H("n : Nat")], target: ["0 + n = n"] }],
        note: [
          "`0 + n = n` is not `rfl`: addition computes on its *right* argument, and `n` is unknown. It needs induction on `n`.",
          "`0 + n = n` 不能用 `rfl`：加法是對 *右邊* 的參數計算，而 `n` 未知。要對 `n` 做歸納。",
        ],
      },
      {
        line: 1,
        goals: [
          { kase: "zero", hyps: [], target: ["0 + 0 = 0"] },
          { kase: "succ", hyps: [H("m : Nat", true), H("ih : 0 + m = m", true)], target: ["0 + (m + 1) = m + 1"] },
        ],
        note: [
          "`induction n with` makes two goals: the **base case** `zero` (`n` is 0), and the **step** `succ` (`n` is `m + 1`), where `ih`, the induction hypothesis, is the statement for `m`.",
          "`induction n with` 產生兩個目標：**基本情況** `zero`（`n` 是 0），以及 **歸納步驟** `succ`（`n` 是 `m + 1`），其中 `ih` 是歸納假設，也就是對 `m` 的陳述。",
        ],
      },
      {
        line: 2,
        goals: [
          { kase: "succ", hyps: [H("m : Nat"), H("ih : 0 + m = m")], target: ["0 + (m + 1) = m + 1"] },
        ],
        note: ["`0 + 0` computes to `0`: `rfl`.", "`0 + 0` 算出來就是 `0`：`rfl`。"],
      },
      {
        line: 4,
        goals: [{ kase: "succ", hyps: [H("m : Nat"), H("ih : 0 + m = m")], target: [["0 + m", "next"], " + 1 = m + 1"] }],
        note: [
          "`rw [← Nat.add_assoc]` regroups `0 + (m + 1)` as `0 + m + 1`, which is `(0 + m) + 1`. Now `0 + m`, the left side of `ih`, appears in the target (blue).",
          "`rw [← Nat.add_assoc]` 把 `0 + (m + 1)` 重新分組成 `0 + m + 1`，也就是 `(0 + m) + 1`。現在 `ih` 的左邊 `0 + m` 出現在目標裡了（藍色）。",
        ],
      },
      {
        line: 5,
        goals: [],
        note: [
          "`rw [ih]` turns `0 + m` into `m`: `m + 1 = m + 1`, closed. That is induction: the step used the case before it.",
          "`rw [ih]` 把 `0 + m` 換成 `m`：`m + 1 = m + 1`，關掉。這就是歸納法：每一步都用上前一個情況。",
        ],
      },
    ],
  },
];

/** Pick a tactic, then run its example line by line and watch the goal panel. */
export function TacticStepper() {
  const { pick } = useLang();
  const [d, setD] = useState(0);
  const demo = DEMOS[d];
  return (
    <div className="w-full" data-testid="tactic-stepper">
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <span className="mr-1 text-xs text-gray-500">{pick(["Tactic:", "戰術："])}</span>
        {DEMOS.map((x, k) => (
          <button
            key={x.id}
            onClick={() => setD(k)}
            aria-pressed={k === d}
            className={`rounded-full px-3 py-1 font-mono text-xs ${k === d ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <GoalStepper key={demo.id} code={demo.code} steps={demo.steps} testId={`stepper-${demo.id}`} />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ automation boxes

type Verdict = "ok" | "part" | "no";
const BOXES: { tac: string; does: L; cant: L }[] = [
  {
    tac: "rfl",
    does: ["computes both sides", "把兩邊算出來"],
    cant: ["equal only *for a reason*", "只是「有理由」相等"],
  },
  {
    tac: "decide",
    does: ["runs a yes/no check", "執行一個是非檢查"],
    cant: ["any unknown variable", "任何未知的變數"],
  },
  {
    tac: "simp",
    does: ["rewrites with known rules", "用已知規則改寫"],
    cant: ["steps that aren't simplifications", "不算化簡的步驟"],
  },
  {
    tac: "omega",
    does: ["linear + − ≤ < on Nat, Int", "Nat、Int 上的線性 + − ≤ <"],
    cant: ["variable × variable; lists", "變數 × 變數；串列"],
  },
];
const GOALS: { goal: string; v: [Verdict, Verdict, Verdict, Verdict]; why: [string, string, string, string] }[] = [
  { goal: "2 + 2 = 4", v: ["ok", "ok", "ok", "ok"], why: ["", "", "", ""] },
  {
    goal: "n + 0 = n",
    v: ["ok", "no", "ok", "ok"],
    why: ["", "Expected type must not contain free variables", "", ""],
  },
  {
    goal: "∀ n < 10, n * n % 10 ≠ 2",
    v: ["no", "ok", "part", "no"],
    why: [
      "Tactic `rfl` failed: Expected the goal to be a binary relation",
      "",
      "unsolved goals\n⊢ ∀ (n : Nat), n < 10 → ¬n * n % 10 = 2",
      "omega could not prove the goal (n * n is not linear)",
    ],
  },
  {
    goal: "a + b = b + a",
    v: ["no", "no", "no", "ok"],
    why: [
      "The left-hand side  a + b\nis not definitionally equal to the right-hand side  b + a",
      "Expected type must not contain free variables",
      "`simp` made no progress",
      "",
    ],
  },
  {
    goal: "h₁ : 3 < n, h₂ : n < 5 ⊢ n = 4",
    v: ["no", "no", "no", "ok"],
    why: [
      "The left-hand side  n\nis not definitionally equal to the right-hand side  4",
      "Expected type must not contain free variables",
      "`simp` made no progress",
      "",
    ],
  },
  {
    goal: "a - 5 ≤ a",
    v: ["no", "no", "ok", "ok"],
    why: [
      "The left-hand side  a - 5\nis not definitionally equal to the right-hand side  a",
      "Expected type must not contain free variables",
      "",
      "",
    ],
  },
  {
    goal: "xs.reverse.reverse = xs",
    v: ["no", "no", "ok", "no"],
    why: [
      "The left-hand side  xs.reverse.reverse\nis not definitionally equal to the right-hand side  xs",
      "Expected type must not contain free variables",
      "",
      "omega could not prove the goal:\nNo usable constraints found.",
    ],
  },
  {
    goal: "a * b = b * a",
    v: ["no", "no", "no", "no"],
    why: [
      "The left-hand side  a * b\nis not definitionally equal to the right-hand side  b * a",
      "Expected type must not contain free variables",
      "`simp` made no progress",
      "omega could not prove the goal:\n  c := ↑b * ↑a\n  d := ↑a * ↑b  (two unrelated unknowns)",
    ],
  },
];
const MARK: Record<Verdict, { s: string; cls: string }> = {
  ok: { s: "✓", cls: "bg-emerald-50 text-emerald-700 ring-emerald-300" },
  part: { s: "◐", cls: "bg-amber-50 text-amber-700 ring-amber-300" },
  no: { s: "✖", cls: "bg-red-50 text-red-600 ring-red-200" },
};

/** The one-step tactics as boxes: what each can and can't do, and a grid of real goals; click a cell to read Lean's answer. */
export function AutomationMatrix() {
  const { pick } = useLang();
  const [sel, setSel] = useState<[number, number]>([3, 2]);
  const [r, c] = sel;
  const v = GOALS[r].v[c];
  return (
    <div className="w-full space-y-3" data-testid="automation-matrix">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {BOXES.map((b, k) => (
          <div
            key={b.tac}
            className={`rounded-lg border-2 bg-white p-2 text-xs motion-safe:transition-colors ${k === c ? "border-(--lk-accent)" : "border-gray-200"}`}
          >
            <p className="font-mono text-sm font-semibold text-gray-900">{b.tac}</p>
            <p className="mt-1 text-emerald-800">
              ✓ <RichText text={pick(b.does)} />
            </p>
            <p className="text-red-700">
              ✖ <RichText text={pick(b.cant)} />
            </p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="px-2 py-1 font-medium">{pick(["Goal", "目標"])}</th>
              {BOXES.map((b) => (
                <th key={b.tac} className="px-2 py-1 text-center font-mono font-medium">
                  {b.tac}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GOALS.map((g, i) => (
              <tr key={g.goal} className={i === r ? "bg-sky-50/60" : ""}>
                <td className="px-2 py-1 font-mono whitespace-nowrap text-gray-800">{g.goal}</td>
                {g.v.map((x, j) => (
                  <td key={j} className="px-1 py-0.5 text-center">
                    <button
                      onClick={() => setSel([i, j])}
                      aria-pressed={i === r && j === c}
                      aria-label={`${BOXES[j].tac}: ${g.goal}`}
                      className={`h-7 w-9 rounded-md ring-1 ${MARK[x].cls} ${i === r && j === c ? "outline-2 outline-offset-1 outline-(--lk-accent)" : ""}`}
                    >
                      {MARK[x].s}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
        <p className="text-gray-600">
          <span className="font-mono">
            example … : {GOALS[r].goal} := by {BOXES[c].tac}
          </span>
        </p>
        {v === "ok" ? (
          <p className="mt-1 text-emerald-700">✓ {pick(["Lean accepts it.", "Lean 接受。"])}</p>
        ) : (
          <>
            <p className={`mt-1 ${v === "part" ? "text-amber-700" : "text-red-700"}`}>
              {pick(
                v === "part"
                  ? ["◐ It made progress but left a goal:", "◐ 有進展，但留下一個目標："]
                  : ["✖ Lean answers:", "✖ Lean 回答："],
              )}
            </p>
            <pre className="mt-1 font-mono whitespace-pre-wrap text-gray-800">{GOALS[r].why[c]}</pre>
          </>
        )}
      </div>
    </div>
  );
}
