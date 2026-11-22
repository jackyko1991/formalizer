/**
 * The two-layer map under a problem's or project's results (problemMap.ts has the data):
 *   1. "What the statement rests on": the closure of the statement down to Lean's axioms;
 *   2. "How the proof is built": the proof's dependency graph (the reader's latest check, or the reference proof).
 * Feynman order: one sentence saying what the layer is, the picture, then the details (counts, axioms, legend).
 * The picture is 3D (learnkit's Graph3D, three.js loaded on demand) where WebGL works, motion is welcome and the
 * screen is wide; otherwise, and on request, the 2D dependency graph (DepGraph.tsx).
 * `fill` (the Problems page's Map tab): the controls on one line, the sentence on one line (all of it, the counts and
 * the legend behind ⓘ), and the picture filling the rest of the box.
 */
import { Graph3D, RichText, useLang, type G3Link, type G3Node } from "@learnkit/web";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import DepGraph from "./DepGraph";
import { useViewMode } from "./mathlib/hooks";
import {
  colourOf,
  COLOURS,
  depthOf,
  KIND_WORDS,
  neighbours,
  proofNodes,
  sizeOf,
  statementAs2D,
  statementNodes,
  type L,
  type MapNode,
  type StatementGraph,
} from "./problemMap";
import type { Graph } from "./runner";

export type Layer = "statement" | "proof";
export interface ProofSource {
  key: string;
  label: L;
  /** a word or two for the one-line controls (fill) */
  short?: L;
  graph: Graph;
}

