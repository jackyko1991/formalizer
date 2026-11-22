/**
 * Coding Skills ▸ Structuring a proof: the pictures (proof architecture).
 *   HaveSuffices  the same proof forwards (`have`: build the fact, then finish) and backwards (`suffices`: finish, then
 *                 build the fact), with the goal Lean shows at each point
 *   CalcChain     a `calc` chain as links: each step has its own reason, Lean composes the relations
 *   ProofTree     a stepper: the worked example built as a tree of `sorry`s, filled one by one until none is left
 * Goal states are what Lean v4.34.1 prints (checked with `trace_state`); the code of each stage is a snippet in
 * lean/Formalizer/Pages/Structure.lean (`plan-1` … `plan-4`, `worked`), so CI compiles it.
 * Colours: amber = open (`sorry`), sky = assembled from parts still open, green = proved.
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { snippet } from "../kit";
import { GoalView, type GoalState } from "./TacticsFigures";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

// ------------------------------------------------------------------------------------------------ have vs suffices

const HYPS = [{ t: "xs : List Nat" }, { t: "h : xs.length = 3" }];
const LEN: GoalState = { hyps: HYPS, target: ["(xs ++ xs).length = xs.length + xs.length"] };
const MAIN_WITH: GoalState = {
  hyps: [...HYPS, { t: "hlen : (xs ++ xs).length = xs.length + xs.length", fresh: true }],
  target: ["(xs ++ xs).length = 6"],
};

function Col({ title, sub, rows }: { title: string; sub: L; rows: { code: string; g?: GoalState; done?: boolean }[] }) {
  const { pick } = useLang();
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-sm">
        <span className="font-mono font-semibold text-gray-900">{title}</span>{" "}
        <span className="text-gray-500">
          <RichText text={pick(sub)} />
        </span>
      </p>
      {rows.map((r, i) => (
        <div key={i} className="space-y-1">
          <pre className="overflow-x-auto rounded bg-gray-900 px-2 py-1 font-mono text-[11px] text-gray-100">{r.code}</pre>
          {r.g && <GoalView g={r.g} />}
          {r.done && (
            <p className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
              ✓ {pick(["no goals", "沒有目標"])}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Forwards and backwards: `have` proves the stepping stone first; `suffices` first says it is enough, then proves it. */
