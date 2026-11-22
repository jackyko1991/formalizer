/**
 * Concept ▸ Checking the checker: the pictures.
 *   FourGates       Buzzard's four questions as four gates; pick a submission and watch where it is stopped
 *   FourGatesMini   a small static version (the thumbnail on How Lean checks)
 *   TrustOnion      what a "checked" result still trusts, layer by layer (click a layer)
 *   KernelsAgree    one exported proof, several kernels: do they agree? (an honest proof vs one exploiting a kernel bug)
 *   CheckerStrip    which checker catches which trick, and where it runs (Lite = any OS, Full = Linux / WSL / cloud)
 *   ComparatorFlow  the comparator workflow as test-driven development: the frozen statement is the test, red → green
 *   RhBoard         the Riemann re-check, gate by gate (as of 22 November 2026)
 *   PaperVsLean, SandboxFigure, SameTextFigure, LiteFull   one small picture for gates 1–3 and for what Formalizer runs
 * Labels are [English, Traditional Chinese]. Colours follow the site: amber = open / waiting, green = passed,
 * red = stopped. Animation stops when the reader asks for reduced motion.
 */
import { useLang } from "@learnkit/web";
import { useEffect, useState, type ReactNode } from "react";

type L = readonly [string, string];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** True when the reader asked the system for reduced motion. */
export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const m = window.matchMedia?.(query);
    if (!m) return;
    const f = () => setReduced(m.matches);
    m.addEventListener?.("change", f);
    return () => m.removeEventListener?.("change", f);
  }, []);
  return reduced;
}

