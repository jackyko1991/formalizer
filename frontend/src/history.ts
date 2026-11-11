/**
 * Concept ▸ History: how mathematics came to be checked by machines, from Automath to the Lean certificates of
 * 2026. Every card cites its sources. Text is [English, Traditional Chinese].
 */
import type { Era, TimelineCard } from "@learnkit/web";

export const ERAS: Era[] = [
  {
    id: "checkers",
    title: ["Machines that check proofs", "會檢查證明的機器"],
    intro: [
      "The first idea: write a proof so precisely that a small, trusted program can check every step.",
      "最初的想法：把證明寫得足夠精確，讓一個小而可信的程式檢查每一步。",
    ],
    colour: "bg-sky-600 text-sky-700",
  },
  {
    id: "landmarks",
    title: ["Famous theorems, checked", "名定理，逐行驗證"],
    intro: [
      "Proofs too long or too computer-heavy for referees to trust were checked line by line.",
      "長到審稿人難以完全信任、或大量依賴電腦計算的證明，被逐行驗證。",
    ],
    colour: "bg-violet-600 text-violet-700",
  },
  {
    id: "lean",
    title: ["Lean and Mathlib", "Lean 與 Mathlib"],
    intro: [
      "A proof assistant and a community library grew into the place where working mathematicians formalize.",
      "一個證明輔助器與一個社群函式庫，逐漸成為數學家做形式化的主要地方。",
    ],
    colour: "bg-teal-600 text-teal-700",
  },
  {
    id: "ai",
    title: ["AI meets Lean", "AI 遇上 Lean"],
    intro: [
      "When a model writes the proof, Lean's kernel decides whether it is right.",
      "當證明由模型寫出，由 Lean 的核心（kernel）決定它對不對。",
    ],
    colour: "bg-amber-600 text-amber-700",
  },
];

