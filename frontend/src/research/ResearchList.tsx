/**
 * The Problems page's left column, Research tab: a project manager in the spirit of Tensorizer's workspace panel and
 * Polyphonizer's score tree. New (blank, from a demo, with the AI) and Import on top; your projects as a tree
 * (project → its files → their declarations, each with a status dot from the last Lean check), each with open,
 * rename, duplicate, export and delete; the finished demos (showcases) as a separate, read-only group. A filter appears
 * when the list is long. Picking anything opens it in the main area (#/problems/research/<project>).
 */
import { go, RichText, useLang } from "@learnkit/web";
import { useEffect, useMemo, useRef, useState } from "react";
import { requestAgentOpen } from "../agent/bus";
import type { Decl, LeanFile } from "../runner";
import { DownloadIcon, UploadIcon } from "./icons";
import { declSpans } from "./links";
import { exportZip, type Meta } from "./model";
import { ago, download, EMPTY_TEMPLATE, focusDecl, openProject, templateMeta, useProjects, type Listed } from "./projects";
import { FREE_PROJECTS } from "./store";
import { finishedFiles, SHOWCASES, TEMPLATES, type Template } from "./templates";

const HEAD = "flex items-center gap-1 px-1 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase";
const TOOL = "flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40";
// row actions: always visible on touch screens, on hover where there is a mouse
const HOVER_ONLY = "opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100";

