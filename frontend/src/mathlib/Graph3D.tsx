/**
 * A 3D force-directed graph (three.js through 3d-force-graph). The library is loaded on first use with a dynamic
 * import, so it stays out of the site's main bundle. Generic: the Mathlib map passes either a theorem's dependency
 * graph or the galaxy of Mathlib's districts.
 */
import { useLang } from "@learnkit/web";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ForceGraph3DInstance } from "3d-force-graph";

export interface G3Node {
  id: number;
  label: string;
  color: string;
  val: number;
}

export interface G3Link {
  source: number;
  target: number;
  color?: string;
  width?: number;
  /** moving dots along the link (the guided path) */
  particles?: number;
}

type Inst = ForceGraph3DInstance<G3Node & { x?: number; y?: number; z?: number }, G3Link>;

export default function Graph3D({
  nodes,
  links,
  focus,
  onSelect,
  height = 460,
  arrows = true,
  testId,
  side,
  card,
}: {
  nodes: G3Node[];
  links: G3Link[];
  /** node id to fly the camera to */
  focus?: number | null;
  onSelect?: (id: number) => void;
  height?: number;
  arrows?: boolean;
  testId?: string;
  /** shown beside the graph when it is enlarged to the whole window (the selected item's details) */
  side?: ReactNode;
  /** what to show in the card that follows the pointer over a node (its relationships); without it, the name only */
  card?: (id: number) => ReactNode;
}) {
  const { pick } = useLang();
  const outer = useRef<HTMLDivElement>(null);
  const [big, setBig] = useState(false);
  // hovering a node lights up its links and its neighbours and dims the rest, and shows a card at the pointer
  const [hovered, setHovered] = useState<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const neighbours = useMemo(() => {
    const m = new Map<number, Set<number>>();
    const add = (a: number, b: number) => (m.get(a) ?? m.set(a, new Set()).get(a)!).add(b);
    for (const l of links) add(l.source, l.target), add(l.target, l.source);
    return m;
  }, [links]);
  const box = useRef<HTMLDivElement>(null);
  const inst = useRef<Inst | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const cardRef = useRef(card);
  cardRef.current = card;
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  // create once
  useEffect(() => {
    let alive = true;
    let observer: ResizeObserver | null = null;
    import("3d-force-graph")
      .then(({ default: ForceGraph3D }) => {
        if (!alive || !box.current) return;
        const g = new ForceGraph3D(box.current, { controlType: "orbit" }) as unknown as Inst;
        g.backgroundColor("#0b1020")
          .showNavInfo(false)
          .width(box.current.clientWidth)
          .height(height)
          .nodeLabel((n) => (cardRef.current ? "" : n.label))
          .onNodeHover((n) => setHovered(n ? n.id : null))
          .nodeColor((n) => n.color)
          .nodeVal((n) => n.val)
          .nodeOpacity(0.95)
          .nodeResolution(12)
          .linkColor((l) => l.color ?? "rgba(148,163,184,0.35)")
          .linkWidth((l) => l.width ?? 0)
          .linkOpacity(0.5)
          .linkDirectionalParticles((l) => l.particles ?? 0)
          .linkDirectionalParticleWidth(2.2)
          .linkDirectionalParticleColor(() => "#fde68a")
          .onNodeClick((n) => select.current?.(n.id))
          .cooldownTicks(120);
        if (arrows) g.linkDirectionalArrowLength(3).linkDirectionalArrowRelPos(1);
        inst.current = g;
        // follow the box in both directions: it changes height when the view is enlarged
        observer = new ResizeObserver(() => box.current && g.width(box.current.clientWidth).height(box.current.clientHeight));
        observer.observe(box.current);
        setState("ready");
      })
      .catch(() => alive && setState("failed"));
    return () => {
      alive = false;
      observer?.disconnect();
      inst.current?._destructor();
      inst.current = null;
      if (box.current) box.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // data
  useEffect(() => {
    const g = inst.current;
    if (!g) return;
    g.graphData({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) });
    g.onEngineStop(() => {
      g.onEngineStop(() => {});
      fitCore(g);
    });
  }, [nodes, links, state]);

  // light up the hovered node's links and neighbours; dim everything else
  useEffect(() => {
    const g = inst.current;
    if (!g) return;
    const near = hovered == null ? null : (neighbours.get(hovered) ?? new Set<number>());
    const end = (x: unknown) => (typeof x === "object" && x !== null ? (x as { id: number }).id : (x as number));
    const touches = (l: G3Link) => hovered != null && (end(l.source) === hovered || end(l.target) === hovered);
    g.nodeColor((n) => (near === null || n.id === hovered || near.has(n.id) ? n.color : "rgba(100,116,139,0.25)"))
      .linkColor((l) => (touches(l) ? "#fde68a" : near === null ? (l.color ?? "rgba(148,163,184,0.35)") : "rgba(148,163,184,0.06)"))
      .linkWidth((l) => (touches(l) ? 1.4 : (l.width ?? 0)));
    if (box.current) box.current.style.cursor = hovered == null ? "" : "pointer";
  }, [hovered, neighbours, state]);

  // camera on the focused node — only when the reader picks one; the first view is the whole graph (fitCore)
  const firstFocus = useRef(true);
  useEffect(() => {
    const g = inst.current;
    if (!g || focus == null) return;
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    const t = setTimeout(() => {
      const n = g.graphData().nodes.find((x) => x.id === focus) as (G3Node & { x?: number; y?: number; z?: number }) | undefined;
      if (!n || n.x === undefined) return;
      // stand back in proportion to the node's size (3d-force-graph draws radius ∝ ∛val), so big nodes don't fill the view
      const d = 120 + 14 * Math.cbrt(Math.max(1, n.val));
      const r = 1 + d / Math.max(1, Math.hypot(n.x, n.y ?? 0, n.z ?? 0));
      g.cameraPosition({ x: n.x * r, y: (n.y ?? 0) * r, z: (n.z ?? 0) * r }, { x: n.x, y: n.y ?? 0, z: n.z ?? 0 }, 900);
    }, 50);
    return () => clearTimeout(t);
  }, [focus, state]);

  // enlarged: Esc returns; the page behind does not scroll
  useEffect(() => {
    if (!big) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setBig(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
    };
  }, [big]);

  // after the view changes size (enlarged or back), frame the whole graph again
  const fit = () => fitCore(inst.current);
  useEffect(() => {
    // twice: once the canvas has its new size, and again after the layout settles
    const a = setTimeout(fit, 150);
    const b = setTimeout(fit, 700);
    return () => (clearTimeout(a), clearTimeout(b));
  }, [big]);

  return (
    <div
      ref={outer}
      className={big ? "fixed inset-0 z-[60] flex bg-[#0b1020]" : "relative overflow-hidden rounded-lg border border-slate-800 bg-[#0b1020]"}
      style={big ? undefined : { height }}
      data-testid={testId}
      role={big ? "dialog" : undefined}
      aria-modal={big || undefined}
      aria-label={big ? pick(["Enlarged 3D view", "放大的 3D 檢視"]) : undefined}
    >
      <div
        className="relative h-full min-w-0 flex-1"
        onMouseMove={(e) => {
          // tracked all the time, so the card opens at the pointer on the first frame of a hover
          const r = e.currentTarget.getBoundingClientRect();
          setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <div ref={box} className="h-full w-full" />
        {hovered != null && card && (
          <HoverCard x={pointer.x} y={pointer.y}>
            {card(hovered)}
          </HoverCard>
        )}
        {state !== "ready" && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-300">
            {state === "loading" ? "…" : pick(["3D view unavailable", "無法顯示 3D"])}
          </p>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button
            type="button"
            onClick={fit}
            disabled={state !== "ready"}
            className="rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-40"
            title={pick(["Show the whole graph", "顯示整張圖"])}
            data-testid="graph3d-fit"
          >
            ⊡ {pick(["Zoom to fit", "縮放至全圖"])}
          </button>
          <button
            type="button"
            onClick={() => setBig((b) => !b)}
            className="rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 hover:bg-slate-800"
            data-testid="graph3d-enlarge"
          >
            {big ? `✕ ${pick(["Close", "關閉"])}` : `⤢ ${pick(["Enlarge", "放大"])}`}
          </button>
        </div>
        {big && (
          <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-slate-400">
            {pick(["Drag to turn · scroll to zoom · right-drag to move · click a star · Esc to close", "拖曳旋轉 · 滾輪縮放 · 右鍵拖曳平移 · 點一顆星 · Esc 關閉"])}
          </p>
        )}
      </div>
      {big && side && <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-700 bg-white p-3">{side}</aside>}
    </div>
  );
}

/** A small card that follows the pointer over the graph, flipped to stay inside it. */
function HoverCard({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState({ x: false, y: false });
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    setFlip({ x: x + 16 + el.offsetWidth > parent.clientWidth, y: y + 16 + el.offsetHeight > parent.clientHeight });
  }, [x, y]);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-10 w-72 rounded-lg border border-gray-200 bg-white/95 p-2.5 text-xs text-gray-700 shadow-lg"
      style={{
        left: flip.x ? undefined : x + 16,
        right: flip.x ? `calc(100% - ${x - 16}px)` : undefined,
        top: flip.y ? undefined : y + 16,
        bottom: flip.y ? `calc(100% - ${y - 16}px)` : undefined,
      }}
      data-testid="graph3d-card"
    >
      {children}
    </div>
  );
}

/**
 * Zoom to fit the core of the graph: a few loosely linked nodes drift far out and would make a plain zoomToFit frame
 * mostly empty space, so the farthest 5% from the centroid are left out of the frame (they stay in the graph).
 */
function fitCore(g: Inst | null) {
  if (!g) return;
  const ns = g.graphData().nodes as { x?: number; y?: number; z?: number }[];
  const placed = ns.filter((n) => n.x !== undefined);
  if (placed.length < 20) return void g.zoomToFit(600, 40);
  const c = { x: 0, y: 0, z: 0 };
  for (const n of placed) {
    c.x += (n.x ?? 0) / placed.length;
    c.y += (n.y ?? 0) / placed.length;
    c.z += (n.z ?? 0) / placed.length;
  }
  const dist = (n: { x?: number; y?: number; z?: number }) => Math.hypot((n.x ?? 0) - c.x, (n.y ?? 0) - c.y, (n.z ?? 0) - c.z);
  const sorted = placed.map(dist).sort((a, b) => a - b);
  const limit = sorted[Math.floor(sorted.length * 0.95)];
  g.zoomToFit(600, 40, (n) => dist(n as { x?: number; y?: number; z?: number }) <= limit);
}
