// Text ↔ code links in the research workspace: sentences, the automatic linker on the showcase texts, the showcases'
// hand-written links, links made by hand and by the AI (saved in the meta, through an export and back).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acceptAi,
  aiPrompt,
  autoLinks,
  declLines,
  declSpans,
  findDecl,
  parseAiLinks,
  resolveLinks,
  segments,
  sentenceAtLine,
  sentences,
  toggleLine,
} from "../src/research/links.ts";
import { finishedFiles, SHOWCASES, templateLinks, TEMPLATES } from "../src/research/templates.ts";
import { exportZip, importZip, readZip } from "../src/research/model.ts";

const t = (id: string) => TEMPLATES.find((x) => x.id === id)!;
const declOf = (files: { name: string; code: string }[], name: string) => {
  const d = findDecl(files, name)!;
  const code = files.find((f) => f.name === d.file)!.code;
  return { ...d, lines: declLines(code, d) };
};
const names = (files: { name: string; code: string }[]) => files.flatMap((f) => declSpans(f.code).map((d) => d.name));

test("sentences: cut at . ; : and their full-width forms, never inside maths or code, joining back exactly", () => {
  const en = t("odd-sum").notes.odd_sum_eq_square[0];
  assert.deepEqual(sentences(en), [
    "**Main theorem.**",
    "By induction on $n$:",
    "for $n = 0$ both sides are $0$;",
    "from $n$ to $n+1$, add $2n+1$ to both sides and use the two lemmas.",
  ]);
  const zh = t("odd-sum").notes.odd_sum_eq_square[1];
  assert.deepEqual(sentences(zh), ["**主定理。**", "對 $n$ 做歸納：", "$n = 0$ 時兩邊都是 $0$；", "從 $n$ 到 $n+1$，兩邊各加 $2n+1$，再用上兩條引理。"]);
  for (const tm of TEMPLATES)
    for (const note of Object.values(tm.notes))
      for (const text of note) assert.equal(segments(text).map((p) => p.text).join(""), text);
  assert.deepEqual(sentences("Use `exact?` or `rw?`. Then e.g. 1.5 works: done."), ["Use `exact?` or `rw?`.", "Then e.g. 1.5 works:", "done."]);
  assert.deepEqual(sentences("$a. b$ is one; two"), ["$a. b$ is one;", "two"]);
  assert.deepEqual(sentences("First.\n\nSecond"), ["First.", "Second"]);
});

test("declarations are found from the text, with their doc comments", () => {
  const files = finishedFiles(t("nicomachus"));
  assert.deepEqual(
    declSpans(files[0].code).map((d) => [d.name, d.from, d.head, d.to]),
    [
      ["triangle", 1, 2, 4],
      ["cubeSum", 6, 7, 9],
    ],
  );
  assert.deepEqual(
    declSpans(files[1].code).map((d) => [d.name, d.from, d.to]),
    [
      ["two_triangle", 1, 6],
      ["triangle_sq_succ", 8, 16],
    ],
  );
  assert.equal(findDecl(files, "nicomachus")?.file, "Main.lean");
});

test("the automatic linker on the showcase texts: cases, methods and names", () => {
  const files = finishedFiles(t("odd-sum"));
  const main = declOf(files, "odd_sum_eq_square");
  for (const [which, text] of [
    [0, t("odd-sum").notes.odd_sum_eq_square[0]],
    [1, t("odd-sum").notes.odd_sum_eq_square[1]],
  ] as const) {
    const got = autoLinks(sentences(text), main, names(files));
    assert.deepEqual(got, [[1], [2], [3], [4]], `odd_sum_eq_square (${which ? "zh" : "en"})`);
  }
  // `triangle_sq_succ` named in the main theorem's note → the line that rewrites with it
  const nf = finishedFiles(t("nicomachus"));
  const nico = declOf(nf, "nicomachus");
  const got = autoLinks(sentences(t("nicomachus").notes.nicomachus[0]), nico, names(nf));
  assert.deepEqual(got, [[1], [2], [4]]);
  // the oddSum definition: "defined" → the definition's lines; "from n to n+1" → the `| n + 1` case
  const od = declOf(files, "oddSum");
  assert.deepEqual(autoLinks(sentences(t("odd-sum").notes.oddSum[0]), od, names(files)), [[2], [4]]);
  assert.deepEqual(autoLinks(sentences(t("odd-sum").notes.oddSum[1]), od, names(files)), [[2], [4]]);
  // "expand … arithmetic" → simp only and omega
  const sq = declOf(files, "square_succ");
  assert.deepEqual(autoLinks(sentences(t("odd-sum").notes.square_succ[0]), sq, names(files))[1], [4, 5]);
  // a name in `code`: gcd_fib_step's note cites fib_add_two and Nat.gcd_comm → the rw line
  const ff = finishedFiles(t("fib-coprime"));
  const step = declOf(ff, "gcd_fib_step");
  assert.deepEqual(autoLinks(sentences(t("fib-coprime").notes.gcd_fib_step[0]), step, names(ff))[3], [5]);
});

