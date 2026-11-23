/**
 * Concept ▸ AI + human: the Riemann case. Pictures first (the Feynman way), from beginner to research:
 *   CriticalStrip      where the zeros live, drawn; and why 12 trillion checked zeros are evidence, not proof
 *   ProofArchitecture  a stepper: question → curated statement → AI search → machine gates → digestion → understanding,
 *                      with a lane for people and a lane for machines
 *   DigestionLadder    Tao's ranking (20 Nov 2026) of three results by how "digested" they are
 *   MirrorPipelines    the same day: AI writes / machines check / people digest vs a person writes / AI-assisted readers
 *                      look for gaps / Lean could settle the logic
 *   TwoPositions       mainstream practice next to this site's stated position
 *   OneStreamEach      one proof, two languages: each claim of 20 Nov 2026 is a ladder with one rail missing
 * Labels are [English, Traditional Chinese]. Animation is skipped when the reader prefers reduced motion.
 */
import { RichText, useLang } from "@learnkit/web";
import { useEffect, useState } from "react";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function useReducedMotion(): boolean {
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  return reduce;
}

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
  const h = (d: number) =>
    `${x2 - 8 * Math.cos(a + d)},${y2 - 8 * Math.sin(a + d)}`;
  return (
    <g className={cls}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={1.6}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <polygon
        points={`${x2},${y2} ${h(0.45)} ${h(-0.45)}`}
        className={cls.replace("stroke-", "fill-")}
      />
    </g>
  );
}

// ------------------------------------------------------------------------------------------------ 1. the critical strip

/** Imaginary parts of the first ten non-trivial zeros (to two decimals). */
const ZEROS = [
  14.13, 21.02, 25.01, 30.42, 32.94, 37.59, 40.92, 43.33, 48.01, 49.77,
];

