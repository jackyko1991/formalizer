/**
 * The statement mirror: the natural-language statement, piece by piece, and the Lean statement, each piece sharing a
 * soft colour with the Lean words that say it, joined by thin lines measured from where they sit (again on resize and
 * on a language switch). Pointing at, focusing or clicking either side lights up the pair. The tutorial's clickable
 * statement (StatementAnatomy) uses the hook and the rows; every other problem shows PlainStatementMirror: its plain
 * Lean statement box with the natural-language statement above it.
 */
import { RichText, useLang } from "@learnkit/web";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { band, mirrorRuns, type MirrorPair, type Run } from "./mirror";

type Link = { i: number; x1: number; y1: number; x2: number; y2: number };

export function useStatementMirror(pairs: readonly MirrorPair[] | undefined, key: string) {
  const { lang } = useLang();
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const lit = hover ?? pinned;
  const box = useRef<HTMLDivElement | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const measure = useCallback(() => {
    const root = box.current;
    if (!root || !pairs?.length) return setLinks([]);
    const r = root.getBoundingClientRect();
    if (r.width < 260) return setLinks([]);
    const out: Link[] = [];
    pairs.forEach((_, i) => {
      const h = root.querySelector(`[data-human="${i}"]`)?.getBoundingClientRect();
      const l = root.querySelector(`[data-lean-pair="${i}"]`)?.getBoundingClientRect();
      if (h && l) out.push({ i, x1: h.left + h.width / 2 - r.left, y1: h.bottom - r.top, x2: l.left + l.width / 2 - r.left, y2: l.top - r.top + 2 });
    });
    setLinks(out);
  }, [pairs]);
  useLayoutEffect(measure, [measure, lang, key]);
  useEffect(() => {
    const root = box.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    const later = setTimeout(measure, 300); // KaTeX and fonts settle a moment later
    return () => (ro.disconnect(), clearTimeout(later));
  }, [measure]);
  const toggle = (i: number) => setPinned((p) => (p === i ? null : i));
  const leanProps = (i: number) => ({
    "data-lean-pair": i,
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(null),
    onClick: () => toggle(i),
    style: {
      background: band(i).bg,
      boxShadow: lit === i ? `0 0 0 2px ${band(i).line}` : undefined,
      opacity: lit === null || lit === i ? 1 : 0.55,
    },
  });
  return { box, lit, pinned, setHover, toggle, leanProps, links };
}
type Mirror = ReturnType<typeof useStatementMirror>;

/** The natural-language statement, each piece a button linked to its Lean words. */
export function NaturalRow({ pairs, m }: { pairs: readonly MirrorPair[]; m: Mirror }) {
  const { pick, lang } = useLang();
  return (
    <div data-testid="statement-natural">
      <p className="mb-1 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["Natural-language statement", "自然語言陳述"])}</p>
      <p className="text-sm leading-loose text-gray-800">
        {pairs.map((pair, i) => (
          <span key={i}>
            {i > 0 && !lang.startsWith("zh") && " "}
            <button
              type="button"
              data-human={i}
              onMouseEnter={() => m.setHover(i)}
              onMouseLeave={() => m.setHover(null)}
              onFocus={() => m.setHover(i)}
              onBlur={() => m.setHover(null)}
              onClick={() => m.toggle(i)}
              aria-pressed={m.pinned === i}
              className="rounded px-1 py-0.5 text-left transition-opacity"
              style={{
                background: band(i).bg,
                boxShadow: m.lit === i ? `0 0 0 2px ${band(i).line}` : undefined,
                opacity: m.lit === null || m.lit === i ? 1 : 0.55,
              }}
            >
              <RichText text={pick(pair.human)} />
            </button>
          </span>
        ))}
      </p>
    </div>
  );
}

/** Lean text cut into runs: a pair's words are coloured and linked. */
export function LeanRuns({ runs, m }: { runs: Run[]; m: Mirror }) {
  return (
    <>
      {runs.map((run, k) =>
        run.pair === null ? (
          <span key={k}>{run.text}</span>
        ) : (
          <span key={k} {...m.leanProps(run.pair)} className="cursor-pointer rounded-sm transition-opacity">
            {run.text}
          </span>
        ),
      )}
    </>
  );
}

/** The thin lines between the two rows. */
export function MirrorLinks({ m }: { m: Mirror }) {
  // the colour bands already pair each piece with its Lean words; a line is drawn only for the pair being hovered or
  // pinned, so no lines run across the text at rest
  const shown = m.links.filter((l) => l.i === m.lit);
  if (!shown.length) return null;
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden data-testid="mirror-links">
      {shown.map((l) => (
        <line key={l.i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={band(l.i).line} strokeWidth={2} opacity={0.9} />
      ))}
    </svg>
  );
}

/** A problem outside the tutorial: the natural-language statement above its plain Lean statement box. */
export function PlainStatementMirror({ text, pairs }: { text: string; pairs: readonly MirrorPair[] }) {
  const { pick } = useLang();
  const m = useStatementMirror(pairs, text);
  const runs = useMemo(() => mirrorRuns([text], pairs)[0], [text, pairs]);
  return (
    <div ref={m.box} className="relative space-y-1 rounded-lg border border-gray-200 bg-white px-4 py-3" data-testid="statement-mirror">
      <NaturalRow pairs={pairs} m={m} />
      <p className="pt-2 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["Lean statement", "Lean 陳述"])}</p>
      <pre className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-900">
        <LeanRuns runs={runs} m={m} />
      </pre>
      <MirrorLinks m={m} />
    </div>
  );
}
