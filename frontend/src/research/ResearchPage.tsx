/**
 * Research ▸ the workspace for long proofs (#/research, #/research/<project>). Designed from the research brief:
 * the blueprint (lemma graph, status computed by Lean) is the home view; one lemma at a time with its informal note
 * beside the Lean; the goals and messages of that lemma on the right; a next-step note so you can stop; a "where was
 * I" card when you come back; the working copy autosaves, and the free tier keeps one saved version (restore swaps
 * them) plus unlimited exports. Projects live in ~/Formalizer through the runner, else in this browser.
 */
import { EditorView } from "@codemirror/view";
import { go, RichText, useLang } from "@learnkit/web";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { H, layout } from "../graphLayout";
import { check, joinFiles, RunnerError, type CheckResult, type Decl, type LeanFile } from "../runner";
import { runnerReady, useRunner } from "../RunnerPanel";
import { blueprintGraph, counts, declAt, exportZip, lostSince, place, readZip, summarize, workable, type Meta, type Placed } from "./model";
import { browserStore, diskStore, newId, protectBrowserStorage, type ProjectInfo, type SavedInfo, type Store } from "./store";
import { TEMPLATES, type Template } from "./templates";

type L = readonly [string, string];
const RESUME_AFTER_MS = 30 * 60 * 1000;

const STATUS: Record<Decl["status"], { glyph: string; cls: string; fill: string; label: L }> = {
  proved: {
    glyph: "✓",
    cls: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    fill: "fill-emerald-50 stroke-emerald-500",
    label: ["Proved, standard axioms only", "已證明，只用標準公理"],
  },
  depends: {
    glyph: "⚠",
    cls: "bg-orange-50 text-orange-800 ring-orange-200",
    fill: "fill-orange-50 stroke-orange-400",
    label: ["Its proof is written, but rests on something unproved", "證明寫好了，但依賴尚未證明的東西"],
  },
  sorry: {
    glyph: "◐",
    cls: "bg-amber-50 text-amber-800 ring-amber-200",
    fill: "fill-amber-50 stroke-amber-500",
    label: ["Still has a `sorry`: to prove", "還有 `sorry`：待證明"],
  },
  error: {
    glyph: "✖",
    cls: "bg-red-50 text-red-800 ring-red-200",
    fill: "fill-red-50 stroke-red-500",
    label: ["Lean rejects it: see the messages", "Lean 不接受：請看訊息"],
  },
  def: { glyph: "·", cls: "bg-gray-50 text-gray-700 ring-gray-200", fill: "fill-white stroke-gray-400", label: ["Definition", "定義"] },
};

function ago(ms: number | undefined, pick: (v: L) => string): string {
  if (!ms) return "";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return pick([`${s} s ago`, `${s} 秒前`]);
  if (s < 3600) return pick([`${Math.round(s / 60)} min ago`, `${Math.round(s / 60)} 分鐘前`]);
  if (s < 86400) return pick([`${Math.round(s / 3600)} h ago`, `${Math.round(s / 3600)} 小時前`]);
  return new Date(ms).toLocaleDateString();
}