/** The critical strip with the first zeros appearing on Re(s) = 1/2, and a ruler: how far the zeros have been checked. */
export function CriticalStrip() {
  const { pick } = useLang();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? ZEROS.length : 0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduce) return;
    setShown(0);
    let k = 0;
    const t = window.setInterval(() => {
      k += 1;
      setShown(k);
      if (k >= ZEROS.length) window.clearInterval(t);
    }, 350);
    return () => window.clearInterval(t);
  }, [reduce, run]);
  const X = (re: number) => 30 + (re + 7) * 33;
  const Y = (im: number) => 262 - im * 4.3;
  return (
    <div className="w-full">
      <svg
        viewBox="0 0 700 300"
        className="w-full max-w-[700px]"
        role="img"
        aria-label={pick([
          "The critical strip: the first ten non-trivial zeros all lie on the line Re(s) = 1/2",
          "臨界帶：前十個非平凡零點都落在 Re(s) = 1/2 這條線上",
        ])}
        data-testid="critical-strip"
      >
        {/* axes */}
        <line
          x1={20}
          y1={Y(0)}
          x2={380}
          y2={Y(0)}
          strokeWidth={1.2}
          className="stroke-gray-400"
        />
        <line
          x1={X(0)}
          y1={272}
          x2={X(0)}
          y2={26}
          strokeWidth={1.2}
          className="stroke-gray-400"
        />
        <text x={384} y={Y(0) + 4} fontSize={11} className="fill-gray-500">
          Re
        </text>
        <text
          x={X(0) - 6}
          y={36}
          fontSize={11}
          textAnchor="end"
          className="fill-gray-500"
        >
          Im
        </text>
        {/* the strip and the line */}
        <rect
          x={X(0)}
          y={30}
          width={X(1) - X(0)}
          height={Y(0) - 30}
          className="fill-amber-100/70"
        />
        <line
          x1={X(0.5)}
          y1={30}
          x2={X(0.5)}
          y2={Y(0)}
          strokeWidth={1.4}
          strokeDasharray="4 3"
          className="stroke-rose-500"
        />
        <text x={X(1) + 6} y={44} fontSize={11} className="fill-amber-800">
          {pick(["critical strip", "臨界帶"])}
        </text>
        <text x={X(1) + 6} y={58} fontSize={11} className="fill-amber-800">
          0 &lt; Re(s) &lt; 1
        </text>
        <text
          x={X(0.5)}
          y={21}
          fontSize={11}
          textAnchor="middle"
          className="fill-rose-700"
        >
          Re(s) = ½
        </text>
        {/* ticks */}
        {[0, 1].map((r) => (
          <text
            key={r}
            x={X(r)}
            y={Y(0) + 16}
            fontSize={10}
            textAnchor="middle"
            className="fill-gray-500"
          >
            {r}
          </text>
        ))}
        {/* the pole at s = 1: a cross drawn as two strokes (it sits on the strip's edge) */}
        <path
          d={`M${X(1) - 3.5} ${Y(0) - 12.5} l7 7 m0 -7 l-7 7`}
          strokeWidth={1.4}
          className="fill-none stroke-gray-500"
        />
        <text
          x={X(1) + 8}
          y={Y(0) + 28}
          fontSize={10}
          className="fill-gray-500"
        >
          {pick(["pole at s = 1", "s = 1 是極點"])}
        </text>
        {/* trivial zeros */}
        {[-2, -4, -6].map((r) => (
          <g key={r}>
            <circle cx={X(r)} cy={Y(0)} r={3.5} className="fill-gray-400" />
            <text
              x={X(r)}
              y={Y(0) + 16}
              fontSize={10}
              textAnchor="middle"
              className="fill-gray-500"
            >
              {r}
            </text>
          </g>
        ))}
        <text
          x={X(-4)}
          y={Y(0) + 32}
          fontSize={10}
          textAnchor="middle"
          className="fill-gray-500"
        >
          {pick(["trivial zeros: −2, −4, −6, …", "平凡零點：−2、−4、−6、…"])}
        </text>
        {/* non-trivial zeros */}
        {ZEROS.map((im, k) => (
          <g
            key={im}
            style={{
              opacity: k < shown ? 1 : 0,
              transition: reduce ? undefined : "opacity 300ms",
            }}
          >
            <circle cx={X(0.5)} cy={Y(im)} r={4} className="fill-rose-500" />
            {k === 0 && (
              <text
                x={X(-0.4)}
                y={Y(im) + 4}
                fontSize={10}
                textAnchor="end"
                fontFamily={MONO}
                className="fill-rose-700"
              >
                ½ + 14.13i
              </text>
            )}
          </g>
        ))}
        <text x={40} y={40} fontSize={11} className="fill-gray-600">
          {pick(["the first ten non-trivial zeros", "前十個非平凡零點"])}
        </text>
        <text x={40} y={55} fontSize={10} className="fill-gray-500">
          {pick([
            "(mirrored below the axis, not drawn)",
            "（在實軸下方對稱，未畫出）",
          ])}
        </text>

        {/* the ruler */}
        <line x1={410} y1={20} x2={410} y2={280} className="stroke-gray-200" />
        <text
          x={560}
          y={22}
          fontSize={12}
          textAnchor="middle"
          className="fill-gray-900 font-semibold"
        >
          {pick(["How far has it been checked?", "檢查到多高了？"])}
        </text>
        <defs>
          <linearGradient
            id="rh-fade"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
            className="text-gray-300"
          >
            <stop offset="0" stopColor="currentColor" stopOpacity={1} />
            <stop offset="1" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={430} y={50} width={30} height={200} fill="url(#rh-fade)" />
        <Arrow x1={445} y1={70} x2={445} y2={40} cls="stroke-gray-400" />
        <rect
          x={430}
          y={250}
          width={30}
          height={12}
          className="fill-teal-600"
        />
        <text x={472} y={56} fontSize={11} className="fill-gray-700">
          {pick(["infinitely many zeros above:", "上面還有無窮多個零點："])}
        </text>
        <text x={472} y={71} fontSize={11} className="fill-gray-700">
          {pick(["no computer reaches the end", "沒有電腦算得到盡頭"])}
        </text>
        <text
          x={472}
          y={236}
          fontSize={11}
          className="fill-teal-800 font-semibold"
        >
          {pick(["checked: every zero up to", "已檢查：高度 3·10¹² 以下"])}
        </text>
        <text
          x={472}
          y={251}
          fontSize={11}
          className="fill-teal-800 font-semibold"
        >
          {pick([
            "height 3·10¹² (Platt–Trudgian)",
            "的所有零點（Platt–Trudgian）",
          ])}
        </text>
        <text x={472} y={266} fontSize={11} className="fill-teal-800">
          {pick(["≈ 12 trillion zeros, all on ½", "≈ 12 兆個零點，全在 ½ 上"])}
        </text>
        <text
          x={560}
          y={290}
          fontSize={10}
          textAnchor="middle"
          className="fill-gray-500"
        >
          {pick([
            "the strip is drawn to scale only up to height 52",
            "左圖只畫到高度 52",
          ])}
        </text>
      </svg>
      {!reduce && (
        <div className="mt-1 flex justify-center">
          <button
            onClick={() => setRun((r) => r + 1)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
          >
            ↻ {pick(["Replay", "重播"])}
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ 2. the architecture

type Lane = "people" | "machine";
interface ArchStage {
  title: L;
  boxes: { lane: Lane; t: L; sub: L }[];
  text: L;
  people: L;
  machines: L;
}
const ARCH: ArchStage[] = [
  {
    title: ["1 · The question", "1 · 問題"],
    boxes: [
      {
        lane: "people",
        t: ["The question", "問題"],
        sub: ["Riemann, 1859", "黎曼，1859"],
      },
    ],
    text: [
      "Someone has to decide what is worth proving and why. Riemann's question came out of counting primes; the generalized version (GRH) asks the same of Dirichlet *L*-functions. No machine chose this target.",
      "必須有人決定什麼值得證明、為什麼。黎曼的問題來自計算質數的分布；推廣版（GRH）對 Dirichlet *L* 函數問同樣的事。這個目標不是機器選的。",
    ],
    people: [
      "choose the problem; know why it matters",
      "選題；知道它為什麼重要",
    ],
    machines: ["nothing yet", "還沒有事"],
  },
  {
    title: ["2 · A curated statement", "2 · 審定過的陳述"],
    boxes: [
      {
        lane: "people",
        t: ["Curated statement", "審定過的陳述"],
        sub: ["Challenge.lean", "Challenge.lean"],
      },
    ],
    text: [
      "Before any search, the target is written in Lean by people and reviewed. In the RH re-check repository, `src/Challenge.lean` states five theorems importing only Mathlib (one is `riemannHypothesis`). Reviewers read it line by line: Mathlib's `riemannZeta` has a junk value at the pole $s = 1$, which the statement excludes, and every `1 / 2` compared with `s.re` is real division.",
      "在任何搜尋之前，目標要由人用 Lean 寫好並審查。在 RH 重驗儲存庫裡，`src/Challenge.lean` 陳述了五個只匯入 Mathlib 的定理（其中一個是 `riemannHypothesis`）。審查者逐行閱讀：Mathlib 的 `riemannZeta` 在極點 $s = 1$ 有一個垃圾值，陳述把它排除了；每個和 `s.re` 比較的 `1 / 2` 都是實數除法。",
    ],
    people: [
      "write and read the statement: the one part nothing else checks",
      "寫出並讀懂陳述：沒有任何東西會替你檢查的部分",
    ],
    machines: ["only: does it typecheck?", "只檢查：型別對不對？"],
  },
  {
    title: ["3 · AI search", "3 · AI 搜尋"],
    boxes: [
      {
        lane: "machine",
        t: ["AI search", "AI 搜尋"],
        sub: ["17,374,215 lines", "17,374,215 行"],
      },
    ],
    text: [
      "The model proposes, Lean answers, over and over. What came out is an artefact no person wrote line by line: 175,187 `.lean` files, 17,374,215 lines, about 1.03 GB of source. The model can be wrong a million times; only what Lean accepts survives.",
      "模型提議、Lean 回答，一次又一次。產出的是一個沒有人逐行寫過的成品：175,187 個 `.lean` 檔、17,374,215 行、約 1.03 GB 的原始碼。模型可以錯一百萬次；只有 Lean 接受的部分會留下。",
    ],
    people: [
      "steer, split, restart (how much, the public record does not yet show)",
      "引導、拆解、重來（做了多少，公開紀錄還看不出來）",
    ],
    machines: [
      "generate and test at a scale no team could",
      "以任何團隊都做不到的規模產生與測試",
    ],
  },
  {
    title: ["4 · Machine gates", "4 · 機器關卡"],
    boxes: [
      {
        lane: "people",
        t: ["Q1: right statement?", "Q1：陳述對嗎？"],
        sub: ["human reading", "人來讀"],
      },
      {
        lane: "machine",
        t: ["Q2–Q4", "Q2–Q4"],
        sub: ["build · compare · re-check", "建置 · 比對 · 重驗"],
      },
    ],
    text: [
      "Kevin Buzzard's four questions. **Q1** Does the Lean statement match the informal one? (people). **Q2** Does it compile? (hours, in a sandbox with no network). **Q3** Does it prove *that* statement with only the standard axioms? (`lake comparator` compares the trusted challenge with the untrusted solution). **Q4** Does it exploit a kernel bug? (`--paranoid`: independent kernels, here Lean's and nanoda).",
      "Kevin Buzzard 的四個問題。**Q1** Lean 陳述和非形式陳述一致嗎？（人）。**Q2** 能編譯嗎？（在沒有網路的沙盒裡跑好幾個小時）。**Q3** 它只用標準公理證出 *那個* 陳述嗎？（`lake comparator` 比對受信任的挑戰檔與不受信任的解答）。**Q4** 它有沒有利用核心的 bug？（`--paranoid`：用獨立的核心，這裡是 Lean 的與 nanoda）。",
    ],
    people: [
      "Q1, and choosing what the checks trust",
      "Q1，以及決定檢查要信任什麼",
    ],
    machines: [
      "Q2–Q4: tireless, exact, cheap to repeat",
      "Q2–Q4：不會累、精確、可以便宜地重複",
    ],
  },
  {
    title: ["5 · Digestion", "5 · 消化"],
    boxes: [
      {
        lane: "people",
        t: ["Digestion", "消化"],
        sub: ["fragments · strategy", "拆片段 · 找策略"],
      },
    ],
    text: [
      'A green check says the steps are valid; it does not say *why*. People now break the artefact into pieces, isolate the lemmas that carry the weight, rewrite them shorter, and try to extract a strategy a human can hold. Terence Tao calls the state of this work how "digested" a result is, and expects it to take time.',
      "綠色勾勾說明每一步都成立；它沒有說 *為什麼*。接下來由人把成品拆成片段，找出真正承重的引理，改寫得更短，試著萃取出人能掌握的策略。陶哲軒用一個結果被「消化」的程度來描述這項工作，並預期它需要時間。",
    ],
    people: ["find the ideas; decide what is new", "找出想法；判斷什麼是新的"],
    machines: [
      "help: search, shorten, explain, re-check every rewrite",
      "幫忙：搜尋、縮短、解說，並重驗每一次改寫",
    ],
  },
  {
    title: ["6 · Understanding", "6 · 理解"],
    boxes: [
      {
        lane: "people",
        t: ["Understanding", "理解"],
        sub: ["papers · new tools", "論文 · 新工具"],
      },
    ],
    text: [
      "The goal of mathematics is not a bit that says *true* but understanding that others can use: a written proof, new methods, connections to other problems. Many published results assume RH; a proof that people understand could become a toolkit, not just a verdict.",
      "數學的目的不是一個寫著 *真* 的位元，而是別人能用的理解：寫成文字的證明、新方法、和其他問題的連結。許多已發表的結果以 RH 為前提；一個被人理解的證明可能變成一整套工具，而不只是一個判決。",
    ],
    people: ["explain, teach, build on it", "解說、教學、在它之上繼續建造"],
    machines: ["keep every later step honest", "讓之後的每一步都保持誠實"],
  },
];

/** A box title longer than 15 characters on two lines, split at the space nearest its middle (Chinese stays on one line). */
function archTitleLines(t: string): string[] {
  if (t.length <= 15 || !t.includes(" ")) return [t];
  const mid = t.length / 2;
  let best = -1;
  for (let k = 0; k < t.length; k++)
    if (t[k] === " " && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid)))
      best = k;
  return [t.slice(0, best), t.slice(best + 1)];
}

/** A "a · b · c" subline packed into lines of at most 15 characters, broken at the dots. */
function archSubLines(t: string): string[] {
  const parts = t.split(" · ");
  const out: string[] = [];
  for (const p of parts) {
    const last = out.length ? out[out.length - 1] : null;
    if (last !== null && (last + " · " + p).length <= 15)
      out[out.length - 1] = last + " · " + p;
    else out.push(p);
  }
  return out;
}

/** How AI and people prove together, one stage at a time, with a lane for people and a lane for machines. */
export function ProofArchitecture() {
  const { pick } = useLang();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      if (i >= ARCH.length - 1) setPlaying(false);
      else setI(i + 1);
    }, 2600);
    return () => window.clearTimeout(t);
  }, [playing, i]);
  const s = ARCH[i];
  const colX = (k: number) => 16 + k * 118;
  const laneY: Record<Lane, number> = { people: 48, machine: 150 };
  // the path the work travels: (column, lane)
  const path: [number, Lane][] = [
    [0, "people"],
    [1, "people"],
    [2, "machine"],
    [3, "machine"],
    [3, "people"],
    [4, "people"],
    [5, "people"],
  ];
  const BOX_H = 66;
  const centre = ([k, lane]: [number, Lane]): [number, number] => [
    colX(k) + 53,
    laneY[lane] + BOX_H / 2,
  ];
  return (
    <div className="w-full" data-testid="proof-architecture">
      <div className="mb-3 flex flex-wrap gap-1">
        {ARCH.map((st, k) => (
          <button
            key={k}
            onClick={() => {
              setPlaying(false);
              setI(k);
            }}
            aria-pressed={k === i}
            className={`rounded-full px-3 py-1 text-xs ${k === i ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {pick(st.title)}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 724 236"
        className="w-full max-w-[724px]"
        role="img"
        aria-label={pick(s.title)}
      >
        <rect
          x={4}
          y={36}
          width={716}
          height={84}
          rx={10}
          className="fill-amber-50/60"
        />
        <rect
          x={4}
          y={138}
          width={716}
          height={84}
          rx={10}
          className="fill-violet-50/60"
        />
        <text
          x={12}
          y={30}
          fontSize={11}
          className="fill-amber-800 font-semibold"
        >
          {pick(["People", "人"])}
        </text>
        <text
          x={12}
          y={234}
          fontSize={11}
          className="fill-violet-800 font-semibold"
        >
          {pick(["Machines (AI and checkers)", "機器（AI 與檢查器）"])}
        </text>
        {path.slice(1).map((p, k) => {
          const [x1, y1] = centre(path[k]);
          const [x2, y2] = centre(p);
          const sameCol = path[k][0] === p[0];
          return sameCol ? (
            <Arrow
              key={k}
              x1={x1}
              y1={y1 - BOX_H / 2 - 2}
              x2={x2}
              y2={y2 + BOX_H / 2 + 2}
              cls="stroke-gray-400"
            />
          ) : (
            <Arrow
              key={k}
              x1={x1 + 53}
              y1={y1}
              x2={x2 - 55}
              y2={y2}
              cls="stroke-gray-400"
            />
          );
        })}
        {ARCH.map((st, k) =>
          st.boxes.map((b) => {
            const on = k === i;
            const y = laneY[b.lane];
            const tl = archTitleLines(pick(b.t));
            const sl = archSubLines(pick(b.sub));
            const top =
              y + (BOX_H - (tl.length * 14 + sl.length * 12)) / 2 + 10;
            return (
              <g
                key={`${k}-${b.lane}`}
                style={{
                  opacity: on ? 1 : 0.45,
                  transition: reduce ? undefined : "opacity 300ms",
                }}
              >
                <rect
                  x={colX(k)}
                  y={y}
                  width={106}
                  height={BOX_H}
                  rx={8}
                  strokeWidth={on ? 2.4 : 1.2}
                  className={
                    on
                      ? "fill-white stroke-(--lk-accent)"
                      : b.lane === "people"
                        ? "fill-white stroke-amber-400"
                        : "fill-white stroke-violet-400"
                  }
                />
                {tl.map((line, n) => (
                  <text
                    key={`t${n}`}
                    x={colX(k) + 53}
                    y={top + n * 14}
                    textAnchor="middle"
                    fontSize={11.5}
                    className="fill-gray-900 font-semibold"
                  >
                    {line}
                  </text>
                ))}
                {sl.map((line, n) => (
                  <text
                    key={`s${n}`}
                    x={colX(k) + 53}
                    y={top + tl.length * 14 + 2 + n * 12}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontFamily={MONO}
                    className="fill-gray-600"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          }),
        )}
      </svg>
      <div className="mt-3 space-y-2">
        <p className="text-sm leading-relaxed text-gray-700">
          <RichText text={pick(s.text)} />
        </p>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-950">
            <span className="font-semibold">{pick(["People: ", "人："])}</span>
            {pick(s.people)}
          </p>
          <p className="rounded-md bg-violet-50 px-3 py-2 text-violet-950">
            <span className="font-semibold">
              {pick(["Machines: ", "機器："])}
            </span>
            {pick(s.machines)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setPlaying(false);
              setI((k) => Math.max(0, k - 1));
            }}
            disabled={i === 0}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs disabled:opacity-40"
          >
            ◂ {pick(["Back", "上一步"])}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setI((k) => Math.min(ARCH.length - 1, k + 1));
            }}
            disabled={i === ARCH.length - 1}
            className="rounded-md bg-(--lk-accent) px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
            data-testid="arch-next"
          >
            {pick(["Next stage", "下一階段"])} ▸
          </button>
          {!reduce && (
            <button
              onClick={() => {
                if (!playing && i === ARCH.length - 1) setI(0);
                setPlaying((p) => !p);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
            >
              {playing
                ? `❚❚ ${pick(["Pause", "暫停"])}`
                : `▶ ${pick(["Play all", "自動播放"])}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Tao's ladder

const LADDER: { name: L; lean: L; human: L; digested: number; note: L }[] = [
  {
    name: ["Euler blowup", "Euler 爆破"],
    lean: ["✓ formalized", "✓ 已形式化"],
    human: ["✓ human-readable", "✓ 人可讀"],
    digested: 0.85,
    note: ["most digested", "消化得最多"],
  },
  {
    name: ["Navier–Stokes", "Navier–Stokes"],
    lean: ["✓ formalized", "✓ 已形式化"],
    human: ['"technically" readable', "「技術上」可讀"],
    digested: 0.5,
    note: ["needs a proper write-up", "需要正式的寫作"],
  },
  {
    name: ["GRH (Alpöge)", "GRH（Alpöge）"],
    lean: ["Lean only, enormous", "只有 Lean，極大"],
    human: ["— none yet", "— 還沒有"],
    digested: 0.1,
    note: ["digestion will take time", "消化需要時間"],
  },
];

/** Tao's ranking of three results by how "digested" they are. */
export function DigestionLadder() {
  const { pick } = useLang();
  const rowY = (k: number) => 62 + k * 52;
  return (
    <svg
      viewBox="0 0 660 220"
      className="w-full max-w-[660px]"
      role="img"
      aria-label={pick([
        "Three results ranked by how digested they are",
        "依消化程度排列的三個結果",
      ])}
    >
      {(
        [
          [20, ["Result", "結果"]],
          [190, ["Lean", "Lean"]],
          [320, ["Human-readable proof", "人可讀的證明"]],
          [470, ["How digested", "消化程度"]],
        ] as [number, L][]
      ).map(([x, t]) => (
        <text
          key={x}
          x={x}
          y={30}
          fontSize={11}
          className="fill-gray-500 font-semibold"
        >
          {pick(t)}
        </text>
      ))}
      <line x1={14} y1={38} x2={646} y2={38} className="stroke-gray-200" />
      {LADDER.map((r, k) => (
        <g key={k}>
          <text
            x={20}
            y={rowY(k) + 4}
            fontSize={12.5}
            className="fill-gray-900 font-semibold"
          >
            {pick(r.name)}
          </text>
          <text
            x={190}
            y={rowY(k) + 4}
            fontSize={11}
            className={k < 2 ? "fill-emerald-700" : "fill-violet-700"}
          >
            {pick(r.lean)}
          </text>
          <text
            x={320}
            y={rowY(k) + 4}
            fontSize={11}
            className={k === 0 ? "fill-emerald-700" : "fill-gray-600"}
          >
            {pick(r.human)}
          </text>
          <rect
            x={470}
            y={rowY(k) - 10}
            width={170}
            height={14}
            rx={7}
            className="fill-gray-100"
          />
          <rect
            x={470}
            y={rowY(k) - 10}
            width={170 * r.digested}
            height={14}
            rx={7}
            className="fill-amber-400"
          />
          <text
            x={470}
            y={rowY(k) + 18}
            fontSize={10}
            className="fill-gray-500"
          >
            {pick(r.note)}
          </text>
        </g>
      ))}
      <text
        x={330}
        y={212}
        textAnchor="middle"
        fontSize={10}
        className="fill-gray-500"
      >
        {pick([
          "Order from Tao's post (20 Nov 2026); bar lengths are only a picture of the order, not a measurement.",
          "順序取自陶哲軒的文章（2026 年 11 月 20 日）；長條長度只是示意順序，不是測量值。",
        ])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ 3. the mirror case

/** Two pipelines from the same day, mirrored. */
export function MirrorPipelines() {
  const { pick } = useLang();
  const row = (
    y: number,
    boxes: { t: L; sub: L; cls: string; dashed?: boolean }[],
    label: L,
    status: L,
  ) => (
    <g>
      <text
        x={20}
        y={y - 10}
        fontSize={12}
        className="fill-gray-900 font-semibold"
      >
        {pick(label)}
      </text>
      {boxes.map((b, k) => (
        <g key={k}>
          <rect
            x={20 + k * 170}
            y={y}
            width={140}
            height={54}
            rx={9}
            className={b.cls}
            strokeWidth={1.6}
            strokeDasharray={b.dashed ? "5 4" : undefined}
          />
          <text
            x={90 + k * 170}
            y={y + 23}
            textAnchor="middle"
            fontSize={12}
            className="fill-gray-900 font-semibold"
          >
            {pick(b.t)}
          </text>
          <text
            x={90 + k * 170}
            y={y + 41}
            textAnchor="middle"
            fontSize={10}
            className="fill-gray-600"
          >
            {pick(b.sub)}
          </text>
          {k < boxes.length - 1 && (
            <Arrow
              x1={162 + k * 170}
              y1={y + 27}
              x2={188 + k * 170}
              y2={y + 27}
            />
          )}
        </g>
      ))}
      <rect
        x={530}
        y={y + 12}
        width={136}
        height={30}
        rx={15}
        className="fill-white stroke-gray-300"
      />
      <text
        x={598}
        y={y + 31}
        textAnchor="middle"
        fontSize={10.5}
        className="fill-gray-700"
      >
        {pick(status)}
      </text>
    </g>
  );
  const P = "fill-amber-50 stroke-amber-500";
  const A = "fill-violet-50 stroke-violet-400";
  const M = "fill-teal-50 stroke-teal-600";
  return (
    <svg
      viewBox="0 0 680 260"
      className="w-full max-w-[680px]"
      role="img"
      aria-label={pick([
        "Two claimed proofs of GRH on the same day, with the roles of people and AI reversed",
        "同一天的兩個 GRH 證明宣稱，人和 AI 的角色正好相反",
      ])}
    >
      {row(
        36,
        [
          {
            t: ["AI writes", "AI 寫"],
            sub: ["with a mathematician", "與數學家合作"],
            cls: A,
          },
          {
            t: ["Machines check", "機器檢查"],
            sub: ["Lean, independent kernels", "Lean、獨立核心"],
            cls: M,
          },
          {
            t: ["People digest", "人來消化"],
            sub: ["the open part", "尚未完成的部分"],
            cls: P,
            dashed: true,
          },
        ],
        ["Alpöge with Claude: a Lean proof", "Alpöge 與 Claude：Lean 證明"],
        ["Lean: certified 21 Nov", "Lean：11/21 已認證"],
      )}
      <line
        x1={14}
        y1={130}
        x2={666}
        y2={130}
        strokeDasharray="2 4"
        className="stroke-gray-400"
      />
      <text
        x={340}
        y={126}
        textAnchor="middle"
        fontSize={10}
        className="fill-gray-500"
      >
        {pick([
          "mirror · both announced 20 November 2026",
          "鏡像 · 兩者都在 2026 年 11 月 20 日公布",
        ])}
      </text>
      {row(
        170,
        [
          {
            t: ["A person writes", "人寫"],
            sub: ['"all human, with no AI"', "「全部是人，沒有 AI」"],
            cls: P,
          },
          {
            t: ["AI-assisted readers", "借助 AI 的讀者"],
            sub: ["report problems in ~8 h", "約 8 小時內回報問題"],
            cls: A,
          },
          {
            t: ["Lean could settle", "Lean 能判定"],
            sub: ["the logic, if formalized", "邏輯部分，若形式化"],
            cls: M,
            dashed: true,
          },
        ],
        [
          "Masullo: a natural-language proof (Vakil's post)",
          "Masullo：自然語言證明（Vakil 的文章）",
        ],
        ["problems reported", "已有人回報問題"],
      )}
      <text
        x={340}
        y={252}
        textAnchor="middle"
        fontSize={10}
        className="fill-gray-500"
      >
        {pick([
          "dashed = not done yet · as of 22 November 2026",
          "虛線 = 尚未完成 · 截至 2026 年 11 月 22 日",
        ])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ 4. where we stand

/** Mainstream practice next to this site's stated position. */
export function TwoPositions() {
  const { pick } = useLang();
  const box = (
    x: number,
    y: number,
    w: number,
    t: L,
    cls: string,
    dashed = false,
  ) => (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={40}
        rx={8}
        className={cls}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text
        x={x + w / 2}
        y={y + 25}
        textAnchor="middle"
        fontSize={11.5}
        className="fill-gray-900"
      >
        {pick(t)}
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 660 270"
      className="w-full max-w-[660px]"
      role="img"
      aria-label={pick(["Two positions", "兩種立場"])}
    >
      <text x={20} y={22} fontSize={12} className="fill-gray-900 font-semibold">
        {pick(["Mainstream practice today", "目前的主流做法"])}
      </text>
      {box(
        20,
        34,
        150,
        ["natural-language proof", "自然語言證明"],
        "fill-amber-50 stroke-amber-500",
      )}
      <Arrow x1={172} y1={54} x2={206} y2={54} />
      {box(
        210,
        34,
        210,
        ["peer review + scrutiny over time", "同儕審查 + 長期檢驗"],
        "fill-white stroke-gray-400",
      )}
      <Arrow x1={422} y1={54} x2={456} y2={54} />
      {box(
        460,
        34,
        180,
        ["accepted", "被接受"],
        "fill-emerald-50 stroke-emerald-500",
      )}
      {box(
        210,
        84,
        210,
        ["Lean proof: welcome, optional", "Lean 證明：歡迎，但非必要"],
        "fill-teal-50 stroke-teal-500",
        true,
      )}
      <line x1={14} y1={146} x2={646} y2={146} className="stroke-gray-200" />
      <text
        x={20}
        y={170}
        fontSize={12}
        className="fill-gray-900 font-semibold"
      >
        {pick([
          "This site's stated position (not a consensus)",
          "本站的立場（不是共識）",
        ])}
      </text>
      {box(
        20,
        182,
        150,
        ["natural-language proof", "自然語言證明"],
        "fill-amber-50 stroke-amber-500",
      )}
      {box(
        20,
        226,
        150,
        ["Lean proof", "Lean 證明"],
        "fill-teal-50 stroke-teal-500",
      )}
      <path
        d="M172 202 C200 202, 200 224, 228 224"
        fill="none"
        strokeWidth={1.6}
        className="stroke-gray-400"
      />
      <path
        d="M172 246 C200 246, 200 224, 228 224"
        fill="none"
        strokeWidth={1.6}
        className="stroke-gray-400"
      />
      <text
        x={232}
        y={229}
        fontSize={16}
        className="fill-gray-700 font-semibold"
      >
        +
      </text>
      <Arrow x1={248} y1={224} x2={300} y2={224} />
      {box(
        304,
        204,
        180,
        ["complete", "完整"],
        "fill-emerald-50 stroke-emerald-500",
      )}
      <text x={500} y={220} fontSize={10.5} className="fill-gray-600">
        {pick(["either one alone:", "只有其中一個："])}
      </text>
      <text x={500} y={236} fontSize={10.5} className="fill-gray-600">
        {pick(["incomplete", "不完整"])}
      </text>
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------ one stream each

/**
 * One proof, two languages, applied to the two claims of 20 Nov 2026: each is a ladder with one rail missing.
 * Alpöge's RH claim has the Lean rail only (certified by the Lean and Mathlib communities, 21 Nov 2026); Masullo's GRH proposal has the natural-language rail only (as of 22 Nov 2026).
 */
export function OneStreamEach() {
  const { pick } = useLang();
  const ladder = (o: {
    title: L;
    nl: L[];
    lean: L[];
    leanSolid: boolean;
    foot: L;
  }) => {
    const rail = (
      x: number,
      solid: boolean,
      label: L,
      lines: L[],
      tone: "amber" | "teal",
    ) => (
      <g>
        <rect
          x={x}
          y={44}
          width={124}
          height={108}
          rx={8}
          strokeWidth={1.5}
          strokeDasharray={solid ? undefined : "5 4"}
          className={
            solid
              ? tone === "amber"
                ? "fill-amber-50 stroke-amber-500"
                : "fill-teal-50 stroke-teal-500"
              : "fill-white stroke-gray-300"
          }
        />
        <text
          x={x + 62}
          y={63}
          textAnchor="middle"
          fontSize={11}
          className={
            solid
              ? "fill-gray-900 font-semibold"
              : "fill-gray-400 font-semibold"
          }
        >
          {pick(label)}
        </text>
        {lines.map((t, k) => (
          <text
            key={k}
            x={x + 62}
            y={92 + k * 18}
            textAnchor="middle"
            fontSize={11}
            className={solid ? "fill-gray-700" : "fill-gray-400"}
          >
            {pick(t)}
          </text>
        ))}
      </g>
    );
    return (
      <svg
        viewBox="0 0 300 186"
        className="w-full max-w-[320px]"
        role="img"
        aria-label={pick(o.title)}
      >
        <text
          x={150}
          y={20}
          textAnchor="middle"
          fontSize={12}
          className="fill-gray-900 font-semibold"
        >
          {pick(o.title)}
        </text>
        {rail(8, !o.leanSolid, ["natural language", "自然語言"], o.nl, "amber")}
        {rail(168, o.leanSolid, ["Lean", "Lean"], o.lean, "teal")}
        {[74, 98, 122, 146].map((y) => (
          <line
            key={y}
            x1={134}
            y1={y - 4}
            x2={166}
            y2={y - 4}
            strokeWidth={1.6}
            strokeDasharray="3 4"
            className="stroke-gray-300"
          />
        ))}
        <text
          x={150}
          y={176}
          textAnchor="middle"
          fontSize={11.5}
          className="fill-gray-700"
        >
          {pick(o.foot)}
        </text>
      </svg>
    );
  };
  return (
    <div
      className="flex w-full flex-wrap justify-center gap-x-6 gap-y-3"
      data-testid="one-stream-each"
    >
      {ladder({
        title: ["Alpöge with Claude: RH", "Alpöge 與 Claude：RH"],
        nl: [["not written yet", "尚未寫出"]],
        lean: [
          ["17,374,215 lines", "17,374,215 行"],
          ["certified by the", "已由 Lean 與"],
          ["Lean + Mathlib", "Mathlib 社群認證"],
          ["communities, 21 Nov", "（2026/11/21）"],
        ],
        leanSolid: true,
        foot: ["the Lean stream only", "只有 Lean 這一條"],
      })}
      {ladder({
        title: ["Masullo: GRH", "Masullo：GRH"],
        nl: [
          ["a proposed proof", "提出的證明"],
          ["problems reported", "已有人回報問題"],
          ["(found with AI)", "（借助 AI 找到）"],
        ],
        lean: [["none", "沒有"]],
        leanSolid: false,
        foot: ["the natural-language stream only", "只有自然語言這一條"],
      })}
    </div>
  );
}

/**
 * Masullo's §1.4.3 as a chain (as described in Baez's summary and the crowdsourced formalization): cutoff
 * approximations → a uniform bound on compact sets → Montel's theorem gives a convergent subsequence → the limit
 * identity the later chapters use. The bound is the link reported false as printed (a counterexample at the trivial
 * character of ℚ, real place), so the links after it lose their support until it is repaired. Status 23 Nov 2026.
 */
export function BrokenLink() {
  const { pick } = useLang();
  const steps: { t: L; s: L; bad?: boolean }[] = [
    { t: ["Approximations", "近似式"], s: ["with a cutoff", "帶截斷"] },
    {
      t: ["Uniform bound", "均勻有界"],
      s: ["on compact sets, §1.4.3", "緊集上，§1.4.3"],
      bad: true,
    },
    {
      t: ["Montel's theorem", "Montel 定理"],
      s: ["a convergent subsequence", "收斂的子序列"],
    },
    { t: ["The limit", "極限式"], s: ["used later on", "後面的章節要用"] },
  ];
  const W = 132;
  const G = 28;
  return (
    <svg
      viewBox="0 0 640 180"
      className="w-full max-w-[640px]"
      role="img"
      aria-label={pick(["The broken link in §1.4.3", "§1.4.3 斷掉的一環"])}
    >
      {steps.map((st, i) => {
        const x = 8 + i * (W + G);
        const after = i > 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={30}
              width={W}
              height={60}
              rx={10}
              strokeWidth={1.5}
              strokeDasharray={after ? "5 4" : undefined}
              className={
                st.bad
                  ? "fill-red-50 stroke-red-500"
                  : after
                    ? "fill-white stroke-gray-300"
                    : "fill-white stroke-gray-500"
              }
            />
            <text
              x={x + W / 2}
              y={56}
              textAnchor="middle"
              fontSize={13}
              className={
                st.bad
                  ? "fill-red-700 font-semibold"
                  : "fill-gray-900 font-semibold"
              }
            >
              {pick(st.t)}
            </text>
            <text
              x={x + W / 2}
              y={76}
              textAnchor="middle"
              fontSize={11}
              className="fill-gray-500"
            >
              {pick(st.s)}
            </text>
            {i < steps.length - 1 && (
              <g>
                <line
                  x1={x + W + 2}
                  y1={60}
                  x2={x + W + G - 4}
                  y2={60}
                  className={i >= 1 ? "stroke-gray-300" : "stroke-gray-500"}
                  strokeWidth={2}
                  strokeDasharray={i >= 1 ? "4 3" : undefined}
                />
                <path
                  d={`M${x + W + G - 6} 55 L${x + W + G} 60 L${x + W + G - 6} 65 Z`}
                  className={i >= 1 ? "fill-gray-300" : "fill-gray-500"}
                />
              </g>
            )}
          </g>
        );
      })}
      <text
        x={8 + W + G + W / 2}
        y={22}
        textAnchor="middle"
        fontSize={18}
        className="fill-red-500"
      >
        ✕
      </text>
      <text
        x={8 + W + G + W / 2}
        y={112}
        textAnchor="middle"
        fontSize={11}
        className="fill-red-700"
      >
        {pick(["false as printed:", "照原文寫的是錯的："])}
      </text>
      <text
        x={8 + W + G + W / 2}
        y={128}
        textAnchor="middle"
        fontSize={11}
        className="fill-red-700"
      >
        {pick(["trivial character of ℚ", "ℚ 的平凡特徵"])}
      </text>
      <text
        x={8 + 2 * (W + G) + W + G / 2}
        y={112}
        textAnchor="middle"
        fontSize={11}
        className="fill-gray-500"
      >
        {pick(["unsupported until repaired", "修好之前失去支撐"])}
      </text>
      <text
        x={320}
        y={166}
        textAnchor="middle"
        fontSize={11}
        className="fill-gray-600"
      >
        {pick([
          "A gap in the proof as written, not a proof that GRH is false.",
          "這是原文證明的缺口，不是證明 GRH 不成立。",
        ])}
      </text>
    </svg>
  );
}
