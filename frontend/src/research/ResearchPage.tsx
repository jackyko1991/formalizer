/**
 * Research, in the Problems page's left column, for long proofs (#/problems/research[/<project>]; the old #/research
 * addresses lead there). Designed from the research brief:
 * the blueprint (lemma graph, status computed by Lean) is the home view; one lemma at a time with its informal note
 * beside the Lean; the goals and messages of that lemma on the right; a next-step note so you can stop; a "where was
 * I" card when you come back; the working copy autosaves, and the free tier keeps one saved version (restore swaps
 * them) plus unlimited exports. Projects live in ~/Formalizer through the runner, else in this browser.
 */
import { EditorView } from "@codemirror/view";
import { go, RichText, useLang } from "@learnkit/web";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { H, layout } from "../graphLayout";
import { mergeFiles, onAgentAnswer, onAgentFiles, requestAgentOpen, setAgentContext, type AgentContext } from "../agent/bus";
import { band } from "../tutorial/mirror";
import {
  acceptAi,
  AI_MARK,
  aiPrompt,
  declAtLine,
  declLines,
  declSpans,
  findDecl,
  parseAiLinks,
  resolveLinks,
  sentenceAtLine,
  sentences,
  toggleLine,
  type DeclLinks,
  type Resolved,
} from "./links";
import { DownloadIcon, EnlargeIcon } from "./icons";
import { linkMarks } from "./linkMarks";
import { cancelJob, followJob, listJobs, startJob, type JobInfo } from "../jobs";
import { proEnabled } from "../checkers";
import CheckersPanel from "../CheckersPanel";
import { check, joinFiles, RunnerError, type CheckResult, type Decl, type LeanFile } from "../runner";
import { runnerReady, useRunner } from "../RunnerPanel";
import { lean } from "../leanLanguage";
import { sorryMarks } from "../sorryMarks";
import TwoLayerMap from "../TwoLayerMap";
import { showcaseOf } from "../routes";
import { blueprintGraph, counts, declAt, exportZip, lostSince, place, progressOf, summarize, workable, type Meta, type Placed } from "./model";
import {
  ago,
  download,
  notifyProjectsChanged,
  onFocusDecl,
  openProject,
  startTemplate,
  takeFocusDecl,
  templateMeta,
  useProjects,
  type Listed,
} from "./projects";
import { browserStore, diskStore, protectBrowserStorage, showcaseStore, type SavedInfo, type Store } from "./store";
import { finishedFiles, SHOWCASES, TEMPLATES, type Template } from "./templates";

/** the editor: Lean colours, every `sorry` as a badge, long lines wrapped */
const RESEARCH_EXTENSIONS = [...lean(), sorryMarks(-1, null), EditorView.lineWrapping];

type L = readonly [string, string];
const RESUME_AFTER_MS = 30 * 60 * 1000;
/** the "Link text and code" switch, remembered per browser */
const LINKS_KEY = "formalizer.research.links";
/** the blueprint column's width (dragged), remembered per browser */
const BLUEPRINT_W_KEY = "formalizer.research.blueprintWidth";
const BP_MIN = 220;
const BP_MAX = 640;
const BP_DEFAULT = 280;

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

/**
 * The research area on the Problems page: with no project, the research home (demos, templates, your projects); with
 * one, its workspace. `id` is a project id, or `showcase-<demo>` for a demo's finished, read-only version.
 */
export default function ResearchPage({ id }: { id: string | null }) {
  const demo = showcaseOf(id);
  const shown = demo ? SHOWCASES().find((x) => x.id === demo) : undefined;
  if (shown) return <Workspace key={`showcase-${shown.id}`} id={`showcase-${shown.id}`} showcase={shown} />;
  return id ? <Workspace key={id} id={id} /> : <Home />;
}

// ---------------------------------------------------------------------------------------------------- home

