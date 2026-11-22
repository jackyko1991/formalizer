/**
 * Concept ▸ six views: pictures for the sceptic's case and the site's reading of it.
 *   HarrisPoints  Michael Harris's four objections, one small drawing each (no text inside the drawings; the words
 *                 are HTML so they wrap on a phone): proofs → heuristics → proofs; lock-in; understood by the author
 *                 and the machine only; power moving from universities to a few firms
 *   TwoLayers     the site's way out: a verification layer (the Lean proof) under an understanding layer (the
 *                 natural-language proof), AI translating between them: the two pillars, seen as two floors
 * Labels are [English, Traditional Chinese].
 */
import { RichText, useLang } from "@learnkit/web";
import type { ReactNode } from "react";

type L = readonly [string, string];

function Arrowhead({ x, y, dir, cls }: { x: number; y: number; dir: "r" | "l" | "u" | "d"; cls: string }) {
  const p = { r: `${x},${y} ${x - 7},${y - 4} ${x - 7},${y + 4}`, l: `${x},${y} ${x + 7},${y - 4} ${x + 7},${y + 4}`, u: `${x},${y} ${x - 4},${y + 7} ${x + 4},${y + 7}`, d: `${x},${y} ${x - 4},${y - 7} ${x + 4},${y - 7}` }[dir];
  return <polygon points={p} className={cls} />;
}

/** 1. Rigorous proofs are converted into heuristics, which produce new proofs: a cycle, not a factory. */
function CycleIcon() {
  return (
    <svg viewBox="0 0 120 64" className="h-12 w-20 shrink-0 sm:h-16 sm:w-28" aria-hidden="true">
      <rect x={4} y={18} width={34} height={28} rx={4} className="fill-teal-50 stroke-teal-500" strokeWidth={1.5} />
      {[26, 32, 38].map((y) => (
        <line key={y} x1={10} y1={y} x2={32} y2={y} className="stroke-teal-400" strokeWidth={1.2} />
      ))}
      {/* a light bulb: the heuristic */}
      <circle cx={98} cy={28} r={11} className="fill-amber-100 stroke-amber-500" strokeWidth={1.5} />
      <rect x={93} y={39} width={10} height={7} rx={1.5} className="fill-amber-200 stroke-amber-500" strokeWidth={1.2} />
      <path d="M42 22 C58 6, 74 6, 84 16" className="fill-none stroke-gray-500" strokeWidth={1.5} />
      <Arrowhead x={86} y={18} dir="r" cls="fill-gray-500" />
      <path d="M86 46 C74 60, 56 60, 44 48" className="fill-none stroke-gray-500" strokeWidth={1.5} />
      <Arrowhead x={42} y={46} dir="l" cls="fill-gray-500" />
    </svg>
  );
}

/** 2. Lock-in: two roads from a new idea; the natural one fades, the one the system accepts is locked in. */
function LockIcon() {
  return (
    <svg viewBox="0 0 120 64" className="h-12 w-20 shrink-0 sm:h-16 sm:w-28" aria-hidden="true">
      <circle cx={12} cy={32} r={6} className="fill-gray-400" />
      <path d="M18 30 C40 14, 60 12, 84 12" className="fill-none stroke-gray-300" strokeWidth={1.5} strokeDasharray="4 4" />
      <circle cx={90} cy={12} r={5} className="fill-none stroke-gray-300" strokeWidth={1.5} />
      <path d="M18 34 C40 50, 60 52, 82 52" className="fill-none stroke-teal-600" strokeWidth={2} />
      {/* a padlock */}
      <rect x={86} y={46} width={18} height={14} rx={2} className="fill-teal-600" />
      <path d="M89 46 v-5 a6 6 0 0 1 12 0 v5" className="fill-none stroke-teal-600" strokeWidth={2} />
    </svg>
  );
}

/** 3. Understood by the author and the machine only: a closed pair, the community outside with question marks. */
function ClosedPairIcon() {
  return (
    <svg viewBox="0 0 120 64" className="h-12 w-20 shrink-0 sm:h-16 sm:w-28" aria-hidden="true">
      <rect x={4} y={10} width={58} height={44} rx={8} className="fill-white stroke-gray-400" strokeWidth={1.5} />
      {/* a person and a machine */}
      <circle cx={20} cy={26} r={6} className="fill-amber-400" />
      <path d="M11 46 a9 9 0 0 1 18 0 z" className="fill-amber-400" />
      <rect x={37} y={22} width={18} height={16} rx={2} className="fill-teal-500" />
      <rect x={42} y={40} width={8} height={4} className="fill-teal-500" />
      {/* readers outside */}
      {[78, 96, 114].map((x, k) => (
        <g key={x} className="fill-gray-300">
          <circle cx={x - 4} cy={22 + (k % 2) * 6} r={5} />
          <path d={`M${x - 11} ${42 + (k % 2) * 6} a7 7 0 0 1 14 0 z`} />
        </g>
      ))}
      <line x1={64} y1={32} x2={72} y2={32} className="stroke-gray-300" strokeWidth={1.5} strokeDasharray="2 3" />
    </svg>
  );
}

