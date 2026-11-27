/**
 * Concept ▸ the Riemann case, section "Two maps" (lazy-loaded by Rh.tsx): what Mathlib's `RiemannHypothesis` rests on
 * (its dependency graph, from the Mathlib map: frontend/public/mathlib, scripts/mathlib_graph) and the shape of the
 * proof, before and after its refactor of 25 Nov 2026 (the original source, and lsernau/grh-lean's compact and readable
 * editions, as districts linked by imports: frontend/public/rh/proof-map-{compact,readable,original}.json,
 * scripts/rh_map/generate.py, which reads the Lean source as text and never builds or runs it). Both 3D views load
 * three.js on demand; each has a list / tree fallback.
 */
import {
  go,
  Graph3D,
  RichText,
  useLang,
  type G3Link,
  type G3Node,
} from "@learnkit/web";
import { useMemo, useState, type ReactNode } from "react";
import {
  adjacency,
  areaOf,
  loadGraph,
  loadIndex,
  reachable,
  shortestPath,
  type MathlibIndex,
  type TheoremGraph,
} from "../../mathlib/data";
import {
  AreaDot,
  Legend,
  NodeCard,
  STAR_HINT,
  TheoremGraph3D,
  TreeView,
} from "../../mathlib/Explorer";
import { useAsync, useViewMode } from "../../mathlib/hooks";
import {
  colourOf,
  drawnLinks,
  EDITIONS,
  folders,
  githubUrl,
  loadProofMap,
  MAIN,
  MAIN_COLOUR,
  neighbours,
  ORIGINAL,
  STATEMENT,
  STATEMENT_COLOUR,
  type Edition,
  type ProofMap,
} from "../../rh/proofMap";
import {
  Callout,
  Lean,
  List,
  P,
  Section,
  SiteLink,
  Table,
  type L,
} from "../kit";
import { CardTabs } from "./CardTabs";

const ROOT = "RiemannHypothesis";
const REPO = "https://github.com/leanprover-community/riemann-hypothesis";

function Caption({ t }: { t: L }) {
  const { pick } = useLang();
  return (
    <p className="text-center text-xs text-gray-500">
      <RichText text={pick(t)} />
    </p>
  );
}

