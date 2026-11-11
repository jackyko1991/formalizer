/**
 * Where research projects live. With the runner: a real folder, ~/Formalizer/<id> (backend/projects.py), safe from
 * browser clean-ups. Without it: this browser's storage. Both keep the working copy (autosaved) and the one saved
 * version; restore swaps the two, so it can be undone by restoring again.
 */
import type { LeanFile } from "../runner";
import { runnerUrl } from "../runner";
import type { Meta, Summary } from "./model";

export interface SavedInfo {
  label: string;
  at: number;
  summary: Partial<Summary>;
}
export interface ProjectInfo {
  id: string;
  title: string;
  updated?: number;
  saved: SavedInfo | null;
}
export interface Loaded {
  files: LeanFile[];
  meta: Meta;
  saved: SavedInfo | null;
  folder?: string;
}

export interface Store {
  kind: "disk" | "browser";
  list(): Promise<ProjectInfo[]>;
  load(id: string): Promise<Loaded | null>;
  put(id: string, files: LeanFile[], meta: Meta): Promise<void>;
  saveVersion(id: string, label: string, summary: Summary): Promise<SavedInfo>;
  loadSaved(id: string): Promise<{ files: LeanFile[]; meta: Meta } | null>;
  /** `summary`: what the working copy proves now (recorded for the copy that becomes the saved version) */
  restore(id: string, summary?: Summary): Promise<void>;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${runnerUrl()}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (res.status === 404) return null as T;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const secs = (t?: number | null) => (t ? t * 1000 : undefined);

export const diskStore: Store = {
  kind: "disk",
  async list() {
    const got = (await call<ProjectInfo[]>("/api/projects")) ?? [];
    return got.map((p) => ({ ...p, updated: secs(p.updated), saved: p.saved && { ...p.saved, at: secs(p.saved.at)! } }));
  },
  async load(id) {
    const got = await call<Loaded | null>(`/api/projects/${id}`);
    return got && { ...got, saved: got.saved && { ...got.saved, at: secs(got.saved.at)! } };
  },
  async put(id, files, meta) {
    await call(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify({ files, meta }) });
  },
  async saveVersion(id, label, summary) {
    const info = await call<SavedInfo>(`/api/projects/${id}/save`, { method: "POST", body: JSON.stringify({ label, summary }) });
    return { ...info, at: secs(info.at)! };
  },
  async loadSaved(id) {
    return call(`/api/projects/${id}/saved`);
  },
  async restore(id, summary) {
    await call(`/api/projects/${id}/restore`, { method: "POST", body: JSON.stringify({ label: "", summary: summary ?? {} }) });
  },
};

const KEY = "formalizer.research.";
interface BrowserProject {
  files: LeanFile[];
  meta: Meta;
  updated: number;
}
const get = <T>(k: string): T | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY + k) ?? "null");
  } catch {
    return null;
  }
};
const set = (k: string, v: unknown) => {
  if (v === null) localStorage.removeItem(KEY + k);
  else localStorage.setItem(KEY + k, JSON.stringify(v)); // throws when storage is full or blocked: the page says so
};

export const browserStore: Store = {
  kind: "browser",
  async list() {
    const ids = get<string[]>("index") ?? [];
    return ids.flatMap((id) => {
      const p = get<BrowserProject>(id);
      return p ? [{ id, title: p.meta.title, updated: p.updated, saved: get<SavedInfo>(`${id}.info`) }] : [];
    });
  },
  async load(id) {
    const p = get<BrowserProject>(id);
    return p && { files: p.files, meta: p.meta, saved: get<SavedInfo>(`${id}.info`) };
  },
  async put(id, files, meta) {
    set(id, { files, meta, updated: Date.now() });
    const ids = get<string[]>("index") ?? [];
    if (!ids.includes(id)) set("index", [...ids, id]);
  },
  async saveVersion(id, label, summary) {
    const p = get<BrowserProject>(id);
    if (!p) throw new Error("no project");
    const info = { label, summary, at: Date.now() };
    set(`${id}.saved`, p);
    set(`${id}.info`, info);
    return info;
  },
  async loadSaved(id) {
    return get<BrowserProject>(`${id}.saved`);
  },
  async restore(id, summary) {
    const now = get<BrowserProject>(id);
    const saved = get<BrowserProject>(`${id}.saved`);
    if (!now || !saved) return;
    set(id, { ...saved, updated: Date.now() });
    set(`${id}.saved`, now);
    set(`${id}.info`, { label: "before restore", summary: summary ?? {}, at: Date.now() });
  },
};

/** Ask the browser not to clear this site's storage under pressure; true when it agreed. */
export async function protectBrowserStorage(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/** A new project id from a title: "odd-sum-3f9k". */
export function newId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "project"}-${Math.random().toString(36).slice(2, 6)}`;
}
