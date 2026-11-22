/**
 * Concept ▸ six views (#/concept/views[/<section>]): "What if AI proved it?", after 3Blue1Brown's video of mathematicians
 * answering "What if AI solved the Riemann Hypothesis?" (https://www.youtube.com/watch?v=zqzk43bSdDI, 22 Nov 2026).
 * A honeycomb: the question in the centre, one hexagon per view; a hexagon zooms (FLIP: transform + clip-path from
 * the hexagon to the card) into a card with a larger picture, the arguments and quotes linked to their second in the
 * video. Reduced motion: a fade. Then the video itself, and where this site stands next to the mainstream view.
 * Quotes are verbatim from the video's automatic captions (… marks a cut). Speakers are named from the video's own
 * on-screen name cards, each quote checked by face at its second; their photos are freely licensed ones from Wikimedia
 * Commons (public/views/CREDITS.md), never frames of the video.
 * The grouping into six views is ours. Facts about the Riemann claim are as of 22 November 2026.
 */
import { RichText, useLang } from "@learnkit/web";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Callout, Figure, List, P, Page, SCROLL, Section, SiteLink, Sources, type L, type SectionInfo } from "../kit";
import { TwoPillars } from "./MethodFigures";
import { HarrisPoints, TwoLayers } from "./ScepticFigures";
import { CollabFig, ExplainerFig, FIG_CSS, HumourFig, UnderstandFig, ValuesFig, VerifyFig } from "./ViewsFigures";

const PAGE = "views";
const VIDEO = "zqzk43bSdDI";

const SECTIONS: SectionInfo[] = [
  { id: "video", title: ["A fulfilled prophecy", "應驗的預言"] },
  { id: "honeycomb", title: ["Six views on a proof nobody can read", "沒人讀得懂的證明：六種觀點"] },
  { id: "sceptic", title: ["The sceptic's case: Michael Harris", "懷疑者的論點：Michael Harris"] },
  { id: "two-problems", title: ["Two different problems", "兩道不同的題"] },
  { id: "stance", title: ["Where Formalizer stands", "Formalizer 的立場"] },
];

interface Photo {
  src: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** the Commons file page */
  file: string;
}

interface Person {
  name: L;
  /** as on the video's name card */
  title: L;
  /** shorter, next to a quote */
  short: L;
  /** "Interview Recorded" on the name card: [year, month] */
  recorded: [number, number];
  /** a note after the date, e.g. where the interview comes from */
  note?: L;
  photo?: Photo;
}

const CC_BY_SA_3 = "https://creativecommons.org/licenses/by-sa/3.0/";
const CC_BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const CC_BY_4 = "https://creativecommons.org/licenses/by/4.0/";
const COMMONS = "https://commons.wikimedia.org/wiki/File:";

/** The people quoted, named as on the video's own name cards. Photos: Wikimedia Commons only (public/views/CREDITS.md). */
const PEOPLE = {
  buzzard: {
    name: ["Kevin Buzzard", "Kevin Buzzard"],
    title: ["Professor, Imperial College London", "倫敦帝國學院教授"],
    short: ["Imperial College London", "倫敦帝國學院"],
    recorded: [2025, 6],
    photo: { src: "views/buzzard.webp", author: "Paula Buzzard", licence: "CC BY-SA 3.0", licenceUrl: CC_BY_SA_3, file: `${COMMONS}Kevin_buzzard_in_2007.jpg` },
  },
  ono: {
    name: ["Ken Ono", "Ken Ono"],
    title: ["Founding Mathematician, Axiom; University of Virginia", "Axiom 創始數學家；維吉尼亞大學"],
    short: ["Axiom; University of Virginia", "Axiom；維吉尼亞大學"],
    recorded: [2025, 8],
    photo: { src: "views/ono.webp", author: "AllenS", licence: "Public domain", licenceUrl: "https://commons.wikimedia.org/wiki/Template:PD-self", file: `${COMMONS}Ken_Ono_Washington_2009.jpg` },
  },
  glazer: {
    name: ["Elliot Glazer", "Elliot Glazer"],
    title: ["Lead Mathematician, FrontierMath Benchmark", "FrontierMath 基準首席數學家"],
    short: ["FrontierMath", "FrontierMath"],
    recorded: [2025, 8],
  },
  ellenberg: {
    name: ["Jordan Ellenberg", "Jordan Ellenberg"],
    title: ["Vilas Distinguished Professor, University of Wisconsin–Madison", "威斯康辛大學麥迪遜分校 Vilas 傑出教授"],
    short: ["University of Wisconsin–Madison", "威斯康辛大學麥迪遜分校"],
    recorded: [2026, 10],
    photo: { src: "views/ellenberg.webp", author: "Mats Rudels / Jordan Ellenberg", licence: "CC BY-SA 4.0", licenceUrl: CC_BY_SA_4, file: `${COMMONS}Jordan_Ellenberg.jpg` },
  },
  deMoura: {
    name: ["Leo de Moura", "Leo de Moura"],
    title: ["Creator of Lean", "Lean 的創造者"],
    short: ["creator of Lean", "Lean 的創造者"],
    recorded: [2026, 5],
    photo: { src: "views/de-moura.webp", author: "David Monniaux", licence: "CC BY-SA 4.0", licenceUrl: CC_BY_SA_4, file: `${COMMONS}Leo_de_Moura_P1210629.jpg` },
  },
  patel: {
    name: ["Dwarkesh Patel", "Dwarkesh Patel"],
    title: ["From Dwarkesh Patel's podcast, used with his permission", "取自 Dwarkesh Patel 的 Podcast，經他同意使用"],
    short: ["podcast host", "Podcast 主持人"],
    recorded: [2026, 3],
    photo: { src: "views/patel.webp", author: "TechCrunch", licence: "CC BY 4.0", licenceUrl: CC_BY_4, file: `${COMMONS}Dwarkesh_Patel_2025_(cropped).jpg` },
  },
  tao: {
    name: ["Terence Tao", "陶哲軒"],
    title: ["Professor, UCLA", "加州大學洛杉磯分校（UCLA）教授"],
    short: ["UCLA", "UCLA"],
    recorded: [2026, 3],
    note: ["on Dwarkesh Patel's podcast", "Dwarkesh Patel 的 Podcast"],
    photo: {
      src: "views/tao.webp",
      author: "Institute for Pure & Applied Mathematics",
      licence: "CC BY 4.0",
      licenceUrl: CC_BY_4,
      file: `${COMMONS}Terence_Tao_at_IPAM%27s_Fireside_Chat_2026_(50m16s)_(cropped).jpg`,
    },
  },
  litt: {
    name: ["Daniel Litt", "Daniel Litt"],
    title: ["Assistant Professor, University of Toronto", "多倫多大學助理教授"],
    short: ["University of Toronto", "多倫多大學"],
    recorded: [2025, 8],
  },
  brown: {
    name: ["Adam Brown", "Adam Brown"],
    title: ["Science Lead, Google DeepMind; Stanford University", "Google DeepMind 科學負責人；史丹佛大學"],
    short: ["Google DeepMind; Stanford", "Google DeepMind；史丹佛大學"],
    recorded: [2026, 5],
  },
  kontorovich: {
    name: ["Alex Kontorovich", "Alex Kontorovich"],
    title: ["Distinguished Professor, Rutgers University", "羅格斯大學傑出教授"],
    short: ["Rutgers University", "羅格斯大學"],
    recorded: [2025, 8],
    photo: {
      src: "views/kontorovich.webp",
      author: "Katrin Schmid",
      licence: "CC BY-SA 2.0 de",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/de/deed.en",
      file: `${COMMONS}Kontorovich_2011.jpg`,
    },
  },
  schmitt: {
    name: ["Johannes Schmitt", "Johannes Schmitt"],
    title: ["Assistant Professor, Stanford University", "史丹佛大學助理教授"],
    short: ["Stanford University", "史丹佛大學"],
    recorded: [2025, 8],
  },
  moitra: {
    name: ["Ankur Moitra", "Ankur Moitra"],
    title: ["Professor, MIT", "麻省理工學院（MIT）教授"],
    short: ["MIT", "MIT"],
    recorded: [2026, 9],
  },
  lichtman: {
    name: ["Jared Duker Lichtman", "Jared Duker Lichtman"],
    title: ["Szegő Assistant Professor, Stanford University", "史丹佛大學 Szegő 助理教授"],
    short: ["Stanford University", "史丹佛大學"],
    recorded: [2026, 5],
  },
} satisfies Record<string, Person>;

