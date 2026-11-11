/** Concept ▸ The Feynman technique (#/concept/feynman[/<section>]). Lean code: lean/Formalizer/Pages/Feynman.lean. */
import { useLang } from "@learnkit/web";
import { Callout, Figure, Lean, List, P, Page, Section, SiteLink, snippet, Sources, Table, TryIn, type L } from "../kit";

const PAGE = "feynman";

const SECTIONS = [
  { id: "steps", title: ["The four steps", "四個步驟"] as L },
  { id: "roots", title: ["What Feynman actually said and did", "費曼真正說過和做過的事"] as L },
  { id: "listener", title: ["Lean, the merciless listener", "Lean：一位毫不留情的聽眾"] as L },
  { id: "example", title: ["Worked example: odd plus odd is even", "實例：奇數加奇數是偶數"] as L },
  { id: "simplify", title: ["Simplify: small lemmas and good names", "簡化：小引理與好名字"] as L },
  { id: "pitfalls", title: ["Pitfalls and a self-check", "常見陷阱與自我檢查"] as L },
];

const VAGUE = `theorem sum_is_even (a b : Nat) : (a + b) % 2 = 0 := by
  omega
-- error: omega could not prove the goal:
-- a possible counterexample may satisfy the constraints …`;

const SKIP = `theorem odd_add_odd (a b : Nat) (ha : IsOdd a) (hb : IsOdd b) : IsEven (a + b) := by
  omega
-- error: omega could not prove the goal:
-- No usable constraints found. You may need to unfold definitions so \`omega\` can see
-- linear arithmetic facts about \`Nat\` and \`Int\`, …`;

/** The four steps as a cycle, each with what it becomes in Lean. */
function StepCycle() {
  const { pick } = useLang();
  const steps: { title: L; lean: L }[] = [
    { title: ["1 · Pick a statement", "1 · 選一個陳述"], lean: ["write the theorem line", "寫下 theorem 那一行"] },
    { title: ["2 · Explain simply", "2 · 簡單地解釋"], lean: ["define every word", "定義每一個詞"] },
    { title: ["3 · Find the gaps", "3 · 找出漏洞"], lean: ["errors, goals, sorry", "錯誤、目標、sorry"] },
    { title: ["4 · Simplify", "4 · 簡化"], lean: ["small lemmas, have, names", "小引理、have、命名"] },
  ];
  const w = 140;
  const x = (i: number) => 10 + i * 160;
  return (
    <svg
      viewBox="0 0 640 210"
      className="w-full max-w-[640px]"
      role="img"
      aria-label={pick(["The four steps as a cycle", "四個步驟形成的循環"])}
    >
      <defs>
        <marker id="fz-feynman-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-gray-500" />
        </marker>
      </defs>
      {steps.map((s, i) => (
        <g key={i}>
          <rect
            x={x(i)}
            y={30}
            width={w}
            height={84}
            rx={10}
            className={i === 2 ? "fill-amber-50 stroke-amber-400" : "fill-white stroke-teal-500"}
            strokeWidth={1.5}
          />
          <text x={x(i) + w / 2} y={62} textAnchor="middle" className="fill-gray-900 text-[13px] font-semibold">
            {pick(s.title)}
          </text>
          <text x={x(i) + w / 2} y={90} textAnchor="middle" className="fill-gray-600 text-[11.5px]">
            {pick(s.lean)}
          </text>
          {i < 3 && (
            <line
              x1={x(i) + w + 2}
              y1={72}
              x2={x(i + 1) - 2}
              y2={72}
              className="stroke-gray-500"
              strokeWidth={1.5}
              markerEnd="url(#fz-feynman-arrow)"
            />
          )}
        </g>
      ))}
      <text x={320} y={18} textAnchor="middle" className="fill-gray-500 text-[11px]">
        {pick(["on paper the listener is a person; in Lean it is the checker", "在紙上，聽眾是一個人；在 Lean 裡，聽眾是檢查器"])}
      </text>
      <path
        d={`M ${x(3) + w / 2} 116 C ${x(3) + w / 2} 180, ${x(1) + w / 2} 180, ${x(1) + w / 2} 116`}
        fill="none"
        className="stroke-teal-600"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        markerEnd="url(#fz-feynman-arrow)"
      />
      <text x={(x(1) + x(3) + w) / 2} y={194} textAnchor="middle" className="fill-teal-700 text-[12px] font-medium">
        {pick(["repeat until no sorry is left", "重複，直到不剩任何 sorry"])}
      </text>
    </svg>
  );
}

