/**
 * Coding Skills ▸ Mathlib map (#/skills/mathlib[/<section>]): mathematics as a dependency graph that bottoms out in
 * three axioms. The data (frontend/public/mathlib) is generated from Mathlib by scripts/mathlib_graph/generate.py; the
 * 3D view loads three.js on demand (learnkit Graph3D).
 */
import { useLang } from "@learnkit/web";
import { useState } from "react";
import { loadIndex, type MathlibIndex } from "../../mathlib/data";
import Explorer, { type MapRequest } from "../../mathlib/Explorer";
import Galaxy from "../../mathlib/Galaxy";
import { useAsync } from "../../mathlib/hooks";
import Tours from "../../mathlib/Tours";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, Sources, Table, type SectionInfo } from "../kit";

const PAGE = "mathlib";

const SECTIONS: SectionInfo[] = [
  { id: "graph", title: ["Mathematics is a graph", "數學是一張圖"] },
  { id: "explore", title: ["Explore a theorem", "探索一條定理"] },
  { id: "tours", title: ["Guided tours: down to the axioms", "導覽：一路走到公理"] },
  { id: "axioms", title: ["The three axioms at the bottom", "最底層的三條公理"] },
  { id: "galaxy", title: ["All of Mathlib: the galaxy", "整個 Mathlib：星系"] },
];