type Status = Decl["status"];
const DOT: Record<Status | "unknown", { cls: string; label: readonly [string, string] }> = {
  proved: { cls: "bg-emerald-500", label: ["proved", "已證明"] },
  depends: { cls: "bg-orange-400", label: ["rests on something unproved", "依賴尚未證明的東西"] },
  sorry: { cls: "bg-amber-400", label: ["to prove (sorry)", "待證明（sorry）"] },
  error: { cls: "bg-red-500", label: ["Lean rejects it", "Lean 不接受"] },
  def: { cls: "bg-gray-400", label: ["definition", "定義"] },
  unknown: { cls: "border border-gray-400 bg-white", label: ["not checked yet", "尚未檢查"] },
};
function Dot({ status }: { status: Status | "unknown" }) {
  const { pick } = useLang();
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT[status].cls}`}
      title={pick(DOT[status].label)}
      aria-label={pick(DOT[status].label)}
      data-status={status}
    />
  );
}

/** A project's files and the declarations in each (found in the text, so it works before any check). */
const treeOf = (files: readonly LeanFile[]) => files.map((f) => ({ name: f.name, decls: declSpans(f.code).map((d) => d.name) }));

/** `selected`: the open project, null on the research home, undefined when the main area shows a problem */
export default function ResearchList({ selected }: { selected?: string | null }) {
  const { pick, t } = useLang();
  const research = useProjects({ withProgress: true });
  const { projects, ready, full, limitNote, error, start, importFiles, rename, fork, remove, exportProject } = research;
  const [menu, setMenu] = useState<null | "new">(null);
  const [query, setQuery] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const showcases = SHOWCASES();
  const q = query.trim().toLowerCase();
  const match = (title: string, decls: string[]) => !q || title.toLowerCase().includes(q) || decls.some((d) => d.toLowerCase().includes(q));
  const mine = (projects ?? []).filter((p) => match(p.title, treeOf(p.files ?? []).flatMap((f) => f.decls)));
  const shown = showcases.filter((s) => match(`${pick(s.title)} ${s.title[0]}`, treeOf(finishedFiles(s)).flatMap((f) => f.decls)));
  const several = (projects?.length ?? 0) + showcases.length > 3;

  async function askAI() {
    setMenu(null);
    const own = projects?.[0];
    if (full && own) {
      // the free tier's one project is taken: the AI helps with that one
      openProject(own.id);
      return requestAgentOpen(t("home.askAIDraftExisting"));
    }
    const id = await start(EMPTY_TEMPLATE());
    if (id) requestAgentOpen(t("home.askAIDraft"));
  }

  return (
    <div className="space-y-1" data-testid="research-list">
      <p className="px-1 text-xs leading-snug text-gray-500">
        {pick([
          "A long proof, split into lemmas. Lean colours each lemma in the blueprint (the map of what uses what) as it is proved.",
          "把長證明拆成一條條引理。Lean 會在藍圖（誰用到誰的地圖）上替每條引理上色，證好了就變綠。",
        ])}
      </p>

      {/* new / import */}
      <div className="grid grid-cols-2 gap-1.5 px-1 pt-1">
        <button
          onClick={() => setMenu((m) => (m ? null : "new"))}
          aria-expanded={menu === "new"}
          className={`${TOOL} font-medium text-(--lk-accent)`}
          data-testid="research-new"
        >
          ＋ {pick(["New project", "新專案"])} <span className="text-[10px]">{menu ? "▴" : "▾"}</span>
        </button>
        <button
          onClick={() => file.current?.click()}
          disabled={full}
          title={full ? limitNote : pick(["An export (.zip) or .lean files, as a new project", "把匯出檔（.zip）或 .lean 檔變成新專案"])}
          className={TOOL}
          data-testid="research-import"
        >
          <UploadIcon /> {pick(["Import", "匯入"])}
        </button>
        <input
          ref={file}
          type="file"
          accept=".zip,.lean"
          multiple
          className="hidden"
          onChange={(e) => {
            void importFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {menu === "new" && (
        <div className="mx-1 space-y-0.5 rounded-lg border border-teal-100 bg-teal-50/50 p-1.5" data-testid="research-new-menu">
          {full && <p className="px-2 pb-1 text-[11px] leading-snug text-gray-600">{limitNote}</p>}
          <MenuItem
            icon="＋"
            label={pick(["Blank project", "空白專案"])}
            hint={pick(["Your own statement, lemmas and notes", "你自己的陳述、引理與筆記"])}
            disabled={full}
            onClick={() => (setMenu(null), void start(EMPTY_TEMPLATE()))}
            testId="research-list-start-empty"
          />
          <p className="px-2 pt-1 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">{pick(["From a demo", "從範例開始"])}</p>
          {TEMPLATES.filter((x) => x.id !== "empty").map((x) => (
            <MenuItem
              key={x.id}
              icon="◐"
              label={pick(x.title)}
              hint={pick(["Its lemmas open, the main proof written", "引理待證，主證明已寫好"])}
              disabled={full}
              onClick={() => (setMenu(null), void start(x))}
              testId={`research-list-start-${x.id}`}
            />
          ))}
          <MenuItem icon="✨" label={t("home.askAI")} hint={t("home.askAIHint")} onClick={() => void askAI()} testId="research-list-ask-ai" />
        </div>
      )}
      {error && <p className="px-2 text-xs text-red-700">{error}</p>}

      <button
        onClick={() => openProject()}
        className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm font-medium text-(--lk-accent) ${selected === null ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-gray-100"}`}
        data-testid="research-home-link"
      >
        ⌂ {pick(["Research home", "研究首頁"])}
      </button>

      {several && (
        <div className="px-1 pt-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={pick(["Filter projects and lemmas…", "篩選專案與引理……"])}
            aria-label={pick(["Filter projects and lemmas", "篩選專案與引理"])}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
            data-testid="research-filter"
          />
        </div>
      )}

      <p className={HEAD}>
        {pick(["Your projects", "你的專案"])}
        <span className="font-normal normal-case">
          · {projects?.length ?? 0}/{FREE_PROJECTS} {pick(["(free tier)", "（免費版）"])}
        </span>
      </p>
      {projects === null ? (
        <p className="px-2 text-xs text-gray-400">{pick(["Loading…", "載入中……"])}</p>
      ) : projects.length === 0 ? (
        <p className="px-2 text-xs text-gray-500">{pick(["None yet: ＋ New project above.", "還沒有：按上面的「＋ 新專案」。"])}</p>
      ) : mine.length === 0 ? (
        <p className="px-2 text-xs text-gray-400">{pick(["Nothing matches.", "沒有符合的。"])}</p>
      ) : (
        <ul className="space-y-0.5" role="tree" data-testid="research-projects-tree">
          {mine.map((p) => (
            <ProjectNode
              key={`${p.where}-${p.id}`}
              project={p}
              selected={selected === p.id}
              full={full}
              limitNote={limitNote}
              onRename={(title) => rename(p, title)}
              onFork={(title) => fork(p, title)}
              onExport={() => void exportProject(p)}
              onDelete={() => remove(p)}
            />
          ))}
        </ul>
      )}
      {full && (
        <p className="mx-1 rounded-md bg-gray-100 px-2 py-1.5 text-[11px] leading-snug text-gray-600" data-testid="project-limit">
          {pick([
            `The free tier keeps ${FREE_PROJECTS} research project; more come with Pro (pending). Export, then delete, to start another.`,
            `免費版保留 ${FREE_PROJECTS} 個研究專案；更多專案會隨 Pro 推出（籌備中）。要開始另一個，先匯出再刪除。`,
          ])}{" "}
          <button onClick={() => go("agents", "roadmap")} className="text-(--lk-accent) hover:underline">
            {pick(["Roadmap", "路線圖"])} →
          </button>
        </p>
      )}
      {!ready && (
        <p className="mx-1 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900">
          {pick([
            "The runner isn't running: projects in ~/Formalizer show up once it starts.",
            "執行器沒有在跑：等它啟動後，~/Formalizer 裡的專案才會出現。",
          ])}
        </p>
      )}

      <p className={HEAD}>
        {pick(["Showcase: finished demos", "範例展示：完成的範例"])}
        <span className="font-normal normal-case">· {pick(["read-only", "唯讀"])}</span>
      </p>
      {shown.length === 0 && <p className="px-2 text-xs text-gray-400">{pick(["Nothing matches.", "沒有符合的。"])}</p>}
      <ul className="space-y-0.5" role="tree" data-testid="research-showcases-tree">
        {shown.map((s) => (
          <ShowcaseNode key={s.id} template={s} selected={selected === `showcase-${s.id}`} />
        ))}
      </ul>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  disabled,
  testId,
}: {
  icon: string;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-start gap-2 rounded-md px-2 py-1 text-left hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
      data-testid={testId}
    >
      <span className="w-4 shrink-0 text-center text-sm">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-gray-800">{label}</span>
        <span className="block text-[11px] leading-snug text-gray-500">{hint}</span>
      </span>
    </button>
  );
}

