/**
 * The research workspace's model, pure (tested in node): declarations placed in their files, the blueprint graph and
 * its counts, what a new saved version would lose, and a small zip for exports.
 */
import type { Decl, Graph, GraphNode, LeanFile } from "../runner";

/** A declaration with the file and lines it has in that file. */
export interface Placed extends Decl {
  file: string;
  fileLine: number;
  fileEnd: number;
}

export interface Meta {
  title: string;
  /** the main theorem (the given statement, never edited) */
  main: string;
  statements: string[];
  /** informal text and the next-step note, per declaration */
  notes: Record<string, string>;
  next: Record<string, string>;
  lastDecl?: string;
  lastVisit?: number;
  template?: string;
}

/** What a saved version records about itself, to warn before it is replaced. */
export interface Summary {
  proved: string[];
  open: string[];
  failing: string[];
}

export const STATUS_ORDER = ["proved", "depends", "sorry", "error", "def"] as const;

export function place(decls: Decl[], where: (line: number) => { file: string; line: number }): Placed[] {
  return decls.map((d) => {
    const a = where(d.line);
    const b = where(Math.max(d.endLine, d.line));
    return { ...d, file: a.file, fileLine: a.line, fileEnd: b.file === a.file ? b.line : a.line };
  });
}

/** The declaration at a line of a file (the innermost, if several overlap). */
export function declAt(decls: Placed[], file: string, line: number): Placed | undefined {
  return decls
    .filter((d) => d.file === file && d.fileLine <= line && line <= d.fileEnd)
    .sort((a, b) => a.fileEnd - a.fileLine - (b.fileEnd - b.fileLine))[0];
}

/** The blueprint as a graph for graphLayout: the main theorem on the left, what it uses to the right. */
export function blueprintGraph(decls: Decl[], main: string): Graph {
  const names = new Set(decls.map((d) => d.name));
  const nodes = decls.map(
    (d) => ({ id: d.name, kind: d.kind === "theorem" ? "theorem" : "def", status: d.status }) as unknown as GraphNode,
  );
  const edges = decls.flatMap((d) => d.uses.filter((u) => names.has(u) && u !== d.name).map((u) => ({ from: d.name, to: u })));
  const used = new Set(edges.map((e) => e.to));
  const roots = names.has(main) ? [main] : decls.filter((d) => !used.has(d.name)).map((d) => d.name);
  return { roots, nodes, edges, hidden: 0, more: 0 };
}

export function counts(decls: Decl[]): Record<Decl["status"], number> {
  const c = { proved: 0, sorry: 0, depends: 0, error: 0, def: 0 };
  for (const d of decls) c[d.status]++;
  return c;
}

/** Theorems still open whose every dependency is already done: where work can start now. */
export function workable(decls: Decl[]): string[] {
  const by = new Map(decls.map((d) => [d.name, d]));
  return decls
    .filter((d) => d.kind === "theorem" && (d.status === "sorry" || d.status === "error"))
    .filter((d) => d.uses.every((u) => ["proved", "def"].includes(by.get(u)?.status ?? "def")))
    .map((d) => d.name);
}

export function summarize(decls: Decl[]): Summary {
  const theorems = decls.filter((d) => d.kind === "theorem");
  return {
    proved: theorems.filter((d) => d.status === "proved").map((d) => d.name),
    open: theorems.filter((d) => d.status === "sorry" || d.status === "depends").map((d) => d.name),
    failing: theorems.filter((d) => d.status === "error").map((d) => d.name),
  };
}

/** Lemmas proved in the saved version that the current copy no longer proves: what replacing it would lose. */
export function lostSince(saved: Partial<Summary> | undefined, now: Decl[]): string[] {
  const proved = new Set(summarize(now).proved);
  return (saved?.proved ?? []).filter((n) => !proved.has(n));
}

/** Theorem names declared in a file, in order (to place a new file's lemmas before they are checked). */
export function declaredNames(code: string): string[] {
  return [...code.matchAll(/^\s*(?:theorem|lemma|def)\s+([^\s:(]+)/gm)].map((m) => m[1]);
}

// --- zip (stored, no compression): enough for a handful of text files, read back by readZip ---

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of data) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function makeZip(files: { name: string; text: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, 20, true);
    head.setUint16(6, 0x0800, true);
    head.setUint16(12, ((2026 - 1980) << 9) | (1 << 5) | 1, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, data.length, true);
    head.setUint32(22, data.length, true);
    head.setUint16(26, name.length, true);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(14, ((2026 - 1980) << 9) | (1 << 5) | 1, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    locals.push(new Uint8Array(head.buffer), name, data);
    centrals.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const size = centrals.reduce((s, b) => s + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  const parts = [...locals, ...centrals, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((s, b) => s + b.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** The files of a zip made by makeZip (stored entries only; anything else is skipped). */
export function readZip(bytes: Uint8Array): { name: string; text: string }[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  const out: { name: string; text: string }[] = [];
  let at = 0;
  while (at + 30 <= bytes.length && view.getUint32(at, true) === 0x04034b50) {
    const method = view.getUint16(at + 8, true);
    const size = view.getUint32(at + 18, true);
    const nameLen = view.getUint16(at + 26, true);
    const extra = view.getUint16(at + 28, true);
    const start = at + 30 + nameLen + extra;
    if (method === 0)
      out.push({ name: dec.decode(bytes.subarray(at + 30, at + 30 + nameLen)), text: dec.decode(bytes.subarray(start, start + size)) });
    at = start + size;
  }
  return out;
}

/** A project as an export: its .lean files and formalizer.json (meta and file order). */
export function exportZip(files: LeanFile[], meta: Meta): Uint8Array {
  return makeZip([
    ...files.map((f) => ({ name: f.name, text: f.code })),
    { name: "formalizer.json", text: JSON.stringify({ ...meta, order: files.map((f) => f.name) }, null, 1) },
  ]);
}