/** theorem → lemmas → definitions → numbers → axioms, as layers */
function LayersFigure() {
  const rows: { y: number; w: number; fill: string; en: string; zh: string }[] = [
    { y: 8, w: 150, fill: "#ef4444", en: "Pythagoras", zh: "畢氏定理" },
    { y: 52, w: 260, fill: "#10b981", en: "lemmas: inner products, norms", zh: "引理：內積、範數" },
    { y: 96, w: 370, fill: "#3b82f6", en: "definitions: ℝ, ℚ, ℤ, ℕ, sets, functions", zh: "定義：ℝ、ℚ、ℤ、ℕ、集合、函數" },
    { y: 140, w: 480, fill: "#64748b", en: "Lean's logic: =, ∀, ∃, quotients", zh: "Lean 的邏輯：=、∀、∃、商" },
    { y: 184, w: 560, fill: "#f59e0b", en: "3 axioms: propext · Quot.sound · Classical.choice", zh: "3 條公理：propext · Quot.sound · Classical.choice" },
  ];
  const { pick } = useLang();
  return (
    <svg viewBox="0 0 600 222" className="h-auto w-full max-w-xl" role="img" aria-label={pick(["Layers from a theorem down to the axioms", "從定理到公理的層次"])}>
      {rows.map((r, i) => (
        <g key={i}>
          <rect x={300 - r.w / 2} y={r.y} width={r.w} height={30} rx={8} fill={r.fill} opacity={0.9} />
          <text x={300} y={r.y + 20} textAnchor="middle" fontSize={13} fill="white" fontWeight={600}>
            {pick([r.en, r.zh])}
          </text>
          {i < rows.length - 1 && <path d={`M300 ${r.y + 31} v11`} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#fz-ml-arrow)" />}
        </g>
      ))}
      <defs>
        <marker id="fz-ml-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0L10 5L0 10z" fill="#94a3b8" />
        </marker>
      </defs>
    </svg>
  );
}

export default function MathlibSkill({ section }: { section: string | null }) {
  const { pick } = useLang();
  const { data: index, error } = useAsync(loadIndex, "index");
  const [request, setRequest] = useState<MapRequest | null>(null);
  const show = (r: Omit<MapRequest, "nonce">) => {
    setRequest({ ...r, nonce: Date.now() });
    document.getElementById(`${PAGE}-explore`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const loading = <p className="text-xs text-gray-500">{error ?? pick(["Loading the map…", "載入地圖中…"])}</p>;

  return (
    <Page
      id={PAGE}
      sections={SECTIONS}
      focus={section}
      title={["The Mathlib map", "Mathlib 地圖"]}
      intro={[
        "Every theorem in Mathlib is proved from other theorems, which are proved from definitions, which rest on Lean's logic, which rests on three axioms. This page lets you see that, for real: search a theorem, see where it lives, and fly down its dependencies until you hit the bottom.",
        "Mathlib 裡每條定理都由其他定理證出，那些定理又由定義證出，定義建立在 Lean 的邏輯上，而邏輯建立在三條公理上。這一頁讓你真的看見這件事：搜尋一條定理、看它住在哪裡，然後沿著它的依賴一路往下飛，直到碰到底。",
      ]}
    >
      <Section page={PAGE} id="graph" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A proof is a list of *because*s. Ask \"because of what?\" again and again, and you never go in circles: you always end up at a few things nobody proves.",
            "證明是一串「因為」。一直追問「因為什麼？」，你不會繞圈子：最後總會停在少數幾件沒有人證明的事情上。",
          ]}
        />
        <Figure caption={["Asking \"because of what?\" from Pythagoras down. Each layer is built only from the layers below it.", "從畢氏定理一路往下問「因為什麼？」。每一層都只用它下面的層建成。"]}>
          <LayersFigure />
        </Figure>
        <P
          t={[
            "In Lean this is not a metaphor. Each declaration (theorem, definition, type) is stored with its statement and its proof term, and the proof term *names* every declaration it uses. Follow those names and you get a **directed graph**: an arrow from $A$ to $B$ means \"$A$ uses $B$\". It has no cycles (Lean forbids using something before it exists), so it has a bottom.",
            "在 Lean 裡這不是比喻。每個宣告（定理、定義、型別）都連同陳述與證明項一起存下來，而證明項會*寫出*它用到的每一個宣告的名字。跟著這些名字走，就得到一張 **有向圖**：從 $A$ 指向 $B$ 的箭頭表示「$A$ 用到 $B$」。圖中沒有環（Lean 不准在東西存在之前就用它），所以它有底。",
          ]}
        />
        <P
          t={[
            "At the bottom are the **axioms**: statements assumed without proof. Lean core has exactly three that mathematicians use, `propext`, `Quot.sound` and `Classical.choice` (section 4). Below the numbers, below the sets, that is all there is.",
            "最底下是 **公理**：不加證明而假設的陳述。數學家會用到的，Lean 核心裡恰好三條：`propext`、`Quot.sound`、`Classical.choice`（第 4 節）。在數字之下、集合之下，就只有這些。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="explore" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Pick a theorem and look underneath it. Colours are areas of mathematics; the big gold stars are axioms; click anything to see what it says and where it lives.",
            "挑一條定理，看看它底下有什麼。顏色代表數學領域；大顆的金色星星是公理；點任何一個節點，看它說什麼、住在哪裡。",
          ]}
        />
        {index ? <Explorer index={index} request={request} /> : loading}
        <List
          items={[
            [
              "**Search** by name (`pow_card`, `Real.sqrt`), by words (*Fermat*, *compact*, *質數*) or by module (`Topology.Compactness`). The search covers the curated theorems, every declaration drawn on their maps and every module; for anything else in Mathlib, the Loogle button asks [Loogle](https://loogle.lean-lang.org) online, sending only what you typed.",
              "**搜尋**：用名稱（`pow_card`、`Real.sqrt`）、用文字（*Fermat*、*compact*、*質數*）或用模組（`Topology.Compactness`）。搜尋範圍是精選定理、它們圖上畫出的每個宣告與每個模組；Mathlib 其他的東西，按 Loogle 按鈕到 [Loogle](https://loogle.lean-lang.org) 線上查詢，只送出你輸入的字。",
            ],
            [
              "**The card** on the right shows the statement as Lean prints it, its file (module) with links to the Mathlib documentation and the source on GitHub, and its shortest path to each axiom. *Show only what it uses* re-centres the map on that declaration.",
              "右邊的 **卡片** 顯示 Lean 印出的陳述、所在檔案（模組），附上 Mathlib 文件與 GitHub 原始碼的連結，以及它到每條公理的最短路徑。*只顯示它用到的* 會把地圖重新以該宣告為中心。",
            ],
            [
              "**Tree** shows the same graph as an indented list (it is also what phones and *reduced motion* get first). A name in grey was already expanded higher up: shared foundations appear many times, which is the point.",
              "**樹狀** 把同一張圖顯示成縮排清單（手機和開啟「減少動態效果」時預設也是它）。灰色的名稱表示上面已經展開過：共用的基礎會出現很多次，這正是重點。",
            ],
          ]}
        />
        <Callout kind="note" title={["Why not the whole graph?", "為什麼不畫整張圖？"]}>
          <P
            t={[
              "Because it is huge. Pythagoras alone rests on about nine thousand declarations, the fundamental theorem of algebra on about twenty-six thousand. Each map keeps the paths to the axioms, the guided path and the nearest, most-used dependencies (about a hundred nodes); every node tells you how many of its own dependencies were left out.",
              "因為它太大了。光是畢氏定理就依賴大約九千個宣告，代數基本定理大約兩萬六千個。每張地圖保留通往公理的路徑、導覽路徑，以及最近、最常被用到的依賴（約一百個節點）；每個節點都會告訴你它自己有多少依賴沒畫出來。",
            ]}
          />
        </Callout>
      </Section>

      <Section page={PAGE} id="tours" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "Take one famous theorem and keep asking \"because of what?\", one level at a time. Each step is a real Mathlib declaration, in the order the proof terms use them.",
            "挑一條有名的定理，一層一層地追問「因為什麼？」。每一步都是真正的 Mathlib 宣告，順序就是證明項使用它們的順序。",
          ]}
        />
        {index ? <Tours index={index} onShow={(theorem, path, node) => show({ theorem, path, node })} /> : loading}
        <P
          t={[
            "Notice the pattern (Feynman would call it *the same idea again*): to prove the special case, Mathlib proves the general one. Fermat becomes a fact about finite groups; √2 becomes √p. The deeper you go, the more general and the fewer the ideas, until three axioms carry everything.",
            "注意其中的模式（費曼會說這是*同一個想法又出現了*）：為了證明特例，Mathlib 先證一般的情形。費馬變成有限群的事實；√2 變成 √p。越往下越一般、想法越少，直到三條公理撐起一切。",
          ]}
        />
      </Section>

      <Section page={PAGE} id="axioms" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "Everything bottoms out in three statements that Lean assumes. Every other fact on this page is a theorem, checked by the kernel.",
            "一切最後都落在 Lean 假設的三個陳述上。這一頁上其他每一個事實都是定理，都由核心檢查過。",
          ]}
        />
        <AxiomTable index={index} />
        <P
          t={[
            "Lean can list the axioms behind any theorem. Some use none at all: `n + m = m + n` on ℕ is proved by induction from the definition of `+` alone, and Cantor's theorem (no set maps onto its power set) is pure logic. Excluded middle, on the other hand, is *proved* from choice, so it uses all three.",
            "Lean 能列出任何定理背後的公理。有些一條都不用：ℕ 上的 `n + m = m + n` 只靠 `+` 的定義做歸納就證出來；康托爾定理（沒有集合能映滿它的冪集）是純邏輯。反過來，排中律是由選擇公理*證出*的，所以三條都用到。",
          ]}
        />
        <Lean
          runner="mathlib"
          code={`#print axioms Nat.add_comm
-- 'Nat.add_comm' does not depend on any axioms

#print axioms Classical.em
-- 'Classical.em' depends on axioms: [propext, Classical.choice, Quot.sound]

#print axioms irrational_sqrt_two
-- 'irrational_sqrt_two' depends on axioms: [propext, Classical.choice, Quot.sound]`}
        />
        <Callout kind="warn" title={["Two more axioms to watch for", "另外兩個要留意的公理"]}>
          <P
            t={[
              "`sorryAx` appears when a proof contains `sorry` (it is not a proof), and `Lean.ofReduceBool` when it used `native_decide` (it trusts the compiler). Neither appears under any theorem on this map. See *Verifying a proof* for how to check.",
              "證明裡有 `sorry` 時會出現 `sorryAx`（那不是證明）；用了 `native_decide` 時會出現 `Lean.ofReduceBool`（它信任編譯器）。這張地圖上的定理底下都沒有它們。檢查方法見《驗證證明》。",
            ]}
          />
          <SiteLink to={["skills", "verify"]} label={["Verifying a proof", "驗證證明"]} />
        </Callout>
      </Section>

      <Section page={PAGE} id="galaxy" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "Zoom out from one theorem to the whole library: each star is a district of Mathlib (a folder of files), linked to the districts it imports most.",
            "從一條定理拉遠到整個函式庫：每顆星是 Mathlib 的一個區域（一個資料夾的檔案），連到它最常匯入的區域。",
          ]}
        />
        {index ? <Galaxy index={index} onOpen={(i) => show({ theorem: index.theorems[i].name })} /> : loading}
        <P
          t={[
            "A Lean file can only use what it imports, so the import graph is the dependency graph seen from far away. Core Lean (`Init`, `Std`) sits at the centre; algebra and order are the dense core of Mathlib; analysis, topology and number theory are built on top of them.",
            "Lean 檔案只能使用它匯入的東西，所以匯入圖就是從遠處看的依賴圖。核心 Lean（`Init`、`Std`）位在中心；代數與序是 Mathlib 稠密的核心；分析、拓撲與數論蓋在它們之上。",
          ]}
        />
        <Sources
          items={[
            { label: "Mathlib documentation", url: "https://leanprover-community.github.io/mathlib4_docs/" },
            { label: "Mathlib source (GitHub)", url: "https://github.com/leanprover-community/mathlib4" },
            { label: "Loogle: search Mathlib", url: "https://loogle.lean-lang.org" },
            { label: "Theorem Proving in Lean 4: Axioms and Computation", url: "https://lean-lang.org/theorem_proving_in_lean4/Axioms-and-Computation/" },
            { label: "Mathlib's list of 100 theorems", url: "https://leanprover-community.github.io/100.html" },
            { label: "3d-force-graph (three.js)", url: "https://github.com/vasturiano/3d-force-graph" },
          ]}
        />
      </Section>
    </Page>
  );
}