export function HaveSuffices() {
  return (
    <div className="grid w-full gap-4 text-left md:grid-cols-2" data-testid="have-suffices">
      <Col
        title="have"
        sub={["forwards: from what you know towards the goal", "往前推：從已知走向目標"]}
        rows={[
          { code: "have hlen : … := by", g: LEN },
          { code: "    simp", g: MAIN_WITH },
          { code: "  omega", done: true },
        ]}
      />
      <Col
        title="suffices"
        sub={["backwards: from the goal towards what you know", "往回推：從目標走回已知"]}
        rows={[
          { code: "suffices hlen : … by\n    omega", g: LEN },
          { code: "  simp", done: true },
        ]}
      />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ calc

/** a < b ≤ c < c + 1: one link per line, each with its reason; the composed fact underneath. */
export function CalcChain() {
  const { pick } = useLang();
  const xs = [60, 200, 340, 500];
  const terms = ["a", "b", "c", "c + 1"];
  const rels = ["<", "≤", "<"];
  const why = ["h₁", "h₂", "Nat.lt_succ_self c"];
  return (
    <svg viewBox="0 0 580 200" className="w-full max-w-[580px]" role="img" aria-label={pick(["A calc chain", "一條 calc 鏈"])}>
      {terms.map((t, i) => (
        <g key={t}>
          <rect x={xs[i] - 34} y={40} width={68} height={34} rx={8} className="fill-white stroke-gray-400" strokeWidth={1.5} />
          <text x={xs[i]} y={62} textAnchor="middle" fontSize={14} fontFamily={MONO} className="fill-gray-900">
            {t}
          </text>
        </g>
      ))}
      {rels.map((r, i) => {
        const x1 = xs[i] + 34;
        const x2 = xs[i + 1] - 34;
        const m = (x1 + x2) / 2;
        return (
          <g key={i}>
            <line x1={x1} y1={57} x2={x2} y2={57} strokeWidth={1.6} className="stroke-teal-600" />
            <circle cx={m} cy={57} r={11} className="fill-teal-50 stroke-teal-600" />
            <text x={m} y={62} textAnchor="middle" fontSize={13} fontFamily={MONO} className="fill-teal-900">
              {r}
            </text>
            <text x={m} y={22} textAnchor="middle" fontSize={11} fontFamily={MONO} className="fill-gray-600">
              := {why[i]}
            </text>
          </g>
        );
      })}
      <path d={`M${xs[0]} 76 C${xs[0]} 130, ${xs[3]} 130, ${xs[3]} 80`} fill="none" strokeWidth={1.8} className="stroke-emerald-500" />
      <polygon points={`${xs[3]},76 ${xs[3] - 5},86 ${xs[3] + 5},86`} className="fill-emerald-500" />
      <rect x={210} y={108} width={160} height={30} rx={15} className="fill-emerald-50 stroke-emerald-500" />
      <text x={290} y={128} textAnchor="middle" fontSize={13} fontFamily={MONO} className="fill-emerald-900">
        a &lt; c + 1
      </text>
      <text x={290} y={162} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["Lean composes the links: < then ≤ gives <, and < then < gives <", "Lean 把各環接起來：< 接 ≤ 得 <，< 接 < 得 <"])}
      </text>
      <text x={290} y={180} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["one broken link? write `by sorry` there; the rest is still checked", "某一環還沒證？那裡先寫 `by sorry`；其餘照樣檢查"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ the tree of sorrys

type St = "open" | "work" | "done" | "none";
type NodeId = "main" | "h" | "lemma" | "zero" | "succ" | "c1" | "c2" | "c3" | "c4";
const POS: Record<NodeId, [number, number, number, string]> = {
  main: [210, 28, 140, "square_add_even"],
  h: [80, 96, 84, "have h"],
  lemma: [270, 96, 140, "consecutive_even"],
  zero: [190, 164, 64, "zero"],
  succ: [330, 164, 64, "succ"],
  c1: [252, 228, 38, "1"],
  c2: [302, 228, 38, "2"],
  c3: [352, 228, 38, "3"],
  c4: [402, 228, 38, "4"],
};
const EDGES: [NodeId, NodeId][] = [
  ["main", "h"],
  ["main", "lemma"],
  ["lemma", "zero"],
  ["lemma", "succ"],
  ["succ", "c1"],
  ["succ", "c2"],
  ["succ", "c3"],
  ["succ", "c4"],
];
const NODE: Record<Exclude<St, "none">, { cls: string; mark: string }> = {
  open: { cls: "fill-amber-50 stroke-amber-500", mark: "◐" },
  work: { cls: "fill-sky-50 stroke-sky-500", mark: "↳" },
  done: { cls: "fill-emerald-50 stroke-emerald-500", mark: "✓" },
};

const SUCC_H = [{ t: "m k : Nat" }, { t: "hk : m * (m + 1) = 2 * k" }];
interface Stage {
  title: L;
  text: L;
  code: string;
  nodes: Partial<Record<NodeId, St>>;
  open: { at: string; g: GoalState }[];
}
const STAGES: Stage[] = [
  {
    title: ["1 · The plan", "1 · 計畫"],
    text: [
      "Write the statements first, and prove the main theorem *from* them, with `sorry` for everything else. Lean already checks the plan: if `obtain` and `exact` are accepted, the main theorem follows from the two holes. Two amber holes, two goals.",
      "先寫出陳述，並 *由它們* 證出主定理，其他全部寫 `sorry`。Lean 現在就會檢查這個計畫：如果 `obtain` 和 `exact` 被接受，主定理就能由那兩個洞推出。兩個琥珀色的洞，兩個目標。",
    ],
    code: snippet("Structure", "plan-1"),
    nodes: { main: "work", h: "open", lemma: "open" },
    open: [
      { at: "have h", g: { hyps: [{ t: "n : Nat" }], target: ["n * n + n = n * (n + 1)"] } },
      { at: "consecutive_even", g: { hyps: [{ t: "n : Nat" }], target: ["∃ k, n * (n + 1) = 2 * k"] } },
    ],
  },
  {
    title: ["2 · The easy hole", "2 · 簡單的洞"],
    text: [
      "`h` is algebra: distribute, then `n * 1 = n`. Two rewrites, and that hole is closed. The main theorem now waits only on the lemma.",
      "`h` 是代數：展開，再用 `n * 1 = n`。兩次改寫，這個洞就關掉了。現在主定理只等引理。",
    ],
    code: snippet("Structure", "plan-2"),
    nodes: { main: "work", h: "done", lemma: "open" },
    open: [{ at: "consecutive_even", g: { hyps: [{ t: "n : Nat" }], target: ["∃ k, n * (n + 1) = 2 * k"] } }],
  },
  {
    title: ["3 · Split the lemma", "3 · 拆開引理"],
    text: [
      "The lemma is the real work. `induction n with` replaces one hole by two smaller ones: the base case and the step, where `ih` is the statement for `m`.",
      "引理才是真正的工作。`induction n with` 把一個洞換成兩個較小的：基本情況與歸納步驟，其中 `ih` 是對 `m` 的陳述。",
    ],
    code: snippet("Structure", "plan-3"),
    nodes: { main: "work", h: "done", lemma: "work", zero: "open", succ: "open" },
    open: [
      { at: "zero", g: { kase: "zero", hyps: [], target: ["∃ k, 0 * (0 + 1) = 2 * k"] } },
      {
        at: "succ",
        g: {
          kase: "succ",
          hyps: [{ t: "m : Nat" }, { t: "ih : ∃ k, m * (m + 1) = 2 * k" }],
          target: ["∃ k, (m + 1) * (m + 1 + 1) = 2 * k"],
        },
      },
    ],
  },
  {
    title: ["4 · Lay out the step", "4 · 鋪開歸納步驟"],
    text: [
      "Base case: `k = 0` works by computation. Step: unpack `ih` into `k` and `hk`, choose the new witness `k + (m + 1)`, and write the paper computation as a `calc` whose four links are still `sorry`. Each is now a small, separate equation.",
      "基本情況：`k = 0`，計算即成立。歸納步驟：把 `ih` 拆成 `k` 與 `hk`，選定新見證 `k + (m + 1)`，再把紙上的計算寫成 `calc`，四個環節暫時都是 `sorry`。每一個都成了小而獨立的等式。",
    ],
    code: snippet("Structure", "plan-4"),
    nodes: { main: "work", h: "done", lemma: "work", zero: "done", succ: "work", c1: "open", c2: "open", c3: "open", c4: "open" },
    open: [
      { at: "calc 1", g: { hyps: SUCC_H, target: ["(m + 1) * (m + 1 + 1) = (m + 2) * (m + 1)"] } },
      { at: "calc 2", g: { hyps: SUCC_H, target: ["(m + 2) * (m + 1) = m * (m + 1) + 2 * (m + 1)"] } },
      { at: "calc 3", g: { hyps: SUCC_H, target: ["m * (m + 1) + 2 * (m + 1) = 2 * k + 2 * (m + 1)"] } },
      { at: "calc 4", g: { hyps: SUCC_H, target: ["2 * k + 2 * (m + 1) = 2 * (k + (m + 1))"] } },
    ],
  },
  {
    title: ["5 · No sorry left", "5 · 沒有 sorry 了"],
    text: [
      "Each link is one rewrite (`Nat.mul_comm`, `Nat.add_mul`, `hk`) or `omega`. Every node is green, so both theorems are proved; `#print axioms square_add_even` would now show no `sorryAx`.",
      "每一環都是一次改寫（`Nat.mul_comm`、`Nat.add_mul`、`hk`）或 `omega`。每個節點都綠了，兩個定理都證完；這時 `#print axioms square_add_even` 不會再出現 `sorryAx`。",
    ],
    code: snippet("Structure", "worked"),
    nodes: { main: "done", h: "done", lemma: "done", zero: "done", succ: "done", c1: "done", c2: "done", c3: "done", c4: "done" },
    open: [],
  },
];

/** The worked example as architecture: a tree of `sorry`s, filled one stage at a time. */
export function ProofTree() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const s = STAGES[i];
  const st = (k: NodeId): St => s.nodes[k] ?? "none";
  return (
    <div className="w-full text-left" data-testid="proof-tree">
      <div className="mb-3 flex flex-wrap gap-1">
        {STAGES.map((x, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            aria-pressed={k === i}
            className={`rounded-full px-3 py-1 text-xs ${k === i ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {pick(x.title)}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-2">
          <svg viewBox="0 0 440 252" className="w-full" role="img" aria-label={pick(s.title)}>
            {EDGES.map(([a, b]) =>
              st(b) === "none" ? null : (
                <line
                  key={b}
                  x1={POS[a][0]}
                  y1={POS[a][1] + 14}
                  x2={POS[b][0]}
                  y2={POS[b][1] - 14}
                  strokeWidth={1.4}
                  className="stroke-gray-300"
                />
              ),
            )}
            {(Object.keys(POS) as NodeId[]).map((k) => {
              const v = st(k);
              if (v === "none") return null;
              const [x, y, w, label] = POS[k];
              return (
                <g key={k}>
                  <rect
                    x={x - w / 2}
                    y={y - 14}
                    width={w}
                    height={28}
                    rx={7}
                    strokeWidth={1.6}
                    className={`${NODE[v].cls} motion-safe:transition-colors motion-safe:duration-500`}
                  />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontFamily={MONO} className="fill-gray-800">
                    {NODE[v].mark} {label}
                  </text>
                </g>
              );
            })}
            {st("c1") !== "none" && (
              <text x={327} y={250} textAnchor="middle" fontSize={10} className="fill-gray-500">
                {pick(["the four calc links", "calc 的四個環節"])}
              </text>
            )}
          </svg>
          <p className="flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span>◐ {pick(["sorry: open", "sorry：未完成"])}</span>
            <span>↳ {pick(["built from parts still open", "由仍未完成的部分組成"])}</span>
            <span>✓ {pick(["proved", "已證明"])}</span>
          </p>
          <p className="text-sm leading-relaxed text-gray-700">
            <RichText text={pick(s.text)} />
          </p>
        </div>
        <div className="min-w-0 space-y-2">
          <pre className="max-h-72 overflow-auto rounded-md bg-gray-900 p-3 font-mono text-[11.5px] leading-relaxed text-gray-100">
            {s.code.split("\n").map((l, k) => (
              <div key={k} className={/\bsorry\b/.test(l) ? "-mx-1 rounded bg-amber-500/25 px-1 text-amber-100" : undefined}>
                {l || " "}
              </div>
            ))}
          </pre>
          <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            {pick(
              s.open.length
                ? [`Open goals: ${s.open.length}`, `未完成的目標：${s.open.length}`]
                : ["Open goals: none", "未完成的目標：無"],
            )}
          </p>
          {s.open.length === 0 ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              ✓ {pick(["Proved", "已證明"])}
            </div>
          ) : (
            s.open.map((o) => (
              <div key={o.at}>
                <p className="mb-0.5 text-[11px] text-gray-500">
                  {pick(["at the sorry of", "位於 sorry："])} <span className="font-mono">{o.at}</span>
                </p>
                <GoalView g={o.g} />
              </div>
            ))
          )}
          <div className="flex gap-2 pt-1">
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
              data-testid="proof-tree-next"
            >
              {pick(["Fill the next hole", "填下一個洞"])} ▸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
