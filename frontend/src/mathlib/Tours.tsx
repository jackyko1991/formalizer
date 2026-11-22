/**
 * Guided tours of the Mathlib map: from a famous theorem down to an axiom, one declaration at a time. The path itself is
 * computed by the generator (scripts/mathlib_graph/curated.json lists the waypoints); the words are here.
 */
import { RichText, useLang } from "@learnkit/web";
import { useState } from "react";
import { areaOf, loadGraph, type L, type MathlibIndex } from "./data";
import { AreaDot } from "./Explorer";
import { useAsync } from "./hooks";

export interface Tour {
  theorem: string;
  title: L;
  intro: L;
}

export const TOURS: Tour[] = [
  {
    theorem: "EuclideanGeometry.dist_sq_eq_dist_sq_add_dist_sq_iff_angle_eq_pi_div_two",
    title: ["Pythagoras → inner products → ℝ → Cauchy sequences → an axiom", "畢氏定理 → 內積 → ℝ → 柯西數列 → 公理"],
    intro: [
      "A school theorem about triangles. Follow it down and you pass through vectors, then the real numbers, then how the real numbers are *made*.",
      "一條關於三角形的中學定理。順著它往下走，會經過向量，然後是實數，再來是實數是怎麼*造出來*的。",
    ],
  },
  {
    theorem: "ZMod.pow_card_sub_one_eq_one",
    title: ["Fermat's little theorem → Lagrange → counting", "費馬小定理 → 拉格朗日 → 計數"],
    intro: [
      "$a^{p-1} \\equiv 1 \\pmod p$. Mathlib does not prove it with numbers at all: it is a fact about finite groups.",
      "$a^{p-1} \\equiv 1 \\pmod p$。Mathlib 完全不用數字來證它：這是有限群的一個事實。",
    ],
  },
  {
    theorem: "Nat.exists_infinite_primes",
    title: ["Infinitely many primes → smallest factors → division", "質數無限多 → 最小因數 → 除法"],
    intro: [
      "Euclid: above any $n$, the smallest prime factor of $n! + 1$ is a new prime. The tour follows the *smallest factor* down to grade-school division.",
      "歐幾里得：對任何 $n$，$n! + 1$ 的最小質因數就是一個比 $n$ 大的新質數。這趟導覽順著「最小因數」一路走到小學的除法。",
    ],
  },
  {
    theorem: "irrational_sqrt_two",
    title: ["√2 is irrational → √p → ℝ → an axiom", "√2 是無理數 → √p → ℝ → 公理"],
    intro: [
      "The oldest proof by contradiction. Mathlib proves more (√p is irrational for every prime p) and specialises, then the statement leans on ℝ.",
      "最古老的反證法。Mathlib 證明更一般的事（每個質數 p 的 √p 都是無理數）再套用到 2；而這個陳述本身又倚靠 ℝ。",
    ],
  },
];

