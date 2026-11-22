/**
 * Coding Skills ▸ Reading goals and errors: the pictures.
 *   GoalAnatomy   a goal and an error message, each part labelled (what to read first, what is data)
 *   ErrorMap      where each common message comes from (parser → elaborator → tactics → kernel → Formalizer's checks);
 *                 click one for its cause and fix, and a link to its section
 * Message texts are what Lean v4.34.1 prints for the examples on the page.
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { SiteLink } from "../kit";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ anatomy

const N = ({ n }: { n: number }) => (
  <span className="mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-(--lk-accent) text-[10px] font-semibold text-white">
    {n}
  </span>
);

function Labelled({ rows, legend }: { rows: { n?: number; text: string; cls?: string }[]; legend: L[] }) {
  const { pick } = useLang();
  return (
    <div className="min-w-0 space-y-2">
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed">
        {rows.map((r, i) => (
          <p key={i} className={`flex items-start ${r.cls ?? "text-gray-800"}`}>
            <span className="w-5 shrink-0">{r.n !== undefined && <N n={r.n} />}</span>
            <span className="whitespace-pre-wrap">{r.text}</span>
          </p>
        ))}
      </div>
      <ol className="space-y-1 text-xs text-gray-700">
        {legend.map((l, i) => (
          <li key={i} className="flex items-start">
            <N n={i + 1} />
            <span>
              <RichText text={pick(l)} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Left: a goal as the panel shows it. Right: an error as Lean prints it. Numbered parts, read in that order. */