type Who = keyof typeof PEOPLE;

interface Quote {
  /** seconds into the video */
  t: number;
  /** the speaker, checked by face at this second against the video's name cards */
  by: Who;
  /** when this speaker has more than one interview: the one quoted, [year, month] */
  recorded?: [number, number];
  /** verbatim from the captions */
  en: string;
  /** a translation */
  zh: string;
}

interface View {
  title: L;
  stance: L;
  Fig: ComponentType<{ detail?: boolean }>;
  /** tint of the hexagon and the card, border colour, accent text */
  tint: string;
  edge: string;
  ink: string;
  points: L[];
  quotes: Quote[];
  /** the interviewer who asked the question these quotes answer */
  asker?: { by: Who; t: number };
  link?: { to: [string, string?, string?]; label: L };
}

const VIEWS: View[] = [
  {
    title: ["Verify first, then take it apart", "先驗證，再拆解"],
    stance: ["Check it with independent kernels; then people study it piece by piece.", "先用幾個獨立的核心驗過；然後大家一塊一塊研究它。"],
    Fig: VerifyFig,
    tint: "bg-teal-50",
    edge: "bg-teal-400",
    ink: "text-teal-800",
    points: [
      [
        "Start from a **curated statement**: a Lean statement of the Riemann hypothesis that people have read and agreed on before any proof arrives. Then the proof goes through the gates: does the statement say what we mean, does the code compile, does it prove *that* statement with only the usual axioms (`lake comparator`), and does it lean on a bug in one kernel (check again with two or three independent kernels).",
        "從一個 **大家審過的陳述** 出發：在任何證明出現之前，就已經有人讀過、同意過的黎曼猜想 Lean 陳述。接著證明要通過幾道關卡：陳述說的是不是我們的意思、程式能不能編譯、它是否只用一般的公理證出 *那個* 陳述（`lake comparator`），以及它有沒有利用某一個核心的 bug（再用兩三個獨立的核心檢查）。",
      ],
      [
        "Passing is where the work starts, not where it ends. \"A proof is not static\", says Leo de Moura, the creator of Lean: with high confidence that it is correct, people would invest the time to break it apart, isolate fragments, rewrite them and understand them.",
        "通過檢查是工作的開始，不是結束。Lean 的創造者 Leo de Moura 說「證明不是靜止的」：一旦很有把握它是對的，大家就會願意花時間把它拆開、抽出片段、重寫、弄懂。",
      ],
      [
        "And it would matter at once, as Ken Ono points out: hundreds, if not thousands, of papers are written assuming the Riemann hypothesis, so a checked proof turns their conditional results into results.",
        "而且影響立刻就有，Ken Ono 指出：成百上千篇論文都假設黎曼猜想成立，所以一份檢查過的證明，會讓那些有條件的結果變成無條件的結果。",
      ],
    ],
    quotes: [
      {
        t: 143,
        by: "deMoura",
        en: "First good news. We have a curated statement of the Riemann hypothesis. So the first thing we would do is run the comparator … Suppose the comparator says, yes, this is a proof for the Riemann hypothesis, and I checked it with two, three different kernels. They all agree. This is amazing.",
        zh: "第一個好消息：我們有一個審訂過的黎曼猜想陳述。所以我們第一件事就是跑比對器（comparator）……假設比對器說：是的，這是黎曼猜想的證明，而我又用兩三個不同的核心檢查過，它們全部一致。那就太驚人了。",
      },
      {
        t: 169,
        by: "deMoura",
        en: "Like I said, a proof is not static. … people would invest a lot of time trying to understand these objects. If they have high confidence that the proof is correct, they will spend time trying to understand it.",
        zh: "就像我說的，證明不是靜止的。……大家會投入很多時間去理解這些東西。只要他們很有把握這個證明是對的，就會花時間去理解它。",
      },
      {
        t: 40,
        by: "ono",
        en: "Hundreds, if not thousands of papers are written assuming the Riemann hypothesis is true. And that's a brand new toolkit.",
        zh: "就算沒有上千篇，也有好幾百篇論文是假設黎曼猜想成立而寫的。那就是一整套全新的工具。",
      },
    ],
    link: { to: ["concept", "checkers"], label: ["The checkers: comparator and independent kernels", "檢查器：比對器與獨立核心"] },
  },
  {
    title: ["AI as a superhuman explainer", "AI 當超人解說員"],
    stance: ["The machines that write unreadable proofs may also explain them.", "寫出看不懂證明的機器，也可能把它講清楚。"],
    Fig: ExplainerFig,
    tint: "bg-violet-50",
    edge: "bg-violet-400",
    ink: "text-violet-800",
    points: [
      [
        "Proving and understanding have travelled together through the history of mathematics. Now, says Adam Brown, they may arrive separately: \"scrolls of ancient wisdom\" that tell us *that* something is true, not *why*.",
        "在數學史上，證明與理解一向一起出現。Adam Brown 說，現在它們可能分開抵達：「古老智慧的卷軸」只告訴我們某件事 *成立*，卻不說 *為什麼*。",
      ],
      [
        "Daniel Litt separates two cases. If the proof is *intrinsically* beyond us (reading it would take more than a lifetime), it adds little: confidence in the Riemann hypothesis goes from 99.9% to 100%. If it is merely *poorly exposited*, that is a huge deal: many would drop everything to translate it into something human-readable.",
        "Daniel Litt 分成兩種情況。如果證明 *本質上* 超出人的能力（讀完要花超過一輩子），它帶來的不多：對黎曼猜想的信心從 99.9% 變成 100%。如果它只是 *寫得很糟*，那就是大事：很多人會放下手邊一切，把它翻譯成人讀得懂的東西。",
      ],
      [
        "And the translators need not be only human. The hope: models that are superhuman at producing proofs will also be superhuman at explaining them. Brown, a professional physicist, already uses them as a patient, non-judgmental tutor for things he \"should know but doesn't\".",
        "而翻譯的人不一定只有人類。期待是：在產生證明上超越人類的模型，在解釋證明上也會超越人類。身為職業物理學家的 Brown，已經把它們當成有耐心、不評判的家教，問那些他「應該知道卻不知道」的事。",
      ],
    ],
    quotes: [
      {
        t: 402,
        by: "brown",
        en: "we have a notion that it's useful to understand something and typically in the history of mathematics those two things have gone together and now we're the state where they may come separately, where we may receive scrolls of ancient wisdom, that we may receive like, you know, notes from the Gods telling us that things are true without really being very clear at all on why they're true.",
        zh: "我們認為理解一件事是有用的，而在數學史上，這兩件事（證明與理解）通常一起出現；現在我們到了它們可能分開來的階段：我們可能收到古老智慧的卷軸，收到來自眾神的筆記，告訴我們哪些事是真的，卻完全說不清楚為什麼是真的。",
      },
      {
        t: 352,
        by: "litt",
        en: "Raising that confidence from, you know, 99% or 99.9% to 100% is a little bit of information. Would it like change my life as a mathematician? Not super much.",
        zh: "把信心從 99% 或 99.9% 提高到 100%，是一點點資訊。它會改變我身為數學家的生活嗎？不太會。",
      },
      {
        t: 363,
        by: "litt",
        en: "On the other hand, if you're in this weaker situation where the AI produces like lean proof that's like poorly exposited or not exposited like but not intrinsically impossible to understand, that would be a huge deal, right?",
        zh: "另一方面，如果是比較弱的情況：AI 產生的 Lean 證明寫得很糟、或根本沒有說明，但本質上並不是不可能理解，那就是大事了，對吧？",
      },
      {
        t: 448,
        by: "brown",
        en: "These things, as well as being superhuman provers, will also be superhuman explainers.",
        zh: "這些東西除了是超人般的證明者，也會是超人般的解說者。",
      },
      {
        t: 459,
        by: "brown",
        en: "I'm a professional physicist and there are things that I sort of should know but don't. … I can ask these large language models and they very non-judgmentally and patiently explain all of these things that I should know to me",
        zh: "我是職業物理學家，有些事我算是應該知道卻不知道。……我可以問這些大型語言模型，它們會毫不評判、很有耐心地把這些我該知道的事講給我聽。",
      },
    ],
  },
  {
    title: ["Understanding is the point", "理解才是重點"],
    stance: ["A proof nobody can read settles a fact; it does not give understanding.", "沒人讀得懂的證明確定了一個事實，卻沒有帶來理解。"],
    Fig: UnderstandFig,
    tint: "bg-rose-50",
    edge: "bg-rose-400",
    ink: "text-rose-800",
    points: [
      [
        "Ken Ono's answer, as a self-described romantic: a machine proof would be \"horrible\". A human should be involved, the proof should be beautiful, and the search for a beautiful conceptual proof would be no less important afterwards.",
        "Ken Ono 自稱數學上的浪漫派，他的回答是：機器證明會很「可怕」。應該要有人參與，證明應該是美的；就算有了機器證明，尋找一個美而有概念的證明也一點都不會變得比較不重要。",
      ],
      [
        "Jordan Ellenberg's sharper version: a 20-billion-token Lean proof that nobody can read \"is not a proof of the Riemann hypothesis\" in the sense that matters. Not dangerous, just not the thing wanted; the big problem would shift to understanding that stream, or to finding the proof some other way. Alex Kontorovich: \"Tell me. I have to understand.\"",
        "Jordan Ellenberg 的版本更尖銳：一份 200 億個 token、沒人讀得懂的 Lean 證明，在真正重要的意義上「不是黎曼猜想的證明」。不危險，只是不是大家要的東西；大問題會變成去理解那串文字，或是用別的方法找到證明。Alex Kontorovich：「告訴我。我必須理解。」",
      ],
      [
        "Why insist on rigorous proof at all, then? Kontorovich again: because intuition has burned us: fake proofs of 1 = 0, mistakes in Euclid's *Elements*. Proof is the mechanism for *checking* understanding; it is not understanding itself, which may live in a picture. (The picture here: the odd numbers 1, 3, 5, 7 fit together into a 4 × 4 square.)",
        "那為什麼還要堅持嚴謹的證明？Kontorovich 接著說：因為直覺讓我們吃過虧：1 = 0 的假證明、歐幾里得《幾何原本》裡的錯誤。證明是 *檢查* 理解的機制，但它本身不是理解；理解可能在一張圖裡。（這裡的圖：奇數 1、3、5、7 拼成一個 4 × 4 的正方形。）",
      ],
    ],
    quotes: [
      {
        t: 53,
        by: "ono",
        en: "As a romantic in terms of mathematics, what you describe would be horrible. I would want a human being involved in the proof and I'd like to believe that the proof is beautiful",
        zh: "以數學上的浪漫派來說，你描述的情況會很可怕。我會希望證明裡有人參與，我也想相信證明是美的。",
      },
      {
        t: 91,
        by: "ellenberg",
        en: "if there's a lean proof of the Riemann hypothesis that's like, you know, 20 billion tokens long and nobody can read it, that's not a proof of the Riemann hypothesis and I just don't care that that exists. … So I wouldn't consider that dangerous.",
        zh: "如果有一份黎曼猜想的 Lean 證明，長達 200 億個 token，而且沒人讀得懂，那就不是黎曼猜想的證明，我也根本不在乎它存在。……所以我不會覺得那很危險。",
      },
      {
        t: 508,
        by: "kontorovich",
        en: "So if an AI system spits out, you know, a million token proof of the Riemann hypothesis and says, I got it, I don't go, yay, okay, let's move on. I go, what's the answer? How do you do it? Tell me. I have to understand.",
        zh: "所以如果一個 AI 系統吐出一份一百萬個 token 的黎曼猜想證明，說：我搞定了；我不會說：耶，好，下一個。我會說：答案是什麼？你怎麼做到的？告訴我。我必須理解。",
      },
      {
        t: 548,
        by: "kontorovich",
        en: "is because we've been burned so long on intuitive arguments. And you probably know a thousand different, you know, fake proofs of 1=0 and mistakes in Euclid's Elements.",
        zh: "（證明之所以成為我們認識真理的機制，）是因為我們長久以來被直覺式的論證害過。你大概知道上千種 1=0 的假證明，還有歐幾里得《幾何原本》裡的錯誤。",
      },
      {
        t: 575,
        by: "kontorovich",
        en: "we need to have rigorous proof within an axiomatic system as a mechanism for checking our understanding. But that's not understanding itself. You know, you can understand a proof in a picture. … But the understanding happens somewhere else.",
        zh: "我們需要在公理系統裡的嚴謹證明，作為檢查我們理解的機制。但那不是理解本身。你可以在一張圖裡理解一個證明。……理解發生在別的地方。",
      },
    ],
  },
  {
    title: ["Dark humour and metamathematics", "黑色幽默與後設數學"],
    stance: ["A billion lines of “let A be this function…” would be funny, and fascinating.", "十億行「令 A 為這個函數……」會很好笑，也很迷人。"],
    Fig: HumourFig,
    tint: "bg-amber-50",
    edge: "bg-amber-400",
    ink: "text-amber-800",
    points: [
      [
        "Kevin Buzzard pictures the button: a billion-line proof that only says *let A be this function, let B be this function, let C be this number*, pages and pages with no word on why any of them is used. Absurd enough to be funny.",
        "Kevin Buzzard 想像那個按鈕：一份十億行的證明，只寫著 *令 A 為這個函數、令 B 為這個函數、令 C 為這個數*，一頁又一頁，完全不說為什麼要用它們。荒謬到好笑。",
      ],
      [
        "Elliot Glazer, a logician who works in metamathematics, takes \"a very sick enjoyment\" in the idea. Metamathematics treats proofs themselves as mathematical objects, so an inscrutable but valid proof is something to study from the outside: how long it is, how it is built, what it depends on.",
        "研究後設數學的邏輯學家 Elliot Glazer，對這個想法有「一種病態的樂趣」。後設數學把證明本身當成數學對象，所以一份難以理解但有效的證明，正好可以從外面研究：它有多長、怎麼搭起來、依賴什麼。",
      ],
      [
        "Lean already reads a proof from the outside in small ways: `#print axioms` lists what a theorem depends on without anyone reading the proof.",
        "Lean 已經能用一些小方法從外面讀證明：`#print axioms` 不需要任何人讀證明，就能列出一個定理依賴哪些公理。",
      ],
    ],
    quotes: [
      {
        t: 12,
        by: "buzzard",
        en: "Tee hee! That's a great question! Because it appeals to my sense of humor, that idea, that a computer just, you press a button and you get this billion line long proof of the Riemann hypothesis",
        zh: "嘻嘻！好問題！因為它很對我的幽默感：那個想法，電腦就這樣，你按一個按鈕，就得到一份十億行長的黎曼猜想證明。",
      },
      {
        t: 24,
        by: "buzzard",
        en: "it's just like, let A be this function, let B be this function, let C be this number, let D be this function. It's just like pages and pages but like no explanation of why any of these things are being used. … That would be funny.",
        zh: "它就像是：令 A 為這個函數，令 B 為這個函數，令 C 為這個數，令 D 為這個函數。一頁又一頁，卻完全不解釋為什麼要用這些東西。……那會很好笑。",
      },
      {
        t: 73,
        by: "glazer",
        en: "Well, I personally would get like a very sick enjoyment out of that. I'm a logician whose research tends to be in metamathematics, so I find the idea of inscrutable proofs like kind of a fascinating concept.",
        zh: "嗯，我個人會從中得到一種很病態的樂趣。我是邏輯學家，研究多半在後設數學，所以我覺得「難以理解的證明」這個想法很迷人。",
      },
    ],
  },
  {
    title: ["Brute force, or working together", "暴力窮舉，還是一起合作"],
    stance: ["Some theorems fall to cases; this one likely needs new mathematics, made together.", "有些定理靠窮舉拿下；這一個大概需要新的數學，一起做出來。"],
    Fig: CollabFig,
    tint: "bg-sky-50",
    edge: "bg-sky-400",
    ink: "text-sky-800",
    asker: { by: "patel", t: 195 },
    points: [
      [
        "Terence Tao, asked by Dwarkesh Patel on his podcast: some problems have been solved by brute force; the four colour theorem was split into a great many cases, each checked by computer, and there is still no conceptually elegant proof. Some problems may only be solvable that way.",
        "陶哲軒在 Dwarkesh Patel 的 Podcast 上回答：有些問題是靠暴力解決的；四色定理被拆成非常多種情況，每一種都交給電腦檢查，至今仍沒有概念上優雅的證明。有些問題也許只能這樣解。",
      ],
      [
        "The Riemann hypothesis is prized because people expect it to need a new kind of mathematics, or a new connection between areas never linked before. It does not feel like a case check. (One exception: if it were false, one computed zero off the critical line would settle it, which would be \"very disappointing\".)",
        "黎曼猜想之所以珍貴，是因為大家預期它需要一種新的數學，或在從未相連的領域之間找到新的連結。它不像是可以靠逐一檢查情況解決的問題。（例外：如果它是錯的，算出一個不在臨界線上的零點就能定案，那會「非常令人失望」。）",
      ],
      [
        "So, not a fully autonomous one-shot system, but smart humans assisted by very powerful AI tools, perhaps in a kind of collaboration that does not exist yet.",
        "所以不是一次到位、完全自主的系統，而是聰明的人加上非常強大的 AI 工具，也許是一種現在還不存在的合作方式。",
      ],
    ],
    quotes: [
      {
        t: 226,
        by: "tao",
        en: "I mean, some problems have been basically solved by pure brute force. The four color theorem is a famous example. We have still not found a conceptually elegant proof of this theorem.",
        zh: "有些問題基本上是靠純粹的暴力解決的。四色定理就是著名的例子。我們至今還沒找到這個定理在概念上優雅的證明。",
      },
      {
        t: 254,
        by: "tao",
        en: "a new type of mathematics has to be created or a new connection between two previously unconnected areas of mathematics has to be discovered",
        zh: "必須創造出一種新的數學，或是在兩個先前毫無關聯的數學領域之間發現新的連結。",
      },
      {
        t: 277,
        by: "tao",
        en: "I mean, it could be false actually. … there is an unlikely scenario that the hypothesis is false and that you can just compute, oh, here's a zero off the line and a massive computer calculation verifies it. That would be very disappointing.",
        zh: "其實它也可能是錯的。……有一個不太可能的情境：猜想是錯的，你只要算出「喏，這裡有一個不在線上的零點」，再由大規模的電腦計算驗證。那會非常令人失望。",
      },
      {
        t: 291,
        by: "tao",
        en: "I do feel that fully autonomous one-shot approaches are not the right approach.",
        zh: "我確實覺得，完全自主、一次到位的做法不是正確的做法。",
      },
      {
        t: 305,
        by: "tao",
        en: "I can see one of these problems being solved by smart humans assisted by some extremely powerful AI tools, but the exact dynamic may be very different from what we envision right now. I mean, it could be a collaboration of a type that just doesn't exist yet.",
        zh: "我可以想像這類問題之一，由聰明的人在極強大的 AI 工具協助下解決，但確切的互動方式可能和我們現在想像的很不一樣。它可能是一種現在還不存在的合作。",
      },
    ],
  },
  {
    title: ["Values, safety, the long view", "價值、安全與長遠"],
    stance: ["Cheer the models on, watch their alignment, and expect new problems, not an end.", "為模型加油、留意它們是否對齊，並預期新問題而非終點。"],
    Fig: ValuesFig,
    tint: "bg-indigo-50",
    edge: "bg-indigo-400",
    ink: "text-indigo-800",
    points: [
      [
        "Johannes Schmitt is cheering them on, against early scepticism: wait and see, give them a few more months. But if progress is very fast, will the models keep acting in our best interest? Capable models have been caught lying. (For a proof, the kernel catches a lie in the proof; the statement and the checkers still have to be trusted, which is why the first view starts there.)",
        "Johannes Schmitt 為它們加油，也反對太早下結論的懷疑：再等等看，再給它們幾個月。但如果進展非常快，這些模型會一直以我們的最大利益行事嗎？能力很強的模型已經被抓到說謊。（對證明來說，證明裡的謊話會被核心抓到；但陳述和檢查器本身仍然必須可信，所以第一種觀點從那裡開始。）",
      ],
      [
        "Ankur Moitra: when something becomes cheap, what we value moves in an orthogonal direction. Certain kinds of problem solving will become cheaper and be valued a little less; landmark problems may still survive.",
        "Ankur Moitra：當某樣東西變便宜，我們珍視的東西就會往正交的方向移動。某些類型的解題會變便宜、比較不被看重；里程碑式的問題也許仍會留下來。",
      ],
      [
        "AlphaGo's move 37 against Lee Sedol (2016) was the moment a machine played what top humans would not. The mathematical equivalent might be a machine proof of the Riemann hypothesis or another millennium problem, or a deep theory that synthesises different fields in one sweep (Jared Duker Lichtman). And a solution is not an end, says Ken Ono: what we learn from it generates new problems.",
        "AlphaGo 在 2016 年對李世乭下出的第 37 手，是機器下出頂尖人類不會下的一步的時刻。數學的對應，可能是機器證明黎曼猜想或其他千禧年難題，或是一套一舉整合不同領域的深刻理論（Jared Duker Lichtman）。而 Ken Ono 說，解答不是終點：從中學到的東西會產生新的問題。",
      ],
    ],
    quotes: [
      {
        t: 600,
        by: "schmitt",
        en: "On the one hand, I am kind of excited to see what these models can really do. And I think I'm certainly, I'm kind of cheering on them.",
        zh: "一方面，我很期待看看這些模型到底能做到什麼。我確實有點在為它們加油。",
      },
      {
        t: 631,
        by: "schmitt",
        en: "On the other hand, I am somewhat concerned about kind of if this progress is actually extremely fast. Then there's all these questions, will these models really continue to act in our best interest or will they kind of start to veer off, do some misaligned things? Because we already see that many of the most capable models like O3, for example, was a very notorious liar.",
        zh: "另一方面，如果進展真的極快，我有點擔心。那就會有一堆問題：這些模型會繼續以我們的最大利益行事，還是會開始偏離、做出一些沒對齊的事？因為我們已經看到，許多最強的模型，例如 o3，就是出了名的愛說謊。",
      },
      {
        t: 659,
        by: "moitra",
        en: "Historically, when something becomes cheap or commoditized in society, the things we value become orthogonalized",
        zh: "從歷史上看，當社會上某樣東西變得便宜或商品化，我們珍視的東西就會變得與之正交。",
      },
      {
        t: 688,
        by: "moitra",
        en: "And it does seem to me that certain types of problem solving are going to become cheaper. … So maybe these amazing landmark problems will all still survive, who knows?",
        zh: "在我看來，某些類型的解題確實會變得更便宜。……所以也許這些了不起的里程碑問題都還會留下來，誰知道呢？",
      },
      {
        t: 750,
        by: "lichtman",
        en: "a theory that really synthesizes all these different fields in one fell swoop. I would consider that to be maybe a move 37 for mathematics.",
        zh: "一套真正一舉整合所有這些不同領域的理論。我會認為那也許就是數學的「第 37 手」。",
      },
      {
        t: 757,
        by: "ono", recorded: [2026, 6],
        en: "Every time that a theorem or open problem is solved, to be good mathematics, the solution isn't the end. … what we learn from solved problems will be used to generate new problems and new conjectures and the pursuit of knowledge about integers and primes will go on.",
        zh: "每當一個定理或開放問題被解決，要算是好的數學，解答就不是終點。……我們從解決的問題中學到的，會被用來產生新問題、新猜想，而對整數與質數的知識追求會繼續下去。",
      },
    ],
  },
];