function ModeSwitch({
  mode,
  setMode,
  webgl,
  other,
}: {
  mode: "3d" | "tree";
  setMode: (m: "3d" | "tree") => void;
  webgl: boolean;
  other: L;
}) {
  const { pick } = useLang();
  return (
    <span className="ml-auto flex overflow-hidden rounded-md border border-gray-300 text-xs">
      {(["3d", "tree"] as const).map((m) => (
        <button
          key={m}
          disabled={m === "3d" && !webgl}
          onClick={() => setMode(m)}
          className={`px-2.5 py-1 ${mode === m ? "bg-(--lk-accent) text-white" : "bg-white text-gray-600 hover:bg-gray-50"} disabled:opacity-40`}
        >
          {m === "3d" ? pick(["3D map", "3D 地圖"]) : pick(other)}
        </button>
      ))}
    </span>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

// ------------------------------------------------------------------------------------------- map 1: the statement

function StatementMap() {
  const { pick } = useLang();
  const { data: index, error } = useAsync(loadIndex, "index");
  const entry = index?.theorems.find((t) => t.name === ROOT);
  const { data: graph, error: gError } = useAsync(
    () =>
      entry
        ? loadGraph(entry)
        : Promise.reject(
            new Error("RiemannHypothesis is not on the Mathlib map"),
          ),
    entry?.file ?? "none",
  );
  if (error || gError || (index && !entry))
    return (
      <p className="text-xs text-red-700">
        {error ?? gError ?? "RiemannHypothesis is not on the Mathlib map"}
      </p>
    );
  if (!index || !entry || !graph)
    return (
      <p className="text-xs text-gray-500">
        {pick(["Loading the map…", "載入地圖中…"])}
      </p>
    );
  return <StatementGraph index={index} graph={graph} />;
}

function StatementGraph({
  index,
  graph,
}: {
  index: MathlibIndex;
  graph: TheoremGraph;
}) {
  const { pick } = useLang();
  const entry = index.theorems.find((t) => t.name === ROOT)!;
  const [sel, setSel] = useState(0);
  const [only, setOnly] = useState<number | null>(null);
  const [pathSel, setPathSel] = useState<number[] | null>(null);
  const [mode, setMode, webgl] = useViewMode();
  const adj = useMemo(() => adjacency(graph), [graph]);
  const select = (i: number) => {
    setSel(i);
    setPathSel(null);
  };
  // the guided path when the statement itself is selected, else the selected node's shortest path to an axiom
  const highlight = useMemo(() => {
    if (pathSel) return pathSel;
    if (sel === 0) return graph.path;
    let best: number[] | null = null;
    for (const a of graph.axioms) {
      const ai = graph.nodes.findIndex((n) => n.name === a);
      const p = ai >= 0 ? shortestPath(graph, sel, ai, adj) : null;
      if (p && (!best || p.length < best.length)) best = p;
    }
    return best ?? [];
  }, [graph, sel, pathSel, adj]);
  const visible = useMemo(
    () =>
      only == null
        ? new Set(graph.nodes.map((_, i) => i))
        : reachable(graph, only, adj),
    [graph, only, adj],
  );

  const card = (
    <NodeCard
      index={index}
      graph={graph}
      i={sel}
      adj={adj}
      onlyActive={only === sel}
      onOnly={(on) => setOnly(on ? sel : null)}
      onPath={setPathSel}
      onSelect={select}
      onOpen={() => go("skills", "mathlib", "explore")}
    />
  );
  return (
    <div className="space-y-2" data-testid="rh-statement-map">
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-950">
        <RichText
          text={pick([
            `The statement alone rests on **${fmt(entry.closure)} declarations** of Mathlib, up to ${entry.depth} steps deep, and on the axioms ${entry.axioms.map((a) => `\`${a}\``).join(", ")}.`,
            `光是這個陳述，就建立在 Mathlib 的 **${fmt(entry.closure)} 個宣告** 之上，最深 ${entry.depth} 層，用到的公理：${entry.axioms.map((a) => `\`${a}\``).join("、")}。`,
          ])}
        />
      </div>
      <div
        className="flex flex-wrap items-center gap-1 text-xs"
        aria-label={pick(["The guided path", "導覽路徑"])}
      >
        <span className="mr-1 text-gray-500">
          {pick(["Guided path:", "導覽路徑："])}
        </span>
        {graph.path.map((v, k) => (
          <span key={v} className="flex items-center gap-1">
            {k > 0 && <span className="text-gray-400">→</span>}
            <button
              onClick={() => select(v)}
              className={`rounded px-1 font-mono hover:bg-amber-100 ${v === sel ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400" : "text-amber-800"}`}
            >
              {graph.nodes[v].name}
            </button>
          </span>
        ))}
        <ModeSwitch
          mode={mode}
          setMode={setMode}
          webgl={webgl}
          other={["Tree", "樹狀"]}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2">
          {mode === "3d" ? (
            <TheoremGraph3D
              graph={graph}
              visible={visible}
              highlight={highlight}
              focus={sel}
              onSelect={select}
              side={card}
            />
          ) : (
            <TreeView
              graph={graph}
              from={only ?? 0}
              selected={sel}
              highlight={highlight}
              onSelect={select}
            />
          )}
          <Legend
            areas={new Set(graph.nodes.map((n) => areaOf(n.module, n.kind).id))}
          />
          <Caption
            t={[
              `Showing ${visible.size} of the ${fmt(entry.closure)} declarations (instances and automatically generated helpers folded into their users). Arrows point from a declaration to what it uses; the gold dots run along the highlighted path. Click a node for its card; hover for a summary.`,
              `顯示 ${fmt(entry.closure)} 個宣告中的 ${visible.size} 個（實例與自動產生的輔助宣告併入使用它們的宣告）。箭頭由宣告指向它所用到的東西；金色光點沿著標示的路徑移動。點一個節點看它的卡片；滑過看摘要。`,
            ]}
          />
        </div>
        <div className="min-w-0">{card}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------- map 2: the proof

const EDITION_LABEL: Record<Edition, L> = {
  compact: [
    "Compact edition (~76,000 lines of code)",
    "精簡版（約 7.6 萬行程式碼）",
  ],
  readable: ["Readable edition (~300,000)", "可讀版（約 30 萬行）"],
  original: ["Before the refactor (17.4 million)", "重構前（1740 萬行）"],
};

function ProofShape() {
  const { pick } = useLang();
  const [edition, setEdition] = useState<Edition>("compact");
  // the full original map is heavy: choosing it asks first
  const [asking, setAsking] = useState(false);
  const choose = (e: Edition) => {
    if (e === "original" && edition !== "original") setAsking(true);
    else {
      setAsking(false);
      setEdition(e);
    }
  };
  const { data: map, error } = useAsync(
    () => loadProofMap(edition),
    `proof-map-${edition}`,
  );
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        className="flex flex-wrap gap-1.5 text-xs"
        data-testid="rh-edition"
      >
        {EDITIONS.map((e) => (
          <button
            key={e}
            role="radio"
            aria-checked={e === edition}
            onClick={() => choose(e)}
            className={`rounded-full border px-2.5 py-1 ${e === edition ? "border-(--lk-accent) bg-teal-50 font-medium text-(--lk-accent)" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {pick(EDITION_LABEL[e])}
          </button>
        ))}
      </div>
      {asking && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"
          data-testid="rh-original-warning"
        >
          <p>
            {pick([
              `The full map before the refactor is much heavier: ${fmt(ORIGINAL.districts)} districts from ${fmt(ORIGINAL.files)} files, about seven times as many stars as the refactored editions, and a download ten times the size. It can be slow, and on some machines or browsers the 3D view may fail to draw; the list view always works.`,
              `重構前的完整地圖重得多：${fmt(ORIGINAL.districts)} 個區域、來自 ${fmt(ORIGINAL.files)} 個檔案，星星數大約是重構版的七倍，下載量大約十倍。它可能很慢，在某些機器或瀏覽器上 3D 圖可能畫不出來；清單模式則一定能用。`,
            ])}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAsking(false);
                setEdition("original");
              }}
              className="rounded-md bg-amber-600 px-2.5 py-1 font-medium text-white hover:bg-amber-700"
              data-testid="rh-original-load"
            >
              {pick(["Load the full map anyway", "仍然載入完整地圖"])}
            </button>
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="rounded-md border border-amber-300 bg-white px-2.5 py-1 hover:bg-amber-100"
            >
              {pick(["Stay with the refactored map", "留在重構後的地圖"])}
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p className="text-xs text-red-700">{error}</p>
      ) : !map ? (
        <p className="text-xs text-gray-500">
          {pick(["Loading the map…", "載入地圖中…"])}
        </p>
      ) : (
        <ProofGraph key={edition} map={map} />
      )}
    </div>
  );
}

function ProofGraph({ map }: { map: ProofMap }) {
  const { pick } = useLang();
  const [mode, setMode, webgl] = useViewMode();
  const statement = map.districts.findIndex((d) => d.flags & STATEMENT);
  const main = map.districts.findIndex((d) => d.flags & MAIN);
  const [sel, setSel] = useState<number>(main);
  const nodes = useMemo<G3Node[]>(() => {
    // sized relative to the average district, so every edition reads the same way
    const avg = map.meta.lines / map.districts.length;
    return map.districts.map((d, i) => ({
      id: i,
      label: d.name,
      color: colourOf(d),
      val:
        d.flags & (STATEMENT | MAIN) ? 24 : Math.max(0.5, (4 * d.lines) / avg),
    }));
  }, [map]);
  const links = useMemo<G3Link[]>(
    () =>
      drawnLinks(map).map(([a, b, w]) =>
        a === main || b === statement
          ? { source: a, target: b, color: "#fbbf24", width: 1.2, particles: 3 }
          : {
              source: a,
              target: b,
              width: w >= (map.meta.files > 10_000 ? 2000 : 8) ? 0.6 : 0,
            },
      ),
    [map, main, statement],
  );
  const card = <DistrictCard map={map} i={sel} onSelect={setSel} />;
  const tops = folders(map);
  return (
    <div className="space-y-2" data-testid="rh-proof-map">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span>
          {pick([
            `${fmt(map.meta.files)} files · ${fmt(map.meta.lines)} lines · ${map.districts.length} districts · ${fmt(map.meta.importsInternal)} imports between its files`,
            `${fmt(map.meta.files)} 個檔案 · ${fmt(map.meta.lines)} 行 · ${map.districts.length} 個區域 · 檔案之間 ${fmt(map.meta.importsInternal)} 個匯入`,
          ])}
        </span>
        <ModeSwitch
          mode={mode}
          setMode={setMode}
          webgl={webgl}
          other={["List", "清單"]}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2">
          {mode === "3d" ? (
            <Graph3D
              nodes={nodes}
              links={links}
              focus={sel}
              onSelect={setSel}
              arrows={false}
              testId="rh-proof-3d"
              hint={STAR_HINT}
              side={card}
              card={(i) => <DistrictHover map={map} i={i} />}
            />
          ) : (
            <DistrictList map={map} sel={sel} onSelect={setSel} />
          )}
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
            <li className="flex items-center gap-1">
              <AreaDot color={STATEMENT_COLOUR} />
              {pick([
                "the statement (Statements.lean)",
                "陳述（Statements.lean）",
              ])}
            </li>
            <li className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-gray-400"
                style={{ background: MAIN_COLOUR }}
              />
              {pick(["the main theorem (Main.lean)", "主定理（Main.lean）"])}
            </li>
            {tops
              .filter((t) => t.top !== "Statements" && t.top !== "Main")
              .map((t) => (
                <li key={t.top} className="flex items-center gap-1">
                  <AreaDot
                    color={colourOf({
                      ...map.districts[0],
                      top: t.top,
                      flags: 0,
                    })}
                  />
                  {t.top}{" "}
                  <span className="text-gray-400">
                    {Math.round((100 * t.lines) / map.meta.lines)}%
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="min-w-0">{card}</div>
      </div>
    </div>
  );
}

function DistrictCard({
  map,
  i,
  onSelect,
}: {
  map: ProofMap;
  i: number;
  onSelect: (i: number) => void;
}) {
  const { pick } = useLang();
  const d = map.districts[i];
  if (!d) return null;
  const nb = neighbours(map, i, 5);
  const single =
    d.files === 1 &&
    d.topFiles.length === 1 &&
    `${d.name}.lean`.endsWith(d.topFiles[0][0]);
  const row = ([j, w]: [number, number]) => (
    <li key={j}>
      <button
        onClick={() => onSelect(j)}
        className="flex w-full items-center gap-1 text-left font-mono break-all hover:underline"
      >
        <AreaDot color={colourOf(map.districts[j])} />
        {map.districts[j].name}
        <span className="ml-auto shrink-0 pl-1 text-gray-400">{fmt(w)}</span>
      </button>
    </li>
  );
  return (
    <div
      className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700"
      data-testid="rh-district"
    >
      <p className="flex items-center gap-1.5">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: d.flags & MAIN ? "#334155" : colourOf(d) }}
        >
          {d.flags & STATEMENT
            ? pick(["the statement", "陳述"])
            : d.flags & MAIN
              ? pick(["the main theorem", "主定理"])
              : d.top}
        </span>
        <span className="text-[10px] text-gray-500">
          {single
            ? pick(["one file", "單一檔案"])
            : pick(["a folder (district)", "一個資料夾（區域）"])}
        </span>
      </p>
      <p className="font-mono text-sm font-semibold break-all text-gray-900">
        {single ? `${d.name}.lean` : `${d.name}/`}
      </p>
      <p>
        {pick([
          `${fmt(d.lines)} lines in ${fmt(d.files)} file${d.files === 1 ? "" : "s"} (${((100 * d.lines) / map.meta.lines).toFixed(d.lines * 1000 < map.meta.lines ? 3 : 1)}% of the proof); ${fmt(d.mathlibFiles)} of ${d.files === 1 ? "them" : "its files"} import Mathlib directly.`,
          `${fmt(d.files)} 個檔案、${fmt(d.lines)} 行（佔整個證明的 ${((100 * d.lines) / map.meta.lines).toFixed(d.lines * 1000 < map.meta.lines ? 3 : 1)}%）；其中 ${fmt(d.mathlibFiles)} 個直接匯入 Mathlib。`,
        ])}
      </p>
      {d.flags & STATEMENT ? (
        <p className="rounded bg-amber-50 px-2 py-1 text-amber-900">
          {pick([
            "The five claims, stated with Mathlib's definitions; it imports only Mathlib. It is the refactor's public interface: word for word the same before and after, and restated with `sorry` in Challenge.lean as the spec the comparator checks against. This is the file a reader must check by eye.",
            "五個宣稱，用 Mathlib 的定義寫成；它只匯入 Mathlib。這是重構的公開介面：重構前後一字不差，並在 Challenge.lean 裡用 `sorry` 重寫一次，當作 comparator 對照的規格。這是讀者必須親眼檢查的檔案。",
          ])}
        </p>
      ) : null}
      {d.flags & MAIN ? (
        <p className="rounded bg-slate-100 px-2 py-1 text-slate-800">
          {pick(
            map.meta.root
              ? [
                  "`theorem riemannHypothesis : RiemannHypothesis`, and the four other claims. It imports one file, `New.Main`, the top of the proof, which in turn reaches the statement; following its imports reaches every file of the project.",
                  "`theorem riemannHypothesis : RiemannHypothesis` 以及另外四個宣稱。它只匯入一個檔案 `New.Main`，也就是證明的頂端，再由它間接走到陳述；沿著它的匯入可以走到專案裡的每一個檔案。",
                ]
              : [
                  "`theorem riemannHypothesis : RiemannHypothesis`, and the four other claims. It imports the statement and the proof; following its imports reaches every file of the project.",
                  "`theorem riemannHypothesis : RiemannHypothesis` 以及另外四個宣稱。它匯入陳述與證明；沿著它的匯入可以走到專案裡的每一個檔案。",
                ],
          )}
        </p>
      ) : null}
      <a
        href={githubUrl(map.meta, d.name, single)}
        target="_blank"
        rel="noreferrer"
        className="text-(--lk-accent) hover:underline"
      >
        {pick(["Read it on GitHub (as text)", "在 GitHub 上閱讀（純文字）"])} ↗
      </a>
      {!single && d.topFiles.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">
            {pick(["Largest files", "最大的檔案"])}
          </p>
          <ul>
            {d.topFiles.map(([f, n]) => (
              <li key={f} className="flex gap-1 font-mono break-all">
                {f}
                <span className="ml-auto shrink-0 pl-1 text-gray-400">
                  {fmt(n)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {nb.out.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">
            {pick([
              "Imports most from (file imports)",
              "最常從這些區域匯入（檔案匯入數）",
            ])}
          </p>
          <ul>{nb.out.map(row)}</ul>
        </div>
      )}
      {nb.in.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">
            {pick(["Imported most by", "最常被這些區域匯入"])}
          </p>
          <ul>{nb.in.map(row)}</ul>
        </div>
      )}
    </div>
  );
}

function DistrictHover({ map, i }: { map: ProofMap; i: number }) {
  const { pick } = useLang();
  const d = map.districts[i];
  const nb = neighbours(map, i, 3);
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 font-mono font-semibold break-all text-gray-900">
        <AreaDot color={colourOf(d)} />
        {d.name}
      </p>
      <p className="text-gray-600">
        {pick([
          `${fmt(d.lines)} lines · ${fmt(d.files)} files · ${d.top}`,
          `${fmt(d.lines)} 行 · ${fmt(d.files)} 個檔案 · ${d.top}`,
        ])}
      </p>
      {nb.out.length > 0 && (
        <p className="text-gray-600">
          {pick(["imports most: ", "最常匯入："])}
          <span className="font-mono">
            {nb.out
              .map(([j, w]) => `${map.districts[j].name} (${fmt(w)})`)
              .join(", ")}
          </span>
        </p>
      )}
    </div>
  );
}

function DistrictList({
  map,
  sel,
  onSelect,
}: {
  map: ProofMap;
  sel: number;
  onSelect: (i: number) => void;
}) {
  const { pick } = useLang();
  const tops = folders(map);
  const max = tops[0]?.lines ?? 1;
  const byTop = (top: string) =>
    map.districts
      .map((d, i) => [d, i] as const)
      .filter(([d]) => d.top === top)
      .sort((a, b) => b[0].lines - a[0].lines);
  return (
    <div
      className="max-h-[460px] space-y-1 overflow-auto rounded-lg border border-gray-200 bg-white p-2 text-xs"
      data-testid="rh-proof-list"
    >
      {tops.map((t) => {
        const ds = byTop(t.top);
        return (
          <details
            key={t.top}
            open={ds.some(([, i]) => i === sel) && ds.length < 40}
          >
            <summary className="flex cursor-pointer items-center gap-2 py-0.5">
              <AreaDot color={colourOf(ds[0][0])} />
              <span className="w-36 shrink-0 font-semibold">{t.top}</span>
              <span
                className="h-2 rounded-full bg-gray-300"
                style={{
                  width: `${Math.max(1, (100 * t.lines) / max) * 0.4}%`,
                }}
              />
              <span className="ml-auto shrink-0 text-gray-500">
                {pick([
                  `${fmt(t.lines)} lines · ${fmt(t.files)} files`,
                  `${fmt(t.lines)} 行 · ${fmt(t.files)} 個檔案`,
                ])}
              </span>
            </summary>
            <ul className="ml-4 border-l border-gray-200 pl-2">
              {ds.slice(0, 60).map(([d, i]) => (
                <li key={i}>
                  <button
                    onClick={() => onSelect(i)}
                    className={`flex w-full gap-2 rounded px-1 text-left hover:bg-gray-50 ${i === sel ? "bg-teal-50 ring-1 ring-(--lk-accent)" : ""}`}
                  >
                    <span className="min-w-0 font-mono break-all">
                      {d.name}
                    </span>
                    <span className="ml-auto shrink-0 text-gray-400">
                      {fmt(d.lines)}
                    </span>
                  </button>
                </li>
              ))}
              {ds.length > 60 && (
                <li className="text-gray-400">
                  {pick([
                    `… and ${ds.length - 60} more`,
                    `……還有 ${ds.length - 60} 個`,
                  ])}
                </li>
              )}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------------------------------- the section

const MATHLIB_RH = `/-- A formal statement of the **Riemann hypothesis** – constructing a term of this type is worth a
million dollars. -/
def RiemannHypothesis : Prop :=
  ∀ (s : ℂ) (_ : riemannZeta s = 0) (_ : ¬∃ n : ℕ, s = -2 * (n + 1)) (_ : s ≠ 1), s.re = 1 / 2`;

/** Before and after the refactor, with Mathlib for scale: the original's totals (ORIGINAL) next to the compact map's. */
function Scale() {
  const { data: map } = useAsync(
    () => loadProofMap("compact"),
    "proof-map-compact",
  );
  const ml = ORIGINAL.mathlib;
  const before = ORIGINAL.lines / ml.lines;
  const files = ORIGINAL.files / ml.files;
  const after = map ? (100 * map.meta.lines) / ml.lines : null;
  return (
    <P
      t={[
        `For scale: all of Mathlib (${ml.version}), the library built by hundreds of people since 2017, is ${fmt(ml.lines)} lines in ${fmt(ml.files)} files. Before the refactor, this one proof was about ${before.toFixed(1)} times as many lines and ${Math.round(files)} times as many files, and ${fmt(ORIGINAL.mathlibFiles)} of its files imported Mathlib directly.` +
          (map && after !== null
            ? ` After it, the compact edition is ${fmt(map.meta.lines)} lines in ${fmt(map.meta.files)} files, about ${after.toFixed(0)}% of Mathlib's size, on top of Mathlib.`
            : ""),
        `比較一下規模：整個 Mathlib（${ml.version}），由數百人從 2017 年起一起寫成，共 ${fmt(ml.lines)} 行、${fmt(ml.files)} 個檔案。重構之前，這一個證明的行數大約是它的 ${before.toFixed(1)} 倍，檔案數大約是 ${Math.round(files)} 倍，其中 ${fmt(ORIGINAL.mathlibFiles)} 個檔案直接匯入 Mathlib。` +
          (map && after !== null
            ? `重構之後，精簡版是 ${fmt(map.meta.files)} 個檔案、${fmt(map.meta.lines)} 行，大約是 Mathlib 的 ${after.toFixed(0)}%，建在 Mathlib 之上。`
            : ""),
      ]}
    />
  );
}

// ------------------------------------------------------------------------------------------- what a full run takes

const SUTHERLAND = "https://math.mit.edu/~drew/grh/";
const NOTES = `${REPO}/blob/main/verification/NOTES.md`;

/** Peak memory in GB of RAM (GiB figures converted), next to a 16 GB laptop: Sutherland's run, 22 Nov 2026 16:20 UTC. */
const MEMORY: { who: L; gb: number; value: L; laptop?: boolean }[] = [
  {
    who: ["an ordinary laptop: all its RAM", "一般筆電：全部的記憶體"],
    gb: 16,
    value: ["16 GB", "16 GB"],
    laptop: true,
  },
  {
    who: ["the build (`lake build`)", "建置（`lake build`）"],
    gb: 100,
    value: ["~100 GB", "約 100 GB"],
  },
  { who: ["nanoda", "nanoda"], gb: 91, value: ["≈ 85 GiB", "約 85 GiB"] },
  { who: ["con-leche", "con-leche"], gb: 49, value: ["45.6 GiB", "45.6 GiB"] },
  { who: ["con-ron", "con-ron"], gb: 48, value: ["≈ 44.6 GiB", "約 44.6 GiB"] },
];

/** What one full Lean check of the proof costs: build, export, each checker's time and peak memory, against a laptop. */
function ComputeCost() {
  const { pick } = useLang();
  return (
    <div className="space-y-3" data-testid="rh-compute">
      <P
        t={[
          "Checking a proof is cheap compared with finding it, but this one is big: one full run needs a large server for most of a day, and each independent checker needs several times the memory of a whole laptop.",
          "檢查一個證明，比找到它便宜得多；但這一份很大：完整跑一次要一台大型伺服器跑上大半天，而每個獨立檢查器需要的記憶體，都是一整台筆電的好幾倍。",
        ]}
      />
      <figure
        className="space-y-1.5"
        aria-label={pick([
          "Peak memory of each step, next to a 16 GB laptop",
          "每一步的記憶體峰值，與 16 GB 筆電並排",
        ])}
      >
        {MEMORY.map((m) => (
          <div
            key={m.value[0]}
            className="grid grid-cols-[1fr_4.5rem] items-center gap-x-2 gap-y-0.5 text-xs sm:grid-cols-[12rem_1fr_5rem]"
            title={`${pick(m.who).replace(/`/g, "")}: ${pick(m.value)}`}
          >
            <span className="col-span-2 text-gray-700 sm:col-span-1">
              <RichText text={pick(m.who)} />
            </span>
            <span className="block">
              <span
                className={`block h-3 rounded-r ${m.laptop ? "bg-gray-400" : "bg-teal-600"}`}
                style={{ width: `${m.gb}%` }}
              />
            </span>
            <span className="whitespace-nowrap text-gray-900">
              {pick(m.value)}
            </span>
          </div>
        ))}
        <figcaption className="pt-1 text-[11px] text-gray-500">
          {pick([
            "Peak memory (RAM), bars to one scale; grey is the laptop.",
            "記憶體（RAM）峰值，長條用同一個比例；灰色是筆電。",
          ])}
        </figcaption>
      </figure>
      <Table
        head={[
          ["Step", "步驟"],
          ["Time", "時間"],
          ["Memory / size", "記憶體 / 大小"],
        ]}
        rows={[
          [
            [
              "Build in a sandbox (`lake build Main`, 192 cores)",
              "在沙盒中建置（`lake build Main`，192 核心）",
            ],
            [
              "≈ 8 h (21 Nov 10:09 → 18:07 UTC, with restarts)",
              "約 8 小時（11/21 10:09 → 18:07 UTC，中間有重啟）",
            ],
            [
              "~100 GB RAM, 70 GB disk; 175,187 modules, zero errors",
              "約 100 GB 記憶體、70 GB 硬碟；175,187 個模組，零錯誤",
            ],
          ],
          [
            ["Export the proof", "匯出證明"],
            ["—", "—"],
            [
              "61.6 GB (7.7 GB compressed); 1,468,418 declarations (the statement's side alone: 51,692)",
              "61.6 GB（壓縮後 7.7 GB）；1,468,418 個宣告（只算陳述那一側：51,692）",
            ],
          ],
          [
            ["nanoda", "nanoda"],
            ["27 min 42 s on 80 threads", "27 分 42 秒，80 個執行緒"],
            ["≈ 85 GiB", "約 85 GiB"],
          ],
          [
            ["con-leche (`--verified`)", "con-leche（`--verified`）"],
            ["3 min 15 s", "3 分 15 秒"],
            ["45.6 GiB", "45.6 GiB"],
          ],
          [
            ["con-ron (`--compare`)", "con-ron（`--compare`）"],
            ["7 min 6 s", "7 分 6 秒"],
            ["≈ 44.6 GiB", "約 44.6 GiB"],
          ],
          [
            ["lean4lean, leanchecker", "lean4lean、leanchecker"],
            ["finished (times not posted)", "已完成（未公布時間）"],
            ["—", "—"],
          ],
          [
            [
              "Lean's own kernels (default, paranoid; comparator's kernel stage)",
              "Lean 自己的核心（預設、paranoid；comparator 的核心階段）",
            ],
            [
              "single-threaded: still running after ≈ 45 h, as of 22 Nov 16:20 UTC",
              "單執行緒：截至 11/22 16:20 UTC，跑了約 45 小時仍在跑",
            ],
            ["—", "—"],
          ],
        ]}
      />
      <P
        t={[
          "A laptop with 16 GB of RAM could not run any of these steps: even the lightest checker peaks at about three times its memory, and the build needs about six times. For scale, on a Mathlib-sized smoke test in the re-check's notes, Lean's kernel took 70 s and 0.75 GB, and nanoda 14 s and 0.41 GB; the re-check's own container was allowed 440 GB of memory.",
          "一台 16 GB 記憶體的筆電，這些步驟一個都跑不動：最省的檢查器，記憶體峰值也大約是它的三倍，建置則要大約六倍。比較一下：在重驗筆記裡一個 Mathlib 規模的冒煙測試中，Lean 核心花了 70 秒、0.75 GB，nanoda 花了 14 秒、0.41 GB；重驗自己的容器則被允許使用 440 GB 記憶體。",
        ]}
      />
      <p className="text-[11px] text-gray-500">
        {pick([
          "Numbers from Andrew Sutherland's independent run (updated 22 November 2026, 16:20 UTC) and the re-check repository's notes; as of 22 November 2026.",
          "數字來自 Andrew Sutherland 的獨立執行（2026 年 11 月 22 日 16:20 UTC 更新）與重驗儲存庫的筆記；截至 2026 年 11 月 22 日。",
        ])}{" "}
        <a
          href={SUTHERLAND}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          math.mit.edu/~drew/grh
        </a>
        {" · "}
        <a href={NOTES} target="_blank" rel="noreferrer" className="underline">
          verification/NOTES.md
        </a>
      </p>
    </div>
  );
}

export default function RhMaps({
  page,
  n,
  title,
}: {
  page: string;
  n: number;
  title: L;
}): ReactNode {
  return (
    <Section page={page} id="maps" n={n} title={title}>
      <P
        t={[
          "Two maps. The first shows what you must trust just to know what the claim *says*. The second shows how the proof is organised, and what it takes to check it; whether it checks is the checkers' job, and on 21 November 2026 the Lean and Mathlib communities certified it.",
          "兩張地圖。第一張顯示：光是要知道這個宣稱 *說了什麼*，你就得信任哪些東西。第二張顯示這份證明怎麼組織起來，以及檢查它要花多少資源；它能不能通過檢查，是檢查器的工作，而 Lean 與 Mathlib 社群已在 2026 年 11 月 21 日認證了它。",
        ]}
      />
      <CardTabs
        testid="rh-map-tabs"
        tabs={[
          {
            id: "statement",
            label: ["What the statement rests on", "陳述建立在什麼之上"],
            body: (
              <>
                <P
                  t={[
                    "The claim is one line of Lean, `RiemannHypothesis`. But that line uses `riemannZeta`, which is built from the Hurwitz zeta function, a Mellin transform, an integral, the complex numbers, the real numbers… This is what a reader must trust to know what the claim says, before looking at any proof. All of it was in Mathlib, written and checked by people, long before November 2026.",
                    "這個宣稱是一行 Lean：`RiemannHypothesis`。但這一行用到 `riemannZeta`，而它是由 Hurwitz zeta 函數、Mellin 變換、積分、複數、實數……一層層建起來的。這就是讀者在看任何證明之前，為了知道這個宣稱在說什麼而必須信任的東西。它們全都在 Mathlib 裡，早在 2026 年 11 月之前就由人寫好並檢查過了。",
                  ]}
                />
                <StatementMap />
                <Lean
                  code={MATHLIB_RH}
                  title="Mathlib/NumberTheory/LSeries/RiemannZeta.lean"
                  runner="mathlib"
                  note={[
                    "Mathlib v4.34.1, as `#print RiemannHypothesis` shows it. The trivial zeros $-2, -4, \\dots$ and the pole $s = 1$ are excluded by hand.",
                    "Mathlib v4.34.1，即 `#print RiemannHypothesis` 顯示的內容。平凡零點 $-2, -4, \\dots$ 與極點 $s = 1$ 是手動排除的。",
                  ]}
                />
                <p className="text-sm">
                  <SiteLink
                    to={["skills", "mathlib", "explore"]}
                    label={[
                      "The same graph in the Mathlib map (search: RiemannHypothesis)",
                      "Mathlib 地圖裡的同一張圖（搜尋：RiemannHypothesis）",
                    ]}
                  />
                </p>
              </>
            ),
          },
          {
            id: "proof",
            label: [
              "The shape of the proof, before and after the refactor",
              "證明的形狀：重構前後",
            ],
            body: (
              <>
                <P
                  t={[
                    "As published, the proof was 17,374,215 lines in 175,187 files: 1,020 districts joined by 753,569 imports between files. On 25 November it was **refactored**: the same five statements (the public interface), with the implementation rewritten in two editions of about 800 files each (section 2). Switch between them below. Nobody reads even the smallest line by line, but the *shape* can be read: which folders there are, how big they are, and which import which. Each star is a folder of files (a district), sized by its lines. In the refactored editions, blue is `Lib`, the library of background classed as known, and amber is `New`, the application code: the set-up and the argument. Before the refactor, colours mark the original's top-level folders. The gold star is the statement file; the white one is the main theorem.",
                    "公開時，這份證明有 17,374,215 行、175,187 個檔案：1,020 個區域，檔案之間有 753,569 個匯入。11 月 25 日它被**重構**：同樣五條陳述（公開介面），實作改寫成兩個版本，各約 800 個檔案（第 2 節）。下面可以切換。即使最小的版本也沒有人會一行一行讀，但它的 *形狀* 是讀得出來的：有哪些資料夾、各有多大、誰匯入誰。每顆星是一個資料夾（一個區域），大小代表行數。在重構後的版本裡，藍色是 `Lib`，被歸為已知的背景結果的函式庫；琥珀色是 `New`，應用程式碼，也就是設定與論證本身。重構前，顏色標的是原版的最上層資料夾。金色的星是陳述檔案；白色的是主定理。",
                  ]}
                />
                <ProofShape />
                <Callout
                  kind="warn"
                  title={[
                    "A map of structure, not of correctness (as of 27 November 2026)",
                    "這是結構圖，不是正確性的證明（截至 2026 年 11 月 27 日）",
                  ]}
                >
                  <P
                    t={[
                      "These maps show how the proof is organised, not that it is correct. They were made by reading the source as text (the published first commit `40e56bab`; lsernau/grh-lean, commit `72fead1`): nothing was built or run, because running untrusted Lean code is itself a risk. Whether the proof is right is the checkers' job: on 21 November 2026 the Lean and Mathlib communities certified the original, after checking an inert export of it, and independent checkers accepted both refactored editions on 25–26 November (section 2). The `Lib`/`New` colours follow the repository's own split, which it calls \"a working classification\". Understanding the proof is still people's job.",
                      "這些地圖顯示證明是怎麼組織的，而不是它是對的。它們是把原始碼當成純文字讀出來的（公開的第一個 commit `40e56bab`；lsernau/grh-lean，commit `72fead1`）：沒有編譯、也沒有執行任何東西，因為執行不受信任的 Lean 程式碼本身就有風險。證明是否正確，是檢查器的工作：Lean 與 Mathlib 社群檢查了一份不會執行的證明匯出檔，在 2026 年 11 月 21 日認證了原版；獨立檢查器在 11 月 25–26 日接受了重構後的兩個版本（第 2 節）。`Lib`／`New` 的顏色照儲存庫自己的拆分，它稱之為「一種工作上的分類」。至於理解這份證明，仍是人的工作。",
                    ]}
                  />
                  <SiteLink
                    to={["concept", "checkers"]}
                    label={[
                      "The checkers and the four questions",
                      "檢查器與四個問題",
                    ]}
                  />
                </Callout>
                <Scale />
              </>
            ),
          },
          {
            id: "compute",
            label: [
              "What the full Lean run took (before the refactor)",
              "完整跑一次 Lean 要多少資源（重構前）",
            ],
            body: <ComputeCost />,
          },
        ]}
      />
      <Callout
        kind="note"
        title={[
          "What this tells us: big mathematics now needs big instruments",
          "這告訴我們什麼：大數學開始需要大儀器",
        ]}
      >
        <P
          t={[
            "**This site's view (a position, not a consensus):** mathematics was long the last science that needed almost no instruments, only a person, paper and time. This case shows that, for the largest problems, that is changing. What is heavy is not the checker (a Mathlib-sized test runs in under 1 GB) but the path of the proof itself: 17 million lines, too long for one person to carry, and too big for an ordinary machine.",
            "**本站的看法（這是立場，不是共識）：** 數學長久以來是最後一門幾乎不需要儀器的科學，只要一個人、紙筆和時間。這個案例顯示，至少在最大的那些問題上，情況正在改變。重的不是檢查器（Mathlib 規模的測試不到 1 GB 就能跑完），而是這條證明路徑本身：1700 萬行，長到一個人扛不動，一台普通的機器也扛不動。",
          ]}
        />
        <P
          t={[
            'It points at two basic facts about mathematics. First, many hard problems may be solvable with the tools mathematics already has, but the path can be extremely long. A Lean proof walks such a path step by step: it starts from definitions and theorems already in Mathlib and applies the rules, rather like Wittgenstein\'s picture of mathematics as a rule-following *language game*. Second, what shortens a path, and makes it something people can understand, is usually new mathematics: a new concept or tool. Whether this proof contains one is not yet visible from its shape; Alpöge himself speaks of one idea that was "new and shocking" and plans to write the argument and its simplifications for people (as of 22 November 2026). Engineering can shorten a path too, in another way: five days later a refactor cut the same proof about 154-fold, behind the same statements, by rewriting the implementation (section 2). That makes it far easier to carry and to check, but not yet to understand.',
            "它指出數學的兩個根本事實。第一，很多難題也許用現有的數學工具就能解，但路可能長得驚人。Lean 證明就是一步一步走完這樣的路：從 Mathlib 裡現成的定義與定理出發，照著規則推下去，有點像維根斯坦把數學看成依規則進行的「語言遊戲」。第二，能把路縮短、讓人看得懂的，通常是新的數學：一個新的概念或工具。這份證明裡有沒有這樣的新工具，從它的形狀還看不出來；Alpöge 自己提到其中一個想法「新穎得令人震驚」，並打算把論證與它的簡化寫給人看（截至 2026 年 11 月 22 日）。工程也能把路縮短，只是方式不同：五天後，一次重構把同一份證明縮短了大約 154 倍，陳述不變，改寫的是實作（第 2 節）。這讓它容易搬動、容易檢查得多，但還沒有讓它更容易被理解。",
          ]}
        />
        <P
          t={[
            "Searching for such shortcuts with the human brain alone is often too slow, and sometimes has never succeeded. People are good at inventing tools, and once a tool works, they have never put it down to insist on bare hands, ever since the first stone tool. Big physics needs shared facilities like CERN; big mathematics is starting to need its own, with **mathematical engineering and large-scale computing** as basic tools:",
            "單靠人腦去找這樣的捷徑，往往太慢，有時甚至從未成功。人類擅長發明工具；而一旦有了好用的工具，就從來沒有為了堅持徒手而把它放下：從第一把石器開始就是如此。大物理需要 CERN 這樣的共享設施；大數學也開始需要自己的設施，以**數學工程與大規模運算**為基本工具：",
          ]}
        />
        <List
          items={[
            [
              "**Distributed Lean**: building and checking a proof spread over many machines, rather than one large server.",
              "**分散式 Lean**：讓一份證明的建置與檢查可以分散到許多台機器上，而不必靠一台大型伺服器。",
            ],
            [
              "**A central library of formal proofs**, like Python's pip: everything already formalized can be found, versioned and reused (Lean has the beginnings: Mathlib, its shared build cache, and the package index Reservoir).",
              "**一個形式化證明的中央函式庫**，像 Python 的 pip 那樣：所有已形式化的成果都找得到、有版本、可以重複使用（Lean 已有雛形：Mathlib、它共享的建置快取，以及套件索引 Reservoir）。",
            ],
            [
              "**Instruments for seeing**, like CERN's detectors and reconstruction software: tools that turn 17 million lines into shapes and structure a person can read, such as maps, dependency graphs, and natural-language proofs linked to the code. The two maps above are this site's small front panel for such an instrument.",
              "**看得見的儀器**，像 CERN 的探測器與重建軟體：把 1700 萬行機器程式碼降成人看得懂的形狀與結構的工具，例如地圖、依賴圖，以及和程式碼一步步對照的自然語言證明。上面兩張地圖，就是本站為這種儀器做的一小塊前端面板。",
            ],
            [
              "**A path for new mathematics**: a new concept, once invented, enters that library and shortens everyone's next path.",
              "**一條讓新數學進來的路**：一個新概念一旦被發明，就收進這個函式庫，縮短所有人的下一條路。",
            ],
          ]}
        />
        <P
          t={[
            "**Pencil and paper remain the tools of understanding, but for the largest problems they may no longer be enough on their own to produce and check a proof.**",
            "**紙筆仍是理解的工具，但對最大的問題，它可能已不足以獨力完成證明與檢查。**",
          ]}
        />
      </Callout>
    </Section>
  );
}