/** `code` and *italic* inside a short label. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*[^*]+\*)/).map((part, k) =>
        part.startsWith("`") ? (
          <code key={k} className="rounded bg-gray-100 px-1 text-[0.9em] text-gray-800">
            {part.slice(1, -1)}
          </code>
        ) : part.startsWith("*") ? (
          <em key={k}>{part.slice(1, -1)}</em>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Chip({ on, onClick, children, testid }: { on: boolean; onClick: () => void; children: ReactNode; testid?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      data-testid={testid}
      className={`rounded-full px-3 py-1 text-xs ${on ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------------------------------------------ the four gates

export const GATES: { q: L; who: L }[] = [
  { q: ["Says what the paper says?", "說的是論文說的嗎？"], who: ["a person reads it", "由人來讀"] },
  { q: ["Does it compile?", "能編譯嗎？"], who: ["Lean, in a sandbox", "Lean，在沙盒裡"] },
  { q: ["Proves exactly that?", "證的正是它嗎？"], who: ["comparator, axioms", "comparator、公理"] },
  { q: ["Is the judge sound?", "裁判可靠嗎？"], who: ["a second kernel", "第二個核心"] },
];

const SUBMISSIONS: { name: L; stop: number; why: L }[] = [
  {
    name: ["An honest proof", "老實的證明"],
    stop: 4,
    why: [
      "It passes all four gates. Only now does *the proof is checked in Lean* mean what it sounds like.",
      "四道關卡都通過。到這時候，*證明已由 Lean 檢查* 才真的是字面上的意思。",
    ],
  },
  {
    name: ["FLT without `0 < a`", "少了 `0 < a` 的費馬最後定理"],
    stop: 0,
    why: [
      "The statement is false (take a = b = c = 0), so no proof will ever arrive; but a *true* careless statement would sail through gates 2–4. Only a reader catches this.",
      "這個陳述是錯的（取 a = b = c = 0），所以永遠不會有證明；但若是一個粗心卻 *成立* 的陳述，2 到 4 關都會順利通過。只有讀的人抓得到。",
    ],
  },
  {
    name: ["13 million lines", "1300 萬行"],
    stop: 1,
    why: [
      "It may not build at all: out of memory, out of time, a missing file. And building runs the author's code, so it is done in a sandbox.",
      "它可能根本建置不起來：記憶體不夠、時間不夠、少了檔案。而且建置會執行作者的程式碼，所以要在沙盒裡做。",
    ],
  },
  {
    name: ["`^` secretly means 37", "`^` 偷偷代表 37"],
    stop: 2,
    why: [
      "It compiles and `#print axioms` is clean, but the theorem it proves is not the one in the challenge. Comparing the statements, definitions included, catches it. So does the axiom list for `sorry`, `native_decide` or a new `axiom`.",
      "它能編譯，`#print axioms` 也乾乾淨淨，但它證的定理不是挑戰裡那一個。把陳述（連同用到的定義）拿來比對就抓到了。若是 `sorry`、`native_decide` 或新寫的 `axiom`，公理清單也會抓到。",
    ],
  },
  {
    name: ["Exploits a kernel bug", "利用核心的 bug"],
    stop: 3,
    why: [
      "Lean's own kernel says yes; it has a bug. A second kernel, written independently, says no. The two disagree, so nothing is accepted until a person looks.",
      "Lean 自己的核心說可以；它有 bug。另一個獨立寫成的核心說不行。兩者意見不一，所以在有人查清楚之前，什麼都不接受。",
    ],
  },
];

const GATE_X = [170, 290, 410, 530];
const TOKEN_X = [70, ...GATE_X, 604];

/** A short caption split at the space nearest its middle when it is longer than `max` characters (Chinese has no spaces: one line). */
function wrap2(text: string, max = 16): string[] {
  if (text.length <= max || !text.includes(" ")) return [text];
  const mid = text.length / 2;
  let best = -1;
  for (let k = 0; k < text.length; k++) if (text[k] === " " && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k;
  return [text.slice(0, best), text.slice(best + 1)];
}

/** One gate: two posts and a lintel, coloured by state. */
function Gate({ x, n, state }: { x: number; n: number; state: "idle" | "pass" | "stop" }) {
  const cls = state === "pass" ? "fill-emerald-500" : state === "stop" ? "fill-red-500" : "fill-gray-400";
  return (
    <g>
      <rect x={x - 34} y={44} width={8} height={70} rx={2} className={cls} />
      <rect x={x + 26} y={44} width={8} height={70} rx={2} className={cls} />
      <rect x={x - 40} y={36} width={80} height={12} rx={3} className={cls} />
      <circle cx={x} cy={24} r={11} className={state === "idle" ? "fill-white stroke-gray-400" : state === "pass" ? "fill-emerald-50 stroke-emerald-500" : "fill-red-50 stroke-red-500"} strokeWidth={1.5} />
      <text x={x} y={28.5} textAnchor="middle" fontSize={12} className="fill-gray-800 font-semibold">
        {n}
      </text>
      {state === "stop" && <rect x={x - 26} y={60} width={52} height={7} rx={2} className="fill-red-500" />}
    </g>
  );
}

/** Buzzard's four questions as gates. Pick a submission: the token walks until a gate stops it, or reaches ✓. */
export function FourGates() {
  const { pick } = useLang();
  const reduced = useReducedMotion();
  const [sub, setSub] = useState(0);
  const target = SUBMISSIONS[sub].stop; // gate index that stops it, or 4 = through
  const [pos, setPos] = useState(reduced ? target + 1 : 0); // 0 = start, 1..4 = at gate, 5 = end
  useEffect(() => {
    const goal = target + 1;
    if (reduced) {
      setPos(goal);
      return;
    }
    setPos(0);
    let p = 0;
    const id = window.setInterval(() => {
      p += 1;
      setPos(p);
      if (p >= goal) window.clearInterval(id);
    }, 520);
    return () => window.clearInterval(id);
  }, [sub, target, reduced]);
  const done = pos === target + 1;
  const stopped = target < 4;
  const state = (g: number): "idle" | "pass" | "stop" => (pos > g + 1 || (pos === g + 1 && !(stopped && g === target)) ? "pass" : pos === g + 1 && stopped && g === target ? "stop" : "idle");
  const tx = TOKEN_X[Math.min(pos, 5)] - (stopped && pos === target + 1 ? 46 : 0);
  return (
    <div className="w-full" data-testid="four-gates">
      <div className="mb-3 flex flex-wrap gap-1">
        {SUBMISSIONS.map((s, k) => (
          <Chip key={k} on={k === sub} onClick={() => setSub(k)}>
            <Rich text={pick(s.name)} />
          </Chip>
        ))}
      </div>
      <svg viewBox="0 0 680 200" className="w-full max-w-[680px]" role="img" aria-label={pick(["Four gates a proof must pass", "證明必須通過的四道關卡"])}>
        <line x1={30} y1={100} x2={660} y2={100} strokeWidth={3} className="stroke-gray-200" />
        <text x={40} y={136} fontSize={11} className="fill-gray-500">
          {pick(["submitted", "提交"])}
        </text>
        {GATES.map((g, i) => {
          const q = wrap2(pick(g.q));
          return (
            <g key={i}>
              <Gate x={GATE_X[i]} n={i + 1} state={state(i)} />
              {q.map((line, k) => (
                <text key={k} x={GATE_X[i]} y={136 + k * 14} textAnchor="middle" fontSize={11.5} className="fill-gray-900 font-semibold">
                  {line}
                </text>
              ))}
              <text x={GATE_X[i]} y={136 + q.length * 14 + 2} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
                {pick(g.who)}
              </text>
            </g>
          );
        })}
        <circle cx={640} cy={100} r={16} className={done && !stopped ? "fill-emerald-600" : "fill-gray-200"} />
        <path d="M632,100 l5.5,6 l10,-11" fill="none" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="stroke-white" />
        <g style={{ transform: `translateX(${tx}px)`, transition: reduced ? "none" : "transform 450ms ease-in-out" }}>
          <rect x={-14} y={86} width={28} height={28} rx={5} className={done && stopped ? "fill-red-100 stroke-red-500" : "fill-white stroke-gray-600"} strokeWidth={1.5} />
          <text x={0} y={104.5} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
            {done && stopped ? "✖" : "⊢"}
          </text>
        </g>
        <text x={340} y={188} textAnchor="middle" fontSize={11} className="fill-gray-500">
          {pick(["Lean's green check answers gate 2 and part of gate 3. The others need more.", "Lean 的綠色勾勾只回答第 2 關和一部分的第 3 關，其他關卡需要更多。"])}
        </text>
      </svg>
      <p className="mt-2 min-h-[3em] rounded-md bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200" aria-live="polite">
        {done ? <Rich text={pick(SUBMISSIONS[sub].why)} /> : "…"}
      </p>
    </div>
  );
}

/** The four gates, small and still: a thumbnail for other pages. */
export function FourGatesMini() {
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 520 110" className="w-full max-w-[520px]" role="img" aria-label={pick(["Four gates a proof must pass", "證明必須通過的四道關卡"])}>
      <line x1={10} y1={58} x2={510} y2={58} strokeWidth={3} className="stroke-gray-200" />
      {GATES.map((g, i) => {
        const x = 75 + i * 120;
        return (
          <g key={i}>
            <rect x={x - 26} y={22} width={6} height={46} rx={2} className="fill-teal-600" />
            <rect x={x + 20} y={22} width={6} height={46} rx={2} className="fill-teal-600" />
            <rect x={x - 30} y={16} width={60} height={9} rx={3} className="fill-teal-600" />
            <text x={x} y={52} textAnchor="middle" fontSize={15} className="fill-teal-800 font-semibold">
              {i + 1}
            </text>
            {wrap2(pick(g.q)).map((line, k) => (
              <text key={k} x={x} y={88 + k * 14} textAnchor="middle" fontSize={11} className="fill-gray-700">
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------------------------------------------------ the trust onion

const LAYERS: { name: L; short: L; trusts: L; reduce: L; cls: string }[] = [
  {
    name: ["Your statement", "你的陳述"],
    short: ["statement", "陳述"],
    trusts: [
      "That the Lean statement says what the mathematics says: the right number system, no junk value slipping in, no missing hypothesis.",
      "Lean 陳述說的就是數學上的那件事：數系對、沒有垃圾值混進來、沒有漏掉的假設。",
    ],
    reduce: ["Read it, slowly, with someone else. No program can do this for you.", "慢慢讀，找別人一起讀。沒有程式能替你做這件事。"],
    cls: "fill-amber-100 stroke-amber-500",
  },
  {
    name: ["Three axioms", "三條公理"],
    short: ["3 axioms", "三條公理"],
    trusts: [
      "`propext`, `Quot.sound`, `Classical.choice`: the usual foundations of mathematics, accepted without proof.",
      "`propext`、`Quot.sound`、`Classical.choice`：數學慣用的基礎，不經證明就接受。",
    ],
    reduce: ["`#print axioms` and comparator's whitelist make sure nothing else sneaks in.", "`#print axioms` 和 comparator 的白名單確保沒有其他東西混進來。"],
    cls: "fill-violet-50 stroke-violet-400",
  },
  {
    name: ["Lean's kernel", "Lean 的核心"],
    short: ["Lean kernel", "Lean 核心"],
    trusts: [
      "A small C++ program implementing the rules of Lean's type theory. Much reviewed, but it has had bugs.",
      "一支小小的 C++ 程式，實作 Lean 型別論的規則。被很多人審查過，但它曾經有過 bug。",
    ],
    reduce: ["Replay the proof in a fresh process (`leanchecker`), then in other kernels.", "在全新的程序裡重播證明（`leanchecker`），再交給其他核心。"],
    cls: "fill-teal-50 stroke-teal-600",
  },
  {
    name: ["A second kernel", "第二個核心"],
    short: ["2nd kernel", "第二個核心"],
    trusts: [
      "That nanoda (Rust) or Lean4Lean does not share the same bug. Lean4Lean is derived from the C++ kernel, so it is not fully independent.",
      "nanoda（Rust）或 Lean4Lean 不會有同一個 bug。Lean4Lean 是從 C++ 核心衍生出來的，所以並非完全獨立。",
    ],
    reduce: ["Use kernels written by different people, in different languages, from the rules rather than the code.", "使用不同的人、用不同語言、依照規則而非照著程式碼寫成的核心。"],
    cls: "fill-sky-50 stroke-sky-500",
  },
  {
    name: ["Exporter, sandbox, cache, hardware", "匯出器、沙盒、快取、硬體"],
    short: ["tools · machine", "工具 · 機器"],
    trusts: [
      "The tool that writes the proof out for the kernels, the sandbox that keeps the author's code away from the judge, Mathlib's build cache, the operating system and the machine.",
      "把證明輸出給核心的工具、把作者程式碼與裁判隔開的沙盒、Mathlib 的建置快取、作業系統與機器本身。",
    ],
    reduce: ["Build from source, on more than one machine, by more than one group.", "從原始碼建置，在不只一台機器上，由不只一組人來做。"],
    cls: "fill-gray-100 stroke-gray-400",
  },
];

/** What a checked result still trusts, from the statement outwards. Click a layer. */
export function TrustOnion() {
  const { pick } = useLang();
  const [sel, setSel] = useState(0);
  const cx = 150;
  const cy = 150;
  return (
    <div className="grid w-full items-center gap-4 md:grid-cols-[300px_minmax(0,1fr)]" data-testid="trust-onion">
      <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[300px]" role="img" aria-label={pick(["The layers of trust", "信任的層次"])}>
        {[...LAYERS].reverse().map((l, ri) => {
          const i = LAYERS.length - 1 - ri;
          const r = 34 + i * 27;
          return (
            <g key={i} onClick={() => setSel(i)} className="cursor-pointer">
              <circle cx={cx} cy={cy} r={r} className={l.cls} strokeWidth={sel === i ? 3 : 1.2} />
              <text x={cx} y={i === 0 ? cy + 4 : cy - r + 17} textAnchor="middle" fontSize={i === 0 ? 11 : 10.5} className={`fill-gray-800 ${sel === i ? "font-semibold" : ""}`}>
                {pick(l.short)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap gap-1">
          {LAYERS.map((l, k) => (
            <Chip key={k} on={k === sel} onClick={() => setSel(k)}>
              {k + 1}. {pick(l.name)}
            </Chip>
          ))}
        </div>
        <div className="rounded-md bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
          <p>
            <span className="font-semibold text-gray-900">{pick(["You trust: ", "你信任："])}</span>
            <Rich text={pick(LAYERS[sel].trusts)} />
          </p>
          <p className="mt-1.5">
            <span className="font-semibold text-gray-900">{pick(["To trust it less: ", "想少信任一點："])}</span>
            <Rich text={pick(LAYERS[sel].reduce)} />
          </p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------- several kernels agree

type Verdict = "yes" | "no" | "maybe";
const KERNELS: { name: string; sub: L; honest: Verdict; buggy: Verdict }[] = [
  { name: "Lean kernel", sub: ["C++, inside Lean", "C++，在 Lean 裡"], honest: "yes", buggy: "yes" },
  { name: "leanchecker", sub: ["same kernel, fresh process", "同一個核心、全新程序"], honest: "yes", buggy: "yes" },
  { name: "nanoda", sub: ["independent, in Rust", "獨立實作，Rust"], honest: "yes", buggy: "no" },
  { name: "Lean4Lean", sub: ["in Lean, derived from C++", "用 Lean 寫，衍生自 C++"], honest: "yes", buggy: "maybe" },
];
const LAMP: Record<Verdict, { cls: string; mark: string }> = {
  yes: { cls: "fill-emerald-500", mark: "✓" },
  no: { cls: "fill-red-500", mark: "✖" },
  maybe: { cls: "fill-amber-400", mark: "?" },
};

/** One exported proof sent to several kernels. With an honest proof they agree; with a kernel-bug exploit they don't. */
export function KernelsAgree() {
  const { pick } = useLang();
  const reduced = useReducedMotion();
  const [buggy, setBuggy] = useState(false);
  const [lit, setLit] = useState(reduced ? 4 : 0);
  useEffect(() => {
    if (reduced) {
      setLit(4);
      return;
    }
    setLit(0);
    let k = 0;
    const id = window.setInterval(() => {
      k += 1;
      setLit(k);
      if (k >= 4) window.clearInterval(id);
    }, 420);
    return () => window.clearInterval(id);
  }, [buggy, reduced]);
  const ys = [30, 88, 146, 204];
  const agree = !buggy;
  return (
    <div className="w-full" data-testid="kernels-agree">
      <div className="mb-3 flex flex-wrap gap-1">
        <Chip on={!buggy} onClick={() => setBuggy(false)}>
          {pick(["An ordinary proof", "一般的證明"])}
        </Chip>
        <Chip on={buggy} onClick={() => setBuggy(true)}>
          {pick(["A proof exploiting a bug in Lean's kernel", "利用 Lean 核心 bug 的證明"])}
        </Chip>
      </div>
      <svg viewBox="0 0 680 270" className="w-full max-w-[680px]" role="img" aria-label={pick(["One proof, several kernels", "一個證明，多個核心"])}>
        <style>{"@keyframes ck-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }"}</style>
        <rect x={10} y={100} width={140} height={70} rx={10} className={buggy ? "fill-red-50 stroke-red-300" : "fill-white stroke-gray-400"} strokeWidth={1.4} />
        <text x={80} y={128} textAnchor="middle" fontSize={13} className="fill-gray-900 font-semibold">
          {pick(["One proof", "一個證明"])}
        </text>
        <text x={80} y={148} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
          {pick(["exported as plain text", "匯出成純文字"])}
        </text>
        {KERNELS.map((k, i) => {
          const path = `M150 135 C 210 135, 220 ${ys[i] + 21}, 290 ${ys[i] + 21}`;
          const v = buggy ? k.buggy : k.honest;
          const on = lit > i;
          return (
            <g key={k.name}>
              <path d={path} fill="none" strokeWidth={1.6} className="stroke-gray-300" />
              <path
                key={`${buggy}`}
                d={path}
                fill="none"
                strokeWidth={2.2}
                pathLength={1}
                strokeDasharray="1"
                className="stroke-teal-500"
                style={reduced ? undefined : { animation: `ck-draw 400ms ease-out ${i * 420}ms both` }}
              />
              <rect x={292} y={ys[i]} width={200} height={42} rx={8} className={i === 2 || i === 3 ? "fill-sky-50 stroke-sky-400" : "fill-teal-50 stroke-teal-600"} strokeWidth={1.3} />
              <text x={304} y={ys[i] + 18} fontSize={12.5} fontFamily={MONO} className="fill-gray-900 font-semibold">
                {k.name}
              </text>
              <text x={304} y={ys[i] + 34} fontSize={10} className="fill-gray-500">
                {pick(k.sub)}
              </text>
              <circle cx={522} cy={ys[i] + 21} r={13} className={on ? LAMP[v].cls : "fill-gray-200"} />
              <text x={522} y={ys[i] + 25.5} textAnchor="middle" fontSize={13} className="fill-white font-semibold">
                {on ? LAMP[v].mark : ""}
              </text>
            </g>
          );
        })}
        {/* leanchecker reuses the Lean kernel; Lean4Lean was derived from it */}
        <path d="M296 60 C 276 66, 276 92, 296 98" fill="none" strokeDasharray="3 3" strokeWidth={1.2} className="stroke-teal-500" />
        <path d="M494 46 C 560 56, 560 222, 494 232" fill="none" strokeDasharray="3 3" strokeWidth={1.2} className="stroke-amber-500" />
        <text x={547} y={146} fontSize={10} className="fill-amber-700">
          {pick(["derived", "衍生"])}
        </text>
        <rect x={590} y={96} width={86} height={78} rx={10} className={lit >= 4 ? (agree ? "fill-emerald-50 stroke-emerald-500" : "fill-red-50 stroke-red-400") : "fill-gray-50 stroke-gray-300"} strokeWidth={1.4} />
        <text x={633} y={124} textAnchor="middle" fontSize={12.5} className="fill-gray-900 font-semibold">
          {lit >= 4 ? (agree ? pick(["All agree", "全部同意"]) : pick(["Disagree!", "意見不一！"])) : "…"}
        </text>
        <text x={633} y={143} textAnchor="middle" fontSize={10} className="fill-gray-600">
          {lit >= 4 ? (agree ? pick(["accept", "接受"]) : pick(["accept nothing;", "什麼都不接受；"])) : ""}
        </text>
        <text x={633} y={157} textAnchor="middle" fontSize={10} className="fill-gray-600">
          {lit >= 4 && !agree ? pick(["a person looks", "由人查明"]) : ""}
        </text>
        <text x={340} y={262} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
          {pick(["A bug has to be in every kernel, in the same way, to let a false proof through.", "錯誤的證明要過關，每個核心都得在同一處有同樣的 bug。"])}
        </text>
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------- what catches what

type Mark = "yes" | "part" | "no";
const THREATS: L[] = [
  ["Wrong statement (gate 1)", "陳述寫錯（第 1 關）"],
  ["Different statement proved", "證了別的陳述"],
  ["`sorry`, extra axiom", "`sorry`、額外公理"],
  ["Environment hacking", "竄改環境"],
  ["Kernel bug", "核心 bug"],
];
const CHECKERS: { name: L; marks: Mark[]; where: "any" | "full" | "human" }[] = [
  { name: ["A careful reader", "仔細讀的人"], marks: ["yes", "part", "no", "no", "no"], where: "human" },
  { name: ["Lean + `#print axioms`", "Lean + `#print axioms`"], marks: ["no", "no", "yes", "no", "no"], where: "any" },
  { name: ["Statement frozen + static scan", "凍結陳述 + 靜態掃描"], marks: ["no", "yes", "yes", "part", "no"], where: "any" },
  { name: ["`leanchecker` replay", "`leanchecker` 重播"], marks: ["no", "no", "no", "yes", "no"], where: "any" },
  { name: ["`lake comparator`", "`lake comparator`"], marks: ["no", "yes", "yes", "yes", "no"], where: "full" },
  { name: ["`comparator --paranoid` + nanoda", "`comparator --paranoid` + nanoda"], marks: ["no", "yes", "yes", "yes", "yes"], where: "full" },
  { name: ["Lean4Lean", "Lean4Lean"], marks: ["no", "no", "no", "yes", "part"], where: "full" },
];

/** Which checker catches which trick, and where it runs. */
export function CheckerStrip() {
  const { pick } = useLang();
  const dot: Record<Mark, string> = {
    yes: "bg-emerald-500 text-white",
    part: "bg-amber-300 text-amber-950",
    no: "bg-gray-100 text-gray-300",
  };
  const sym: Record<Mark, string> = { yes: "✓", part: "◐", no: "·" };
  const where = {
    human: ["you", "你"],
    any: ["Lite · any OS", "Lite · 任何作業系統"],
    full: ["Full · Linux / WSL / cloud", "Full · Linux / WSL / 雲端"],
  } as const;
  return (
    <div className="w-full overflow-x-auto" data-testid="checker-strip">
      <table className="w-full min-w-[620px] border-separate border-spacing-y-1 text-xs">
        <thead>
          <tr className="text-gray-500">
            <th className="px-2 text-left font-semibold">{pick(["Checker", "檢查工具"])}</th>
            {THREATS.map((t, i) => (
              <th key={i} className="w-[12%] px-1 text-center font-semibold">
                <Rich text={pick(t)} />
              </th>
            ))}
            <th className="px-2 text-left font-semibold">{pick(["Runs on", "在哪裡跑"])}</th>
          </tr>
        </thead>
        <tbody>
          {CHECKERS.map((c, i) => (
            <tr key={i} className="bg-white">
              <td className="rounded-l-md px-2 py-1.5 text-gray-800">
                <Rich text={pick(c.name)} />
              </td>
              {c.marks.map((m, j) => (
                <td key={j} className="text-center">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-semibold ${dot[m]}`}>{sym[m]}</span>
                </td>
              ))}
              <td className="rounded-r-md px-2">
                <span
                  className={`rounded-full px-2 py-0.5 ${c.where === "full" ? "bg-sky-50 text-sky-700" : c.where === "any" ? "bg-teal-50 text-(--lk-accent)" : "bg-amber-50 text-amber-800"}`}
                >
                  {pick(where[c.where])}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------------------------------------------- comparator as test-driven work

const FLOW: { box: L; title: L; text: L; code: string; green: boolean }[] = [
  {
    box: ["Challenge.lean", "Challenge.lean"],
    title: ["1 · Write the test first", "1 · 先寫測試"],
    text: [
      "A trusted person writes the statement, imports only Mathlib, and leaves the proof as `sorry`. This file is frozen: it is the test. It fails, on purpose: red.",
      "一位受信任的人寫下陳述，只匯入 Mathlib，證明留成 `sorry`。這個檔案從此凍結：它就是測試。它刻意失敗：紅燈。",
    ],
    code: "-- Challenge.lean (frozen; a sketch)\nimport Mathlib\n\ntheorem riemannHypothesis : RiemannHypothesis := by\n  sorry",
    green: false,
  },
  {
    box: ["Solution.lean", "Solution.lean"],
    title: ["2 · Anyone writes the solution", "2 · 任何人寫解答"],
    text: [
      "A person or an AI proves the same theorem name in Solution.lean, importing whatever it likes: thousands of files, new tactics, metaprograms. None of it is trusted.",
      "人或 AI 在 Solution.lean 裡證明同名的定理，想匯入什麼都可以：成千上萬個檔案、新的戰術、元程式。這些都不被信任。",
    ],
    code: "-- Solution.lean (untrusted; a sketch)\nimport Mathlib\nimport BigProof.Main\n\ntheorem riemannHypothesis : RiemannHypothesis :=\n  BigProof.main",
    green: false,
  },
  {
    box: ["Sandbox build", "沙盒建置"],
    title: ["3 · Build it in a sandbox", "3 · 在沙盒裡建置"],
    text: [
      "Building runs the author's code, so it happens with no network and no access to the judge's files (on Linux). For a huge proof this takes hours.",
      "建置會執行作者的程式碼，所以要在沒有網路、碰不到裁判檔案的環境裡進行（在 Linux 上）。龐大的證明要花好幾個小時。",
    ],
    code: "# no network; the solution cannot touch the judge\n# a 17-million-line build: hours",
    green: false,
  },
  {
    box: ["Export", "匯出"],
    title: ["4 · Export both sides", "4 · 兩邊都匯出"],
    text: [
      "`lean4export` writes every declaration out as plain text. From here on, the elaborator, tactics and metaprograms are out of the picture: only finished terms remain.",
      "`lean4export` 把每個宣告輸出成純文字。從這裡開始，精煉器、戰術、元程式都退場了：只剩下完成的項。",
    ],
    code: "challenge.export   # from a clean clone\nsolution.export    # from the sandbox",
    green: false,
  },
  {
    box: ["Compare", "比對"],
    title: ["5 · Same statement? Allowed axioms?", "5 · 陳述相同？公理允許？"],
    text: [
      "The theorem in the solution must be *identical* to the challenge's, every definition it mentions included (so `^` cannot mean 37), and it may use only the permitted axioms.",
      "解答裡的定理必須和挑戰裡的 *完全相同*，連它提到的每個定義都算在內（所以 `^` 不能代表 37），而且只能用允許的公理。",
    ],
    code: '{\n  "challenge_module": "Challenge",\n  "solution_module": "Solution",\n  "theorem_names": ["riemannHypothesis"],\n  "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"]\n}',
    green: false,
  },
  {
    box: ["Replay in kernels", "交給核心重播"],
    title: ["6 · Replay in the kernel(s): green", "6 · 交給核心重播：綠燈"],
    text: [
      "Every declaration is checked again by Lean's kernel, and with `--paranoid` by other kernels too. All agree: the test is green. Nothing in the solution was trusted along the way.",
      "每個宣告都再由 Lean 的核心檢查一次，加上 `--paranoid` 還會交給其他核心。全部同意：測試轉成綠燈。過程中，解答裡沒有任何東西被信任。",
    ],
    code: "lake comparator --paranoid\n# green only if: the statements are identical,\n# every axiom is permitted,\n# and every kernel accepts every declaration",
    green: true,
  },
];

/** The comparator workflow as test-driven development: a frozen statement (the test), red until every check passes. */
export function ComparatorFlow() {
  const { pick } = useLang();
  const [i, setI] = useState(0);
  const s = FLOW[i];
  const w = 100;
  return (
    <div className="w-full" data-testid="comparator-flow">
      <svg viewBox="0 0 680 150" className="w-full max-w-[680px]" role="img" aria-label={pick(["The comparator workflow", "comparator 的流程"])}>
        {FLOW.map((f, k) => {
          const x = 6 + k * (w + 13);
          const cls =
            k === 0
              ? "fill-amber-50 stroke-amber-500"
              : k === 1
                ? "fill-red-50 stroke-red-300"
                : k <= i
                  ? "fill-teal-50 stroke-teal-600"
                  : "fill-white stroke-gray-300";
          return (
            <g key={k} onClick={() => setI(k)} className="cursor-pointer">
              <rect x={x} y={20} width={w} height={46} rx={8} className={cls} strokeWidth={k === i ? 2.6 : 1.2} />
              <text x={x + w / 2} y={40} textAnchor="middle" fontSize={11} fontFamily={k < 2 ? MONO : undefined} className="fill-gray-900 font-semibold">
                {pick(f.box)}
              </text>
              <text x={x + w / 2} y={56} textAnchor="middle" fontSize={9.5} className="fill-gray-500">
                {k === 0 ? pick(["trusted · frozen", "受信任 · 凍結"]) : k === 1 ? pick(["untrusted", "不受信任"]) : k <= i ? "✓" : ""}
              </text>
              {k < FLOW.length - 1 && (
                <path d={`M${x + w + 1} 43 l9 0 m-4 -4 l4 4 l-4 4`} fill="none" strokeWidth={1.4} className="stroke-gray-400" />
              )}
            </g>
          );
        })}
        {/* the test runner bar */}
        <rect x={6} y={92} width={668} height={34} rx={8} className={s.green ? "fill-emerald-500" : "fill-red-500"} style={{ transition: "fill 300ms" }} />
        <text x={340} y={114} textAnchor="middle" fontSize={12.5} fontFamily={MONO} className="fill-white font-semibold">
          {s.green ? "✓ riemannHypothesis — PASS" : `✖ riemannHypothesis — ${i === 0 ? "sorry" : pick(["not yet checked", "尚未檢查完"])}`}
        </text>
        <text x={340} y={145} textAnchor="middle" fontSize={10} className="fill-gray-500">
          {pick(["the frozen statement is the test; the checkers are the test runner", "凍結的陳述是測試；檢查工具是測試執行器"])}
        </text>
      </svg>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">{pick(s.title)}</p>
          <p className="text-sm leading-relaxed text-gray-700">
            <Rich text={pick(s.text)} />
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setI((k) => Math.max(0, k - 1))}
              disabled={i === 0}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs disabled:opacity-40"
            >
              ◂ {pick(["Back", "上一步"])}
            </button>
            <button
              onClick={() => setI((k) => Math.min(FLOW.length - 1, k + 1))}
              disabled={i === FLOW.length - 1}
              className="rounded-md bg-(--lk-accent) px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
              data-testid="comparator-next"
            >
              {pick(["Next step", "下一步"])} ▸
            </button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-[12px] leading-relaxed text-gray-100">{s.code}</pre>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------- the Riemann re-check board

type Status = "ok" | "run" | "fail" | "set";
const RH_GATES: { items: { s: Status; t: L }[] }[] = [
  {
    items: [
      { s: "ok", t: ["`Challenge.lean`: five theorems, imports only Mathlib", "`Challenge.lean`：五個定理，只匯入 Mathlib"] },
      { s: "ok", t: ["`riemannZeta`'s junk value at s = 1 is excluded", "`riemannZeta` 在 s = 1 的垃圾值已排除"] },
      { s: "ok", t: ["every `1 / 2` beside `s.re` is real division", "`s.re` 旁的每個 `1 / 2` 都是實數除法"] },
    ],
  },
  {
    items: [
      { s: "set", t: ["175,187 files, 17,374,215 lines", "175,187 個檔案、17,374,215 行"] },
      { s: "run", t: ["sandbox build in progress (hours)", "沙盒建置進行中（數小時）"] },
    ],
  },
  {
    items: [
      { s: "ok", t: ["text scan: no `sorry`, `axiom`, `native_decide`…", "文字掃描：沒有 `sorry`、`axiom`、`native_decide`…"] },
      { s: "set", t: ["but metaprograms: the kernel is the only check", "但有元程式：核心是唯一的檢查"] },
      { s: "run", t: ["`lake comparator`: waiting for the build", "`lake comparator`：等待建置完成"] },
    ],
  },
  {
    items: [
      { s: "set", t: ["configured: Lean paranoid + nanoda", "已設定：Lean paranoid + nanoda"] },
      { s: "fail", t: ["con-leche, con-ron: fail on a mutual reflexive inductive", "con-leche、con-ron：卡在一個互遞迴自反歸納型別"] },
      { s: "fail", t: ["lean4lean: rejects the v4.33.1 export", "lean4lean：不接受 v4.33.1 的匯出"] },
    ],
  },
];
const STATUS: Record<Status, { cls: string; mark: string }> = {
  ok: { cls: "bg-emerald-500 text-white", mark: "✓" },
  run: { cls: "bg-amber-400 text-amber-950", mark: "⧗" },
  fail: { cls: "bg-gray-300 text-gray-700", mark: "✖" },
  set: { cls: "bg-sky-100 text-sky-800", mark: "•" },
};

/** The Riemann re-check, gate by gate, as of 22 November 2026. */
export function RhBoard() {
  const { pick } = useLang();
  const reduced = useReducedMotion();
  return (
    <div className="w-full" data-testid="rh-board">
      <p className="mb-2 text-right text-[11px] font-semibold tracking-wide text-amber-700 uppercase">
        {pick(["as of 22 November 2026", "截至 2026 年 11 月 22 日"])}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {RH_GATES.map((g, i) => (
          <div key={i} className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
            <p className="flex items-center gap-2 text-xs font-semibold text-gray-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[11px] text-white">{i + 1}</span>
              {pick(GATES[i].q)}
            </p>
            <ul className="mt-2 space-y-1.5">
              {g.items.map((it, k) => (
                <li key={k} className="flex gap-2 text-xs leading-snug text-gray-700">
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${STATUS[it.s].cls} ${it.s === "run" && !reduced ? "animate-pulse" : ""}`}
                  >
                    {STATUS[it.s].mark}
                  </span>
                  <span>
                    <Rich text={pick(it.t)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
        <span>✓ {pick(["done", "完成"])}</span>
        <span>⧗ {pick(["running", "進行中"])}</span>
        <span>• {pick(["noted / configured", "記錄 / 已設定"])}</span>
        <span>✖ {pick(["this checker gives no verdict", "這個檢查器沒有給出判定"])}</span>
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------------------------- small pictures per gate

function Arrow({ x1, y1, x2, y2, cls = "stroke-gray-400" }: { x1: number; y1: number; x2: number; y2: number; cls?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number) => `${x2 - 8 * Math.cos(a + d)},${y2 - 8 * Math.sin(a + d)}`;
  return (
    <g className={cls}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.6} />
      <polygon points={`${x2},${y2} ${h(0.45)} ${h(-0.45)}`} className={cls.replace("stroke-", "fill-")} />
    </g>
  );
}

/** Gate 1: the paper's statement and a careless Lean one, side by side; the missing hypothesis and ℕ's rounding. */
export function PaperVsLean() {
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 680 205" className="w-full max-w-[680px]" role="img" aria-label={pick(["Paper and Lean, side by side", "論文與 Lean 並排"])}>
      <rect x={10} y={14} width={300} height={110} rx={10} className="fill-white stroke-gray-400" />
      <rect x={20} y={47} width={204} height={22} rx={4} className="fill-emerald-100" />
      <text x={24} y={36} fontSize={11} className="fill-gray-500 font-semibold">
        {pick(["The paper", "論文"])}
      </text>
      <text x={24} y={62} fontSize={12.5} className="fill-gray-900">
        {pick(["For positive integers a, b, c", "對正整數 a、b、c"])}
      </text>
      <text x={24} y={86} fontSize={12.5} className="fill-gray-900">
        {pick(["and n ≥ 3:  aⁿ + bⁿ ≠ cⁿ", "以及 n ≥ 3：aⁿ + bⁿ ≠ cⁿ"])}
      </text>
      <rect x={370} y={14} width={300} height={110} rx={10} className="fill-white stroke-gray-400" />
      <text x={384} y={36} fontSize={11} className="fill-gray-500 font-semibold">
        Lean
      </text>
      <text x={384} y={62} fontSize={12} fontFamily={MONO} className="fill-gray-900">
        ∀ a b c n : ℕ, n ≥ 3 →
      </text>
      <text x={384} y={84} fontSize={12} fontFamily={MONO} className="fill-gray-900">
        {"  a^n + b^n ≠ c^n"}
      </text>
      <rect x={384} y={94} width={160} height={22} rx={5} className="fill-red-50 stroke-red-400" strokeDasharray="4 3" />
      <text x={464} y={109} textAnchor="middle" fontSize={11} className="fill-red-700">
        {pick(["missing: 0 < a, b, c", "少了：0 < a、b、c"])}
      </text>
      <line x1={314} y1={70} x2={366} y2={70} strokeWidth={1.6} className="stroke-gray-400" strokeDasharray="4 3" />
      <text x={340} y={62} textAnchor="middle" fontSize={15} className="fill-red-500 font-semibold">
        ≠
      </text>
      {/* ℕ rounds down */}
      <line x1={60} y1={160} x2={620} y2={160} strokeWidth={1.5} className="stroke-gray-400" />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <line x1={100 + k * 220} y1={154} x2={100 + k * 220} y2={166} strokeWidth={1.5} className="stroke-gray-500" />
          <text x={100 + k * 220} y={182} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-800">
            {k}
          </text>
        </g>
      ))}
      <circle cx={210} cy={160} r={5} className="fill-amber-400" />
      <text x={210} y={146} textAnchor="middle" fontSize={11} className="fill-amber-700">
        {pick(["½ on paper", "紙上的 ½"])}
      </text>
      <path d="M206 167 C 186 196, 126 196, 106 170" fill="none" strokeWidth={1.6} className="stroke-red-400" />
      <polygon points="102,164 101,176 110,172" className="fill-red-400" />
      <text x={240} y={196} fontSize={11.5} fontFamily={MONO} className="fill-red-700">
        (1 : ℕ) / 2 = 0
      </text>
      <text x={370} y={196} fontSize={10.5} className="fill-gray-500">
        {pick(["ℕ division rounds down", "ℕ 的除法無條件捨去"])}
      </text>
    </svg>
  );
}

/** Gate 2: building runs the author's code, so it runs in a box with no network, away from the judge. */
export function SandboxFigure() {
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 680 165" className="w-full max-w-[680px]" role="img" aria-label={pick(["Building in a sandbox", "在沙盒裡建置"])}>
      <rect x={10} y={14} width={380} height={136} rx={14} className="fill-gray-50 stroke-gray-500" strokeWidth={2} strokeDasharray="7 4" />
      <text x={24} y={36} fontSize={11.5} className="fill-gray-700 font-semibold">
        {pick(["Sandbox: no network, no access outside", "沙盒：沒有網路、碰不到外面"])}
      </text>
      <rect x={30} y={56} width={150} height={74} rx={8} className="fill-red-50 stroke-red-300" />
      <text x={105} y={82} textAnchor="middle" fontSize={12} className="fill-gray-900 font-semibold">
        {pick(["Untrusted proof", "不受信任的證明"])}
      </text>
      <text x={105} y={100} textAnchor="middle" fontSize={10.5} className="fill-gray-600">
        {pick(["its macros, tactics and", "它的巨集、戰術、"])}
      </text>
      <text x={105} y={114} textAnchor="middle" fontSize={10.5} className="fill-gray-600">
        {pick(["metaprograms all run", "元程式都會執行"])}
      </text>
      <rect x={220} y={56} width={150} height={74} rx={8} className="fill-white stroke-gray-400" />
      <text x={295} y={82} textAnchor="middle" fontSize={12} fontFamily={MONO} className="fill-gray-900 font-semibold">
        lake build
      </text>
      <text x={295} y={100} textAnchor="middle" fontSize={10.5} className="fill-gray-600">
        {pick(["needs memory and hours", "需要記憶體與數小時"])}
      </text>
      <text x={295} y={114} textAnchor="middle" fontSize={10.5} className="fill-gray-600">
        {pick(["13M lines: out of memory?", "1300 萬行：記憶體不夠？"])}
      </text>
      <Arrow x1={180} y1={93} x2={216} y2={93} />
      <Arrow x1={390} y1={93} x2={456} y2={93} cls="stroke-teal-600" />
      <text x={423} y={84} textAnchor="middle" fontSize={10} className="fill-teal-700">
        {pick(["export", "匯出"])}
      </text>
      <rect x={460} y={56} width={210} height={74} rx={8} className="fill-teal-50 stroke-teal-600" />
      <text x={565} y={82} textAnchor="middle" fontSize={12} className="fill-teal-900 font-semibold">
        {pick(["The judge", "裁判"])}
      </text>
      <text x={565} y={100} textAnchor="middle" fontSize={10.5} className="fill-teal-800">
        {pick(["reads only the plain-text", "只讀純文字的"])}
      </text>
      <text x={565} y={114} textAnchor="middle" fontSize={10.5} className="fill-teal-800">
        {pick(["result, never runs its code", "結果，從不執行它的程式碼"])}
      </text>
    </svg>
  );
}

/** Gate 3: the same text can mean two theorems; comparator compares meanings and axioms, not text. */
export function SameTextFigure() {
  const { pick } = useLang();
  const row = (y: number, who: L, pow: string, cls: string) => (
    <g>
      <text x={14} y={y + 20} fontSize={11} className="fill-gray-500 font-semibold">
        {pick(who)}
      </text>
      <rect x={100} y={y} width={240} height={32} rx={7} className="fill-white stroke-gray-400" />
      <text x={220} y={y + 20} textAnchor="middle" fontSize={11.5} fontFamily={MONO} className="fill-gray-900">
        a ^ n + b ^ n ≠ c ^ n
      </text>
      <Arrow x1={340} y1={y + 16} x2={384} y2={y + 16} />
      <rect x={388} y={y} width={150} height={32} rx={7} className={cls} />
      <text x={463} y={y + 20} textAnchor="middle" fontSize={11} fontFamily={MONO} className="fill-gray-900">
        {pow}
      </text>
      <text x={600} y={y + 20} textAnchor="middle" fontSize={10.5} className="fill-gray-600">
        {pick(["none", "無"])}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 680 165" className="w-full max-w-[680px]" role="img" aria-label={pick(["Same text, different theorem", "文字相同，定理不同"])}>
      <text x={220} y={16} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
        {pick(["what you read", "你讀到的"])}
      </text>
      <text x={463} y={16} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
        {pick(["what a ^ n really is", "a ^ n 實際上是什麼"])}
      </text>
      <text x={600} y={16} textAnchor="middle" fontSize={10.5} className="fill-gray-500">
        {pick(["extra axioms", "額外公理"])}
      </text>
      {row(26, ["Challenge", "挑戰"], pick(["a to the power n", "a 的 n 次方"]), "fill-emerald-50 stroke-emerald-500")}
      {row(74, ["Solution", "解答"], "37", "fill-red-50 stroke-red-400")}
      <text x={463} y={128} textAnchor="middle" fontSize={16} className="fill-red-500 font-semibold">
        ≠
      </text>
      <text x={340} y={156} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {pick(["same text, same (empty) axiom list: only comparing the elaborated statements catches it", "文字相同、公理清單也相同（都是空的）：只有比對精煉後的陳述才抓得到"])}
      </text>
    </svg>
  );
}

/** What Formalizer runs: Lite everywhere, Full on Linux-type runners. */
export function LiteFull() {
  const { pick } = useLang();
  const col = (x: number, title: L, where: L, items: string[], cls: string) => (
    <g>
      <rect x={x} y={10} width={320} height={150} rx={12} className={cls} strokeWidth={1.4} />
      <text x={x + 16} y={34} fontSize={13} className="fill-gray-900 font-semibold">
        {pick(title)}
      </text>
      <text x={x + 304} y={34} textAnchor="end" fontSize={10.5} className="fill-gray-600">
        {pick(where)}
      </text>
      {items.map((t, k) => (
        <text key={k} x={x + 18} y={64 + k * 24} fontSize={11.5} className="fill-gray-800">
          ✓ {t}
        </text>
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 680 170" className="w-full max-w-[680px]" role="img" aria-label={pick(["Lite and Full checks", "Lite 與 Full 檢查"])}>
      {col(
        10,
        ["Lite: every check", "Lite：每次檢查"],
        ["any OS", "任何作業系統"],
        [
          pick(["statement frozen", "陳述凍結"]),
          pick(["axioms whitelist", "公理白名單"]),
          pick(["static scan", "靜態掃描"]),
          pick(["leanchecker replay", "leanchecker 重播"]),
        ],
        "fill-teal-50 stroke-teal-600",
      )}
      {col(
        350,
        ["Full: in Research", "Full：在 Research 裡"],
        ["Linux / WSL / cloud", "Linux / WSL / 雲端"],
        ["lake comparator --paranoid", pick(["nanoda (Rust kernel)", "nanoda（Rust 核心）"]), "Lean4Lean"],
        "fill-sky-50 stroke-sky-500",
      )}
    </svg>
  );
}