const LAYERS: Record<Layer, { name: L; say: L }> = {
  statement: {
    name: ["What the statement rests on", "陳述建立在什麼上"],
    say: [
      "Every definition the statement's words unfold to, step by step down to Lean's axioms. Only the statement: not its proof.",
      "陳述裡的每個字展開後用到的定義，一步步往下直到 Lean 的公理。只看陳述，不含證明。",
    ],
  },
  proof: {
    name: ["How the proof is built", "證明怎麼組成"],
    say: [
      "The theorem, the lemmas and definitions its proof uses, and the axioms at the bottom.",
      "定理、它的證明用到的引理與定義，以及最底層的公理。",
    ],
  },
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function TwoLayerMap({
  statement,
  statementNote,
  proofs,
  proofNote,
  initial = "statement",
  height = 380,
  testId = "two-layer-map",
  fill = false,
}: {
  /** the statement layer, or null while it loads / when there is none (statementNote says why) */
  statement: StatementGraph | null;
  statementNote?: L | string | null;
  /** the proof layer's graphs: the reader's latest check first, then the reference proof (when it may be shown) */
  proofs: ProofSource[];
  /** shown when there is no proof graph yet */
  proofNote?: L;
  initial?: Layer;
  height?: number;
  testId?: string;
  /** fill the parent's height: one line of controls, the picture below, the details behind ⓘ */
  fill?: boolean;
}) {
  const { pick } = useLang();
  const [layer, setLayer] = useState<Layer>(initial);
  const [source, setSource] = useState<string | null>(null);
  const [mode, setMode, webgl] = useViewMode();
  const proof = proofs.find((p) => p.key === source) ?? proofs[0] ?? null;
  const say = (x: L | string) => (typeof x === "string" ? x : pick(x));

  if (fill)
    return (
      <FilledMap
        {...{ layer, setLayer, mode, setMode, webgl, proofs, proof, setSource, statement, testId }}
        empty={
          layer === "statement"
            ? statementNote
              ? say(statementNote)
              : pick(["Loading the map…", "載入地圖中…"])
            : pick(proofNote ?? ["Check a proof to see how it is built.", "檢查一個證明，就能看到它怎麼組成。"])
        }
      />
    );

  return (
    <div className="space-y-2" data-testid={testId} data-layer={layer}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex overflow-hidden rounded-md border border-gray-300 text-xs" role="tablist" aria-label={pick(["Map layer", "地圖圖層"])}>
          {(["statement", "proof"] as const).map((l, k) => (
            <button
              key={l}
              role="tab"
              aria-selected={layer === l}
              onClick={() => setLayer(l)}
              data-testid={`map-layer-${l}`}
              className={`px-2.5 py-1 ${layer === l ? "bg-(--lk-accent) text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {k + 1}. {pick(LAYERS[l].name)}
            </button>
          ))}
        </span>
        <span className="ml-auto flex overflow-hidden rounded-md border border-gray-300 text-xs">
          {(["3d", "tree"] as const).map((m) => (
            <button
              key={m}
              disabled={m === "3d" && !webgl}
              onClick={() => setMode(m)}
              data-testid={`map-view-${m}`}
              title={m === "3d" && !webgl ? pick(["This browser has no WebGL", "這個瀏覽器不支援 WebGL"]) : undefined}
              className={`px-2.5 py-1 ${mode === m ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"} disabled:opacity-40`}
            >
              {m === "3d" ? "3D" : "2D"}
            </button>
          ))}
        </span>
      </div>
      <p className="text-sm text-gray-700" data-testid="map-sentence">
        {pick(LAYERS[layer].say)}
      </p>

      {layer === "statement" ? (
        statement ? (
          <StatementLayer graph={statement} mode={mode} height={height} />
        ) : (
          <p className="text-xs text-gray-500" data-testid="map-empty">
            {statementNote ? say(statementNote) : pick(["Loading the map…", "載入地圖中…"])}
          </p>
        )
      ) : proof ? (
        <>
          {proofs.length > 1 && (
            <div className="flex flex-wrap gap-1 text-xs" data-testid="map-proof-sources">
              {proofs.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSource(p.key)}
                  data-testid={`map-proof-${p.key}`}
                  className={`rounded-full px-2.5 py-0.5 ring-1 ${p === proof ? "bg-teal-50 text-teal-900 ring-teal-400" : "text-gray-600 ring-gray-200 hover:bg-gray-50"}`}
                >
                  {pick(p.label)}
                </button>
              ))}
            </div>
          )}
          <ProofLayer key={proof.key} graph={proof.graph} mode={mode} height={height} />
        </>
      ) : (
        <p className="text-xs text-gray-500" data-testid="map-empty">
          {pick(proofNote ?? ["Check a proof to see how it is built.", "檢查一個證明，就能看到它怎麼組成。"])}
        </p>
      )}
    </div>
  );
}

function StatementLayer({ graph, mode, height, bare = false }: { graph: StatementGraph; mode: "3d" | "tree"; height: number; bare?: boolean }) {
  const nodes = useMemo(() => statementNodes(graph), [graph]);
  const flat = useMemo(() => statementAs2D(graph), [graph]);
  return (
    <>
      {mode === "3d" ? (
        <Map3D nodes={nodes} edges={graph.edges} height={height} testId="map-3d-statement" />
      ) : (
        <DepGraph graph={flat} variant="statement" />
      )}
      {!bare && <StatementDetails graph={graph} />}
      {!bare && mode === "3d" && <Legend nodes={nodes} />}
    </>
  );
}

/** "Drawn: 40 of the 1,234 declarations it rests on, up to 9 steps down. Axioms: …" */
function StatementDetails({ graph }: { graph: StatementGraph }) {
  const { pick } = useLang();
  const axioms = graph.axioms.length ? graph.axioms.map((a) => `\`${a}\``).join(", ") : null;
  const depth = depthOf(graph);
  return (
      <p className="text-xs text-gray-600" data-testid="map-details">
        <RichText
          text={pick([
            `Drawn: ${graph.nodes.length} of the ${fmt(graph.closure)}${graph.truncated ? "+" : ""} declarations it rests on, up to ${depth} steps down (instances and generated helpers are folded into their users). ${
              axioms ? `Axioms: ${axioms}.` : "No axiom: what it says is built from definitions alone."
            }`,
            `畫出：它所依靠的 ${fmt(graph.closure)}${graph.truncated ? "+" : ""} 個宣告中的 ${graph.nodes.length} 個，最深 ${depth} 層（實例與自動產生的輔助宣告併入使用它們的宣告）。${
              axioms ? `公理：${axioms.replaceAll(", ", "、")}。` : "沒有公理：它說的內容只由定義組成。"
            }`,
          ])}
        />
      </p>
  );
}

