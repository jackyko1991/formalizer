/** Further reading ▸ Books & papers (#/reading/books[/<section>]): where to go next, every link checked. */
import { RichText, useLang } from "@learnkit/web";
import { Page, Section, SiteLink, type L } from "../kit";

const PAGE = "books";

interface Entry {
  title: string;
  url: string;
  who: string;
  /** one line: what it is and who it is for */
  note: L;
  /** free / interactive / paper / repository */
  tag: L;
}

const FREE: L = ["free online", "免費線上"];
const PLAY: L = ["in the browser", "瀏覽器裡玩"];
const PAPER: L = ["paper", "論文"];
const REPO: L = ["repository", "程式庫"];
const TOOL: L = ["search tool", "搜尋工具"];

const SECTIONS: { id: string; title: L; intro: L; entries: Entry[] }[] = [
  {
    id: "start",
    title: ["Start here", "從這裡開始"],
    intro: [
      "If you finished the tutorial track, these are the natural next steps, from a game to a full textbook.",
      "如果你已完成教學路線，這些是接下來最自然的幾步，從一個遊戲到一本完整的教科書。",
    ],
    entries: [
      {
        title: "Natural Number Game",
        url: "https://adam.math.hhu.de/#/g/leanprover-community/nng4",
        who: "Kevin Buzzard, Jon Eugster",
        note: [
          "Build the natural numbers and prove `a + b = b + a` yourself, level by level. The best first hour with Lean.",
          "親手建構自然數，一關一關證明 `a + b = b + a`。和 Lean 相處的第一個小時，最好的選擇。",
        ],
        tag: PLAY,
      },
      {
        title: "Theorem Proving in Lean 4",
        url: "https://lean-lang.org/theorem_proving_in_lean4/",
        who: "Jeremy Avigad, Leonardo de Moura, Soonho Kong, Sebastian Ullrich",
        note: [
          "How Lean works underneath: types, propositions as types, tactics, induction. Read it alongside the Concept pages.",
          "Lean 底層如何運作：型別、命題即型別、戰術、歸納法。適合搭配「概念」頁一起讀。",
        ],
        tag: FREE,
      },
      {
        title: "Mathematics in Lean",
        url: "https://leanprover-community.github.io/mathematics_in_lean/",
        who: "Jeremy Avigad, Patrick Massot",
        note: [
          "Real mathematics with Mathlib: inequalities, sets, functions, number theory, topology. The step after the tutorial track.",
          "用 Mathlib 做真正的數學：不等式、集合、函數、數論、拓撲。教學路線之後的下一步。",
        ],
        tag: FREE,
      },
    ],
  },
  {
    id: "language",
    title: ["Lean as a language", "把 Lean 當成程式語言"],
    intro: [
      "Lean is also a programming language. These explain the language itself, not just proofs.",
      "Lean 也是一種程式語言。這些資料講的是語言本身，而不只是證明。",
    ],
    entries: [
      {
        title: "Functional Programming in Lean",
        url: "https://lean-lang.org/functional_programming_in_lean/",
        who: "David Thrane Christiansen",
        note: [
          "Programs, structures, type classes and monads in Lean, for readers who know some programming.",
          "Lean 中的程式、結構、型別類別與單子，適合懂一些程式設計的讀者。",
        ],
        tag: FREE,
      },
      {
        title: "The Lean Language Reference",
        url: "https://lean-lang.org/doc/reference/latest/",
        who: "Lean FRO",
        note: [
          "The official reference: every tactic, command and option, including how to validate a proof.",
          "官方參考手冊：每一個戰術、指令與選項，也包括如何驗證一個證明。",
        ],
        tag: FREE,
      },
    ],
  },
  {
    id: "search",
    title: ["Finding things in Mathlib", "在 Mathlib 裡找東西"],
    intro: [
      "Mathlib has hundreds of thousands of theorems. These help you find the one you need (see also Coding Skills ▸ Finding lemmas).",
      "Mathlib 有數十萬條定理。這些工具幫你找到需要的那一條（另見「程式技巧 ▸ 尋找引理」）。",
    ],
    entries: [
      {
        title: "Mathlib documentation",
        url: "https://leanprover-community.github.io/mathlib4_docs/",
        who: "Lean community",
        note: ["Every definition and theorem in Mathlib, searchable by name.", "Mathlib 中每一個定義與定理，可依名稱搜尋。"],
        tag: TOOL,
      },
      {
        title: "Loogle",
        url: "https://loogle.lean-lang.org/",
        who: "Joachim Breitner",
        note: [
          "Search by shape: for example, every lemma that mentions `List.length` and `++`.",
          "依形狀搜尋：例如所有同時提到 `List.length` 與 `++` 的引理。",
        ],
        tag: TOOL,
      },
      {
        title: "LeanSearch",
        url: "https://leansearch.net/",
        who: "",
        note: ["Search Mathlib in plain words.", "用日常語言搜尋 Mathlib。"],
        tag: TOOL,
      },
      {
        title: "Lean Zulip chat",
        url: "https://leanprover.zulipchat.com/",
        who: "Lean community",
        note: [
          "Where the community answers questions, including the #new members stream for beginners.",
          "社群回答問題的地方，包括給初學者的 #new members 頻道。",
        ],
        tag: FREE,
      },
    ],
  },
  {
    id: "background",
    title: ["How we got here", "我們如何走到這裡"],
    intro: [
      "The papers and projects behind Lean and Mathlib (the History page tells the story).",
      "Lean 與 Mathlib 背後的論文與專案（「歷史」頁講述整個故事）。",
    ],
    entries: [
      {
        title: "The Lean 4 Theorem Prover and Programming Language",
        url: "https://doi.org/10.1007/978-3-030-79876-5_37",
        who: "Leonardo de Moura, Sebastian Ullrich (CADE 2021)",
        note: ["The paper introducing Lean 4.", "介紹 Lean 4 的論文。"],
        tag: PAPER,
      },
      {
        title: "The Lean Mathematical Library",
        url: "https://arxiv.org/abs/1910.09336",
        who: "The mathlib Community (CPP 2020)",
        note: ["How Mathlib is organised and why it is one library.", "Mathlib 如何組織，以及為什麼它是單一一個函式庫。"],
        tag: PAPER,
      },
      {
        title: "Xena project blog",
        url: "https://xenaproject.wordpress.com/",
        who: "Kevin Buzzard",
        note: [
          "A mathematician's blog on formalising mathematics, from undergraduate exercises to Fermat's Last Theorem.",
          "一位數學家談形式化數學的部落格，從大學習題一路談到費馬最後定理。",
        ],
        tag: FREE,
      },
      {
        title: "Liquid Tensor Experiment",
        url: "https://github.com/leanprover-community/lean-liquid",
        who: "Johan Commelin and the Lean community",
        note: [
          "The 2020–2022 project that checked a hard theorem of Peter Scholze's in Lean.",
          "2020–2022 年，在 Lean 中檢查 Peter Scholze 一個困難定理的專案。",
        ],
        tag: REPO,
      },
      {
        title: "Polynomial Freiman–Ruzsa conjecture (PFR)",
        url: "https://github.com/teorth/pfr",
        who: "Terence Tao and contributors",
        note: [
          "A new result formalised within weeks of its proof, by a team working from a public blueprint.",
          "一個新結果在證明出來後短短數週內就完成形式化，由一個依照公開藍圖分工的團隊完成。",
        ],
        tag: REPO,
      },
    ],
  },
  {
    id: "problems",
    title: ["Behind the research problems", "研究題目的來源"],
    intro: [
      "Where Formalizer's research showcase comes from (it needs the Full runner, with Mathlib).",
      "Formalizer 研究展示題目的來源（需要含 Mathlib 的 Full 執行器）。",
    ],
    entries: [
      {
        title: "openai/math",
        url: "https://github.com/openai/math",
        who: "OpenAI",
        note: [
          "Hundreds of research results stated in Lean as Comparator challenges, many with published proofs.",
          "數百個以 Lean 陳述為 Comparator 挑戰的研究成果，許多附有公開的證明。",
        ],
        tag: REPO,
      },
      {
        title: "openai/NavierStokesAndEuler",
        url: "https://github.com/openai/NavierStokesAndEuler",
        who: "OpenAI",
        note: [
          "The Navier–Stokes and Euler challenges in Lean, Formalizer's flagship problem.",
          "Lean 中的 Navier–Stokes 與 Euler 挑戰，Formalizer 的旗艦題目。",
        ],
        tag: REPO,
      },
      {
        title: "Comparator",
        url: "https://github.com/leanprover/comparator",
        who: "Lean FRO",
        note: [
          "Checks that a solution proves exactly a challenge statement with only allowed axioms; part of Lean itself from v4.35.0.",
          "檢查一份解答是否只用允許的公理、證明的正是挑戰陳述；從 v4.35.0 起成為 Lean 的一部分。",
        ],
        tag: REPO,
      },
    ],
  },
];