const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
/** the same six points spread to a rectangle, so clip-path can interpolate between the two */
const RECT6 = "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%, 0% 0%)";
const ZOOM_MS = 420;

const PAGE_CSS = `
.fzv-hex { clip-path: ${HEX}; transition: transform .2s ease; }
.fzv-hexwrap:has(:focus-visible) { filter: drop-shadow(0 0 3px var(--lk-accent, #0d9488)) drop-shadow(0 0 3px var(--lk-accent, #0d9488)); }
@media (hover: hover) and (prefers-reduced-motion: no-preference) { .fzv-hex:hover { transform: scale(1.035); } }
${FIG_CSS}`;

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const mmss = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

/** Width of an element, kept current. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Where the seven hexagons go (pointy-top, centre first). Wide: the centre with a ring of six. Narrow: a zig-zag
 * column, so every hexagon keeps room for its text.
 */
function layout(W: number) {
  const gap = 8;
  if (W >= 620) {
    const w = Math.min(250, (W - 2 * gap) / 3);
    const h = (w * 2) / Math.sqrt(3);
    const dx = w + gap;
    const dy = 0.75 * h + gap * 0.87;
    const cx = W / 2 - w / 2;
    // ring clockwise from the top left
    const ring = [
      [-0.5, -1],
      [0.5, -1],
      [1, 0],
      [0.5, 1],
      [-0.5, 1],
      [-1, 0],
    ];
    const pos = [[cx, dy], ...ring.map(([i, j]) => [cx + i * dx, dy + j * dy])];
    return { w, h, height: h + 2 * dy, pos };
  }
  const w = Math.min(260, (W - gap / 2) / 1.5);
  const h = (w * 2) / Math.sqrt(3);
  const dy = 0.75 * h + gap * 0.87;
  const left = (W - (w + (w + gap) / 2)) / 2;
  const pos = Array.from({ length: 7 }, (_, k) => [left + (k % 2 ? (w + gap) / 2 : 0), k * dy]);
  return { w, h, height: h + 6 * dy, pos };
}

