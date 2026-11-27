/**
 * Concept ▸ AI + human: the Riemann case (#/concept/rh[/<section>]). The architecture of a proof made by people and AI
 * together, and its limits, with the November 2026 Riemann hypothesis claim as the case study: what RH says (a picture),
 * the pipeline (question → curated statement → AI search → machine gates → digestion → understanding), the mirror case
 * of the same day (Masullo's all-human GRH proposal), and where the site stands next to the mainstream view (a timeline).
 * Fast-moving facts are dated (22 November 2026; the shorter rewrite and the state of Masullo's formalization: 27
 * November 2026, when those sources were fetched). Pictures: RhFigures.tsx.
 */
import { RelatedProblems, RichText, useLang } from "@learnkit/web";
import { lazy, Suspense } from "react";
import { CardTabs } from "./CardTabs";
import {
  Callout,
  Figure,
  List,
  P,
  Page,
  Section,
  SiteLink,
  Sources,
  Table,
  type L,
  type SectionInfo,
} from "../kit";
import {
  BrokenLink,
  CriticalStrip,
  DigestionLadder,
  MirrorPipelines,
  OneOpenStatement,
  OneStreamEach,
  ProofArchitecture,
  ShrinkingProof,
  TwoPositions,
} from "./RhFigures";

const PAGE = "rh";
const AS_OF: [string, string] = [
  "Facts about the claims on this page are as of 22 November 2026, except where dated later: the 76,000-line rewrite of the Lean proof and the state of Masullo's formalization are as of 27 November.",
  "本頁關於這些宣稱的事實，除另標日期者外截至 2026 年 11 月 22 日；7.6 萬行的 Lean 改寫版與 Masullo 形式化的現況截至 11 月 27 日。",
];

const RhMaps = lazy(() => import("./RhMaps"));

const SECTIONS: SectionInfo[] = [
  {
    id: "picture",
    title: [
      "What the Riemann hypothesis says, as a picture",
      "黎曼猜想在說什麼：一張圖",
    ],
  },
  {
    id: "architecture",
    title: [
      "How AI and people prove together: the architecture",
      "AI 與人如何一起證明：整體架構",
    ],
  },
  {
    id: "mirror",
    title: ["The mirror case, the same day", "同一天的鏡像案例"],
  },
  { id: "stand", title: ["Where we stand", "我們的立場"] },
  {
    id: "maps",
    title: ["Two maps: the statement and the proof", "兩張地圖：陳述與證明"],
  },
  {
    id: "more",
    title: ["Further: six views, and the history", "延伸：六種觀點與歷史"],
  },
];

function Sub({ t }: { t: readonly [string, string] }) {
  const { pick } = useLang();
  return (
    <p className="pt-2 text-base font-semibold text-gray-900">{pick(t)}</p>
  );
}

/** The stand section's timeline: who said or found what, in order of the events. */
type Kind = "found" | "leans" | "sceptic" | "slow";
const KIND: Record<Kind, { dot: string; chip: string; legend: L }> = {
  found: {
    dot: "bg-teal-600",
    chip: "bg-teal-50 text-teal-800 ring-teal-200",
    legend: ["formalisation found an error", "形式化找到錯誤"],
  },
  leans: {
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-800 ring-sky-200",
    legend: ["leans towards formal checking", "傾向形式檢查"],
  },
  sceptic: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900 ring-amber-200",
    legend: ["sceptical", "持懷疑態度"],
  },
  slow: {
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-800 ring-violet-200",
    legend: [
      "human checking is slow; machines' help is coming",
      "人工檢查很慢；機器的幫助正在到來",
    ],
  },
};
/** A freely licensed photo from Wikimedia Commons (public/people/CREDITS.md; Buzzard's is the Views page's). */
interface Photo {
  src: string;
  author: string;
  licence: string;
  licenceUrl: string;
  /** the Commons file page */
  file: string;
}
/** A person shown beside a timeline entry: their photo, or their initials where Commons has no free photo. */
interface Face {
  name: string;
  photo?: Photo;
}
const COMMONS = "https://commons.wikimedia.org/wiki/File:";
const MFO_LICENCE = {
  licence: "CC BY-SA 2.0 de",
  licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0/de/deed.en",
};
const FACES = {
  voevodsky: {
    name: "Vladimir Voevodsky",
    photo: {
      src: "people/voevodsky.webp",
      author: "Renate Schmid (MFO)",
      ...MFO_LICENCE,
      file: `${COMMONS}VladimirVoevodsky.jpg`,
    },
  },
  simpson: { name: "Carlos Simpson" },
  gouezel: { name: "Sébastien Gouëzel" },
  shchur: { name: "Vladimir Shchur" },
  buzzard: {
    name: "Kevin Buzzard",
    photo: {
      src: "views/buzzard.webp",
      author: "Paula Buzzard",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      file: `${COMMONS}Kevin_buzzard_in_2007.jpg`,
    },
  },
  harris: { name: "Michael Harris" },
  chambertLoir: { name: "Antoine Chambert-Loir" },
  masullo: { name: "Alessandro Maria Masullo" },
  sernau: { name: "Luke Sernau" },
  vakil: {
    name: "Ravi Vakil",
    photo: {
      src: "people/vakil.webp",
      author: "Renate Schmid (MFO)",
      ...MFO_LICENCE,
      file: `${COMMONS}Ravi_Vakil.jpg`,
    },
  },
} satisfies Record<string, Face>;