function ProofLayer({ graph, mode, height, bare = false }: { graph: Graph; mode: "3d" | "tree"; height: number; bare?: boolean }) {
  const nodes = useMemo(() => proofNodes(graph), [graph]);
  return mode === "3d" ? (
    <>
      <Map3D nodes={nodes} edges={graph.edges} height={height} testId="map-3d-proof" />
      {!bare && <Legend nodes={nodes} />}
    </>
  ) : (
    <DepGraph graph={graph} />
  );
}

/** The 3D picture of either layer, with a card at the pointer: name, kind, module, what it uses and what uses it. */
function Map3D({ nodes, edges, height, testId }: { nodes: MapNode[]; edges: { from: string; to: string }[]; height: number; testId: string }) {
  const { pick } = useLang();
  const index = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);
  const near = useMemo(() => neighbours(edges), [edges]);
  const g3nodes = useMemo<G3Node[]>(() => nodes.map((n, i) => ({ id: i, label: n.label, color: colourOf(n), val: sizeOf(n) })), [nodes]);
  const links = useMemo<G3Link[]>(() => {
    const out: G3Link[] = [];
    for (const e of edges) {
      const a = index.get(e.from);
      const b = index.get(e.to);
      if (a === undefined || b === undefined) continue;
      const fromRoot = nodes[a].root;
      out.push(fromRoot ? { source: a, target: b, color: "rgba(45,212,191,0.75)", width: 0.8 } : { source: a, target: b });
    }
    return out;
  }, [edges, index, nodes]);
  const [sel, setSel] = useState<number | null>(null);
  const list = (names: string[] | undefined) => {
    if (!names?.length) return pick(["nothing drawn", "圖中沒有"]);
    const shown = names.slice(0, 6).join(", ");
    return names.length > 6 ? `${shown} … (+${names.length - 6})` : shown;
  };
  const card = (i: number) => {
    const n = nodes[i];
    if (!n) return null;
    const kind = n.group === "tactics" ? KIND_WORDS.tactics : n.group === "library" && !n.module ? KIND_WORDS.library : (KIND_WORDS[n.kind] ?? KIND_WORDS.other);
    return (
      <div className="space-y-1" data-testid="map-card">
        <p className="font-mono text-[13px] font-semibold break-all text-gray-900">{n.label}</p>
        <p>
          <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: colourOf(n) }} /> {pick(kind)}
          {n.root && ` · ${pick(["the statement", "陳述"])}`}
          {n.open && ` · ${pick(["has sorry", "含 sorry"])}`}
        </p>
        {n.group !== "tactics" && (
          <p className="text-gray-500">
            {n.module ? <span className="font-mono">{n.module}</span> : n.group === "own" ? pick(["this file", "這個檔案"]) : n.group === "axiom" || n.group === "sorry" ? pick(["Lean's foundations", "Lean 的基礎"]) : pick(["Lean's or Mathlib's library", "Lean 或 Mathlib 的函式庫"])}
          </p>
        )}
        <p>
          <span className="text-gray-500">{pick(["Uses:", "用到："])}</span> <span className="font-mono">{list(near.uses.get(n.id))}</span>
        </p>
        <p>
          <span className="text-gray-500">{pick(["Used by:", "被誰用到："])}</span> <span className="font-mono">{list(near.usedBy.get(n.id))}</span>
        </p>
      </div>
    );
  };
  return (
    <Graph3D
      nodes={g3nodes}
      links={links}
      focus={sel}
      onSelect={setSel}
      height={height}
      testId={testId}
      card={card}
      side={sel !== null ? <div className="text-xs text-gray-700">{card(sel)}</div> : undefined}
    />
  );
}