const AXIOM_ROWS: { name: string; lean: string; says: [string, string] }[] = [
  {
    name: "propext",
    lean: "axiom propext {a b : Prop} : (a ↔ b) → a = b",
    says: ["Equivalent propositions are equal. It is what lets `rw` and `simp` swap a statement for an equivalent one.", "等價的命題相等。`rw` 和 `simp` 能把陳述換成等價陳述，靠的就是它。"],
  },
  {
    name: "Quot.sound",
    lean: "axiom Quot.sound : r a b → Quot.mk r a = Quot.mk r b",
    says: ["Related elements have equal classes in a quotient. It gives ℝ (Cauchy sequences up to equivalence), ℤ/n, multisets, and function extensionality.", "相關的元素在商中類別相等。ℝ（柯西數列取等價類）、ℤ/n、多重集與函數外延性都從它而來。"],
  },
  {
    name: "Classical.choice",
    lean: "axiom Classical.choice {α : Sort u} : Nonempty α → α",
    says: ["From \"something exists\", pick one. It gives excluded middle, proof by contradiction on any statement, and Zorn's lemma.", "由「某物存在」挑出一個。排中律、對任意陳述的反證法與佐恩引理都從它而來。"],
  },
];

function AxiomTable({ index }: { index: MathlibIndex | null }) {
  const count = (a: string) => index?.theorems.filter((t) => t.axioms.includes(a)).length;
  return (
    <Table
      head={[
        ["Axiom", "公理"],
        ["In Lean", "在 Lean 中"],
        ["What it says", "意思"],
        ["Theorems on this map using it", "本地圖上用到它的定理"],
      ]}
      rows={AXIOM_ROWS.map((r) => [
        [`\`${r.name}\``, `\`${r.name}\``],
        <code key="l" className="text-xs">
          {r.lean}
        </code>,
        r.says,
        [index ? `${count(r.name)} of ${index.theorems.length}` : "…", index ? `${index.theorems.length} 條中的 ${count(r.name)} 條` : "…"],
      ])}
    />
  );
}