const EVENTS: {
  year: string;
  kind: Kind;
  who: L;
  said: L;
  chip: L;
  faces: Face[];
}[] = [
  {
    year: "1989",
    kind: "leans",
    faces: [FACES.voevodsky, FACES.simpson],
    who: [
      "**Vladimir Voevodsky** (Fields Medal 2002)",
      "**Vladimir Voevodsky**（2002 年菲爾茲獎）",
    ],
    said: [
      'In 1998 Carlos Simpson posted a preprint showing that the property claimed for the construction in the paper by Kapranov and Voevodsky on ∞-groupoids (1989) cannot hold; his argument applies "in particular … to the realization functor of Kapranov-Voevodsky". It was "a flaw that Voevodsky confirmed fifteen years later"; Voevodsky also found a mistake in a key lemma of his own paper. Voevodsky asked: "Who would ensure that I did not forget something and did not make a mistake, if even the mistakes in much more simple arguments take years to uncover?" He turned to computer-checked foundations.',
      "1998 年，Carlos Simpson 發表一份預印本，證明 Voevodsky 與 Kapranov 關於 ∞-群胚的論文（1989）為其構造所宣稱的性質不可能成立；他的論證「特別適用於 Kapranov-Voevodsky 的實現函子」。這是「Voevodsky 在十五年後確認的錯誤」；Voevodsky 也在自己論文的一個關鍵引理中發現錯誤。Voevodsky 問：「如果連簡單得多的論證中的錯誤都要好幾年才被發現，誰能確保我沒有遺漏、沒有犯錯？」他因此轉向電腦檢查的基礎。",
    ],
    chip: ["towards formal checking", "傾向形式檢查"],
  },
  {
    year: "2013 → 2019",
    kind: "found",
    faces: [FACES.gouezel, FACES.shchur],
    who: ["**Evidence:** the Morse lemma", "**證據：** Morse 引理"],
    said: [
      'Gouëzel and Shchur: "There is a gap in the proof of the main theorem" of a 2013 paper on hyperbolic spaces (an inequality pointing the wrong way), brought to light by the careful checking a formalization needs. They repaired it, the theorem survived, and the result was certified in Isabelle/HOL.',
      "Gouëzel 與 Shchur：一篇 2013 年關於雙曲空間的論文，「其主要定理的證明有一個漏洞」（一個不等式方向反了），是在形式化所需的仔細檢查中發現的。他們修補了它，定理仍然成立，結果並在 Isabelle/HOL 中通過驗證。",
    ],
    chip: ["formalization found a gap", "形式化找到漏洞"],
  },
  {
    year: "2019",
    kind: "leans",
    faces: [FACES.buzzard],
    who: [
      "**Kevin Buzzard** (Imperial College)",
      "**Kevin Buzzard**（帝國理工學院）",
    ],
    said: [
      "In 2019: \"I think there is a non-zero chance that some of our great castles are built on sand ... But I think it's small.\" Kevin Buzzard leads the Lean formalization of Fermat's Last Theorem, and wrote the four questions of the Checkers page.",
      "2019 年：「我認為我們有些宏偉的城堡蓋在沙上的機率不是零……但我認為很小。」Kevin Buzzard 領導費馬最後定理的 Lean 形式化，也寫下檢查器頁面上的四個問題。",
    ],
    chip: ["towards formal checking", "傾向形式檢查"],
  },
  {
    year: "2022",
    kind: "sceptic",
    faces: [FACES.harris],
    who: [
      "**Michael Harris** (Columbia)",
      "**Michael Harris**（哥倫比亞大學）",
    ],
    said: [
      'A number theorist openly sceptical of the push to mechanize mathematics: his newsletter *Silicon Reckoner* asks whose interests drive it, and argues that "the future of mathematics is a political question".',
      "一位公開質疑數學機械化推動的數論學家：他的電子報 *Silicon Reckoner* 追問是誰的利益在推動它，並主張「數學的未來是一個政治問題」。",
    ],
    chip: ["sceptical", "持懷疑態度"],
  },
  {
    year: "2024",
    kind: "found",
    faces: [FACES.chambertLoir],
    who: [
      "**Evidence:** a 1965 lemma (FLT project)",
      "**證據：** 一條 1965 年的引理（FLT 專案）",
    ],
    said: [
      'While formalizing the theory of divided powers in Lean, Antoine Chambert-Loir found that Lemme 8 of Roby\'s 1965 paper "seems to be false". The argument was rescued by an alternative proof from the literature (Berthelot–Ogus), itself in need of fixes.',
      "Antoine Chambert-Loir 在 Lean 中形式化 divided powers 理論時，發現 Roby 1965 年論文的 Lemme 8「看起來是錯的」。論證後來靠文獻中的另一個證明（Berthelot–Ogus）救回，而那個證明本身也需要修正。",
    ],
    chip: ["formalization found an error", "形式化找到錯誤"],
  },
  {
    year: "20 Nov 2026",
    kind: "slow",
    faces: [FACES.masullo, FACES.vakil],
    who: ["**Evidence:** Masullo's GRH", "**證據：** Masullo 的 GRH"],
    said: [
      "Months of expert reading, then problems reported within hours by readers using AI (section 3).",
      "專家讀了好幾個月，接著借助 AI 的讀者在幾小時內回報問題（第 3 節）。",
    ],
    chip: [
      "human checking is slow; machine help is arriving",
      "人工檢查很慢；機器的幫助正在到來",
    ],
  },
  {
    year: "23 Nov 2026",
    kind: "found",
    faces: [FACES.masullo],
    who: [
      "**Evidence:** Masullo's GRH, §1.4.3",
      "**證據：** Masullo 的 GRH，§1.4.3",
    ],
    said: [
      "A crowdsourced Lean formalization of the draft records a uniform bound in §1.4.3, needed for its use of Montel's theorem, as false as printed, with a counterexample (an objection first raised by Jenny Lorraine Nielsen). A gap in the proof as written, not a disproof of GRH; whether the strategy can be repaired is open.",
      "這份草稿的群眾協作 Lean 形式化，把 §1.4.3 中套用 Montel 定理所需的一個均勻界記為「照原文寫的是錯的」，並給出反例（這個反對意見最早由 Jenny Lorraine Nielsen 提出）。這是原文證明的缺口，不是推翻 GRH；這個策略能否修補仍是未知。",
    ],
    chip: ["formalization found an error", "形式化找到錯誤"],
  },
  {
    year: "25 Nov 2026",
    kind: "slow",
    faces: [FACES.sernau],
    who: [
      "**Evidence:** the same Lean proof, rewritten shorter",
      "**證據：** 同一份 Lean 證明，改寫得更短",
    ],
    said: [
      "Luke Sernau, with colleagues at Anthropic and Claude, posted a rewriting of Alpöge's proof: the same five theorem statements in about 76,000 lines of code (compact) or 300,000 (readable, with a reading guide), against 17 million. Independent checkers accepted both editions within a day (section 2). Its README: no mathematician has read it through. Machines are now helping with digestion, not only with search.",
      "Luke Sernau 與 Anthropic 的同事、以及 Claude 一起，貼出 Alpöge 證明的改寫版：同樣五條定理陳述，精簡版約 7.6 萬行程式碼、可讀版約 30 萬行（附閱讀指南），原本是 1700 萬行。一天之內，兩個版本都被獨立的檢查器接受（第 2 節）。它的 README 說：還沒有數學家把它從頭讀完。機器現在不只幫忙搜尋，也開始幫忙消化。",
    ],
    chip: [
      "human checking is slow; machine help is arriving",
      "人工檢查很慢；機器的幫助正在到來",
    ],
  },
  {
    year: "25 Nov 2026",
    kind: "found",
    faces: [FACES.masullo],
    who: [
      "**Evidence:** Masullo's GRH, p. 520",
      "**證據：** Masullo 的 GRH，第 520 頁",
    ],
    said: [
      "The crowdsourced formalization reaches the main line: all seven target theorems rest on one statement without proof (Theorem 12.5.1.1, the cancellation of the zeros outside the strip), and Lean proves that this cancellation, for every width, is equivalent to the main claim itself. A contributor proposed recording that the manuscript, as written, does not prove its theorem (section 3). Whether Hecke GRH is true is a separate question.",
      "群眾協作的形式化走到主線：七條目標定理全都靠一條沒有證明的陳述（定理 12.5.1.1，帶外零點互相抵消），而 Lean 證明了：這個抵消（對每個寬度）與主要主張本身等價。一位參與者提議明白記下：照原文寫的手稿沒有證出它的定理（第 3 節）。Hecke GRH 本身是否為真，是另一個問題。",
    ],
    chip: ["formalization found a gap", "形式化找到缺口"],
  },
];

/**
 * Section 3, third tab: the problems reported in Masullo's draft, checked against the primary sources on 23 November
 * 2026 (Vakil's post and update, Baez's summary, the crowdsourced Lean formalization's README and issues, Naslund's
 * review), and a viral one-paragraph summary of them compared line by line with those sources.
 */
