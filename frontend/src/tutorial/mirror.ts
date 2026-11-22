/**
 * The statement mirror, pure (tested in node): the natural-language statement's pieces each name a substring of the Lean statement;
 * these helpers cut the clickable statement's parts into runs that belong to a pair (or to none).
 */
export interface MirrorPair {
  human: readonly [string, string];
  /** a substring of the start file */
  lean: string;
}

export type Run = { text: string; pair: number | null };

/**
 * The statement's parts (`theorem`, the name, the binders, `: claim`, …) cut into runs by the pairs' Lean substrings.
 * A pair is found inside one part (its first occurrence, longer pairs first, never overlapping another); a pair that
 * spans several parts (`theorem hello`) colours every part it contains whole.
 */
export function mirrorRuns(parts: readonly string[], pairs: readonly Pick<MirrorPair, "lean">[]): Run[][] {
  const taken: { part: number; from: number; to: number; pair: number }[] = [];
  const wholePart = new Map<number, number>();
  const order = pairs.map((_, i) => i).sort((a, b) => pairs[b].lean.length - pairs[a].lean.length);
  for (const i of order) {
    const lean = pairs[i].lean.trim();
    if (!lean) continue;
    let placed = false;
    for (let p = 0; p < parts.length && !placed; p++) {
      let at = parts[p].indexOf(lean);
      while (at >= 0 && !placed) {
        const to = at + lean.length;
        if (!taken.some((t) => t.part === p && t.from < to && at < t.to) && !wholePart.has(p)) {
          taken.push({ part: p, from: at, to, pair: i });
          placed = true;
        } else at = parts[p].indexOf(lean, at + 1);
      }
    }
    if (!placed) {
      const flat = lean.replace(/\s+/g, " ");
      parts.forEach((part, p) => {
        const piece = part.trim().replace(/\s+/g, " ");
        if (piece && flat.includes(piece) && !wholePart.has(p) && !taken.some((t) => t.part === p)) wholePart.set(p, i);
      });
    }
  }
  return parts.map((part, p) => {
    if (wholePart.has(p)) return [{ text: part, pair: wholePart.get(p)! }];
    const mine = taken.filter((t) => t.part === p).sort((a, b) => a.from - b.from);
    const out: Run[] = [];
    let at = 0;
    for (const t of mine) {
      if (t.from > at) out.push({ text: part.slice(at, t.from), pair: null });
      out.push({ text: part.slice(t.from, t.to), pair: t.pair });
      at = t.to;
    }
    if (at < part.length || !out.length) out.push({ text: part.slice(at), pair: null });
    return out;
  });
}

/** Soft colours for the pairs and steps: background, and the stronger tone for lines, badges and borders. */
export const BANDS = [
  { bg: "rgba(251, 191, 36, 0.22)", line: "#d97706" },
  { bg: "rgba(56, 189, 248, 0.20)", line: "#0284c7" },
  { bg: "rgba(74, 222, 128, 0.22)", line: "#16a34a" },
  { bg: "rgba(244, 114, 182, 0.20)", line: "#db2777" },
  { bg: "rgba(167, 139, 250, 0.22)", line: "#7c3aed" },
  { bg: "rgba(251, 146, 60, 0.22)", line: "#ea580c" },
] as const;
export const band = (i: number) => BANDS[i % BANDS.length];

/** What the problem page reads from a guide for the two mirrors (the statement's pairs, the paper proof's steps). */
export interface GuideMirror {
  statementMirror?: readonly MirrorPair[];
  paper?: readonly { text: readonly [string, string]; lines: readonly [number, number]; lean?: readonly string[]; goal?: string }[];
}

/** The paper steps with their Lean anchors: the guide's `lean` lines, or else the solution's lines it names. */
export function paperSteps(guide: GuideMirror | undefined, solution: string) {
  const lines = solution.split("\n");
  return (guide?.paper ?? []).map((s) => ({
    text: s.text,
    goal: s.goal,
    lean: (s.lean?.length ? [...s.lean] : lines.slice(s.lines[0] - 1, s.lines[1])).map((l) => l.trim()).filter(Boolean),
  }));
}

/**
 * The Lean text the statement mirror shows: the problem's statements, or, when some natural-language pieces describe
 * definitions or given lemmas the statements leave out (e.g. `def fib`, `theorem one_horse`), the whole start file —
 * the definitions are part of what the claim means, so every piece keeps its Lean partner.
 */
export function mirrorLeanText(statements: readonly string[], start: string, pairs: readonly { lean: string }[]): string {
  const plain = statements.join("\n\n");
  return pairs.every((p) => plain.includes(p.lean)) ? plain : start.trim();
}
