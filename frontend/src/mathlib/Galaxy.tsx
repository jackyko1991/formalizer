/**
 * All of Mathlib as a galaxy: every module (file) grouped into districts (Mathlib.Algebra.Group, Mathlib.Topology.Algebra,
 * …), one star per district sized by its theorems, linked to the districts it imports most. 3D, or a list by area.
 */
import { Graph3D, useLang, type G3Link, type G3Node } from "@learnkit/web";
import { useMemo, useState } from "react";
import { AREAS, areaOf, docsUrl, loadGalaxy, type Galaxy as GalaxyData, type MathlibIndex } from "./data";
import { AreaDot, Legend, STAR_HINT } from "./Explorer";
import { useAsync, useViewMode } from "./hooks";

/** The `k` heaviest import links out of each district. */
export function topLinks(g: GalaxyData, k = 2): [number, number, number][] {
  const out = new Map<number, [number, number, number][]>();
  for (const l of g.links) (out.get(l[0]) ?? out.set(l[0], []).get(l[0])!).push(l);
  return [...out.values()].flatMap((ls) => ls.sort((a, b) => b[2] - a[2]).slice(0, k));
}

export default function Galaxy({ index, onOpen }: { index: MathlibIndex; onOpen: (theorem: number) => void }) {
  const { pick } = useLang();
  const { data: g, error } = useAsync(loadGalaxy, "galaxy");
  const [mode, setMode, webgl] = useViewMode();
  const [sel, setSel] = useState<number | null>(null);

  const nodes = useMemo<G3Node[]>(
    () =>
      g?.districts.map(([name, mods, thms], i) => ({
        id: i,
        label: `${name} — ${mods} modules, ${thms} theorems`,
        color: areaOf(`${name}.X`).color,
        val: 0.5 + Math.sqrt(thms) / 6,
      })) ?? [],
    [g],
  );
  const links = useMemo<G3Link[]>(() => (g ? topLinks(g).map(([a, b]) => ({ source: a, target: b })) : []), [g]);

  if (error) return <p className="text-xs text-red-700">{error}</p>;
  if (!g) return <p className="text-xs text-gray-500">{pick(["Loading the galaxy…", "載入星系中…"])}</p>;

  const totals = g.modules.reduce((s, m) => [s[0] + m[1], s[1] + m[2]], [0, 0]);
  // the selected district's files: beside the graph, and inside it when the graph is enlarged
  const details =
    sel != null ? (
      <District g={g} d={sel} index={index} onOpen={onOpen} />
    ) : (
      <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500">
        {pick(["Click a star (a district of Mathlib) to see its files.", "點一顆星（Mathlib 的一個區域）看看裡面的檔案。"])}
      </p>
    );
  return (
    <div className="space-y-2" data-testid="mathlib-galaxy">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span>
          {pick([
            `${g.modules.length.toLocaleString()} modules · ${totals[0].toLocaleString()} theorems · ${totals[1].toLocaleString()} definitions · ${g.districts.length} districts`,
            `${g.modules.length.toLocaleString()} 個模組 · ${totals[0].toLocaleString()} 條定理 · ${totals[1].toLocaleString()} 個定義 · ${g.districts.length} 個區域`,
          ])}
        </span>
        <span className="ml-auto flex overflow-hidden rounded-md border border-gray-300">
          {(["3d", "tree"] as const).map((m) => (
            <button
              key={m}
              disabled={m === "3d" && !webgl}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 ${mode === m ? "bg-(--lk-accent) text-white" : "bg-white text-gray-600 hover:bg-gray-50"} disabled:opacity-40`}
            >
              {m === "3d" ? pick(["3D galaxy", "3D 星系"]) : pick(["List", "清單"])}
            </button>
          ))}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {mode === "3d" ? (
            <Graph3D nodes={nodes} links={links} focus={sel} onSelect={setSel} height={420} arrows={false} testId="mathlib-galaxy-3d" hint={STAR_HINT} side={details} card={(d) => <DistrictHover g={g} d={d} />} />
          ) : (
            <AreaList g={g} onSelect={setSel} />
          )}
        </div>
        <div className="min-w-0">{details}</div>
      </div>
      <Legend areas={new Set(AREAS.filter((a) => a.id !== "axiom").map((a) => a.id))} />
    </div>
  );
}

function AreaList({ g, onSelect }: { g: GalaxyData; onSelect: (d: number) => void }) {
  const { pick } = useLang();
  const byArea = new Map<string, number[]>();
  g.districts.forEach((d, i) => {
    const a = areaOf(`${d[0]}.X`).id;
    (byArea.get(a) ?? byArea.set(a, []).get(a)!).push(i);
  });
  const max = Math.max(...g.districts.map((d) => d[2]));
  return (
    <div className="max-h-[420px] space-y-1 overflow-auto rounded-lg border border-gray-200 bg-white p-2 text-xs" data-testid="mathlib-galaxy-list">
      {AREAS.filter((a) => byArea.has(a.id)).map((a) => {
        const ds = byArea.get(a.id)!.sort((x, y) => g.districts[y][2] - g.districts[x][2]);
        const thms = ds.reduce((s, d) => s + g.districts[d][2], 0);
        return (
          <details key={a.id}>
            <summary className="flex cursor-pointer items-center gap-1.5 py-0.5">
              <AreaDot color={a.color} />
              <span className="font-medium">{pick(a.label)}</span>
              <span className="text-gray-400">
                {ds.length} · {thms.toLocaleString()} {pick(["theorems", "條定理"])}
              </span>
            </summary>
            <ul className="ml-4">
              {ds.map((d) => (
                <li key={d}>
                  <button onClick={() => onSelect(d)} className="flex w-full items-center gap-2 py-0.5 text-left hover:bg-gray-50">
                    <span className="w-56 shrink-0 truncate font-mono">{g.districts[d][0]}</span>
                    <span className="h-1.5 rounded-full" style={{ width: `${Math.max(2, (100 * g.districts[d][2]) / max)}%`, background: a.color }} />
                  </button>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function District({ g, d, index, onOpen }: { g: GalaxyData; d: number; index: MathlibIndex; onOpen: (theorem: number) => void }) {
  const { pick } = useLang();
  const [name, mods, thms, defs] = g.districts[d];
  const files = g.modules.filter((m) => m[3] === d).sort((a, b) => b[1] - a[1]);
  const uses = g.links
    .filter((l) => l[0] === d)
    .sort((a, b) => b[2] - a[2])
    .slice(0, 5)
    .map((l) => g.districts[l[1]][0]);
  const curated = index.theorems.map((t, i) => [t, i] as const).filter(([t]) => files.some((f) => f[0] === t.module));
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700" data-testid="mathlib-district">
      <p className="flex items-center gap-1.5 font-mono text-sm font-semibold break-all text-gray-900">
        <AreaDot color={areaOf(`${name}.X`).color} />
        {name}
      </p>
      <p className="text-gray-600">
        {pick([`${mods} modules, ${thms} theorems, ${defs} definitions.`, `${mods} 個模組、${thms} 條定理、${defs} 個定義。`])}
      </p>
      {uses.length > 0 && (
        <p className="text-gray-500">
          {pick(["Imports most from:", "最常匯入："])} <span className="font-mono">{uses.join(", ")}</span>
        </p>
      )}
      {curated.map(([t, i]) => (
        <button key={t.name} onClick={() => onOpen(i)} className="block text-left text-(--lk-accent) hover:underline">
          ★ {pick([t.en, t.zh])} →
        </button>
      ))}
      <ul className="max-h-56 overflow-auto border-t border-gray-100 pt-1">
        {files.slice(0, 60).map((f) => (
          <li key={f[0]} className="flex gap-2">
            <a href={docsUrl(f[0])} target="_blank" rel="noreferrer" className="min-w-0 truncate font-mono text-(--lk-accent) hover:underline">
              {f[0]}
            </a>
            <span className="ml-auto shrink-0 text-gray-400">{f[1]}</span>
          </li>
        ))}
        {files.length > 60 && <li className="text-gray-400">+{files.length - 60}</li>}
      </ul>
    </div>
  );
}

/** The card under the pointer for one district: what it is, how big, and its strongest links both ways. */
function DistrictHover({ g, d }: { g: GalaxyData; d: number }) {
  const { pick } = useLang();
  const [name, mods, thms, defs] = g.districts[d];
  const area = areaOf(`${name}.X`);
  const top = (pairs: [number, number][]) =>
    pairs
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, w]) => (
        <li key={k} className="flex justify-between gap-2">
          <span className="truncate font-mono">{g.districts[k][0].replace(/^Mathlib\./, "")}</span>
          <span className="shrink-0 text-gray-400">{w}</span>
        </li>
      ));
  const uses = top(g.links.filter((l) => l[0] === d).map((l) => [l[1], l[2]]));
  const usedBy = top(g.links.filter((l) => l[1] === d).map((l) => [l[0], l[2]]));
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 font-mono font-semibold break-all text-gray-900">
        <AreaDot color={area.color} />
        {name}
      </p>
      <p className="text-gray-500">
        {pick(area.label)} · {pick([`${mods} modules, ${thms} theorems, ${defs} definitions`, `${mods} 個模組、${thms} 條定理、${defs} 個定義`])}
      </p>
      {uses.length > 0 && (
        <div>
          <p className="font-medium text-gray-700">{pick(["Builds on (imports)", "建立在（匯入）"])}</p>
          <ul>{uses}</ul>
        </div>
      )}
      {usedBy.length > 0 && (
        <div>
          <p className="font-medium text-gray-700">{pick(["Used by (imported by)", "被誰用到（被匯入）"])}</p>
          <ul>{usedBy}</ul>
        </div>
      )}
      <p className="text-[10px] text-gray-400">{pick(["Numbers: import links. Click to open its files.", "數字：匯入連結數。點一下打開它的檔案。"])}</p>
    </div>
  );
}
