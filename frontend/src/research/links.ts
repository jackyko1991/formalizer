/**
 * Text ↔ code links in the research workspace, pure (tested in node). A declaration's "In words" text is cut into
 * sentences and clauses; each is tied to the Lean lines that do what it says. Three sources, the first that has
 * something for a sentence wins: links made by hand, links the AI proposed, and automatic links found from what the
 * sentence mentions (names in the code, the cases `n = 0` / "from n to n + 1", method words like induction, rewrite,
 * arithmetic). Links are kept by the lines' text (and their place in the declaration, to tell repeated lines apart),
 * so they follow edits that move lines around.
 */

/** A sentence's links as saved in the project's meta. */
export interface SentenceLink {
  /** the sentence (whitespace normalised) */
  s: string;
  /** the Lean lines it is tied to (trimmed, whitespace normalised); none: tied to nothing on purpose */
  lean: string[];
  /** each line's offset from the declaration's first line when it was tied (to tell repeated lines apart) */
  at?: number[];
}
export interface DeclLinks {
  manual?: SentenceLink[];
  ai?: SentenceLink[];
}
export type LinkSource = "manual" | "ai" | "auto";
export interface Resolved {
  /** 1-based lines of the declaration's file */
  lines: number[];
  source: LinkSource | null;
}

/** A declaration's place in one file: from its doc comment (if any) to its last non-blank line, 1-based. */
export interface DeclSpan {
  name: string;
  from: number;
  /** the line with the keyword (`theorem`, `def`, …) */
  head: number;
  to: number;
}

export const norm = (s: string) => s.trim().replace(/\s+/g, " ");

// ---------------------------------------------------------------------------------------------- sentences

