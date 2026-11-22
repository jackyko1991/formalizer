/**
 * Concept ▸ the Riemann case, section "Two maps" (lazy-loaded by Rh.tsx): what Mathlib's `RiemannHypothesis` rests on
 * (its dependency graph, from the Mathlib map: frontend/public/mathlib, scripts/mathlib_graph) and the shape of the
 * proof (its 175,187 files as districts linked by imports: frontend/public/rh/proof-map.json,
 * scripts/rh_map/generate.py, which reads the Lean source as text and never builds or runs it). Both 3D views load
 * three.js on demand; each has a list / tree fallback.
 */
import { go, Graph3D, RichText, useLang, type G3Link, type G3Node } from "@learnkit/web";
import { useMemo, useState, type ReactNode } from "react";
import { adjacency, areaOf, loadGraph, loadIndex, reachable, shortestPath, type MathlibIndex, type TheoremGraph } from "../../mathlib/data";
import { AreaDot, Legend, NodeCard, STAR_HINT, TheoremGraph3D, TreeView } from "../../mathlib/Explorer";
import { useAsync, useViewMode } from "../../mathlib/hooks";
import { colourOf, drawnLinks, folders, loadProofMap, MAIN, MAIN_COLOUR, neighbours, STATEMENT, STATEMENT_COLOUR, type ProofMap } from "../../rh/proofMap";
import { Callout, Lean, P, Section, SiteLink, Table, type L } from "../kit";
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

function ModeSwitch({ mode, setMode, webgl, other }: { mode: "3d" | "tree"; setMode: (m: "3d" | "tree") => void; webgl: boolean; other: L }) {
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
    () => (entry ? loadGraph(entry) : Promise.reject(new Error("RiemannHypothesis is not on the Mathlib map"))),
    entry?.file ?? "none",
  );
  if (error || gError || (index && !entry)) return <p className="text-xs text-red-700">{error ?? gError ?? "RiemannHypothesis is not on the Mathlib map"}</p>;
  if (!index || !entry || !graph) return <p className="text-xs text-gray-500">{pick(["Loading the map…", "載入地圖中…"])}</p>;
  return <StatementGraph index={index} graph={graph} />;
}

function StatementGraph({ index, graph }: { index: MathlibIndex; graph: TheoremGraph }) {
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
  const visible = useMemo(() => (only == null ? new Set(graph.nodes.map((_, i) => i)) : reachable(graph, only, adj)), [graph, only, adj]);

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
      <div className="flex flex-wrap items-center gap-1 text-xs" aria-label={pick(["The guided path", "導覽路徑"])}>
        <span className="mr-1 text-gray-500">{pick(["Guided path:", "導覽路徑："])}</span>
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
        <ModeSwitch mode={mode} setMode={setMode} webgl={webgl} other={["Tree", "樹狀"]} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2">
          {mode === "3d" ? (
            <TheoremGraph3D graph={graph} visible={visible} highlight={highlight} focus={sel} onSelect={select} side={card} />
          ) : (
            <TreeView graph={graph} from={only ?? 0} selected={sel} highlight={highlight} onSelect={select} />
          )}
          <Legend areas={new Set(graph.nodes.map((n) => areaOf(n.module, n.kind).id))} />
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

function ProofShape() {
  const { pick } = useLang();
  const { data: map, error } = useAsync(loadProofMap, "proof-map");
  if (error) return <p className="text-xs text-red-700">{error}</p>;
  if (!map) return <p className="text-xs text-gray-500">{pick(["Loading the map…", "載入地圖中…"])}</p>;
  return <ProofGraph map={map} />;
}

function ProofGraph({ map }: { map: ProofMap }) {
  const { pick } = useLang();
  const [mode, setMode, webgl] = useViewMode();
  const statement = map.districts.findIndex((d) => d.flags & STATEMENT);
  const main = map.districts.findIndex((d) => d.flags & MAIN);
  const [sel, setSel] = useState<number>(main);
  const nodes = useMemo<G3Node[]>(
    () =>
      map.districts.map((d, i) => ({
        id: i,
        label: d.name,
        color: colourOf(d),
        val: d.flags & (STATEMENT | MAIN) ? 40 : Math.max(0.4, d.lines / 3000),
      })),
    [map],
  );
  const links = useMemo<G3Link[]>(
    () =>
      drawnLinks(map).map(([a, b, w]) =>
        a === main || b === statement
          ? { source: a, target: b, color: "#fbbf24", width: 1.2, particles: 3 }
          : { source: a, target: b, width: w > 2000 ? 0.6 : 0 },
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
        <ModeSwitch mode={mode} setMode={setMode} webgl={webgl} other={["List", "清單"]} />
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
              {pick(["the statement (Statements.lean)", "陳述（Statements.lean）"])}
            </li>
            <li className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-gray-400" style={{ background: MAIN_COLOUR }} />
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
                  {t.top} <span className="text-gray-400">{Math.round((100 * t.lines) / map.meta.lines)}%</span>
                </li>
              ))}
          </ul>
        </div>
        <div className="min-w-0">{card}</div>
      </div>
    </div>
  );
}

