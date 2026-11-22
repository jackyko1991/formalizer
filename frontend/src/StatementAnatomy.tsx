import { RichText, useLang } from "@learnkit/web";
import { useMemo, useState } from "react";
import { statementParts } from "./tactics";
import { mirrorRuns, type MirrorPair } from "./tutorial/mirror";
import { LeanRuns, MirrorLinks, NaturalRow, useStatementMirror } from "./tutorial/StatementMirror";

/**
 * The statement, shown once: the start file laid out as in the editor (`theorem hello : 2 + 2 = 4 := by`, then
 * `sorry` on the next line), every part clickable; the part you click is explained under the code. `beginner` (L1)
 * only changes the caption.
 *
 * With `mirror` (the tutorial guide's statement mirror) the statement is shown twice: the natural-language statement above, piece by
 * piece, and the Lean statement below. Each natural-language piece and its Lean words share a soft colour, joined by a thin line
 * on wide enough screens; pointing at, focusing or clicking either side lights up the pair.
 */
export default function StatementAnatomy({
  start,
  beginner,
  onPick,
  mirror,
}: {
  start: string;
  beginner: boolean;
  onPick?: () => void;
  mirror?: readonly MirrorPair[];
}) {
  const { pick } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const parts = statementParts(start);
  if (!parts) return null;
  type Piece = { code: string; title: readonly [string, string]; text: readonly [string, string]; tone: string; space?: string };
  const pieces: Piece[] = [
    ...(parts.defs
      ? [
          {
            code: parts.defs,
            title: ["a definition used by the statement", "陳述用到的定義"] as const,
            text: [
              "Before the theorem, the file defines what it talks about. `def` gives a name to a function and says how to compute it, case by case: `| 0 => …` is the value at 0, `| n + 1 => …` the value at the next number, built from the one before. This is given, not to be proved.",
              "在定理之前，檔案先定義它要談的東西。`def` 替函數取名字，並一個情況一個情況地說怎麼算：`| 0 => …` 是在 0 的值，`| n + 1 => …` 是下一個數的值，由前一個算出來。這是給定的，不需要證明。",
            ] as const,
            tone: "text-sky-800 decoration-sky-300",
          },
        ]
      : []),
    {
      code: "theorem",
      space: parts.defs ? "\n\n" : undefined,
      title: ["theorem: a promise", "theorem：一個承諾"],
      text: [
        "A promise that the statement after it is true. Lean holds you to it: the file only counts as finished when the promise is kept by a proof.",
        "承諾後面的陳述是對的。Lean 會要你兌現：只有用證明兌現了承諾，這個檔案才算完成。",
      ],
      tone: "text-violet-700 decoration-violet-300",
    },
    {
      code: parts.name,
      title: ["its name", "它的名字"],
      text: [
        `\`${parts.name}\` is the theorem's name, so later proofs can use it, like "Theorem 3" in a book.`,
        `\`${parts.name}\` 是這個定理的名字，之後的證明可以引用它，就像書裡的「定理 3」。`,
      ],
      tone: "text-gray-900 decoration-gray-300",
    },
    ...(parts.args
      ? [
          {
            code: parts.args,
            title: ["what is given", "已知的東西"] as const,
            text: [
              "Names for the things the statement talks about, each with its type: `(a b : Nat)` means \"let a and b be any natural numbers\". The theorem must hold for every choice.",
              "替陳述裡談到的東西取名字，並寫出它們的型別：`(a b : Nat)` 的意思是「設 a、b 為任意自然數」。不管怎麼選，定理都必須成立。",
            ] as const,
            tone: "text-sky-700 decoration-sky-300",
          },
        ]
      : []),
    {
      code: `: ${parts.claim}`,
      title: ["what is claimed: the test", "宣稱的內容：就是測試"],
      text: [
        "After the colon comes the claim itself. It is the test: keep it exactly as written. Lean checks your proof against this line, and a changed statement doesn't count.",
        "冒號後面就是宣稱的內容。它就是測試：要一字不改地保留。Lean 會拿你的證明對照這一行檢查，改過的陳述不算數。",
      ],
      tone: "text-teal-800 decoration-teal-400",
    },
    {
      code: ":= by",
      title: [":= by: here comes the proof", ":= by：證明如下"],
      text: [
        "`:=` means \"is proved by\", and `by` says the proof is written with tactics: instructions that tell Lean, step by step, how to prove the claim. They go on the lines below.",
        "`:=` 的意思是「由下面證明」，`by` 表示證明用戰術寫成：一條條告訴 Lean 怎麼證明的指令，寫在下面幾行。",
      ],
      tone: "text-violet-700 decoration-violet-300",
    },
    {
      code: "sorry",
      title: ["sorry: I owe you a proof", "sorry：先欠著一個證明"],
      text: [
        "A placeholder. Lean accepts the file while you work, but the theorem does not count until `sorry` is gone. Replace it: pick a tactic on the right (each says what it does), or type one.",
        "佔位用的。你還在寫時 Lean 會接受這個檔案，但只要 `sorry` 還在，定理就不算數。把它換掉：從右邊選一個戰術（每個都寫著作用），或自己輸入。",
      ],
      tone: "text-amber-700 decoration-amber-500",
      space: "\n  ",
    },
  ];
  const shown = open === null ? null : pieces[open];
  const codes = pieces.map((p) => p.code);
  const runs = useMemo(() => (mirror?.length ? mirrorRuns(codes, mirror) : null), [mirror, codes.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = useStatementMirror(mirror, start);

  return (
    <figure className="rounded-lg border border-gray-200 bg-white" data-testid="statement-anatomy">
      <figcaption className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
        {beginner
          ? pick(["New to Lean? Click any part of the file", "第一次看 Lean？點檔案裡的任何一段"])
          : pick(["The statement: click a part to see what it means", "陳述：點任何一段，看它代表什麼"])}
      </figcaption>
      <div ref={m.box} className="relative">
      {mirror?.length ? (
        <div className="px-4 pt-3">
          <NaturalRow pairs={mirror} m={m} />
          <p className="mt-3 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["Lean statement", "Lean 陳述"])}</p>
        </div>
      ) : null}
      {/* the file as in the editor: each part a button, dotted underline = "click me" */}
      <pre className={`overflow-x-auto px-4 font-mono text-[14px] leading-loose whitespace-pre-wrap ${mirror?.length ? "pt-1 pb-3" : "py-3"}`}>
        {pieces.map((piece, i) => (
          <span key={piece.code}>
            {i > 0 && (piece.space ?? " ")}
            <button
              type="button"
              onClick={() => (setOpen(open === i ? null : i), onPick?.())}
              aria-expanded={open === i}
              onFocus={() => m.setHover(runs?.[i].find((r) => r.pair !== null)?.pair ?? null)}
              onBlur={() => m.setHover(null)}
              className={`rounded px-0.5 text-left font-mono font-semibold underline decoration-dotted decoration-2 underline-offset-4 transition-colors ${piece.tone} ${
                open === i ? "bg-amber-100" : "hover:bg-gray-100"
              }`}
            >
              {runs ? <LeanRuns runs={runs[i]} m={m} /> : piece.code}
            </button>
          </span>
        ))}
      </pre>
      <MirrorLinks m={m} />
      </div>
      <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-xs leading-relaxed text-gray-700" aria-live="polite">
        {shown ? (
          <>
            <p className="font-semibold text-gray-900">
              <RichText text={pick(shown.title)} />
            </p>
            <p className="mt-0.5">
              <RichText text={pick(shown.text)} />
            </p>
          </>
        ) : (
          <p className="text-gray-500">
            {pick([
              "Each underlined part means something. Click one to see what. Then pick a tactic on the right: if it is the wrong tool, Lean tells you why, and nothing breaks.",
              "每段畫底線的部分都有意思。點一段看看它代表什麼。然後從右邊選一個戰術：用錯工具時 Lean 會告訴你原因，什麼都不會壞掉。",
            ])}
          </p>
        )}
      </div>
    </figure>
  );
}