function ReadersFound() {
  return (
    <>
      <P
        t={[
          "Within two days, readers had pinned the reported problems to specific pages. Three, as of 23 November 2026, checked against the sources below:",
          "兩天之內，讀者已經把回報的問題定位到具體的頁碼。截至 2026 年 11 月 23 日，對照下方來源核實過的有三個：",
        ]}
      />
      <List
        ordered
        items={[
          [
            "**A uniform bound (§1.4.3, p. 29).** The argument approximates an expression with a cutoff, needs the approximations to be *uniformly bounded on compact sets*, and then uses Montel's theorem to get a convergent subsequence. Jenny Lorraine Nielsen objected that the bound fails, and the crowdsourced Lean formalization of the draft (Ryan McCorvie's project) records it as false as printed, confirmed with a counterexample at the trivial character of ℚ. A Lean refutation of the printed Montel step was proposed there on 23 November (made with Claude Code) and was still under review.",
            "**一個均勻界（§1.4.3，第 29 頁）。** 論證用帶截斷的式子去逼近，需要這些近似式*在緊集上均勻有界*，再用 Montel 定理取出收斂的子序列。Jenny Lorraine Nielsen 指出這個界不成立；這份草稿的群眾協作 Lean 形式化（Ryan McCorvie 的專案）把它記為「照原文寫的是錯的」，並以 ℚ 的平凡特徵給出反例確認。11 月 23 日有人在那裡提交了一個推翻原文 Montel 步驟的 Lean 證明（用 Claude Code 做的），當時仍在審查中。",
          ],
          [
            "**The prime 2 (Theorem 11.3.2.1, pp. 495–496).** Eric Naslund's review, prepared with an OpenAI model starting from two GPT Pro reviews, tests the theorem on a function concentrated near 2: it should give log 2, but the review argues the limit is 0. Two attempted repairs fell short, by its own account.",
            "**質數 2（定理 11.3.2.1，第 495–496 頁）。** Eric Naslund 的審查（以 OpenAI 的模型、從兩份 GPT Pro 審查出發做成）用一個集中在 2 附近的函數測試這條定理：結果應該是 log 2，但審查論證極限是 0。照它自己的說法，兩次修補嘗試都不夠。",
          ],
          [
            '**A functional-analysis step (p. 444).** Checkers say a property of Schauder bases is used for Markushevich bases, where it can fail. John Baez calls the claim "apparently false" there, but adds that the specific bases used might have the bound for other reasons.',
            "**一個泛函分析步驟（第 444 頁）。** 檢查者指出，原本屬於 Schauder 基的性質被拿來用在 Markushevich 基上，而在那裡它可能不成立。John Baez 說這個說法在那裡「看來是錯的」，但也補充：所用的特定基也許因為別的原因仍有那個界。",
          ],
        ]}
      />
      <Figure
        caption={[
          "The first problem as a chain. The bound in §1.4.3 is the red link; Montel's theorem itself is fine, but it needs the bound, so the steps after it (dashed) lose their support until the bound is repaired or replaced. As of 23 November 2026.",
          "把第一個問題畫成一條鏈。§1.4.3 的界是紅色那一環；Montel 定理本身沒問題，但它需要這個界，所以後面的步驟（虛線）在界被修好或換掉之前都失去支撐。截至 2026 年 11 月 23 日。",
        ]}
      >
        <BrokenLink />
      </Figure>
      <Callout
        kind="note"
        title={["Checking a viral summary", "核對一則瘋傳的摘要"]}
      >
        <P
          t={[
            "A one-paragraph summary of this news went round social media on 23 November. Most of it holds up; two phrases go further than the sources:",
            "11 月 23 日，社群媒體上流傳一段關於這件事的摘要。大部分站得住，有兩處說得比來源更多：",
          ]}
        />
        <Table
          head={[
            ["The summary says", "摘要說"],
            ["The sources say", "來源怎麼說"],
          ]}
          rows={[
            [
              [
                "A counterexample to the uniform-boundedness claim, so the Montel step in §1.4.3 fails",
                "均勻有界的主張有反例，所以 §1.4.3 套用 Montel 定理的步驟無效",
              ],
              [
                "**Supported.** False as printed, with a counterexample (the formalization's README).",
                "**有根據。** 照原文寫的是錯的，並有反例（形式化專案的 README）。",
              ],
            ],
            [
              [
                "A core reasoning error, not a typo",
                "是核心推論的錯誤，不是小筆誤",
              ],
              [
                "**Fair.** Baez calls the Montel step one of the two hard parts of the argument.",
                "**合理。** Baez 把 Montel 這一步列為論證中兩個困難的部分之一。",
              ],
            ],
            [
              [
                "So the derivation of GRH does not stand",
                "廣義黎曼猜想的推導因此不成立",
              ],
              [
                '**Goes further.** The proof *as written* has a gap, so it does not establish GRH today. Nothing shows GRH is false, nor that the strategy cannot be repaired; Baez says the objections "may turn out to be fixable or mistaken".',
                "**說過頭了。** 是*照原文寫的*證明有缺口，所以它今天沒有證出 GRH。沒有任何東西顯示 GRH 是錯的，也沒有顯示這個策略修不好；Baez 說這些反對意見「可能最後是可以修補的，或者本身是錯的」。",
              ],
            ],
            [
              [
                "Vakil updated the same day: several mathematicians reported problems with different AI models",
                "Vakil 同一天更新：多位數學家借助不同 AI 模型回報問題",
              ],
              [
                '**Nearly.** About eight hours later he wrote that "several people" reported problems "identified with the assistance of different AI models"; he does not say they were mathematicians.',
                "**大致對。** 大約八小時後他寫道，「好幾個人」回報了「借助不同 AI 模型找到的」問題；他沒有說這些人是數學家。",
              ],
            ],
            [
              [
                "The paper is now under major revision",
                "論文目前正在進行大幅修訂",
              ],
              [
                "**Goes further.** Vakil's own word is \"mid-revision\", and it describes the draft's state when he posted it (Masullo was polishing it with Brian Conrad), not a response to these problems.",
                "**說過頭了。** Vakil 自己用的詞是「修訂到一半」（mid-revision），描述的是他貼出草稿時的狀態（Masullo 正和 Brian Conrad 一起潤飾），不是對這些問題的回應。",
              ],
            ],
          ]}
        />
      </Callout>
      <Sub
        t={[
          "Update, 27 November: the formalization reaches the main step",
          "11 月 27 日更新：形式化走到主要步驟",
        ]}
      />
      <P
        t={[
          "Four days on, the crowdsourced formalization had stated most of the 940-page draft in Lean: about 13,200 theorems by 24 November, and in the chapters the trace formula rests on, all but eight proved by 26 November, from some 2,660 pull requests by about ninety people. Its README now says that Masullo is working with the project to fill in the remaining gaps. Along the way it proved 292 statements of the manuscript false as printed (each kept in Lean with a proof of its negation, next to a corrected statement that is proved), and its errata list about 790 entries. Most problems in the draft's own constructions came with a repair. The one that matters does not:",
          "四天後，群眾協作的形式化已經把這份 940 頁草稿的大部分寫成 Lean：到 11 月 24 日約有 13,200 條定理已陳述；到 11 月 26 日，在跡公式所依賴的那些章節裡，只剩八條沒證，來自約九十人的大約 2,660 個 pull request。它的 README 現在說，Masullo 正和這個專案一起填補剩下的缺口。一路上它證明了手稿中 292 條陳述照原文寫的是錯的（每條都在 Lean 裡留下它的否定的證明，旁邊是證好的修正版），勘誤表約有 790 條。草稿自己的構造裡，大多數問題都找到了修補。最關鍵的那一個沒有：",
        ]}
      />
      <Figure
        caption={[
          "In Lean, all seven target theorems (Hecke GRH and its consequences down to RH) use exactly one statement without proof: Theorem 12.5.1.1 on p. 520, that the zeros outside a strip cancel out of the trace formula. Lean also proves that this cancellation, for every width, is equivalent to the main claim, so nothing weaker can supply it. As of 27 November 2026.",
          "在 Lean 裡，七條目標定理（Hecke GRH 以及一路推到 RH 的推論）只用到一條沒有證明的陳述：第 520 頁的定理 12.5.1.1，也就是帶外的零點會從跡公式中抵消。Lean 也證明了：這個抵消（對每個寬度）與主要主張等價，所以任何更弱的東西都撐不起它。截至 2026 年 11 月 27 日。",
        ]}
      >
        <OneOpenStatement />
      </Figure>
      <P
        t={[
          "Why this is decisive: the explicit formula sees *all* zeros, the trace on p. 520 sees only those inside a strip, so the zeros outside must contribute nothing. If even one zero sat off the critical line, a strip narrow enough would leave it outside, and some test would detect it. So the step can only hold if GRH already holds. On 25 November a contributor proposed that the project record this plainly: \"The manuscript does not prove its stated Hecke GRH theorem; an independent proof of the missing exterior-zero assertion would itself establish Hecke GRH.\" Others backed the wording; as of 27 November it is a proposal on an open issue, not yet the project's stated verdict. The README adds that the draft is unfinished by its author's account: Chapter 13, which should deduce GRH from the trace formula, does not yet state its main theorem.",
          "為什麼這一步是決定性的：顯式公式看得到*所有*零點，第 520 頁的跡只看得到帶內的零點，所以帶外的零點必須貢獻為零。只要有一個零點不在臨界線上，取一條夠窄的帶就會把它留在外面，而某個測試函數就會偵測到它。所以這一步只有在 GRH 已經成立時才可能成立。11 月 25 日，一位參與者提議專案明白記下：「這份手稿沒有證出它所陳述的 Hecke GRH 定理；若能獨立證明缺少的帶外零點斷言，那本身就證明了 Hecke GRH。」其他人支持這個措辭；截至 11 月 27 日，它仍是一個開著的 issue 裡的提議，還不是專案正式的結論。README 也補充：照作者自己的說法，草稿還沒寫完：本該從跡公式推出 GRH 的第 13 章，還沒有寫出它的主定理。",
        ]}
      />
      <P
        t={[
          "So the three problems above were not the end of the story but its beginning: each was local, a step that a repair might replace; the gap on p. 520 is the whole problem in a new form. It is a gap in the argument as written, not a disproof of GRH, and the project keeps it open as a problem for new mathematics.",
          "所以上面那三個問題不是故事的結尾，而是開頭：它們都是局部的，是修補也許能替換掉的一步；第 520 頁的缺口則是整個問題換了一種形式。這是原文論證的缺口，不是推翻 GRH，而專案把它當作留給新數學的問題保持開放。",
        ]}
      />
      <P
        t={[
          "Notice who found the gaps and how: people working with AI models as readers, and a crowd of contributors and their coding agents turning the draft into Lean, where a false bound cannot hide and an equivalence can be proved rather than argued. It is the mirror image of Alpöge's claim, where Lean came first and the reading is still to come.",
          "注意是誰、怎麼找到這些缺口的：把 AI 模型當讀者的人，以及一群協作者和他們的程式代理把草稿翻成 Lean；在 Lean 裡，一個錯的界藏不住，一個等價關係也能被證明，而不只是被論證。這正好是 Alpöge 宣稱的鏡像：那邊是 Lean 先完成，閱讀還在後頭。",
        ]}
      />
    </>
  );
}

/**
 * The two claims of 20 November 2026 in their authors' own words, side by side: Levent Alpöge's statement
 * (alpo.ge/remark.pdf) and Alessandro Maria Masullo's acknowledgements in his draft "The Music of the Primes" (linked
 * from Vakil's post). Quoted exactly in English; the Chinese is this site's translation.
 */