export default function FeynmanConcept({ section }: { section: string | null }) {
  const s = (n: number) => ({ page: PAGE, id: SECTIONS[n - 1].id, n, title: SECTIONS[n - 1].title });
  return (
    <Page
      id={PAGE}
      title={["The Feynman technique", "費曼學習法"]}
      intro={[
        "A way of learning named after the physicist Richard Feynman: pick a topic, explain it simply, find the gaps in your explanation, simplify and repeat. This page shows where the steps come from, and why Lean is the strictest listener the technique has ever had: it lets no hand-waving through, so every gap in your understanding shows up as an error or an unsolved goal.",
        "一種以物理學家理查·費曼命名的學習方法：選一個主題、簡單地解釋它、找出解釋中的漏洞，再簡化並重複。本頁說明這些步驟從何而來，以及為什麼 Lean 是這個方法有史以來最嚴格的聽眾：它不放過任何含糊帶過的地方，所以你理解上的每個漏洞，都會變成一則錯誤或一個還沒解決的目標。",
      ]}
      sections={SECTIONS}
      focus={section}
    >
      <Section {...s(1)}>
        <P
          t={[
            "Pick something you want to understand and try to teach it, on paper, to someone who has never heard of it. Wherever your explanation stalls, or needs a word you cannot explain, you have found the edge of your understanding. As usually given, the steps are:",
            "挑一件你想弄懂的事，試著在紙上把它教給一個從沒聽過的人。解釋卡住的地方、或需要用到一個你自己也說不清楚的詞的地方，就是你理解的邊界。一般常見的步驟是：",
          ]}
        />
        <List
          ordered
          items={[
            ["**Pick a concept** and write down what you already know about it.", "**選一個概念**，寫下你已經知道的東西。"],
            [
              "**Explain it in plain words**, as if to a newcomer. No jargon you have not explained.",
              "**用白話解釋**，就像講給新手聽。不用任何你沒解釋過的術語。",
            ],
            [
              "**Find the gaps**: the places where the explanation breaks or leans on jargon. Go back to the source for exactly those points.",
              "**找出漏洞**：解釋斷掉、或得靠術語撐住的地方。針對這些地方回頭查原始資料。",
            ],
            [
              "**Simplify and use analogies**, then repeat from step 2 until the explanation runs from start to end without a gap.",
              "**簡化並使用類比**，然後從第 2 步重來，直到解釋從頭到尾沒有漏洞。",
            ],
          ]}
        />
        <P
          t={[
            "It is like checking a bridge by walking across it. Reading about a subject is looking at the bridge from the bank: it seems solid. Explaining it is walking over it plank by plank, and the missing planks show themselves under your feet.",
            "這就像走過一座橋來檢查它。讀一個主題，像是在岸邊看橋：它看起來很穩固。解釋它，則是一塊木板一塊木板地走過去，缺的那塊板子會在你腳下現形。",
          ]}
        />
        <Callout kind="note" title={["Who named it?", "誰取的名字？"]}>
          <P
            t={[
              'Feynman never wrote down a "Feynman technique". The phrase and the four-step recipe are not in his books or lectures. An early, dated use is Scott Young\'s blog post *Learn faster with the Feynman technique* (September 2011); Cal Newport and many others then wrote about it. The recipe is a fair summary of how Feynman worked, as the next section shows, but it is a modern synthesis, not his method in his own words.',
              "費曼從未寫下所謂的「費曼學習法」。這個說法和四步驟的配方，都不在他的書或講義裡。一個較早且有日期的用法，是 Scott Young 的部落格文章 *Learn faster with the Feynman technique*（2011 年 9 月）；之後 Cal Newport 和許多人也寫了相關文章。如下一節所示，這個配方相當公允地概括了費曼的工作方式，但它是現代的歸納，不是他親口說出的方法。",
            ]}
          />
        </Callout>
        <Sources
          items={[
            {
              label: "S. H. Young (September 2011), Learn faster with the Feynman technique (blog post)",
              url: "https://www.scotthyoung.com/blog/2011/09/01/learn-faster/",
            },
            {
              label: "C. Newport (2015), The Feynman notebook method (blog post)",
              url: "https://calnewport.com/the-feynman-notebook-method/",
            },
          ]}
        />
      </Section>

      <Section {...s(2)}>
        <P
          t={[
            "Four things Feynman wrote, said or did are the real roots of the technique. **Verbatim** means the original wording survives in writing; **reported** means it reaches us through someone else's account.",
            "費曼寫過、說過或做過的四件事，才是這個方法真正的根源。**原文**表示原始措辭有書面紀錄；**轉述**表示是透過他人的記述流傳下來的。",
          ]}
        />
        <List
          items={[
            [
              '**A notebook of things he did not know** (reported). As a young physicist he opened a fresh notebook, titled it "Notebook of things I don\'t know about" and worked through physics, reorganising what he knew. That is steps 1 and 3 at once. Told by his biographer James Gleick (*Genius*, 1992) and quoted by Cal Newport (2015); the exact title may differ between accounts.',
              "**一本記錄自己不懂之事的筆記本**（轉述）。年輕時，他打開一本新筆記本，題名為「我不懂的事的筆記本」（Notebook of things I don't know about），然後把物理從頭過一遍，重新整理自己知道的東西。這同時是第 1 步和第 3 步。出自他的傳記作者 James Gleick（*Genius*，1992），由 Cal Newport（2015）引用；各種說法中的確切標題可能略有不同。",
            ],
            [
              '**"What I cannot create, I do not understand"** (verbatim). This sentence was in chalk on his blackboard at Caltech when he died in February 1988; the Caltech Archives keep a photograph of the board. For him, understanding meant being able to rebuild a result yourself from the beginning, not just recognise it.',
              "**「我無法創造的，我就不理解」**（原文：What I cannot create, I do not understand）。1988 年 2 月他去世時，這句話以粉筆寫在他加州理工學院的黑板上；加州理工學院檔案館保存了那塊黑板的照片。對他而言，理解意味著能自己從頭重建一個結果，而不只是看到時認得它。",
            ],
            [
              "**The freshman lecture test** (reported). His colleague David Goodstein once asked him why spin-1/2 particles obey Fermi-Dirac statistics. Feynman said he would prepare a freshman lecture on it. A few days later he came back and admitted he could not bring it down to the freshman level, which meant, he said, that physicists did not really understand it. Failing step 2 told him something about physics, not about the students. Feynman's words as remembered by Goodstein (*Physics Today*, 1989).",
              "**大一課程的考驗**（轉述）。他的同事 David Goodstein 有一次問他，為什麼自旋 1/2 的粒子遵守費米-狄拉克統計。費曼說他會為此準備一堂大一的課。幾天後他回來承認做不到：他無法把它降到大一的程度，而他說，這代表物理學家其實並不真正理解它。第 2 步失敗，告訴他的是物理的事，而不是學生的事。這是 Goodstein 記憶中費曼的話（*Physics Today*，1989）。",
            ],
            [
              "**The Feynman Lectures on Physics** (primary source). From 1961 to 1963 he taught the introductory physics course at Caltech, building physics up from scratch for first- and second-year students. Caltech publishes the three volumes free to read online, so you can watch him build an explanation step by step.",
              "**《費曼物理學講義》**（第一手資料）。1961 到 1963 年，他在加州理工學院教授入門物理課，為大一和大二學生從零開始建立物理。加州理工學院把這三冊免費公開在網上，你可以看著他一步一步建立解釋。",
            ],
          ]}
        />
        <P
          t={[
            '"What I cannot create, I do not understand" is close to the spirit of this whole site: in Lean you do not get credit for recognising a proof, only for building one that the checker accepts.',
            "「我無法創造的，我就不理解」和這整個網站的精神很接近：在 Lean 裡，認得一個證明不算數，只有親手建出一個能通過檢查的證明才算。",
          ]}
        />
        <Sources
          items={[
            {
              label:
                "J. Gleick (1992), Genius: The Life and Science of Richard Feynman, Pantheon (the notebook), quoted in C. Newport (2015)",
              url: "https://calnewport.com/the-feynman-notebook-method/",
            },
            {
              label: "Caltech Archives: Richard Feynman's blackboard at time of his death (photograph, 1988)",
              url: "https://digital.archives.caltech.edu/collections/Photographs/1.10-3",
            },
            {
              label: "D. L. Goodstein (1989), Richard P. Feynman, Teacher, Physics Today 42(2), 70–75",
              url: "https://doi.org/10.1063/1.881195",
            },
            { label: "Goodstein (1989), free copy at CaltechAUTHORS", url: "https://authors.library.caltech.edu/62878/1/1.881195.pdf" },
            { label: "The Feynman Lectures on Physics, online edition (Caltech)", url: "https://www.feynmanlectures.caltech.edu/" },
          ]}
        />
      </Section>

      <Section {...s(3)}>
        <P
          t={[
            "The hardest part of the technique is step 3. A human listener nods politely, fills in what you skipped, and you never notice the missing plank. Lean is a different kind of listener. It knows nothing you have not told it, it never guesses what you meant, and it never nods: every step must follow from what is already on the table, or Lean says no.",
            "這個方法最難的是第 3 步。一位人類聽眾會禮貌地點頭，自動補上你跳過的部分，於是你從來沒發現缺了哪塊木板。Lean 是另一種聽眾。你沒告訴它的，它一概不知；它從不猜你的意思，也從不點頭：每一步都必須從已經擺在桌上的東西推出來，否則 Lean 就說不。",
          ]}
        />
        <Figure
          caption={[
            "The four steps as a loop. In Lean, step 3 is done for you: the checker points at every gap.",
            "四個步驟形成一個循環。在 Lean 裡，第 3 步由檢查器替你完成：它會指出每一個漏洞。",
          ]}
        >
          <StepCycle />
        </Figure>
        <Table
          head={[
            ["Step", "步驟"],
            ["On paper", "在紙上"],
            ["In Lean", "在 Lean 裡"],
          ]}
          rows={[
            [
              ["1. Pick", "1. 選題"],
              ['A sentence: "odd plus odd is even".', "一句話：「奇數加奇數是偶數」。"],
              [
                "A `theorem` line: the exact statement, with every assumption written in.",
                "一行 `theorem`：精確的陳述，每個前提都寫進去。",
              ],
            ],
            [
              ["2. Explain simply", "2. 簡單地解釋"],
              ["Plain words, no unexplained jargon.", "白話，沒有未解釋的術語。"],
              [
                'Every word is a `def`. Lean has no idea what "odd" means until you define it.',
                "每個詞都是一個 `def`。在你定義之前，Lean 完全不知道「奇數」是什麼意思。",
              ],
            ],
            [
              ["3. Find the gaps", "3. 找出漏洞"],
              ["Notice where you stall or wave your hands.", "注意自己在哪裡卡住或含糊帶過。"],
              [
                "Hand-waving becomes an **error** or an **unsolved goal**. A gap you know about but cannot fill yet is marked `sorry`.",
                "含糊帶過會變成一則**錯誤**或一個**未解決的目標**。已經知道、但暫時補不上的漏洞，就標上 `sorry`。",
              ],
            ],
            [
              ["4. Simplify", "4. 簡化"],
              ["Simpler words, an analogy.", "更簡單的說法、一個類比。"],
              [
                "Split the proof into small lemmas, state each step with `have`, and give things names that say what they mean.",
                "把證明拆成小引理，用 `have` 寫出每一步，並給東西取能說明意思的名字。",
              ],
            ],
          ]}
        />
        <Callout kind="tip" title={["`sorry` is Feynman's notebook", "`sorry` 就是費曼的筆記本"]}>
          <P
            t={[
              "`sorry` tells Lean \"I owe you this step\". The file still compiles, with a warning `declaration uses 'sorry'`, so you can lay out the whole argument first and see which steps you cannot explain yet. A list of open `sorry`s is a notebook of things you don't know about, kept by the computer.",
              "`sorry` 是在告訴 Lean「這一步我先欠著」。檔案仍然可以編譯，只會出現一則警告 `declaration uses 'sorry'`，所以你可以先把整個論證鋪出來，看看哪些步驟你還解釋不了。一份還沒補上的 `sorry` 清單，就是一本由電腦替你記的「我不懂的事的筆記本」。",
            ]}
          />
        </Callout>
        <P
          t={[
            "The page on writing a statement and then its proof goes through the same loop in more detail:",
            "「從陳述到證明」那一頁會更仔細地走一遍同樣的循環：",
          ]}
        />
        <p>
          <SiteLink to={["concept", "method"]} label={["From statement to proof", "從陳述到證明"]} />
        </p>
      </Section>

      <Section {...s(4)}>
        <P
          t={[
            '**Step 1: pick a statement and write down what you know.** "Odd plus odd is even." Examples: $3 + 5 = 8$, $7 + 7 = 14$, $1 + 9 = 10$. It feels obvious. Let us see whether we can explain it to a listener who accepts nothing on faith.',
            "**第 1 步：選一個陳述，寫下你知道的。**「奇數加奇數是偶數。」例子：$3 + 5 = 8$、$7 + 7 = 14$、$1 + 9 = 10$。感覺理所當然。來看看我們能不能把它解釋給一位什麼都不肯輕信的聽眾。",
          ]}
        />
        <P
          t={[
            'A first, hasty attempt: "the sum of `a` and `b` leaves remainder 0 when divided by 2", and ask Lean\'s arithmetic tactic `omega` to do it. Lean refuses, and it is right: with $a = 1$ and $b = 0$ the sum is $1$. The word "odd" was in my head, not on the page.',
            "第一次匆忙的嘗試：「`a` 與 `b` 的和除以 2 餘 0」，然後請 Lean 的算術戰術 `omega` 處理。Lean 拒絕了，而且它是對的：取 $a = 1$、$b = 0$，和是 $1$。「奇數」這個詞只在我腦子裡，沒有寫在紙上。",
          ]}
        />
        <Lean code={VAGUE} fails note={['The assumptions "a and b are odd" are missing.', "少了「a 和 b 是奇數」這兩個前提。"]} />
        <P
          t={[
            '**Step 2: explain it simply, which in Lean means define every word.** Core Lean has no built-in "odd", so we say what we mean: a number is even if it is twice some number $k$, and odd if it is one more than that. Two tiny examples check the definitions before we rely on them.',
            "**第 2 步：簡單地解釋，在 Lean 裡就是定義每一個詞。** Lean 核心沒有內建的「奇數」，所以我們說清楚自己的意思：一個數若是某個數 $k$ 的兩倍，就是偶數；若比那多 1，就是奇數。在依賴這些定義之前，先用兩個小例子檢查它們。",
          ]}
        />
        <Lean code={snippet("Feynman", "definitions")} />
        <P
          t={[
            "Now the claim can be stated precisely, with the assumptions written in: for any natural numbers `a` and `b`, if `a` is odd and `b` is odd, then `a + b` is even. We do not know the proof yet, so the body is `sorry`. Lean accepts the statement (it makes sense) with a warning that it is not proved.",
            "現在可以把主張精確地寫出來，前提也寫進去：對任意自然數 `a` 和 `b`，若 `a` 是奇數、`b` 是奇數，則 `a + b` 是偶數。我們還不知道證明，所以內容先寫 `sorry`。Lean 接受這個陳述（它是有意義的），同時警告它還沒被證明。",
          ]}
        />
        <Lean code={snippet("Feynman", "statement")} note={["Warning: declaration uses `sorry`.", "警告：declaration uses `sorry`。"]} />
        <P
          t={[
            '**Step 3: find the gaps.** Explain one move at a time. "`a` is odd" gives a number `j` with `a = 2 * j + 1`; `obtain` unpacks that, and the same for `b` with `k`. To show the sum is even we must *name* the half: we claim it is `j + k + 1`. What is left is a single goal, and the `sorry` marks exactly the step we have not justified.',
            "**第 3 步：找出漏洞。** 一次解釋一個動作。「`a` 是奇數」給我們一個數 `j`，使 `a = 2 * j + 1`；`obtain` 把它拆開，`b` 也一樣，得到 `k`。要說明和是偶數，我們得*說出*那一半是多少：我們主張是 `j + k + 1`。剩下的只有一個目標，而 `sorry` 標出的，正是我們還沒交代理由的那一步。",
          ]}
        />
        <Lean
          code={snippet("Feynman", "gaps")}
          note={[
            "Open goal: `a + b = 2 * (j + k + 1)`, knowing `hj` and `hk`.",
            "未解決的目標：`a + b = 2 * (j + k + 1)`，已知 `hj` 與 `hk`。",
          ]}
        />
        <P
          t={[
            "Can we skip step 3 and let a tactic do everything? Trying `omega` on the original goal fails, and its message is a Feynman lesson on its own: it cannot see inside `IsOdd`, so it asks us to unfold the definitions. The witness `j + k + 1` was the part that needed understanding; no tactic invents it here.",
            "能不能跳過第 3 步，讓戰術包辦一切？直接對原本的目標用 `omega` 會失敗，而它的訊息本身就是一堂費曼課：它看不進 `IsOdd` 裡面，所以請我們把定義展開。見證 `j + k + 1` 才是真正需要理解的部分，這裡沒有戰術會替你想出來。",
          ]}
        />
        <Lean code={SKIP} fails />
        <P
          t={[
            "**Closing the gap.** The remaining step is plain arithmetic: $a + b = (2j + 1) + (2k + 1) = 2j + 2k + 2 = 2(j + k + 1)$. That is exactly the kind of fact `omega` handles, using `hj` and `hk`. No `sorry` and no warning remain.",
            "**補上漏洞。** 剩下的一步是單純的算術：$a + b = (2j + 1) + (2k + 1) = 2j + 2k + 2 = 2(j + k + 1)$。這正是 `omega` 能處理的事，它會用上 `hj` 和 `hk`。不再有 `sorry`，也不再有警告。",
          ]}
        />
        <Lean code={snippet("Feynman", "finished")} />
        <TryIn ids={["even-sum"]} />
      </Section>

      <Section {...s(5)}>
        <P
          t={[
            "Step 4 on paper means simpler words and an analogy. In Lean it means **structure**: break the proof into pieces small enough to explain in one sentence each, and give each piece a name that says what it means. Here is an analogy for the key step: two odd numbers are each a set of pairs plus one leftover sock; put them together and the two leftover socks make one more pair.",
            "第 4 步在紙上是更簡單的說法和一個類比。在 Lean 裡則是**結構**：把證明拆成小塊，小到每一塊都能用一句話說明，再給每一塊取個能說明意思的名字。關鍵那一步的類比是這樣的：每個奇數都是好幾雙襪子再加一隻落單的；把兩個奇數放在一起，兩隻落單的襪子剛好又湊成一雙。",
          ]}
        />
        <P
          t={[
            'The "socks" fact becomes its own small lemma, `two_ones_make_a_pair`. Inside the main proof, each `have` states one step in words you could read aloud: what the sum is, and why that is a pair count.',
            "「襪子」這件事自成一個小引理 `two_ones_make_a_pair`。在主要的證明裡，每個 `have` 寫出一個你能大聲唸出來的步驟：和是多少，以及為什麼那是「幾雙」。",
          ]}
        />
        <Lean code={snippet("Feynman", "refactor")} />
        <List
          items={[
            [
              "**Small lemmas** can be checked, reused and understood on their own. If one fails, you know exactly which idea is missing.",
              "**小引理**可以單獨檢查、重複使用、單獨理解。若其中一個失敗，你就確切知道缺的是哪個想法。",
            ],
            [
              "**`have` with a name** turns a hidden step into a visible sentence; `sum_is` and `pair` say more than `h1` and `h2`.",
              "**有名字的 `have`** 把隱藏的步驟變成看得見的句子；`sum_is` 和 `pair` 比 `h1`、`h2` 說得更多。",
            ],
            [
              "**One idea per line**: the short `omega` proof is fine, but this version is the one you could explain to a newcomer.",
              "**一行一個想法**：簡短的 `omega` 證明沒有問題，但這個版本才是你能講給新手聽的那一個。",
            ],
          ]}
        />
        <p className="flex flex-wrap gap-4">
          <SiteLink to={["skills", "structure"]} label={["Coding Skills: structuring a proof", "程式技巧：組織證明"]} />
        </p>
        <TryIn ids={["calc-chain", "gauss"]} />
      </Section>

      <Section {...s(6)}>
        <P
          t={[
            'Lean catches gaps in a proof, but not every way of fooling yourself. In his 1974 Caltech commencement address Feynman said the first principle is that "you must not fool yourself", and "you are the easiest person to fool" (verbatim). Three ways that happens with Lean:',
            "Lean 抓得到證明裡的漏洞，但抓不到所有欺騙自己的方式。費曼在 1974 年加州理工學院畢業典禮演講中說，第一個原則是「你絕不能欺騙自己」（you must not fool yourself），而「你是最容易被騙的人」（you are the easiest person to fool）（原文）。用 Lean 時，常見的三種情形：",
          ]}
        />
        <P
          t={[
            '**1. "It compiles, so I understand it."** A tactic like `omega` can close a goal you could not explain. The proof is correct, but the understanding may not be yours. The test is to **read the proof back in words**. For `odd_add_odd\'`: "Write $a = 2j + 1$ and $b = 2k + 1$. Then $a + b = (2j+1) + (2k+1)$, and the two ones make a pair, so $a + b = 2(j + k + 1)$, which is twice a number, so it is even." If you cannot say a line like that, go back to step 3.',
            "**1.「能編譯，所以我懂了。」** 像 `omega` 這樣的戰術，可以收掉一個你自己解釋不了的目標。證明是對的，但理解不一定是你的。檢驗方法是**把證明用白話唸回來**。以 `odd_add_odd'` 為例：「設 $a = 2j + 1$、$b = 2k + 1$。那麼 $a + b = (2j+1) + (2k+1)$，兩個 1 湊成一對，所以 $a + b = 2(j + k + 1)$，是某個數的兩倍，因此是偶數。」如果你說不出這樣一段話，就回到第 3 步。",
          ]}
        />
        <P
          t={[
            '**2. "Lean checked it, so it says what I meant."** Lean checks that the proof proves the *statement*; whether the statement and its definitions say what you meant is your job. A tempting definition of odd, "one less than an even number", goes wrong on natural numbers, where subtraction stops at zero: it makes 0 odd. Tiny examples on your definitions catch this.',
            "**2.「Lean 檢查過了，所以它說的就是我的意思。」** Lean 檢查的是證明是否證出了這個*陳述*；陳述和定義是否說出你的本意，是你自己的責任。一個誘人的奇數定義「比偶數少 1」，在自然數上會出錯，因為自然數的減法減到 0 就停住：它讓 0 變成了奇數。在定義上試幾個小例子，就能抓到這種錯。",
          ]}
        />
        <Lean code={snippet("Feynman", "bad-definition")} />
        <P
          t={[
            "**3. A forgotten `sorry`.** A file with `sorry` still compiles, with only a warning. The gap is still a gap. Before you call something proved, ask Lean which axioms it rests on: `sorryAx` in the list means a step was skipped somewhere.",
            "**3. 忘了補的 `sorry`。** 含有 `sorry` 的檔案仍然可以編譯，只會有一則警告。漏洞依然是漏洞。在宣稱某件事已經證明之前，先問 Lean 它依賴哪些公理：清單中出現 `sorryAx`，就表示某處有一步被跳過了。",
          ]}
        />
        <Lean code={snippet("Feynman", "audit")} />
        <p>
          <SiteLink to={["skills", "verify"]} label={["Coding Skills: verifying a proof", "程式技巧：驗證證明"]} />
        </p>
        <Callout kind="tip" title={["Self-check: can you tick every box?", "自我檢查：每一項你都能打勾嗎？"]}>
          <List
            items={[
              [
                "Every word in my statement is defined, and I tried each definition on a tiny example.",
                "我的陳述裡每個詞都有定義，而且每個定義我都用小例子試過。",
              ],
              [
                "All my assumptions are written in the `theorem` line, not just in my head.",
                "所有前提都寫在 `theorem` 那一行裡，而不只在我腦子裡。",
              ],
              [
                "No `sorry` is left, and `#print axioms` does not list `sorryAx`.",
                "沒有剩下任何 `sorry`，而且 `#print axioms` 沒有列出 `sorryAx`。",
              ],
              ["I can read the proof back in plain words, one sentence per step.", "我能把證明用白話唸回來，每一步一句話。"],
              [
                "I could rebuild the proof from the statement alone, not just recognise it.",
                "只給我陳述，我也能把證明重建出來，而不只是認得它。",
              ],
            ]}
          />
        </Callout>
        <Sources
          items={[
            {
              label: "R. P. Feynman (1974), Cargo Cult Science (Caltech commencement address), Engineering & Science 37(7)",
              url: "https://calteches.library.caltech.edu/51/2/CargoCult.htm",
            },
            { label: "Theorem Proving in Lean 4 (Lean documentation)", url: "https://lean-lang.org/theorem_proving_in_lean4/" },
          ]}
        />
      </Section>
    </Page>
  );
}