function Honeycomb({ onOpen, open, hexRefs }: { onOpen: (i: number) => void; open: number | null; hexRefs: RefObject<(HTMLButtonElement | null)[]> }) {
  const { pick } = useLang();
  const [ref, W] = useWidth();
  const lay = layout(Math.max(W, 260));
  const small = lay.w < 210;
  return (
    <div ref={ref} className="relative w-full" style={{ height: W ? lay.height : 600 }} data-testid="views-honeycomb">
      {W > 0 && (
        <>
          <div
            className="absolute flex flex-col items-center justify-center bg-gray-900 text-center"
            style={{ left: lay.pos[0][0], top: lay.pos[0][1], width: lay.w, height: lay.h, clipPath: HEX, paddingInline: lay.w * 0.1 }}
          >
            <p className="text-xs font-medium tracking-wide text-teal-300 uppercase">{pick(["The question", "問題"])}</p>
            {/* the question grows with its hexagon: about 8.5% of the width, 14–24px */}
            <p
              className="mt-1.5 font-semibold leading-snug text-white"
              style={{ fontSize: Math.round(Math.min(24, Math.max(small ? 13 : 14, lay.w * 0.085))) }}
            >
              {pick(["A 17-million-line proof nobody can read: is it a proof?", "一份 1700 萬行、沒人讀得懂的證明：算是證明嗎？"])}
            </p>
            <p className="mt-2 text-xs leading-snug text-gray-300">{pick(["Six views from mathematicians", "數學家的六種觀點"])}</p>
          </div>
          {VIEWS.map((v, i) => {
            const [x, y] = lay.pos[i + 1];
            return (
              <div key={i} className="fzv-hexwrap absolute" style={{ left: x, top: y, width: lay.w, height: lay.h, visibility: open === i ? "hidden" : undefined }}>
                <button
                  ref={(el) => {
                    hexRefs.current[i] = el;
                  }}
                  onClick={() => onOpen(i)}
                  aria-haspopup="dialog"
                  className={`fzv-hex relative block h-full w-full cursor-pointer ${v.edge}`}
                  data-testid="views-hex"
                >
                  <span className={`fzv-hex absolute inset-[2px] flex flex-col items-center justify-center px-[13%] text-center ${v.tint}`}>
                    <span className={small ? "h-[52px] w-[92px]" : "h-[64px] w-[114px]"}>
                      <v.Fig />
                    </span>
                    <span className={`mt-1 font-semibold leading-tight ${v.ink} ${small ? "text-[12.5px]" : "text-[13.5px]"}`}>
                      <span className="mr-1 opacity-60">{i + 1}</span>
                      {pick(v.title)}
                    </span>
                    <span className={`mt-1 leading-snug text-gray-600 ${small ? "text-[10.5px]" : "text-[11.5px]"}`}>{pick(v.stance)}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/** "▶ 2:23": opens the video at that second. */
function TimeLink({ t }: { t: number }) {
  const { pick } = useLang();
  return (
    <a
      href={`https://www.youtube.com/watch?v=${VIDEO}&t=${t}s`}
      target="_blank"
      rel="noreferrer"
      className="font-medium whitespace-nowrap text-(--lk-accent) hover:underline"
      aria-label={pick([`Watch at ${mmss(t)} on YouTube (new tab)`, `在 YouTube 從 ${mmss(t)} 開始看（新分頁）`])}
    >
      ▶ {mmss(t)}
    </a>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function QuoteBlock({ q, edge }: { q: Quote; edge: string }) {
  const { pick, index } = useLang();
  const zh = index === 1;
  const who: Person = PEOPLE[q.by];
  return (
    <blockquote className="relative rounded-r-md bg-white/80 py-2 pr-3 pl-4">
      <span className={`absolute inset-y-0 left-0 w-1 rounded-full ${edge}`} aria-hidden />
      <p className="text-[13.5px] leading-relaxed text-gray-800">“{zh ? q.zh : q.en}”</p>
      {zh && <p className="mt-1 text-[11.5px] leading-snug text-gray-500 italic">原文：“{q.en}”</p>}
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-gray-500">
        <span>
          — <span className="font-medium text-gray-700">{pick(who.name)}</span>
          {zh ? "，" : ", "}
          {pick(who.short)}
        </span>
        <TimeLink t={q.t} />
      </p>
    </blockquote>
  );
}

/** A round photo from Wikimedia Commons, or the initials on a teal circle. */
function Avatar({ p }: { p: Person }) {
  const { pick } = useLang();
  const cls = "h-12 w-12 shrink-0 rounded-full";
  if (p.photo)
    return (
      <img
        src={`${import.meta.env.BASE_URL}${p.photo.src}`}
        alt={pick(p.name)}
        title={`${p.photo.author} · ${p.photo.licence} · Wikimedia Commons`}
        width={48}
        height={48}
        loading="lazy"
        className={`${cls} bg-gray-200 object-cover`}
      />
    );
  const words = p.name[0].split(" ");
  const initials = words[0][0] + words[words.length - 1][0];
  return (
    <span className={`${cls} flex items-center justify-center bg-teal-600 text-sm font-semibold text-white`} aria-hidden>
      {initials}
    </span>
  );
}

/** "Who said it": each speaker quoted in a card (and the interviewer who asked), with the seconds they are quoted at. */
function WhoSaidIt({ v }: { v: View }) {
  const { pick, index } = useLang();
  const zh = index === 1;
  const rows: { by: Who; rec: [number, number]; ts: number[]; asks?: boolean }[] = [];
  for (const q of v.quotes) {
    const rec = q.recorded ?? PEOPLE[q.by].recorded;
    const row = rows.find((r) => r.by === q.by && r.rec[0] === rec[0] && r.rec[1] === rec[1]);
    if (row) row.ts.push(q.t);
    else rows.push({ by: q.by, rec, ts: [q.t] });
  }
  if (v.asker) rows.unshift({ by: v.asker.by, rec: PEOPLE[v.asker.by].recorded, ts: [v.asker.t], asks: true });
  return (
    <>
      <h4 className="mt-5 text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Who said it", "說話的人"])}</h4>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2" data-testid="views-who">
        {rows.map((r) => {
          const p: Person = PEOPLE[r.by];
          const [y, m] = r.rec;
          return (
            <li key={`${r.by}-${y}-${m}`} className="flex min-w-0 gap-3 rounded-lg bg-white/70 p-2.5">
              <Avatar p={p} />
              <div className="min-w-0 flex-1 text-[12px] leading-snug text-gray-600">
                <p className="text-[13px] font-semibold text-gray-900">
                  {pick(p.name)}
                  {r.asks && (
                    <span className="ml-1.5 rounded bg-gray-200 px-1.5 py-px align-[1px] text-[10.5px] font-medium text-gray-600">{pick(["asks", "提問"])}</span>
                  )}
                </p>
                <p>{pick(p.title)}</p>
                <p className="text-gray-500">
                  {zh ? `訪談錄於 ${y} 年 ${m} 月` : `Interview recorded ${MONTHS[m - 1]} ${y}`}
                  {p.note && (zh ? `（${p.note[1]}）` : `, ${p.note[0]}`)}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-2">
                  {r.ts.map((t) => (
                    <TimeLink key={t} t={t} />
                  ))}
                </p>
                {p.photo && (
                  <p className="mt-0.5 text-[10.5px] text-gray-400">
                    {pick(["Photo: ", "照片："])}
                    <a href={p.photo.file} target="_blank" rel="noreferrer" className="hover:underline">
                      {p.photo.author}
                    </a>
                    {" · "}
                    <a href={p.photo.licenceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {p.photo.licence}
                    </a>
                    {" · "}
                    <a href={p.photo.file} target="_blank" rel="noreferrer" className="hover:underline">
                      Wikimedia Commons
                    </a>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** The zoomed card: FLIP from the hexagon's box to the card's, clip-path from hexagon to rectangle; a fade with reduced motion. */
function ViewCard({ index, hex, onStep, onClosed }: { index: number; hex: () => HTMLElement | null; onStep: (d: number) => void; onClosed: () => void }) {
  const { pick } = useLang();
  const v = VIEWS[index];
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  // open: from the hexagon to here
  useLayoutEffect(() => {
    const card = cardRef.current!;
    const body = bodyRef.current!;
    const back = backRef.current!;
    const from = hex()?.getBoundingClientRect();
    const to = card.getBoundingClientRect();
    back.style.opacity = "0";
    if (reducedMotion() || !from) {
      card.style.opacity = "0";
      void card.offsetWidth;
      card.style.transition = back.style.transition = "opacity 200ms ease";
      card.style.opacity = back.style.opacity = "1";
    } else {
      card.style.transformOrigin = "0 0";
      card.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
      card.style.clipPath = HEX;
      body.style.opacity = "0";
      void card.offsetWidth;
      card.style.transition = `transform ${ZOOM_MS}ms cubic-bezier(.2,.8,.2,1), clip-path ${ZOOM_MS}ms cubic-bezier(.2,.8,.2,1)`;
      back.style.transition = `opacity ${ZOOM_MS}ms ease`;
      body.style.transition = `opacity 220ms ease ${ZOOM_MS - 120}ms`;
      card.style.transform = "none";
      card.style.clipPath = RECT6;
      back.style.opacity = body.style.opacity = "1";
      const t = window.setTimeout(() => {
        card.style.clipPath = "";
        card.style.transition = "";
      }, ZOOM_MS + 20);
      closeRef.current?.focus({ preventScroll: true });
      return () => window.clearTimeout(t);
    }
    closeRef.current?.focus({ preventScroll: true });
    // the zoom plays once, on open; stepping to the next view swaps the content in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const card = cardRef.current!;
    const body = bodyRef.current!;
    const back = backRef.current!;
    const target = hex()?.getBoundingClientRect();
    if (reducedMotion() || !target) {
      card.style.transition = back.style.transition = "opacity 180ms ease";
      card.style.opacity = back.style.opacity = "0";
      window.setTimeout(onClosed, 190);
      return;
    }
    const to = card.getBoundingClientRect();
    body.style.transition = "opacity 120ms ease";
    body.style.opacity = "0";
    card.style.transformOrigin = "0 0";
    card.style.clipPath = RECT6;
    void card.offsetWidth;
    card.style.transition = `transform ${ZOOM_MS - 60}ms cubic-bezier(.4,0,.2,1) 80ms, clip-path ${ZOOM_MS - 60}ms cubic-bezier(.4,0,.2,1) 80ms`;
    back.style.transition = `opacity ${ZOOM_MS}ms ease`;
    card.style.transform = `translate(${target.left - to.left}px, ${target.top - to.top}px) scale(${target.width / to.width}, ${target.height / to.height})`;
    card.style.clipPath = HEX;
    back.style.opacity = "0";
    window.setTimeout(onClosed, ZOOM_MS + 40);
  }, [hex, onClosed]);

  // Esc closes; Tab stays inside the card
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab" && cardRef.current) {
        const f = [...cardRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!cardRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close]);

  // keep the page still underneath
  useEffect(() => {
    const el = document.getElementById(SCROLL);
    if (!el) return;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = prev;
    };
  }, []);

  // stepping to another view: back to the top of the card
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [index]);

  const titleId = `views-card-title`;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div ref={backRef} className="absolute inset-0 bg-gray-900/45" onClick={close} aria-hidden data-testid="views-backdrop" />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl ${v.tint}`}
        data-testid="views-card"
      >
        <div ref={bodyRef} className="max-h-[88vh] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${v.edge}`}>{index + 1}</span>
            <div className="min-w-0 flex-1">
              <h3 id={titleId} className={`text-xl font-semibold ${v.ink}`}>
                {pick(v.title)}
              </h3>
              <p className="mt-0.5 text-sm text-gray-600">{pick(v.stance)}</p>
            </div>
            <button
              ref={closeRef}
              onClick={close}
              className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-white hover:text-gray-900"
              aria-label={pick(["Close (Esc)", "關閉（Esc）"])}
              data-testid="views-close"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex justify-center rounded-xl bg-white p-3">
            <v.Fig detail />
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
            {v.points.map((p, k) => (
              <p key={k}>
                <RichText text={pick(p)} />
              </p>
            ))}
            {v.link && (
              <p>
                <SiteLink to={v.link.to} label={v.link.label} />
              </p>
            )}
          </div>
          <h4 className="mt-5 text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["The mathematicians' words", "數學家的原話"])}</h4>
          <div className="mt-2 space-y-2">
            {v.quotes.map((q) => (
              <QuoteBlock key={q.t} q={q} edge={v.edge} />
            ))}
          </div>
          <WhoSaidIt v={v} />
          <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
            <button onClick={() => onStep(-1)} className="rounded-md px-2 py-1 text-gray-600 hover:bg-white hover:text-gray-900">
              ← {pick(VIEWS[(index + 5) % 6].title)}
            </button>
            <button onClick={() => onStep(1)} className="rounded-md px-2 py-1 text-right text-gray-600 hover:bg-white hover:text-gray-900">
              {pick(VIEWS[(index + 1) % 6].title)} →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ViewsConcept({ section }: { section: string | null }) {
  const { pick } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const hexRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openRef = useRef<number | null>(null);
  openRef.current = open;
  const hex = useCallback(() => (openRef.current === null ? null : hexRefs.current[openRef.current]), []);
  const returnTo = useRef<number | null>(null);
  const onClosed = useCallback(() => {
    returnTo.current = openRef.current;
    setOpen(null);
  }, []);
  // focus goes back to the hexagon once it is visible again
  useEffect(() => {
    if (open === null && returnTo.current !== null) {
      hexRefs.current[returnTo.current]?.focus({ preventScroll: true });
      returnTo.current = null;
    }
  }, [open]);
  return (
    <Page
      id={PAGE}
      sections={SECTIONS}
      focus={section}
      title={["What if AI proved it? Six views from mathematicians", "如果是 AI 證明的呢？數學家的六種觀點"]}
      intro={[
        "Is a proof nobody can read still a proof? On 20 November 2026 that stopped being a thought experiment: a claimed Lean proof of the Riemann hypothesis, 17,374,215 lines made with Claude, still under review as of 22 November 2026. This page gathers what mathematicians say: the interviews, six views, the sceptic's case, and where Formalizer stands.",
        "一份沒人讀得懂的證明，還算證明嗎？2026 年 11 月 20 日，這不再只是思想實驗：一份宣稱的黎曼猜想 Lean 證明，共 17,374,215 行，與 Claude 合作完成，截至 2026 年 11 月 22 日仍在審查中。本頁整理數學家怎麼看：訪談、六種觀點、懷疑者的論點，以及 Formalizer 的立場。",
      ]}
    >
      <style>{PAGE_CSS}</style>
      <Section page={PAGE} id="video" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "Since last year, the YouTube channel 3Blue1Brown has been asking mathematicians one question: what if an AI proved the Riemann hypothesis and nobody could read the proof? Their answers range from \"verify it, then take it apart\" to \"understanding is the whole point\". Asked as a hypothetical, the question became real on 20 November 2026.",
            "從去年起，YouTube 頻道 3Blue1Brown 就在問數學家同一個問題：如果 AI 證明了黎曼猜想，卻沒有人讀得懂這份證明，會怎樣？回答從「先驗證，再拆開來讀」到「理解才是重點」都有。當初問的是假設，2026 年 11 月 20 日這個問題成真了。",
          ]}
        />
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO}`}
            title="3Blue1Brown: Since last year, we asked: 'What if AI solved the Riemann Hypothesis?'"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <p className="text-xs text-gray-500">
          {pick([
            "Video: 3Blue1Brown, “Since last year, we asked: ‘What if AI solved the Riemann Hypothesis?’” (22 November 2026, 13:38). All rights with 3Blue1Brown; embedded from YouTube.",
            "影片：3Blue1Brown，〈Since last year, we asked: ‘What if AI solved the Riemann Hypothesis?’〉（2026 年 11 月 22 日，13:38）。版權屬於 3Blue1Brown；由 YouTube 嵌入。",
          ])}{" "}
          <a href={`https://www.youtube.com/watch?v=${VIDEO}`} target="_blank" rel="noreferrer" className="text-(--lk-accent) hover:underline">
            {pick(["Watch on YouTube", "在 YouTube 觀看"])} ↗
          </a>
        </p>
      </Section>

      <Section page={PAGE} id="honeycomb" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "The answers fall into six views; the grouping is ours.",
            "這些回答可以分成六種觀點，分類是我們的整理。",
          ]}
        />
        <Honeycomb onOpen={setOpen} open={open} hexRefs={hexRefs} />
        {open !== null && <ViewCard key="card" index={open} hex={hex} onStep={(d) => setOpen((i) => (i === null ? i : (i + d + 6) % 6))} onClosed={onClosed} />}
      </Section>

      <Section page={PAGE} id="sceptic" n={3} title={SECTIONS[2].title}>
        <P
          t={[
            "Michael Harris, a number theorist at Columbia, follows formalisation closely in his newsletter *Silicon Reckoner*. His objection is not that it cannot be done; it is about what mathematics is for, what it values, and who decides. Four points, in his words where we quote him:",
            "Michael Harris 是哥倫比亞大學的數論學家，在他的電子報 *Silicon Reckoner* 裡密切關注形式化的發展。他的反對不是「做不到」，而是關於數學是為了什麼、重視什麼，以及由誰決定。以下四點，凡加引號的都是他的原話（中文為本站翻譯）：",
          ]}
        />
        <Figure
          caption={[
            "Harris's four objections. The details and the sources are below.",
            "Harris 的四個反對意見。細節與出處見下方。",
          ]}
        >
          <HarrisPoints />
        </Figure>
        <List
          items={[
            [
              "**1. Proofs are turned into understanding.** In a talk of January 2021 he wrote that “the goal of mathematics is to convert rigorous proofs to heuristics”, which are then used to produce new proofs; a proof like Wiles's is “the point of departure for an open-ended dialogue”. Making type-theoretic details explicit enough for Lean, he suggested, “could be the aesthetic equivalent of the Centre Pompidou's exposed services”: the Paris museum that wears its pipes and ducts on the outside.",
              "**1. 證明要轉化成理解。** 他在 2021 年 1 月的一場演講中寫道：「數學的目標是把嚴格的證明轉化成啟發式的理解」，再用它們產生新的證明；像 Wiles 那樣的證明，是「一場開放式對話的起點」。他認為，把型別論的細節寫得明確到 Lean 讀得懂，「可能就是美學上的龐畢度中心外露管線」：那座巴黎美術館把管線和風管都裝在建築外面。",
            ],
            [
              "**2. Lock-in.** The same talk asks whether machine verification will soon be seen “not only as convenient or useful but even obligatory”. He points to what Jaron Lanier calls “lock-in”: a definition chosen in one proof assistant (he called Lean “a Microsoft product”; it is now developed by the non-profit Lean FRO) may conflict with the choice made in another. In our words: if one system becomes the only accepted standard, *what it will accept* can start to steer which definitions mathematicians choose.",
              "**2. 鎖定效應。** 同一場演講問：機器驗證會不會很快被看成「不只是方便或有用，甚至是強制的」。他引用 Jaron Lanier 所說的「鎖定」（lock-in）：在一個證明助理裡選定的定義（他當時稱 Lean 為「微軟的產品」；Lean 現在由非營利的 Lean FRO 開發），可能和另一個證明助理的選擇互相衝突。用我們的話說：如果某一個系統成了唯一被接受的標準，*它肯接受什麼*，就可能開始左右數學家選擇怎樣的定義。",
            ],
            [
              "**3. Proof without understanding.** He raised the concern that “no one other than the author and the machine” will need to “understand” a proof, and asked whether that will matter. For him mathematics is “a way of being human”. In our words: a proof that a machine certifies but nobody reads drops out of the shared conversation and becomes an answer from a black box.",
              "**3. 沒有理解的證明。** 他擔心，除了「作者和機器」以外，將沒有人需要「理解」一個證明，並問這是否要緊。對他來說，數學是「身為人的一種方式」。用我們的話說：一個由機器認證、卻沒有人讀的證明，會脫離人與人共同的對話，變成黑盒子給出的答案。",
            ],
            [
              "**4. Who pays, who decides.** In *Silicon Reckoner, one year later* (July 2022) he argues that “the future of mathematics is a political question”, that the NSF “has been actively nudging even prominent specialists in the direction of mechanization”, and that “the power-wielders' plans for mathematics and ours are probably not perfectly aligned”. His 2021 talk lists, among the needs of mathematics: “Resist concentration of wealth and power.” In our words: models, compute and software owned by a few companies would move that power away from universities.",
              "**4. 誰出錢，誰決定。** 他在〈Silicon Reckoner, one year later〉（2022 年 7 月）中主張：「數學的未來是一個政治問題」；美國國家科學基金會（NSF）「一直在積極推動，連知名的專家都被推向機械化」；而「掌權者對數學的計畫，和我們的計畫大概並不完全一致」。他 2021 年的演講把「抵抗財富與權力的集中」列為數學的需要之一。用我們的話說：模型、算力和軟體若握在少數公司手裡，這份權力就會離開大學。",
            ],
          ]}
        />
        <Sources
          items={[
            {
              label: "M. Harris, Should human beings be permitted to practice mathematics unaccompanied? (talk, 28 Jan 2021)",
              url: "https://www.math.columbia.edu/~harris/website/content/11-links/should-human-beings-be-permitted-to-practice-mathematics-unaccompanied.pdf",
            },
            { label: "M. Harris, Silicon Reckoner, one year later (26 Jul 2022)", url: "https://siliconreckoner.substack.com/p/silicon-reckoner-one-year-later" },
            { label: "M. Harris, Silicon Reckoner (newsletter)", url: "https://siliconreckoner.substack.com/" },
          ]}
        />
      </Section>

      <Section page={PAGE} id="two-problems" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "This site reads the debate as two different problems, and thinks each side is right about one of them. That reading is ours, not a consensus, and Harris may well not share it.",
            "本站把這場辯論讀成兩道不同的題，並認為雙方各自答對了其中一道。這是我們的解讀，不是共識，Harris 本人也未必同意。",
          ]}
        />
        <Figure
          caption={[
            "Two floors of one building. The verification layer is the Lean proof, the understanding layer is the natural-language proof: the two pillars of the next section, and the two languages of one proof.",
            "同一棟建築的兩層樓。驗證層是 Lean 證明，理解層是自然語言證明：也就是下一節的兩根柱子，以及同一個證明的兩種語言。",
          ]}
        >
          <TwoLayers />
        </Figure>
        <List
          items={[
            [
              "**Scale: Buzzard and Voevodsky are right.** Natural language and peer review work well for a short paper, and strain on proofs of hundreds of pages. A flaw in Voevodsky's 1989 paper with Kapranov was confirmed only about fifteen years later. Mochizuki's claimed proof of the abc conjecture (2012) has been disputed since 2018, when Scholze and Stix reported what Stix called a “serious, unfixable gap” and Mochizuki answered that they had misunderstood his work. Years of expert reading had not settled it: the two sides did not reach agreement (Quanta, September 2018).",
              "**規模：Buzzard 和 Voevodsky 說得對。** 自然語言加同儕審查，對一篇短論文很有效，但面對幾百頁的證明就力不從心。Voevodsky 與 Kapranov 1989 年論文中的一個錯誤，大約十五年後才被確認。望月新一宣稱的 abc 猜想證明（2012）自 2018 年起就有爭議：Scholze 與 Stix 指出一個被 Stix 稱為「嚴重、無法修補的漏洞」，望月則回應說他們誤解了他的工作。專家讀了好幾年仍無定論：雙方沒有達成共識（Quanta，2018 年 9 月）。",
            ],
            [
              "**Capture and understanding: Harris is right.** Verification is the floor, not the goal. If nobody distils the machine's structure back into heuristics a person can use, the knowledge is only half alive; and if the floor belongs to a few firms, so does the building.",
              "**被掌控與理解：Harris 說得對。** 驗證是地板，不是目標。如果沒有人把機器找到的結構提煉回人用得上的直覺，這份知識就只活了一半；而如果地板屬於少數公司，整棟建築也就屬於它們。",
            ],
            [
              "**The way out, as this site sees it: separate the two layers.** A *verification layer*, the Lean proof, guarded by open Lean, independent kernels and shared compute, ends the referee's blind spots. On top of it, an *understanding layer*, the natural-language proof: mathematicians, freed from checking line by line, ask new questions, design better abstractions, and distil what the machine found back into intuition. AI translates between the floors.",
              "**本站看到的出路：把兩層分開。** *驗證層* 是 Lean 證明，由開放的 Lean、獨立的核心與共享的算力守住邏輯基礎，讓審稿人的盲點不再存在。上面是 *理解層*，也就是自然語言證明：數學家不必再逐行檢查，可以去問新的問題、設計更好的抽象，並把機器找到的東西提煉回直覺。AI 在兩層之間翻譯。",
            ],
          ]}
        />
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <SiteLink to={["concept", "method", "two-languages"]} label={["One proof, two languages", "一個證明，兩種語言"]} />
          <SiteLink to={["concept", "checkers"]} label={["Independent kernels: the checkers", "獨立的核心：檢查器"]} />
        </p>
        <Sources
          items={[
            { label: "St Andrews MacTutor: Voevodsky obituary (Princeton)", url: "https://mathshistory.st-andrews.ac.uk/Obituaries/Voevodsky_Princeton/" },
            { label: "V. Voevodsky, The Origins and Motivations of Univalent Foundations (IAS, 2014)", url: "https://www.ias.edu/ideas/2014/voevodsky-origins" },
            {
              label: "E. Klarreich, Titans of Mathematics Clash Over Epic Proof of ABC Conjecture (Quanta, 20 Sep 2018)",
              url: "https://www.quantamagazine.org/titans-of-mathematics-clash-over-epic-proof-of-abc-conjecture-20180920/",
            },
          ]}
        />
      </Section>

      <Section page={PAGE} id="stance" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            "In this site's position, which is not a consensus, a complete proof rests on two pillars, a natural-language proof and a Lean proof. Take one away and see what happens.",
            "依本站的立場（不是共識），一個完整的證明立在兩根柱子上，自然語言證明與 Lean 證明。拿掉其中一根，看看會怎樣。",
          ]}
        />
        <Figure
          caption={[
            "Two pillars under one roof. The buttons remove a pillar; the beams between the pillars are the step-by-step links. The examples are dated: as of 22 November 2026.",
            "一個屋頂，兩根柱子。按鈕可以拿掉一根柱子；柱子之間的橫樑是一步一步的對應。例子都標了日期：截至 2026 年 11 月 22 日。",
          ]}
        >
          <TwoPillars />
        </Figure>
        <P
          t={[
            "**The accepted standard.** In mathematics today a result counts as proved when a proof written in natural language has been checked by experts, usually through peer review and publication. Most working mathematicians do not formalise their work, and some prominent ones, Michael Harris among them, are openly sceptical of the push to formalise. Others lean the other way: Kevin Buzzard leads the project to formalise Fermat's Last Theorem in Lean, and Vladimir Voevodsky turned to machine-checked proofs after finding errors in his own published work.",
            "**公認的標準。** 在今天的數學界，一個結果要算被證明，是看一份以自然語言寫成的證明是否經過專家檢查，通常是透過同儕審查與發表。大多數在職數學家並不把自己的工作形式化，也有一些知名數學家（例如 Michael Harris）公開質疑形式化的推動。也有人站在另一邊：Kevin Buzzard 主持用 Lean 形式化費馬最後定理的計畫，Vladimir Voevodsky 則是在自己發表的論文裡發現錯誤後，轉向機器檢查的證明。",
          ]}
        />
        <Callout kind="tip" title={["This site's position (not a consensus)", "本站的立場（不是共識）"]}>
          <P
            t={[
              "Today, a result needs **both** a natural-language proof **and** a machine-checked (Lean) proof; either alone is incomplete. A natural-language proof alone can hide a mistake that the referees miss. A Lean proof alone can prove a statement that says something else than intended (in Lean, `(1 : ℕ) / 2 = 0`), and, as the third view puts it, it checks understanding without giving it.",
              "今天，一個結果需要 **同時** 有自然語言證明 **和** 機器檢查過的（Lean）證明；只有其中一個都不完整。只有自然語言證明，可能藏著審稿人沒抓到的錯誤。只有 Lean 證明，可能證出一個和原意不同的陳述（在 Lean 裡 `(1 : ℕ) / 2 = 0`），而且就像第三種觀點說的，它檢查理解，卻不給出理解。",
            ]}
          />
          <P
            t={[
              "We call this **one proof, two languages**: the natural-language proof and the Lean proof are mirrors, linked step by step, and the proof is the linked pair, not either stream alone. AI's job is to translate between them, in either direction.",
              "我們稱之為 **一個證明，兩種語言**：自然語言證明和 Lean 證明互為鏡像，一步一步相連；證明是這一對連起來的整體，而不是其中任何一條。AI 的工作是在兩者之間翻譯，哪個方向都可以。",
            ]}
          />
          <SiteLink to={["concept", "method", "two-languages"]} label={["One proof, two languages, as a picture", "一個證明，兩種語言：看圖"]} />
        </Callout>
        <P
          t={[
            "**As of 22 November 2026**, the news shows each half without the other. The Riemann-hypothesis claim announced on 20 November (Levent Alpöge, with Claude) is a Lean-only proof; its independent re-check is still building, and Terence Tao lists it as the least \"digested\" of three recent results. The same day Ravi Vakil announced Alessandro Maria Masullo's proposed proof of GRH, \"all human, with no AI\"; within hours, people reported problems in it, found with the help of AI models. Neither is accepted today.",
            "**截至 2026 年 11 月 22 日**，新聞剛好讓兩半各自出現。11 月 20 日宣布的黎曼猜想宣稱（Levent Alpöge 與 Claude 合作）是只有 Lean 的證明；獨立重驗仍在建置中，Terence Tao 把它列為最近三個結果中「消化」程度最低的一個。同一天，Ravi Vakil 公布了 Alessandro Maria Masullo 提出的 GRH 證明，「完全由人完成，沒有 AI」；幾小時內就有人回報其中的問題，而這些問題是在 AI 模型協助下找到的。兩者目前都尚未被接受。",
          ]}
        />
        <List
          items={[
            [
              "Formalizer teaches both halves: write the argument so a person can follow it, and check it in Lean so nobody has to trust it.",
              "Formalizer 兩半都教：把論證寫到人看得懂，再用 Lean 檢查，讓誰都不必只憑信任。",
            ],
          ]}
        />
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <SiteLink to={["concept", "rh"]} label={["The Riemann case: AI + human, step by step", "黎曼案例：AI + 人，一步一步看"]} />
          <SiteLink to={["concept", "checkers"]} label={["The checkers", "檢查器"]} />
        </p>
        <Sources
          items={[
            { label: "3Blue1Brown, “Since last year, we asked: ‘What if AI solved the Riemann Hypothesis?’” (22 Nov 2026)", url: `https://www.youtube.com/watch?v=${VIDEO}` },
            { label: "Kevin Buzzard, “…and the proof is checked in Lean” (Xena, 12 Nov 2026)", url: "https://xenaproject.wordpress.com/2026/11/12/and-the-proof-is-checked-in-lean/" },
            { label: "leanprover-community/riemann-hypothesis (the re-check)", url: "https://github.com/leanprover-community/riemann-hypothesis" },
            {
              label: "Terence Tao, Euler, Navier–Stokes and the generalized Riemann hypothesis (20 Nov 2026)",
              url: "https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/",
            },
            { label: "Ravi Vakil, announcement of Masullo's proposed proof of GRH (20 Nov 2026)", url: "https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/" },
          ]}
        />
      </Section>
    </Page>
  );
}
