/**
 * Concept ▸ AI + human: the Riemann case (#/concept/rh[/<section>]). The architecture of a proof made by people and AI
 * together, and its limits, with the November 2026 Riemann hypothesis claim as the case study: what RH says (a picture),
 * the pipeline (question → curated statement → AI search → machine gates → digestion → understanding), the mirror case
 * of the same day (Masullo's all-human GRH proposal), and where the site stands next to the mainstream view (a timeline).
 * Fast-moving facts are dated "as of 22 November 2026"; sources were fetched that day. Pictures: RhFigures.tsx.
 */
import { RichText, useLang } from "@learnkit/web";
import { Callout, Figure, List, P, Page, Section, SiteLink, Sources, Table, type L, type SectionInfo } from "../kit";
import {
  CriticalStrip,
  DigestionLadder,
  MirrorPipelines,
  OneStreamEach,
  ProofArchitecture,
  TwoPositions,
} from "./RhFigures";

const PAGE = "rh";
const AS_OF: [string, string] = [
  "Facts about the claims on this page are as of 22 November 2026.",
  "本頁關於這些宣稱的事實，截至 2026 年 11 月 22 日。",
];

const SECTIONS: SectionInfo[] = [
  {
    id: "picture",
    title: ["What the Riemann hypothesis says, as a picture", "黎曼猜想在說什麼：一張圖"],
  },
  {
    id: "architecture",
    title: ["How AI and people prove together: the architecture", "AI 與人如何一起證明：整體架構"],
  },
  {
    id: "mirror",
    title: ["The mirror case, the same day", "同一天的鏡像案例"],
  },
  { id: "stand", title: ["Where we stand", "我們的立場"] },
  {
    id: "more",
    title: ["Further: six views, and the history", "延伸：六種觀點與歷史"],
  },
];

function Sub({ t }: { t: readonly [string, string] }) {
  const { pick } = useLang();
  return <p className="pt-2 text-base font-semibold text-gray-900">{pick(t)}</p>;
}