const ABBREV = /(?:^|[\s(])(?:e\.g|i\.e|etc|cf|vs|resp)$/i;

/**
 * The text cut into pieces that join back to it exactly: each sentence or clause (ended by . ! ? ; : and their
 * full-width forms 。！？；：, or a blank line) has its index; the whitespace between has none. `$…$` maths and
 * `code` are never cut, nor are "e.g." or "1.5".
 */
export function segments(text: string): { text: string; index: number | null }[] {
  const out: { text: string; index: number | null }[] = [];
  let index = 0;
  const push = (piece: string) => {
    if (!piece) return;
    const lead = piece.match(/^\s*/)![0];
    const tail = piece.slice(lead.length).match(/\s*$/)![0];
    const body = piece.slice(lead.length, piece.length - tail.length);
    if (lead) out.push({ text: lead, index: null });
    if (body) out.push({ text: body, index: index++ });
    if (tail) out.push({ text: tail, index: null });
  };
  let math = false;
  let code = false;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "`" && !math) code = !code;
    else if (c === "$" && !code) {
      if (text[i + 1] === "$") i++;
      math = !math;
    }
    if (math || code) continue;
    let end = -1;
    if ("。！？；：".includes(c)) end = i + 1;
    else if (".!?;:".includes(c)) {
      const next = text[i + 1];
      const free = next === undefined || /[\s*)"”」』）]/.test(next);
      const word = text.slice(Math.max(0, i - 6), i);
      if (free && !(c === "." && (ABBREV.test(word) || /\d$/.test(word) && /\d/.test(next ?? "")))) end = i + 1;
    } else if (c === "\n" && text[i + 1] === "\n") end = i + 2;
    if (end < 0) continue;
    while (end < text.length && /[*)"”」』）]/.test(text[end])) end++; // **bold.** and closing quotes stay with it
    push(text.slice(start, end));
    start = end;
    i = end - 1;
  }
  push(text.slice(start));
  // merge pieces that are only markup or punctuation into the one before
  const merged: { text: string; index: number | null }[] = [];
  let n = 0;
  for (const p of out) {
    if (p.index !== null && !/[\p{L}\p{N}$`]/u.test(p.text)) {
      const last = [...merged].reverse().find((q) => q.index !== null);
      if (last) {
        const at = merged.indexOf(last);
        last.text += merged.slice(at + 1).map((q) => q.text).join("") + p.text;
        merged.splice(at + 1);
        continue;
      }
    }
    merged.push(p.index === null ? p : { ...p, index: n++ });
  }
  return merged;
}

/** The sentences and clauses of a text, in order. */
export const sentences = (text: string): string[] => segments(text).flatMap((p) => (p.index === null ? [] : [p.text]));

// ---------------------------------------------------------------------------------------------- declarations

const HEAD = /^(?:@\[[^\]]*\]\s*)?(?:(?:private|protected|noncomputable|partial|unsafe)\s+)*(theorem|lemma|def|abbrev|instance|structure|inductive|class|example)\s+([^\s:({[]+)?/;

/** The declarations of a file, each with its doc comment and up to its last non-blank line. */
export function declSpans(code: string): DeclSpan[] {
  const lines = code.split("\n");
  const heads: { name: string; head: number }[] = [];
  lines.forEach((l, i) => {
    const m = l.match(HEAD);
    if (m) heads.push({ name: m[2] ?? `${m[1]}@${i + 1}`, head: i + 1 });
  });
  return heads.map((h, k) => {
    let from = h.head;
    // a doc comment right above (`/-- … -/`, possibly several lines)
    if (from > 1 && /-\/\s*$/.test(lines[from - 2])) {
      let j = from - 1;
      while (j >= 1 && !/^\s*\/-/.test(lines[j - 1])) j--;
      if (j >= 1 && /^\s*\/--/.test(lines[j - 1])) from = j;
    }
    let to = (k + 1 < heads.length ? heads[k + 1].head : lines.length + 1) - 1;
    // the next declaration's doc comment and the blank lines before it are not ours
    if (k + 1 < heads.length) {
      const nextFrom = declFrom(lines, heads[k + 1].head);
      to = Math.min(to, nextFrom - 1);
    }
    while (to > h.head && !lines[to - 1]?.trim()) to--;
    return { name: h.name, from, head: h.head, to };
  });
}
function declFrom(lines: string[], head: number): number {
  if (head > 1 && /-\/\s*$/.test(lines[head - 2])) {
    let j = head - 1;
    while (j >= 1 && !/^\s*\/-/.test(lines[j - 1])) j--;
    if (j >= 1 && /^\s*\/--/.test(lines[j - 1])) return j;
  }
  return head;
}

/** Where a declaration is among the files (the first file that declares it). */
export function findDecl(files: readonly { name: string; code: string }[], name: string): (DeclSpan & { file: string }) | null {
  for (const f of files) {
    const d = declSpans(f.code).find((x) => x.name === name);
    if (d) return { ...d, file: f.name };
  }
  return null;
}

/** The declaration at a line of a file, from the text alone (when Lean hasn't placed them yet). */
export function declAtLine(code: string, line: number): DeclSpan | undefined {
  return declSpans(code).find((d) => d.from <= line && line <= d.to);
}

// ---------------------------------------------------------------------------------------------- automatic links

const TACTIC_WORDS = new Set([
  "rfl", "omega", "simp", "rw", "exact", "apply", "induction", "decide", "norm_num", "ring", "linarith", "have", "show",
  "generalize", "cases", "intro", "calc", "unfold", "constructor", "simp_all", "exact?", "rw?", "only", "at", "with",
]);
const IDENT = /[A-Za-z_][A-Za-z0-9_.']*/g;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasToken = (line: string, token: string) => new RegExp(`(^|[^A-Za-z0-9_.'])${escape(token)}($|[^A-Za-z0-9_'])`).test(line);

/** What a sentence says, as flat lower-case text without maths delimiters or markup. */
const flatten = (s: string) =>
  s
    .replace(/`[^`]*`/g, " ")
    .replace(/[$\\{}*]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

/**
 * The lines of a declaration each sentence mentions, found from its words: names that appear in the code, the cases
 * (`n = 0` ↔ `| zero`, "from n to n + 1" ↔ `| succ`), and method words (induction, rewrite, lemma, arithmetic,
 * expand, definition). `lines`: the declaration's lines with their 1-based numbers; `names`: the project's
 * declarations. Returns, per sentence, its lines in order.
 */
export function autoLinks(
  sents: readonly string[],
  decl: { name: string; head: number; lines: readonly { n: number; text: string }[] },
  names: readonly string[] = [],
): number[][] {
  const known = new Set(names);
  const body = decl.lines.filter((l) => l.n >= decl.head);
  const head = body.filter((l) => l.n === decl.head || (l.n > decl.head && l.n <= headEnd(body, decl.head)));
  const isDef = /^\s*(?:@\[[^\]]*\]\s*)?(?:\w+\s+)*(def|abbrev|structure|inductive|class)\b/.test(body[0]?.text ?? "");
  const where = (re: RegExp) => body.filter((l) => re.test(l.text)).map((l) => l.n);
  /** a case line and the lines indented under it */
  const caseBlock = (re: RegExp) =>
    body.flatMap((l, i) => {
      if (!re.test(l.text.trim())) return [];
      const indent = l.text.search(/\S/);
      const out = [l.n];
      for (const m of body.slice(i + 1)) {
        if (!m.text.trim() || m.text.search(/\S/) <= indent) break;
        out.push(m.n);
      }
      return out;
    });
  const citing = body
    .filter((l) => /\b(rw|rewrite|exact|apply|simp|simp only|calc|have)\b/.test(l.text))
    .filter((l) =>
      [...l.text.matchAll(IDENT)].some(
        (m) => m[0] !== decl.name && (known.has(m[0]) || (/_/.test(m[0]) && !TACTIC_WORDS.has(m[0]))) && !/^(Nat|Int)$/.test(m[0]),
      ),
    )
    .map((l) => l.n);

  return sents.map((s) => {
    const got = new Set<number>();
    const add = (ns: number[]) => ns.forEach((n) => got.add(n));
    const flat = flatten(s);
    // names: in `code`, or bare words that are the project's declarations
    const ticked = [...s.matchAll(/`([^`]+)`/g)].flatMap((m) => [...m[1].matchAll(IDENT)].map((x) => x[0]));
    const bare = [...s.replace(/`[^`]*`|\$[^$]*\$/g, " ").matchAll(IDENT)].map((x) => x[0]).filter((w) => known.has(w));
    for (const token of new Set([...ticked, ...bare])) {
      if (token === "only" || token === "at" || token === "with") continue;
      const tactic = TACTIC_WORDS.has(token) ? token.replace(/\?$/, "") : null;
      if (tactic) {
        add(where(new RegExp(`(^|[^A-Za-z0-9_])${escape(tactic)}([^A-Za-z0-9_]|$)`)));
        continue;
      }
      if (token === decl.name) continue;
      add(body.filter((l) => l.n !== decl.head && hasToken(l.text, token)).map((l) => l.n));
    }
    // what the declaration is: the statement
    if (/\bmain theorem\b|主定理|\bstatement\b|陳述|\bwe prove\b|要證明/.test(flat)) add(head.map((l) => l.n));
    // the cases
    if (/\bn ?= ?0\b|\bzero\b|base case|f_0|gcd\(0|n ?= ?0 ?時|0 ?時|基底|起點/.test(flat)) add(caseBlock(/^\|\s*(zero|0)\b/));
    if (
      /from n to n ?\+ ?1|n ?(→|->|to) ?n ?\+ ?1|\beach step\b|\bthe step\b|\bin the step\b|每一步|遞推|到 ?n ?\+ ?1|n ?\+ ?1 ?時|\bone more\b|多加一/.test(flat)
    )
      add(caseBlock(/^\|\s*(succ\b|[a-z]\w*\s*\+\s*\d)/));
    // the methods
    if (/\binduct|歸納/.test(flat)) add(where(/\binduction\b/));
    if (/\brewrit|改寫|代入|substitut/.test(flat)) add(where(/\b(rw|rewrite)\b/));
    if (/\blemma|引理|\buse the\b|用上/.test(flat)) add(citing);
    if (/\barithmetic|\bcompute|\bcalculat|算術|計算|算成/.test(flat)) add(where(/\b(omega|decide|rfl|norm_num|linarith|ring)\b/));
    if (/\bexpand|展開/.test(flat)) add(where(/\b(simp only|ring_nf|ring|Nat\.(add_mul|mul_add))\b/));
    if (/\bdefin|定義/.test(flat)) {
      if (isDef) add(head.map((l) => l.n));
      else add(where(/\b(rfl|unfold)\b/));
    }
    return [...got].sort((a, b) => a - b);
  });
}
/** The statement's last line: up to the line that ends with `:=` / `:= by` (or the head line). */
function headEnd(body: readonly { n: number; text: string }[], head: number): number {
  for (const l of body) if (l.n >= head && /:=/.test(l.text)) return l.n;
  return head;
}

// ---------------------------------------------------------------------------------------------- combining

/** A declaration's lines, numbered as in its file. */
export function declLines(code: string, span: Pick<DeclSpan, "from" | "to">): { n: number; text: string }[] {
  return code
    .split("\n")
    .slice(span.from - 1, span.to)
    .map((text, i) => ({ n: span.from + i, text }));
}

/** Where a saved link's lines are now, inside the declaration (lines that are gone are dropped). */
export function locate(link: SentenceLink, lines: readonly { n: number; text: string }[]): number[] {
  const first = lines[0]?.n ?? 1;
  const used = new Set<number>();
  const out: number[] = [];
  link.lean.forEach((text, k) => {
    const want = norm(text);
    const near = link.at?.[k];
    let hit = near !== undefined ? lines.find((l) => l.n === first + near && norm(l.text) === want && !used.has(l.n)) : undefined;
    if (!hit) {
      const all = lines.filter((l) => norm(l.text) === want && !used.has(l.n));
      hit = near === undefined ? all[0] : all.sort((a, b) => Math.abs(a.n - first - near) - Math.abs(b.n - first - near))[0];
    }
    if (hit) {
      used.add(hit.n);
      out.push(hit.n);
    }
  });
  return out.sort((a, b) => a - b);
}

/** Each sentence's lines and where they come from: by hand, else the AI's, else automatic. */
export function resolveLinks(
  sents: readonly string[],
  decl: { name: string; head: number; lines: readonly { n: number; text: string }[] },
  links: DeclLinks | undefined,
  names: readonly string[] = [],
  { auto = true }: { auto?: boolean } = {},
): Resolved[] {
  const autos = auto ? autoLinks(sents, decl, names) : sents.map(() => []);
  return sents.map((s, i) => {
    const key = norm(s);
    const manual = links?.manual?.find((l) => l.s === key);
    if (manual) return { lines: locate(manual, decl.lines), source: "manual" };
    const ai = links?.ai?.find((l) => l.s === key);
    if (ai) return { lines: locate(ai, decl.lines), source: "ai" };
    return { lines: autos[i], source: autos[i].length ? "auto" : null };
  });
}

/** A sentence's link as saved: its lines' text and offsets in the declaration. */
export function linkOf(sentence: string, lines: readonly number[], decl: readonly { n: number; text: string }[]): SentenceLink {
  const first = decl[0]?.n ?? 1;
  const kept = [...new Set(lines)].sort((a, b) => a - b).filter((n) => decl.some((l) => l.n === n && l.text.trim()));
  return { s: norm(sentence), lean: kept.map((n) => norm(decl.find((l) => l.n === n)!.text)), at: kept.map((n) => n - first) };
}

/** Tie or untie one line for one sentence, by hand: the sentence's links become manual (starting from what it has). */
export function toggleLine(
  links: DeclLinks | undefined,
  sentence: string,
  current: readonly number[],
  line: number,
  decl: readonly { n: number; text: string }[],
): DeclLinks {
  const next = current.includes(line) ? current.filter((n) => n !== line) : [...current, line];
  const key = norm(sentence);
  const manual = [...(links?.manual ?? []).filter((l) => l.s !== key), linkOf(sentence, next, decl)];
  return { ...links, manual };
}

/** The AI's proposal accepted: its links become the reader's own. */
export function acceptAi(links: DeclLinks | undefined): DeclLinks {
  const own = links?.manual ?? [];
  const ai = (links?.ai ?? []).filter((l) => !own.some((m) => m.s === l.s));
  return { manual: [...own, ...ai] };
}

/** For a line: the sentence it shows (the one tied to the fewest lines that holds it, so a precise tie wins). */
export function sentenceAtLine(resolved: readonly Resolved[], line: number): number | null {
  let best: number | null = null;
  resolved.forEach((r, i) => {
    if (!r.lines.includes(line)) return;
    if (best === null || r.lines.length < resolved[best].lines.length) best = i;
  });
  return best;
}

// ---------------------------------------------------------------------------------------------- asking the AI

export const AI_MARK = "formalizer_links";

/** The message asking the reader's agent for links, in a strict JSON shape (parsed by parseAiLinks). */
export function aiPrompt(
  decl: { name: string; file: string; lines: readonly { n: number; text: string }[] },
  sents: readonly string[],
  lang: "en" | "zh-Hant" | string,
): string {
  const zh = lang.startsWith("zh");
  const numbered = sents.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const code = decl.lines.map((l) => `${String(l.n).padStart(3)} | ${l.text}`).join("\n");
  const shape = `{"${AI_MARK}": {"decl": "${decl.name}", "links": [{"sentence": 1, "lines": [3, 4]}]}}`;
  return zh
    ? `請把 \`${decl.name}\` 的文字說明和它的 Lean 程式碼逐句連結起來：每個句子對應到做這件事的程式碼行（${decl.file} 的行號）。不要修改任何檔案。\n\n句子：\n${numbered}\n\n程式碼（${decl.file}）：\n${code}\n\n最後只用一個 \`\`\`json 區塊回答，格式完全照這樣（sentence 是句子編號，lines 是行號；沒有對應的句子就給空陣列）：\n${shape}`
    : `Link the explanation of \`${decl.name}\` to its Lean code, sentence by sentence: each sentence to the code lines (line numbers of ${decl.file}) that do what it says. Don't change any file.\n\nSentences:\n${numbered}\n\nCode (${decl.file}):\n${code}\n\nEnd with one \`\`\`json block in exactly this shape (sentence: the sentence's number; lines: line numbers; an empty list when a sentence has no line):\n${shape}`;
}

/**
 * The links in an AI answer: the last JSON object holding `formalizer_links` for this declaration, checked (sentence
 * numbers in range, lines inside the declaration). null when the answer has none.
 */
export function parseAiLinks(
  answer: string,
  decl: { name: string; lines: readonly { n: number; text: string }[] },
  sents: readonly string[],
): SentenceLink[] | null {
  const candidates = [...answer.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  const brace = answer.indexOf(`{"${AI_MARK}"`);
  if (brace >= 0) candidates.push(answer.slice(brace, answer.lastIndexOf("}") + 1));
  for (const text of candidates.reverse()) {
    let data: unknown;
    try {
      data = JSON.parse(text.trim());
    } catch {
      continue;
    }
    const got = (data as Record<string, unknown>)?.[AI_MARK] as { decl?: string; links?: unknown } | undefined;
    if (!got || !Array.isArray(got.links) || (got.decl && got.decl !== decl.name)) continue;
    const inDecl = new Set(decl.lines.map((l) => l.n));
    const out: SentenceLink[] = [];
    for (const l of got.links as { sentence?: unknown; lines?: unknown }[]) {
      const i = Number(l?.sentence) - 1;
      if (!Number.isInteger(i) || i < 0 || i >= sents.length || !Array.isArray(l.lines)) continue;
      const lines = l.lines.map(Number).filter((n) => inDecl.has(n));
      if (out.some((x) => x.s === norm(sents[i]))) continue;
      out.push(linkOf(sents[i], lines, decl.lines));
    }
    return out;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------- showcase links

/** Hand-written links of a demo: a fragment that picks the sentence (in each language) and the Lean lines. */
export type GivenLink = readonly [readonly [string, string], readonly string[]];

/** A demo's hand-written links as saved links, for the note in the reader's language (`which`: 0 English, 1 中文). */
export function givenLinks(
  note: string,
  given: readonly GivenLink[],
  which: 0 | 1,
  decl: readonly { n: number; text: string }[] | null,
): SentenceLink[] {
  const sents = sentences(note);
  return given.flatMap(([frag, lean]) => {
    const s = sents.find((x) => x.includes(frag[which]));
    if (!s) return [];
    const link: SentenceLink = { s: norm(s), lean: lean.map(norm) };
    if (decl) {
      const lines = locate(link, decl);
      return [linkOf(s, lines, decl)];
    }
    return [link];
  });
}