function Legend({ nodes }: { nodes: MapNode[] }) {
  const { pick } = useLang();
  const has = (f: (n: MapNode) => boolean) => nodes.some(f);
  const rows: [string, L, boolean][] = [
    [COLOURS.own, ["the statement and your own declarations", "陳述與你自己的宣告"], has((n) => n.group === "own" && !n.open)],
    [COLOURS.open, ["yours, still with sorry", "你的、還有 sorry"], has((n) => n.open)],
    [COLOURS.core, ["Lean's library", "Lean 的函式庫"], has((n) => n.group === "library" && !n.module.startsWith("Mathlib"))],
    [COLOURS.mathlib, ["Mathlib (a shade of blue per area)", "Mathlib（每個領域一種藍）"], has((n) => n.module.startsWith("Mathlib"))],
    [COLOURS.tactics, ["lemmas the tactics used", "戰術用到的引理"], has((n) => n.group === "tactics")],
    [COLOURS.axiom, ["axiom", "公理"], has((n) => n.group === "axiom")],
    [COLOURS.sorry, ["sorryAx: a gap", "sorryAx：還沒補上的缺口"], has((n) => n.group === "sorry")],
  ];
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500" data-testid="map-legend">
      {rows
        .filter((r) => r[2])
        .map(([c, l]) => (
          <span key={l[0]} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            {pick(l)}
          </span>
        ))}
      <span>{pick(["Arrows point to what a declaration uses. Hover for its card; ⤢ to enlarge.", "箭頭指向宣告用到的東西。滑過看卡片；⤢ 放大。"])}</span>
    </p>
  );
}

