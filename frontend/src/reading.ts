/**
 * Further reading data (Tensorizer's method): books in groups, top picks (★) first, each with authors, publisher and
 * year, a one-line reason, a free official edition when there is one, and the page of this site it goes with; and
 * papers and projects in groups. ISBNs were checked against Open Library and DOIs against Crossref when written;
 * tests/reading.test.ts checks the ISBN checksums and the links' shape. Title, authors and publisher stay in English.
 */
export type L = readonly [string, string];

export interface Book {
  id: string;
  group: "start" | "proofs" | "types" | "story";
  /** a top pick (★): listed first within its group */
  top: boolean;
  title: string;
  edition?: string;
  authors: string;
  /** "online" for books that exist only as a free website */
  publisher: string;
  /** printed books only */
  year?: number;
  /** printed books only */
  isbn13?: string;
  why: L;
  /** a free official online edition (or the book itself, when it is online only) */
  free?: string;
  /** the matching page of this site */
  site: { to: [string, string?]; label: L };
}

export const BOOK_GROUPS: { id: Book["group"]; title: L }[] = [
  { id: "start", title: ["Learn Lean (free online)", "學 Lean（免費線上）"] },
  { id: "proofs", title: ["How proofs work", "證明是怎麼一回事"] },
  { id: "types", title: ["Types and logic", "型別與邏輯"] },
  { id: "story", title: ["The story of checked proofs", "被檢查的證明的故事"] },
];

const PROBLEMS: Book["site"] = { to: ["problems"], label: ["Problems", "題庫"] };

