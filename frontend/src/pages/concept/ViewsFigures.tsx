/**
 * Concept ▸ six views: one picture per view of an unreadable machine proof (3Blue1Brown's interviews, Nov 2026).
 *   VerifyFig     the proof through four gates, independent kernels agreeing, then the block split into pieces people rewrite
 *   ExplainerFig  a "scroll from the gods" → an AI translator → readable chapters; a dial between the two cases
 *   UnderstandFig an endless proof tape vs one clear picture (odd numbers make squares); fake proofs of 1 = 0 in the margin
 *   HumourFig     an endless tape of "let A be this function…" and a logician's grin
 *   CollabFig     the four-colour case grid vs a human ⇄ AI loop; the one-shot autonomous arrow crossed out
 *   ValuesFig     cheap vs still valued (orthogonal axes), the Move 37 stone, a tree of new problems from a solved one
 * Every figure has one viewBox (320 × 180). `detail` adds labels and motion (for the zoomed card); without it the
 * figure is a small emblem for a hexagon. Motion is CSS (FIG_CSS) and stops under prefers-reduced-motion.
 */
import { useLang } from "@learnkit/web";
import type { ReactNode } from "react";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Keyframes for the figures; rendered once by the page. Only `.fzv-anim` (detail) figures move. */
export const FIG_CSS = `
.fzv-anim .fzv-pop { animation: fzv-pop 3.6s ease-out infinite both; transform-box: fill-box; transform-origin: center; }
.fzv-anim .fzv-d1 { animation-delay: .3s } .fzv-anim .fzv-d2 { animation-delay: .6s } .fzv-anim .fzv-d3 { animation-delay: .9s }
.fzv-anim .fzv-d4 { animation-delay: 1.2s } .fzv-anim .fzv-d5 { animation-delay: 1.5s }
@keyframes fzv-pop { 0% { opacity: 0; transform: scale(.4) } 12% { opacity: 1; transform: scale(1.12) } 18%, 88% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1) } }
.fzv-anim .fzv-tape { animation: fzv-tape 9s linear infinite; }
@keyframes fzv-tape { from { transform: translateY(0) } to { transform: translateY(-96px) } }
.fzv-anim .fzv-drift { animation: fzv-drift 4s ease-in-out infinite alternate; }
@keyframes fzv-drift { from { transform: translate(0, 0) } to { transform: translate(var(--dx), var(--dy)) } }
.fzv-anim .fzv-needle { animation: fzv-needle 5s ease-in-out infinite alternate; transform-box: view-box; transform-origin: 160px 174px; }
@keyframes fzv-needle { 0%, 20% { transform: rotate(-62deg) } 80%, 100% { transform: rotate(58deg) } }
.fzv-anim .fzv-spin { animation: fzv-spin 6s linear infinite; transform-box: view-box; transform-origin: 238px 86px; }
@keyframes fzv-spin { to { transform: rotate(360deg) } }
.fzv-anim .fzv-fill { animation: fzv-fill 5s steps(1, end) infinite; }
@keyframes fzv-fill { 0% { fill: #fef3c7 } 50%, 100% { fill: #d1fae5 } }
.fzv-anim .fzv-grow { stroke-dasharray: 60; animation: fzv-grow 4.5s ease-out infinite; }
@keyframes fzv-grow { 0% { stroke-dashoffset: 60 } 40%, 100% { stroke-dashoffset: 0 } }
.fzv-anim .fzv-blink { animation: fzv-blink 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes fzv-blink { 0%, 92%, 100% { transform: scaleY(1) } 96% { transform: scaleY(.1) } }
@media (prefers-reduced-motion: reduce) {
  .fzv-anim *, .fzv-anim { animation: none !important; }
}
`;

function Arrow({ x1, y1, x2, y2, cls = "stroke-gray-400", w = 1.6 }: { x1: number; y1: number; x2: number; y2: number; cls?: string; w?: number }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number) => `${x2 - 7 * Math.cos(a + d)},${y2 - 7 * Math.sin(a + d)}`;
  return (
    <g className={cls}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} />
      <polygon points={`${x2},${y2} ${h(0.45)} ${h(-0.45)}`} className={cls.replace("stroke-", "fill-")} />
    </g>
  );
}