/** The stand section's timeline: who said or found what, in order of the events. */
type Kind = "found" | "leans" | "sceptic" | "slow";
const KIND: Record<Kind, { dot: string; chip: string; legend: L }> = {
  found: { dot: "bg-teal-600", chip: "bg-teal-50 text-teal-800 ring-teal-200", legend: ["formalisation found an error", "形式化找到錯誤"] },
  leans: { dot: "bg-sky-500", chip: "bg-sky-50 text-sky-800 ring-sky-200", legend: ["leans towards formal checking", "傾向形式檢查"] },
  sceptic: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-900 ring-amber-200", legend: ["sceptical", "持懷疑態度"] },
  slow: { dot: "bg-violet-500", chip: "bg-violet-50 text-violet-800 ring-violet-200", legend: ["human checking is slow; machines' help is coming", "人工檢查很慢；機器的幫助正在到來"] },
};
const EVENTS: { year: string; kind: Kind; who: L; said: L; chip: L }[] = [
  {
    year: "1989",
    kind: "leans",
    who: ["**Vladimir Voevodsky** (Fields Medal 2002)", "**Vladimir Voevodsky**（2002 年菲爾茲獎）"],
    said: [
      'In 1998 Carlos Simpson posted a preprint showing that the property claimed for the construction in the paper by Kapranov and Voevodsky on ∞-groupoids (1989) cannot hold; his argument applies "in particular … to the realization functor of Kapranov-Voevodsky". It was "a flaw that Voevodsky confirmed fifteen years later"; Voevodsky also found a mistake in a key lemma of his own paper. Voevodsky asked: "Who would ensure that I did not forget something and did not make a mistake, if even the mistakes in much more simple arguments take years to uncover?" He turned to computer-checked foundations.',
      "1998 年，Carlos Simpson 發表一份預印本，證明 Voevodsky 與 Kapranov 關於 ∞-群胚的論文（1989）為其構造所宣稱的性質不可能成立；他的論證「特別適用於 Kapranov-Voevodsky 的實現函子」。這是「Voevodsky 在十五年後確認的錯誤」；Voevodsky 也在自己論文的一個關鍵引理中發現錯誤。Voevodsky 問：「如果連簡單得多的論證中的錯誤都要好幾年才被發現，誰能確保我沒有遺漏、沒有犯錯？」他因此轉向電腦檢查的基礎。",
    ],
    chip: ["towards formal checking", "傾向形式檢查"],
  },
  {
    year: "2013 → 2019",
    kind: "found",
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
    who: ["**Kevin Buzzard** (Imperial College)", "**Kevin Buzzard**（帝國理工學院）"],
    said: [
      "In 2019: \"I think there is a non-zero chance that some of our great castles are built on sand ... But I think it's small.\" Kevin Buzzard leads the Lean formalization of Fermat's Last Theorem, and wrote the four questions of the Checkers page.",
      "2019 年：「我認為我們有些宏偉的城堡蓋在沙上的機率不是零……但我認為很小。」Kevin Buzzard 領導費馬最後定理的 Lean 形式化，也寫下檢查器頁面上的四個問題。",
    ],
    chip: ["towards formal checking", "傾向形式檢查"],
  },
  {
    year: "2022",
    kind: "sceptic",
    who: ["**Michael Harris** (Columbia)", "**Michael Harris**（哥倫比亞大學）"],
    said: [
      'A number theorist openly sceptical of the push to mechanize mathematics: his newsletter *Silicon Reckoner* asks whose interests drive it, and argues that "the future of mathematics is a political question".',
      "一位公開質疑數學機械化推動的數論學家：他的電子報 *Silicon Reckoner* 追問是誰的利益在推動它，並主張「數學的未來是一個政治問題」。",
    ],
    chip: ["sceptical", "持懷疑態度"],
  },
  {
    year: "2024",
    kind: "found",
    who: ["**Evidence:** a 1965 lemma (FLT project)", "**證據：** 一條 1965 年的引理（FLT 專案）"],
    said: [
      'While formalizing the theory of divided powers in Lean, Antoine Chambert-Loir found that Lemme 8 of Roby\'s 1965 paper "seems to be false". The argument was rescued by an alternative proof from the literature (Berthelot–Ogus), itself in need of fixes.',
      "Antoine Chambert-Loir 在 Lean 中形式化 divided powers 理論時，發現 Roby 1965 年論文的 Lemme 8「看起來是錯的」。論證後來靠文獻中的另一個證明（Berthelot–Ogus）救回，而那個證明本身也需要修正。",
    ],
    chip: ["formalization found an error", "形式化找到錯誤"],
  },
  {
    year: "20 Nov 2026",
    kind: "slow",
    who: ["**Evidence:** Masullo's GRH", "**證據：** Masullo 的 GRH"],
    said: [
      "Months of expert reading, then problems reported within hours by readers using AI (section 3). Whether they are fatal is still open, as of 22 November 2026.",
      "專家讀了好幾個月，接著借助 AI 的讀者在幾小時內回報問題（第 3 節）。這些問題是否致命仍未有定論，截至 2026 年 11 月 22 日。",
    ],
    chip: ["human checking is slow; machine help is arriving", "人工檢查很慢；機器的幫助正在到來"],
  },
];