function linkTo(name: string, single: boolean, commit: string): string {
  return single ? `${REPO}/blob/${commit}/src/${name}.lean` : `${REPO}/tree/${commit}/src/${name}`;
}

function DistrictCard({ map, i, onSelect }: { map: ProofMap; i: number; onSelect: (i: number) => void }) {
  const { pick } = useLang();
  const d = map.districts[i];
  if (!d) return null;
  const nb = neighbours(map, i, 5);
  const single = d.files === 1 && d.topFiles.length === 1 && `${d.name}.lean`.endsWith(d.topFiles[0][0]);
  const row = ([j, w]: [number, number]) => (
    <li key={j}>
      <button onClick={() => onSelect(j)} className="flex w-full items-center gap-1 text-left font-mono break-all hover:underline">
        <AreaDot color={colourOf(map.districts[j])} />
        {map.districts[j].name}
        <span className="ml-auto shrink-0 pl-1 text-gray-400">{fmt(w)}</span>
      </button>
    </li>
  );
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700" data-testid="rh-district">
      <p className="flex items-center gap-1.5">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: d.flags & MAIN ? "#334155" : colourOf(d) }}>
          {d.flags & STATEMENT ? pick(["the statement", "陳述"]) : d.flags & MAIN ? pick(["the main theorem", "主定理"]) : d.top}
        </span>
        <span className="text-[10px] text-gray-500">{single ? pick(["one file", "單一檔案"]) : pick(["a folder (district)", "一個資料夾（區域）"])}</span>
      </p>
      <p className="font-mono text-sm font-semibold break-all text-gray-900">{single ? `${d.name}.lean` : `${d.name}/`}</p>
      <p>
        {pick([
          `${fmt(d.lines)} lines in ${fmt(d.files)} file${d.files === 1 ? "" : "s"} (${((100 * d.lines) / map.meta.lines).toFixed(d.lines * 1000 < map.meta.lines ? 3 : 1)}% of the proof); ${fmt(d.mathlibFiles)} of ${d.files === 1 ? "them" : "its files"} import Mathlib directly.`,
          `${fmt(d.files)} 個檔案、${fmt(d.lines)} 行（佔整個證明的 ${((100 * d.lines) / map.meta.lines).toFixed(d.lines * 1000 < map.meta.lines ? 3 : 1)}%）；其中 ${fmt(d.mathlibFiles)} 個直接匯入 Mathlib。`,
        ])}
      </p>
      {d.flags & STATEMENT ? (
        <p className="rounded bg-amber-50 px-2 py-1 text-amber-900">
          {pick([
            "The five claims, stated with Mathlib's definitions; it imports only Mathlib. The re-check copies this text into Challenge.lean for the comparator. This is the file a reader must check by eye.",
            "五個宣稱，用 Mathlib 的定義寫成；它只匯入 Mathlib。重驗把這段文字複製到 Challenge.lean 給 comparator 用。這是讀者必須親眼檢查的檔案。",
          ])}
        </p>
      ) : null}
      {d.flags & MAIN ? (
        <p className="rounded bg-slate-100 px-2 py-1 text-slate-800">
          {pick([
            "`theorem riemannHypothesis : RiemannHypothesis`, and the four other claims. It imports the statement and the proof; following its imports reaches every file of the project.",
            "`theorem riemannHypothesis : RiemannHypothesis` 以及另外四個宣稱。它匯入陳述與證明；沿著它的匯入可以走到專案裡的每一個檔案。",
          ])}
        </p>
      ) : null}
      <a href={linkTo(d.name, single, map.meta.commit)} target="_blank" rel="noreferrer" className="text-(--lk-accent) hover:underline">
        {pick(["Read it on GitHub (as text)", "在 GitHub 上閱讀（純文字）"])} ↗
      </a>
      {!single && d.topFiles.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">{pick(["Largest files", "最大的檔案"])}</p>
          <ul>
            {d.topFiles.map(([f, n]) => (
              <li key={f} className="flex gap-1 font-mono break-all">
                {f}
                <span className="ml-auto shrink-0 pl-1 text-gray-400">{fmt(n)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {nb.out.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">{pick(["Imports most from (file imports)", "最常從這些區域匯入（檔案匯入數）"])}</p>
          <ul>{nb.out.map(row)}</ul>
        </div>
      )}
      {nb.in.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="font-semibold text-gray-600">{pick(["Imported most by", "最常被這些區域匯入"])}</p>
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
        {pick([`${fmt(d.lines)} lines · ${fmt(d.files)} files · ${d.top}`, `${fmt(d.lines)} 行 · ${fmt(d.files)} 個檔案 · ${d.top}`])}
      </p>
      {nb.out.length > 0 && (
        <p className="text-gray-600">
          {pick(["imports most: ", "最常匯入："])}
          <span className="font-mono">{nb.out.map(([j, w]) => `${map.districts[j].name} (${fmt(w)})`).join(", ")}</span>
        </p>
      )}
    </div>
  );
}

function DistrictList({ map, sel, onSelect }: { map: ProofMap; sel: number; onSelect: (i: number) => void }) {
  const { pick } = useLang();
  const tops = folders(map);
  const max = tops[0]?.lines ?? 1;
  const byTop = (top: string) =>
    map.districts
      .map((d, i) => [d, i] as const)
      .filter(([d]) => d.top === top)
      .sort((a, b) => b[0].lines - a[0].lines);
  return (
    <div className="max-h-[460px] space-y-1 overflow-auto rounded-lg border border-gray-200 bg-white p-2 text-xs" data-testid="rh-proof-list">
      {tops.map((t) => {
        const ds = byTop(t.top);
        return (
          <details key={t.top} open={ds.some(([, i]) => i === sel) && ds.length < 40}>
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
                {pick([`${fmt(t.lines)} lines · ${fmt(t.files)} files`, `${fmt(t.lines)} 行 · ${fmt(t.files)} 個檔案`])}
              </span>
            </summary>
            <ul className="ml-4 border-l border-gray-200 pl-2">
              {ds.slice(0, 60).map(([d, i]) => (
                <li key={i}>
                  <button
                    onClick={() => onSelect(i)}
                    className={`flex w-full gap-2 rounded px-1 text-left hover:bg-gray-50 ${i === sel ? "bg-teal-50 ring-1 ring-(--lk-accent)" : ""}`}
                  >
                    <span className="min-w-0 font-mono break-all">{d.name}</span>
                    <span className="ml-auto shrink-0 text-gray-400">{fmt(d.lines)}</span>
                  </button>
                </li>
              ))}
              {ds.length > 60 && <li className="text-gray-400">{pick([`… and ${ds.length - 60} more`, `……還有 ${ds.length - 60} 個`])}</li>}
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

function Scale() {
  const { data: map } = useAsync(loadProofMap, "proof-map");
  const ml = map?.meta.mathlib;
  if (!map || !ml) return null;
  const lines = map.meta.lines / ml.lines;
  const files = map.meta.files / ml.files;
  return (
    <P
      t={[
        `For scale: all of Mathlib (${ml.version}), the library built by hundreds of people since 2017, is ${fmt(ml.lines)} lines in ${fmt(ml.files)} files. This one proof is about ${lines.toFixed(1)} times as many lines and ${Math.round(files)} times as many files, and ${fmt(map.meta.mathlibFiles)} of its files import Mathlib directly.`,
        `比較一下規模：整個 Mathlib（${ml.version}），由數百人從 2017 年起一起寫成，共 ${fmt(ml.lines)} 行、${fmt(ml.files)} 個檔案。這一個證明的行數大約是它的 ${lines.toFixed(1)} 倍，檔案數大約是 ${Math.round(files)} 倍，其中 ${fmt(map.meta.mathlibFiles)} 個檔案直接匯入 Mathlib。`,
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
      <figure className="space-y-1.5" aria-label={pick(["Peak memory of each step, next to a 16 GB laptop", "每一步的記憶體峰值，與 16 GB 筆電並排"])}>
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
              <span className={`block h-3 rounded-r ${m.laptop ? "bg-gray-400" : "bg-teal-600"}`} style={{ width: `${m.gb}%` }} />
            </span>
            <span className="whitespace-nowrap text-gray-900">{pick(m.value)}</span>
          </div>
        ))}
        <figcaption className="pt-1 text-[11px] text-gray-500">
          {pick(["Peak memory (RAM), bars to one scale; grey is the laptop.", "記憶體（RAM）峰值，長條用同一個比例；灰色是筆電。"])}
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
            ["Build in a sandbox (`lake build Main`, 192 cores)", "在沙盒中建置（`lake build Main`，192 核心）"],
            ["≈ 8 h (21 Nov 10:09 → 18:07 UTC, with restarts)", "約 8 小時（11/21 10:09 → 18:07 UTC，中間有重啟）"],
            ["~100 GB RAM, 70 GB disk; 175,187 modules, zero errors", "約 100 GB 記憶體、70 GB 硬碟；175,187 個模組，零錯誤"],
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
            ["Lean's own kernels (default, paranoid; comparator's kernel stage)", "Lean 自己的核心（預設、paranoid；comparator 的核心階段）"],
            ["single-threaded: still running after ≈ 45 h, as of 22 Nov 16:20 UTC", "單執行緒：截至 11/22 16:20 UTC，跑了約 45 小時仍在跑"],
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
        <a href={SUTHERLAND} target="_blank" rel="noreferrer" className="underline">
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

export default function RhMaps({ page, n, title }: { page: string; n: number; title: L }): ReactNode {
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
                    label={["The same graph in the Mathlib map (search: RiemannHypothesis)", "Mathlib 地圖裡的同一張圖（搜尋：RiemannHypothesis）"]}
                  />
                </p>
              </>
            ),
          },
          {
            id: "proof",
            label: ["The shape of the proof (certified in Lean)", "證明的形狀（Lean 已認證）"],
            body: (
              <>
                <P
                  t={[
                    "The proof is 17,374,215 lines in 175,187 files. Nobody reads that line by line, but its *shape* can be read: which folders there are, how big they are, and which import which. Each star is a folder of files (a district), sized by its lines and coloured by its top-level folder. The gold star is the statement file; the white one is the main theorem, which imports it.",
                    "這份證明有 17,374,215 行、175,187 個檔案。沒有人能一行一行讀完，但它的 *形狀* 是讀得出來的：有哪些資料夾、各有多大、誰匯入誰。每顆星是一個資料夾（一個區域），大小代表行數，顏色代表它所屬的最上層資料夾。金色的星是陳述檔案；白色的是匯入它的主定理。",
                  ]}
                />
                <ProofShape />
                <Callout
                  kind="warn"
                  title={["A map of structure, not of correctness (as of 22 November 2026)", "這是結構圖，不是正確性的證明（截至 2026 年 11 月 22 日）"]}
                >
                  <P
                    t={[
                      "This map shows how the 17 million lines are organised, not that they are correct. It was made by reading the source as text (the published first commit, `40e56bab`): nothing was built or run, because running untrusted Lean code is itself a risk. Whether the proof is right is the checkers' job: on 21 November 2026 the Lean and Mathlib communities certified both the statement and the proof, after checking an inert export of it. Understanding it is still people's job.",
                      "這張圖顯示 1700 萬行是怎麼組織的，而不是它們是對的。它是把原始碼當成純文字讀出來的（公開的第一個 commit `40e56bab`）：沒有編譯、也沒有執行任何東西，因為執行不受信任的 Lean 程式碼本身就有風險。證明是否正確，是檢查器的工作：Lean 與 Mathlib 社群檢查了一份不會執行的證明匯出檔，並在 2026 年 11 月 21 日認證了陳述與證明。至於理解它，仍是人的工作。",
                    ]}
                  />
                  <SiteLink to={["concept", "checkers"]} label={["The checkers and the four questions", "檢查器與四個問題"]} />
                </Callout>
                <Scale />
              </>
            ),
          },
          {
            id: "compute",
            label: ["What the full Lean run takes", "完整跑一次 Lean 要多少資源"],
            body: <ComputeCost />,
          },
        ]}
      />
    </Section>
  );
}