function Home() {
  const { pick } = useLang();
  const { projects: listed, ready, full, limitNote, error, start, importFiles, rename, fork, remove } = useProjects();
  const projects = listed ?? [];

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
        <h2 className="text-lg font-semibold text-gray-900">{pick(["Showcase: finished projects", "範例展示：完成的專案"])}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {pick([
            "Each demo, fully proved: open it to see a whole blueprint turn green, read every lemma beside its note, and ask the AI about it. Read-only, and it doesn't count as one of your projects.",
            "每個範例的完整證明版本：打開來看整張藍圖變綠、逐條對照引理與筆記，也可以問 AI。唯讀，而且不算你的專案。",
          ])}
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3" data-testid="showcases">
          {SHOWCASES().map((t) => (
            <button
              key={t.id}
              onClick={() => openProject(`showcase-${t.id}`)}
              className="flex flex-col rounded-xl border border-emerald-200 bg-white p-4 text-left hover:border-emerald-400 hover:shadow-sm"
              data-testid={`showcase-${t.id}`}
            >
              <span className="text-xs font-medium text-emerald-700">
                ✓ {pick(["Proved, standard axioms only", "已證明，只用標準公理"])}
              </span>
              <span className="mt-1 font-semibold text-gray-900">{pick(t.title)}</span>
              <span className="mt-1 line-clamp-3 text-sm text-gray-600">
                <RichText text={pick(t.about)} />
              </span>
              <span className="mt-3 text-sm font-medium text-(--lk-accent)">{pick(["Open the showcase", "打開範例"])} →</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">{pick(["Start a project", "開始一個專案"])}</h2>
        {full && (
          <p className="mt-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-700" data-testid="project-limit">
            {limitNote}{" "}
            <button onClick={() => go("agents", "roadmap")} className="text-(--lk-accent) hover:underline">
              {pick(["Product roadmap", "產品路線圖"])} →
            </button>
          </p>
        )}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5" data-testid={`template-${t.id}`}>
              <h3 className="font-semibold text-gray-900">{pick(t.title)}</h3>
              <p className="mt-2 flex-1 text-sm text-gray-600">
                <RichText text={pick(t.about)} />
              </p>
              <button
                onClick={() => void start(t)}
                disabled={full}
                title={full ? limitNote : undefined}
                className="mt-4 self-start rounded-md bg-(--lk-accent) px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
              >
                {pick(["Start", "開始"])}
              </button>
            </div>
          ))}
        </div>
        <label
          className={`mt-3 inline-flex items-center gap-2 text-sm text-(--lk-accent) ${full ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:underline"}`}
          title={full ? limitNote : undefined}
        >
          <input
            type="file"
            accept=".zip,.lean"
            multiple
            disabled={full}
            className="hidden"
            onChange={(e) => void importFiles(e.target.files)}
          />
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
              <ProjectRow
                key={`${p.where}-${p.id}`}
                project={p}
                full={full}
                limitNote={limitNote}
                onRename={(title) => rename(p, title)}
                onFork={(title) => fork(p, title)}
                onDelete={() => remove(p)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** One project in the list: open it, or rename, fork (a copy of the working copy) or delete it, each confirmed in place. */
function ProjectRow({
  project: p,
  full,
  limitNote,
  onRename,
  onFork,
  onDelete,
}: {
  project: Listed;
  full: boolean;
  limitNote: string;
  onRename: (title: string) => Promise<void>;
  onFork: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { pick, lang } = useLang();
  const [mode, setMode] = useState<null | "rename" | "fork" | "delete">(null);
  const [title, setTitle] = useState(p.title);
  const btn = "rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent";
  const commit = async () => {
    const t = title.trim();
    if (!t) return;
    await (mode === "rename" ? onRename(t) : onFork(t));
    setMode(null);
  };
  return (
    <li className="px-5 py-3" data-testid={`project-${p.id}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <button onClick={() => openProject(p.id)} className="font-medium text-gray-900 hover:text-(--lk-accent) hover:underline">
          {p.title}
        </button>
        <span className="text-xs text-gray-500">
          {p.where === "disk" ? `⌂ ~/Formalizer/${p.id}` : pick(["this browser", "這個瀏覽器"])}
        </span>
        <span className="text-xs text-gray-400" lang={lang}>
          {ago(p.updated, pick)}
          {p.saved && ` · ${pick(["saved version", "已存版本"])} ${new Date(p.saved.at).toLocaleDateString()}`}
        </span>
        <span className="ml-auto flex gap-1">
          <button onClick={() => (setTitle(p.title), setMode("rename"))} className={btn} data-testid="rename">
            {pick(["Rename", "重新命名"])}
          </button>
          <button
            onClick={() => (setTitle(pick([`${p.title} (copy)`, `${p.title}（副本）`])), setMode("fork"))}
            disabled={full}
            title={full ? limitNote : pick(["A copy of the working copy, as a new project", "把工作副本複製成一個新專案"])}
            className={btn}
            data-testid="fork"
          >
            {pick(["Fork", "分支"])}
          </button>
          <button onClick={() => setMode("delete")} className={`${btn} text-red-700 hover:bg-red-50`} data-testid="delete">
            {pick(["Delete", "刪除"])}
          </button>
        </span>
      </div>
      {(mode === "rename" || mode === "fork") && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? void commit() : e.key === "Escape" && setMode(null))}
            className="min-w-56 flex-1 rounded border border-gray-300 px-2 py-1"
            data-testid="title-input"
          />
          <button onClick={() => void commit()} className="rounded-md bg-(--lk-accent) px-2.5 py-1 font-medium text-white">
            {mode === "rename" ? pick(["Rename", "重新命名"]) : pick(["Fork", "建立分支"])}
          </button>
          <button onClick={() => setMode(null)} className="px-2 py-1 text-gray-600 hover:underline">
            {pick(["Cancel", "取消"])}
          </button>
        </div>
      )}
      {mode === "delete" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-900">
          <span className="flex-1">
            {p.where === "disk"
              ? pick([
                  "Delete this project? Its folder moves to ~/Formalizer/.deleted, where you can still get it back.",
                  "刪除這個專案？它的資料夾會移到 ~/Formalizer/.deleted，還可以從那裡找回來。",
                ])
              : pick([
                  "Delete this project from this browser? This can't be undone: export it first if you want to keep it.",
                  "從這個瀏覽器刪除這個專案？無法復原：想保留的話請先匯出。",
                ])}
          </span>
          <button
            onClick={() => void onDelete()}
            className="rounded-md bg-red-700 px-2.5 py-1 font-medium text-white"
            data-testid="confirm-delete"
          >
            {pick(["Delete", "刪除"])}
          </button>
          <button onClick={() => setMode(null)} className="px-2 py-1 hover:underline">
            {pick(["Cancel", "取消"])}
          </button>
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------------------------------- workspace

function Workspace({ id, showcase }: { id: string; showcase?: Template }) {
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
  // the blueprint: enlarged over the whole window, and its column's width (dragged on wide screens, remembered)
  const [bpBig, setBpBig] = useState(false);
  const [bpWidth, setBpWidth] = useState(() => {
    try {
      const w = Number(localStorage.getItem(BLUEPRINT_W_KEY));
      return w >= BP_MIN && w <= BP_MAX ? w : BP_DEFAULT;
    } catch {
      return BP_DEFAULT;
    }
  });
  const saveBpWidth = (w: number) => {
    setBpWidth(w);
    try {
      localStorage.setItem(BLUEPRINT_W_KEY, String(w));
    } catch {
      /* storage blocked: the width holds for this visit */
    }
  };
  function startBpResize(e: React.PointerEvent) {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = bpWidth;
    let w = w0;
    const move = (ev: PointerEvent) => setBpWidth((w = Math.min(BP_MAX, Math.max(BP_MIN, w0 + ev.clientX - x0))));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      saveBpWidth(w);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }
  const [renaming, setRenaming] = useState<string | null>(null);
  const [sel, setSel] = useState<{ cursor: AgentContext["cursor"]; selection?: AgentContext["selection"] }>({ cursor: undefined });
  const [, tick] = useState(0);
  const loaded = useRef(false);
  const editor = useRef<EditorView | null>(null);
  const jump = useRef<number | null>(null);

  // --- load (the runner's folder first, then this browser)
  useEffect(() => {
    let alive = true;
    if (runner === "checking") return;
    if (showcase) {
      // a finished demo: read-only, nothing saved
      const shown = finishedFiles(showcase);
      const m = templateMeta(showcase, pick, shown);
      loaded.current = false;
      setStore(showcaseStore(shown, m));
      setFiles(shown);
      setMeta(m);
      const want = takeFocusDecl(id) ?? m.main;
      setActive(findDecl(shown, want)?.file ?? shown[shown.length - 1]?.name ?? "");
      setSelected(want);
      return;
    }
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
      const want = takeFocusDecl(id) ?? m.lastDecl ?? m.main ?? null;
      setMeta({ ...m, lastVisit: Date.now(), lastDecl: want ?? undefined });
      setActive((want && findDecl(got.files, want)?.file) || got.files[got.files.length - 1]?.name || "");
      setSelected(want);
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
      notifyProjectsChanged(); // the project panel's tree shows the new statuses and files
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

  const [job, setJob] = useState<{ info: JobInfo; position: number | null } | null>(null);
  const [slow, setSlow] = useState(false);
  const [jobCode, setJobCode] = useState<string | null>(null); // what the last background result checked
  // --- check with Lean on a pause in typing (quick checks; a long proof goes to a background job below)
  const joined = useMemo(() => joinFiles(files), [files]);
  const main = meta?.main ?? "";
  const statements = useMemo(() => meta?.statements ?? [], [meta?.statements]);
  const pro = useMemo(() => proEnabled(), []); // Formalizer Pro (pending): the Full checkers
  useEffect(() => {
    if (!ready || !files.length || meta === null) return;
    if (jobCode === joined.code) return; // a background check already has the result for exactly this code
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await check(joined.code, main ? [main] : [], statements, true);
        setResult({ ...r, where: joined.where });
        setRunError(null);
        setSlow(false);
      } catch (e) {
        if (e instanceof RunnerError && e.status === 408)
          setSlow(true); // past the quick limit: offer a background run
        else setRunError(e instanceof RunnerError ? e.message : String(e));
      } finally {
        setChecking(false);
      }
    }, 800);
    return () => clearTimeout(t);
    // notes and the next-step note don't change what Lean checks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, ready, main, statements, meta === null, jobCode]);

  // --- background checks (jobs): keep running when the page closes; after a reload the page attaches again.
  // The files as they were when the job started are kept in this browser, to place its results on the right lines.
  const watching = useRef<AbortController | null>(null);
  const jobKey = `formalizer.research.job.${id}`;
  const attach = useCallback(
    (info: JobInfo, snapshot: LeanFile[]) => {
      watching.current?.abort();
      const ctl = new AbortController();
      watching.current = ctl;
      setJob({ info, position: info.position });
      void followJob(
        info.id,
        (e) => {
          if (e.type === "queued") setJob((j) => j && { ...j, position: (e.position as number) ?? null });
          if (e.type === "running")
            setJob((j) => j && { info: { ...j.info, status: "running", started: j.info.started ?? Date.now() / 1000 }, position: null });
          if (e.type === "result") {
            setResult({ ...(e.result as CheckResult), where: joinFiles(snapshot).where });
            setJobCode(joinFiles(snapshot).code);
            setRunError(null);
            setSlow(false);
          }
          if (e.type === "error") setRunError(String(e.message));
        },
        ctl.signal,
      )
        .then((last) => {
          setJob((j) => j && { info: { ...j.info, status: last.type === "result" ? "done" : "failed" }, position: null });
          try {
            localStorage.setItem(`${jobKey}.seen`, info.id);
          } catch {
            /* storage blocked: the result may show again after a reload */
          }
        })
        .catch(() => {});
    },
    [jobKey],
  );
  useEffect(() => () => watching.current?.abort(), []);
  // after a reload: this project's latest job, if it is still running or its result hasn't been shown yet
  useEffect(() => {
    if (!ready || !store) return;
    let saved: { id: string; files: LeanFile[] } | null = null;
    let seen: string | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(jobKey) ?? "null");
      seen = localStorage.getItem(`${jobKey}.seen`);
    } catch {
      return;
    }
    if (!saved) return;
    void listJobs()
      .then((jobs) => {
        const info = jobs.find((j) => j.id === saved!.id);
        const same = joinFiles(saved!.files).code === joinFiles(latest.current.files).code; // its result still holds
        if (info && (["queued", "running"].includes(info.status) || seen !== info.id || same)) attach(info, saved!.files);
      })
      .catch(() => {});
  }, [ready, store, jobKey, attach]);
  async function runInBackground() {
    const snapshot = files.map((f) => ({ ...f }));
    try {
      const info = await startJob({
        code: joinFiles(snapshot).code,
        theorems: main ? [main] : [],
        statements,
        decls: true,
        label: `research:${id}`,
      });
      try {
        localStorage.setItem(jobKey, JSON.stringify({ id: info.id, files: snapshot }));
      } catch {
        /* storage blocked: the job still runs; this page follows it until it closes */
      }
      attach(info, snapshot);
    } catch (e) {
      setRunError(e instanceof RunnerError ? e.message : String(e));
    }
  }
  const jobActive = job && ["queued", "running"].includes(job.info.status);

  // --- the two-layer map of the main theorem (TwoLayerMap.tsx), beside the goals: asked of the runner only while the
  // Map tab is open (`maps`: under Mathlib the statement's closure takes a few seconds), once per version of the code
  const [panel, setPanel] = useState<"goals" | "map">("goals");
  const [mapResult, setMapResult] = useState<{ code: string; result: CheckResult } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  // when Lean passes, open the map by itself, once per proved version (the reader can go back to the goals)
  const mapOpenedFor = useRef<string | null>(null);
  useEffect(() => {
    if (result?.verdict !== "proved" || mapOpenedFor.current === joined.code) return;
    mapOpenedFor.current = joined.code;
    setPanel("map");
  }, [result?.verdict, joined.code]);
  useEffect(() => {
    if (panel !== "map" || !ready || !main || mapResult?.code === joined.code) return;
    const code = joined.code;
    const t = setTimeout(async () => {
      try {
        const r = await check(code, [main], statements, false, { maps: true, checkers: [] });
        setMapResult({ code, result: r });
        setMapError(null);
      } catch (e) {
        setMapError(e instanceof RunnerError ? e.message : String(e));
      }
    }, 800);
    return () => clearTimeout(t);
  }, [panel, ready, main, joined, statements, mapResult?.code]);

  // the blueprint's proved / total, kept in the meta (autosaved) for the home's project cards
  useEffect(() => {
    if (!result?.decls || showcase) return;
    const p = progressOf(result.decls);
    const statuses = Object.fromEntries(result.decls.map((d) => [d.name, d.status]));
    setMeta((m) =>
      !m ||
      (m.progress?.proved === p.proved && m.progress?.total === p.total && JSON.stringify(m.statuses ?? {}) === JSON.stringify(statuses))
        ? m
        : { ...m, progress: p, statuses },
    );
  }, [result, showcase]);

  const placed: Placed[] = useMemo(() => (result?.decls ? place(result.decls, result.where) : []), [result]);
  const byName = useMemo(() => new Map(placed.map((d) => [d.name, d])), [placed]);
  const decl = selected ? byName.get(selected) : undefined;

  // --- the AI assistant (agent/AgentPanel.tsx): what is on screen, and the agent's edits back into the editor
  const { lang } = useLang();
  useEffect(() => {
    if (!meta) return;
    const at = result?.where;
    const inDecl = (file: string, line: number) => !decl || (file === decl.file && decl.fileLine <= line && line <= decl.fileEnd);
    setAgentContext({
      target: `project/${id}`,
      title: meta.title,
      files: files.map((f) => ({ name: f.name, code: f.code })),
      main: meta.main,
      statements: meta.statements,
      next: selected ? meta.next[selected] : undefined,
      focus: selected ? { name: selected, file: decl?.file, status: decl?.status, note: meta.notes[selected] } : undefined,
      verdict: result?.verdict,
      statuses: result?.decls ? Object.fromEntries(result.decls.map((d) => [d.name, d.status])) : undefined,
      goals: at
        ? result.goals.filter((g) => inDecl(at(g.line).file, at(g.line).line)).map((g) => [...g.hypotheses, `⊢ ${g.target}`].join("\n"))
        : undefined,
      errors: at
        ? result.errors
            .filter((e) => e.line > 0 && inDecl(at(e.line).file, at(e.line).line))
            .map((e) => ({ ...at(e.line), message: e.message }))
        : undefined,
      cursor: sel.cursor,
      selection: sel.selection,
      lang,
    });
  }, [id, meta, files, selected, decl, result, sel, lang]);
  useEffect(() => () => setAgentContext(null), []);
  useEffect(
    () =>
      onAgentFiles((e) => {
        if (e.target !== `project/${id}` || showcase) return false; // a showcase stays as it is
        setFiles((fs) => mergeFiles(fs, e));
        return true;
      }),
    [id],
  );

  // --- moving between lemmas
  function selectDecl(name: string) {
    setSelected(name);
    setMeta((m) => m && { ...m, lastDecl: name });
    const d = byName.get(name);
    const span = d ? null : findDecl(files, name); // not checked yet: found in the text
    const at = d ? { file: d.file, line: d.fileLine } : span && { file: span.file, line: span.from };
    if (!at) return;
    jump.current = at.line;
    if (at.file !== active) setActive(at.file);
    else scrollTo(at.line);
  }
  // a lemma picked in the project panel's tree while this project is open
  const selectRef = useRef(selectDecl);
  selectRef.current = selectDecl;
  useEffect(() => onFocusDecl(id, (n) => selectRef.current(n)), [id]);

  // --- text ↔ code links (links.ts): the selected declaration's sentences, each tied to its Lean lines
  const [linkOn, setLinkOnState] = useState(() => {
    try {
      return localStorage.getItem(LINKS_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const setLinkOn = (on: boolean) => {
    setLinkOnState(on);
    try {
      localStorage.setItem(LINKS_KEY, on ? "on" : "off");
    } catch {
      /* storage blocked: the switch holds for this visit */
    }
  };
  const [hand, setHand] = useState(false);
  const [sentHover, setSentHover] = useState<number | null>(null);
  const [sentPin, setSentPin] = useState<number | null>(null);
  const [cursorSent, setCursorSent] = useState<number | null>(null);
  const [handLine, setHandLine] = useState<number | null>(null);
  const [aiState, setAiState] = useState<{ decl: string; state: "asked" | "none" } | null>(null);
  const span = useMemo(() => (selected ? findDecl(files, selected) : null), [files, selected]);
  const spanLines = useMemo(
    () => (span ? declLines(files.find((f) => f.name === span.file)?.code ?? "", span) : []),
    [files, span],
  );
  const projectNames = useMemo(() => files.flatMap((f) => declSpans(f.code).map((d) => d.name)), [files]);
  const noteText = selected ? (meta?.notes[selected] ?? "") : "";
  const sents = useMemo(() => sentences(noteText), [noteText]);
  const declLinks = selected ? meta?.links?.[selected] : undefined;
  const resolved: Resolved[] = useMemo(
    () => (linkOn && span && selected ? resolveLinks(sents, { name: selected, head: span.head, lines: spanLines }, declLinks, projectNames) : []),
    [linkOn, span, selected, sents, spanLines, declLinks, projectNames],
  );
  // a new declaration or text: nothing pointed at, nothing half-tied
  useEffect(() => {
    setSentPin(null);
    setSentHover(null);
    setCursorSent(null);
    setHandLine(null);
  }, [selected]);
  const activeSent = sentHover ?? sentPin ?? cursorSent;
  const marksHere = linkOn && !!span && span.file === active;
  const setDeclLinks = (fn: (l: DeclLinks | undefined) => DeclLinks | undefined) =>
    selected &&
    setMeta((m) => {
      if (!m) return m;
      const next = fn(m.links?.[selected]);
      const links = { ...m.links };
      if (next && (next.manual?.length || next.ai?.length)) links[selected] = next;
      else delete links[selected];
      return { ...m, links };
    });
  const tie = (sentence: number, line: number) => {
    if (!span || line < span.from || line > span.to) return;
    setDeclLinks((l) => toggleLine(l, sents[sentence], resolved[sentence]?.lines ?? [], line, spanLines));
  };
  const onLinkLine = (line: number) => {
    if (sentPin !== null) tie(sentPin, line);
    else setHandLine((h) => (h === line ? null : line));
  };
  const onSentence = (i: number) => {
    if (hand && handLine !== null) return tie(i, handLine);
    setSentPin((p) => (p === i ? null : i));
    if (span && span.file !== active) {
      jump.current = resolved[i]?.lines[0] ?? span.from;
      setActive(span.file);
    }
  };
  const onLine = useRef(onLinkLine);
  onLine.current = onLinkLine;
  const linkExt = useMemo(() => {
    if (!marksHere) return [];
    const byLine = new Map<number, number>();
    const firsts = new Map<number, number>();
    for (const l of spanLines) {
      const s = sentenceAtLine(resolved, l.n);
      if (s !== null) byLine.set(l.n, s);
    }
    resolved.forEach((r, i) => r.lines[0] !== undefined && !firsts.has(r.lines[0]) && firsts.set(r.lines[0], i));
    return [
      linkMarks({
        byLine,
        firsts,
        active: activeSent,
        picked: new Set(hand && handLine !== null ? [handLine] : hand && sentPin !== null ? (resolved[sentPin]?.lines ?? []) : []),
        hand,
        onBadge: (i) => setSentPin(i),
        onLine: (n) => onLine.current(n),
        onPoint: (n) => setCursorSent(byLine.get(n) ?? null),
      }),
    ];
  }, [marksHere, spanLines, resolved, activeSent, hand, handLine, sentPin]);
  const extensions = useMemo(() => [...RESEARCH_EXTENSIONS, ...linkExt], [linkExt]);
  // a sentence pointed at: bring its first line into view
  const pointedSent = sentHover ?? sentPin;
  useEffect(() => {
    const v = editor.current;
    const n = pointedSent === null ? undefined : resolved[pointedSent]?.lines[0];
    if (!v || !n || !marksHere) return;
    v.dispatch({ effects: EditorView.scrollIntoView(v.state.doc.line(Math.min(n, v.state.doc.lines)).from, { y: "nearest" }) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointedSent]);
  // ask the reader's agent for links (in the Ask AI panel); its answer comes back here when the turn ends
  function askAiLinks() {
    if (!span || !selected || !sents.length) return;
    setAiState({ decl: selected, state: "asked" });
    requestAgentOpen(aiPrompt({ name: selected, file: span.file, lines: spanLines }, sents, lang), { send: true });
  }
  useEffect(
    () =>
      onAgentAnswer((a) => {
        if (a.target !== `project/${id}` || !a.message.includes(AI_MARK)) return;
        const name = a.message.match(new RegExp(`"${AI_MARK}": \\{"decl": "([^"]+)"`))?.[1];
        const { files: fs, meta: m } = latest.current;
        const d = name ? findDecl(fs, name) : null;
        if (!name || !m || !d) return;
        const lines = declLines(fs.find((f) => f.name === d.file)!.code, d);
        const got = parseAiLinks(a.text, { name, lines }, sentences(m.notes[name] ?? ""));
        setAiState(got ? null : { decl: name, state: "none" });
        if (got) setMeta((x) => x && { ...x, links: { ...x.links, [name]: { ...x.links?.[name], ai: got } } });
      }),
    [id],
  );
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
    if (got) download(exportZip(got.files, got.meta, id, lang), `${id}-saved.zip`);
  }
  /** the working copy as a runnable Lean project (model.ts exportFiles) */
  function exportProject() {
    if (meta) download(exportZip(files, meta, showcase ? showcase.id : id, lang), `${showcase ? showcase.id : id}.zip`);
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
        <button onClick={() => openProject()} className="mt-4 text-(--lk-accent) hover:underline">
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
        <button onClick={() => openProject()} className="text-(--lk-accent) hover:underline">
          ◂ {pick(["Projects", "專案"])}
        </button>
        {renaming !== null ? (
          <input
            autoFocus
            value={renaming}
            onChange={(e) => setRenaming(e.target.value)}
            onBlur={() => {
              if (renaming.trim()) setMeta((m) => m && { ...m, title: renaming.trim() }); // autosaved like any edit
              setRenaming(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(null); // unmounts without committing
            }}
            className="rounded border border-gray-300 px-1.5 py-0.5 text-sm font-semibold text-gray-900"
            data-testid="workspace-title-input"
          />
        ) : (
          <button
            onClick={() => !showcase && setRenaming(meta.title)}
            disabled={!!showcase}
            title={showcase ? undefined : pick(["Rename", "重新命名"])}
            className="rounded px-1 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            data-testid="workspace-title"
          >
            {meta.title} {!showcase && <span className="text-xs font-normal text-gray-400">✎</span>}
          </button>
        )}
        <span title={folder} data-testid="storage-badge">
          {store.kind === "showcase"
            ? pick(["Showcase · read-only", "範例展示 · 唯讀"])
            : store.kind === "disk"
              ? `⌂ ~/Formalizer/${id}`
              : protectedStorage
                ? pick(["This browser · protected", "這個瀏覽器 · 已保護"])
                : pick(["This browser · may be cleared", "這個瀏覽器 · 可能被清除"])}
        </span>
        <span className={`${saveError ? "font-medium text-red-700" : ""} ${showcase ? "hidden" : ""}`} data-testid="autosave">
          {saveError
            ? pick(["Couldn't save: export now", "無法儲存：請立即匯出"])
            : savedAt
              ? pick([`Working copy saved ${ago(savedAt, pick)}`, `工作副本已儲存（${ago(savedAt, pick)}）`])
              : pick(["Working copy autosaves", "工作副本會自動儲存"])}
        </span>
        <span className={`ml-auto ${showcase ? "invisible" : ""}`} data-testid="saved-version">
          {saved
            ? pick([
                `Saved version: ${saved.label} · ${new Date(saved.at).toLocaleString()}`,
                `已存版本：${saved.label} · ${new Date(saved.at).toLocaleString()}`,
              ])
            : pick(["No saved version yet", "還沒有存版本"])}
        </span>
        {/* always shown, in a fixed order: a button never moves under the cursor */}
        <span className="flex items-center gap-1.5" data-testid="background">
          {jobActive ? (
            <>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800 ring-1 ring-sky-200">
                ⏱{" "}
                {job.info.status === "queued"
                  ? pick([`Background check: waiting (#${job.position ?? 1})`, `背景檢查：排隊中（第 ${job.position ?? 1} 位）`])
                  : pick([
                      `Background check: running ${ago(job.info.started ? job.info.started * 1000 : undefined, pick).replace(/ ago|前$/, "")}`,
                      `背景檢查：已執行 ${ago(job.info.started ? job.info.started * 1000 : undefined, pick).replace(/ ago|前$/, "")}`,
                    ])}
              </span>
              <button onClick={() => void cancelJob(job.info.id)} className="text-red-700 hover:underline" data-testid="stop-job">
                {pick(["Stop", "停止"])}
              </button>
            </>
          ) : (
            <button
              onClick={() => void runInBackground()}
              disabled={!ready}
              title={pick([
                "Check the whole project with no time limit. It keeps running if you close or reload the page; come back later for the result.",
                "不設時間上限地檢查整個專案。關掉或重新整理頁面也會繼續執行；之後回來看結果。",
              ])}
              className="rounded-md border border-gray-300 px-2.5 py-1 hover:bg-gray-50 disabled:opacity-40"
              data-testid="run-background"
            >
              ⏱ {pick(["Run in background", "背景執行"])}
            </button>
          )}
        </span>
        <button
          onClick={() => void restore()}
          disabled={!saved}
          hidden={!!showcase}
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
          hidden={!!showcase}
          className="rounded-md bg-(--lk-accent) px-2.5 py-1 font-medium text-white hover:opacity-90"
          data-testid="save-version"
        >
          {pick(["Save version", "存成版本"])}
        </button>
        <button
          onClick={exportProject}
          title={pick(["A Lean project you can build anywhere (lake build), with a README", "可以在任何地方建置（lake build）的 Lean 專案，附 README"])}
          className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 hover:bg-gray-50"
          data-testid="export"
        >
          <DownloadIcon /> {pick(["Export", "匯出"])}
        </button>
      </div>

      {showcase && <ShowcaseBanner template={showcase} />}

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

      <div
        className="grid min-h-0 flex-1 grid-cols-1 overflow-auto xl:grid-cols-[var(--bp-w)_minmax(0,1fr)_minmax(260px,340px)] xl:overflow-hidden"
        style={{ "--bp-w": `${bpWidth}px` } as React.CSSProperties}
      >
        {/* blueprint */}
        <aside className="relative flex min-h-0 flex-col border-b border-gray-200 bg-white xl:border-r xl:border-b-0" data-testid="blueprint">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Blueprint", "藍圖"])}</span>
            <div className="flex items-center gap-1 text-xs">
              {(["graph", "outline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded px-2 py-0.5 ${view === v ? "bg-gray-100 font-medium text-gray-900" : "text-gray-500"}`}
                >
                  {v === "graph" ? pick(["Graph", "圖"]) : pick(["Outline", "清單"])}
                </button>
              ))}
              <button
                onClick={() => setBpBig(true)}
                title={pick(["Enlarge the blueprint (Esc to close)", "放大藍圖（按 Esc 關閉）"])}
                aria-label={pick(["Enlarge the blueprint", "放大藍圖"])}
                className="ml-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                data-testid="blueprint-enlarge"
              >
                <EnlargeIcon />
              </button>
            </div>
          </div>
          {/* drag to widen the column (wide screens); remembered */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={pick(["Drag to resize the blueprint", "拖曳調整藍圖寬度"])}
            onPointerDown={startBpResize}
            onDoubleClick={() => saveBpWidth(BP_DEFAULT)}
            className="absolute top-0 right-0 z-10 hidden h-full w-1.5 translate-x-1/2 cursor-col-resize hover:bg-teal-300/60 xl:block"
            data-testid="blueprint-resize"
          />
          <div className="h-72 flex-none resize-y overflow-auto p-2 xl:h-auto xl:min-h-40 xl:flex-1 xl:resize-none">
            {bpBig && (
              <BlueprintOverlay onClose={() => setBpBig(false)} view={view} setView={setView}>
                {!result?.decls ? (
                  <p className="p-6 text-sm text-gray-500">
                    {ready
                      ? pick(["Checking with Lean…", "正在用 Lean 檢查……"])
                      : pick(["Start the runner to see the blueprint.", "啟動執行器即可看到藍圖。"])}
                  </p>
                ) : view === "graph" ? (
                  <BlueprintGraph decls={result.decls} main={meta.main} selected={selected} onSelect={(n) => (selectDecl(n), setBpBig(false))} big />
                ) : (
                  <BlueprintOutline placed={placed} selected={selected} onSelect={(n) => (selectDecl(n), setBpBig(false))} big />
                )}
              </BlueprintOverlay>
            )}
            {!result?.decls ? (
              <p className="p-2 text-xs text-gray-500">
                {ready
                  ? pick(["Checking with Lean…", "正在用 Lean 檢查……"])
                  : pick(["Start the runner to see the blueprint.", "啟動執行器即可看到藍圖。"])}
              </p>
            ) : view === "graph" ? (
              <BlueprintGraph decls={result.decls} main={meta.main} selected={selected} onSelect={selectDecl} />
            ) : (
              <BlueprintOutline placed={placed} selected={selected} onSelect={selectDecl} />
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
            {/* text ↔ code links: on / off (remembered), by hand, from the AI */}
            <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5 text-xs">
              <button
                role="switch"
                aria-checked={linkOn}
                onClick={() => (setLinkOn(!linkOn), setHand(false))}
                title={pick([
                  "Each sentence of the text and the Lean lines that do it share a colour and a number: point at one to light up the other.",
                  "文字的每個句子和做這件事的 Lean 行共用一個顏色和編號：指向一邊，另一邊就會亮起來。",
                ])}
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-gray-700 hover:bg-gray-100"
                data-testid="link-switch"
              >
                <span className={`relative inline-block h-4 w-7 rounded-full transition-colors ${linkOn ? "bg-teal-600" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${linkOn ? "left-3.5" : "left-0.5"}`} />
                </span>
                ⇄ {pick(["Link text and code", "連結文字與程式碼"])}
              </button>
              {linkOn && !showcase && span && sents.length > 0 && (
                <>
                  <button
                    onClick={() => (setHand(!hand), setHandLine(null))}
                    aria-pressed={hand}
                    title={pick([
                      "Click a sentence, then the code lines it should be tied to (click again to untie). Or a line first, then sentences.",
                      "點一個句子，再點它該連到的程式碼行（再點一次取消）。也可以先點一行，再點句子。",
                    ])}
                    className={`rounded-md border px-2 py-0.5 ${hand ? "border-teal-600 bg-teal-50 font-medium text-teal-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    data-testid="link-hand"
                  >
                    ✋ {pick(["Link by hand", "手動連結"])}
                  </button>
                  <button
                    onClick={askAiLinks}
                    disabled={aiState?.state === "asked" && aiState.decl === selected}
                    title={pick([
                      "Your AI agent reads this text and code and proposes which sentence goes with which lines; you can keep or clear them.",
                      "你的 AI 代理讀這段文字和程式碼，提出每個句子對應哪幾行；你可以保留或清除。",
                    ])}
                    className="rounded-md border border-gray-300 px-2 py-0.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    data-testid="link-ai"
                  >
                    ✨ {aiState?.state === "asked" && aiState.decl === selected ? pick(["Asking the AI…", "正在問 AI……"]) : pick(["Ask AI to link", "請 AI 連結"])}
                  </button>
                </>
              )}
            </span>
          </div>
          <div className="grid min-h-0 flex-1 gap-3 px-4 pb-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <InformalNote
              key={selected ?? "none"}
              value={note}
              disabled={!selected || !!showcase}
              onChange={(v) => selected && setMeta((m) => m && { ...m, notes: { ...m.notes, [selected]: v } })}
              linked={
                linkOn && span && sents.length
                  ? {
                      sents,
                      resolved,
                      file: span.file,
                      active: activeSent,
                      pinned: sentPin,
                      hand,
                      handLine,
                      onHover: setSentHover,
                      onClick: onSentence,
                      ai:
                        !showcase && declLinks?.ai?.length
                          ? {
                              count: declLinks.ai.length,
                              accept: () => setDeclLinks((l) => acceptAi(l)),
                              clear: () => setDeclLinks((l) => (l?.manual?.length ? { manual: l.manual } : undefined)),
                            }
                          : null,
                      aiNone: aiState?.state === "none" && aiState.decl === selected,
                      clearHand: !showcase && !!declLinks?.manual?.length ? () => setDeclLinks((l) => (l?.ai?.length ? { ai: l.ai } : undefined)) : null,
                    }
                  : null
              }
            />
            <div className="flex min-h-64 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex shrink-0 items-end gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-1.5">
                <div className="flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto">
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
                  hidden={!!showcase}
                  title={pick(["Add a file (checked before the main file)", "新增檔案（在主檔之前檢查）"])}
                >
                  +
                </button>
                </div>
                <button
                  onClick={exportProject}
                  className="mb-1 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                  title={pick([
                    "Download the project as a Lean project you can build anywhere (lake build), with a README holding the text beside the Lean. Import it back from the Research list.",
                    "把專案下載成在任何地方都能建置（lake build）的 Lean 專案，附上 README，文字與 Lean 並排。之後可以從研究清單匯回來。",
                  ])}
                  aria-label={pick(["Export the project", "匯出專案"])}
                  data-testid="export-tabs"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  <span className="hidden 2xl:inline">{pick(["Export", "匯出"])}</span>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <CodeMirror
                  key={active}
                  editable={!showcase}
                  value={activeFile?.code ?? ""}
                  onChange={(v) => setFiles((fs) => fs.map((f) => (f.name === active ? { ...f, code: v } : f)))}
                  onCreateEditor={(v) => {
                    editor.current = v;
                    if (jump.current) requestAnimationFrame(() => scrollTo(jump.current!));
                  }}
                  onUpdate={(u) => {
                    if (!u.selectionSet || u.docChanged || !u.view.hasFocus) return; // follow moves, not typing
                    const line = u.state.doc.lineAt(u.state.selection.main.head).number;
                    const r = u.state.selection.main;
                    const text = u.state.sliceDoc(r.from, r.to);
                    setSel({
                      cursor: { file: active, line },
                      selection: text.trim()
                        ? {
                            file: active,
                            from_line: u.state.doc.lineAt(r.from).number,
                            to_line: u.state.doc.lineAt(r.to).number,
                            text: text.slice(0, 4000),
                          }
                        : undefined,
                    });
                    // the declaration under the cursor (placed by Lean, else found in the text)
                    const d = declAt(placed, active, line) ?? declAtLine(activeFile?.code ?? "", line);
                    if (d && d.name !== selected) {
                      setSelected(d.name);
                      setMeta((m) => m && { ...m, lastDecl: d.name });
                    }
                    // the sentence this line does lights up
                    setCursorSent(marksHere && (!d || d.name === selected) ? sentenceAtLine(resolved, line) : null);
                  }}
                  extensions={extensions}
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
            <span className="flex gap-1 text-xs" role="tablist">
              {(["goals", "map"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={panel === tab}
                  onClick={() => setPanel(tab)}
                  data-testid={`research-tab-${tab}`}
                  className={`rounded px-2 py-0.5 font-semibold tracking-wide uppercase ${panel === tab ? "bg-gray-100 text-(--lk-accent)" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {tab === "goals" ? pick(["Goals", "目標"]) : pick(["Map", "地圖"])}
                </button>
              ))}
            </span>
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
          {panel === "map" ? (
            <div data-testid="research-map">
              <TwoLayerMap
                key={main}
                statement={mapResult?.result.statementGraph ?? null}
                statementNote={
                  !ready
                    ? ["Start the runner to draw the map: Lean works out what the statement rests on.", "啟動執行器就能畫出地圖：由 Lean 算出陳述建立在什麼上。"]
                    : !main
                      ? ["This project has no main theorem yet.", "這個專案還沒有主要定理。"]
                      : mapError
                }
                proofs={(mapResult?.result.graph ?? result?.graph) ? [{ key: "yours", label: ["This project's proof", "本專案的證明"], graph: (mapResult?.result.graph ?? result?.graph)! }] : []}
                proofNote={["Once Lean has checked the project, its proof's map appears here.", "Lean 檢查完專案後，這裡會出現證明的地圖。"]}
                height={340}
                testId="research-two-layer-map"
              />
            </div>
          ) : (
            <>
          {decl && (
              <p className={`rounded-md px-3 py-2 text-xs ring-1 ${STATUS[decl.status].cls}`}>
                <RichText text={`${STATUS[decl.status].glyph} ${pick(STATUS[decl.status].label)}`} />
              </p>
            )}
            {runError && <p className="text-xs text-red-700">{runError}</p>}
            {slow && !jobActive && jobCode !== joined.code && (
              <div className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-900" data-testid="slow">
                {pick([
                  "This project takes Lean longer than a quick check allows. Run it in the background: it keeps going if you close the page, and the result appears here when you come back.",
                  "Lean 檢查這個專案所需的時間超過快速檢查的上限。改在背景執行：關掉頁面也會繼續，回來時結果就會出現在這裡。",
                ])}{" "}
                <button onClick={() => void runInBackground()} className="font-medium text-(--lk-accent) hover:underline">
                  ⏱ {pick(["Run in background", "背景執行"])}
                </button>
              </div>
            )}
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
            </>
          )}
          {/* the independent checkers on the whole project: Lite for everyone, Full listed (Pro, on a Linux runner) */}
          {meta && (
            <CheckersPanel
              code={joined.code}
              theorems={main ? [main] : []}
              statements={statements}
              full
              pro={pro}
              verdict={result?.verdict}
              scope="research"
            />
          )}
        </aside>
      </div>

      {/* the next step: one line, so you can stop */}
      <div className="flex items-center gap-3 border-t border-gray-200 bg-white px-4 py-2 text-sm">
        <span className="shrink-0 text-xs font-semibold tracking-wide text-gray-500 uppercase">{pick(["Next step", "下一步"])}</span>
        <input
          value={next}
          disabled={!selected || !!showcase}
          onChange={(e) => selected && setMeta((m) => m && { ...m, next: { ...m.next, [selected]: e.target.value } })}
          placeholder={pick(["A note for when you come back, e.g. “try induction on n”", "留給回來時的自己，例如「試試對 n 歸納」"])}
          className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1"
          data-testid="next-step"
        />
      </div>
    </div>
  );
}

/** Above a showcase: what it is, and starting your own copy with the lemmas still open. */
function ShowcaseBanner({ template }: { template: Template }) {
  const { pick } = useLang();
  const { runner } = useRunner();
  const ready = runnerReady(runner);
  const [full, setFull] = useState(false);
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-950"
      data-testid="showcase-banner"
    >
      <span className="flex-1">
        {full
          ? pick([
              "The free tier keeps one research project: delete yours in the Research list first (export it if you want to keep it).",
              "免費版保留一個研究專案：請先在研究清單裡刪除你的專案（想保留的話先匯出）。",
            ])
          : pick([
              "Showcase: this demo finished, every lemma proved. Read-only: try it yourself from the start, with the lemmas open.",
              "範例展示：這個範例的完成版，每條引理都證好了。唯讀：想自己做的話，從頭開始，引理都還沒證。",
            ])}
      </span>
      <button
        onClick={() => void startTemplate(template, pick, ready).then((ok) => setFull(!ok))}
        className="rounded-md bg-(--lk-accent) px-2.5 py-1 font-medium text-white hover:opacity-90"
        data-testid="showcase-start"
      >
        {pick(["Try it yourself", "自己試試看"])}
      </button>
    </div>
  );
}

interface Linked {
  sents: string[];
  resolved: Resolved[];
  file: string;
  active: number | null;
  pinned: number | null;
  hand: boolean;
  handLine: number | null;
  onHover: (i: number | null) => void;
  onClick: (i: number) => void;
  /** the AI's proposal, to keep (as the reader's own) or clear */
  ai: { count: number; accept: () => void; clear: () => void } | null;
  /** the AI answered without links in the expected shape */
  aiNone: boolean;
  /** forget the links made by hand (back to the AI's and the automatic ones) */
  clearHand: (() => void) | null;
}

const SOURCE: Record<"manual" | "ai" | "auto", readonly [string, string]> = {
  manual: ["by hand", "手動"],
  ai: ["AI", "AI"],
  auto: ["automatic", "自動"],
};

/** The informal side: Markdown with maths, edited in place, shown rendered when not editing. With links on, the
 *  text as its sentences, each sharing a colour and number with its Lean lines (the problems' mirror look). */
function InformalNote({
  value,
  onChange,
  disabled,
  linked,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  linked?: Linked | null;
}) {
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
      {linked && !editing && <LinkedSentences linked={linked} />}
      {editing ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-0 flex-1 resize-none p-3 font-mono text-xs leading-relaxed outline-none"
          placeholder={pick(["The idea of this step, in words and $\\LaTeX$ maths", "這一步的想法，用文字與 $\\LaTeX$ 數學"])}
        />
      ) : linked ? null : (
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

/** The text as its sentences, each tied to Lean lines (point at one: its lines light up; click: it stays lit). */
function LinkedSentences({ linked: k }: { linked: Linked }) {
  const { pick } = useLang();
  const span = (ls: number[]) => {
    if (!ls.length) return "";
    const runs: string[] = [];
    let a = ls[0];
    let b = ls[0];
    for (const n of [...ls.slice(1), Infinity]) {
      if (n === b + 1) b = n;
      else {
        runs.push(a === b ? `${a}` : `${a}–${b}`);
        a = b = n;
      }
    }
    return runs.join(", ");
  };
  return (
    <div className="min-h-0 flex-1 space-y-1.5 overflow-auto p-2.5" data-testid="linked-text">
      <p className="rounded-md bg-teal-50/70 px-2.5 py-1 text-[11px] leading-snug text-teal-900">
        {k.hand
          ? k.handLine !== null
            ? pick([`Line ${k.handLine} picked: click the sentences to tie it to (or untie).`, `已選第 ${k.handLine} 行：點要連到的句子（再點一次取消）。`])
            : pick([
                "Linking by hand: click a sentence, then the code lines it does (click again to untie). Or a line first, then sentences.",
                "手動連結：點一個句子，再點它對應的程式碼行（再點一次取消）。也可以先點一行，再點句子。",
              ])
          : pick(["⇄ Point at a sentence: its Lean lines light up, and back.", "⇄ 指向句子，它的 Lean 行就會亮起來；反過來也一樣。"])}
      </p>
      {k.ai && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-violet-50 px-2.5 py-1 text-[11px] text-violet-950" data-testid="ai-links">
          <span className="flex-1">
            ✨ {pick([`The AI proposed links for ${k.ai.count} sentence(s), marked “AI”.`, `AI 提出了 ${k.ai.count} 個句子的連結，標成「AI」。`])}
          </span>
          <button onClick={k.ai.accept} className="font-medium text-violet-800 hover:underline" data-testid="ai-accept">
            {pick(["Keep them", "保留"])}
          </button>
          <button onClick={k.ai.clear} className="text-violet-800 hover:underline" data-testid="ai-clear">
            {pick(["Clear", "清除"])}
          </button>
        </p>
      )}
      {k.aiNone && (
        <p className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] text-amber-900">
          {pick([
            "The AI's answer had no links in the expected form: see the AI panel, or ask again.",
            "AI 的回答裡沒有照格式的連結：請看 AI 面板，或再問一次。",
          ])}
        </p>
      )}
      <ol className="space-y-1.5">
        {k.sents.map((s, i) => {
          const r = k.resolved[i] ?? { lines: [], source: null };
          const on = k.active === i;
          const tied = k.handLine !== null && r.lines.includes(k.handLine);
          return (
            <li key={i}>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={k.pinned === i}
                data-testid="linked-sentence"
                data-source={r.source ?? "none"}
                onMouseEnter={() => k.onHover(i)}
                onMouseLeave={() => k.onHover(null)}
                onFocus={() => k.onHover(i)}
                onBlur={() => k.onHover(null)}
                onClick={() => k.onClick(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), k.onClick(i))}
                className="flex cursor-pointer gap-2 rounded-md border-l-4 bg-white px-2.5 py-1.5 text-sm leading-relaxed text-gray-800 ring-1 ring-gray-200 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-(--lk-accent)"
                style={{
                  borderLeftColor: r.lines.length ? band(i).line : "#d1d5db",
                  background: on || k.pinned === i || tied ? band(i).bg : undefined,
                  boxShadow: on || (k.hand && k.pinned === i) ? `0 0 0 1px ${band(i).line}` : undefined,
                }}
              >
                <span
                  className="mt-1 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1 text-[10px] font-bold text-white"
                  style={{ background: r.lines.length ? band(i).line : "#9ca3af" }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <RichText text={s} />
                  <span className="mt-0.5 block text-[10px] text-gray-500">
                    {r.lines.length
                      ? pick([`${k.file}, line ${span(r.lines)}`, `${k.file} 第 ${span(r.lines)} 行`])
                      : pick(["not tied to a line", "沒有連到任何一行"])}
                    {r.source && (
                      <span
                        className={`ml-1.5 rounded px-1 ${r.source === "manual" ? "bg-teal-100 text-teal-900" : r.source === "ai" ? "bg-violet-100 text-violet-900" : "bg-gray-100 text-gray-600"}`}
                      >
                        {pick(SOURCE[r.source])}
                      </span>
                    )}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {k.clearHand && (
        <button onClick={k.clearHand} className="px-1 text-[11px] text-gray-500 hover:text-gray-800 hover:underline" data-testid="clear-hand">
          {pick(["Forget the links made by hand", "清除手動做的連結"])}
        </button>
      )}
    </div>
  );
}

/** The blueprint over the whole window (like the maps' ⤢): drawn large, still clickable; Esc or ✕ closes it. */
function BlueprintOverlay({
  onClose,
  view,
  setView,
  children,
}: {
  onClose: () => void;
  view: "graph" | "outline";
  setView: (v: "graph" | "outline") => void;
  children: React.ReactNode;
}) {
  const { pick } = useLang();
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={pick(["Blueprint", "藍圖"])}
      className="fixed inset-0 z-50 flex flex-col bg-white"
      data-testid="blueprint-overlay"
    >
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-2">
        <span className="text-sm font-semibold text-gray-900">{pick(["Blueprint", "藍圖"])}</span>
        <span className="hidden text-xs text-gray-500 sm:inline">
          {pick([
            "What uses what: the main theorem on the left, the lemmas it rests on to the right, each coloured by what Lean says. Click a lemma to open it.",
            "誰用到誰：主定理在左，它依賴的引理在右，顏色是 Lean 判定的狀態。點一條引理就能打開它。",
          ])}
        </span>
        <span className="ml-auto flex gap-1 text-xs">
          {(["graph", "outline"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-2 py-0.5 ${view === v ? "bg-gray-100 font-medium text-gray-900" : "text-gray-500"}`}
            >
              {v === "graph" ? pick(["Graph", "圖"]) : pick(["Outline", "清單"])}
            </button>
          ))}
        </span>
        <button
          onClick={onClose}
          aria-label={pick(["Close", "關閉"])}
          title={pick(["Close (Esc)", "關閉（Esc）"])}
          className="rounded px-2 py-0.5 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          data-testid="blueprint-close"
        >
          ✕
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">{children}</div>
      <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-gray-100 px-4 py-2 text-xs text-gray-600">
        {(["proved", "depends", "sorry", "error", "def"] as const).map((s) => (
          <span key={s}>
            <span className={`mr-1 inline-block w-4 rounded text-center ring-1 ${STATUS[s].cls}`}>{STATUS[s].glyph}</span>
            <RichText text={pick(STATUS[s].label)} />
          </span>
        ))}
      </p>
    </div>,
    document.body,
  );
}

/** The blueprint as a list: each declaration with its status and file. */
function BlueprintOutline({
  placed,
  selected,
  onSelect,
  big = false,
}: {
  placed: Placed[];
  selected: string | null;
  onSelect: (n: string) => void;
  big?: boolean;
}) {
  return (
    <ul className={`space-y-0.5 ${big ? "w-full max-w-2xl self-start text-base" : "text-sm"}`}>
      {placed.map((d) => (
        <li key={d.name}>
          <button
            onClick={() => onSelect(d.name)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono ${big ? "text-sm" : "text-xs"} ${selected === d.name ? "bg-teal-50" : "hover:bg-gray-50"}`}
          >
            <span className={`w-4 shrink-0 rounded text-center ring-1 ${STATUS[d.status].cls}`}>{STATUS[d.status].glyph}</span>
            <span className="truncate">{d.name}</span>
            <span className="ml-auto shrink-0 text-[10px] text-gray-400">{d.file}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The blueprint graph: the main theorem on the left, what it uses to the right, coloured by status; a stable layout.
 *  `big`: enlarged, filling its box (up to about three times its natural size). */
function BlueprintGraph({
  decls,
  main,
  selected,
  onSelect,
  big = false,
}: {
  decls: Decl[];
  main: string;
  selected: string | null;
  onSelect: (n: string) => void;
  big?: boolean;
}) {
  const g = useMemo(() => blueprintGraph(decls, main), [decls, main]);
  const { pos, width, height } = useMemo(() => layout(g), [g]);
  const status = new Map(decls.map((d) => [d.name, d.status]));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={
        big
          ? { width: "100%", height: "100%", maxWidth: width * 3, maxHeight: height * 3 }
          : { width: "100%", minWidth: Math.min(width, 260), maxWidth: width * 1.6 }
      }
      role="img"
      aria-label="blueprint"
      data-testid={big ? "blueprint-big" : undefined}
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