/** The files and declarations under a project: click a declaration to open the project there. */
function FileTree({
  files,
  statuses,
  main,
  onDecl,
}: {
  files: readonly LeanFile[];
  statuses?: Meta["statuses"];
  main?: string;
  onDecl: (name: string) => void;
}) {
  const { pick } = useLang();
  return (
    <ul className="mb-1 ml-3.5 border-l border-gray-200 pl-1.5" role="group">
      {treeOf(files).map((f) => (
        <li key={f.name}>
          <button
            onClick={() => f.decls[0] && onDecl(f.decls[0])}
            className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left font-mono text-[11px] text-gray-500 hover:bg-gray-100"
            data-testid="tree-file"
          >
            <span aria-hidden>📄</span> {f.name}
          </button>
          <ul className="ml-3" role="group">
            {f.decls.map((d) => (
              <li key={d}>
                <button
                  onClick={() => onDecl(d)}
                  className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left font-mono text-[11px] text-gray-700 hover:bg-gray-100"
                  data-testid="tree-decl"
                >
                  <Dot status={statuses?.[d] ?? "unknown"} />
                  <span className="truncate">{d}</span>
                  {d === main && <span className="ml-auto shrink-0 font-sans text-[10px] text-gray-400">{pick(["main", "主定理"])}</span>}
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** A project's worst-off status, for the dot beside its title (all proved: green). */
function overall(files: readonly LeanFile[] | undefined, statuses: Meta["statuses"]): Status | "unknown" {
  const names = treeOf(files ?? []).flatMap((f) => f.decls);
  const got = names.map((n) => statuses?.[n]).filter(Boolean) as Status[];
  if (!got.length) return "unknown";
  for (const s of ["error", "sorry", "depends"] as const) if (got.includes(s)) return s;
  return got.some((s) => s === "proved") ? "proved" : "def";
}

/** One of your projects: a folding row with its actions, then its files and lemmas. */
function ProjectNode({
  project: p,
  selected,
  full,
  limitNote,
  onRename,
  onFork,
  onExport,
  onDelete,
}: {
  project: Listed;
  selected: boolean;
  full: boolean;
  limitNote: string;
  onRename: (title: string) => Promise<void>;
  onFork: (title: string) => Promise<void>;
  onExport: () => void;
  onDelete: () => Promise<void>;
}) {
  const { pick, lang } = useLang();
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<null | "menu" | "rename" | "fork" | "delete">(null);
  const [title, setTitle] = useState(p.title);
  const commit = async () => {
    const t = title.trim();
    if (!t) return;
    await (mode === "rename" ? onRename(t) : onFork(t));
    setMode(null);
  };
  const item = "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-gray-700 hover:bg-teal-50 disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <li role="treeitem" aria-expanded={open} data-testid="research-list-project">
      <div className={`group flex items-center rounded-md ${selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-gray-100"}`}>
        <button onClick={() => setOpen(!open)} className="px-1 text-xs text-gray-400" aria-label={open ? pick(["Fold", "收合"]) : pick(["Unfold", "展開"])}>
          <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </button>
        <Dot status={overall(p.files, p.statuses)} />
        {mode === "rename" ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? void commit() : e.key === "Escape" && setMode(null))}
            onBlur={() => void commit()}
            className="mx-1 min-w-0 flex-1 rounded border border-gray-300 px-1.5 py-0.5 text-sm"
            data-testid="title-input"
          />
        ) : (
          <button
            onClick={() => openProject(p.id)}
            onDoubleClick={() => (setTitle(p.title), setMode("rename"))}
            className="min-w-0 flex-1 truncate px-1.5 py-1 text-left text-sm font-medium text-gray-900"
            data-testid="research-list-project-title"
          >
            {p.title}
          </button>
        )}
        <span className={`flex shrink-0 ${mode === "menu" ? "" : HOVER_ONLY}`}>
          <button
            onClick={() => (setTitle(p.title), setMode("rename"))}
            title={pick(["Rename", "重新命名"])}
            aria-label={pick(["Rename", "重新命名"])}
            className="rounded px-1 text-xs text-gray-500 hover:bg-gray-200"
            data-testid="rename"
          >
            ✎
          </button>
          <button
            onClick={() => setMode(mode === "menu" ? null : "menu")}
            title={pick(["More actions", "更多動作"])}
            aria-label={pick(["More actions", "更多動作"])}
            aria-expanded={mode === "menu"}
            className="rounded px-1 text-xs text-gray-500 hover:bg-gray-200"
            data-testid="project-menu"
          >
            ⋯
          </button>
        </span>
      </div>
      <p className="truncate pl-7 text-[11px] text-gray-500" lang={lang}>
        {p.progress && `✓ ${p.progress.proved}/${p.progress.total} · `}
        {p.where === "disk" ? "⌂ ~/Formalizer" : pick(["this browser", "這個瀏覽器"])} · {ago(p.updated, pick)}
      </p>
      {mode === "menu" && (
        <div className="mx-1 my-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm" role="menu" data-testid="project-actions">
          <button role="menuitem" onClick={() => (setMode(null), openProject(p.id))} className={item}>
            ▸ {pick(["Open", "開啟"])}
          </button>
          <button role="menuitem" onClick={() => (setTitle(p.title), setMode("rename"))} className={item}>
            ✎ {pick(["Rename", "重新命名"])}
          </button>
          <button
            role="menuitem"
            onClick={() => (setTitle(pick([`${p.title} (copy)`, `${p.title}（副本）`])), setMode("fork"))}
            disabled={full}
            title={full ? limitNote : pick(["A copy of the working copy, as a new project", "把工作副本複製成一個新專案"])}
            className={item}
            data-testid="fork"
          >
            ⧉ {pick(["Duplicate", "複製一份"])}
          </button>
          <button role="menuitem" onClick={() => (setMode(null), onExport())} className={item} data-testid="export-project">
            <DownloadIcon /> {pick(["Export (.zip, a Lean project)", "匯出（.zip，Lean 專案）"])}
          </button>
          <button role="menuitem" onClick={() => setMode("delete")} className={`${item} text-red-700 hover:bg-red-50`} data-testid="delete">
            🗑 {pick(["Delete", "刪除"])}
          </button>
        </div>
      )}
      {mode === "fork" && (
        <div className="mx-1 my-1 flex flex-wrap items-center gap-1.5 text-xs">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? void commit() : e.key === "Escape" && setMode(null))}
            className="min-w-0 flex-1 rounded border border-gray-300 px-1.5 py-0.5"
            data-testid="title-input"
          />
          <button onClick={() => void commit()} className="rounded-md bg-(--lk-accent) px-2 py-0.5 font-medium text-white">
            {pick(["Duplicate", "複製"])}
          </button>
          <button onClick={() => setMode(null)} className="text-gray-600 hover:underline">
            {pick(["Cancel", "取消"])}
          </button>
        </div>
      )}
      {mode === "delete" && (
        <div className="mx-1 my-1 rounded-md border border-red-200 bg-red-50 p-2 text-[11px] leading-snug text-red-900" role="alertdialog">
          <p>
            {p.where === "disk"
              ? pick([
                  "Delete this project? Its folder moves to ~/Formalizer/.deleted, where you can still get it back.",
                  "刪除這個專案？它的資料夾會移到 ~/Formalizer/.deleted，還可以從那裡找回來。",
                ])
              : pick([
                  "Delete this project from this browser? This can't be undone: export it first if you want to keep it.",
                  "從這個瀏覽器刪除這個專案？無法復原：想保留的話請先匯出。",
                ])}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2">
            <button onClick={onExport} className="flex items-center gap-1 text-red-900 underline">
              <DownloadIcon /> {pick(["Export first", "先匯出"])}
            </button>
            <button onClick={() => void onDelete()} className="rounded bg-red-700 px-2 py-0.5 font-medium text-white" data-testid="confirm-delete">
              {pick(["Delete", "刪除"])}
            </button>
            <button onClick={() => setMode(null)} className="hover:underline">
              {pick(["Cancel", "取消"])}
            </button>
          </p>
        </div>
      )}
      {open && p.files && <FileTree files={p.files} statuses={p.statuses} main={p.main} onDecl={(d) => focusDecl(p.id, d)} />}
    </li>
  );
}

/** A finished demo: read-only; open it, export it (a Lean project that builds), or start your own copy. */
function ShowcaseNode({ template: s, selected }: { template: Template; selected: boolean }) {
  const { pick } = useLang();
  const [open, setOpen] = useState(selected);
  useEffect(() => {
    if (selected) setOpen(true);
  }, [selected]);
  const files = useMemo(() => finishedFiles(s), [s]);
  const statuses = useMemo(
    () => Object.fromEntries(treeOf(files).flatMap((f) => f.decls).map((d) => [d, /^\s*def /m.test(files.find((x) => x.code.includes(`def ${d} `))?.code ?? "") ? "def" : "proved"])) as Meta["statuses"],
    [files],
  );
  const id = `showcase-${s.id}`;
  return (
    <li role="treeitem" aria-expanded={open} data-testid={`research-list-showcase-${s.id}`}>
      <div className={`group flex items-center rounded-md ${selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-gray-100"}`}>
        <button onClick={() => setOpen(!open)} className="px-1 text-xs text-gray-400" aria-label={open ? pick(["Fold", "收合"]) : pick(["Unfold", "展開"])}>
          <span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </button>
        <Dot status="proved" />
        <button onClick={() => openProject(id)} className="min-w-0 flex-1 truncate px-1.5 py-1 text-left text-sm text-gray-800">
          {pick(s.title)}
        </button>
        <span className={`flex shrink-0 ${HOVER_ONLY}`}>
          <button
            onClick={() => download(exportZip(files, templateMeta(s, pick, files), s.id, pick(["en", "zh-Hant"])), `${s.id}.zip`)}
            title={pick(["Export (.zip): a Lean project that builds", "匯出（.zip）：可以建置的 Lean 專案"])}
            aria-label={pick(["Export", "匯出"])}
            className="rounded px-1 text-gray-500 hover:bg-gray-200"
            data-testid="export-showcase"
          >
            <DownloadIcon />
          </button>
        </span>
      </div>
      {open && (
        <>
          <p className="line-clamp-2 pl-7 text-[11px] text-gray-500">
            <RichText text={pick(s.about)} />
          </p>
          <FileTree files={files} statuses={statuses} main={s.main} onDecl={(d) => focusDecl(id, d)} />
        </>
      )}
    </li>
  );
}
