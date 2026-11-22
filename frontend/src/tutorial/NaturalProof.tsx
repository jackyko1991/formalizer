/**
 * The natural-language proof, the left half of the proof mirror: the paper steps in order, each linked to the live Proof.lean on
 * the right. A step already written in Lean shares its colour and number with those editor lines (pointing at it lights
 * them up and scrolls to them; the cursor on such a line lights the step). A step not written yet says so, shows the
 * goal it starts from, and leads to the `sorry` the tactics fill.
 */
import { plainText, RichText, useLang } from "@learnkit/web";
import { band } from "./mirror";

type L = readonly [string, string];

export const MIRROR_LEGEND: L = [
  "A proof in two languages: natural language for people, Lean for the machine. Neither alone is complete; together they are.",
  "一個證明，兩種語言：自然語言給人讀，Lean 給機器查。單獨任一邊都不完整，合在一起才完整。",
];

export function MirrorLegend() {
  const { pick } = useLang();
  return (
    <p className="rounded-md bg-teal-50/70 px-3 py-1.5 text-xs leading-snug text-teal-900" data-testid="mirror-legend">
      ⇄ {pick(MIRROR_LEGEND)}
    </p>
  );
}

export default function NaturalProof({
  steps,
  located,
  active,
  pinned,
  onHover,
  onPin,
  onGoSorry,
  hasSorry,
}: {
  steps: readonly { text: L; goal?: string }[];
  /** each step's lines in the editor now, or null when not written yet */
  located: readonly (number[] | null)[];
  active: number | null;
  pinned: number | null;
  onHover: (i: number | null) => void;
  onPin: (i: number | null) => void;
  /** select the target sorry in the editor */
  onGoSorry: () => void;
  hasSorry: boolean;
}) {
  const { pick } = useLang();
  return (
    <section className="space-y-2" data-testid="natural-proof">
      <p className="text-xs font-semibold text-gray-600">
        {pick(["The natural-language proof", "自然語言證明"])}
        <span className="ml-2 font-normal text-gray-400">
          {pick(["point at a step: its Lean lines light up in the editor", "指向一步：編輯器裡對應的 Lean 會亮起來"])}
        </span>
      </p>
      <ol className="space-y-1.5">
        {steps.map((step, i) => {
          const at = located[i];
          const on = active === i;
          const lines = at ? (at.length > 1 ? `${at[0]}–${at[at.length - 1]}` : `${at[0]}`) : null;
          return (
            <li key={i}>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={pinned === i}
                data-testid="natural-step"
                data-written={at ? "yes" : "no"}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(i)}
                onBlur={() => onHover(null)}
                onClick={() => onPin(pinned === i ? null : i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPin(pinned === i ? null : i))}
                className="flex cursor-pointer gap-2 rounded-md border-l-4 bg-white px-2.5 py-1.5 text-xs leading-relaxed text-gray-800 ring-1 ring-gray-200 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-(--lk-accent)"
                style={{
                  borderLeftColor: band(i).line,
                  background: on || pinned === i ? band(i).bg : undefined,
                  boxShadow: on ? `0 0 0 1px ${band(i).line}` : undefined,
                }}
              >
                <span
                  className="mt-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1 text-[10px] font-bold text-white"
                  style={{ background: band(i).line }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <RichText text={pick(step.text)} />
                  <span className="mt-0.5 block text-[10px]">
                    {lines ? (
                      <span className="text-gray-500">{pick([`In Lean: Proof.lean, line ${lines}`, `Lean：Proof.lean 第 ${lines} 行`])}</span>
                    ) : (
                      <span className="text-amber-800" data-testid="step-not-written">
                        {pick(["Not written in Lean yet", "還沒寫成 Lean"])}
                        {hasSorry && (
                          <>
                            {" · "}
                            <button
                              type="button"
                              onClick={(e) => (e.stopPropagation(), onGoSorry())}
                              className="font-medium text-(--lk-accent) hover:underline"
                              data-testid="step-go-sorry"
                            >
                              {pick(["its place is the `sorry` →", "它的位置是 `sorry` →"]).replace(/`/g, "")}
                            </button>
                          </>
                        )}
                      </span>
                    )}
                  </span>
                  {!at && step.goal && (on || pinned === i) && (
                    <span className="mt-1 block">
                      <span className="text-[10px] text-gray-500">{pick(["The goal there:", "那裡的目標："])}</span>
                      <pre className="mt-0.5 rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[11px] whitespace-pre-wrap text-gray-900">
                        {step.goal}
                      </pre>
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** A step as plain text (for the AI assistant's context). */
export const stepWords = (text: string) => plainText(text).replace(/\$/g, "");
