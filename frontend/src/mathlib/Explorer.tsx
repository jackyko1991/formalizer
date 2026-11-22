/**
 * The Mathlib map's explorer: search (curated theorems, the declarations of their graphs, modules, and all of Mathlib
 * online through Loogle), a theorem's dependency graph in 3D (or as a tree), and the selected declaration's card:
 * statement, module, links to the documentation and the source, and its path down to the axioms.
 */
import { Graph3D, RichText, useLang, type G3Link, type G3Node } from "@learnkit/web";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AREAS,
  adjacency,
  areaOf,
  docsUrl,
  loadGalaxy,
  loadGraph,
  loogle,
  reachable,
  search,
  shortestPath,
  sourceUrl,
  spanningTree,
  usedBy,
  type Galaxy,
  type Hit,
  type L,
  type LoogleHit,
  type MathlibIndex,
  type TheoremGraph,
  type TreeNode,
} from "./data";
import { useAsync, useViewMode } from "./hooks";

export interface MapRequest {
  theorem: string;
  node?: string;
  /** show this path (declaration names) highlighted */
  path?: string[];
  nonce: number;
}

const KIND: Record<string, L> = {
  thm: ["theorem", "定理"],
  def: ["definition", "定義"],
  axiom: ["axiom", "公理"],
  inductive: ["inductive type", "歸納型別"],
  structure: ["structure", "結構"],
  class: ["type class", "型別類"],
  quot: ["quotient primitive", "商型別原語"],
  opaque: ["opaque constant", "不透明常數"],
  other: ["declaration", "宣告"],
};

export function AreaDot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}

export function Legend({ areas }: { areas?: Set<string> }) {
  const { pick } = useLang();
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
      {AREAS.filter((a) => !areas || areas.has(a.id)).map((a) => (
        <li key={a.id} className="flex items-center gap-1">
          <AreaDot color={a.color} />
          {pick(a.label)}
        </li>
      ))}
    </ul>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-(--lk-accent) hover:underline">
      {children} ↗
    </a>
  );
}