/** What a declaration on a tour path is, in a sentence. */
export const NOTES: Record<string, L> = {
  "EuclideanGeometry.dist_sq_eq_dist_sq_add_dist_sq_iff_angle_eq_pi_div_two": [
    "For points $p_1, p_2, p_3$: $\\text{dist}(p_1,p_3)^2 = \\text{dist}(p_1,p_2)^2 + \\text{dist}(p_3,p_2)^2$ exactly when the angle at $p_2$ is $\\pi/2$.",
    "對點 $p_1, p_2, p_3$：$\\text{dist}(p_1,p_3)^2 = \\text{dist}(p_1,p_2)^2 + \\text{dist}(p_3,p_2)^2$ 恰好在 $p_2$ 的角是 $\\pi/2$ 時成立。",
  ],
  "InnerProductGeometry.norm_sub_sq_eq_norm_sq_add_norm_sq_iff_angle_eq_pi_div_two": [
    "The same fact for vectors: $\\|x - y\\|^2 = \\|x\\|^2 + \\|y\\|^2$ iff the angle between $x$ and $y$ is $\\pi/2$. Points became arrows.",
    "同一件事換成向量：$\\|x - y\\|^2 = \\|x\\|^2 + \\|y\\|^2$ 若且唯若 $x$、$y$ 的夾角是 $\\pi/2$。點變成了箭頭。",
  ],
  norm_sub_sq_eq_norm_sq_add_norm_sq_iff_real_inner_eq_zero: [
    "…iff the **inner product** $\\langle x, y\\rangle$ is $0$. Expand $\\|x-y\\|^2 = \\|x\\|^2 - 2\\langle x,y\\rangle + \\|y\\|^2$ and the whole theorem is one line of algebra. A right angle *means* inner product zero.",
    "……若且唯若 **內積** $\\langle x, y\\rangle = 0$。展開 $\\|x-y\\|^2 = \\|x\\|^2 - 2\\langle x,y\\rangle + \\|y\\|^2$，整條定理就是一行代數。直角的*意思*就是內積為零。",
  ],
  Real: [
    "Lengths are real numbers. In Lean, `ℝ` is a structure with one field: an element of the Cauchy completion of ℚ.",
    "長度是實數。在 Lean 裡，`ℝ` 是只有一個欄位的結構：ℚ 的柯西完備化中的一個元素。",
  ],
  "CauSeq.Completion.Cauchy": [
    "Cauchy sequences of rationals, where two sequences count as *the same* number when their difference tends to 0. \"Count as the same\" is a **quotient**: $0.999\\ldots$ and $1.000\\ldots$ land in one class.",
    "有理數的柯西數列；兩個數列的差趨近 0 時就算是*同一個*數。「算是同一個」就是**商**：$0.999\\ldots$ 和 $1.000\\ldots$ 落在同一類。",
  ],
  funext: [
    "Function extensionality: functions that agree at every input are equal. Lean does not assume it; it *proves* it from quotients.",
    "函數外延性：在每個輸入都相等的函數就相等。Lean 沒有假設它，而是由商型別*證出*它。",
  ],
  "Quot.sound": [
    "**Axiom.** If $a \\sim b$ then the classes of $a$ and $b$ in the quotient are equal. Nobody proves this; it is what a quotient means. The bottom.",
    "**公理。** 若 $a \\sim b$，則 $a$、$b$ 在商中的類相等。沒有人證明它，這就是「商」的意思。到底了。",
  ],
  propext: [
    "**Axiom.** Propositions that imply each other are equal: $(P \\leftrightarrow Q) \\to P = Q$. It lets `simp` and `rw` replace a statement by an equivalent one.",
    "**公理。** 互相蘊含的命題相等：$(P \\leftrightarrow Q) \\to P = Q$。有了它，`simp` 和 `rw` 才能把一個陳述換成等價的另一個。",
  ],
  "Classical.choice": [
    "**Axiom.** From a proof that something exists, pick one. It gives excluded middle and non-constructive proofs.",
    "**公理。** 由「某物存在」的證明挑出一個。排中律與非構造性證明都從它而來。",
  ],
  "ZMod.pow_card_sub_one_eq_one": [
    "For $a \\ne 0$ in $\\mathbb{Z}/p$: $a^{p-1} = 1$.",
    "對 $\\mathbb{Z}/p$ 中的 $a \\ne 0$：$a^{p-1} = 1$。",
  ],
  "FiniteField.pow_card_sub_one_eq_one": [
    "More general: in *any* finite field with $q$ elements, $a^{q-1} = 1$ for $a \\ne 0$. $\\mathbb{Z}/p$ is one example.",
    "更一般：在*任何* $q$ 個元素的有限體中，$a \\ne 0$ 時 $a^{q-1} = 1$。$\\mathbb{Z}/p$ 只是其中一例。",
  ],
  pow_card_eq_one: [
    "More general still: in a finite group $G$, $g^{|G|} = 1$. The nonzero elements of a field form a group with $q-1$ elements.",
    "再更一般：有限群 $G$ 中 $g^{|G|} = 1$。體中的非零元素形成一個有 $q-1$ 個元素的群。",
  ],
  "pow_card_eq_one'": ["The same, with the size counted by `Nat.card`.", "同一件事，大小改用 `Nat.card` 計算。"],
  orderOf_dvd_natCard: [
    "**Lagrange**: the order of $g$ divides $|G|$, because the powers of $g$ form a subgroup and the cosets of a subgroup tile $G$.",
    "**拉格朗日**：$g$ 的階整除 $|G|$，因為 $g$ 的冪形成子群，而子群的陪集把 $G$ 鋪滿。",
  ],
  orderOf_dvd_card: ["The same for a `Fintype`, a type with a list of all its elements.", "同一件事，用於 `Fintype`（列得出所有元素的型別）。"],
  "Fintype.card": ["The number of elements of a finite type.", "有限型別的元素個數。"],
  Fintype: [
    "A finite type: a `Finset` containing every element. Finsets are multisets without repeats, and multisets are lists up to reordering: a quotient again.",
    "有限型別：一個包含所有元素的 `Finset`。Finset 是沒有重複的多重集，多重集是「不計順序的串列」：又是一個商。",
  ],
  "Nat.exists_infinite_primes": ["For every $n$ there is a prime $p \\ge n$.", "對每個 $n$ 都有質數 $p \\ge n$。"],
  "Nat.minFac_prime": [
    "The smallest factor $> 1$ of any $n \\ne 1$ is prime. Euclid applies it to $n! + 1$: that factor cannot be $\\le n$, since it would divide $n!$ and so $1$.",
    "任何 $n \\ne 1$ 大於 1 的最小因數都是質數。歐幾里得把它用在 $n! + 1$：這個因數不可能 $\\le n$，否則它整除 $n!$，也就整除 $1$。",
  ],
  "Nat.minFac": ["The smallest factor $> 1$, found by trying $2, 3, 5, 7, \\ldots$ in turn.", "大於 1 的最小因數：依序試 $2, 3, 5, 7, \\ldots$ 找出來。"],
  "Nat.dvd_iff_mod_eq_zero": ["$d \\mid n$ iff the remainder $n \\bmod d$ is $0$.", "$d \\mid n$ 若且唯若餘數 $n \\bmod d$ 為 $0$。"],
  "Nat.mod_add_div": ["Division with remainder: $n \\bmod k + k\\,(n / k) = n$.", "帶餘除法：$n \\bmod k + k\\,(n / k) = n$。"],
  eq_true: [
    "A proved proposition *equals* `True`. Turning \"is proved\" into \"equals True\" is exactly where `propext` enters.",
    "已證明的命題*等於* `True`。把「已證明」變成「等於 True」正是 `propext` 進場的地方。",
  ],
  irrational_sqrt_two: ["$\\sqrt 2 \\notin \\mathbb{Q}$.", "$\\sqrt 2 \\notin \\mathbb{Q}$。"],
  "Nat.Prime.irrational_sqrt": [
    "For every prime $p$, $\\sqrt p$ is irrational: if $p\\,b^2 = a^2$, the prime $p$ appears an odd number of times on the left and an even number on the right.",
    "對每個質數 $p$，$\\sqrt p$ 是無理數：若 $p\\,b^2 = a^2$，質數 $p$ 在左邊出現奇數次、右邊偶數次。",
  ],
  "Real.sqrt": [
    "The square root on ℝ, built from the one on $[0, \\infty)$. To even *state* the theorem we need ℝ.",
    "ℝ 上的平方根，由 $[0, \\infty)$ 上的平方根造出。光是*陳述*這條定理就需要 ℝ。",
  ],
};

