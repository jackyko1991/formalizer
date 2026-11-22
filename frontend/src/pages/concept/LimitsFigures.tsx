/**
 * Concept ▸ Limits of proofs: pictures of what a check does and does not tell you.
 *   EmptyPromise  a hypothesis that can never hold: the region "n < n" is empty, so any promise about it is kept
 *   JunkGrid      a − b on ℕ for a, b ≤ 6: click a cell; the hypothesis b ≤ a fences off the junk triangle
 *   VerdictFlow   what the runner looks at, in order (error → sorry → axioms → proved), and how sorryAx travels
 *   GodelMap      statements about ℕ: true, provable (inside true, if Lean is sound), and the true-but-unprovable
 */
import { useLang } from "@learnkit/web";
import { useState } from "react";
import { Arrow, MONO } from "./ProverFigures";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ the empty promise

/** All natural numbers, and inside them the ones with n < n: none. "For every n in here, n = 1000000" is kept trivially. */
export function EmptyPromise() {
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 640 200" className="w-full max-w-[640px]" role="img" aria-label={pick(["A hypothesis that never holds", "永遠不成立的前提"])}>
      <rect x={10} y={20} width={400} height={160} rx={14} className="fill-teal-50/60 stroke-teal-500" strokeWidth={1.5} />
      <text x={24} y={42} fontSize={13} fontFamily={MONO} className="fill-teal-900 font-semibold">
        Nat
      </text>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
        <text key={n} x={40 + (i % 3) * 36} y={80 + Math.floor(i / 3) * 34} fontSize={13} fontFamily={MONO} className="fill-gray-600">
          {n}
        </text>
      ))}
      <text x={76} y={170} fontSize={13} className="fill-gray-400">
        …
      </text>
      {/* the hypothesis region: empty */}
      <ellipse cx={290} cy={100} rx={95} ry={58} className="fill-white stroke-amber-500" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={290} y={70} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-amber-800">
        {pick(["n with  h : n < n", "滿足 h : n < n 的 n"])}
      </text>
      <text x={290} y={116} textAnchor="middle" fontSize={30} className="fill-gray-300">
        ∅
      </text>
      <text x={290} y={142} textAnchor="middle" fontSize={11} className="fill-gray-500">
        {pick(["no number is smaller than itself", "沒有數小於自己"])}
      </text>
      {/* the promise */}
      <Arrow x1={388} y1={100} x2={440} y2={100} dashed cls="stroke-gray-400" />
      <rect x={444} y={64} width={186} height={72} rx={10} className="fill-white stroke-gray-300" />
      <text x={537} y={88} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
        ⊢ n = 1000000
      </text>
      <text x={537} y={108} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["promised for every n in the", "對虛線區域裡的每個 n 承諾"])}
      </text>
      <text x={537} y={124} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["dashed region: there are none", "成立：但那裡一個都沒有"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ the junk triangle

/** a − b on Nat for 0 ≤ a, b ≤ 6. Green: b ≤ a, where a − b + b = a. Grey: b > a, where a − b = 0 (junk). */
export function JunkGrid() {
  const { pick } = useLang();
  const N = 7;
  const C = 34;
  const [sel, setSel] = useState<[number, number]>([2, 3]);
  const [a, b] = sel;
  const sub = Math.max(0, a - b);
  const back = sub + b;
  return (
    <div className="flex w-full flex-col items-center gap-2 md:flex-row md:items-start md:justify-center md:gap-6" data-testid="junk-grid">
      <svg viewBox={`0 0 ${N * C + 60} ${N * C + 56}`} className="w-full max-w-[320px]" role="img" aria-label={pick(["a − b on Nat", "Nat 上的 a − b"])}>
        <text x={40 + (N * C) / 2} y={14} textAnchor="middle" fontSize={11} className="fill-gray-600">
          b →
        </text>
        <text x={10} y={40 + (N * C) / 2} textAnchor="middle" fontSize={11} className="fill-gray-600">
          a ↓
        </text>
        {Array.from({ length: N }, (_, i) => (
          <g key={i}>
            <text x={40 + i * C + C / 2} y={30} textAnchor="middle" fontSize={10} className="fill-gray-500">
              {i}
            </text>
            <text x={32} y={44 + i * C + C / 2 - 4} textAnchor="end" fontSize={10} className="fill-gray-500">
              {i}
            </text>
          </g>
        ))}
        {Array.from({ length: N }, (_, r) =>
          Array.from({ length: N }, (_, c) => {
            const ok = c <= r;
            const picked = r === a && c === b;
            return (
              <g key={`${r}-${c}`} onClick={() => setSel([r, c])} className="cursor-pointer">
                <rect
                  x={40 + c * C}
                  y={36 + r * C}
                  width={C - 2}
                  height={C - 2}
                  rx={4}
                  strokeWidth={picked ? 2.5 : 1}
                  className={`${ok ? "fill-emerald-50 stroke-emerald-300" : "fill-gray-100 stroke-gray-300"} ${picked ? "stroke-gray-900" : ""}`}
                />
                <text x={40 + c * C + C / 2 - 1} y={36 + r * C + C / 2 + 4} textAnchor="middle" fontSize={12} fontFamily={MONO} className={ok ? "fill-emerald-900" : "fill-gray-400"}>
                  {Math.max(0, r - c)}
                </text>
              </g>
            );
          }),
        )}
        {/* the fence b ≤ a: just above the diagonal */}
        <path
          d={Array.from({ length: N }, (_, r) => `${r === 0 ? "M" : "L"}${40 + (r + 1) * C - 1},${36 + r * C - 1} L${40 + (r + 1) * C - 1},${36 + (r + 1) * C - 1}`).join(" ")}
          fill="none"
          strokeWidth={2.5}
          className="stroke-emerald-600"
        />
      </svg>
      <div className="max-w-xs space-y-1 text-sm text-gray-700" style={{ fontFamily: MONO }}>
        <p className="text-xs text-gray-500" style={{ fontFamily: "inherit" }}>
          {pick(["click a cell", "點一個格子"])}
        </p>
        <p>
          a = {a}, b = {b}
        </p>
        <p>
          a - b = {sub}
          {b > a && <span className="text-gray-500"> ({pick(["junk: would be", "垃圾值：本該是"])} {a - b})</span>}
        </p>
        <p className={back === a ? "text-emerald-700" : "text-red-700"}>
          a - b + b = {back} {back === a ? "= a ✓" : `≠ a ✖`}
        </p>
        <p className="pt-2 text-xs text-gray-600" style={{ fontFamily: "system-ui" }}>
          {pick([
            "Green: b ≤ a, where Nat.sub_add_cancel h gives a - b + b = a. The green line is that hypothesis h : b ≤ a: the theorem never looks at the grey cells.",
            "綠色：b ≤ a，Nat.sub_add_cancel h 在這裡給出 a - b + b = a。綠線就是前提 h : b ≤ a：這個定理從不看灰色格子。",
          ])}
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ the verdict

/** A long question on two lines, split at the space nearest its middle (Chinese stays on one line). */
function qLines(t: string): string[] {
  if (t.length <= 28 || !t.includes(" ")) return [t];
  const mid = t.length / 2;
  let best = -1;
  for (let k = 0; k < t.length; k++) if (t[k] === " " && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k;
  return [t.slice(0, best), t.slice(best + 1)];
}

/** A verdict with a reason ("… problem: why") on two lines, broken after the colon. */
function outLines(t: string): string[] {
  const m = t.match(/^(.*?[:：])\s*(.+)$/);
  return m ? [m[1], m[2]] : [t];
}

/** What the runner checks, in order, and the verdict each answer leads to; on the right, how sorryAx is inherited. */
export function VerdictFlow() {
  const { pick } = useLang();
  const qs: { q: L; no: boolean; out: L; cls: string }[] = [
    { q: ["Any error?", "有錯誤嗎？"], no: false, out: ["Lean found a problem", "Lean 發現了問題"], cls: "fill-red-50 stroke-red-400" },
    {
      q: ["Any sorry (sorryAx) left?", "還有 sorry（sorryAx）嗎？"],
      no: false,
      out: ["Not finished yet", "還沒完成"],
      cls: "fill-amber-50 stroke-amber-500",
    },
    {
      q: ["An axiom beyond the standard three?", "有標準三個以外的公理嗎？"],
      no: false,
      out: ["Lean found a problem: non-standard axioms", "Lean 發現了問題：非標準公理"],
      cls: "fill-red-50 stroke-red-400",
    },
  ];
  return (
    <svg viewBox="0 0 660 290" className="w-full max-w-[660px]" role="img" aria-label={pick(["How the runner decides", "執行器如何判定"])}>
      {qs.map((s, i) => {
        const y = 14 + i * 70;
        return (
          <g key={i}>
            <rect x={10} y={y} width={190} height={40} rx={8} className="fill-white stroke-gray-400" />
            {qLines(pick(s.q)).map((line, k, all) => (
              <text key={k} x={105} y={y + 25 - (all.length - 1) * 7 + k * 14} textAnchor="middle" fontSize={11.5} className="fill-gray-900">
                {line}
              </text>
            ))}
            <Arrow x1={200} y1={y + 20} x2={246} y2={y + 20} cls="stroke-gray-500" />
            <text x={222} y={y + 14} textAnchor="middle" fontSize={10} className="fill-gray-600">
              {pick(["yes", "是"])}
            </text>
            <rect x={250} y={y + 2} width={170} height={36} rx={18} className={s.cls} />
            {outLines(pick(s.out)).map((line, k, all) => (
              <text key={k} x={335} y={y + 24 - (all.length - 1) * 6.5 + k * 13} textAnchor="middle" fontSize={11} className="fill-gray-900">
                {line}
              </text>
            ))}
            <Arrow x1={105} y1={y + 40} x2={105} y2={y + 68} cls="stroke-gray-500" />
            <text x={112} y={y + 58} fontSize={10} className="fill-gray-600">
              {pick(["no", "否"])}
            </text>
          </g>
        );
      })}
      <rect x={10} y={224} width={190} height={40} rx={20} className="fill-emerald-50 stroke-emerald-500" />
      <text x={105} y={249} textAnchor="middle" fontSize={12.5} className="fill-emerald-800 font-semibold">
        ✓ {pick(["Proved", "已證明"])}
      </text>
      <text x={105} y={282} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
        {pick(["…for the statement as written", "……對寫下來的陳述而言"])}
      </text>
      {/* sorryAx travels */}
      <line x1={440} y1={10} x2={440} y2={280} className="stroke-gray-200" />
      <text x={550} y={26} textAnchor="middle" fontSize={11.5} className="fill-gray-800 font-semibold">
        {pick(["A hidden sorry can't hide", "藏起來的 sorry 藏不住"])}
      </text>
      {[
        { y: 46, name: "twoPlusTwo", ax: "[sorryAx]", note: ["by sorry", "by sorry"] as L },
        { y: 136, name: "useIt", ax: "[propext, sorryAx, Quot.sound]", note: ["have h := twoPlusTwo", "have h := twoPlusTwo"] as L },
        { y: 226, name: pick(["anything using useIt", "任何用到 useIt 的"]), ax: "[…, sorryAx, …]", note: ["however far away", "隔多遠都一樣"] as L },
      ].map((n, i) => (
        <g key={i}>
          <rect x={456} y={n.y} width={194} height={50} rx={8} className="fill-amber-50 stroke-amber-500" />
          <text x={553} y={n.y + 19} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900">
            {n.name}
          </text>
          <text x={553} y={n.y + 38} textAnchor="middle" fontSize={10} fontFamily={MONO} className="fill-amber-800">
            {n.ax}
          </text>
          {i < 2 && (
            <>
              <Arrow x1={553} y1={n.y + 50} x2={553} y2={n.y + 86} cls="stroke-amber-500" />
              <text x={560} y={n.y + 72} fontSize={10} className="fill-gray-600">
                {pick(["used by", "被使用於"])}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ Gödel

/** Statements about ℕ: the true ones, and inside them (if Lean is sound) the provable ones. G and Con are outside. */
export function GodelMap() {
  const { pick } = useLang();
  const dot = (x: number, y: number, label: string, cls: string, anchor: "start" | "end" = "start") => (
    <g>
      <circle cx={x} cy={y} r={5} className={cls} />
      <text x={anchor === "start" ? x + 9 : x - 9} y={y + 4} textAnchor={anchor} fontSize={11} fontFamily={MONO} className="fill-gray-800">
        {label}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 650 260" className="w-full max-w-[650px]" role="img" aria-label={pick(["True versus provable", "真與可證"])}>
      <rect x={8} y={8} width={634} height={244} rx={14} className="fill-gray-50 stroke-gray-300" />
      <text x={22} y={30} fontSize={12} className="fill-gray-600">
        {pick(["statements about ℕ that Lean can write", "Lean 能寫出的、關於 ℕ 的陳述"])}
      </text>
      {/* true */}
      <ellipse cx={250} cy={140} rx={215} ry={100} className="fill-teal-50 stroke-teal-500" strokeWidth={1.5} />
      <text x={86} y={86} fontSize={12} className="fill-teal-800 font-semibold">
        {pick(["true", "真的"])}
      </text>
      {/* provable */}
      <ellipse cx={210} cy={150} rx={120} ry={66} className="fill-emerald-100 stroke-emerald-600" strokeWidth={1.5} />
      <text x={210} y={108} textAnchor="middle" fontSize={12} className="fill-emerald-900 font-semibold">
        {pick(["provable in Lean", "在 Lean 中可證"])}
      </text>
      {dot(140, 140, "2 + 2 = 4", "fill-emerald-600")}
      {dot(140, 172, "2 * sumTo n = n * (n + 1)", "fill-emerald-600")}
      {/* true but unprovable */}
      {dot(368, 118, "G", "fill-violet-600")}
      {dot(368, 176, "Con(Lean)", "fill-violet-600")}
      <text x={395} y={147} textAnchor="middle" fontSize={10.5} className="fill-violet-800">
        {pick(["true, not provable", "真的，但證不出來"])}
      </text>
      {/* false */}
      {dot(520, 70, "2 + 2 = 5", "fill-gray-400")}
      {dot(520, 110, "¬G", "fill-violet-300")}
      <text x={510} y={150} fontSize={11} className="fill-gray-600">
        {pick(["false", "假的"])}
      </text>
      <text x={510} y={168} fontSize={10.5} className="fill-gray-500">
        {pick(["(never provable,", "（永遠證不出來，"])}
      </text>
      <text x={510} y={184} fontSize={10.5} className="fill-gray-500">
        {pick(["if Lean is sound)", "若 Lean 可靠）"])}
      </text>
    </svg>
  );
}
