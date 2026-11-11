/**
 * The proof's dependency graph (from lean/Formalizer/DepGraph.lean via the runner), drawn left to right: the
 * problem's theorem on the left, the reader's own lemmas and definitions, the library lemmas they cite, and the axioms
 * on the right. Layered layout: a node's column is its longest distance from a theorem (axioms always last); within a
 * column, nodes follow the average position of what points at them, so edges cross less.
 */
import { useLang } from "@learnkit/web";
import { useMemo } from "react";
import { estimateWidth, H, layout, label } from "./graphLayout";
import type { Graph } from "./runner";

const STANDARD = new Set(["propext", "Quot.sound", "Classical.choice"]);
const STYLE: Record<string, { box: string; text: string; dash?: boolean }> = {
  proved: { box: "fill-green-50 stroke-green-500", text: "fill-green-900" },
  sorry: { box: "fill-amber-50 stroke-amber-500", text: "fill-amber-900" },
  def: { box: "fill-sky-50 stroke-sky-500", text: "fill-sky-900" },
  library: { box: "fill-gray-50 stroke-gray-400", text: "fill-gray-700" },
  tactics: { box: "fill-white stroke-gray-400", text: "fill-gray-600", dash: true },
  axiom: { box: "fill-violet-50 stroke-violet-500", text: "fill-violet-900" },
};
const LEGEND = ["proved", "sorry", "def", "library", "tactics", "axiom"] as const;

// the real width of a label in the graph's font (Chinese characters are wider than Latin ones)
let canvas: CanvasRenderingContext2D | null | undefined;
function measure(text: string): number {
  try {
    canvas ??= document.createElement("canvas").getContext("2d");
    if (!canvas) return estimateWidth(text);
    canvas.font = '11px "Source Code Pro", ui-monospace, SFMono-Regular, Menlo, monospace';
    return canvas.measureText(text).width;
  } catch {
    return estimateWidth(text);
  }
}

export default function DepGraph({ graph }: { graph: Graph }) {
  const { t } = useLang();
  const lemmaWord = (n: number) => t(n === 1 ? "graph.lemma" : "graph.lemmas").replace("{n}", String(n));
  const { pos, width, height, nodeOf } = useMemo(() => layout(graph, lemmaWord, measure), [graph, t]);
  const own = graph.nodes.filter((n) => n.kind === "theorem");
  const proved = own.filter((n) => n.status === "proved").length;
  const sorries = graph.nodes.filter((n) => n.status === "sorry" && n.kind !== "axiom").length;
  const axioms = graph.nodes.filter((n) => n.kind === "axiom" && n.id !== "sorryAx").map((n) => n.id);
  const odd = axioms.filter((a) => !STANDARD.has(a));
  return (
    <div className="space-y-3" data-testid="dep-graph">
      <p className="text-sm text-gray-700">
        {t("graph.count").replace("{p}", String(proved)).replace("{n}", String(own.length))}
        {sorries > 0 && <span className="font-medium text-amber-700"> · {t("graph.sorries").replace("{n}", String(sorries))}</span>}
        {" · "}
        {odd.length ? (
          <span className="font-medium text-red-700">{t("graph.axioms.other").replace("{list}", odd.join(", "))}</span>
        ) : (
          t(axioms.length ? "graph.axioms.standard" : "graph.axioms.none")
        )}
      </p>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <svg width={width} height={height} role="img" aria-label={t("tab.graph")} className="font-mono text-[11px]">
          <defs>
            <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" className="fill-gray-400" />
            </marker>
          </defs>
          {graph.edges.map((e, k) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const x1 = a.x + a.w;
            const y1 = a.y + H / 2;
            const x2 = b.x - 2;
            const y2 = b.y + H / 2;
            const mid = (x1 + x2) / 2;
            return (
              <path
                key={k}
                d={`M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`}
                className="fill-none stroke-gray-300"
                strokeWidth={1.5}
                markerEnd="url(#dg-arrow)"
              />
            );
          })}
          {[...pos].map(([id, p]) => {
            const n = nodeOf.get(id)!;
            const st = STYLE[n.status] ?? STYLE.library;
            return (
              <g key={id} data-testid="graph-node">
                <title>{`${n.id} (${t(`graph.kind.${n.status}`)})`}</title>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={H}
                  rx={6}
                  className={st.box}
                  strokeWidth={1.5}
                  strokeDasharray={st.dash ? "4 3" : undefined}
                />
                <text x={p.x + 10} y={p.y + H / 2 + 4} className={st.text}>
                  {label(n, lemmaWord)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        {LEGEND.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <svg width="14" height="10" aria-hidden>
              <rect x="1" y="1" width="12" height="8" rx="2" className={STYLE[k].box} strokeDasharray={STYLE[k].dash ? "2 2" : undefined} />
            </svg>
            {t(`graph.kind.${k}`)}
          </span>
        ))}
        {graph.hidden > 0 && <span>{t("graph.hidden").replace("{n}", String(graph.hidden))}</span>}
      </p>
    </div>
  );
}
