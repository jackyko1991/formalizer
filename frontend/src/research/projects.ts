/**
 * The research projects as the pages see them: listed from where they are kept (~/Formalizer through the runner, then
 * this browser), started from a demo, imported, opened. Shared by the research home, the Problems page's Research tab
 * and the site home.
 */
import { go, useLang } from "@learnkit/web";
import { useCallback, useEffect, useState } from "react";
import type { LeanFile } from "../runner";
import { runnerReady, useRunner } from "../RunnerPanel";
import { RESEARCH } from "../routes";
import { exportZip, readZip, type Meta } from "./model";
import { browserStore, diskStore, FREE_PROJECTS, fork, newId, rename, type ProjectInfo, type Store } from "./store";
import { TEMPLATES, type Template } from "./templates";

type L = readonly [string, string];
export type Pick = (v: L) => string;
export type Listed = ProjectInfo & { where: Store["kind"]; progress?: Meta["progress"] };

/** Open a research project (or, with no id, the research home) on the Problems page. */
export const openProject = (id?: string | null) => go("problems", RESEARCH, id ?? null);

export function ago(ms: number | undefined, pick: Pick): string {
  if (!ms) return "";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return pick([`${s} s ago`, `${s} 秒前`]);
  if (s < 3600) return pick([`${Math.round(s / 60)} min ago`, `${Math.round(s / 60)} 分鐘前`]);
  if (s < 86400) return pick([`${Math.round(s / 3600)} h ago`, `${Math.round(s / 3600)} 小時前`]);
  return new Date(ms).toLocaleDateString();
}

export function download(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A demo's starting meta, in the reader's language. */
export function templateMeta(t: Template, pick: Pick): Meta {
  return {
    title: pick(t.title),
    main: t.main,
    statements: t.statements,
    notes: Object.fromEntries(Object.entries(t.notes).map(([k, v]) => [k, pick(v)])),
    next: {},
    template: t.id,
    lastVisit: Date.now(),
  };
}

/** Start a project from a demo (its lemmas open) where projects are kept now; false when the free tier is full. */
export async function startTemplate(t: Template, pick: Pick, ready: boolean): Promise<string | null> {
  const disk = ready ? await diskStore.list().catch(() => []) : [];
  if (disk.length + (await browserStore.list()).length >= FREE_PROJECTS) return null;
  const id = newId(t.id === "empty" ? "project" : t.id);
  await (ready ? diskStore : browserStore).put(id, t.files, templateMeta(t, pick));
  openProject(id);
  return id;
}

export const EMPTY_TEMPLATE = () => TEMPLATES.find((t) => t.id === "empty")!;
const storeOf = (p: Listed) => (p.where === "disk" ? diskStore : browserStore);

/**
 * The projects and what can be done with them. `withProgress` also loads each project's meta for the blueprint's
 * proved / total (the free tier keeps one project, so this is one small request).
 */
export function useProjects({ withProgress = false } = {}) {
  const { pick } = useLang();
  const { runner } = useRunner();
  const ready = runnerReady(runner);
  const [projects, setProjects] = useState<Listed[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const store = ready ? diskStore : browserStore;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const disk = ready ? await diskStore.list().catch(() => []) : [];
      const browser = await browserStore.list().catch(() => []);
      let all: Listed[] = [
        ...disk.map((p) => ({ ...p, where: "disk" as const })),
        ...browser.map((p) => ({ ...p, where: "browser" as const })),
      ];
      if (withProgress)
        all = await Promise.all(
          all.map(async (p) => ({ ...p, progress: (await storeOf(p).load(p.id).catch(() => null))?.meta.progress })),
        );
      if (alive) setProjects(all);
    })();
    return () => {
      alive = false;
    };
  }, [ready, reload, withProgress]);

  // the free tier keeps FREE_PROJECTS research projects: starting, importing or forking another waits for a delete
  const full = (projects?.length ?? 0) >= FREE_PROJECTS;
  const limitNote = pick([
    `The free tier keeps ${FREE_PROJECTS} research project. To start another, export this one if you want to keep it, then delete it. More projects come with Pro (pending).`,
    `免費版保留 ${FREE_PROJECTS} 個研究專案。要開始另一個，先匯出這個（如果想保留），再刪除它。更多專案會隨 Pro 推出（籌備中）。`,
  ]);

  const act = useCallback(async (what: () => Promise<unknown>) => {
    try {
      setError(null);
      await what();
    } catch (e) {
      setError(String(e));
    }
    setReload((n) => n + 1);
  }, []);

  async function start(t: Template): Promise<string | null> {
    if (full) {
      setError(limitNote);
      return null;
    }
    try {
      const id = await startTemplate(t, pick, ready);
      if (!id) setError(limitNote);
      return id;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }

  /** An export (.zip) or .lean files, as a new project. */
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
    if (full) return setError(limitNote);
    if (!files.length) return setError(pick(["No .lean files found in what you chose.", "選取的檔案裡沒有 .lean 檔。"]));
    if (meta.order)
      files = [...meta.order.flatMap((n) => files.filter((f) => f.name === n)), ...files.filter((f) => !meta.order!.includes(f.name))];
    const title = meta.title ?? files[files.length - 1].name.replace(/\.lean$/, "");
    const imported: Meta = {
      title,
      main: meta.main ?? "",
      statements: meta.statements ?? [],
      notes: meta.notes ?? {},
      next: meta.next ?? {},
      lastVisit: Date.now(),
    };
    const id = newId(title);
    await store.put(id, files, imported);
    openProject(id);
  }

  /** Download a project as a zip (its .lean files and formalizer.json). */
  async function exportProject(p: Listed) {
    const got = await storeOf(p).load(p.id);
    if (got) download(exportZip(got.files, got.meta), `${p.id}.zip`);
  }

  return {
    projects,
    ready,
    full,
    limitNote,
    error,
    setError,
    act,
    start,
    importFiles,
    exportProject,
    rename: (p: Listed, title: string) => act(() => rename(storeOf(p), p.id, title)),
    fork: (p: Listed, title: string) => act(async () => openProject(await fork(storeOf(p), p.id, title))),
    remove: (p: Listed) => act(() => storeOf(p).remove(p.id)),
  };
}
