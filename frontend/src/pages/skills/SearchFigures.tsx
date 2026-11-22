/**
 * Coding Skills ▸ Finding lemmas: the pictures.
 *   SearchMap    a decision map: where to look next when the last place found nothing (cheap and local first)
 *   NameDecoder  a lemma name taken apart: each piece of the name lights up the part of the statement it describes
 * Statements are what `#check` prints in Lean v4.34.1 (core Lean).
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";

type L = readonly [string, string];

// ------------------------------------------------------------------------------------------------ the search map

const STEPS: { where: "lean" | "web" | "you"; tool: string; ask: L; found: L }[] = [
  {
    where: "lean",
    tool: "exact?",
    ask: ["Is the goal one library fact away?", "目標離某個函式庫事實只差一步嗎？"],
    found: ["**Try this: exact …**: paste it", "**Try this: exact …**：貼上"],
  },
  {
    where: "lean",
    tool: "apply?  rw?  simp?",
    ask: ["Is there a step that makes progress?", "有沒有能推進一步的做法？"],
    found: ["paste the step; a smaller goal is left: start again at the top", "貼上那一步；剩下較小的目標：回到最上面再來"],
  },
  {
    where: "lean",
    tool: "#check Nat.lt_of_lt_of_le",
    ask: ["Can you guess the name from the vocabulary?", "能依詞彙表猜出名字嗎？"],
    found: ["`#check` shows the statement: use it with `exact`", "`#check` 印出陳述：用 `exact` 套上"],
  },
  {
    where: "web",
    tool: "Loogle  ?a * ?b = ?b * ?a",
    ask: ["Do you know the *shape* of the statement?", "你知道陳述的 *形狀* 嗎？"],
    found: ["a name: `#check` it on your runner", "一個名字：在你的執行器上 `#check`"],
  },
  {
    where: "web",
    tool: "LeanSearch · Mathlib docs",
    ask: ["Can you only say it in words, or browse the area?", "只能用文字描述，或想瀏覽那個領域？"],
    found: ["a name: `#check` it (it may need Mathlib)", "一個名字：`#check`（可能需要 Mathlib）"],
  },
  {
    where: "you",
    tool: "theorem my_fact …",
    ask: ["Nothing anywhere?", "到處都找不到？"],
    found: ["it is not in the library in that form: prove it as your own lemma", "函式庫裡沒有這種形式：自己證成一條引理"],
  },
];
const WHERE: Record<"lean" | "web" | "you", { label: L; cls: string; dot: string }> = {
  lean: { label: ["in Lean · seconds", "在 Lean 裡 · 幾秒"], cls: "border-teal-300 bg-teal-50/70", dot: "bg-teal-500" },
  web: { label: ["on the web · minutes", "上網 · 幾分鐘"], cls: "border-sky-300 bg-sky-50/70", dot: "bg-sky-500" },
  you: { label: ["your own lemma", "自己的引理"], cls: "border-amber-300 bg-amber-50/70", dot: "bg-amber-500" },
};

/** Where to look, in order: each "no" falls to the next box, each "yes" leaves to the right with a name in hand. */
export function SearchMap() {
  const { pick } = useLang();
  return (
    <div className="w-full max-w-[680px] text-left" data-testid="search-map">
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-gray-600">
        {(Object.keys(WHERE) as (keyof typeof WHERE)[]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${WHERE[k].dot}`} />
            {pick(WHERE[k].label)}
          </span>
        ))}
      </div>
      <div className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-center font-mono text-xs text-gray-800">
        ⊢ (xs ++ ys).length = ys.length + xs.length
      </div>
      {STEPS.map((s, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 py-0.5 pl-6 text-[11px] text-gray-400">
            <span>↓</span>
            {i > 0 && <span>{pick(["nothing", "找不到"])}</span>}
          </div>
          <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,0.9fr)]">
            <div className={`rounded-lg border px-3 py-2 ${WHERE[s.where].cls}`}>
              <p className="flex items-baseline gap-2">
                <span className="text-[11px] font-semibold text-gray-500">{i + 1}</span>
                <span className="font-mono text-xs font-semibold text-gray-900">{s.tool}</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-700">
                <RichText text={pick(s.ask)} />
              </p>
            </div>
            <span className="hidden text-xs text-emerald-600 sm:block">{pick(["yes →", "有 →"])}</span>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs text-emerald-900">
              <span className="sm:hidden">{pick(["yes: ", "有："])}</span>
              <RichText text={pick(s.found)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ a name, decoded

type Role = "ns" | "concl" | "h1" | "h2" | "op" | "inner" | "rel" | "iff";
const ROLE: Record<Role, { cls: string; label: L }> = {
  ns: { cls: "bg-gray-200 text-gray-800", label: ["namespace: the type it is about", "命名空間：它談的型別"] },
  concl: { cls: "bg-emerald-100 text-emerald-900", label: ["the conclusion", "結論"] },
  h1: { cls: "bg-sky-100 text-sky-900", label: ["first hypothesis (`_of_`)", "第一個前提（`_of_`）"] },
  h2: { cls: "bg-violet-100 text-violet-900", label: ["second hypothesis (`_of_`)", "第二個前提（`_of_`）"] },
  op: { cls: "bg-amber-100 text-amber-900", label: ["the operation on the left side", "左邊的運算"] },
  inner: { cls: "bg-violet-100 text-violet-900", label: ["the function inside it", "它裡面的函式"] },
  rel: { cls: "bg-rose-100 text-rose-900", label: ["what is said about it", "對它說了什麼"] },
  iff: { cls: "bg-teal-100 text-teal-900", label: ["`_iff`: both directions", "`_iff`：兩個方向"] },
};
type Piece = readonly [string, Role] | string;
const NAMES: { name: Piece[]; stmt: Piece[]; read: L }[] = [
  {
    name: [["Nat.", "ns"], ["lt", "concl"], ["_of_lt", "h1"], ["_of_le", "h2"]],
    stmt: [["n < m", "h1"], " → ", ["m ≤ k", "h2"], " → ", ["n < k", "concl"]],
    read: [
      "Conclusion first (`lt`: a `<`), then `_of_` each hypothesis in order: *`<` from a `<` and a `≤`*.",
      "先唸結論（`lt`：一個 `<`），再用 `_of_` 依序接上每個前提：*由一個 `<` 和一個 `≤` 得到 `<`*。",
    ],
  },
  {
    name: [["List.", "ns"], ["length", "op"], ["_append", "inner"]],
    stmt: [["(as ++ bs)", "inner"], [".length", "op"], " = as.length + bs.length"],
    read: [
      "An equation is named after its left side, outer function first: the `length` of an `append` (`++`).",
      "等式依左邊命名，外層的函式先唸：`append`（`++`）的 `length`。",
    ],
  },
  {
    name: [["Nat.", "ns"], ["add", "op"], ["_comm", "rel"]],
    stmt: [["n + m", "op"], " = ", ["m + n", "rel"]],
    read: ["A property of an operation: `add` is `comm`utative, the two sides swap.", "運算的性質：`add` 有交換律（`comm`），兩邊對調。"],
  },
  {
    name: [["Nat.", "ns"], ["succ", "op"], ["_ne_zero", "rel"]],
    stmt: [["n.succ", "op"], ["  ≠ 0", "rel"]],
    read: [
      "Words for symbols: `succ` is `n + 1` (Lean prints `n.succ`), `ne` is `≠`, `zero` is `0`.",
      "符號有對應的詞：`succ` 是 `n + 1`（Lean 印成 `n.succ`）、`ne` 是 `≠`、`zero` 是 `0`。",
    ],
  },
  {
    name: [["Nat.", "ns"], ["lt_add_one", "op"], ["_iff", "iff"]],
    stmt: [["m < n + 1", "op"], [" ↔ ", "iff"], "m ≤ n"],
    read: [
      "`_iff` names an *if and only if*: use `.mp` left to right, `.mpr` right to left, or `rw` with it.",
      "`_iff` 表示「若且唯若」：用 `.mp` 由左到右、`.mpr` 由右到左，或拿來 `rw`。",
    ],
  },
];

function Chip({ p, on, set }: { p: Piece; on: Role | null; set: (r: Role | null) => void }) {
  if (typeof p === "string") return <span className="text-gray-700">{p}</span>;
  const [text, role] = p;
  const dim = on !== null && on !== role;
  return (
    <span
      onMouseEnter={() => set(role)}
      onMouseLeave={() => set(null)}
      className={`rounded px-0.5 motion-safe:transition-opacity motion-safe:duration-200 ${ROLE[role].cls} ${dim ? "opacity-30" : ""}`}
    >
      {text}
    </span>
  );
}

/** Pick a name: its pieces and the parts of the statement they describe share a colour (hover a piece to isolate it). */
export function NameDecoder() {
  const { pick } = useLang();
  const [k, setK] = useState(0);
  const [on, setOn] = useState<Role | null>(null);
  const n = NAMES[k];
  const roles = [...new Set(n.name.filter((p): p is readonly [string, Role] => typeof p !== "string").map((p) => p[1]))];
  return (
    <div className="w-full space-y-3 text-left" data-testid="name-decoder">
      <div className="flex flex-wrap gap-1">
        {NAMES.map((x, i) => (
          <button
            key={i}
            onClick={() => setK(i)}
            aria-pressed={i === k}
            className={`rounded-full px-2.5 py-1 font-mono text-xs ${i === k ? "bg-(--lk-accent) text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
          >
            {x.name.map((p) => (typeof p === "string" ? p : p[0])).join("")}
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="font-mono text-lg leading-loose">
          {n.name.map((p, i) => (
            <Chip key={i} p={p} on={on} set={setOn} />
          ))}
        </p>
        <p className="mt-1 text-center text-gray-400" aria-hidden>
          ↓ #check
        </p>
        <p className="font-mono text-base leading-loose">
          {n.stmt.map((p, i) => (
            <Chip key={i} p={p} on={on} set={setOn} />
          ))}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {roles.map((r) => (
            <span
              key={r}
              onMouseEnter={() => setOn(r)}
              onMouseLeave={() => setOn(null)}
              className={`rounded px-1.5 py-0.5 ${ROLE[r].cls}`}
            >
              <RichText text={pick(ROLE[r].label)} />
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-700">
        <RichText text={pick(n.read)} />
      </p>
    </div>
  );
}