export default function Tours({ index, onShow }: { index: MathlibIndex; onShow: (theorem: string, path: string[], node: string) => void }) {
  const { pick } = useLang();
  const tours = TOURS.filter((t) => index.theorems.some((e) => e.name === t.theorem));
  const [k, setK] = useState(0);
  const [step, setStep] = useState(0);
  const tour = tours[k];
  const entry = index.theorems.find((e) => e.name === tour.theorem)!;
  const { data: graph } = useAsync(() => loadGraph(entry), entry.file);
  const path = graph ? graph.path.map((i) => graph.nodes[i]) : [];
  const names = path.map((n) => n.name);
  return (
    <div className="space-y-3" data-testid="mathlib-tours">
      <div className="flex flex-wrap gap-1.5">
        {tours.map((t, i) => (
          <button
            key={t.theorem}
            onClick={() => {
              setK(i);
              setStep(0);
            }}
            className={`rounded-full px-2.5 py-1 text-xs ${i === k ? "bg-(--lk-accent) text-white" : "bg-teal-50 text-(--lk-accent) hover:bg-teal-100"}`}
          >
            {(([e]) => pick([e.en, e.zh]))(index.theorems.filter((e) => e.name === t.theorem))}
          </button>
        ))}
      </div>
      <p className="text-sm font-medium text-gray-900">
        <RichText text={pick(tour.title)} />
      </p>
      <p>
        <RichText text={pick(tour.intro)} />
      </p>
      {!graph && <p className="text-xs text-gray-500">…</p>}
      {graph && (
        <ol className="relative space-y-0">
          {path.map((n, i) => {
            const note = NOTES[n.name];
            const active = i === step;
            return (
              <li key={n.name} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setStep(i)}
                    aria-label={n.name}
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${active ? "scale-125" : ""}`}
                    style={{ background: i <= step ? areaOf(n.module, n.kind).color : "white", borderColor: areaOf(n.module, n.kind).color }}
                  />
                  {i < path.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" />}
                </div>
                <div className={`min-w-0 flex-1 pb-3 ${i > step ? "opacity-40" : ""}`}>
                  <button onClick={() => setStep(i)} className="flex flex-wrap items-center gap-1.5 text-left">
                    <AreaDot color={areaOf(n.module, n.kind).color} />
                    <span className="font-mono text-xs font-semibold break-all text-gray-900">{n.name}</span>
                    <span className="text-[10px] text-gray-400">{n.module}</span>
                  </button>
                  {i <= step && (
                    <div className="mt-0.5 text-sm">
                      {note ? <RichText text={pick(note)} /> : <code className="text-xs break-all text-gray-600">{n.sig.split("\n")[0]}</code>}
                    </div>
                  )}
                  {active && (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {i < path.length - 1 && (
                        <button onClick={() => setStep(i + 1)} className="rounded-full bg-(--lk-accent) px-2.5 py-0.5 text-white">
                          {pick(["One level down ↓", "往下一層 ↓"])}
                        </button>
                      )}
                      <button onClick={() => onShow(tour.theorem, names, n.name)} className="rounded-full border border-(--lk-accent) px-2.5 py-0.5 text-(--lk-accent) hover:bg-teal-50">
                        {pick(["Show on the map", "在地圖上顯示"])}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {graph && step === path.length - 1 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {pick([
            `${path.length - 1} steps from the theorem to an axiom. The full closure has ${entry.closure.toLocaleString()} declarations; this is one thread through it.`,
            `從定理到公理共 ${path.length - 1} 步。完整的依賴有 ${entry.closure.toLocaleString()} 個宣告；這只是穿過其中的一條線。`,
          ])}
        </p>
      )}
    </div>
  );
}