export function GoalAnatomy() {
  const { pick } = useLang();
  return (
    <div className="grid w-full gap-4 text-left md:grid-cols-2" data-testid="goal-anatomy">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-900">{pick(["A goal", "一個目標"])}</p>
        <Labelled
          rows={[
            { n: 1, text: "case succ", cls: "text-gray-500" },
            { n: 2, text: "k : Nat" },
            { n: 3, text: "ih : double k = 2 * k" },
            { text: "─────────────", cls: "text-gray-300" },
            { n: 4, text: "⊢ double (k + 1) = 2 * (k + 1)", cls: "font-semibold text-gray-900" },
          ]}
          legend={[
            ["**which goal**: its case name, when a tactic made several", "**哪一個目標**：戰術拆出好幾個時，它的情形名稱"],
            ["**objects**: names and their types (`k` is a number)", "**物件**：名字與型別（`k` 是一個數）"],
            ["**facts you may use**: `name : statement`, use it by its name", "**可以用的事實**：`名字 : 陳述`，用名字引用"],
            ["**what is left to prove**, after `⊢`: read this first", "**還要證的東西**，在 `⊢` 之後：最先讀這裡"],
          ]}
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-900">{pick(["An error", "一個錯誤"])}</p>
        <Labelled
          rows={[
            { n: 1, text: "Error on line 2", cls: "text-red-700" },
            { n: 2, text: "Type mismatch", cls: "font-semibold text-red-800" },
            { n: 3, text: "  h" },
            { text: "has type", cls: "text-gray-500" },
            { n: 4, text: "  a ≤ b" },
            { text: "but is expected to have type", cls: "text-gray-500" },
            { n: 5, text: "  a < b + 1" },
          ]}
          legend={[
            ["**where**: the line (the editor underlines it in red)", "**在哪裡**：行號（編輯器用紅線標出）"],
            ["**what kind**: the first line names the problem", "**哪一種**：第一行說出問題的種類"],
            ["**data**: indented lines are Lean terms, here what you wrote", "**資料**：縮排的行是 Lean 的項，這裡是你寫的東西"],
            ["what it **proves**", "它 **證明了** 什麼"],
            ["what the goal **needed**: compare ④ with ⑤", "目標 **需要** 什麼：比較 ④ 與 ⑤"],
          ]}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ where errors come from

interface Err {
  msg: string;
  section?: string;
  cause: L;
  fix: L;
  warn?: boolean;
}
const STAGES: { name: L; does: L; errs: Err[] }[] = [
  {
    name: ["Parser", "語法剖析"],
    does: ["reads the text", "讀文字"],
    errs: [
      {
        msg: "unexpected token '='; expected term",
        cause: ["A typo in the syntax: here `2 + = 4`, a `+` with nothing after it.", "語法打錯：這裡是 `2 + = 4`，`+` 後面什麼都沒有。"],
        fix: [
          "Look just before the position Lean marks: a missing term, bracket or `:=`, or a Unicode symbol typed wrong.",
          "看 Lean 標出位置的前面：少了一個項、括號或 `:=`，或 Unicode 符號打錯。",
        ],
      },
    ],
  },
  {
    name: ["Elaborator", "精煉器"],
    does: ["works out names and types", "弄清名字與型別"],
    errs: [
      {
        msg: "Unknown identifier",
        section: "unknown",
        cause: ["A typo or an invented name.", "打錯字或自己編的名字。"],
        fix: ["Check the goal's names; search with `exact?`.", "對照目標裡的名字；用 `exact?` 搜尋。"],
      },
      {
        msg: "Type mismatch",
        section: "mismatch",
        cause: ["A proof of a different statement.", "給了另一個陳述的證明。"],
        fix: ["Compare *has type* with *expected*; bridge the gap.", "比較 *has type* 與 *expected*；補上落差。"],
      },
      {
        msg: "failed to synthesize",
        section: "synth",
        cause: ["An operation the type doesn't have.", "這個型別沒有這種運算。"],
        fix: ["Check the types; define the `instance` if it is really missing.", "檢查型別；真的缺了就定義 `instance`。"],
      },
      {
        msg: "declaration uses `sorry`",
        section: "sorry",
        warn: true,
        cause: ["Unfinished, on purpose (a warning, not an error).", "刻意留下的未完成部分（警告，不是錯誤）。"],
        fix: ["Replace each `sorry`.", "把每個 `sorry` 換掉。"],
      },
    ],
  },
  {
    name: ["Tactics", "戰術"],
    does: ["run on the goals", "在目標上執行"],
    errs: [
      {
        msg: "unsolved goals",
        section: "unsolved",
        cause: ["The proof stops too early.", "證明太早結束了。"],
        fix: ["Read the goals it prints; add steps.", "讀它印出的目標；補上步驟。"],
      },
      {
        msg: "rewrite failed: pattern not found",
        section: "rewrite",
        cause: ["The left side of the equation isn't in the target.", "等式的左邊不在結論裡。"],
        fix: ["Change the order, or `rw [← h]`.", "換個順序，或用 `rw [← h]`。"],
      },
      {
        msg: "omega could not prove the goal",
        section: "omega",
        cause: ["A false claim, or a fact `omega` can't see.", "說法是錯的，或 `omega` 看不到某個事實。"],
        fix: ["Test the counterexample by hand.", "親手驗算反例。"],
      },
      {
        msg: "must not contain free variables",
        section: "decide",
        cause: ["`decide` on a statement with an unknown.", "對含未知數的陳述用了 `decide`。"],
        fix: ["Bound the variable (`∀ n < 3`), or another tactic.", "給變數上界（`∀ n < 3`），或換戰術。"],
      },
    ],
  },
  {
    name: ["Kernel", "核心"],
    does: ["re-checks the finished term", "重新檢查完成的項"],
    errs: [
      {
        msg: "(kernel) …",
        cause: [
          "Rare: the term a tactic built does not type-check. Messages from the kernel start with `(kernel)`.",
          "很少見：戰術建出的項過不了型別檢查。核心的訊息以 `(kernel)` 開頭。",
        ],
        fix: [
          "Not your proof's logic but the tactic's output: try another tactic, or report it.",
          "不是你證明的邏輯問題，而是戰術的產物：換個戰術，或回報這個問題。",
        ],
      },
    ],
  },
  {
    name: ["Formalizer", "Formalizer"],
    does: ["checks the problem", "檢查題目"],
    errs: [
      {
        msg: "statement was changed",
        section: "formalizer",
        cause: ["The problem's statement is not in the file exactly as given.", "題目的陳述沒有原封不動地出現在檔案裡。"],
        fix: ["Reset; write only where `sorry` was.", "重設；只在 `sorry` 的位置寫。"],
      },
      {
        msg: "uses non-standard axioms",
        section: "formalizer",
        cause: ["The proof rests on more than Lean's three standard axioms.", "證明依賴三個標準公理以外的東西。"],
        fix: ["Remove the `axiom` or `native_decide`; see *Verifying a proof*.", "拿掉 `axiom` 或 `native_decide`；見〈驗證證明〉。"],
      },
    ],
  },
];

/** Five stages a file passes through; each common message hangs under the stage that produces it. */
export function ErrorMap() {
  const { pick } = useLang();
  const [sel, setSel] = useState<[number, number]>([1, 1]);
  const e = STAGES[sel[0]].errs[sel[1]];
  return (
    <div className="w-full space-y-3 text-left" data-testid="error-map">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {STAGES.map((st, i) => (
          <div key={i} className="flex flex-col">
            <div className="relative rounded-t-lg bg-gray-800 px-2 py-1.5 text-white">
              <p className="text-xs font-semibold">
                {i + 1} · {pick(st.name)}
              </p>
              <p className="text-[10px] text-gray-300">{pick(st.does)}</p>
              {i < STAGES.length - 1 && (
                <span className="absolute top-1/2 -right-2 z-10 hidden -translate-y-1/2 text-gray-400 sm:block" aria-hidden>
                  ▸
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 rounded-b-lg border border-t-0 border-gray-200 bg-white p-1.5">
              {st.errs.map((x, j) => {
                const on = sel[0] === i && sel[1] === j;
                return (
                  <button
                    key={j}
                    onClick={() => setSel([i, j])}
                    aria-pressed={on}
                    className={`rounded px-1.5 py-1 text-left font-mono text-[10.5px] leading-tight ring-1 motion-safe:transition-colors ${
                      x.warn
                        ? on
                          ? "bg-amber-100 text-amber-900 ring-amber-400"
                          : "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100"
                        : on
                          ? "bg-red-100 text-red-900 ring-red-400"
                          : "bg-red-50 text-red-800 ring-red-200 hover:bg-red-100"
                    }`}
                  >
                    {x.msg}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="grid items-stretch gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase">{pick(["Lean says", "Lean 說"])}</p>
          <p className="font-mono text-xs text-red-800">{e.msg}</p>
        </div>
        <span className="hidden self-center text-gray-400 sm:block">→</span>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase">{pick(["Usually", "通常是"])}</p>
          <p className="text-xs text-gray-800">
            <RichText text={pick(e.cause)} />
          </p>
        </div>
        <span className="hidden self-center text-gray-400 sm:block">→</span>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase">{pick(["Fix", "修法"])}</p>
          <p className="text-xs text-gray-800">
            <RichText text={pick(e.fix)} />
          </p>
        </div>
      </div>
      {e.section && (
        <p className="text-xs">
          <SiteLink to={["skills", "errors", e.section]} label={["The full example", "完整範例"]} />
        </p>
      )}
    </div>
  );
}
