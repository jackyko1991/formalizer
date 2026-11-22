/**
 * The research workspace's model, pure (tested in node): declarations placed in their files, the blueprint graph and
 * its counts, what a new saved version would lose, and a small zip for exports.
 */
import type { Decl, Graph, GraphNode, LeanFile } from "../runner";
import { declLines, declSpans, resolveLinks, sentences, type DeclLinks } from "./links.ts";

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
  /** the theorems proved / all theorems at the last check (shown on the home's project cards) */
  progress?: { proved: number; total: number };
  /** each declaration's status at the last check (the project panel's dots, the export's README) */
  statuses?: Record<string, Decl["status"]>;
  /** text ↔ code links per declaration, by hand and from the AI (links.ts) */
  links?: Record<string, DeclLinks>;
}

/** Proved / all theorems, for the home's project cards. */
export function progressOf(decls: Decl[]): { proved: number; total: number } {
  const s = summarize(decls);
  return { proved: s.proved.length, total: s.proved.length + s.open.length + s.failing.length };
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

// --- export: a runnable Lean project (lake build), its README (the natural language beside the Lean), formalizer.json ---

/** The toolchain the runners use (lean/lean-toolchain; a test keeps the two equal). */
export const LEAN_TOOLCHAIN = "leanprover/lean4:v4.34.1";
export const MATHLIB_REV = "v4.34.1";
export const EXPORT_FORMAT = "formalizer-research";

/** "Odd numbers add up to squares" → "odd_numbers_add_up_to_squares" (a package name); "" when nothing is left. */
export const slugOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/\$[^$]*\$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
/** A Lean module name: "odd_sum_3f9k" → "OddSum3f9k". */
const moduleOf = (s: string) => {
  const m = s
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return /^[A-Za-z]/.test(m) ? m : `P${m}`;
};

const STATUS_WORDS: Record<Decl["status"], readonly [string, string]> = {
  proved: ["✓ proved", "✓ 已證明"],
  depends: ["⚠ rests on something unproved", "⚠ 依賴尚未證明的東西"],
  sorry: ["◐ to prove (`sorry`)", "◐ 待證明（`sorry`）"],
  error: ["✖ Lean rejects it", "✖ Lean 不接受"],
  def: ["· definition", "· 定義"],
};

/** The export's paths (under one folder) and texts. `id`: the project's id, for names when the title has no letters. */
export function exportFiles(files: LeanFile[], meta: Meta, id = "project", lang = "en"): { name: string; text: string }[] {
  const zh = lang.startsWith("zh");
  const T = (en: string, zht: string) => (zh ? zht : en);
  const slug = slugOf(meta.title) || slugOf(id) || "project";
  const pkg = moduleOf(slug);
  const mathlib = files.some((f) => /^\s*import\s+Mathlib/m.test(f.code));
  const used = new Set<string>();
  const modules = files.map((f) => {
    let m = moduleOf(f.name.replace(/\.lean$/, ""));
    for (let n = 2; used.has(m); n++) m = `${moduleOf(f.name.replace(/\.lean$/, ""))}${n}`;
    used.add(m);
    return m;
  });
  const local = new Map(files.map((f, i) => [f.name.replace(/\.lean$/, ""), modules[i]]));
  // each file a module: its imports first (local ones as <Pkg>.<Module>), then every file before it (Formalizer checks
  // the files one after another, so a later file sees all the earlier ones)
  const leanFiles = files.map((f, i) => {
    const own: string[] = [];
    const rest = f.code
      .split("\n")
      .filter((l) => {
        const m = l.match(/^import\s+(.+)$/);
        if (!m) return true;
        for (const name of m[1].trim().split(/\s+/)) own.push(local.has(name) ? `${pkg}.${local.get(name)}` : name);
        return false;
      })
      .join("\n")
      .replace(/^\n+/, "");
    const imports = [...new Set([...own, ...modules.slice(0, i).map((m) => `${pkg}.${m}`)])];
    return { name: `${pkg}/${modules[i]}.lean`, text: (imports.length ? imports.map((x) => `import ${x}`).join("\n") + "\n\n" : "") + rest };
  });
  const lakefile =
    `# A Formalizer research project: \`lake build\` checks every file.\nname = "${slug}"\nversion = "0.1.0"\ndefaultTargets = ["${pkg}"]\n` +
    (mathlib ? `\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4.git"\nrev = "${MATHLIB_REV}"\n` : "") +
    `\n[[lean_lib]]\nname = "${pkg}"\n`;
  const pixi =
    `# Tasks for this Lean project. Lean itself (elan, lake) comes from https://lean-lang.org/install, not from conda.\n` +
    `[workspace]\nname = "formalizer-${slug.replace(/_/g, "-")}"\ndescription = "A Formalizer research project (Lean 4)"\nchannels = ["conda-forge"]\nplatforms = ["win-64", "osx-arm64", "osx-64", "linux-64"]\n\n[tasks]\n` +
    (mathlib ? `# Mathlib's compiled files (a few minutes once, instead of hours of building)\ncache = "lake exe cache get"\n` : "") +
    `# Check every file\nbuild = "lake build"\n` +
    (meta.main ? `# Which axioms the main theorem rests on\naxioms = "lake env lean PrintAxioms.lean"\n` : "");

  // README: the blueprint, then each declaration in words and in Lean (with the text ↔ code links), then how to build
  const all = files.flatMap((f) => declSpans(f.code).map((d) => ({ ...d, file: f.name, code: f.code })));
  const names = all.map((d) => d.name);
  const status = (n: string) => (meta.statuses?.[n] ? T(...STATUS_WORDS[meta.statuses[n]]) : T("not checked yet", "尚未檢查"));
  const sections = all.map((d) => {
    const lines = declLines(d.code, d);
    const note = meta.notes[d.name]?.trim();
    let words = "";
    if (note) {
      const sents = sentences(note);
      const r = resolveLinks(sents, { name: d.name, head: d.head, lines }, meta.links?.[d.name], names);
      const range = (ls: number[]) => (ls.length ? `${d.file} ${T("line", "第")} ${ls.join(", ")}${T("", " 行")}` : T("—", "—"));
      words =
        `${note}\n\n` +
        `<details><summary>${T("Sentence ↔ Lean lines", "句子 ↔ Lean 行")}</summary>\n\n` +
        sents.map((s, i) => `${i + 1}. ${s} → ${range(r[i].lines)}`).join("\n") +
        `\n\n</details>\n\n`;
    }
    return `### \`${d.name}\` · ${status(d.name)}${d.name === meta.main ? T(" · main theorem", " · 主定理") : ""}\n\n${words}\`\`\`lean\n${lines.map((l) => l.text).join("\n")}\n\`\`\`\n`;
  });
  const table = all.map((d) => `| \`${d.name}\` | ${d.file} | ${status(d.name)} |`).join("\n");
  const readme =
    `# ${meta.title}\n\n` +
    T(
      "A research project from [Formalizer](https://github.com/jackyko1991/formalizer): one proof in two languages, natural language for people and Lean for the machine. Each declaration below has both, with which sentence is done by which lines.\n\n",
      "來自 [Formalizer](https://github.com/jackyko1991/formalizer) 的研究專案：一個證明，兩種語言，自然語言給人讀，Lean 給機器查。下面每個宣告兩者都有，也列出每個句子由哪幾行完成。\n\n",
    ) +
    (meta.main ? `${T("Main theorem", "主定理")}: \`${meta.main}\`\n\n` : "") +
    `## ${T("Blueprint", "藍圖")}\n\n| ${T("Declaration", "宣告")} | ${T("File", "檔案")} | ${T("Status at the last check", "上次檢查的狀態")} |\n|---|---|---|\n${table}\n\n` +
    `## ${T("In words and in Lean", "文字與 Lean")}\n\n${sections.join("\n")}\n` +
    `## ${T("Build it", "建置")}\n\n` +
    T(
      `1. Install Lean's version manager, elan, from https://lean-lang.org/install (it isn't on conda; pixi only runs the tasks below). It reads \`lean-toolchain\` and fetches ${LEAN_TOOLCHAIN} by itself.\n`,
      `1. 從 https://lean-lang.org/install 安裝 Lean 的版本管理工具 elan（conda 上沒有；pixi 只負責執行下面的工作）。它會讀 \`lean-toolchain\`，自動下載 ${LEAN_TOOLCHAIN}。\n`,
    ) +
    `2. ${T("In this folder", "在這個資料夾裡")}:\n\n\`\`\`bash\n` +
    (mathlib ? `lake exe cache get   # ${T("Mathlib's compiled files", "Mathlib 的已編譯檔")}\n` : "") +
    `lake build\n` +
    (meta.main ? `lake env lean PrintAxioms.lean   # #print axioms ${meta.main}\n` : "") +
    `\`\`\`\n\n` +
    T(
      `Or with [pixi](https://pixi.sh): ${mathlib ? "`pixi run cache`, " : ""}\`pixi run build\`${meta.main ? ", `pixi run axioms`" : ""}. A \`sorry\` left anywhere shows as a warning ("declaration uses 'sorry'"), and \`#print axioms\` then lists \`sorryAx\`.\n\n`,
      `或用 [pixi](https://pixi.sh)：${mathlib ? "`pixi run cache`、" : ""}\`pixi run build\`${meta.main ? "、`pixi run axioms`" : ""}。任何地方留下的 \`sorry\` 會顯示成警告（"declaration uses 'sorry'"），\`#print axioms\` 也會列出 \`sorryAx\`。\n\n`,
    ) +
    `## ${T("Back into Formalizer", "匯回 Formalizer")}\n\n` +
    T(
      "Import this .zip back into Formalizer from Problems ▸ Research (Import): formalizer.json restores the project exactly, notes and links included.\n",
      "在 Formalizer 的「題目 ▸ 研究」用「匯入」把這個 .zip 匯回來：formalizer.json 會原樣還原專案，筆記與連結都在。\n",
    );
  const root = `${slug}/`;
  return [
    { name: `${root}lean-toolchain`, text: `${LEAN_TOOLCHAIN}\n` },
    { name: `${root}lakefile.toml`, text: lakefile },
    { name: `${root}${pkg}.lean`, text: modules.map((m) => `import ${pkg}.${m}`).join("\n") + "\n" },
    ...leanFiles.map((f) => ({ ...f, name: root + f.name })),
    ...(meta.main ? [{ name: `${root}PrintAxioms.lean`, text: `import ${pkg}\n\n#print axioms ${meta.main}\n` }] : []),
    { name: `${root}README.md`, text: readme },
    { name: `${root}pixi.toml`, text: pixi },
    { name: `${root}.gitignore`, text: "/.lake\n/.pixi\n" },
    {
      name: `${root}formalizer.json`,
      text:
        JSON.stringify(
          { format: EXPORT_FORMAT, version: 2, package: pkg, modules: Object.fromEntries(files.map((f, i) => [f.name, `${pkg}.${modules[i]}`])), meta, files },
          null,
          1,
        ) + "\n",
    },
  ];
}

/** A project as an export: a runnable Lean project in one folder (see exportFiles). */
export function exportZip(files: LeanFile[], meta: Meta, id?: string, lang?: string): Uint8Array {
  return makeZip(exportFiles(files, meta, id, lang));
}

/**
 * A project back from an export's entries: this layout (formalizer.json holds the files and meta exactly), or an older
 * export (the .lean files beside a formalizer.json with the meta and `order`), or just .lean files. null: no Lean.
 */
export function importZip(entries: { name: string; text: string }[]): { files: LeanFile[]; meta: Partial<Meta> } | null {
  const json = entries.find((e) => e.name === "formalizer.json" || e.name.endsWith("/formalizer.json"));
  let data: Record<string, unknown> = {};
  try {
    data = json ? JSON.parse(json.text) : {};
  } catch {
    data = {};
  }
  if (data.format === EXPORT_FORMAT && Array.isArray(data.files) && data.meta)
    return { files: (data.files as LeanFile[]).map((f) => ({ name: f.name, code: f.code })), meta: data.meta as Partial<Meta> };
  const { order, ...meta } = data as Partial<Meta> & { order?: string[] };
  let files = entries.filter((e) => e.name.endsWith(".lean")).map((e) => ({ name: e.name.split("/").pop()!, code: e.text }));
  if (!files.length) return null;
  if (order) files = [...order.flatMap((n) => files.filter((f) => f.name === n)), ...files.filter((f) => !order.includes(f.name))];
  return { files, meta };
}