test("every showcase ships linked: each hand-written link finds its sentence and its lines, in both languages", () => {
  for (const s of SHOWCASES()) {
    const files = finishedFiles(s);
    assert.ok(s.links, `${s.id} has links`);
    for (const which of [0, 1] as const) {
      const meta = templateLinks(s, which, files);
      for (const [name, given] of Object.entries(s.links!)) {
        const decl = declOf(files, name);
        assert.ok(decl, `${s.id}: ${name} is declared`);
        const sents = sentences(s.notes[name][which]);
        for (const [frag, lean] of given) {
          const holders = sents.filter((x) => x.includes(frag[which]));
          assert.equal(holders.length, 1, `${s.id}/${name}: "${frag[which]}" picks exactly one sentence`);
          for (const l of lean)
            assert.ok(decl.lines.some((x) => x.text.trim().replace(/\s+/g, " ") === l), `${s.id}/${name}: line "${l}" is in the declaration`);
        }
        // and every sentence of the note is linked to some line
        const resolved = resolveLinks(sents, decl, meta[name], names(files));
        resolved.forEach((r, i) => assert.ok(r.lines.length > 0, `${s.id}/${name} sentence ${i + 1} (${which ? "zh" : "en"}) is linked`));
        assert.ok(resolved.every((r) => r.source === "manual"), `${s.id}/${name}: all hand-written`);
      }
    }
  }
});

test("links by hand: tie and untie lines; they win over automatic ones and survive lines moving", () => {
  const files = finishedFiles(t("odd-sum"));
  const main = declOf(files, "odd_sum_eq_square");
  const sents = sentences(t("odd-sum").notes.odd_sum_eq_square[0]);
  let links = toggleLine(undefined, sents[1], [2], 3, main.lines); // tie line 3 to "By induction…" too
  let r = resolveLinks(sents, main, links, names(files));
  assert.deepEqual(r[1], { lines: [2, 3], source: "manual" });
  links = toggleLine(links, sents[1], r[1].lines, 2, main.lines); // untie line 2
  r = resolveLinks(sents, main, links, names(files));
  assert.deepEqual(r[1], { lines: [3], source: "manual" });
  assert.equal(sentenceAtLine(r, 3), 1); // line 3: the sentence tied to it alone wins over the base case's
  // a line inserted above: the tie follows the text
  const moved = main.lines.map((l) => (l.n >= 2 ? { ...l, n: l.n + 1 } : l));
  moved.splice(1, 0, { n: 2, text: "  -- a comment" });
  assert.deepEqual(resolveLinks(sents, { ...main, lines: moved }, links, names(files))[1].lines, [4]);
  // untie everything: an explicit "no link" (not the automatic one again)
  links = toggleLine(links, sents[1], [3], 3, main.lines);
  assert.deepEqual(resolveLinks(sents, main, links, names(files))[1], { lines: [], source: "manual" });
});

test("asking the AI: the prompt numbers sentences and lines; the answer's JSON is checked and applied", () => {
  const files = finishedFiles(t("odd-sum"));
  const main = declOf(files, "odd_sum_eq_square");
  const sents = sentences(t("odd-sum").notes.odd_sum_eq_square[0]);
  const prompt = aiPrompt(main, sents, "en");
  assert.match(prompt, /1\. \*\*Main theorem\.\*\*/);
  assert.match(prompt, /  4 \| {3}\| succ k ih/);
  assert.match(prompt, /formalizer_links/);
  const answer =
    'Here you go.\n```json\n{"formalizer_links": {"decl": "odd_sum_eq_square", "links": [{"sentence": 2, "lines": [2, 3, 4]}, {"sentence": 4, "lines": [4, 99]}, {"sentence": 9, "lines": [1]}]}}\n```';
  const ai = parseAiLinks(answer, main, sents)!;
  assert.equal(ai.length, 2); // sentence 9 doesn't exist; line 99 is outside the declaration
  const r = resolveLinks(sents, main, { ai }, names(files));
  assert.deepEqual(r[1], { lines: [2, 3, 4], source: "ai" });
  assert.deepEqual(r[3], { lines: [4], source: "ai" });
  assert.equal(r[0].source, "auto");
  assert.equal(parseAiLinks("no JSON here", main, sents), null);
  assert.equal(parseAiLinks('```json\n{"formalizer_links": {"decl": "other", "links": []}}\n```', main, sents), null);
  // accepted: the AI's links become the reader's own
  const own = acceptAi({ ai });
  assert.equal(own.ai, undefined);
  assert.deepEqual(resolveLinks(sents, main, own, names(files))[1], { lines: [2, 3, 4], source: "manual" });
});

test("links made by hand and by the AI are kept in the meta: an export reads back the same", () => {
  const s = t("odd-sum");
  const files = finishedFiles(s);
  const main = declOf(files, "odd_sum_eq_square");
  const sents = sentences(s.notes.odd_sum_eq_square[0]);
  const links = {
    odd_sum_eq_square: { ...toggleLine(undefined, sents[0], [], 1, main.lines), ai: parseAiLinks('{"formalizer_links": {"links": [{"sentence": 2, "lines": [2]}]}}', main, sents)! },
  };
  const meta = { title: "Odd", main: s.main, statements: s.statements, notes: { odd_sum_eq_square: s.notes.odd_sum_eq_square[0] }, next: {}, links };
  const zip = exportZip(files, meta, "odd-1234");
  const back = importZip(readZip(zip))!;
  assert.deepEqual(back.files, files);
  assert.deepEqual(back.meta.links, links);
  assert.deepEqual(resolveLinks(sents, main, back.meta.links!.odd_sum_eq_square, names(files)).map((r) => r.source), ["manual", "ai", "auto", "auto"]);
});