/** The Map tab's layout: one line of small controls, one line of words (ⓘ opens the rest), the picture below. */
function FilledMap({
  layer,
  setLayer,
  mode,
  setMode,
  webgl,
  proofs,
  proof,
  setSource,
  statement,
  testId,
  empty,
}: {
  layer: Layer;
  setLayer: (l: Layer) => void;
  mode: "3d" | "tree";
  setMode: (m: "3d" | "tree") => void;
  webgl: boolean;
  proofs: ProofSource[];
  proof: ProofSource | null;
  setSource: (key: string) => void;
  statement: StatementGraph | null;
  testId: string;
  empty: string;
}) {
  const { pick } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(260);
  const [about, setAbout] = useState(false);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setH(Math.max(160, Math.floor(el.clientHeight)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const seg = "flex shrink-0 overflow-hidden rounded border border-gray-300";
  const short: Record<Layer, L> = { statement: ["Statement's deps", "陳述的依賴"], proof: ["Proof's deps", "證明的依賴"] };
  const drawn = layer === "statement" ? statement : (proof?.graph ?? null);
  // a graph of one or two declarations is a card, not a 3D scene (a lone sphere would fill the box)
  const tiny = !!drawn && drawn.nodes.length <= 2;
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid={testId} data-layer={layer}>
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap [scrollbar-width:none]" data-testid="map-controls">
        <span className={seg} role="tablist" aria-label={pick(["Map layer", "地圖圖層"])}>
          {(["statement", "proof"] as const).map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={layer === l}
              onClick={() => setLayer(l)}
              data-testid={`map-layer-${l}`}
              title={`${pick(LAYERS[l].name)}: ${pick(LAYERS[l].say)}`}
              className={`px-2 py-0.5 ${layer === l ? "bg-(--lk-accent) text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {pick(short[l])}
            </button>
          ))}
        </span>
        {layer === "proof" && proofs.length > 1 && (
          <span className={seg} data-testid="map-proof-sources">
            {proofs.map((p) => (
              <button
                key={p.key}
                onClick={() => setSource(p.key)}
                data-testid={`map-proof-${p.key}`}
                className={`px-2 py-0.5 ${p === proof ? "bg-teal-50 font-medium text-teal-900" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                {pick(p.short ?? p.label)}
              </button>
            ))}
          </span>
        )}
        <button
          type="button"
          onClick={() => setAbout((a) => !a)}
          aria-expanded={about}
          data-testid="map-about"
          title={pick(LAYERS[layer].say)}
          className={`ml-auto shrink-0 rounded px-1.5 py-0.5 ${about ? "bg-gray-800 text-white" : "text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50"}`}
        >
          ⓘ {pick(["Key", "圖例"])}
        </button>
        <span className={seg}>
          {(["3d", "tree"] as const).map((m) => (
            <button
              key={m}
              disabled={m === "3d" && !webgl}
              onClick={() => setMode(m)}
              data-testid={`map-view-${m}`}
              title={m === "3d" && !webgl ? pick(["This browser has no WebGL", "這個瀏覽器不支援 WebGL"]) : undefined}
              className={`px-2 py-0.5 ${mode === m ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"} disabled:opacity-40`}
            >
              {m === "3d" ? "3D" : "2D"}
            </button>
          ))}
        </span>
      </div>
      <div ref={box} className={`relative mt-1.5 min-h-0 flex-1 ${mode === "tree" ? "overflow-auto" : ""}`}>
        {!drawn ? (
          <p className="text-xs text-gray-500" data-testid="map-empty">
            {empty}
          </p>
        ) : tiny ? (
          <TinyGraph nodes={layer === "statement" && statement ? statementNodes(statement) : proof ? proofNodes(proof.graph) : []} />
        ) : layer === "statement" && statement ? (
          <StatementLayer key={mode} graph={statement} mode={mode} height={h} bare />
        ) : proof ? (
          <ProofLayer key={`${proof.key}-${mode}`} graph={proof.graph} mode={mode} height={h} bare />
        ) : null}
        {about && drawn && (
          <div
            className="absolute top-1 left-1 z-10 max-h-[calc(100%-0.5rem)] w-[min(24rem,calc(100%-0.5rem))] space-y-1.5 overflow-y-auto rounded-md border border-gray-200 bg-white/95 p-2.5 text-xs shadow-lg"
            data-testid="map-about-panel"
          >
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-gray-700">{pick(LAYERS[layer].say)}</p>
              <button type="button" onClick={() => setAbout(false)} aria-label={pick(["Close", "關閉"])} className="text-gray-400 hover:text-gray-800">
                ×
              </button>
            </div>
            {layer === "statement" && statement && <StatementDetails graph={statement} />}
            {mode === "3d" && !tiny && <LegendFor layer={layer} statement={statement} proof={proof} />}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendFor({ layer, statement, proof }: { layer: Layer; statement: StatementGraph | null; proof: ProofSource | null }) {
  const nodes = useMemo(
    () => (layer === "statement" ? (statement ? statementNodes(statement) : []) : proof ? proofNodes(proof.graph) : []),
    [layer, statement, proof],
  );
  return <Legend nodes={nodes} />;
}

/** One or two declarations: their names in a card, centred (no 3D scene for so little). */
function TinyGraph({ nodes }: { nodes: MapNode[] }) {
  const { pick } = useLang();
  return (
    <div className="flex h-full min-h-32 items-center justify-center" data-testid="map-tiny">
      <div className="max-w-sm space-y-1.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-700 shadow-sm">
        {nodes.map((n) => (
          <p key={n.id} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colourOf(n) }} />
            <span className="font-mono font-semibold break-all text-gray-900">{n.label}</span>
          </p>
        ))}
        <p className="text-gray-500">
          {pick(
            nodes.length <= 1
              ? ["Nothing else: no lemma, no definition, no axiom.", "沒有別的了：沒有引理、沒有定義、沒有公理。"]
              : ["Only these two: nothing else is used.", "只有這兩個：沒有用到其他東西。"],
          )}
        </p>
      </div>
    </div>
  );
}