function Frame({ label, detail, children }: { label: L; detail: boolean; children: ReactNode }) {
  const { pick } = useLang();
  return (
    <svg
      viewBox="0 0 320 180"
      className={detail ? "fzv-anim w-full max-w-[560px]" : "h-full w-full"}
      role="img"
      aria-label={pick(label)}
      aria-hidden={detail ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** A person: head and shoulders. */
function Person({ x, y, cls = "fill-gray-500" }: { x: number; y: number; cls?: string }) {
  return (
    <g className={cls}>
      <circle cx={x} cy={y} r={4} />
      <path d={`M${x - 6} ${y + 12} Q${x} ${y + 3} ${x + 6} ${y + 12} Z`} />
    </g>
  );
}

// ------------------------------------------------------------------------------------------------ 1 verify, then take apart

export function VerifyFig({ detail = false }: { detail?: boolean }) {
  const { pick } = useLang();
  const gates: L[] = [
    ["statement", "陳述"],
    ["compiles", "編譯"],
    ["comparator", "比對器"],
    ["kernels", "核心"],
  ];
  const kernels = ["Lean", "nanoda", "…"];
  const pieces = [
    { x: 236, y: 40, dx: "-4px", dy: "-5px" },
    { x: 266, y: 40, dx: "5px", dy: "-6px" },
    { x: 236, y: 74, dx: "-6px", dy: "0px" },
    { x: 266, y: 74, dx: "7px", dy: "1px" },
    { x: 236, y: 108, dx: "-4px", dy: "6px" },
    { x: 266, y: 108, dx: "5px", dy: "6px" },
  ];
  return (
    <Frame label={["A proof through four gates, three kernels agreeing, then split into pieces", "證明通過四道關卡、三個核心一致，再拆成小塊"]} detail={detail}>
      {/* the big block */}
      <rect x={8} y={36} width={52} height={104} rx={4} className="fill-teal-100 stroke-teal-600" strokeWidth={1.5} />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={14} x2={i % 3 === 2 ? 40 : 54} y1={44 + i * 8} y2={44 + i * 8} strokeWidth={2} className="stroke-teal-300" />
      ))}
      {/* four gates */}
      {gates.map((g, i) => {
        const x = 78 + i * 20;
        return (
          <g key={i}>
            <rect x={x} y={52} width={6} height={76} rx={2} className="fill-gray-200 stroke-gray-500" />
            <circle cx={x + 3} cy={44} r={6} className="fill-white stroke-gray-500" />
            <text x={x + 3} y={47} textAnchor="middle" fontSize={8} className="fill-gray-700 font-semibold">
              {i + 1}
            </text>
            {detail && (
              <text x={x + 3} y={136} fontSize={7.5} textAnchor="end" transform={`rotate(-60 ${x + 3} 136)`} className="fill-gray-600">
                {pick(g)}
              </text>
            )}
          </g>
        );
      })}
      <Arrow x1={60} y1={90} x2={150} y2={90} cls="stroke-teal-600" w={2} />
      {/* independent kernels agree */}
      {kernels.map((k, i) => {
        const y = 52 + i * 38;
        return (
          <g key={k}>
            <line x1={152} y1={90} x2={174} y2={y} strokeWidth={1.2} className="stroke-gray-300" />
            <circle cx={186} cy={y} r={13} className={`fill-emerald-50 stroke-emerald-500 fzv-pop fzv-d${i + 1}`} strokeWidth={1.6} />
            <text x={186} y={y + 5} textAnchor="middle" fontSize={14} className={`fill-emerald-700 font-semibold fzv-pop fzv-d${i + 1}`}>
              ✓
            </text>
            {detail && (
              <text x={186} y={y + 22} textAnchor="middle" fontSize={7.5} fontFamily={MONO} className="fill-gray-600">
                {k}
              </text>
            )}
          </g>
        );
      })}
      <Arrow x1={202} y1={90} x2={226} y2={90} cls="stroke-gray-400" />
      {/* the block taken apart, pieces rewritten by people */}
      {pieces.map((p, i) => (
        <g key={i} className="fzv-drift" style={{ ["--dx" as string]: p.dx, ["--dy" as string]: p.dy }}>
          <rect x={p.x} y={p.y} width={26} height={28} rx={3} className={i % 2 ? "fill-white stroke-teal-500" : "fill-teal-50 stroke-teal-500"} strokeWidth={1.3} />
          <line x1={p.x + 4} x2={p.x + 20} y1={p.y + 9} y2={p.y + 9} strokeWidth={1.6} className="stroke-teal-300" />
          <line x1={p.x + 4} x2={p.x + 15} y1={p.y + 16} y2={p.y + 16} strokeWidth={1.6} className="stroke-teal-300" />
        </g>
      ))}
      <Person x={300} y={146} cls="fill-gray-500" />
      <Person x={226} y={146} cls="fill-gray-400" />
      <path d="M296 132 l8 -10 l3 3 l-8 10 z" className="fill-amber-400 stroke-amber-600" strokeWidth={0.8} />
      {detail && (
        <>
          <text x={34} y={18} textAnchor="middle" fontSize={8.5} className="fill-gray-700 font-semibold">
            {pick(["17M lines", "1700 萬行"])}
          </text>
          <text x={34} y={29} textAnchor="middle" fontSize={7.5} className="fill-gray-500">
            {pick(["nobody can read", "沒人讀得懂"])}
          </text>
          <text x={186} y={20} textAnchor="middle" fontSize={8.5} className="fill-emerald-700 font-semibold">
            {pick(["they all agree", "全部一致"])}
          </text>
          <text x={264} y={20} textAnchor="middle" fontSize={8.5} className="fill-gray-700 font-semibold">
            {pick(["not static", "證明不是靜止的"])}
          </text>
          <text x={264} y={30} textAnchor="middle" fontSize={7.5} className="fill-gray-500">
            {pick(["fragments isolated, rewritten", "拆出片段、重寫"])}
          </text>
        </>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------------------------------------ 2 superhuman explainer

export function ExplainerFig({ detail = false }: { detail?: boolean }) {
  const { pick } = useLang();
  const chapters: L[] = [
    ["Ch. 1 · the idea", "第 1 章 · 想法"],
    ["Ch. 2 · key lemma", "第 2 章 · 關鍵引理"],
    ["Ch. 3 · why it works", "第 3 章 · 為什麼成立"],
  ];
  // the dial: centre (160, 174), radius 46; left half = beyond a lifetime, right half = poorly exposited
  const arc = (a0: number, a1: number, r = 46) => {
    const p = (a: number) => `${160 + r * Math.cos(a)} ${174 - r * Math.sin(a)}`;
    return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
  };
  return (
    <Frame label={["An unreadable scroll, an AI translator, readable chapters; a dial between two cases", "看不懂的卷軸、AI 翻譯、可讀的章節；兩種情況之間的刻度盤"]} detail={detail}>
      {/* the scroll from the gods */}
      <rect x={14} y={30} width={62} height={84} className="fill-amber-50 stroke-amber-500" strokeWidth={1.4} />
      <ellipse cx={45} cy={30} rx={34} ry={5} className="fill-amber-200 stroke-amber-600" strokeWidth={1.2} />
      <ellipse cx={45} cy={114} rx={34} ry={5} className="fill-amber-200 stroke-amber-600" strokeWidth={1.2} />
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d={`M20 ${42 + i * 9} q4 -3 8 0 t8 0 t8 0 t8 0 ${i % 2 ? "t8 0" : "t8 0 t8 0"}`}
          fill="none"
          strokeWidth={1.2}
          className="stroke-amber-700/60"
        />
      ))}
      <text x={45} y={18} textAnchor="middle" fontSize={11} className="fill-amber-600">
        ✦ ✦ ✦
      </text>
      <Arrow x1={82} y1={72} x2={110} y2={72} cls="stroke-violet-400" />
      {/* the translator */}
      <rect x={114} y={46} width={60} height={52} rx={10} className="fill-violet-100 stroke-violet-500" strokeWidth={1.6} />
      <text x={144} y={78} textAnchor="middle" fontSize={18} className="fill-violet-800 font-semibold">
        AI
      </text>
      <circle cx={130} cy={56} r={2} className="fill-violet-400 fzv-pop fzv-d1" />
      <circle cx={158} cy={56} r={2} className="fill-violet-400 fzv-pop fzv-d3" />
      <Arrow x1={178} y1={72} x2={204} y2={72} cls="stroke-violet-400" />
      {/* readable chapters */}
      {chapters.map((c, i) => (
        <g key={i} className={`fzv-pop fzv-d${i + 2}`}>
          <rect x={208} y={30 + i * 30} width={100} height={24} rx={4} className="fill-white stroke-violet-300" strokeWidth={1.2} />
          {detail ? (
            <text x={214} y={46 + i * 30} fontSize={8.5} className="fill-gray-800">
              {pick(c)}
            </text>
          ) : (
            <>
              <line x1={214} x2={240} y1={38 + i * 30} y2={38 + i * 30} strokeWidth={2.4} className="stroke-violet-500" />
              <line x1={214} x2={290} y1={46 + i * 30} y2={46 + i * 30} strokeWidth={1.6} className="stroke-gray-300" />
            </>
          )}
        </g>
      ))}
      {/* the dial */}
      <path d={arc(Math.PI, Math.PI / 2)} fill="none" strokeWidth={9} className="stroke-gray-300" />
      <path d={arc(Math.PI / 2, 0)} fill="none" strokeWidth={9} className="stroke-violet-400" />
      <g className="fzv-needle" style={detail ? undefined : { transform: "rotate(50deg)", transformOrigin: "160px 174px" }}>
        <line x1={160} y1={174} x2={160} y2={136} strokeWidth={2.4} className="stroke-gray-800" />
      </g>
      <circle cx={160} cy={174} r={4} className="fill-gray-800" />
      {detail && (
        <>
          <text x={45} y={132} textAnchor="middle" fontSize={8} className="fill-amber-800">
            {pick(["“notes from the Gods”", "「來自眾神的筆記」"])}
          </text>
          <text x={102} y={150} textAnchor="end" fontSize={7.5} className="fill-gray-700 font-semibold">
            {pick(["beyond a human lifetime", "一輩子也讀不完"])}
          </text>
          <text x={102} y={161} textAnchor="end" fontSize={7.5} className="fill-gray-500">
            {pick(["99.9% → 100%: a little", "99.9% → 100%：一點點"])}
          </text>
          <text x={218} y={150} fontSize={7.5} className="fill-violet-800 font-semibold">
            {pick(["poorly exposited", "只是寫得很糟"])}
          </text>
          <text x={218} y={161} fontSize={7.5} className="fill-violet-700">
            {pick(["a huge deal", "那就是大事"])}
          </text>
        </>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------------------------------------ 3 understanding is the point

export function UnderstandFig({ detail = false }: { detail?: boolean }) {
  const { pick } = useLang();
  const gnomon = ["fill-rose-500", "fill-rose-400", "fill-rose-300", "fill-rose-200"];
  return (
    <Frame label={["An endless proof tape vs one clear picture: 1 + 3 + 5 + 7 = 4²", "無盡的證明紙帶 vs 一張清楚的圖：1 + 3 + 5 + 7 = 4²"]} detail={detail}>
      <defs>
        <clipPath id="fzv-tape3">
          <rect x={16} y={14} width={70} height={140} />
        </clipPath>
        <linearGradient id="fzv-fade3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="0.2" stopColor="white" stopOpacity="0" />
          <stop offset="0.8" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* endless tape */}
      <rect x={16} y={14} width={70} height={140} className="fill-gray-50 stroke-gray-300" />
      <g clipPath="url(#fzv-tape3)">
        <g className="fzv-tape">
          {Array.from({ length: 30 }, (_, i) => (
            <line key={i} x1={22} x2={i % 4 === 3 ? 56 : i % 3 === 1 ? 70 : 80} y1={20 + i * 8} y2={20 + i * 8} strokeWidth={2} className="stroke-gray-300" />
          ))}
        </g>
      </g>
      <rect x={16} y={14} width={70} height={140} fill="url(#fzv-fade3)" />
      <text x={51} y={170} textAnchor="middle" fontSize={9} className="fill-gray-500">
        ⋮ ⋮ ⋮
      </text>
      <text x={112} y={92} textAnchor="middle" fontSize={20} className="fill-gray-400">
        vs
      </text>
      {/* one clear picture: odd numbers make squares */}
      {Array.from({ length: 16 }, (_, k) => {
        const i = k % 4;
        const j = Math.floor(k / 4);
        return (
          <rect key={k} x={140 + i * 20} y={46 + (3 - j) * 20} width={18} height={18} rx={2} className={gnomon[Math.max(i, j)]} />
        );
      })}
      <circle cx={180} cy={86} r={52} fill="none" strokeWidth={1.4} strokeDasharray="3 3" className="stroke-rose-300" />
      {/* fake proofs in the margin */}
      {[
        { y: 52, r: -8 },
        { y: 92, r: 6 },
        { y: 132, r: -4 },
      ].map((f, i) => (
        <g key={i} transform={`rotate(${f.r} 286 ${f.y})`}>
          <text x={286} y={f.y} textAnchor="middle" fontSize={13} fontFamily={MONO} className="fill-gray-500">
            1=0
          </text>
          <line x1={266} y1={f.y - 4} x2={306} y2={f.y - 4} strokeWidth={2} className="stroke-red-500" />
        </g>
      ))}
      <line x1={252} y1={30} x2={252} y2={150} strokeWidth={1} strokeDasharray="2 3" className="stroke-gray-300" />
      {detail && (
        <>
          <text x={51} y={9} textAnchor="middle" fontSize={8} className="fill-gray-600">
            {pick(["a proof checks…", "證明負責檢查……"])}
          </text>
          <text x={180} y={24} textAnchor="middle" fontSize={8} className="fill-rose-700 font-semibold">
            {pick(["…understanding happens here", "……理解發生在這裡"])}
          </text>
          <text x={180} y={34} textAnchor="middle" fontSize={7.5} fontFamily={MONO} className="fill-rose-700">
            1 + 3 + 5 + 7 = 4²
          </text>
          <text x={286} y={164} textAnchor="middle" fontSize={7.5} className="fill-red-700">
            {pick(["fake proofs", "假證明"])}
          </text>
          <text x={286} y={174} textAnchor="middle" fontSize={7.5} className="fill-red-700">
            {pick(["burned us", "讓我們吃過虧"])}
          </text>
        </>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------------------------------------ 4 dark humour, metamathematics

export function HumourFig({ detail = false }: { detail?: boolean }) {
  const { pick } = useLang();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWX".split("");
  return (
    <Frame label={["An endless tape of “let A be this function…” and a logician's grin", "無盡的「令 A 為這個函數……」紙帶，和一位邏輯學家的笑"]} detail={detail}>
      <defs>
        <clipPath id="fzv-tape4">
          <rect x={14} y={10} width={168} height={160} rx={4} />
        </clipPath>
        <linearGradient id="fzv-fade4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbeb" stopOpacity="1" />
          <stop offset="0.18" stopColor="#fffbeb" stopOpacity="0" />
          <stop offset="0.82" stopColor="#fffbeb" stopOpacity="0" />
          <stop offset="1" stopColor="#fffbeb" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x={14} y={10} width={168} height={160} rx={4} className="fill-amber-50 stroke-amber-400" strokeWidth={1.4} />
      <g clipPath="url(#fzv-tape4)">
        <g className="fzv-tape">
          {letters.map((c, i) =>
            detail ? (
              <text key={c} x={24} y={26 + i * 12} fontSize={9.5} fontFamily={MONO} className="fill-amber-900">
                <tspan className="fill-gray-400">{String(i + 1).padStart(2, " ")} </tspan>
                {`let ${c} be this ${i % 4 === 2 ? "number" : "function"}`}
              </text>
            ) : (
              <g key={c}>
                <line x1={24} x2={40} y1={23 + i * 12} y2={23 + i * 12} strokeWidth={2.4} className="stroke-amber-600" />
                <line x1={46} x2={i % 4 === 2 ? 130 : 160} y1={23 + i * 12} y2={23 + i * 12} strokeWidth={2.4} className="stroke-amber-300" />
              </g>
            ),
          )}
        </g>
      </g>
      <rect x={14} y={10} width={168} height={160} rx={4} fill="url(#fzv-fade4)" />
      {/* the logician */}
      <circle cx={252} cy={78} r={42} className="fill-amber-100 stroke-amber-600" strokeWidth={1.6} />
      <g className="fzv-blink">
        <circle cx={237} cy={68} r={4} className="fill-gray-800" />
        <circle cx={267} cy={68} r={4} className="fill-gray-800" />
      </g>
      <path d="M229 60 q8 -7 16 -1 M259 59 q8 -6 16 1" fill="none" strokeWidth={2} className="stroke-gray-700" />
      <path d="M228 88 Q252 116 276 88 Q252 100 228 88 Z" className="fill-white stroke-gray-800" strokeWidth={1.8} />
      {/* magnifier on the tape */}
      <circle cx={196} cy={136} r={14} className="fill-white/60 stroke-gray-600" strokeWidth={2.4} />
      <line x1={206} y1={146} x2={220} y2={160} strokeWidth={4} strokeLinecap="round" className="stroke-gray-600" />
      <text x={252} y={142} textAnchor="middle" fontSize={detail ? 13 : 16} fontFamily={MONO} className="fill-amber-700 font-semibold">
        10⁹
      </text>
      {detail && (
        <>
          <text x={252} y={155} textAnchor="middle" fontSize={8} className="fill-gray-600">
            {pick(["lines, no “why”", "行，沒有「為什麼」"])}
          </text>
          <text x={252} y={26} textAnchor="middle" fontSize={8} className="fill-gray-700 font-semibold">
            {pick(["a logician's grin", "邏輯學家的笑"])}
          </text>
        </>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------------------------------------ 5 brute force vs together

export function CollabFig({ detail = false }: { detail?: boolean }) {
  const { pick } = useLang();
  return (
    <Frame label={["Case after case vs a human and an AI working in a loop; one-shot autonomy crossed out", "一個個情況窮舉 vs 人與 AI 的迴圈；一次到位的全自動被劃掉"]} detail={detail}>
      {/* the case grid */}
      {Array.from({ length: 48 }, (_, k) => {
        const i = k % 8;
        const j = Math.floor(k / 8);
        const late = k > 40;
        return (
          <rect
            key={k}
            x={12 + i * 15}
            y={30 + j * 15}
            width={12}
            height={12}
            rx={2}
            className={late ? "fill-emerald-100 stroke-emerald-400 fzv-fill" : "fill-emerald-100 stroke-emerald-400"}
            strokeWidth={0.8}
          />
        );
      })}
      <text x={72} y={140} textAnchor="middle" fontSize={11} className="fill-emerald-700">
        ✓ ✓ ✓ … ✓
      </text>
      <line x1={146} y1={22} x2={146} y2={160} strokeWidth={1} strokeDasharray="2 3" className="stroke-gray-300" />
      {/* the loop: a person and an AI */}
      <Person x={196} y={80} cls="fill-sky-700" />
      <rect x={264} y={72} width={36} height={26} rx={7} className="fill-sky-100 stroke-sky-500" strokeWidth={1.4} />
      <text x={282} y={90} textAnchor="middle" fontSize={11} className="fill-sky-800 font-semibold">
        AI
      </text>
      <g className="fzv-spin">
        <path d="M206 72 C222 48, 254 48, 266 66" fill="none" strokeWidth={1.8} className="stroke-sky-500" />
        <polygon points="268,70 258,64 268,60" className="fill-sky-500" />
        <path d="M268 102 C254 124, 222 124, 208 100" fill="none" strokeWidth={1.8} className="stroke-sky-500" />
        <polygon points="205,96 216,102 206,107" className="fill-sky-500" />
      </g>
      {/* one-shot, autonomous: crossed out */}
      <Arrow x1={170} y1={150} x2={300} y2={150} cls="stroke-gray-400" />
      <line x1={226} y1={140} x2={246} y2={160} strokeWidth={3} strokeLinecap="round" className="stroke-red-500" />
      <line x1={246} y1={140} x2={226} y2={160} strokeWidth={3} strokeLinecap="round" className="stroke-red-500" />
      {detail && (
        <>
          <text x={72} y={18} textAnchor="middle" fontSize={8.5} className="fill-gray-800 font-semibold">
            {pick(["four colour theorem", "四色定理"])}
          </text>
          <text x={72} y={156} textAnchor="middle" fontSize={7.5} className="fill-gray-500">
            {pick(["case after case, by computer", "一個個情況，交給電腦"])}
          </text>
          <text x={238} y={18} textAnchor="middle" fontSize={8.5} className="fill-gray-800 font-semibold">
            {pick(["the Riemann hypothesis?", "黎曼猜想？"])}
          </text>
          <text x={238} y={30} textAnchor="middle" fontSize={7.5} className="fill-gray-500">
            {pick(["new mathematics, made together", "新的數學，一起做出來"])}
          </text>
          <text x={238} y={176} textAnchor="middle" fontSize={7.5} className="fill-red-700">
            {pick(["one-shot, fully autonomous", "一次到位、完全自主"])}
          </text>
        </>
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------------------------------------ 6 values, safety, long view

export function ValuesFig({ detail = false }: { detail?: boolean }) {
  const { pick } = useLang();
  // a tree of problems grown from a solved one
  const nodes = [
    { x: 262, y: 153, s: "done" },
    { x: 236, y: 114, s: "q" },
    { x: 290, y: 114, s: "q" },
    { x: 220, y: 75, s: "q" },
    { x: 250, y: 75, s: "q" },
    { x: 280, y: 75, s: "q" },
    { x: 306, y: 75, s: "q" },
    { x: 236, y: 37, s: "q" },
    { x: 294, y: 37, s: "q" },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
    [4, 7],
    [5, 8],
  ];
  return (
    <Frame label={["Cheap vs still valued; the Move 37 stone; new problems growing from a solved one", "便宜 vs 仍被珍視；第 37 手；從解決的問題長出新問題"]} detail={detail}>
      {/* orthogonal axes */}
      <Arrow x1={22} y1={150} x2={132} y2={150} cls="stroke-gray-500" />
      <Arrow x1={22} y1={150} x2={22} y2={30} cls="stroke-gray-500" />
      <rect x={22} y={146} width={4} height={4} fill="none" strokeWidth={1} className="stroke-gray-500" />
      <circle cx={108} cy={138} r={6} className="fill-gray-300 fzv-pop fzv-d1" />
      <circle cx={36} cy={52} r={7} className="fill-indigo-500 fzv-pop fzv-d3" />
      <circle cx={52} cy={84} r={5} className="fill-indigo-300 fzv-pop fzv-d4" />
      {/* Move 37 */}
      <circle cx={170} cy={56} r={18} className="fill-gray-900" />
      <circle cx={164} cy={50} r={5} className="fill-white/20" />
      <text x={170} y={61} textAnchor="middle" fontSize={13} className="fill-white font-semibold">
        37
      </text>
      {/* alignment worry */}
      <path d="M170 108 L186 136 L154 136 Z" className="fill-amber-100 stroke-amber-500" strokeWidth={1.6} />
      <text x={170} y={132} textAnchor="middle" fontSize={14} className="fill-amber-700 font-semibold">
        !
      </text>
      {/* the tree */}
      {edges.map(([a, b]) => (
        <line key={b} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} strokeWidth={1.6} className="stroke-indigo-300 fzv-grow" />
      ))}
      {nodes.map((n, k) => (
        <g key={k} className={k === 0 ? "" : `fzv-pop fzv-d${Math.min(5, Math.ceil(k / 2))}`}>
          <circle cx={n.x} cy={n.y} r={k === 0 ? 11 : 8} className={k === 0 ? "fill-emerald-100 stroke-emerald-600" : "fill-white stroke-indigo-400"} strokeWidth={1.6} />
          <text x={n.x} y={n.y + (k === 0 ? 5 : 4)} textAnchor="middle" fontSize={k === 0 ? 12 : 10} className={k === 0 ? "fill-emerald-700 font-semibold" : "fill-indigo-700"}>
            {k === 0 ? "✓" : "?"}
          </text>
        </g>
      ))}
      {detail && (
        <>
          <text x={132} y={166} textAnchor="end" fontSize={7.5} className="fill-gray-600">
            {pick(["cheap, commoditized →", "變便宜、商品化 →"])}
          </text>
          <text x={14} y={22} fontSize={7.5} className="fill-gray-600">
            {pick(["↑ still valued", "↑ 仍被珍視"])}
          </text>
          <text x={110} y={128} textAnchor="middle" fontSize={7} className="fill-gray-500">
            {pick(["some problem solving", "某些解題"])}
          </text>
          <text x={46} y={42} fontSize={7} className="fill-indigo-700">
            {pick(["landmark problems?", "里程碑問題？"])}
          </text>
          <text x={170} y={90} textAnchor="middle" fontSize={7.5} className="fill-gray-700">
            {pick(["“Move 37” for maths?", "數學的「第 37 手」？"])}
          </text>
          <text x={170} y={150} textAnchor="middle" fontSize={7.5} className="fill-amber-800">
            {pick(["aligned?", "對齊了嗎？"])}
          </text>
          <text x={262} y={176} textAnchor="middle" fontSize={7.5} className="fill-gray-600">
            {pick(["solved → new problems", "解決 → 新問題"])}
          </text>
        </>
      )}
    </Frame>
  );
}