export const BOOKS: Book[] = [
  // Learn Lean
  {
    id: "nng",
    group: "start",
    top: true,
    title: "Natural Number Game",
    authors: "Kevin Buzzard, Mohammad Pedramfar, Jon Eugster",
    publisher: "online",
    why: [
      "Build the natural numbers and prove `a + b = b + a` yourself, level by level: the best first hour with Lean, in the browser.",
      "親手建構自然數，一關一關證明 `a + b = b + a`：和 Lean 相處最好的第一個小時，直接在瀏覽器裡玩。",
    ],
    free: "https://adam.math.hhu.de/#/g/leanprover-community/nng4",
    site: PROBLEMS,
  },
  {
    id: "tpil",
    group: "start",
    top: true,
    title: "Theorem Proving in Lean 4",
    authors: "Jeremy Avigad, Leonardo de Moura, Soonho Kong, Sebastian Ullrich",
    publisher: "online",
    why: [
      "How Lean works underneath: types, propositions as types, tactics, induction, axioms.",
      "Lean 底層如何運作：型別、命題即型別、戰術、歸納法、公理。",
    ],
    free: "https://lean-lang.org/theorem_proving_in_lean4/",
    site: { to: ["concept", "maths"], label: ["Concept ▸ Lean maths", "概念 ▸ Lean 數學"] },
  },
  {
    id: "mil",
    group: "start",
    top: false,
    title: "Mathematics in Lean",
    authors: "Jeremy Avigad, Patrick Massot",
    publisher: "online",
    why: [
      "Real mathematics with Mathlib: inequalities, sets, functions, number theory, topology. The step after the tutorial track.",
      "用 Mathlib 做真正的數學：不等式、集合、函數、數論、拓撲。教學路線之後的下一步。",
    ],
    free: "https://leanprover-community.github.io/mathematics_in_lean/",
    site: { to: ["skills", "tactics"], label: ["Coding Skills ▸ First tactics", "程式技巧 ▸ 第一批戰術"] },
  },
  {
    id: "fpil",
    group: "start",
    top: false,
    title: "Functional Programming in Lean",
    authors: "David Thrane Christiansen",
    publisher: "online",
    why: [
      "Lean as a programming language: structures, type classes, monads. For readers who know some programming.",
      "把 Lean 當成程式語言：結構、型別類別、單子。適合懂一些程式設計的讀者。",
    ],
    free: "https://lean-lang.org/functional_programming_in_lean/",
    site: { to: ["concept", "kernel"], label: ["Concept ▸ How Lean checks", "概念 ▸ Lean 如何檢查"] },
  },
  // How proofs work
  {
    id: "velleman",
    group: "proofs",
    top: true,
    title: "How to Prove It",
    edition: "3rd edition",
    authors: "Daniel J. Velleman",
    publisher: "Cambridge University Press",
    year: 2019,
    isbn13: "9781108439534",
    why: [
      "The classic guide to writing proofs: logic, sets, induction, step by step. Its free companion redoes it in Lean.",
      "寫證明的經典入門：邏輯、集合、歸納法，一步一步來。它的免費姊妹篇用 Lean 重新走一遍。",
    ],
    free: "https://djvelleman.github.io/HTPIwL/",
    site: { to: ["skills", "structure"], label: ["Coding Skills ▸ Structuring a proof", "程式技巧 ▸ 組織證明"] },
  },
  {
    id: "houston",
    group: "proofs",
    top: false,
    title: "How to Think Like a Mathematician",
    authors: "Kevin Houston",
    publisher: "Cambridge University Press",
    year: 2009,
    isbn13: "9780521719780",
    why: [
      'How to read and write mathematics: definitions, the meaning of "if", and the common ways to prove things.',
      "如何讀寫數學：定義、「若」的意思，以及常見的證明方法。",
    ],
    site: { to: ["concept", "method"], label: ["Concept ▸ From statement to proof", "概念 ▸ 從陳述到證明"] },
  },
  // Types and logic
  {
    id: "little-typer",
    group: "types",
    top: true,
    title: "The Little Typer",
    authors: "Daniel P. Friedman, David Thrane Christiansen",
    publisher: "The MIT Press",
    year: 2018,
    isbn13: "9780262536431",
    why: [
      "Dependent types, the idea Lean is built on, taught as a playful dialogue. No background needed.",
      "依值型別（Lean 的基礎）以輕鬆的對話形式來教。不需要任何背景知識。",
    ],
    site: { to: ["concept", "maths"], label: ["Concept ▸ Lean maths", "概念 ▸ Lean 數學"] },
  },
  {
    id: "nederpelt",
    group: "types",
    top: false,
    title: "Type Theory and Formal Proof",
    edition: "An Introduction",
    authors: "Rob Nederpelt, Herman Geuvers",
    publisher: "Cambridge University Press",
    year: 2014,
    isbn13: "9781107036505",
    why: [
      "A careful textbook from simple types up to the calculus of constructions that Lean and Rocq use.",
      "一本嚴謹的教科書，從簡單型別一路講到 Lean 與 Rocq 所用的構造演算。",
    ],
    site: { to: ["concept", "kernel"], label: ["Concept ▸ How Lean checks", "概念 ▸ Lean 如何檢查"] },
  },
  {
    id: "tapl",
    group: "types",
    top: false,
    title: "Types and Programming Languages",
    authors: "Benjamin C. Pierce",
    publisher: "The MIT Press",
    year: 2002,
    isbn13: "9780262162098",
    why: [
      "The standard text on type systems: how a checker decides what a program means, and why it can be trusted.",
      "型別系統的標準教材：檢查器如何決定程式的意義，以及為什麼可以信任它。",
    ],
    site: { to: ["concept", "kernel"], label: ["Concept ▸ How Lean checks", "概念 ▸ Lean 如何檢查"] },
  },
  // The story
  {
    id: "four-colors",
    group: "story",
    top: true,
    title: "Four Colors Suffice",
    edition: "Revised color edition",
    authors: "Robin Wilson",
    publisher: "Princeton University Press",
    year: 2013,
    isbn13: "9780691158228",
    why: [
      "The first famous theorem proved with a computer, and the doubts that followed until Coq checked it in 2005.",
      "第一個靠電腦證明的著名定理，以及隨之而來的質疑，直到 2005 年 Coq 檢查了它。",
    ],
    site: { to: ["concept", "history"], label: ["Concept ▸ Lean history", "概念 ▸ Lean 歷史"] },
  },
  {
    id: "kepler",
    group: "story",
    top: false,
    title: "Kepler's Conjecture",
    authors: "George G. Szpiro",
    publisher: "Wiley",
    year: 2003,
    isbn13: "9780471086017",
    why: [
      "Four centuries of stacking oranges, up to Hales's computer proof, which led to the Flyspeck formalisation.",
      "四百年來堆橘子的問題，直到 Hales 的電腦證明，以及由此而來的 Flyspeck 形式化。",
    ],
    site: { to: ["concept", "history"], label: ["Concept ▸ Lean history", "概念 ▸ Lean 歷史"] },
  },
  {
    id: "mackenzie",
    group: "story",
    top: false,
    title: "Mechanizing Proof",
    edition: "Computing, Risk, and Trust",
    authors: "Donald MacKenzie",
    publisher: "The MIT Press",
    year: 2001,
    isbn13: "9780262133937",
    why: [
      'A sociologist\'s history of machine-checked proof: who wanted it, why, and what "proved" came to mean.',
      "一位社會學家寫的機器檢查證明史：誰想要它、為什麼，以及「已證明」後來代表什麼。",
    ],
    site: { to: ["concept", "limits"], label: ["Concept ▸ Limits of proofs", "概念 ▸ 證明的限度"] },
  },
  {
    id: "godel",
    group: "story",
    top: false,
    title: "Gödel's Proof",
    edition: "Revised edition",
    authors: "Ernest Nagel, James R. Newman; edited by Douglas R. Hofstadter",
    publisher: "NYU Press",
    year: 2008,
    isbn13: "9780814758373",
    why: [
      "The incompleteness theorems in under 150 pages, for readers without a logic background.",
      "不到 150 頁講完不完備定理，寫給沒有邏輯背景的讀者。",
    ],
    site: { to: ["concept", "limits"], label: ["Concept ▸ Limits of proofs", "概念 ▸ 證明的限度"] },
  },
  {
    id: "geb",
    group: "story",
    top: false,
    title: "Gödel, Escher, Bach",
    edition: "Twentieth-anniversary edition",
    authors: "Douglas R. Hofstadter",
    publisher: "Basic Books",
    year: 1999,
    isbn13: "9780465026562",
    why: [
      "Formal systems, self-reference and meaning, through puzzles, music and dialogues. Long, playful, unforgettable.",
      "透過謎題、音樂與對話，談形式系統、自我指涉與意義。很長、很好玩、令人難忘。",
    ],
    site: { to: ["concept", "limits"], label: ["Concept ▸ Limits of proofs", "概念 ▸ 證明的限度"] },
  },
];