export const HISTORY: TimelineCard[] = [
  {
    id: "automath",
    era: "checkers",
    year: "1967",
    image: {
      src: "history/automath.webp",
      alt: ["N. G. de Bruijn in 1947", "1947 年的 N. G. de Bruijn"],
      credit: "Unknown photographer · Public domain · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Prof._dr._N._G._de_Bruyn,_1947.jpg",
    },
    title: ["Automath: the first proof checker", "Automath：第一個證明檢查器"],
    body: [
      [
        "N. G. de Bruijn in Eindhoven designed **Automath**, a language in which every step of a proof is written out so that a program can check it. In 1977 L. S. van Benthem Jutting used it to check all of Landau's textbook *Foundations of Analysis*.",
        "荷蘭埃因霍溫的 N. G. de Bruijn 設計了 **Automath**：一種把證明每一步都寫出來、讓程式能檢查的語言。1977 年，L. S. van Benthem Jutting 用它檢查了 Landau 整本《分析基礎》。",
      ],
      [
        "Its lasting lesson is the **de Bruijn criterion**: whatever helps you find a proof, the final check should be done by a small program you can trust. Lean's kernel follows the same idea.",
        "它留下的最重要觀念是 **de Bruijn 準則**：不管用什麼方法找到證明，最後的檢查都應由一個小而可信的程式完成。Lean 的核心（kernel）正是這個想法。",
      ],
    ],
    sources: [
      { label: "Automath (Wikipedia)", url: "https://en.wikipedia.org/wiki/Automath" },
      { label: "Nicolaas Govert de Bruijn (Wikipedia)", url: "https://en.wikipedia.org/wiki/Nicolaas_Govert_de_Bruijn" },
    ],
  },
  {
    id: "mizar",
    era: "checkers",
    year: "1973",
    image: {
      src: "history/mizar.svg",
      alt: [
        "A Mizar proof written like prose, beside the shelves of the Mizar Mathematical Library",
        "一段像散文一樣書寫的 Mizar 證明，旁邊是 Mizar 數學函式庫的書架",
      ],
      credit: "Drawing: Formalizer",
    },
    title: ["Mizar: proofs that read like mathematics", "Mizar：讀起來像數學的證明"],
    body: [
      [
        "Andrzej Trybulec in Poland started **Mizar**, whose proofs are written in a style close to ordinary mathematical prose. From 1989 its users built the **Mizar Mathematical Library**, one of the first large libraries of checked mathematics.",
        "波蘭的 Andrzej Trybulec 創立了 **Mizar**，它的證明寫法接近一般數學文字。從 1989 年起，使用者共同建立 **Mizar 數學函式庫**，是最早的大型已驗證數學庫之一。",
      ],
    ],
    sources: [
      { label: "Mizar system (Wikipedia)", url: "https://en.wikipedia.org/wiki/Mizar_system" },
      { label: "Mizar project", url: "http://mizar.org/" },
    ],
  },
  {
    id: "lcf",
    era: "checkers",
    year: "1979",
    image: {
      src: "history/lcf.svg",
      alt: [
        "The LCF idea: tactics and automation outside, a small kernel inside that alone can create a theorem",
        "LCF 的想法：戰術與自動化在外面，只有裡面的小核心能產生定理",
      ],
      credit: "Drawing: Formalizer",
    },
    title: ["LCF: tactics, and a language built for proving", "LCF：戰術，以及為證明而生的語言"],
    body: [
      [
        "Robin Milner's **Edinburgh LCF** (after Stanford LCF, 1972) made theorems a type that only the rules of logic can create. Anything else (search, automation) is ordinary code that can never produce a false theorem: the **LCF approach**.",
        "Robin Milner 的 **Edinburgh LCF**（承接 1972 年的 Stanford LCF）把「定理」做成一種只有邏輯規則才能產生的型別。其餘的一切（搜尋、自動化）都只是普通程式，永遠造不出錯的定理：這就是 **LCF 方法**。",
      ],
      [
        "Proof steps written as programs became **tactics**, like Lean's `simp` and `ring` today. The language Milner designed for writing them, **ML**, grew into a family of programming languages.",
        "以程式寫成的證明步驟成了 **戰術（tactic）**，就像今天 Lean 的 `simp` 與 `ring`。Milner 為了寫戰術而設計的 **ML**，後來發展成一整個程式語言家族。",
      ],
    ],
    sources: [
      { label: "Logic for Computable Functions (Wikipedia)", url: "https://en.wikipedia.org/wiki/Logic_for_Computable_Functions" },
      { label: "ML (programming language) (Wikipedia)", url: "https://en.wikipedia.org/wiki/ML_(programming_language)" },
    ],
  },
  {
    id: "coq",
    era: "checkers",
    year: "1989",
    image: {
      src: "history/coq.webp",
      alt: ["Thierry Coquand in 2006", "2006 年的 Thierry Coquand"],
      credit: "Andrej Bauer · CC BY-SA 2.5 si · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Thierry_Coquand_(cropped).jpg",
    },
    title: ["Coq (now Rocq): propositions as types", "Coq（今名 Rocq）：命題即型別"],
    body: [
      [
        "Thierry Coquand and Gérard Huet's **Calculus of Constructions** turned the Curry–Howard correspondence into a working system: a statement is a type, and a proof is a program of that type. Its first release, Coq, appeared at INRIA in 1989.",
        "Thierry Coquand 與 Gérard Huet 的 **構造演算（Calculus of Constructions）** 把 Curry–Howard 對應做成實用系統：命題是一個型別，證明就是該型別的程式。它的第一版 Coq 於 1989 年在 INRIA 推出。",
      ],
      [
        "Lean is built on the same family of **dependent type theory**. In 2025, with version 9.0, Coq was renamed **the Rocq Prover**.",
        "Lean 也建立在同一類 **依值型別論** 上。2025 年 9.0 版發布時，Coq 正式更名為 **Rocq Prover**。",
      ],
    ],
    sources: [
      { label: "Rocq (Wikipedia)", url: "https://en.wikipedia.org/wiki/Rocq" },
      { label: "Rocq 9.0 release", url: "https://rocq-prover.org/releases/9.0.0" },
    ],
  },
  {
    id: "four-colour",
    era: "landmarks",
    year: "2005",
    image: {
      src: "history/four-colour.webp",
      alt: [
        "A 1976 postage meter strip from the University of Illinois reading “Four colors suffice”",
        "1976 年伊利諾大學的郵資戳，寫著「四色足矣」",
      ],
      credit: "Smithsonian National Museum of American History · Public domain · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Postal_Meter_Strip_Honoring_the_Solution_of_the_Four_Color_Problem.jpg",
    },
    title: ["The four colour theorem, checked in Coq", "四色定理，在 Coq 中驗證"],
    body: [
      [
        "Appel and Haken's 1976 proof relied on a computer checking hundreds of configurations, and many mathematicians were uneasy about it. Georges Gonthier and Benjamin Werner formalized the whole proof, including the computation, in Coq.",
        "Appel 與 Haken 在 1976 年的證明依賴電腦檢查數百種構型，令許多數學家不安。Georges Gonthier 與 Benjamin Werner 在 Coq 中把整個證明（連同計算）形式化。",
      ],
      [
        'After this, "a computer was involved" could mean *more* certainty, not less.',
        "從此，「用了電腦」可以代表 *更* 可靠，而不是更不可靠。",
      ],
    ],
    sources: [
      {
        label: "G. Gonthier, Formal Proof: The Four-Color Theorem, Notices AMS (2008)",
        url: "https://www.ams.org/notices/200811/tx081101382p.pdf",
      },
      { label: "Four color theorem (Wikipedia)", url: "https://en.wikipedia.org/wiki/Four_color_theorem" },
    ],
  },
  {
    id: "odd-order",
    era: "landmarks",
    year: "2012",
    image: {
      src: "history/odd-order.webp",
      alt: ["Walter Feit in 1970", "1970 年的 Walter Feit"],
      credit: "Konrad Jacobs · CC BY-SA 2.0 de · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Walter_Feit.jpg",
    },
    title: ["The odd order theorem", "奇數階定理"],
    body: [
      [
        "Feit and Thompson's 1963 theorem (every finite group of odd order is solvable) has a famously long proof. A team led by Gonthier finished checking it in Coq in 2012, after six years of work.",
        "Feit 與 Thompson 在 1963 年證明的定理（奇數階有限群都可解）以證明冗長聞名。Gonthier 領導的團隊花了六年，在 2012 年於 Coq 中完成驗證。",
      ],
      [
        "Much of the effort went into reusable library code, a lesson every later project, Mathlib included, learned again.",
        "大部分心力花在可重用的函式庫程式碼上；後來的每個專案（包括 Mathlib）都再次體會到這一點。",
      ],
    ],
    sources: [
      {
        label: "Gonthier et al., A Machine-Checked Proof of the Odd Order Theorem (ITP 2013)",
        url: "https://inria.hal.science/hal-00816699",
      },
      { label: "Feit–Thompson theorem (Wikipedia)", url: "https://en.wikipedia.org/wiki/Feit%E2%80%93Thompson_theorem" },
    ],
  },
  {
    id: "kepler",
    era: "landmarks",
    year: "2014",
    image: {
      src: "history/kepler.webp",
      alt: ["Cannonballs stacked in the face-centred cubic packing", "以面心立方方式堆疊的砲彈"],
      credit: "Greg L · CC BY-SA 3.0 · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Cannonball_stack_with_FCC_unit_cell.jpg",
    },
    title: ["Flyspeck: Kepler's conjecture", "Flyspeck：克卜勒猜想"],
    body: [
      [
        'Thomas Hales proved in 1998 that oranges stacked the greengrocer\'s way are the densest packing of spheres, but referees said they were only "99% certain". He then led **Flyspeck**, which finished a formal proof in HOL Light and Isabelle in August 2014.',
        "Thomas Hales 在 1998 年證明：水果攤堆橘子的方式就是最密的球堆積，但審稿人只說「99% 確定」。於是他領導 **Flyspeck** 專案，於 2014 年 8 月在 HOL Light 與 Isabelle 中完成形式證明。",
      ],
    ],
    sources: [
      {
        label: "Hales et al., A formal proof of the Kepler conjecture, Forum of Mathematics, Pi (2017)",
        url: "https://doi.org/10.1017/fmp.2017.1",
      },
      { label: "Kepler conjecture (Wikipedia)", url: "https://en.wikipedia.org/wiki/Kepler_conjecture" },
    ],
  },
  {
    id: "lean",
    era: "lean",
    year: "2013",
    image: {
      src: "history/lean.svg",
      alt: ["Lean's design: a small trusted kernel plus strong automation", "Lean 的設計：小而可信的核心，加上強大的自動化"],
      credit: "Drawing: Formalizer",
    },
    title: ["Lean is born", "Lean 誕生"],
    body: [
      [
        "Leonardo de Moura at Microsoft Research started **Lean**, aiming to join a small trusted kernel with strong automation. Lean 3 (2017) made it practical for mathematicians.",
        "微軟研究院的 Leonardo de Moura 創立了 **Lean**，目標是把小而可信的核心與強大的自動化結合。Lean 3（2017）讓數學家真正能用它。",
      ],
    ],
    sources: [
      { label: "Lean (proof assistant) (Wikipedia)", url: "https://en.wikipedia.org/wiki/Lean_(proof_assistant)" },
      { label: "lean-lang.org", url: "https://lean-lang.org/" },
    ],
  },
  {
    id: "mathlib",
    era: "lean",
    year: "2017",
    image: {
      src: "history/mathlib.svg",
      alt: [
        "mathlib as one connected library: areas of mathematics built on shared foundations",
        "mathlib 是一個相互連結的函式庫：各數學領域建立在共同的基礎上",
      ],
      credit: "Drawing: Formalizer",
    },
    title: ["mathlib: one library for everyone", "mathlib：大家共用的一個函式庫"],
    body: [
      [
        "Instead of each project proving its own basics, the Lean community built **one** library, **mathlib**, reviewed and kept consistent. It now covers much of an undergraduate degree and a lot of research mathematics.",
        "社群不再讓每個專案各自證明基礎，而是共同建立 **一個** 經審查、保持一致的函式庫 **mathlib**。如今它涵蓋了大部分大學數學課程與許多研究級數學。",
      ],
      [
        "Formalizer's problems all rest on it: `import Mathlib` brings in real numbers, Euclidean spaces, derivatives and much more.",
        "Formalizer 的題目都建立在它之上：`import Mathlib` 帶來實數、歐氏空間、導數等等。",
      ],
    ],
    sources: [
      { label: "The mathlib Community, The Lean Mathematical Library (CPP 2020)", url: "https://arxiv.org/abs/1910.09336" },
      { label: "Mathlib documentation", url: "https://leanprover-community.github.io/mathlib4_docs/" },
    ],
  },
  {
    id: "nng",
    era: "lean",
    year: "2019",
    image: {
      src: "history/nng.webp",
      alt: ["Kevin Buzzard in 2007", "2007 年的 Kevin Buzzard"],
      credit: "Paula Buzzard · CC BY-SA 3.0 · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Kevin_buzzard_in_2007.jpg",
    },
    title: ["The Natural Number Game", "自然數遊戲"],
    body: [
      [
        "Kevin Buzzard and Mohammad Pedramfar at Imperial College made a browser game: build the natural numbers from zero and successor, then prove addition and multiplication facts level by level. It drew many students and mathematicians into Lean.",
        "倫敦帝國學院的 Kevin Buzzard 與 Mohammad Pedramfar 做了一個瀏覽器遊戲：從零與後繼建構自然數，再一關一關證明加法與乘法的性質。它吸引了許多學生與數學家走進 Lean。",
      ],
    ],
    sources: [
      { label: "Natural Number Game", url: "https://adam.math.hhu.de/#/g/leanprover-community/nng4" },
      { label: "Xena project blog", url: "https://xenaproject.wordpress.com/" },
    ],
  },
  {
    id: "liquid-tensor",
    era: "lean",
    year: "2020–2022",
    image: {
      src: "history/liquid-tensor.webp",
      alt: ["Peter Scholze in 2014", "2014 年的 Peter Scholze"],
      credit: "George Bergman · CC BY-SA 4.0 · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Peter_Scholze_2014_cropped.jpg",
    },
    title: ["The Liquid Tensor Experiment", "液態張量實驗"],
    body: [
      [
        "In December 2020 Peter Scholze challenged the Lean community to check a theorem of his and Dustin Clausen's that even he wasn't sure of. A team led by Johan Commelin verified the key lemma by June 2021 and the whole main theorem in July 2022.",
        "2020 年 12 月，Peter Scholze 邀請 Lean 社群檢查他與 Dustin Clausen 的一個定理，連他本人都不完全確定。Johan Commelin 帶領的團隊在 2021 年 6 月驗證了關鍵引理，2022 年 7 月完成整個主定理。",
      ],
      [
        "It showed that formal proof could keep up with *current* research, not only with old textbook results.",
        "它證明了形式化可以跟上 *當代* 研究，而不只是驗證教科書裡的舊結果。",
      ],
    ],
    sources: [
      {
        label: "P. Scholze, Liquid Tensor Experiment (Xena blog, 2020)",
        url: "https://xenaproject.wordpress.com/2020/12/05/liquid-tensor-experiment/",
      },
      { label: "Liquid Tensor Experiment repository", url: "https://github.com/leanprover-community/liquid" },
    ],
  },
  {
    id: "lean4",
    era: "lean",
    year: "2021–2023",
    image: {
      src: "history/lean4.svg",
      alt: [
        "Lean 4: a program, a theorem and a tactic in the same file and language",
        "Lean 4：程式、定理與戰術寫在同一個檔案、同一種語言裡",
      ],
      credit: "Drawing: Formalizer",
    },
    title: ["Lean 4: a prover that is also a programming language", "Lean 4：同時是程式語言的證明器"],
    body: [
      [
        "Lean was rewritten as **Lean 4**, largely in Lean itself, so tactics, the editor support and ordinary programs are all written in the same language. Version 4.0.0 came out in September 2023.",
        "Lean 被重寫為 **Lean 4**，大部分用 Lean 自己寫成，戰術、編輯器支援與一般程式都用同一種語言。4.0.0 版於 2023 年 9 月發布。",
      ],
      [
        "In July 2023 the community finished porting the whole of mathlib to Lean 4 (**Mathlib**), and de Moura and Sebastian Ullrich founded the **Lean FRO** to develop Lean full time.",
        "2023 年 7 月，社群完成把整個 mathlib 移植到 Lean 4（**Mathlib**）；同時 de Moura 與 Sebastian Ullrich 成立了全職開發 Lean 的 **Lean FRO**。",
      ],
    ],
    sources: [
      { label: "Lean FRO", url: "https://lean-fro.org/" },
      { label: "Lean 4 releases", url: "https://github.com/leanprover/lean4/releases" },
    ],
  },
  {
    id: "pfr",
    era: "lean",
    year: "2023",
    image: {
      src: "history/pfr.webp",
      alt: ["Terence Tao in 2026", "2026 年的陶哲軒"],
      credit: "Institute for Pure & Applied Mathematics · CC BY 4.0 · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Terence_Tao_at_IPAM%27s_Fireside_Chat_2026_(50m16s)_(cropped).jpg",
    },
    title: ["PFR: a new theorem, formalized in three weeks", "PFR：新定理，三週形式化"],
    body: [
      [
        "In November 2023 Gowers, Green, Manners and Tao proved the polynomial Freiman–Ruzsa conjecture. A team coordinated by Terence Tao formalized the proof in Lean in about three weeks, splitting the work into small lemmas through a **blueprint** (a dependency graph of the proof).",
        "2023 年 11 月，Gowers、Green、Manners 與 Tao 證明了多項式 Freiman–Ruzsa 猜想。陶哲軒協調的團隊用約三週在 Lean 中完成形式化，並以 **藍圖（blueprint）**（證明的依賴圖）把工作切成許多小引理。",
      ],
      [
        "Formalizer's results page shows the same kind of graph for every proof you write.",
        "Formalizer 的結果頁也會為你寫的每個證明畫出同樣的依賴圖。",
      ],
    ],
    sources: [
      {
        label: "T. Tao, Formalizing the proof of PFR in Lean4 using Blueprint (2023)",
        url: "https://terrytao.wordpress.com/2023/11/18/formalizing-the-proof-of-pfr-in-lean4-using-blueprint-a-short-tour/",
      },
      { label: "PFR project", url: "https://github.com/teorth/pfr" },
    ],
  },
  {
    id: "flt",
    era: "lean",
    year: "2024",
    image: {
      src: "history/flt.webp",
      alt: ["Andrew Wiles in 1995", "1995 年的 Andrew Wiles"],
      credit: "Klaus Barner · CC BY-SA 3.0 · Wikimedia Commons",
      creditUrl: "https://commons.wikimedia.org/wiki/File:Andrew_Wiles,_Boston_1995.JPG",
    },
    title: ["Fermat's Last Theorem project", "費馬最後定理計畫"],
    body: [
      [
        "In October 2024 Kevin Buzzard began a five-year project, funded by the UK's EPSRC, to formalize the proof of Fermat's Last Theorem in Lean, reducing it to results known in the 1980s and then going further.",
        "2024 年 10 月，Kevin Buzzard 在英國 EPSRC 資助下展開為期五年的計畫，要在 Lean 中形式化費馬最後定理的證明：先化約到 1980 年代已知的結果，再繼續往下。",
      ],
    ],
    sources: [
      { label: "FLT project", url: "https://imperialcollegelondon.github.io/FLT/" },
      { label: "ImperialCollegeLondon/FLT", url: "https://github.com/ImperialCollegeLondon/FLT" },
    ],
  },
  {
    id: "etp",
    era: "lean",
    year: "2024–2025",
    image: {
      src: "history/etp.svg",
      alt: ["A corner of the implication table: which laws imply which", "蘊含表的一角：哪些定律蘊含哪些定律"],
      credit: "Drawing: Formalizer",
    },
    title: ["The Equational Theories Project", "等式理論計畫"],
    body: [
      [
        "Tao launched an open, crowdsourced project: for 4,694 simple laws of a binary operation, decide which laws imply which. All **22,028,942** implications were settled, by people and automated provers together, and every answer was checked in Lean.",
        "陶哲軒發起一個開放的群眾協作計畫：對二元運算的 4,694 條簡單定律，判斷哪條推得出哪條。全部 **22,028,942** 個蘊涵都由人與自動證明器合力解決，每個答案都在 Lean 中驗證。",
      ],
    ],
    sources: [
      { label: "The Equational Theories Project (arXiv 2512.07087)", url: "https://arxiv.org/abs/2512.07087" },
      { label: "equational_theories repository", url: "https://github.com/teorth/equational_theories" },
    ],
  },
  {
    id: "alphaproof",
    era: "ai",
    year: "2024",
    image: {
      src: "history/alphaproof.svg",
      alt: ["A search over Lean proof steps: one path is accepted by Lean", "在 Lean 證明步驟中搜尋：其中一條路徑被 Lean 接受"],
      credit: "Drawing: Formalizer",
    },
    title: ["AlphaProof: olympiad proofs in Lean", "AlphaProof：以 Lean 寫的奧數證明"],
    body: [
      [
        "Google DeepMind's **AlphaProof** solved problems from the 2024 International Mathematical Olympiad by searching for proofs in Lean; with AlphaGeometry 2 it reached a silver-medal score. Because the proofs were in Lean, they could be checked without trusting the model.",
        "Google DeepMind 的 **AlphaProof** 以在 Lean 中搜尋證明的方式解出 2024 年國際數學奧林匹亞的題目；搭配 AlphaGeometry 2，達到銀牌分數。因為證明是 Lean 寫的，不必相信模型也能檢查。",
      ],
    ],
    sources: [
      {
        label: "Google DeepMind: AI achieves silver-medal standard solving IMO problems (2024)",
        url: "https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/",
      },
    ],
  },
  {
    id: "formal-conjectures",
    era: "ai",
    year: "2025",
    image: {
      src: "history/formal-conjectures.svg",
      alt: ["Open problems stated in Lean, each still ending in sorry", "以 Lean 陳述的未解問題，每一個都還以 sorry 結尾"],
      credit: "Drawing: Formalizer",
    },
    title: ["Formal Conjectures: open problems, stated in Lean", "Formal Conjectures：以 Lean 寫下的未解問題"],
    body: [
      [
        "Google DeepMind's **Formal Conjectures** repository collects open problems (including the Clay Millennium problems) written as precise Lean statements. A fixed statement is what makes a later proof checkable: its Navier–Stokes statement is the one Formalizer's flagship problem uses.",
        "Google DeepMind 的 **Formal Conjectures** 倉庫收集了以精確 Lean 陳述寫下的未解問題（包括克雷千禧年問題）。固定的陳述讓日後的證明可以被檢查：Formalizer 旗艦題的 Navier–Stokes 陳述正是出自這裡。",
      ],
    ],
    sources: [
      { label: "Formal Conjectures", url: "https://google-deepmind.github.io/formal-conjectures/" },
      {
        label: "Navier–Stokes statement (Formal Conjectures)",
        url: "https://github.com/google-deepmind/formal-conjectures/blob/8bf45ed70d48b2b2a501de9c00b26bfa38c573ee/FormalConjectures/Millenium/NavierStokes.lean",
      },
    ],
  },
  {
    id: "imo-2025",
    era: "ai",
    year: "2025",
    image: {
      src: "history/imo-2025.svg",
      alt: ["IMO 2025: Lean proofs for five of the six problems", "IMO 2025：六題中有五題有 Lean 證明"],
      credit: "Drawing: Formalizer",
    },
    title: ["IMO 2025: gold-medal level, with formal proofs", "IMO 2025：金牌水準，並有形式證明"],
    body: [
      [
        "Several AI systems reached gold-medal level at the 2025 olympiad. Harmonic's **Aristotle** and ByteDance's **Seed-Prover** did so with Lean proofs, which anyone can recheck; Aristotle's covered five of the six problems.",
        "在 2025 年的奧林匹亞中，多個 AI 系統達到金牌水準。Harmonic 的 **Aristotle** 與字節跳動的 **Seed-Prover** 附上了任何人都能重新檢查的 Lean 證明；Aristotle 的證明涵蓋六題中的五題。",
      ],
    ],
    sources: [
      { label: "Harmonic: Aristotle achieves gold medal-level performance at the IMO", url: "https://www.harmonic.fun/news/imo-ios/" },
      { label: "Aristotle: IMO-level automated theorem proving (arXiv 2510.01346)", url: "https://arxiv.org/abs/2510.01346" },
    ],
  },
  {
    id: "comparator",
    era: "ai",
    year: "2025–2026",
    image: {
      src: "history/comparator.svg",
      alt: [
        "Comparator's three checks inside a sandbox: same statement, standard axioms, a second kernel",
        "Comparator 在沙盒中的三項檢查：相同陳述、標準公理、第二個核心",
      ],
      credit: "Drawing: Formalizer",
    },
    title: ["Comparator: checking a proof you didn't write", "Comparator：檢查不是你寫的證明"],
    body: [
      [
        "When a model writes thousands of lines of Lean, nobody wants to read them all. The Lean FRO's **Comparator** checks only what matters: the solution proves *exactly* the fixed challenge statement, uses only the standard axioms (`propext`, `Quot.sound`, `Classical.choice`), and passes a second, independent kernel (nanoda), all inside a sandbox.",
        "當模型寫出數千行 Lean，沒人想全部讀完。Lean FRO 的 **Comparator** 只檢查重點：解答證明的 *正是* 固定的挑戰陳述、只用標準公理（`propext`、`Quot.sound`、`Classical.choice`），並通過第二個獨立核心（nanoda），全部在沙盒中進行。",
      ],
      [
        "This is how Formalizer grades every problem: the statement is the test, the kernel is the grader.",
        "Formalizer 也這樣批改每一題：陳述就是測試，核心就是閱卷人。",
      ],
    ],
    sources: [{ label: "leanprover/comparator", url: "https://github.com/leanprover/comparator" }],
  },
  {
    id: "openai-2026",
    era: "ai",
    year: "2026",
    image: {
      src: "history/openai-2026.svg",
      alt: ["A velocity field, and the Lean statement certified for Navier–Stokes", "一個速度場，以及為 Navier–Stokes 認證的 Lean 陳述"],
      credit: "Drawing: Formalizer",
    },
    title: ["Lean certificates for Navier–Stokes and Euler", "Navier–Stokes 與 Euler 的 Lean 證書"],
    body: [
      [
        "OpenAI published Lean certificates accompanying results on the Navier–Stokes and Euler equations, set up as Comparator challenges against the Formal Conjectures statement, together with a larger collection of research manuscripts, about 42% of whose top-line results are formalized in Lean.",
        "OpenAI 發布了關於 Navier–Stokes 與 Euler 方程結果的 Lean 證書，並以 Formal Conjectures 的陳述設成 Comparator 挑戰；同時發布了更大的研究手稿集，其中約 42% 的主要結果已在 Lean 中形式化。",
      ],
      [
        "Anyone can run the checks; what the results mean for mathematics is for the mathematical community to judge. Formalizer's flagship problem lets you read the statement and run the checker yourself.",
        "任何人都可以自己執行檢查；這些結果對數學的意義，則交由數學界評斷。Formalizer 的旗艦題讓你讀懂陳述、親手執行檢查。",
      ],
    ],
    sources: [
      { label: "openai/NavierStokesAndEuler", url: "https://github.com/openai/NavierStokesAndEuler" },
      { label: "openai/math", url: "https://github.com/openai/math" },
    ],
  },
];