/** 4. Who pays: weight moving from a university building to a few large firms' servers. */
function PowerIcon() {
  return (
    <svg viewBox="0 0 120 64" className="h-12 w-20 shrink-0 sm:h-16 sm:w-28" aria-hidden="true">
      {/* a university: a pediment on columns */}
      <polygon points="4,24 40,24 22,12" className="fill-gray-100 stroke-gray-400" strokeWidth={1.2} />
      {[8, 17, 26, 35].map((x) => (
        <rect key={x} x={x - 1} y={26} width={3} height={22} className="fill-gray-400" />
      ))}
      <rect x={4} y={48} width={36} height={4} className="fill-gray-400" />
      <path d="M46 36 H72" className="stroke-rose-400" strokeWidth={2} />
      <Arrowhead x={78} y={36} dir="r" cls="fill-rose-400" />
      {/* server racks */}
      {[84, 100].map((x) => (
        <g key={x}>
          <rect x={x} y={12} width={14} height={40} rx={2} className="fill-gray-700" />
          {[18, 26, 34, 42].map((y) => (
            <circle key={y} cx={x + 4} cy={y} r={1.4} className="fill-emerald-300" />
          ))}
        </g>
      ))}
    </svg>
  );
}

const POINTS: { icon: () => ReactNode; title: L; t: L }[] = [
  {
    icon: CycleIcon,
    title: ["Proofs are turned into understanding", "證明要轉化成理解"],
    t: [
      "Mathematics is not a factory of certified truths: proofs become heuristics, which lead to new proofs.",
      "數學不是生產「已認證真理」的工廠：證明轉化成直覺與啟發，再引出新的證明。",
    ],
  },
  {
    icon: LockIcon,
    title: ["Lock-in", "鎖定效應"],
    t: [
      "If one system's checks become obligatory, its choices may start to shape what mathematicians define.",
      "如果某一個系統的檢查變成強制的，它的選擇可能開始左右數學家怎麼下定義。",
    ],
  },
  {
    icon: ClosedPairIcon,
    title: ["Proof without understanding", "沒有理解的證明"],
    t: [
      "A proof understood only by its author and a machine leaves the shared, human conversation.",
      "只有作者和機器「理解」的證明，離開了人與人之間共同的對話。",
    ],
  },
  {
    icon: PowerIcon,
    title: ["Who pays, who decides", "誰出錢，誰決定"],
    t: [
      "The future of mathematics is a political question: funding and power can move from universities to a few firms.",
      "數學的未來是一個政治問題：資金與權力可能從大學移向少數公司。",
    ],
  },
];

/** Harris's four objections, one small drawing each. */
export function HarrisPoints() {
  const { pick } = useLang();
  return (
    <ol className="grid w-full max-w-[720px] gap-2 text-left sm:grid-cols-2" data-testid="harris-points">
      {POINTS.map((p, i) => (
        <li key={i} className="flex items-center gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-gray-200">
          <p.icon />
          <div className="min-w-0 text-[13px] text-gray-700">
            <p className="font-semibold text-gray-900">
              {i + 1}. {pick(p.title)}
            </p>
            <p>{pick(p.t)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The site's way out, drawn as two floors: verification below (the Lean proof), understanding above. */
export function TwoLayers() {
  const { pick } = useLang();
  const floor = (tone: "amber" | "teal", title: L, items: L[], who: L) => (
    <div className={`rounded-md border-2 px-3 py-2 ${tone === "amber" ? "border-amber-400 bg-amber-50" : "border-teal-500 bg-teal-50"}`}>
      <p className={`text-[13px] font-semibold ${tone === "amber" ? "text-amber-900" : "text-teal-900"}`}>{pick(title)}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {items.map((t, k) => (
          <li key={k} className="rounded-full bg-white px-2 py-0.5 text-[12px] text-gray-700 ring-1 ring-gray-200">
            {pick(t)}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[12px] text-gray-600">
        <RichText text={pick(who)} />
      </p>
    </div>
  );
  return (
    <div className="w-full max-w-[640px] text-left" data-testid="two-layers">
      {floor(
        "amber",
        ["Understanding layer: the natural-language proof", "理解層：自然語言證明"],
        [
          ["new questions", "新的問題"],
          ["better abstractions", "更好的抽象"],
          ["the machine's structure, distilled into intuition", "把機器找到的結構提煉成直覺"],
        ],
        ["Harris is right here: verification is the floor, not the goal.", "Harris 在這一層說得對：驗證是地板，不是目標。"],
      )}
      <div className="flex items-center justify-center gap-6 py-1.5 text-[12px] text-violet-800">
        <span className="flex items-center gap-1">
          <svg viewBox="0 0 12 24" className="h-6 w-3" aria-hidden="true">
            <line x1={6} y1={23} x2={6} y2={6} className="stroke-violet-500" strokeWidth={1.6} />
            <Arrowhead x={6} y={1} dir="u" cls="fill-violet-500" />
          </svg>
          {pick(["distil", "提煉"])}
        </span>
        <span className="font-semibold">{pick(["AI translates", "AI 翻譯"])}</span>
        <span className="flex items-center gap-1">
          {pick(["formalise", "形式化"])}
          <svg viewBox="0 0 12 24" className="h-6 w-3" aria-hidden="true">
            <line x1={6} y1={1} x2={6} y2={18} className="stroke-violet-500" strokeWidth={1.6} />
            <Arrowhead x={6} y={23} dir="d" cls="fill-violet-500" />
          </svg>
        </span>
      </div>
      {floor(
        "teal",
        ["Verification layer: the Lean proof", "驗證層：Lean 證明"],
        [
          ["open Lean", "開放的 Lean"],
          ["independent kernels", "獨立的核心"],
          ["shared compute", "共享的算力"],
        ],
        [
          "Buzzard and Voevodsky are right here: at the scale of hundreds of pages, no referee should have to check every line.",
          "Buzzard 和 Voevodsky 在這一層說得對：證明長到幾百頁時，不該再要求審稿人逐行檢查。",
        ],
      )}
    </div>
  );
}