export interface Paper {
  id: string;
  group: "lean" | "landmarks" | "projects";
  title: string;
  authors: string;
  /** venue and year, or "website" / "repository" */
  where: string;
  url: string;
  why: L;
}

export const PAPER_GROUPS: { id: Paper["group"]; title: L }[] = [
  { id: "lean", title: ["Lean and Mathlib", "Lean 與 Mathlib"] },
  { id: "landmarks", title: ["Landmark formalisations", "里程碑級的形式化"] },
  { id: "projects", title: ["Projects and tools", "專案與工具"] },
];

export const PAPERS: Paper[] = [
  {
    id: "lean3",
    group: "lean",
    title: "The Lean Theorem Prover (System Description)",
    authors: "Leonardo de Moura, Soonho Kong, Jeremy Avigad, Floris van Doorn, Jakob von Raumer",
    where: "CADE-25, 2015",
    url: "https://doi.org/10.1007/978-3-319-21401-6_26",
    why: [
      "The first description of Lean: a small trusted kernel and an extensible elaborator.",
      "Lean 的第一份描述：一個小而可信的核心，加上可擴充的精煉器。",
    ],
  },
  {
    id: "lean4",
    group: "lean",
    title: "The Lean 4 Theorem Prover and Programming Language",
    authors: "Leonardo de Moura, Sebastian Ullrich",
    where: "CADE-28, 2021",
    url: "https://doi.org/10.1007/978-3-030-79876-5_37",
    why: [
      "Lean 4: the prover rewritten in itself, fast enough to be a programming language.",
      "Lean 4：用自己重寫的證明器，快到足以當作程式語言。",
    ],
  },
  {
    id: "mathlib",
    group: "lean",
    title: "The Lean Mathematical Library",
    authors: "The mathlib Community",
    where: "CPP 2020",
    url: "https://arxiv.org/abs/1910.09336",
    why: [
      "How Mathlib is organised as one library, and how a community keeps it consistent.",
      "Mathlib 如何組織成單一函式庫，以及社群如何讓它保持一致。",
    ],
  },
  {
    id: "four-color",
    group: "landmarks",
    title: "Formal Proof—The Four-Color Theorem",
    authors: "Georges Gonthier",
    where: "Notices of the AMS, 2008",
    url: "https://www.ams.org/notices/200811/tx081101382p.pdf",
    why: [
      "How the four colour theorem was checked in Coq, written for working mathematicians.",
      "四色定理如何在 Coq 中被檢查，寫給一般數學家看。",
    ],
  },
  {
    id: "odd-order",
    group: "landmarks",
    title: "A Machine-Checked Proof of the Odd Order Theorem",
    authors: "Georges Gonthier and 14 co-authors",
    where: "ITP 2013",
    url: "https://doi.org/10.1007/978-3-642-39634-2_14",
    why: ["A 255-page group theory proof, checked in full after six years of work.", "一個 255 頁的群論證明，花了六年完整檢查完畢。"],
  },
  {
    id: "flyspeck",
    group: "landmarks",
    title: "A Formal Proof of the Kepler Conjecture",
    authors: "Thomas Hales and 21 co-authors",
    where: "Forum of Mathematics, Pi, 2017",
    url: "https://doi.org/10.1017/fmp.2017.1",
    why: [
      "The Flyspeck project: a proof referees could not fully check, checked by machines.",
      "Flyspeck 專案：一個審稿人無法完全檢查的證明，由機器檢查完成。",
    ],
  },
  {
    id: "perfectoid",
    group: "landmarks",
    title: "Formalising Perfectoid Spaces",
    authors: "Kevin Buzzard, Johan Commelin, Patrick Massot",
    where: "CPP 2020",
    url: "https://arxiv.org/abs/1910.12320",
    why: [
      "Defining a research-level object of modern geometry in Lean, to show it could be done.",
      "在 Lean 中定義現代幾何中一個研究級的對象，證明這件事做得到。",
    ],
  },
  {
    id: "lte",
    group: "landmarks",
    title: "Abstraction Boundaries and Spec Driven Development in Pure Mathematics",
    authors: "Johan Commelin, Adam Topaz",
    where: "Bulletin of the AMS, 2024",
    url: "https://arxiv.org/abs/2309.14870",
    why: [
      "Lessons from the Liquid Tensor Experiment on organising a big formalisation.",
      "從液態張量實驗學到的經驗：如何組織一個大型形式化專案。",
    ],
  },
  {
    id: "openai-math",
    group: "projects",
    title: "openai/math",
    authors: "OpenAI",
    where: "repository",
    url: "https://github.com/openai/math",
    why: [
      "Hundreds of research results stated in Lean as Comparator challenges: the source of the research showcase.",
      "數百個以 Lean 陳述為 Comparator 挑戰的研究成果：研究展示題目的來源。",
    ],
  },
  {
    id: "navier-stokes",
    group: "projects",
    title: "openai/NavierStokesAndEuler",
    authors: "OpenAI",
    where: "repository",
    url: "https://github.com/openai/NavierStokesAndEuler",
    why: [
      "The Navier–Stokes and Euler challenges in Lean: Formalizer's flagship problem.",
      "Lean 中的 Navier–Stokes 與 Euler 挑戰：Formalizer 的旗艦題目。",
    ],
  },
  {
    id: "comparator",
    group: "projects",
    title: "Comparator",
    authors: "Lean FRO",
    where: "repository",
    url: "https://github.com/leanprover/comparator",
    why: [
      "Checks that a solution proves exactly a challenge statement; part of Lean from v4.35.0.",
      "檢查一份解答證明的正是挑戰陳述；從 v4.35.0 起成為 Lean 的一部分。",
    ],
  },
  {
    id: "pfr",
    group: "projects",
    title: "Polynomial Freiman–Ruzsa conjecture (PFR)",
    authors: "Terence Tao and contributors",
    where: "repository",
    url: "https://github.com/teorth/pfr",
    why: [
      "A new result formalised within weeks, by a team working from a public blueprint.",
      "一個新結果在數週內完成形式化，由依照公開藍圖分工的團隊完成。",
    ],
  },
  {
    id: "mathlib-docs",
    group: "projects",
    title: "Mathlib documentation",
    authors: "Lean community",
    where: "website",
    url: "https://leanprover-community.github.io/mathlib4_docs/",
    why: ["Every definition and theorem in Mathlib, searchable by name.", "Mathlib 中每一個定義與定理，可依名稱搜尋。"],
  },
  {
    id: "loogle",
    group: "projects",
    title: "Loogle",
    authors: "Joachim Breitner",
    where: "website",
    url: "https://loogle.lean-lang.org/",
    why: ["Search Mathlib by the shape of a statement.", "依陳述的形狀搜尋 Mathlib。"],
  },
  {
    id: "leansearch",
    group: "projects",
    title: "LeanSearch",
    authors: "",
    where: "website",
    url: "https://leansearch.net/",
    why: ["Search Mathlib in plain words.", "用日常語言搜尋 Mathlib。"],
  },
  {
    id: "zulip",
    group: "projects",
    title: "Lean Zulip chat",
    authors: "Lean community",
    where: "website",
    url: "https://leanprover.zulipchat.com/",
    why: ["Where the community answers questions, with a stream for new members.", "社群回答問題的地方，也有給新成員的頻道。"],
  },
  {
    id: "xena",
    group: "projects",
    title: "Xena project blog",
    authors: "Kevin Buzzard",
    where: "website",
    url: "https://xenaproject.wordpress.com/",
    why: [
      "A mathematician's blog on formalising mathematics, from exercises to Fermat's Last Theorem.",
      "一位數學家談形式化數學的部落格，從習題談到費馬最後定理。",
    ],
  },
];

/** ISBN-13 checksum: alternate weights 1 and 3, the total divisible by 10. */
export function isValidIsbn13(isbn: string): boolean {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  return [...isbn].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0) % 10 === 0;
}