function Timeline() {
  const { pick } = useLang();
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600" aria-label={pick(["Legend", "圖例"])}>
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${KIND[k].dot}`} />
            {pick(KIND[k].legend)}
          </li>
        ))}
      </ul>
      <ol className="relative ml-1.5 space-y-5 border-l-2 border-teal-100 pl-5" data-testid="rh-timeline">
        {EVENTS.map((e) => (
          <li key={e.year + e.kind} className="relative">
            <span aria-hidden className={`absolute top-1.5 -left-[27px] h-3 w-3 rounded-full border-2 border-white ${KIND[e.kind].dot}`} />
            <p className="text-xs font-semibold text-(--lk-accent)">{e.year}</p>
            <h3 className="font-semibold text-gray-900">
              <RichText text={pick(e.who)} />
            </h3>
            <p className="mt-1">
              <RichText text={pick(e.said)} />
            </p>
            <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] ring-1 ${KIND[e.kind].chip}`}>{pick(e.chip)}</span>
            {e.kind === "sceptic" && (
              <span className="ml-3 text-sm">
                <SiteLink to={["concept", "views", "sceptic"]} label={["The sceptic's case, point by point", "懷疑者的論點，逐點看"]} />
              </span>
            )}
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
        "On 20 November 2026 a claimed proof of the Riemann hypothesis arrived as 17 million lines of Lean, written with an AI. On the same day an all-human proposal for the generalized version was announced, and readers using AI reported problems in it within hours. Together they show how a proof made by people and machines is built, what each side is good for, and what no checker can settle. This page draws the architecture, from a beginner's picture to the research questions. Both claims are under review " +
          "(as of 22 November 2026): this page explains the process, not a verdict.",
        "2026 年 11 月 20 日，一個宣稱的黎曼猜想證明以 1700 萬行 Lean 的形式出現，是與 AI 合作寫成的。同一天，另一份完全由人寫的推廣版證明提案公布，而借助 AI 的讀者在幾小時內就回報了其中的問題。兩件事放在一起，正好說明人與機器合作的證明怎麼搭起來、各自擅長什麼，以及有什麼是任何檢查器都無法判定的。本頁把整個架構畫出來，從初學者看得懂的圖一路到研究層級的問題。兩個宣稱都仍在審查中（截至 2026 年 11 月 22 日）：本頁說明的是過程，不是判決。",
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
        <Callout kind="warn" title={["12 trillion zeros are evidence, not proof", "12 兆個零點是證據，不是證明"]}>
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
              label: "Platt & Trudgian, The Riemann hypothesis is true up to 3·10¹² (arXiv 2004.09765)",
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
            "The case: Levent Alpöge, a mathematician at Anthropic, posted a short note on 20 November 2026 saying that he and Claude had proved RH and GRH for Dirichlet *L*-functions, with the proof in Lean. A community repository now re-checks it from scratch. Stage by stage, here is who does what:",
            "案例：Anthropic 的數學家 Levent Alpöge 在 2026 年 11 月 20 日發布一份簡短說明，表示他與 Claude 證明了 RH 以及 Dirichlet *L* 函數的 GRH，證明以 Lean 寫成。社群的一個儲存庫正在從頭重驗。逐階段來看誰做什麼：",
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
              ["Deciding that the Lean says what Riemann meant", "判斷 Lean 說的就是黎曼的意思"],
              ["Nothing: a typechecker cannot know your intention", "沒有：型別檢查器無法知道你的意圖"],
            ],
            [
              ["Search", "搜尋"],
              ["Choosing directions, splitting, knowing when to stop", "選方向、拆問題、知道何時停"],
              ["Trying millions of steps; producing an artefact no team could type", "嘗試上百萬步；產出任何團隊都打不完的成品"],
            ],
            [
              ["Gates", "關卡"],
              ["Q1, and deciding what the check may trust", "Q1，以及決定檢查可以信任什麼"],
              [
                "Q2–Q4: replaying every step exactly, again and again, on independent kernels",
                "Q2–Q4：在獨立核心上精確地、一再地重播每一步",
              ],
            ],
            [
              ["Digestion", "消化"],
              ["Finding the idea, judging what is new and what it is for", "找出想法，判斷新在哪裡、有什麼用"],
              ["Re-checking every shortened or rewritten piece for free", "免費重驗每一段縮短或改寫過的內容"],
            ],
          ]}
        />
        <Sub t={["How digested is it? Tao's ladder", "消化到什麼程度？陶哲軒的階梯"]} />
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
        <Callout kind="note" title={["Status, as of 22 November 2026", "現況（截至 2026 年 11 月 22 日）"]}>
          <List
            items={[
              [
                "The re-check repository (leanprover-community/riemann-hypothesis) keeps the published source exactly as its first commit: 175,187 files, 17,374,215 lines. Its comparator run is in progress; the result is not yet posted.",
                "重驗儲存庫（leanprover-community/riemann-hypothesis）的第一個 commit 原封不動保留公開的原始碼：175,187 個檔案、17,374,215 行。它的 comparator 檢查正在執行中，結果尚未公布。",
              ],
              [
                'A static scan finds no `axiom`, `sorry`, `native_decide` or `unsafe` in the text, but it does use metaprogramming that builds declarations directly, where "the kernel is the only check". That is exactly why the independent kernels matter.',
                "靜態掃描在文字裡找不到 `axiom`、`sorry`、`native_decide` 或 `unsafe`，但它用了直接建立宣告的元程式，在那裡「核心是唯一的檢查」。這正是獨立核心之所以重要的原因。",
              ],
              [
                "Andrew Sutherland (MIT) reported compiling the code independently (Scientific American). The Clay Institute still lists RH as open.",
                "Andrew Sutherland（MIT）表示他獨立編譯了這份程式碼（Scientific American 報導）。克雷研究所仍把 RH 列為未解決。",
              ],
            ]}
          />
          <SiteLink to={["concept", "checkers"]} label={["The checkers and the four questions", "檢查器與四個問題"]} />
        </Callout>
        <Sources
          items={[
            {
              label: "L. Alpöge, the note (alpo.ge)",
              url: "https://alpo.ge/remark.pdf",
            },
            {
              label: "leanprover-community/riemann-hypothesis (the re-check)",
              url: "https://github.com/leanprover-community/riemann-hypothesis",
            },
            {
              label: 'K. Buzzard, "...and the proof is checked in Lean" (Xena, 12 Nov 2026)',
              url: "https://xenaproject.wordpress.com/2026/11/12/and-the-proof-is-checked-in-lean/",
            },
            {
              label:
                "T. Tao, Unforced Euler singularity, unforced Navier–Stokes singularity, and the generalized Riemann hypothesis (20 Nov 2026)",
              url: "https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/",
            },
            {
              label: "Scientific American: Anthropic mathematician claims to prove Riemann hypothesis (20 Nov 2026)",
              url: "https://www.scientificamerican.com/article/anthropic-mathematician-claims-to-prove-riemann-hypothesis-most-famous-problem-in-all-of-math/",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 3 */}
      <Section page={PAGE} id="mirror" n={3} title={SECTIONS[2].title}>
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
        <Callout kind="note" title={["One proof, two languages: one stream each", "一個證明，兩種語言：各只有一條"]}>
          <P
            t={[
              "This site treats a proof as two mirrored streams, a natural-language proof for people and a Lean proof for the machine, linked step by step (a stated position, not a consensus). Seen that way, **as of 22 November 2026** each claim has one stream and is missing the other: Alpöge's is the Lean stream only, 17,374,215 lines with no natural-language proof yet; Masullo's is the natural-language stream only, with no Lean.",
              "本站把一個證明看成兩條互為鏡像的流：寫給人看的自然語言證明，和寫給機器看的 Lean 證明，兩者一步一步相連（這是本站的立場，不是共識）。這樣看，**截至 2026 年 11 月 22 日**，兩個宣稱各只有一條、缺了另一條：Alpöge 的只有 Lean 這一條，17,374,215 行，還沒有自然語言證明；Masullo 的只有自然語言這一條，沒有 Lean。",
            ]}
          />
        </Callout>
        <Figure
          caption={[
            "Each claim as a ladder with one rail missing, so every rung is still dashed: no step is yet linked to its partner in the other language. Status as of 22 November 2026.",
            "把每個宣稱畫成少了一根直桿的梯子，所以每根橫桿都還是虛線：還沒有任何一步連到另一種語言裡的對應步驟。狀態截至 2026 年 11 月 22 日。",
          ]}
        >
          <OneStreamEach />
        </Figure>
        <SiteLink to={["concept", "method", "two-languages"]} label={["One proof, two languages", "一個證明，兩種語言"]} />
        <Sources
          items={[
            {
              label: "R. Vakil, Hurried announcement: Alessandro Masullo, GRH (20 Nov 2026)",
              url: "https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/",
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
              label: "C. Simpson, Homotopy types of strict 3-groupoids (arXiv math/9810059, 9 Oct 1998)",
              url: "https://arxiv.org/abs/math/9810059",
            },
            {
              label: "K. Hartnett, Will Computers Redefine the Roots of Math? (Quanta, 19 May 2015)",
              url: "https://www.quantamagazine.org/univalent-foundations-redefines-mathematics-20150519/",
            },
            {
              label: "V. Voevodsky, The Origins and Motivations of Univalent Foundations (IAS, 2014)",
              url: "https://www.ias.edu/ideas/2014/voevodsky-origins",
            },
            {
              label: "M. Rorvig, Number Theorist Fears All Published Math Is Wrong (Vice, 26 Sep 2019)",
              url: "https://www.vice.com/en/article/number-theorist-fears-all-published-math-is-wrong-actually/",
            },
            {
              label: "M. Harris, Silicon Reckoner, one year later (26 Jul 2022)",
              url: "https://siliconreckoner.substack.com/p/silicon-reckoner-one-year-later",
            },
            {
              label: "S. Gouëzel, V. Shchur, A corrected quantitative version of the Morse lemma (arXiv 1810.04579)",
              url: "https://arxiv.org/abs/1810.04579",
            },
            {
              label: "K. Buzzard, Fermat's Last Theorem — how it's going (Xena, 11 Dec 2024)",
              url: "https://xenaproject.wordpress.com/2024/12/11/fermats-last-theorem-how-its-going/",
            },
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------------------------------------ 5 */}
      <Section page={PAGE} id="more" n={5} title={SECTIONS[4].title}>
        <P
          t={[
            '3Blue1Brown asked mathematicians "What if AI solved the Riemann Hypothesis?" (video, 22 November 2026). Their answers range from running the comparator and two or three independent kernels, to wanting a human idea and a picture, to finding inscrutable proofs fascinating. Leo de Moura, the creator of Lean, put the theme of this page in five words: "a proof is not static". The views page groups those answers into six positions.',
            "3Blue1Brown 問數學家：「如果 AI 解決了黎曼猜想呢？」（影片，2026 年 11 月 22 日）。他們的回答從「先跑 comparator，再用兩三個獨立核心」，到「想要一個人的想法、一張圖」，到「覺得難以理解的證明很迷人」都有。Lean 的創造者 Leo de Moura 把本頁的主題濃縮成一句：「證明不是靜止的」。觀點頁把這些回答整理成六種立場。",
          ]}
        />
        <p className="flex flex-wrap gap-4">
          <SiteLink to={["concept", "views"]} label={["Six views from mathematicians", "數學家的六種觀點"]} />
          <SiteLink to={["concept", "history", "riemann-2026"]} label={["Lean history: the Riemann card", "Lean 歷史：黎曼猜想卡片"]} />
          <SiteLink to={["concept", "provers"]} label={["AI provers", "AI 證明器"]} />
        </p>
        <p className="text-xs text-gray-500">{pick(AS_OF)}</p>
        <Sources
          items={[
            {
              label: '3Blue1Brown, "What if AI solved the Riemann Hypothesis?" (YouTube, 22 Nov 2026)',
              url: "https://www.youtube.com/watch?v=zqzk43bSdDI",
            },
          ]}
        />
      </Section>
    </Page>
  );
}
