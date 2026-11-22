/**
 * Coding Skills ▸ Verifying a proof: the pictures.
 *   AxiomTree      what `#print axioms` does: walk the proof down through every lemma it uses and collect the axioms at
 *                  the leaves; switch `helper` between `sorry` and a real proof and watch the answer change
 *   VerdictFlow    the checks Formalizer runs on Run, and the verdict each exit gives
 *   CheckerLadder  Formalizer's two checkers at a glance: Lite (any OS) and Full (Linux, WSL or the cloud)
 * The `#print axioms` answers are what Lean v4.34.1 prints (checked; the sorry version is snippet `hidden-sorry`).
 */
import { useLang } from "@learnkit/web";
import { useState } from "react";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function Arrow({ x1, y1, x2, y2, cls = "stroke-gray-400" }: { x1: number; y1: number; x2: number; y2: number; cls?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number) => `${x2 - 7 * Math.cos(a + d)},${y2 - 7 * Math.sin(a + d)}`;
  return (
    <g className={cls}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.5} />
      <polygon points={`${x2},${y2} ${h(0.45)} ${h(-0.45)}`} className={cls.replace("stroke-", "fill-")} />
    </g>
  );
}

// ------------------------------------------------------------------------------------------------ the axioms tree

/** `#print axioms main` follows the proof into every lemma; what sits at the leaves is the answer. */
export function AxiomTree() {
  const { pick } = useLang();
  const [proved, setProved] = useState(false);
  const leaf = proved
    ? { label: "Nat.mul_one n", cls: "fill-emerald-50 stroke-emerald-500", text: "fill-emerald-900" }
    : { label: "sorryAx", cls: "fill-red-50 stroke-red-400", text: "fill-red-800" };
  const out = proved ? "'main' does not depend on any axioms" : "'main' depends on axioms: [sorryAx]";
  const path = proved ? "stroke-emerald-500" : "stroke-red-400";
  return (
    <div className="w-full space-y-3 text-left" data-testid="axiom-tree">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">{pick(["`helper` is proved by:", "`helper` 的證明是："])}</span>
        {[false, true].map((p) => (
          <button
            key={String(p)}
            onClick={() => setProved(p)}
            aria-pressed={proved === p}
            className={`rounded-full px-3 py-1 font-mono ${proved === p ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {p ? "Nat.mul_one n" : "sorry"}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 560 250" className="w-full max-w-[560px]" role="img" aria-label={pick(["The axioms tree", "公理樹"])}>
        <rect x={190} y={14} width={180} height={34} rx={8} className="fill-white stroke-gray-500" strokeWidth={1.6} />
        <text x={280} y={36} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900">
          theorem main
        </text>
        <Arrow x1={250} y1={48} x2={140} y2={92} />
        <Arrow x1={310} y1={48} x2={410} y2={92} cls={path} />
        <text x={280} y={76} textAnchor="middle" fontSize={10} fontFamily={MONO} className="fill-gray-500">
          rw [Nat.add_zero, helper]
        </text>
        <rect x={60} y={94} width={160} height={34} rx={8} className="fill-emerald-50 stroke-emerald-500" strokeWidth={1.6} />
        <text x={140} y={116} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900">
          Nat.add_zero
        </text>
        <text x={140} y={146} textAnchor="middle" fontSize={10} className="fill-emerald-700">
          {pick(["no axioms", "沒有公理"])}
        </text>
        <rect x={340} y={94} width={140} height={34} rx={8} className="fill-white stroke-gray-500" strokeWidth={1.6} />
        <text x={410} y={116} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900">
          theorem helper
        </text>
        <Arrow x1={410} y1={128} x2={410} y2={166} cls={path} />
        <rect
          x={340}
          y={168}
          width={140}
          height={34}
          rx={17}
          className={`${leaf.cls} motion-safe:transition-colors motion-safe:duration-500`}
          strokeWidth={1.6}
        />
        <text x={410} y={190} textAnchor="middle" fontSize={12} fontFamily={MONO} className={leaf.text}>
          {leaf.label}
        </text>
        <text x={410} y={222} textAnchor="middle" fontSize={10} className={proved ? "fill-emerald-700" : "fill-red-700"}>
          {pick(proved ? ["no axioms", "沒有公理"] : ["an axiom: “trust me”", "一個公理：「相信我」"])}
        </text>
        <text x={20} y={200} fontSize={11} className="fill-gray-500">
          {pick(["the warning is on helper only;", "警告只出現在 helper；"])}
        </text>
        <text x={20} y={216} fontSize={11} className="fill-gray-500">
          {pick(["#print axioms main still finds it", "#print axioms main 仍然找得到"])}
        </text>
      </svg>
      <div className={`rounded-lg border bg-white px-3 py-2 ${proved ? "border-emerald-300" : "border-red-200"}`}>
        <p className="text-xs text-gray-500">
          <span className="font-mono">#print axioms main</span> {pick(["→ Lean prints", "→ Lean 印出"])}
        </p>
        <p className={`font-mono text-xs ${proved ? "text-emerald-800" : "text-red-800"}`}>{out}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="text-gray-500">{pick(["Formalizer accepts at the leaves:", "Formalizer 接受的葉子："])}</span>
        {["propext", "Quot.sound", "Classical.choice"].map((a) => (
          <span key={a} className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-800 ring-1 ring-emerald-200">
            ✓ {a}
          </span>
        ))}
        {["sorryAx", "…_native…", pick(["any other axiom", "其他任何公理"])].map((a) => (
          <span key={a} className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-red-700 ring-1 ring-red-200">
            ✖ {a}
          </span>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Formalizer's verdict

const GATES: { q: L; no: L; noCls: string }[] = [
  { q: ["Imports available?", "匯入的東西都有？"], no: ["Needs the Full runner", "需要 Full 執行器"], noCls: "fill-sky-50 stroke-sky-400" },
  {
    q: ["Statement unchanged?", "陳述沒被改？"],
    no: ["Lean found a problem", "Lean 發現了問題"],
    noCls: "fill-red-50 stroke-red-400",
  },
  { q: ["Lean: no errors?", "Lean：沒有錯誤？"], no: ["Lean found a problem", "Lean 發現了問題"], noCls: "fill-red-50 stroke-red-400" },
  {
    q: ["No extra axiom (besides the standard three)?", "沒有標準三個以外的公理？"],
    no: ["Lean found a problem", "Lean 發現了問題"],
    noCls: "fill-red-50 stroke-red-400",
  },
  { q: ["No sorry, nor sorryAx?", "沒有 sorry 或 sorryAx？"], no: ["Not finished yet", "還沒完成"], noCls: "fill-amber-50 stroke-amber-500" },
];

/** Five gates in a row; failing one exits downwards with its verdict; passing all five is ✓ Proved. */
export function VerdictFlow() {
  const { pick } = useLang();
  const w = 104;
  const gap = 12;
  return (
    <svg viewBox="0 0 680 200" className="w-full max-w-[680px]" role="img" aria-label={pick(["How a verdict is reached", "判定怎麼來的"])}>
      {GATES.map((g, i) => {
        const x = 10 + i * (w + gap);
        return (
          <g key={i}>
            <rect x={x} y={30} width={w} height={56} rx={8} className="fill-white stroke-gray-400" strokeWidth={1.5} />
            <foreignObject x={x + 4} y={33} width={w - 8} height={52}>
              <div style={{ fontSize: 11, lineHeight: 1.25, textAlign: "center" }} className="text-gray-800">
                <span style={{ color: "#6b7280" }}>{i + 1}. </span>
                {pick(g.q)}
              </div>
            </foreignObject>
            <Arrow x1={x + w} y1={58} x2={x + w + gap - 1} y2={58} cls="stroke-emerald-500" />
            <Arrow x1={x + w / 2} y1={86} x2={x + w / 2} y2={118} cls="stroke-gray-400" />
            <text x={x + w / 2 + 4} y={103} fontSize={10} className="fill-gray-500">
              {pick(["no", "否"])}
            </text>
            <rect x={x} y={120} width={w} height={40} rx={8} className={g.noCls} strokeWidth={1.4} />
            <foreignObject x={x + 4} y={124} width={w - 8} height={34}>
              <div style={{ fontSize: 10.5, lineHeight: 1.25, textAlign: "center" }} className="text-gray-800">
                {pick(g.no)}
              </div>
            </foreignObject>
          </g>
        );
      })}
      <rect x={592} y={30} width={80} height={50} rx={25} className="fill-emerald-50 stroke-emerald-500" strokeWidth={1.6} />
      <text x={632} y={60} textAnchor="middle" fontSize={12} className="fill-emerald-800 font-semibold">
        ✓ {pick(["Proved", "已證明"])}
      </text>
      <text x={340} y={16} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick(["green arrow = yes, go on", "綠色箭頭 = 是，繼續"])}
      </text>
      <text x={340} y={186} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick(["the statement is the test; Lean's kernel is the grader", "陳述就是測試；Lean 的核心就是閱卷人"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ Lite vs Full

const LITE: { t: string | L; d: L }[] = [
  { t: ["Statement frozen", "陳述凍結"], d: ["the theorem must be exactly the one given", "定理必須正是題目給的那一個"] },
  { t: ["Axioms whitelist", "公理白名單"], d: ["only `propext`, `Quot.sound`, `Classical.choice`", "只允許 `propext`、`Quot.sound`、`Classical.choice`"] },
  { t: ["Static scan", "靜態掃描"], d: ["the source, before Lean runs, for ways around the checks", "在 Lean 執行前檢查原始碼，找繞過檢查的寫法"] },
  { t: "leanchecker", d: ["replays every declaration through the kernel, in a fresh process", "在全新的程序裡，把每個宣告再交給核心重播一次"] },
];
const FULL: { t: string | L; d: L }[] = [
  { t: "comparator --paranoid", d: ["Comparator's strictest mode, inside a Linux sandbox", "Comparator 最嚴格的模式，在 Linux 沙盒裡執行"] },
  { t: "nanoda", d: ["a second kernel, written independently in Rust", "第二個核心，另外用 Rust 獨立寫成"] },
  { t: "Lean4Lean", d: ["a third kernel, written in Lean itself", "第三個核心，用 Lean 本身寫成"] },
];

/** Formalizer's two checkers side by side: what each layer checks, and where each one runs. */
export function CheckerLadder() {
  const { pick } = useLang();
  const Row = ({ r, i, cls }: { r: { t: string | L; d: L }; i: number; cls: string }) => (
    <li className={`rounded-md border px-2.5 py-1.5 ${cls}`}>
      <p className="text-xs font-semibold text-gray-900">
        <span className="mr-1 text-gray-400">{i}</span>
        {typeof r.t === "string" ? <span className="font-mono">{r.t}</span> : pick(r.t)}
      </p>
      <p className="text-[11px] text-gray-600">
        {pick(r.d)
          .split(/(`[^`]+`)/)
          .map((p, k) =>
            p.startsWith("`") ? (
              <code key={k} className="font-mono">
                {p.slice(1, -1)}
              </code>
            ) : (
              p
            ),
          )}
      </p>
    </li>
  );
  return (
    <div className="grid w-full gap-3 text-left md:grid-cols-2" data-testid="checker-ladder">
      <div className="rounded-lg border-2 border-teal-300 bg-teal-50/40 p-3">
        <p className="text-sm font-semibold text-teal-900">Lite</p>
        <p className="mb-2 text-[11px] text-teal-800">{pick(["any OS: Windows, macOS, Linux", "任何作業系統：Windows、macOS、Linux"])}</p>
        <ol className="space-y-1.5">
          {LITE.map((r, i) => (
            <Row key={i} r={r} i={i + 1} cls="border-teal-200 bg-white" />
          ))}
        </ol>
      </div>
      <div className="rounded-lg border-2 border-violet-300 bg-violet-50/40 p-3">
        <p className="text-sm font-semibold text-violet-900">Full</p>
        <p className="mb-2 text-[11px] text-violet-800">{pick(["Linux, WSL, or the cloud", "Linux、WSL 或雲端"])}</p>
        <ol className="space-y-1.5">
          {FULL.map((r, i) => (
            <Row key={i} r={r} i={i + 1} cls="border-violet-200 bg-white" />
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-violet-800">
          {pick([
            "three kernels written by different people: a false proof would need the same bug in all three",
            "三個由不同的人寫的核心：錯誤的證明得在三者中有同一個漏洞才能過關",
          ])}
        </p>
      </div>
    </div>
  );
}