type OwnQuote = { en: string; zh: string; where: L };
type OwnVoice = {
  name: string;
  stream: L;
  url: string;
  doc: L;
  quotes: OwnQuote[];
};
const OWN_WORDS: OwnVoice[] = [
  {
    name: "Levent Alpöge",
    stream: [
      "The Lean stream only: finished by machine, to be written for people",
      "只有 Lean 這條流：機器完成了，還要寫給人看",
    ],
    url: "https://alpo.ge/remark.pdf",
    doc: ["statement, alpo.ge/remark.pdf", "聲明，alpo.ge/remark.pdf"],
    quotes: [
      {
        en: "I had us on the line of combining two quite different ideas present in a toy setting, one of which was already new and shocking … I guided us to the right situation analogous to that toy setting, and then Claude began to leave me in awe.",
        zh: "我讓我們走上把一個玩具情境裡兩個很不一樣的想法結合起來的路，其中一個本身就已經新穎得令人震驚……我把我們帶到與那個玩具情境相應的正確情境，接著 Claude 開始讓我驚嘆。",
        where: ["page 1", "第 1 頁"],
      },
      {
        en: "While its formalization is finished and it is routine to produce a huge, unreadable document containing sufficient detail, in my view of my path I have just taken a step. I intend to do my best to understand and impart understanding of this argument and its certain simplifications, to speak about it, to write it properly.",
        zh: "雖然形式化已經完成，要產出一份細節足夠、篇幅龐大、讀不下去的文件也只是例行公事，但在我看來，在自己的路上我才剛踏出一步。我打算盡力理解這個論證和它必然會有的簡化，也讓別人理解它；去講它，好好地把它寫出來。",
        where: ["page 1", "第 1 頁"],
      },
      {
        en: "It being obviously inappropriate to attempt to post some massive unreadable travesty of “slop”, I decided to only present Lean.",
        zh: "貼出一大份讀不下去、粗製濫造的東西（slop）顯然不妥，所以我決定只公開 Lean。",
        where: ["page 2", "第 2 頁"],
      },
    ],
  },
  {
    name: "Alessandro Maria Masullo",
    stream: [
      "The natural-language stream only: written by hand, not yet checked by machine",
      "只有自然語言這條流：人親手寫成，還沒經過機器檢查",
    ],
    url: "https://math216.wordpress.com/wp-content/uploads/2026/11/the-music-of-the-primes.pdf",
    doc: [
      "draft “The Music of the Primes”, Acknowledgements",
      "草稿《The Music of the Primes》致謝",
    ],
    quotes: [
      {
        en: "This work started off when the author was nearing the end of his first year as a Graduate Student at Stanford under Brian Conrad. It took nearly 12 years to assemble.",
        zh: "這項工作開始於作者在史丹佛跟隨 Brian Conrad、研究生第一年即將結束的時候。它花了將近 12 年才組裝完成。",
        where: ["p. 6 of the PDF", "PDF 第 6 頁"],
      },
      {
        en: "Brian Conrad and I are aware of several glitches here and there that I was in the process of addressing on the way to completing the typewriting. The ideas are however all here, and many of the chapters are already fairly stable.",
        zh: "Brian Conrad 和我知道這裡那裡有幾處小毛病，我正在完成打字稿的路上處理它們。不過想法全都在這裡了，許多章節也已經相當穩定。",
        where: ["p. 6 of the PDF", "PDF 第 6 頁"],
      },
      {
        en: "If any message at all this work is meant to send to the mathematician who feels discouraged by the pace and tone of the current climate, it is this: we are still here. We are very much alive. We are not going anywhere.",
        zh: "如果這份工作要對那些被當前氛圍的步調與語氣弄得灰心的數學家傳達什麼訊息，那就是：我們還在這裡。我們還活得好好的。我們哪裡也不去。",
        where: ["p. 6 of the PDF", "PDF 第 6 頁"],
      },
    ],
  },
];