export default function Explorer({ index, request }: { index: MathlibIndex; request: MapRequest | null }) {
  const { pick } = useLang();
  const [theorem, setTheorem] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [only, setOnly] = useState<string | null>(null); // show only what this node uses
  const [pathNames, setPathNames] = useState<string[] | null>(null);
  const [mode, setMode, webgl] = useViewMode();
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<{ kind: "module"; name: string } | { kind: "loogle"; hit: LoogleHit } | null>(null);
  const [galaxy, setGalaxy] = useState<Galaxy | null>(null);
  const entry = index.theorems[theorem];
  const { data: graph, error } = useAsync(() => loadGraph(entry), entry.file);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGalaxy().then(setGalaxy, () => {});
  }, []);

  // a tour (or the search) asks to open a theorem, a node in it, a path
  useEffect(() => {
    if (!request) return;
    const i = index.theorems.findIndex((t) => t.name === request.theorem);
    if (i < 0) return;
    setTheorem(i);
    setSelected(request.node ?? request.theorem);
    setPathNames(request.path ?? null);
    setOnly(null);
    setPanel(null);
  }, [request, index]);

  const open = (i: number, node?: string) => {
    setTheorem(i);
    setSelected(node ?? index.theorems[i].name);
    setPathNames(null);
    setOnly(null);
    setPanel(null);
    setQuery("");
  };

  const byName = useMemo(() => new Map(graph?.nodes.map((n, i) => [n.name, i]) ?? []), [graph]);
  const adj = useMemo(() => (graph ? adjacency(graph) : []), [graph]);
  const sel = graph ? (byName.get(selected ?? "") ?? 0) : 0;

  // the highlighted path: the one asked for, else the guided path when the theorem is selected, else the selected
  // node's shortest path to an axiom
  const highlight = useMemo(() => {
    if (!graph) return [] as number[];
    if (pathNames) return pathNames.map((n) => byName.get(n)).filter((i): i is number => i !== undefined);
    if (sel === 0 && graph.path.length > 1) return graph.path;
    let best: number[] | null = null;
    for (const a of graph.axioms) {
      const ai = byName.get(a);
      if (ai === undefined) continue;
      const p = shortestPath(graph, sel, ai, adj);
      if (p && (!best || p.length < best.length)) best = p;
    }
    return best ?? [];
  }, [graph, pathNames, sel, byName, adj]);

  const visible = useMemo(() => {
    if (!graph) return new Set<number>();
    const o = only ? byName.get(only) : undefined;
    return o === undefined ? new Set(graph.nodes.map((_, i) => i)) : reachable(graph, o, adj);
  }, [graph, only, byName, adj]);

  const hits = useMemo(() => search(index, galaxy, query, 12), [index, galaxy, query]);

  const pickHit = (h: Hit) => {
    if (h.kind === "theorem") open(h.theorem);
    else if (h.kind === "decl") open(h.theorems.includes(theorem) ? theorem : h.theorems[0], h.name);
    else {
      setPanel({ kind: "module", name: h.name });
      setQuery("");
    }
    box.current?.scrollIntoView({ block: "nearest" });
  };

  // the card for what is selected (a declaration, a module, a Loogle hit): beside the graph, and inside it when enlarged
  const sidePanel = (
    <>
      {panel?.kind === "module" && galaxy && <ModuleCard galaxy={galaxy} name={panel.name} index={index} onOpen={open} onClose={() => setPanel(null)} />}
      {panel?.kind === "loogle" && <LoogleCard hit={panel.hit} index={index} onOpen={open} onClose={() => setPanel(null)} />}
      {!panel && graph && (
        <NodeCard
          index={index}
          graph={graph}
          i={sel}
          onlyActive={only === graph.nodes[sel].name}
          onOnly={(on) => setOnly(on ? graph.nodes[sel].name : null)}
          onPath={(p) => setPathNames(p.map((i) => graph.nodes[i].name))}
          adj={adj}
          onSelect={(i) => setSelected(graph.nodes[i].name)}
          onOpen={open}
        />
      )}
    </>
  );
  return (
    <div className="space-y-3" data-testid="mathlib-explorer">
      <SearchBox index={index} query={query} setQuery={setQuery} hits={hits} onHit={pickHit} onLoogle={(hit) => setPanel({ kind: "loogle", hit })} />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-gray-500" htmlFor="mathlib-theorem">
          {pick(["Theorem", "定理"])}
        </label>
        <select
          id="mathlib-theorem"
          value={theorem}
          onChange={(e) => open(Number(e.target.value))}
          className="max-w-full min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm sm:flex-none"
        >
          {index.theorems.map((t, i) => (
            <option key={t.name} value={i}>
              {pick([t.en, t.zh])}
            </option>
          ))}
        </select>
        <span className="ml-auto flex overflow-hidden rounded-md border border-gray-300">
          {(["3d", "tree"] as const).map((m) => (
            <button
              key={m}
              disabled={m === "3d" && !webgl}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 ${mode === m ? "bg-(--lk-accent) text-white" : "bg-white text-gray-600 hover:bg-gray-50"} disabled:opacity-40`}
            >
              {m === "3d" ? pick(["3D map", "3D 地圖"]) : pick(["Tree", "樹狀"])}
            </button>
          ))}
        </span>
      </div>

      <TheoremSummary index={index} i={theorem} />

      <div ref={box} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2">
          {error && <p className="text-xs text-red-700">{error}</p>}
          {!graph && !error && <p className="text-xs text-gray-500">{pick(["Loading the graph…", "載入圖中…"])}</p>}
          {graph && mode === "3d" && (
            <TheoremGraph3D graph={graph} visible={visible} highlight={highlight} focus={sel} onSelect={(i) => setSelected(graph.nodes[i].name)} side={sidePanel} />
          )}
          {graph && mode === "tree" && (
            <TreeView graph={graph} from={only ? (byName.get(only) ?? 0) : 0} selected={sel} highlight={highlight} onSelect={(i) => setSelected(graph.nodes[i].name)} />
          )}
          {graph && <Legend areas={new Set(graph.nodes.map((n) => areaOf(n.module, n.kind).id))} />}
          {graph && (
            <p className="text-[11px] text-gray-500">
              {pick([
                `Showing ${visible.size} of the ${entry.closure.toLocaleString()} declarations this theorem rests on (instances and automatically generated helpers folded into their users). Arrows point from a declaration to what it uses; the gold dots run along the highlighted path.`,
                `顯示這條定理所依賴的 ${entry.closure.toLocaleString()} 個宣告中的 ${visible.size} 個（實例與自動產生的輔助宣告併入使用它們的宣告）。箭頭由宣告指向它所用到的東西；金色光點沿著標示的路徑移動。`,
              ])}
            </p>
          )}
        </div>
        <div className="min-w-0">{sidePanel}</div>
      </div>
    </div>
  );
}

function TheoremSummary({ index, i }: { index: MathlibIndex; i: number }) {
  const { pick } = useLang();
  const t = index.theorems[i];
  const total = Object.values(t.areas).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
      <p>
        <RichText
          text={pick([
            `**${t.en}** rests on **${t.closure.toLocaleString()}** declarations, at most ${t.depth} steps deep, and on the axioms ${t.axioms.length ? t.axioms.map((a) => `\`${a}\``).join(", ") : "— none at all"}.`,
            `**${t.zh}** 依賴 **${t.closure.toLocaleString()}** 個宣告，最深 ${t.depth} 層；用到的公理：${t.axioms.length ? t.axioms.map((a) => `\`${a}\``).join("、") : "一條也沒有"}。`,
          ])}
        />
      </p>
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-200" title={pick(["Where its dependencies live", "它的依賴分布在哪些領域"])}>
        {Object.entries(t.areas).map(([a, n]) => (
          <span key={a} style={{ width: `${(100 * n) / total}%`, background: areaOf(`Mathlib.${a}.X`).color }} title={`${a}: ${n}`} />
        ))}
      </div>
      <p className="text-[11px] text-gray-500">
        {Object.entries(t.areas)
          .slice(0, 5)
          .map(([a, n]) => `${a} ${Math.round((100 * n) / total)}%`)
          .join(" · ")}
      </p>
    </div>
  );
}

function SearchBox({
  index,
  query,
  setQuery,
  hits,
  onHit,
  onLoogle,
}: {
  index: MathlibIndex;
  query: string;
  setQuery: (q: string) => void;
  hits: Hit[];
  onHit: (h: Hit) => void;
  onLoogle: (h: LoogleHit) => void;
}) {
  const { pick } = useLang();
  const [online, setOnline] = useState<{ q: string; hits: LoogleHit[]; count: number; error?: string } | "busy" | null>(null);
  const run = async () => {
    setOnline("busy");
    try {
      setOnline({ q: query, ...(await loogle(query.trim())) });
    } catch (e) {
      setOnline({ q: query, hits: [], count: 0, error: String((e as Error).message ?? e) });
    }
  };
  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOnline(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && hits[0] && onHit(hits[0])}
        placeholder={pick(["Search a theorem: Fermat, pow_card, Real.sqrt, Topology.Compactness…", "搜尋定理：Fermat、費馬、pow_card、Real.sqrt、Topology.Compactness…"])}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-(--lk-accent) focus:outline-none"
        aria-label={pick(["Search the Mathlib map", "搜尋 Mathlib 地圖"])}
      />
      {query.trim() && (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white text-xs">
          {hits.length === 0 && <p className="px-3 py-2 text-gray-500">{pick(["Nothing on the map.", "地圖上沒有。"])}</p>}
          <ul className="divide-y divide-gray-100">
            {hits.map((h) => (
              <li key={`${h.kind}:${h.name}`}>
                <button onClick={() => onHit(h)} className="flex w-full items-baseline gap-2 px-3 py-1.5 text-left hover:bg-gray-50">
                  <span className="w-16 shrink-0 text-[10px] text-gray-400 uppercase">
                    {h.kind === "theorem" ? pick(["theorem", "定理"]) : h.kind === "decl" ? pick(["on a map", "在圖上"]) : pick(["module", "模組"])}
                  </span>
                  <span className="min-w-0 break-all font-mono">{h.name}</span>
                  {h.kind === "theorem" && <span className="ml-auto shrink-0 text-gray-500">{pick(h.label)}</span>}
                  {h.kind === "decl" && <span className="ml-auto shrink-0 text-gray-400">{pick(["in", "在"])} {pick([index.theorems[h.theorems[0]].en, index.theorems[h.theorems[0]].zh])}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 bg-sky-50/50 px-3 py-2">
            <button onClick={run} disabled={online === "busy"} className="font-medium text-sky-700 hover:underline disabled:opacity-50">
              {pick([`Search all of Mathlib for “${query.trim()}” with Loogle (online) →`, `用 Loogle 在整個 Mathlib 搜尋「${query.trim()}」（線上）→`])}
            </button>
            <p className="text-[10px] text-gray-500">
              {pick(["Sends only the query to loogle.lean-lang.org.", "只會把搜尋字串送到 loogle.lean-lang.org。"])}
            </p>
            {online === "busy" && <p className="text-gray-500">…</p>}
            {online && online !== "busy" && (
              <div className="mt-1">
                {online.error && <p className="font-mono whitespace-pre-wrap text-red-700">{online.error.slice(0, 400)}</p>}
                {!online.error && (
                  <p className="text-gray-500">
                    {pick([`${online.count} found`, `找到 ${online.count} 個`])}
                    {online.count > online.hits.length && pick([`, first ${online.hits.length}`, `，列出前 ${online.hits.length} 個`])}
                  </p>
                )}
                <ul>
                  {online.hits.slice(0, 30).map((h) => (
                    <li key={h.name}>
                      <button onClick={() => onLoogle(h)} className="block w-full truncate py-0.5 text-left font-mono hover:underline">
                        {h.name}
                        {index.names[h.name] && <span className="ml-1 text-(--lk-accent)">●</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TheoremGraph3D({
  graph,
  visible,
  highlight,
  focus,
  onSelect,
  side,
}: {
  graph: TheoremGraph;
  visible: Set<number>;
  highlight: number[];
  focus: number;
  onSelect: (i: number) => void;
  side?: ReactNode;
}) {
  const nodes = useMemo<G3Node[]>(() => {
    const used = usedBy(graph);
    return graph.nodes
      .map((n, i) => ({
        id: i,
        label: `${n.name}`,
        color: areaOf(n.module, n.kind).color,
        val: i === 0 ? 14 : n.kind === "axiom" ? 10 : 1.5 + Math.min(6, Math.log2(1 + used[i]) * 1.4) + Math.max(0, 3 - n.depth),
      }))
      .filter((n) => visible.has(n.id));
  }, [graph, visible]);
  const links = useMemo<G3Link[]>(() => {
    const on = new Set<string>();
    for (let k = 0; k + 1 < highlight.length; k++) on.add(`${highlight[k]}>${highlight[k + 1]}`);
    return graph.edges
      .filter(([a, b]) => visible.has(a) && visible.has(b))
      .map(([a, b]) =>
        on.has(`${a}>${b}`) ? { source: a, target: b, color: "#fbbf24", width: 1.6, particles: 3 } : { source: a, target: b },
      );
  }, [graph, visible, highlight]);
  return <Graph3D nodes={nodes} links={links} focus={focus} onSelect={onSelect} testId="mathlib-3d" side={side} card={(i) => <DeclHover graph={graph} i={i} />} />;
}

export function TreeView({
  graph,
  from,
  selected,
  highlight,
  onSelect,
}: {
  graph: TheoremGraph;
  from: number;
  selected: number;
  highlight: number[];
  onSelect: (i: number) => void;
}) {
  const { pick } = useLang();
  const tree = useMemo(() => spanningTree(graph, from), [graph, from]);
  const hl = new Set(highlight);
  const row = (t: TreeNode, depth: number, key: string): React.ReactNode => {
    const n = graph.nodes[t.node];
    const label = (
      <button
        onClick={() => onSelect(t.node)}
        className={`inline-flex min-w-0 items-center gap-1.5 rounded px-1 text-left hover:bg-gray-100 ${t.node === selected ? "bg-teal-50 ring-1 ring-(--lk-accent)" : ""}`}
      >
        <AreaDot color={areaOf(n.module, n.kind).color} />
        <span className={`break-all font-mono ${hl.has(t.node) ? "font-semibold text-amber-700" : ""} ${t.repeat ? "text-gray-400" : ""}`}>{n.name}</span>
        {t.repeat && <span className="text-[10px] text-gray-400">{pick(["(also above)", "（上方已列出）"])}</span>}
      </button>
    );
    if (!t.children.length) return <li key={key} className="py-0.5">{label}</li>;
    return (
      <li key={key} className="py-0.5">
        <details open={depth < 1 || t.children.some((c) => hl.has(c.node))}>
          <summary className="cursor-pointer marker:text-gray-400">
            {label} <span className="text-[10px] text-gray-400">({t.children.length})</span>
          </summary>
          <ul className="ml-3 border-l border-gray-200 pl-3">{t.children.map((c, j) => row(c, depth + 1, `${key}.${j}`))}</ul>
        </details>
      </li>
    );
  };
  return (
    <div className="max-h-[460px] overflow-auto rounded-lg border border-gray-200 bg-white p-2 text-xs" data-testid="mathlib-tree">
      <ul>{row(tree, 0, "r")}</ul>
    </div>
  );
}

function Links({ module, name, line, index }: { module: string; name?: string; line: number; index: MathlibIndex }) {
  const { pick } = useLang();
  const src = sourceUrl(module, line, index.meta);
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1">
      <ExtLink href={docsUrl(module, name)}>{pick(["Mathlib docs", "Mathlib 文件"])}</ExtLink>
      {src && <ExtLink href={src}>{pick(["Source on GitHub", "GitHub 原始碼"])}</ExtLink>}
    </p>
  );
}

function Card({ children, onClose, testId }: { children: React.ReactNode; onClose?: () => void; testId?: string }) {
  return (
    <div className="relative space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700" data-testid={testId}>
      {onClose && (
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" aria-label="close">
          ✕
        </button>
      )}
      {children}
    </div>
  );
}

export function NodeCard({
  index,
  graph,
  i,
  adj,
  onlyActive,
  onOnly,
  onPath,
  onSelect,
  onOpen,
}: {
  index: MathlibIndex;
  graph: TheoremGraph;
  i: number;
  adj: number[][];
  onlyActive: boolean;
  onOnly: (on: boolean) => void;
  onPath: (p: number[]) => void;
  onSelect: (i: number) => void;
  onOpen: (theorem: number, node?: string) => void;
}) {
  const { pick } = useLang();
  const n = graph.nodes[i];
  const area = areaOf(n.module, n.kind);
  const curated = index.theorems.findIndex((t) => t.name === n.name);
  const paths = graph.axioms
    .map((a) => ({ a, p: graph.nodes.findIndex((m) => m.name === a) }))
    .map(({ a, p }) => ({ a, path: p >= 0 ? shortestPath(graph, i, p, adj) : null }));
  const uses = [...new Set(adj[i])];
  return (
    <Card testId="mathlib-node">
      <p className="flex flex-wrap items-center gap-1.5 pr-4">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: area.color }}>
          {pick(KIND[n.kind] ?? KIND.other)}
        </span>
        <span className="text-[10px] text-gray-500">{pick(area.label)}</span>
      </p>
      <p className="font-mono text-sm font-semibold break-all text-gray-900">{n.name}</p>
      {curated >= 0 && <p className="text-gray-600">{pick([index.theorems[curated].en, index.theorems[curated].zh])}</p>}
      {n.sig && <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-2 font-mono text-[11px] whitespace-pre-wrap">{n.sig}</pre>}
      {n.doc && <p className="text-gray-600 italic">{n.doc}</p>}
      <p className="text-gray-500">
        {pick(["in", "位於"])} <span className="font-mono break-all">{n.module}</span>
        {n.line ? `:${n.line}` : ""}
      </p>
      <Links module={n.module} name={n.name} line={n.line} index={index} />
      <p className="text-gray-500">
        {i === 0
          ? pick(["The theorem at the top of this map.", "這張圖最上層的定理。"])
          : pick([`${n.depth} step${n.depth === 1 ? "" : "s"} below the theorem.`, `在定理下方 ${n.depth} 層。`])}{" "}
        {pick([`Uses ${uses.length} declaration${uses.length === 1 ? "" : "s"} drawn here`, `用到圖上 ${uses.length} 個宣告`])}
        {n.hidden > 0 && pick([` and ${n.hidden} more not drawn.`, `，另有 ${n.hidden} 個未畫出。`])}
        {n.hidden === 0 && "."}
      </p>
      {n.kind === "axiom" && (
        <p className="rounded bg-amber-50 px-2 py-1 text-amber-900">
          {pick(["An axiom: assumed, not proved. Everything above rests on it.", "公理：假設成立、不加證明。上面的一切都建立在它之上。"])}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {i !== 0 && uses.length > 0 && (
          <button onClick={() => onOnly(!onlyActive)} className="rounded-full border border-gray-300 px-2 py-0.5 hover:bg-gray-50">
            {onlyActive ? pick(["Show the whole map", "顯示整張圖"]) : pick(["Show only what it uses", "只顯示它用到的"])}
          </button>
        )}
        {curated >= 0 && i !== 0 && (
          <button onClick={() => onOpen(curated)} className="rounded-full border border-(--lk-accent) px-2 py-0.5 text-(--lk-accent) hover:bg-teal-50">
            {pick(["Open its own map", "打開它自己的地圖"])}
          </button>
        )}
      </div>
      {paths.some((p) => p.path) && (
        <div className="space-y-1 border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">{pick(["Down to the axioms", "一路往下到公理"])}</p>
          {paths.map(({ a, path }) =>
            path ? (
              <div key={a}>
                <button onClick={() => onPath(path)} className="font-mono text-amber-700 hover:underline">
                  {a}
                </button>
                <span className="text-gray-400"> · {pick([`${path.length - 1} steps`, `${path.length - 1} 步`])}</span>
                <ol className="ml-2 border-l border-amber-200 pl-2">
                  {path.slice(1, -1).map((v) => (
                    <li key={v}>
                      <button onClick={() => onSelect(v)} className="font-mono break-all text-gray-600 hover:underline">
                        ↓ {graph.nodes[v].name}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null,
          )}
        </div>
      )}
      {uses.length > 0 && (
        <details className="border-t border-gray-100 pt-2">
          <summary className="cursor-pointer font-semibold text-gray-600">{pick(["Uses (on this map)", "用到（圖上的）"])}</summary>
          <ul className="mt-1 max-h-40 overflow-auto">
            {uses.map((v) => (
              <li key={v}>
                <button onClick={() => onSelect(v)} className="flex items-center gap-1 font-mono break-all hover:underline">
                  <AreaDot color={areaOf(graph.nodes[v].module, graph.nodes[v].kind).color} />
                  {graph.nodes[v].name}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function ModuleCard({
  galaxy,
  name,
  index,
  onOpen,
  onClose,
}: {
  galaxy: Galaxy;
  name: string;
  index: MathlibIndex;
  onOpen: (i: number) => void;
  onClose: () => void;
}) {
  const { pick } = useLang();
  const m = galaxy.modules.find((x) => x[0] === name);
  if (!m) return null;
  const [, thms, defs, d] = m;
  const here = index.theorems.map((t, i) => [t, i] as const).filter(([t]) => t.module === name);
  return (
    <Card onClose={onClose} testId="mathlib-module">
      <p className="text-[10px] text-gray-500 uppercase">{pick(["module (a file of Mathlib)", "模組（Mathlib 的一個檔案）"])}</p>
      <p className="flex items-center gap-1.5 font-mono text-sm font-semibold break-all text-gray-900">
        <AreaDot color={areaOf(name).color} />
        {name}
      </p>
      <p className="text-gray-600">
        {pick([`${thms} theorems and ${defs} definitions, in the district ${galaxy.districts[d][0]}.`, `${thms} 條定理、${defs} 個定義，位於區域 ${galaxy.districts[d][0]}。`])}
      </p>
      <Links module={name} line={0} index={index} />
      {here.map(([t, i]) => (
        <button key={t.name} onClick={() => onOpen(i)} className="block text-left text-(--lk-accent) hover:underline">
          {pick([t.en, t.zh])} →
        </button>
      ))}
    </Card>
  );
}

function LoogleCard({ hit, index, onOpen, onClose }: { hit: LoogleHit; index: MathlibIndex; onOpen: (i: number, node?: string) => void; onClose: () => void }) {
  const { pick } = useLang();
  const on = index.names[hit.name];
  return (
    <Card onClose={onClose} testId="mathlib-loogle">
      <p className="text-[10px] text-sky-700 uppercase">{pick(["from Loogle (online)", "來自 Loogle（線上）"])}</p>
      <p className="font-mono text-sm font-semibold break-all text-gray-900">{hit.name}</p>
      <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-2 font-mono text-[11px] whitespace-pre-wrap">{`${hit.name}${hit.type}`}</pre>
      {hit.doc && <p className="text-gray-600 italic">{hit.doc.slice(0, 400)}</p>}
      <p className="text-gray-500">
        {pick(["in", "位於"])} <span className="font-mono break-all">{hit.module}</span>
      </p>
      <Links module={hit.module} name={hit.name} line={0} index={index} />
      {on ? (
        <button onClick={() => onOpen(on[0], hit.name)} className="text-(--lk-accent) hover:underline">
          {pick(["Show it on the map →", "在地圖上顯示 →"])}
        </button>
      ) : (
        <p className="text-gray-500">
          {pick([
            "Not on any of the precomputed maps. Its dependencies stay one click away: the docs page lists what its statement uses, and `#print axioms` in Lean lists its axioms.",
            "不在任何預先算好的地圖上。它的依賴仍然只差一步：文件頁會列出陳述用到的東西，在 Lean 中用 `#print axioms` 可列出它用到的公理。",
          ])}
        </p>
      )}
    </Card>
  );
}

/** The card under the pointer for one declaration: its kind, module, statement and how it is wired in. */
function DeclHover({ graph, i }: { graph: TheoremGraph; i: number }) {
  const { pick } = useLang();
  const n = graph.nodes[i];
  const uses = graph.edges.filter(([a]) => a === i).length;
  const usedBy = graph.edges.filter(([, b]) => b === i).length;
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 font-mono font-semibold break-all text-gray-900">
        <AreaDot color={areaOf(n.module, n.kind).color} />
        {n.name}
      </p>
      <p className="text-gray-500">
        {pick(KIND[n.kind] ?? KIND.other)} · <span className="font-mono">{n.module}</span>
      </p>
      {n.sig && <p className="line-clamp-3 font-mono text-[11px] break-words text-gray-800">{n.sig}</p>}
      <p className="text-gray-600">
        {pick([`uses ${uses} · used by ${usedBy} on this map`, `在這張圖上：用到 ${uses} 個 · 被 ${usedBy} 個用到`])}
        {n.hidden > 0 && pick([` (+${n.hidden} more not drawn)`, `（另有 ${n.hidden} 個未畫出）`])}
      </p>
    </div>
  );
}