export default function BooksReading({ section }: { section: string | null }) {
  const { pick } = useLang();
  return (
    <Page
      id={PAGE}
      title={["Books & papers", "書籍與論文"]}
      intro={[
        "Where to go after Formalizer: free books, tools for finding theorems, and the papers and projects behind Lean. Every link was checked when this page was written.",
        "離開 Formalizer 之後可以去哪裡：免費的書、找定理的工具，以及 Lean 背後的論文與專案。每個連結在撰寫本頁時都已確認可以開啟。",
      ]}
      sections={SECTIONS.map((s) => ({ id: s.id, title: s.title }))}
      focus={section}
    >
      {SECTIONS.map((s, i) => (
        <Section key={s.id} page={PAGE} id={s.id} n={i + 1} title={s.title}>
          <p className="text-gray-600">
            <RichText text={pick(s.intro)} />
          </p>
          <ul className="divide-y divide-gray-100">
            {s.entries.map((e) => (
              <li key={e.url} className="py-3" data-testid="reading-entry">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <a href={e.url} target="_blank" rel="noreferrer" className="font-semibold text-(--lk-accent) hover:underline">
                    {e.title} ↗
                  </a>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{pick(e.tag)}</span>
                </p>
                {e.who && <p className="text-xs text-gray-500">{e.who}</p>}
                <p className="mt-1">
                  <RichText text={pick(e.note)} />
                </p>
              </li>
            ))}
          </ul>
          {s.id === "search" && <SiteLink to={["skills", "search"]} label={["Coding Skills ▸ Finding lemmas", "程式技巧 ▸ 尋找引理"]} />}
          {s.id === "background" && <SiteLink to={["concept", "history"]} label={["Concept ▸ Lean history", "概念 ▸ Lean 歷史"]} />}
        </Section>
      ))}
    </Page>
  );
}