/** Two columns, one per claim: each author's own words, and the one stream each claim has. */
function InTheirOwnWords() {
  const { pick, lang } = useLang();
  return (
    <div data-testid="rh-own-words">
      <p className="mb-3 text-sm text-gray-600">
        <RichText
          text={pick([
            "The two claims of the same day, each in its author's words, are mirror images: one has a finished Lean proof and owes the argument written for people; the other is a 940-page argument written by hand over twelve years, with known glitches, and no Lean.",
            "同一天的兩份宣稱，用作者自己的話來看，正好互為鏡像：一份有完成的 Lean 證明，還欠著寫給人看的論證；另一份是花了十二年親手寫成的 940 頁論證，作者自己知道有些小毛病，而且沒有 Lean。",
          ])}
        />
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {OWN_WORDS.map((v) => (
          <div key={v.name} className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{v.name}</p>
              <p className="text-xs text-(--lk-accent)">{pick(v.stream)}</p>
            </div>
            {v.quotes.map((q) => (
              <blockquote
                key={q.en.slice(0, 24)}
                className="border-l-4 border-teal-200 pl-3 text-[15px] leading-relaxed text-gray-800"
              >
                {lang === "en" ? (
                  <p lang="en">“{q.en}”</p>
                ) : (
                  <>
                    <p>「{q.zh}」</p>
                    <p lang="en" className="mt-1 text-xs text-gray-500">
                      “{q.en}”
                    </p>
                  </>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  — {v.name}, {pick(v.doc)} ({pick(q.where)}){" "}
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-(--lk-accent) hover:underline"
                  >
                    ↗
                  </a>
                </p>
              </blockquote>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        {pick([
          "Quoted exactly from the documents as published on 20 November 2026 (Alpöge's statement is the file whose checksum the community re-check repository records; Masullo's draft is the one linked from Ravi Vakil's announcement); the Chinese is this site's translation. As of 22 November 2026 Alpöge's Lean proof is certified by the Lean and Mathlib communities (21 November 2026), but neither claim's mathematics is accepted by the wider mathematical community.",
          "一字不改地引自 2026 年 11 月 20 日公開的文件（Alpöge 的聲明即社群複查倉庫記錄了雜湊值的那個檔案；Masullo 的草稿即 Ravi Vakil 公告中連結的那份）；中文為本站翻譯。截至 2026 年 11 月 22 日，Alpöge 的 Lean 證明已由 Lean 與 Mathlib 社群認證（2026 年 11 月 21 日），但兩份宣稱的數學都還沒有被更廣泛的數學界接受。",
        ])}
      </p>
    </div>
  );
}

/** One person beside a timeline entry: a round photo with its credit (author · licence · Commons), or the initials. */
function FaceCard({ f }: { f: Face }) {
  const { pick } = useLang();
  const words = f.name.split(" ");
  const cls = "h-16 w-16 rounded-full";
  return (
    <figure className="w-[6.5rem] text-center" data-testid="rh-face">
      {f.photo ? (
        <img
          src={`${import.meta.env.BASE_URL}${f.photo.src}`}
          alt={f.name}
          width={64}
          height={64}
          loading="lazy"
          className={`${cls} mx-auto bg-gray-200 object-cover`}
        />
      ) : (
        <span
          className={`${cls} mx-auto flex items-center justify-center bg-teal-600 text-base font-semibold text-white`}
          aria-hidden
        >
          {words[0][0] + words[words.length - 1][0]}
        </span>
      )}
      <figcaption className="mt-1 text-[11px] leading-tight">
        <span className="block font-medium text-gray-800">{f.name}</span>
        {f.photo && (
          <span className="mt-0.5 block text-[10px] text-gray-500">
            {pick(["Photo: ", "照片："])}
            <a
              href={f.photo.file}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {f.photo.author}
            </a>
            {" · "}
            <a
              href={f.photo.licenceUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {f.photo.licence}
            </a>
            {" · "}
            <a
              href={f.photo.file}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Wikimedia Commons
            </a>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Timeline() {
  const { pick } = useLang();
  return (
    <div>
      <ul
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600"
        aria-label={pick(["Legend", "圖例"])}
      >
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`h-2.5 w-2.5 rounded-full ${KIND[k].dot}`}
            />
            {pick(KIND[k].legend)}
          </li>
        ))}
      </ul>
      {/* three columns on wide screens: the people | the timeline (line and dot) | year and text; on phones the
          people sit above the text and there is no side line */}
      <ol className="relative" data-testid="rh-timeline">
        {EVENTS.map((e, i) => (
          <li
            key={e.year + e.kind}
            className="grid grid-cols-1 gap-2 sm:grid-cols-[13rem_1.75rem_minmax(0,1fr)] sm:gap-0"
          >
            <div className="flex shrink-0 gap-2 sm:justify-end sm:pr-3 sm:pb-6">
              {e.faces.map((f) => (
                <FaceCard key={f.name} f={f} />
              ))}
            </div>
            <div aria-hidden className="relative hidden sm:block">
              <span
                className={`absolute left-1/2 w-0.5 -translate-x-1/2 bg-teal-100 ${i === 0 ? "top-2" : "top-0"} ${i === EVENTS.length - 1 ? "h-2" : "bottom-0"}`}
              />
              <span
                className={`absolute top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white ${KIND[e.kind].dot}`}
              />
            </div>
            <div className="min-w-0 pb-6">
              <p className="text-xs font-semibold text-(--lk-accent)">
                {e.year}
              </p>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">
                  <RichText text={pick(e.who)} />
                </h3>
                <p className="mt-1">
                  <RichText text={pick(e.said)} />
                </p>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] ring-1 ${KIND[e.kind].chip}`}
                >
                  {pick(e.chip)}
                </span>
                {e.kind === "sceptic" && (
                  <span className="ml-3 text-sm">
                    <SiteLink
                      to={["concept", "views", "sceptic"]}
                      label={[
                        "The sceptic's case, point by point",
                        "懷疑者的論點，逐點看",
                      ]}
                    />
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function RhConcept({ section }: { section: string | null }) {
  const { pick } = useLang();
  return (
    <Page
      id={PAGE}
      sections={SECTIONS}
      focus={section}
      title={["AI + human: the Riemann case", "AI + 人：黎曼猜想的案例"]}
      intro={[
        "On 20 November 2026 a claimed proof of the Riemann hypothesis arrived as 17 million lines of Lean, written with an AI. On the same day an all-human proposal for the generalized version was announced, and readers using AI reported problems in it within hours. Together they show how a proof made by people and machines is built, what each side is good for, and what no checker can settle. This page draws the architecture, from a beginner's picture to the research questions. As of 22 November 2026 the Lean proof is " +
          "certified by the Lean and Mathlib communities (21 November 2026), but its mathematics is still being digested; the all-human proposal is not accepted. Since then (as of 27 November) the Lean proof has been rewritten in 76,000 lines, and the all-human proposal's main step has been shown in Lean to be as strong as what it sets out to prove. This page explains the process, not a verdict on the mathematics.",
        "2026 年 11 月 20 日，一個宣稱的黎曼猜想證明以 1700 萬行 Lean 的形式出現，是與 AI 合作寫成的。同一天，另一份完全由人寫的推廣版證明提案公布，而借助 AI 的讀者在幾小時內就回報了其中的問題。兩件事放在一起，正好說明人與機器合作的證明怎麼搭起來、各自擅長什麼，以及有什麼是任何檢查器都無法判定的。本頁把整個架構畫出來，從初學者看得懂的圖一路到研究層級的問題。截至 2026 年 11 月 22 日，那份 Lean 證明已由 Lean 與 Mathlib 社群認證（2026 年 11 月 21 日），但其中的數學仍在消化中；完全由人寫的提案則尚未被接受。在那之後（截至 11 月 27 日），Lean 證明被改寫成 7.6 萬行，而那份完全由人寫的提案，其主要步驟已在 Lean 中被證明和它要證的結論一樣強。本頁說明的是過程，不是對這些數學的判決。",
      ]}
    >
      {/* ------------------------------------------------------------------------------------------------ 1 */}
      <Section page={PAGE} id="picture" n={1} title={SECTIONS[0].title}>
        <P
          t={[
            "A function has infinitely many zeros in a narrow strip, and the claim is that every one of them sits on the strip's middle line. Watch them appear:",
            "一個函數在一條窄帶裡有無窮多個零點，而這個猜想說：每一個都剛好落在窄帶的中線上。看它們一個個出現：",
          ]}
        />
        <Figure
          caption={[
            "Left: the first ten non-trivial zeros, all on the dashed line. Right: how far computers have checked. Every zero up to height $3 \\cdot 10^{12}$ (about 12 trillion of them) is on the line, and infinitely many lie above.",
            "左：前十個非平凡零點，全在虛線上。右：電腦檢查到多高。高度 $3 \\cdot 10^{12}$ 以下的每個零點（大約 12 兆個）都在線上，而上面還有無窮多個。",
          ]}
        >
          <CriticalStrip />
        </Figure>
        <P
          t={[
            "In detail: Riemann's zeta function starts as $\\zeta(s) = 1 + 1/2^s + 1/3^s + \\dots$ and extends to almost every complex number $s$ (all but $s = 1$, a pole). It is zero at $-2, -4, -6, \\dots$ (the *trivial* zeros). All its other zeros lie in the *critical strip* $0 < \\mathrm{Re}(s) < 1$. The **Riemann hypothesis** (RH, 1859) says they all lie exactly on the middle line, $\\mathrm{Re}(s) = 1/2$. Why care? The positions of the zeros control how evenly the prime numbers are spread out; RH is the strongest form of that control.",
            "細節是這樣：黎曼 zeta 函數一開始是 $\\zeta(s) = 1 + 1/2^s + 1/3^s + \\dots$，可以延拓到幾乎所有複數 $s$（只有 $s = 1$ 是極點）。它在 $-2, -4, -6, \\dots$ 等於零（*平凡* 零點）。其他零點都落在 *臨界帶* $0 < \\mathrm{Re}(s) < 1$ 裡。**黎曼猜想**（RH，1859）說：它們全都剛好落在正中間那條線 $\\mathrm{Re}(s) = 1/2$ 上。為什麼重要？零點的位置控制質數分布得有多均勻；RH 是這種控制最強的形式。",
          ]}
        />
        <Callout
          kind="warn"
          title={[
            "12 trillion zeros are evidence, not proof",
            "12 兆個零點是證據，不是證明",
          ]}
        >
          <P
            t={[
              "Checking is finite; the zeros are infinite. And number theory has famous statements that held for every case anyone computed, yet are false. Littlewood proved in 1914 that $\\pi(x) < \\mathrm{li}(x)$ fails infinitely often, though it holds for every $x$ ever computed. The Mertens conjecture was disproved in 1985 by Odlyzko and te Riele, and still no explicit counterexample is known. Numbers make RH very believable; only a proof makes it a theorem.",
              "檢查是有限的；零點是無限的。而數論裡有著名的陳述，對每個算過的例子都成立，卻是錯的。Littlewood 在 1914 年證明 $\\pi(x) < \\mathrm{li}(x)$ 會無窮多次不成立，儘管對每個算過的 $x$ 都成立。Mertens 猜想在 1985 年被 Odlyzko 與 te Riele 否證，至今仍找不到一個明確的反例。數據讓 RH 非常可信；只有證明才能讓它成為定理。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            {
              label:
                "Platt & Trudgian, The Riemann hypothesis is true up to 3·10¹² (arXiv 2004.09765)",
              url: "https://arxiv.org/abs/2004.09765",
            },
            {
              label: "Clay Mathematics Institute: the Riemann hypothesis",
              url: "https://www.claymath.org/millennium/riemann-hypothesis/",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 2 */}
      <Section page={PAGE} id="architecture" n={2} title={SECTIONS[1].title}>
        <P
          t={[
            "Think of it as an assembly line with two lanes: people at both ends, machines in the middle. Step through it:",
            "把它想成一條有兩條跑道的生產線：人在兩端，機器在中間。一步一步看：",
          ]}
        />
        <Figure
          caption={[
            "The work travels from people to machines and back. The two ends (choosing the question and writing the statement; digesting and explaining) are people's; the middle (search, and three of the four gates) is machines'.",
            "工作從人流到機器，再流回人。兩端（選題與寫陳述；消化與解說）屬於人；中間（搜尋，以及四道關卡中的三道）屬於機器。",
          ]}
        >
          <ProofArchitecture />
        </Figure>
        <P
          t={[
            "The case: Levent Alpöge, a mathematician at Anthropic, posted a short note on 20 November 2026 saying that he and Claude had proved RH and GRH for Dirichlet *L*-functions, with the proof in Lean. A community repository re-checked it from scratch, and on 21 November 2026 the Lean and Mathlib communities certified the statement and the proof. Stage by stage, here is who does what:",
            "案例：Anthropic 的數學家 Levent Alpöge 在 2026 年 11 月 20 日發布一份簡短說明，表示他與 Claude 證明了 RH 以及 Dirichlet *L* 函數的 GRH，證明以 Lean 寫成。社群的一個儲存庫從頭重驗了它，2026 年 11 月 21 日 Lean 與 Mathlib 社群認證了陳述與證明。逐階段來看誰做什麼：",
          ]}
        />
        <Table
          head={[
            ["Stage", "階段"],
            ["Where people are irreplaceable", "人無法取代的地方"],
            ["Where machines are irreplaceable", "機器無法取代的地方"],
          ]}
          rows={[
            [
              ["Statement", "陳述"],
              [
                "Deciding that the Lean says what Riemann meant",
                "判斷 Lean 說的就是黎曼的意思",
              ],
              [
                "Nothing: a typechecker cannot know your intention",
                "沒有：型別檢查器無法知道你的意圖",
              ],
            ],
            [
              ["Search", "搜尋"],
              [
                "Choosing directions, splitting, knowing when to stop",
                "選方向、拆問題、知道何時停",
              ],
              [
                "Trying millions of steps; producing an artefact no team could type",
                "嘗試上百萬步；產出任何團隊都打不完的成品",
              ],
            ],
            [
              ["Gates", "關卡"],
              [
                "Q1, and deciding what the check may trust",
                "Q1，以及決定檢查可以信任什麼",
              ],
              [
                "Q2–Q4: replaying every step exactly, again and again, on independent kernels",
                "Q2–Q4：在獨立核心上精確地、一再地重播每一步",
              ],
            ],
            [
              ["Digestion", "消化"],
              [
                "Finding the idea, judging what is new and what it is for",
                "找出想法，判斷新在哪裡、有什麼用",
              ],
              [
                "Re-checking every shortened or rewritten piece for free",
                "免費重驗每一段縮短或改寫過的內容",
              ],
            ],
          ]}
        />
        <Sub
          t={[
            "How digested is it? Tao's ladder",
            "消化到什麼程度？陶哲軒的階梯",
          ]}
        />
        <P
          t={[
            "Checked by a machine and understood by people are two different ladders, and a result can be high on one and low on the other.",
            "被機器檢查與被人理解是兩把不同的梯子，一個結果可能在一把爬得很高，在另一把才剛起步。",
          ]}
        />
        <Figure
          caption={[
            "Machine-checked is one axis; digested is another. A result can be far along the first and barely started on the second.",
            "被機器檢查是一條軸；被消化是另一條。一個結果可能在第一條走得很遠，第二條才剛開始。",
          ]}
        >
          <DigestionLadder />
        </Figure>
        <P
          t={[
            'On 20 November 2026 Terence Tao listed three new results "in decreasing order of how \\"digested\\" the results currently are": an Euler blowup (a human-readable proof, also formalized in Lean), a Navier–Stokes blowup ("technically human-readable", with a Lean formalization, but needing a proper, professionally written proof), and Alpöge\'s GRH, "an (enormous) Lean-only proof". He gives no verdict on correctness, and expects "the digestion process will take some time".',
            "陶哲軒在 2026 年 11 月 20 日把三個新結果「依目前被『消化』的程度由高到低」排列：Euler 爆破（有人可讀的證明，也已在 Lean 中形式化）、Navier–Stokes 爆破（「技術上人可讀」，有 Lean 形式化，但還需要一份正式、專業寫成的證明），以及 Alpöge 的 GRH：「一個（巨大的）只有 Lean 的證明」。他沒有對正確性下判斷，並預期「消化的過程需要一些時間」。",
          ]}
        />
        <Callout
          kind="note"
          title={[
            "Status, as of 22 November 2026",
            "現況（截至 2026 年 11 月 22 日）",
          ]}
        >
          <List
            items={[
              [
                "The re-check repository (leanprover-community/riemann-hypothesis) keeps the published source exactly as its first commit: 175,187 files, 17,374,215 lines. On 21 November 2026 the Lean and Mathlib communities posted a joint statement: \"We hereby certify that both the statement and the proof of the Riemann Hypothesis are correct.\" Two independent tools (`comparator` and `con-leche --compare`) confirmed that the theorem proved is exactly Mathlib's `RiemannHypothesis`; several proof checkers, including Lean's official kernel, `con-leche` and `con-ron`, accepted the exported proof.",
                "重驗儲存庫（leanprover-community/riemann-hypothesis）的第一個 commit 原封不動保留公開的原始碼：175,187 個檔案、17,374,215 行。2026 年 11 月 21 日，Lean 與 Mathlib 社群發表聯合聲明：「我們在此認證，黎曼猜想的陳述與證明都是正確的。」兩個獨立工具（`comparator` 與 `con-leche --compare`）確認被證明的定理正是 Mathlib 的 `RiemannHypothesis`；包括 Lean 官方核心、`con-leche` 與 `con-ron` 在內的好幾個證明檢查器，都接受了匯出的證明。",
              ],
              [
                'A static scan finds no `axiom`, `sorry`, `native_decide` or `unsafe` in the text, but it does use metaprogramming that builds declarations directly, where "the kernel is the only check". That is exactly why the independent kernels matter.',
                "靜態掃描在文字裡找不到 `axiom`、`sorry`、`native_decide` 或 `unsafe`，但它用了直接建立宣告的元程式，在那裡「核心是唯一的檢查」。這正是獨立核心之所以重要的原因。",
              ],
              [
                "Andrew Sutherland (MIT) built it independently in a sandbox (all 175,187 modules, zero errors) and posted every checker's time and memory; Lean's own single-threaded kernels were still running there as of 22 November 2026, 16:20 UTC (section 5 shows the numbers).",
                "Andrew Sutherland（MIT）在沙盒中獨立建置（全部 175,187 個模組，零錯誤），並公布每個檢查器花的時間與記憶體；截至 2026 年 11 月 22 日 16:20 UTC，Lean 自己的單執行緒核心在他那裡仍在執行（第 5 節列出這些數字）。",
              ],
              [
                'The Lean check is settled; the mathematics is not yet digested. Nobody can yet explain the proof\'s ideas, and acceptance by the wider mathematical community (journals, the Clay Institute, which still lists RH as open) is a separate step. The joint statement ends: "We look forward to all the activity in the mathematical community that will help explain the new ideas in this proof."',
                "Lean 的檢查已經定案；數學還沒被消化。還沒有人能解說這份證明的想法，而更廣泛數學界的接受（期刊，以及仍把 RH 列為未解決的克雷研究所）是另一個步驟。聯合聲明的結語是：「我們期待數學界接下來的種種活動，幫忙解說這份證明裡的新想法。」",
              ],
            ]}
          />
          <SiteLink
            to={["concept", "checkers"]}
            label={["The checkers and the four questions", "檢查器與四個問題"]}
          />
        </Callout>
        <Sub
          t={[
            "25 November: the same proof in 76,000 lines",
            "11 月 25 日：同一個證明，7.6 萬行",
          ]}
        />
        <P
          t={[
            'Five days after the claim, Luke Sernau posted a rewriting of it (lsernau/grh-lean), "produced in collaboration with my colleagues at Anthropic, and Claude". Its README is plain about whose proof it is: "The proof is Levent Alpöge\'s, with Claude." It follows that proof\'s method, but many steps are proved by other arguments, and parts, mostly background, were ported and rewritten. It comes in two editions with the same five theorems (RH, and GRH for Dirichlet *L*-functions in four forms), word for word the same statements as the original:',
            "宣稱公布五天後，Luke Sernau 貼出它的改寫版（lsernau/grh-lean），「與我在 Anthropic 的同事以及 Claude 合作完成」。它的 README 清楚交代這是誰的證明：「證明是 Levent Alpöge 的，與 Claude 一起。」它沿用那份證明的方法，但許多步驟改用別的論證，有些部分（大多是背景知識）是移植過來再改寫的。它有兩個版本，證的是同樣五條定理（RH，以及 Dirichlet *L* 函數 GRH 的四種形式），陳述與原版一字不差：",
          ]}
        />
        <Figure
          caption={[
            "Squares to scale: the same five statements, proved in 17.4 million lines, then 477,000 (readable edition) and 113,000 (compact edition). Below, each edition split into its two folders: Lib holds background the repository classes as known in the literature but missing from Mathlib; New holds the set-up and the argument. Counted from the repository on 27 November 2026.",
            "正方形按比例：同樣五條陳述，先是 1740 萬行，然後是 47.7 萬行（可讀版）與 11.3 萬行（精簡版）。下方把每個版本拆成兩個資料夾：Lib 放的是儲存庫歸為文獻中已知、但 Mathlib 還沒有的背景結果；New 放的是設定與論證本身。2026 年 11 月 27 日依儲存庫計算。",
          ]}
        >
          <ShrinkingProof />
        </Figure>
        <P
          t={[
            'The split into Lib and New is the first map of where the old mathematics ends and the new begins, and it is a rough one: the repository calls it "a working classification", says the folder names "make no claim of novelty", and lets New also hold known results stated for its data. Most of either edition is background (60% and 69% of the lines); the argument itself is about 192,000 lines in the readable edition and 35,000 in the compact one. The readable edition comes with a reading guide: a reading order, a glossary that translates the Lean names into standard terms, and three main theorems (A: short forms, B: enough forms, C: integral forms are long) that a main inequality combines.',
            "把它拆成 Lib 與 New，是第一張標出舊數學在哪裡結束、新數學從哪裡開始的地圖，但它很粗略：儲存庫自己稱之為「一種工作上的分類」，說資料夾的名字「並不宣稱新穎」，New 裡也放了一些針對其資料陳述的已知結果。兩個版本的大部分都是背景（分別佔 60% 與 69% 的行數）；論證本身在可讀版約 19.2 萬行，在精簡版約 3.5 萬行。可讀版附有閱讀指南：閱讀順序、把 Lean 名稱翻成標準術語的詞彙表，以及由一條主不等式組合起來的三條主定理（A：短的形式、B：足夠多的形式、C：整的形式是長的）。",
          ]}
        />
        <Table
          head={[
            ["Check, by whom", "檢查，由誰做"],
            ["Result", "結果"],
          ]}
          rows={[
            [
              [
                "Andrew Sutherland (MIT), both editions, 25–26 Nov",
                "Andrew Sutherland（MIT），兩個版本，11 月 25–26 日",
              ],
              [
                'Both compile in a sandbox in about 33 minutes on a 16-core, 128 GB machine; every module replays through Lean\'s kernel; `lake comparator --paranoid` answers "Your solution is okay!" for the compact edition on two machines and for the readable one on a 1.5 TB machine. Its last kernel, lean4lean, peaked at 332 GB on the readable edition, so the 128 GB run gave no verdict.',
                "兩個版本都在沙盒中編譯成功，在 16 核心、128 GB 的機器上約 33 分鐘；每個模組都通過 Lean 核心重播；`lake comparator --paranoid` 對精簡版在兩台機器上、對可讀版在一台 1.5 TB 的機器上都回答「Your solution is okay!」。其中最後一個核心 lean4lean 在可讀版上記憶體峰值達 332 GB，所以 128 GB 那台沒有得出結論。",
              ],
            ],
            [
              [
                "Michael Rubinstein (Waterloo), compact edition, 26 Nov",
                "Michael Rubinstein（滑鐵盧），精簡版，11 月 26 日",
              ],
              [
                "All 794 modules compile and replay; the comparator confirms the five theorems prove exactly the challenge file's statements, accepted by six kernels (Lean's default and paranoid kernels, nanoda, lean4lean, con-leche, con-ron), after five hours, run without Comparator's sandbox.",
                "全部 794 個模組都編譯並重播成功；comparator 確認五條定理證的正是挑戰檔案裡的陳述，被六個核心接受（Lean 的預設與 paranoid 核心、nanoda、lean4lean、con-leche、con-ron），花了五小時，執行時沒有使用 Comparator 的沙盒。",
              ],
            ],
          ]}
        />
        <P
          t={[
            "Compare section 5: the original took about 8 hours and about 100 GB of memory to build, and a single-threaded run of Lean's own kernel was still going after about 45 hours. The compact edition builds in one to two hours on 12 cores with 24 GB (the README's figure), within reach of a good workstation.",
            "對照第 5 節：原版建置花了約 8 小時、約 100 GB 記憶體，而 Lean 自己的核心以單執行緒跑了約 45 小時還沒跑完。精簡版在 12 核心、24 GB 上一到兩小時就能建置（README 的數字），一台好的工作站就做得到。",
          ]}
        />
        <Callout
          kind="note"
          title={["Shorter is not yet digested", "變短，還不等於被消化"]}
        >
          <P
            t={[
              'The README says it in two sentences: "The proof has passed machine checks only, listed in each folder\'s README. No mathematician has read it through, and no paper comes with it." The compact edition is written "to be short, not to be easy to read". So on Tao\'s ladder above, the rewrite makes the Lean proof far easier to enter (from a proof nobody could open to one a reader can navigate with a guide), but it is not yet a step up the digestion ladder. It does show something Alpöge predicted in his note: "My intuition insists it will be massively simplified, likely immediately." The 21 November certification by the Lean and Mathlib communities was for the original; the shorter editions rest on the independent checks above.',
              "README 用兩句話說明：「這個證明只通過了機器檢查，列在每個資料夾的 README 裡。還沒有數學家把它從頭讀完，也沒有附帶論文。」精簡版是「為了短而寫，不是為了好讀」。所以在上面陶哲軒的階梯上，這次改寫讓 Lean 證明容易走進去得多（從一份沒人打得開的證明，變成讀者能照著指南走進去的證明），但在消化那把梯子上還沒有往上爬一級。它倒是印證了 Alpöge 在說明裡的預言：「我的直覺堅持它會被大幅簡化，很可能馬上就會。」11 月 21 日 Lean 與 Mathlib 社群的認證針對的是原版；較短的版本靠的是上面這些獨立檢查。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            {
              label: "L. Alpöge, the note (alpo.ge)",
              url: "https://alpo.ge/remark.pdf",
            },
            {
              label:
                "L. Sernau et al., lsernau/grh-lean: a shorter Lean proof, readable and compact editions (25 Nov 2026)",
              url: "https://github.com/lsernau/grh-lean",
            },
            {
              label:
                "A. Sutherland, checks of the shorter proof, both editions (MIT, updated 27 Nov 2026)",
              url: "https://math.mit.edu/~drew/shortgrh/",
            },
            {
              label:
                "M. Rubinstein, the Alpöge/Claude proof: checks of the original and of the compact edition (Waterloo)",
              url: "https://www.math.uwaterloo.ca/~mrubinst/alpoge_claude_grh/",
            },
            {
              label: "leanprover-community/riemann-hypothesis (the re-check)",
              url: "https://github.com/leanprover-community/riemann-hypothesis",
            },
            {
              label:
                "Lean and Mathlib communities, joint statement: the Riemann hypothesis (21 Nov 2026)",
              url: "https://leanprover-community.github.io/blog/posts/riemann-hypothesis/",
            },
            {
              label:
                "A. Sutherland, an independent build and check of the proof (MIT, updated 22 Nov 2026)",
              url: "https://math.mit.edu/~drew/grh/",
            },
            {
              label:
                'K. Buzzard, "...and the proof is checked in Lean" (Xena, 12 Nov 2026)',
              url: "https://xenaproject.wordpress.com/2026/11/12/and-the-proof-is-checked-in-lean/",
            },
            {
              label:
                "T. Tao, Unforced Euler singularity, unforced Navier–Stokes singularity, and the generalized Riemann hypothesis (20 Nov 2026)",
              url: "https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/",
            },
            {
              label:
                "Scientific American: Anthropic mathematician claims to prove Riemann hypothesis (20 Nov 2026)",
              url: "https://www.scientificamerican.com/article/anthropic-mathematician-claims-to-prove-riemann-hypothesis-most-famous-problem-in-all-of-math/",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 3 */}
      <Section page={PAGE} id="mirror" n={3} title={SECTIONS[2].title}>
        <CardTabs
          testid="rh-mirror-tabs"
          tabs={[
            {
              id: "mirror",
              label: ["Two claims, one stream each", "兩份宣稱，各只有一條流"],
              body: (
                <>
                  <P
                    t={[
                      "On the same day a second GRH proof was announced, written entirely by a person, and readers using AI found problems in it within hours. Put the two side by side and the roles mirror each other:",
                      "同一天還公布了另一份 GRH 證明，完全由人寫成，而借助 AI 的讀者在幾小時內就找到其中的問題。把兩者並排，角色正好互為鏡像：",
                    ]}
                  />
                  <Figure
                    caption={[
                      "The same two kinds of worker, in opposite roles. Above, the machine writes and checks and people must digest. Below, a person writes, AI helps readers hunt for gaps, and a Lean formalization, if someone made one, would settle the logic (not the statement). Status as of 22 November 2026.",
                      "同樣兩種工作者，角色互換。上面：機器寫、機器檢查，人必須消化。下面：人寫，AI 幫讀者找漏洞；如果有人把它形式化成 Lean，就能判定其中的邏輯（但不是陳述）。狀態截至 2026 年 11 月 22 日。",
                    ]}
                  >
                    <MirrorPipelines />
                  </Figure>
                  <P
                    t={[
                      'The details: Ravi Vakil posted a "hurried announcement": Alessandro Maria Masullo has a proposed proof of GRH. Brian Conrad had been looking closely at it "for months" and it was "so far looking good to him". Vakil stressed: "It is all human, with no AI." About eight hours later he added an update: "Several people have contacted me to report problems in the proposed proof, identified with the assistance of different AI models." He makes "no claim as to the correctness of the proof strategy", and all issues "need to be resolved to the satisfaction of the community".',
                      "細節：Ravi Vakil 發了一篇「匆忙的公告」：Alessandro Maria Masullo 提出了一個 GRH 的證明。Brian Conrad 已經仔細看了「好幾個月」，「到目前為止看起來不錯」。Vakil 強調：「全部是人寫的，沒有 AI。」大約八小時後他補充：「有好幾個人聯絡我，回報了這份證明中的問題，這些問題是借助不同的 AI 模型找到的。」他「不對證明策略的正確性做任何宣稱」，所有問題都「必須解決到讓數學界滿意」。",
                    ]}
                  />
                  <P
                    t={[
                      "Two lessons. First, AI is already useful *as a reader* of human mathematics, not only as a writer: it can point at the step to look at. A pointer is not a verdict, though; whether each reported problem is real is still for experts to judge. Second, each pipeline has an open stage the other one has closed. That asymmetry is the whole argument of section 4.",
                      "兩個教訓。第一，AI 已經能 *當讀者* 幫忙讀人寫的數學，而不只是當作者：它能指出該看哪一步。但指出不等於判決；每個被回報的問題是否真的成立，仍要由專家判斷。第二，每條流程都有一個階段是另一條已經完成、自己卻還開著的。這種不對稱，正是第 4 節的整個論點。",
                    ]}
                  />
                  <Callout
                    kind="note"
                    title={[
                      "One proof, two languages: one stream each",
                      "一個證明，兩種語言：各只有一條",
                    ]}
                  >
                    <P
                      t={[
                        "This site treats a proof as two mirrored streams, a natural-language proof for people and a Lean proof for the machine, linked step by step (a stated position, not a consensus). Seen that way, **as of 22 November 2026** each claim has one stream and is missing the other: Alpöge's is the Lean stream only, 17,374,215 lines, now certified by the Lean and Mathlib communities (21 November 2026), with the natural-language proof still owed; Masullo's is the natural-language stream only, with no Lean. **Update, 27 November:** both missing streams have begun. Alpöge's Lean now also exists in a 76,000-line rewrite with a reading guide (section 2), still Lean, not yet a proof for people; Masullo's draft is being formalized by a crowd, which has reached its main step (the third tab).",
                        "本站把一個證明看成兩條互為鏡像的流：寫給人看的自然語言證明，和寫給機器看的 Lean 證明，兩者一步一步相連（這是本站的立場，不是共識）。這樣看，**截至 2026 年 11 月 22 日**，兩個宣稱各只有一條、缺了另一條：Alpöge 的只有 Lean 這一條，17,374,215 行，已由 Lean 與 Mathlib 社群認證（2026 年 11 月 21 日），自然語言證明則還欠著；Masullo 的只有自然語言這一條，沒有 Lean。**11 月 27 日更新：**兩邊缺的那條流都已開始。Alpöge 的 Lean 現在也有一份 7.6 萬行、附閱讀指南的改寫版（第 2 節），但仍是 Lean，還不是寫給人看的證明；Masullo 的草稿正由一群人形式化，已經走到它的主要步驟（第三個分頁）。",
                      ]}
                    />
                  </Callout>
                  <Figure
                    caption={[
                      "Each claim as a ladder with one rail missing, so every rung is still dashed: no step is yet linked to its partner in the other language. A certified rail is still only one rail. Status as of 22 November 2026.",
                      "把每個宣稱畫成少了一根直桿的梯子，所以每根橫桿都還是虛線：還沒有任何一步連到另一種語言裡的對應步驟。通過認證的直桿，仍然只是一根。狀態截至 2026 年 11 月 22 日。",
                    ]}
                  >
                    <OneStreamEach />
                  </Figure>
                  <P
                    t={[
                      "As of 22 November 2026 the two claims stand asymmetrically: Alpöge's is certified in Lean but still owes an argument written for people, while Masullo's is written for people but must first clear correctness (known glitches, problems reported within hours). If Masullo's gaps are repaired, history may record two independent routes to the same summit, as it did for Newton and Leibniz; until then, only one has passed a check. By 27 November that \"if\" had narrowed: the formalization finds that the draft's main step is as strong as GRH itself (the third tab).",
                      "截至 2026 年 11 月 22 日，兩份宣稱的處境並不對稱：Alpöge 的已在 Lean 中通過認證，但還欠一份寫給人看的論證；Masullo 的是寫給人看的論證，但得先跨過正確性這一關（作者自承有小毛病，公布後數小時內就有讀者回報問題）。如果 Masullo 的缺口能補起來，歷史可能會像記下牛頓與萊布尼茲那樣，記下兩條通往同一座山頂的獨立路線；在那之前，只有一條通過了檢查。到 11 月 27 日，這個「如果」變窄了：形式化發現草稿的主要步驟和 GRH 本身一樣強（第三個分頁）。",
                    ]}
                  />
                  <SiteLink
                    to={["concept", "method", "two-languages"]}
                    label={["One proof, two languages", "一個證明，兩種語言"]}
                  />
                </>
              ),
            },
            {
              id: "words",
              label: ["In their own words", "他們自己的話"],
              body: <InTheirOwnWords />,
            },
            {
              id: "found",
              label: ["What readers found", "讀者找到了什麼"],
              body: <ReadersFound />,
            },
          ]}
        />
        <Sources
          items={[
            {
              label:
                "R. Vakil, Hurried announcement: Alessandro Masullo, GRH (20 Nov 2026)",
              url: "https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/",
            },
            {
              label:
                "J. Baez, Masullo on the Riemann Hypothesis (Azimuth, 22 Nov 2026)",
              url: "https://johncarlosbaez.wordpress.com/2026/11/22/masullo-on-the-riemann-hypothesis/",
            },
            {
              label:
                "R. McCorvie et al., a crowdsourced Lean formalization of Masullo's draft (GitHub)",
              url: "https://github.com/mccorvie/riemann-masullo",
            },
            {
              label:
                'riemann-masullo issue #7673: "The manuscript\'s proof of Hecke GRH is unsuccessful as written" (25 Nov 2026)',
              url: "https://github.com/mccorvie/riemann-masullo/issues/7673",
            },
            {
              label:
                "E. Naslund, A proof review of The Music of the Primes (GitHub)",
              url: "https://github.com/enaslund/rh-verification",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 4 */}
      <Section page={PAGE} id="stand" n={4} title={SECTIONS[3].title}>
        <P
          t={[
            "Two views of when a result counts as proved: the mainstream one, and this site's stated position, which is not a consensus.",
            "一個結果何時算被證明，有兩種看法：主流的看法，以及本站的立場（不是共識）。",
          ]}
        />
        <Figure
          caption={[
            "Above: how mathematics is accepted today. Below: what this site argues for. The RH claim currently has the lower-left box only; Masullo's proposal has the upper-left box only (as of 22 November 2026).",
            "上：今天數學被接受的方式。下：本站主張的方式。RH 宣稱目前只有左下那一格；Masullo 的提案只有左上那一格（截至 2026 年 11 月 22 日）。",
          ]}
        >
          <TwoPositions />
        </Figure>
        <P
          t={[
            "Most working mathematicians accept a result when a natural-language proof has passed peer review and survived scrutiny over time; a Lean proof is welcome but not required. **This site's stated position** is stronger, and it is a position, not a consensus: today a result needs *both* a natural-language proof and a machine-checked (Lean) proof, and either alone is incomplete. The natural-language proof carries the understanding; the Lean proof carries the certainty about the steps.",
            "多數在職數學家在一個結果的自然語言證明通過同儕審查、並經得起長期檢驗後就接受它；Lean 證明很歡迎，但不是必要的。**本站的立場** 更強，而且這是一個立場，不是共識：今天，一個結果需要 *同時* 有自然語言證明與機器檢查過的（Lean）證明，只有其中一個都不完整。自然語言證明承載理解；Lean 證明承載對每一步的確定性。",
          ]}
        />
        <P
          t={[
            "Who has said or found what, in the order of the events:",
            "誰說過什麼、發現過什麼，依事件的先後排列：",
          ]}
        />
        <Timeline />
        <Callout kind="note" title={["Fair to both sides", "對雙方公平"]}>
          <P
            t={[
              "The mainstream view has a strong record: nearly all of mathematics was established without proof assistants, and the errors above were found and repaired, often by humans. The cases above show that human checking can miss things for years, and that formalization can catch them; they do not show that a natural-language proof is unnecessary. A 17-million-line Lean proof that nobody understands answers the question *is it valid?* and leaves *what does it teach us?* open. That is why this site asks for both.",
              "主流觀點有很好的紀錄：幾乎所有數學都是在沒有證明助理的情況下建立的，上面的錯誤也都被發現並修補，而且常常是由人完成的。上面的案例說明人工檢查可能漏掉問題好幾年，而形式化能抓到它們；它們並沒有說明自然語言證明是不必要的。一份沒有人理解的 1700 萬行 Lean 證明回答了 *它成立嗎？*，卻留下 *它教了我們什麼？* 沒有回答。這就是本站要求兩者都要有的原因。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            {
              label: "St Andrews MacTutor: Voevodsky obituary (Princeton)",
              url: "https://mathshistory.st-andrews.ac.uk/Obituaries/Voevodsky_Princeton/",
            },
            {
              label:
                "C. Simpson, Homotopy types of strict 3-groupoids (arXiv math/9810059, 9 Oct 1998)",
              url: "https://arxiv.org/abs/math/9810059",
            },
            {
              label:
                "K. Hartnett, Will Computers Redefine the Roots of Math? (Quanta, 19 May 2015)",
              url: "https://www.quantamagazine.org/univalent-foundations-redefines-mathematics-20150519/",
            },
            {
              label:
                "V. Voevodsky, The Origins and Motivations of Univalent Foundations (IAS, 2014)",
              url: "https://www.ias.edu/ideas/2014/voevodsky-origins",
            },
            {
              label:
                "M. Rorvig, Number Theorist Fears All Published Math Is Wrong (Vice, 26 Sep 2019)",
              url: "https://www.vice.com/en/article/number-theorist-fears-all-published-math-is-wrong-actually/",
            },
            {
              label:
                "M. Harris, Silicon Reckoner, one year later (26 Jul 2022)",
              url: "https://siliconreckoner.substack.com/p/silicon-reckoner-one-year-later",
            },
            {
              label:
                "S. Gouëzel, V. Shchur, A corrected quantitative version of the Morse lemma (arXiv 1810.04579)",
              url: "https://arxiv.org/abs/1810.04579",
            },
            {
              label:
                "K. Buzzard, Fermat's Last Theorem — how it's going (Xena, 11 Dec 2024)",
              url: "https://xenaproject.wordpress.com/2024/12/11/fermats-last-theorem-how-its-going/",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 5 */}
      {/* the two 3D maps load their data and the 3D library only when the page is opened */}
      <Suspense fallback={null}>
        <RhMaps page={PAGE} n={5} title={SECTIONS[4].title} />
      </Suspense>

      {/* ------------------------------------------------------------------------------------------------ 6 */}
      <Section page={PAGE} id="more" n={6} title={SECTIONS[5].title}>
        {/* the same question on a sister site: Tensorizer's computation of the zeros (learnkit interlinks.ts) */}
        <RelatedProblems site="formalizer" id="concept/rh" />
        <P
          t={[
            '3Blue1Brown asked mathematicians "What if AI solved the Riemann Hypothesis?" (video, 22 November 2026). Their answers range from running the comparator and two or three independent kernels, to wanting a human idea and a picture, to finding inscrutable proofs fascinating. Leo de Moura, the creator of Lean, put the theme of this page in five words: "a proof is not static". The views page groups those answers into six positions.',
            "3Blue1Brown 問數學家：「如果 AI 解決了黎曼猜想呢？」（影片，2026 年 11 月 22 日）。他們的回答從「先跑 comparator，再用兩三個獨立核心」，到「想要一個人的想法、一張圖」，到「覺得難以理解的證明很迷人」都有。Lean 的創造者 Leo de Moura 把本頁的主題濃縮成一句：「證明不是靜止的」。觀點頁把這些回答整理成六種立場。",
          ]}
        />
        <p className="flex flex-wrap gap-4">
          <SiteLink
            to={["concept", "views"]}
            label={["Six views from mathematicians", "數學家的六種觀點"]}
          />
          <SiteLink
            to={["concept", "history", "riemann-2026"]}
            label={[
              "Lean history: the Riemann card",
              "Lean 歷史：黎曼猜想卡片",
            ]}
          />
          <SiteLink
            to={["concept", "provers"]}
            label={["AI provers", "AI 證明器"]}
          />
        </p>
        <p className="text-xs text-gray-500">{pick(AS_OF)}</p>
        <Sources
          items={[
            {
              label:
                '3Blue1Brown, "What if AI solved the Riemann Hypothesis?" (YouTube, 22 Nov 2026)',
              url: "https://www.youtube.com/watch?v=zqzk43bSdDI",
            },
          ]}
        />
      </Section>
    </Page>
  );
}