function download(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ResearchPage({ id }: { id: string | null }) {
  return id ? <Workspace key={id} id={id} /> : <Home />;
}

// ---------------------------------------------------------------------------------------------------- home

function Home() {
  const { pick, lang } = useLang();
  const { runner } = useRunner();
  const ready = runnerReady(runner);
  const [projects, setProjects] = useState<(ProjectInfo & { where: Store["kind"] })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const store = ready ? diskStore : browserStore;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const disk = ready ? await diskStore.list().catch(() => []) : [];
      const browser = await browserStore.list();
      if (alive)
        setProjects([...disk.map((p) => ({ ...p, where: "disk" as const })), ...browser.map((p) => ({ ...p, where: "browser" as const }))]);
    })();
    return () => {
      alive = false;
    };
  }, [ready]);

  async function start(t: Template) {
    const title = pick(t.title);
    const id = newId(t.id === "empty" ? "project" : t.id);
    const meta: Meta = {
      title,
      main: t.main,
      statements: t.statements,
      notes: Object.fromEntries(Object.entries(t.notes).map(([k, v]) => [k, pick(v)])),
      next: {},
      template: t.id,
      lastVisit: Date.now(),
    };
    try {
      await store.put(id, t.files, meta);
      go("research", id);
    } catch (e) {
      setError(String(e));
    }
  }

  async function importFiles(list: FileList | null) {
    if (!list?.length) return;
    let files: LeanFile[] = [];
    let meta: Partial<Meta> & { order?: string[] } = {};
    for (const f of Array.from(list)) {
      if (f.name.endsWith(".zip")) {
        for (const e of readZip(new Uint8Array(await f.arrayBuffer()))) {
          if (e.name === "formalizer.json") meta = JSON.parse(e.text);
          else if (e.name.endsWith(".lean")) files.push({ name: e.name.split("/").pop()!, code: e.text });
        }
      } else if (f.name.endsWith(".lean")) files.push({ name: f.name, code: await f.text() });
    }
    if (!files.length) return setError(pick(["No .lean files found in what you chose.", "選取的檔案裡沒有 .lean 檔。"]));
    if (meta.order)
      files = [...meta.order.flatMap((n) => files.filter((f) => f.name === n)), ...files.filter((f) => !meta.order!.includes(f.name))];
    const title = meta.title ?? files[files.length - 1].name.replace(/\.lean$/, "");
    const full: Meta = {
      title,
      main: meta.main ?? "",
      statements: meta.statements ?? [],
      notes: meta.notes ?? {},
      next: meta.next ?? {},
      lastVisit: Date.now(),
    };
    const id = newId(title);
    await store.put(id, files, full);
    go("research", id);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 pt-6 pb-16" data-testid="research-home">
      <header>
        <p className="text-sm font-medium text-(--lk-accent)">{pick(["Research", "研究"])}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{pick(["Research workspace", "研究工作區"])}</h1>
        <p className="mt-3 text-gray-600">
          {pick([
            "For proofs that take days: a blueprint of lemmas whose status Lean computes, one lemma at a time with your notes beside the Lean, and a note of your next step so you can stop and come back.",
            "給要花好幾天的證明：一張由 Lean 計算狀態的引理藍圖，一次專心一條引理，筆記就在 Lean 旁邊，再寫下下一步，讓你可以放心停下、隨時回來。",
          ])}
        </p>
      </header>

      <p
        className={`rounded-lg px-4 py-3 text-sm ${ready ? "bg-teal-50 text-teal-900" : "bg-amber-50 text-amber-900"}`}
        data-testid="research-where"
      >
        {ready
          ? pick([
              "⌂ Projects are saved as plain .lean files in a folder on this computer: ~/Formalizer. Nothing goes to a server.",
              "⌂ 專案以一般的 .lean 檔存在這台電腦的資料夾裡：~/Formalizer。不會送到任何伺服器。",
            ])
          : pick([
              "Without the runner, projects are kept in this browser, which can clear them. Start the runner to save to a real folder (~/Formalizer) and to check proofs.",
              "沒有執行器時，專案存在這個瀏覽器裡，而瀏覽器可能會清掉它們。啟動執行器就能存到真正的資料夾（~/Formalizer），也才能檢查證明。",
            ])}
      </p>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{pick(["Start a project", "開始一個專案"])}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5" data-testid={`template-${t.id}`}>
              <h3 className="font-semibold text-gray-900">{pick(t.title)}</h3>
              <p className="mt-2 flex-1 text-sm text-gray-600">
                <RichText text={pick(t.about)} />
              </p>
              <button
                onClick={() => void start(t)}
                className="mt-4 self-start rounded-md bg-(--lk-accent) px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                {pick(["Start", "開始"])}
              </button>
            </div>
          ))}
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-(--lk-accent) hover:underline">
          <input type="file" accept=".zip,.lean" multiple className="hidden" onChange={(e) => void importFiles(e.target.files)} />
          {pick(["Import an export (.zip) or .lean files…", "匯入匯出檔（.zip）或 .lean 檔……"])}
        </label>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{pick(["Your projects", "你的專案"])}</h2>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{pick(["None yet.", "還沒有。"])}</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white" data-testid="research-projects">
            {projects.map((p) => (
              <li key={`${p.where}-${p.id}`}>
                <button
                  onClick={() => go("research", p.id)}
                  className="flex w-full flex-wrap items-baseline gap-x-3 px-5 py-3 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{p.title}</span>
                  <span className="text-xs text-gray-500">
                    {p.where === "disk" ? `⌂ ~/Formalizer/${p.id}` : pick(["this browser", "這個瀏覽器"])}
                  </span>
                  <span className="ml-auto text-xs text-gray-400" lang={lang}>
                    {ago(p.updated, pick)}
                    {p.saved && ` · ${pick(["saved version", "已存版本"])} ${new Date(p.saved.at).toLocaleDateString()}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- workspace

function Workspace({ id }: { id: string }) {
  const { pick } = useLang();
  const { runner, open: openRunner } = useRunner();
  const ready = runnerReady(runner);

  const [store, setStore] = useState<Store | null>(null);
  const [files, setFiles] = useState<LeanFile[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [saved, setSaved] = useState<SavedInfo | null>(null);
  const [folder, setFolder] = useState<string | undefined>();
  const [missing, setMissing] = useState(false);
  const [active, setActive] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  // a result with the line map of the files exactly as they were checked (they may have changed since)
  const [result, setResult] = useState<(CheckResult & { where: ReturnType<typeof joinFiles>["where"] }) | null>(null);
  const [checking, setChecking] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [resume, setResume] = useState<{ decl: string; away: number } | null>(null);
  const [protectedStorage, setProtected] = useState<boolean | null>(null);
  const [view, setView] = useState<"graph" | "outline">("graph");
  const [, tick] = useState(0);
  const loaded = useRef(false);
  const editor = useRef<EditorView | null>(null);
  const jump = useRef<number | null>(null);

  // --- load (the runner's folder first, then this browser)
  useEffect(() => {
    let alive = true;
    if (runner === "checking") return;
    void (async () => {
      let got = ready ? await diskStore.load(id).catch(() => null) : null;
      let s: Store = diskStore;
      if (!got) {
        got = await browserStore.load(id);
        s = browserStore;
      }
      if (!alive) return;
      if (!got) return setMissing(true);
      loaded.current = false;
      setStore(s);
      setFiles(got.files);
      setSaved(got.saved);
      setFolder(got.folder);
      const m: Meta = {
        ...got.meta,
        notes: got.meta.notes ?? {},
        next: got.meta.next ?? {},
        statements: got.meta.statements ?? [],
        main: got.meta.main ?? "",
      };
      if (m.lastVisit && Date.now() - m.lastVisit > RESUME_AFTER_MS && m.lastDecl) setResume({ decl: m.lastDecl, away: m.lastVisit });
      setMeta({ ...m, lastVisit: Date.now() });
      setActive(got.files.find((f) => m.lastDecl && f.code.includes(m.lastDecl))?.name ?? got.files[got.files.length - 1]?.name ?? "");
      setSelected(m.lastDecl ?? m.main ?? null);
      if (s.kind === "browser") setProtected(await protectBrowserStorage());
    })();
    return () => {
      alive = false;
    };
    // load once per project and runner availability; later edits are ours
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, runner === "checking", ready]);

  // --- autosave the working copy (not a version): about a second after each change, and when the page is hidden
  const latest = useRef({ files, meta });
  latest.current = { files, meta };
  const persist = useCallback(async () => {
    const { files: f, meta: m } = latest.current;
    if (!store || !m) return;
    try {
      await store.put(id, f, m);
      setSavedAt(Date.now());
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [store, id]);
  useEffect(() => {
    if (!store || !meta) return;
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    const t = setTimeout(() => void persist(), 1000);
    return () => clearTimeout(t);
  }, [files, meta, store, persist]);
  useEffect(() => {
    const hide = () => document.visibilityState === "hidden" && void persist();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", hide);
    };
  }, [persist]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000); // keep "saved 12 s ago" honest
    return () => clearInterval(t);
  }, []);

  // --- check with Lean on a pause in typing
  const joined = useMemo(() => joinFiles(files), [files]);
  useEffect(() => {
    if (!ready || !meta || !files.length) return;
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await check(joined.code, meta.main ? [meta.main] : [], meta.statements, true);
        setResult({ ...r, where: joined.where });
        setRunError(null);
      } catch (e) {
        setRunError(e instanceof RunnerError ? e.message : String(e));
      } finally {
        setChecking(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [joined, ready, meta?.main, meta?.statements, meta, files.length]);

  const placed: Placed[] = useMemo(() => (result?.decls ? place(result.decls, result.where) : []), [result]);
  const byName = useMemo(() => new Map(placed.map((d) => [d.name, d])), [placed]);
  const decl = selected ? byName.get(selected) : undefined;

  // --- moving between lemmas
  function selectDecl(name: string) {
    setSelected(name);
    setMeta((m) => m && { ...m, lastDecl: name });
    const d = byName.get(name);
    if (!d) return;
    jump.current = d.fileLine;
    if (d.file !== active) setActive(d.file);
    else scrollTo(d.fileLine);
  }
  function scrollTo(line: number) {
    const v = editor.current;
    if (!v) return;
    const at = v.state.doc.line(Math.min(Math.max(1, line), v.state.doc.lines));
    v.dispatch({ selection: { anchor: at.from }, effects: EditorView.scrollIntoView(at.from, { y: "start", yMargin: 24 }) });
    v.focus();
    jump.current = null;
  }

  // --- the one saved version
  const [saving, setSaving] = useState<null | { label: string; lost: string[] }>(null);
  async function askSave() {
    setSaving({ label: "", lost: lostSince(saved?.summary, result?.decls ?? []) });
  }
  async function doSave(label: string) {
    if (!store) return;
    await persist();
    const s = summarize(result?.decls ?? []);
    const auto = `${s.proved.length} ✓ · ${s.open.length} ◐ · ${s.failing.length} ✖`;
    setSaved(await store.saveVersion(id, label.trim() || auto, s));
    setSaving(null);
  }
  async function exportSaved() {
    const got = store && (await store.loadSaved(id));
    if (got) download(exportZip(got.files, got.meta), `${id}-saved.zip`);
  }
  async function restore() {
    if (!store || !saved) return;
    await persist();
    await store.restore(id, summarize(result?.decls ?? []));
    const got = await store.load(id);
    if (!got) return;
    loaded.current = false;
    setFiles(got.files);
    setMeta({ ...(got.meta as Meta), lastVisit: Date.now() });
    setSaved(got.saved);
    setActive(got.files[got.files.length - 1]?.name ?? "");
  }

  if (missing)
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <p className="text-gray-700">{pick(["This project isn't here. Is the runner running?", "找不到這個專案。執行器有在跑嗎？"])}</p>
        <button onClick={() => go("research")} className="mt-4 text-(--lk-accent) hover:underline">
          ◂ {pick(["All projects", "所有專案"])}
        </button>
      </div>
    );
  if (!meta || !store) return <p className="p-8 text-sm text-gray-500">{pick(["Opening…", "開啟中……"])}</p>;

  const c = counts(result?.decls ?? []);
  const activeFile = files.find((f) => f.name === active);
  const note = selected ? (meta.notes[selected] ?? "") : "";
  const next = selected ? (meta.next[selected] ?? "") : "";
  const goals = (result?.goals ?? [])
    .map((g) => ({ ...g, at: result!.where(g.line) }))
    .filter((g) => !decl || (g.at.file === decl.file && decl.fileLine <= g.at.line && g.at.line <= decl.fileEnd));
  const errors = (result?.errors ?? [])
    .map((e) => ({ ...e, at: e.line ? result!.where(e.line) : null }))
    .filter((e) => !decl || !e.at || (e.at.file === decl.file && decl.fileLine <= e.at.line && e.at.line <= decl.fileEnd));

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50/60" data-testid="research-workspace">
      {/* top bar: where things are, quietly */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 bg-white px-4 py-2 text-xs text-gray-600">
        <button onClick={() => go("research")} className="text-(--lk-accent) hover:underline">
          ◂ {pick(["Projects", "專案"])}
        </button>
        <span className="text-sm font-semibold text-gray-900">{meta.title}</span>
        <span title={folder} data-testid="storage-badge">
          {store.kind === "disk"
            ? `⌂ ~/Formalizer/${id}`
            : protectedStorage
              ? pick(["This browser · protected", "這個瀏覽器 · 已保護"])
              : pick(["This browser · may be cleared", "這個瀏覽器 · 可能被清除"])}
        </span>
        <span className={saveError ? "font-medium text-red-700" : ""} data-testid="autosave">
          {saveError
            ? pick(["Couldn't save: export now", "無法儲存：請立即匯出"])
            : savedAt
              ? pick([`Working copy saved ${ago(savedAt, pick)}`, `工作副本已儲存（${ago(savedAt, pick)}）`])
              : pick(["Working copy autosaves", "工作副本會自動儲存"])}
        </span>
        <span className="ml-auto" data-testid="saved-version">
          {saved
            ? pick([
                `Saved version: ${saved.label} · ${new Date(saved.at).toLocaleString()}`,
                `已存版本：${saved.label} · ${new Date(saved.at).toLocaleString()}`,
              ])
            : pick(["No saved version yet", "還沒有存版本"])}
        </span>
        {/* always shown, in a fixed order: a button never moves under the cursor */}
        <button
          onClick={() => void restore()}
          disabled={!saved}
          title={pick([
            "Swap: the saved version becomes your working copy, and your working copy becomes the saved version. Restore again to undo.",
            "互換：已存版本變成工作副本，工作副本變成已存版本。再還原一次即可復原。",
          ])}
          className="rounded-md border border-gray-300 px-2.5 py-1 hover:bg-gray-50 disabled:opacity-40"
          data-testid="restore"
        >
          {pick(["Restore ⇄", "還原 ⇄"])}
        </button>
        <button
          onClick={() => void askSave()}
          className="rounded-md bg-(--lk-accent) px-2.5 py-1 font-medium text-white hover:opacity-90"
          data-testid="save-version"
        >
          {pick(["Save version", "存成版本"])}
        </button>
        <button
          onClick={() => download(exportZip(files, meta), `${id}.zip`)}
          className="rounded-md border border-gray-300 px-2.5 py-1 hover:bg-gray-50"
          data-testid="export"
        >
          {pick(["Export", "匯出"])}
        </button>
      </div>

      {saving && (
        <div
          className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
          data-testid="save-panel"
        >
          {saving.lost.length > 0 && (
            <span className="w-full">
              {pick([
                `The saved version has ${saving.lost.length} proved lemma(s) your current copy doesn't: `,
                `已存版本裡有 ${saving.lost.length} 條已證明、但目前副本沒有的引理：`,
              ])}
              <code>{saving.lost.join(", ")}</code>
              {pick([". Replacing it loses them.", "。取代它就會失去它們。"])}
            </span>
          )}
          <input
            autoFocus
            value={saving.label}
            onChange={(e) => setSaving({ ...saving, label: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && void doSave(saving.label)}
            placeholder={pick(["Name this version (optional)", "替這個版本命名（可省略）"])}
            className="min-w-56 flex-1 rounded border border-amber-300 bg-white px-2 py-1 text-sm"
          />
          {saving.lost.length > 0 && (
            <button onClick={() => void exportSaved()} className="rounded-md border border-amber-400 bg-white px-2.5 py-1">
              {pick(["Export the old version first", "先匯出舊版本"])}
            </button>
          )}
          <button
            onClick={() => void doSave(saving.label)}
            className="rounded-md bg-(--lk-accent) px-2.5 py-1 font-medium text-white"
            data-testid="confirm-save"
          >
            {saved ? pick(["Replace the saved version", "取代已存版本"]) : pick(["Save", "儲存"])}
          </button>
          <button onClick={() => setSaving(null)} className="px-2 py-1 text-amber-900 hover:underline">
            {pick(["Cancel", "取消"])}
          </button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(260px,340px)] xl:overflow-hidden">
        {/* blueprint */}
        <aside className="flex min-h-0 flex-col border-b border-gray-200 bg-white xl:border-r xl:border-b-0" data-testid="blueprint">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Blueprint", "藍圖"])}</span>
            <div className="flex gap-1 text-xs">
              {(["graph", "outline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded px-2 py-0.5 ${view === v ? "bg-gray-100 font-medium text-gray-900" : "text-gray-500"}`}
                >
                  {v === "graph" ? pick(["Graph", "圖"]) : pick(["Outline", "清單"])}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-40 flex-1 overflow-auto p-2">
            {!result?.decls ? (
              <p className="p-2 text-xs text-gray-500">
                {ready
                  ? pick(["Checking with Lean…", "正在用 Lean 檢查……"])
                  : pick(["Start the runner to see the blueprint.", "啟動執行器即可看到藍圖。"])}
              </p>
            ) : view === "graph" ? (
              <BlueprintGraph decls={result.decls} main={meta.main} selected={selected} onSelect={selectDecl} />
            ) : (
              <ul className="space-y-0.5 text-sm">
                {placed.map((d) => (
                  <li key={d.name}>
                    <button
                      onClick={() => selectDecl(d.name)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono text-xs ${selected === d.name ? "bg-teal-50" : "hover:bg-gray-50"}`}
                    >
                      <span className={`w-4 shrink-0 rounded text-center ring-1 ${STATUS[d.status].cls}`}>{STATUS[d.status].glyph}</span>
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-gray-400">{d.file}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {result?.decls && (
            <div className="space-y-1.5 border-t border-gray-100 px-3 py-2 text-xs text-gray-600">
              <p className="flex flex-wrap gap-x-3" data-testid="counts">
                <span>✓ {c.proved}</span>
                <span>◐ {c.sorry}</span>
                <span>⚠ {c.depends}</span>
                <span>✖ {c.error}</span>
              </p>
              {workable(result.decls).length > 0 && (
                <p className="flex flex-wrap items-center gap-1">
                  <span className="text-gray-500">{pick(["Workable now:", "現在可以做："])}</span>
                  {workable(result.decls).map((n) => (
                    <button
                      key={n}
                      onClick={() => selectDecl(n)}
                      className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-amber-900 hover:bg-amber-100"
                    >
                      {n}
                    </button>
                  ))}
                </p>
              )}
            </div>
          )}
        </aside>

        {/* one lemma: informal beside formal */}
        <main className="flex min-h-0 flex-col">
          {resume && (
            <div
              className="m-3 mb-0 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
              data-testid="resume"
            >
              <div className="flex-1">
                <p className="font-semibold">{pick(["Where you were", "你上次停在這裡"])}</p>
                <p className="mt-0.5">
                  <code>{resume.decl}</code> · {ago(resume.away, pick)}
                  {meta.next[resume.decl] && (
                    <>
                      {" · "}
                      {pick(["your next step: ", "你的下一步："])}
                      <q>{meta.next[resume.decl]}</q>
                    </>
                  )}
                </p>
              </div>
              <button onClick={() => setResume(null)} className="text-xs text-sky-800 hover:underline">
                {pick(["Dismiss", "知道了"])}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
            <span className="font-mono text-sm font-semibold text-gray-900">{selected ?? meta.title}</span>
            {decl && (
              <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${STATUS[decl.status].cls}`}>{STATUS[decl.status].glyph}</span>
            )}
            {selected === meta.main && (
              <span className="text-xs text-gray-500">{pick(["main theorem · its statement is fixed", "主定理 · 陳述固定不變"])}</span>
            )}
          </div>
          <div className="grid min-h-0 flex-1 gap-3 px-4 pb-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <InformalNote
              key={selected ?? "none"}
              value={note}
              disabled={!selected}
              onChange={(v) => selected && setMeta((m) => m && { ...m, notes: { ...m.notes, [selected]: v } })}
            />
            <div className="flex min-h-64 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex shrink-0 items-end gap-0.5 border-b border-gray-200 bg-gray-50 px-2 pt-1.5">
                {files.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setActive(f.name)}
                    className={`rounded-t-md px-3 py-1 font-mono text-xs ${f.name === active ? "border border-b-white border-gray-200 bg-white text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    {f.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const name = window.prompt(pick(["New file name", "新檔名"]), "More.lean");
                    if (!name || !/^[A-Za-z0-9_][A-Za-z0-9_-]*\.lean$/.test(name) || files.some((f) => f.name === name)) return;
                    setFiles((fs) => [...fs.slice(0, -1), { name, code: "" }, ...fs.slice(-1)]); // before the main file
                    setActive(name);
                  }}
                  className="mb-1 rounded px-2 text-sm text-gray-500 hover:bg-gray-200"
                  title={pick(["Add a file (checked before the main file)", "新增檔案（在主檔之前檢查）"])}
                >
                  +
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <CodeMirror
                  key={active}
                  value={activeFile?.code ?? ""}
                  onChange={(v) => setFiles((fs) => fs.map((f) => (f.name === active ? { ...f, code: v } : f)))}
                  onCreateEditor={(v) => {
                    editor.current = v;
                    if (jump.current) requestAnimationFrame(() => scrollTo(jump.current!));
                  }}
                  onUpdate={(u) => {
                    if (!u.selectionSet || u.docChanged || !u.view.hasFocus) return; // follow moves, not typing
                    const line = u.state.doc.lineAt(u.state.selection.main.head).number;
                    const d = declAt(placed, active, line);
                    if (d && d.name !== selected) {
                      setSelected(d.name);
                      setMeta((m) => m && { ...m, lastDecl: d.name });
                    }
                  }}
                  extensions={[EditorView.lineWrapping]}
                  basicSetup={{ foldGutter: false }}
                  className="font-mono text-sm"
                  data-testid="research-editor"
                />
              </div>
            </div>
          </div>
        </main>

        {/* the lemma's goals and messages */}
        <aside
          className="min-h-0 space-y-4 overflow-auto border-t border-gray-200 bg-white p-4 text-sm xl:border-t-0 xl:border-l"
          data-testid="goal-panel"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Goals", "目標"])}</span>
            <span className="text-xs text-gray-400">
              {!ready ? (
                <button onClick={openRunner} className="text-(--lk-accent) hover:underline">
                  {pick(["Start the runner", "啟動執行器"])}
                </button>
              ) : checking ? (
                pick(["⌂ checking…", "⌂ 檢查中……"])
              ) : result ? (
                `⌂ ${result.ms} ms`
              ) : (
                ""
              )}
            </span>
          </div>
          {decl && (
            <p className={`rounded-md px-3 py-2 text-xs ring-1 ${STATUS[decl.status].cls}`}>
              <RichText text={`${STATUS[decl.status].glyph} ${pick(STATUS[decl.status].label)}`} />
            </p>
          )}
          {runError && <p className="text-xs text-red-700">{runError}</p>}
          {goals.length === 0 && decl?.status !== "sorry" && (
            <p className="text-xs text-gray-500">{pick(["No open goal here.", "這裡沒有未完成的目標。"])}</p>
          )}
          {goals.map((g, i) => (
            <div key={i} className="rounded-md border border-gray-200 bg-gray-50 p-2 font-mono text-xs leading-relaxed">
              <p className="mb-1 font-sans text-[11px] text-gray-500">
                {g.at.file}:{g.at.line}
                {g.case && ` · case ${g.case}`}
              </p>
              {g.hypotheses.map((h, k) => (
                <p key={k} className="text-gray-700">
                  {h}
                </p>
              ))}
              <p className="mt-1 border-t border-gray-200 pt-1 text-gray-900">⊢ {g.target}</p>
            </div>
          ))}
          {errors.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Messages", "訊息"])}</span>
              {errors.map((e, i) => (
                <div key={i} className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-900">
                  {e.at && (
                    <p className="mb-0.5 text-[11px] text-red-700">
                      {e.at.file}:{e.at.line}
                    </p>
                  )}
                  <pre className="font-mono whitespace-pre-wrap">{e.message}</pre>
                </div>
              ))}
            </div>
          )}
          {decl && (
            <div className="space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600">
              <p>
                <span className="text-gray-500">{pick(["Uses:", "用到："])} </span>
                {decl.uses.length
                  ? decl.uses.map((u) => (
                      <button key={u} onClick={() => selectDecl(u)} className="mr-2 font-mono text-(--lk-accent) hover:underline">
                        {byName.get(u) ? STATUS[byName.get(u)!.status].glyph : ""} {u}
                      </button>
                    ))
                  : pick(["nothing from this project", "沒有用到本專案的其他東西"])}
              </p>
              <p>
                <span className="text-gray-500">{pick(["Axioms:", "公理："])} </span>
                {decl.axioms.every((x) => ["propext", "Quot.sound", "Classical.choice"].includes(x))
                  ? pick(["standard only", "只有標準公理"]) + (decl.axioms.length ? ` (${decl.axioms.join(", ")})` : "")
                  : decl.axioms.map((x) => (
                      <span key={x} className="mr-2">
                        <code>{x}</code>
                        {x === "sorryAx" && pick([" (a sorry somewhere it relies on)", "（它依賴的某處還有 sorry）"])}
                      </span>
                    ))}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* the next step: one line, so you can stop */}
      <div className="flex items-center gap-3 border-t border-gray-200 bg-white px-4 py-2 text-sm">
        <span className="shrink-0 text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Next step", "下一步"])}</span>
        <input
          value={next}
          disabled={!selected}
          onChange={(e) => selected && setMeta((m) => m && { ...m, next: { ...m.next, [selected]: e.target.value } })}
          placeholder={pick(["A note for when you come back, e.g. “try induction on n”", "留給回來時的自己，例如「試試對 n 歸納」"])}
          className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1"
          data-testid="next-step"
        />
      </div>
    </div>
  );
}

/** The informal side: Markdown with maths, edited in place, shown rendered when not editing. */
function InformalNote({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const { pick } = useLang();
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex min-h-40 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white" data-testid="informal">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-1.5 text-xs">
        <span className="font-semibold tracking-wide text-gray-500 uppercase">{pick(["In words", "文字說明"])}</span>
        {!disabled && (
          <button onClick={() => setEditing((e) => !e)} className="text-(--lk-accent) hover:underline">
            {editing ? pick(["Done", "完成"]) : pick(["Edit", "編輯"])}
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-0 flex-1 resize-none p-3 font-mono text-xs leading-relaxed outline-none"
          placeholder={pick(["The idea of this step, in words and $\\LaTeX$ maths", "這一步的想法，用文字與 $\\LaTeX$ 數學"])}
        />
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setEditing(true)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && setEditing(true)}
          className="min-h-0 flex-1 cursor-text overflow-auto p-3 text-left text-sm leading-relaxed text-gray-800"
        >
          {value ? (
            <RichText text={value} />
          ) : (
            <span className="text-gray-400">{disabled ? "" : pick(["Write the idea in words…", "用文字寫下想法……"])}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** The blueprint graph: the main theorem on the left, what it uses to the right, coloured by status; a stable layout. */
function BlueprintGraph({
  decls,
  main,
  selected,
  onSelect,
}: {
  decls: Decl[];
  main: string;
  selected: string | null;
  onSelect: (n: string) => void;
}) {
  const g = useMemo(() => blueprintGraph(decls, main), [decls, main]);
  const { pos, width, height } = useMemo(() => layout(g), [g]);
  const status = new Map(decls.map((d) => [d.name, d.status]));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", minWidth: Math.min(width, 260), maxWidth: width }}
      role="img"
      aria-label="blueprint"
    >
      {g.edges.map((e, i) => {
        const a = pos.get(e.from)!;
        const b = pos.get(e.to)!;
        const x1 = a.x + a.w;
        const y1 = a.y + H / 2;
        const x2 = b.x;
        const y2 = b.y + H / 2;
        return (
          <path
            key={i}
            d={`M${x1} ${y1} C${x1 + 24} ${y1} ${x2 - 24} ${y2} ${x2} ${y2}`}
            className="fill-none stroke-gray-300"
            strokeWidth={1.2}
          />
        );
      })}
      {g.nodes.map((n) => {
        const p = pos.get(n.id)!;
        const s = STATUS[status.get(n.id) ?? "def"];
        return (
          <g key={n.id} onClick={() => onSelect(n.id)} className="cursor-pointer" data-testid={`bp-${n.id}`}>
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={H}
              rx={n.kind === "theorem" ? 6 : 14}
              className={s.fill}
              strokeWidth={selected === n.id ? 2.5 : 1.2}
            />
            <text x={p.x + 8} y={p.y + H / 2 + 4} className="fill-gray-900 font-mono text-[11px]">
              {s.glyph} {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
