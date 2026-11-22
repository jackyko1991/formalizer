/**
 * Lean 4 syntax colours for CodeMirror (the Proof.lean editor, the Research editor, and every code block on the
 * Concept and Coding Skills pages). CodeMirror has no Lean mode, so this is a small stream tokenizer: comments (`--`,
 * nested `/- -/`, `/-- -/`), strings, numbers, declaration keywords, proof words, tactics, `sorry`, types, `#check`
 * and `@[…]`, and the maths operators. It colours; it does not parse (Lean itself checks the file).
 * Colours follow learnkit's inline-code palette (violet keywords, amber numbers, emerald strings) plus Formalizer's teal
 * for tactics; `sorry` is underlined with dots, since it is the hole still to fill.
 */
import { HighlightStyle, StreamLanguage, syntaxHighlighting, type StreamParser } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

/** what declares something, or organises the file */
const DECLARATION = words(`
  theorem lemma def example abbrev instance structure class inductive where deriving axiom opaque noncomputable
  private protected namespace section end open variable universe import set_option attribute local macro macro_rules
  syntax notation infix infixl infixr prefix postfix mutual partial unsafe elab termination_by decreasing_by extends
`);
/** the words of a proof or a term */
const PROOF = words(`by fun λ let have show from at with match if then else do return calc suffices this for in using`);
/** tactics (and the names a chip may hold) */
const TACTICS = words(`
  rfl decide simp simp? simp_all omega exact exact? apply apply? intro intros rw rw? rwa unfold induction cases rcases
  obtain refine constructor norm_num ring linarith nlinarith positivity grind trivial assumption contradiction exfalso
  use revert generalize specialize subst split_ifs funext ext congr aesop tauto field_simp push_neg by_contra by_cases
  left right exists exists? native_decide norm_cast push_cast gcongr bound interval_cases fin_cases all_goals any_goals
  first repeat try next case focus skip done change conv symm trans
`);
const TYPES = words(`Nat Int Prop Type Sort Bool Real Rat Complex String List Array Option Fin True False ℕ ℤ ℚ ℝ ℂ Set Finset`);
const HOLES = words(`sorry admit`);

/** a Lean identifier: letters (Greek, letter-like symbols such as ℕ, subscripts), digits, ', !, ?, dots between parts */
const IDENT = /^[A-Za-z_Ͱ-Ͽἀ-῿℀-⅏][\w'!?Ͱ-Ͽἀ-῿₀-ₜᵢ-ᵪ℀-⅏]*(?:\.[A-Za-z_Ͱ-Ͽ℀-⅏][\w'!?Ͱ-Ͽ₀-ₜ℀-⅏]*)*/u;
const OPERATOR = /^(?::=|->|<-|<->|=>|\|\||&&|[∀∃∄→←↔⇒∧∨¬≤≥≠∣∤⟨⟩∘×·▸⁻¹∑∏∫∈∉⊆⊂∪∩∅≃≅≡=+\-*/^<>|%!&$:])/u;

interface State {
  /** depth of nested block comments (0: not in one) */
  comment: number;
}

const parser: StreamParser<State> = {
  name: "lean4",
  startState: () => ({ comment: 0 }),
  token(stream, state) {
    if (state.comment > 0) {
      while (!stream.eol()) {
        if (stream.match("/-")) state.comment++;
        else if (stream.match("-/")) {
          state.comment--;
          if (state.comment === 0) break;
        } else stream.next();
      }
      return "comment";
    }
    if (stream.eatSpace()) return null;
    if (stream.match("--")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("/-")) {
      state.comment = 1;
      return "comment";
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return "string";
    if (stream.match(/^#[a-z_]+/)) return "meta";
    if (stream.match(/^@\[[^\]]*\]?/)) return "meta";
    if (stream.match(/^(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)/)) return "number";
    const ident = stream.match(IDENT) as RegExpMatchArray | null;
    if (ident) {
      const w = ident[0];
      if (HOLES.has(w)) return "invalid";
      if (DECLARATION.has(w)) return "keyword";
      if (PROOF.has(w)) return "controlKeyword";
      if (TACTICS.has(w)) return "macroName";
      if (TYPES.has(w)) return "typeName";
      return "variableName";
    }
    if (stream.match(OPERATOR)) return "operator";
    if (stream.match(/^[()[\]{}⦃⦄,;]/)) return "bracket";
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: "--", block: { open: "/-", close: "-/" } } },
};

const LEAN_STYLE = HighlightStyle.define([
  { tag: t.keyword, color: "#6d28d9", fontWeight: "600" }, // violet-700: theorem, def, …
  { tag: t.controlKeyword, color: "#7c3aed" }, // violet-600: by, fun, have, …
  { tag: t.macroName, color: "#0f766e", fontWeight: "600" }, // teal-700: tactics
  { tag: t.typeName, color: "#0369a1" }, // sky-700: Nat, Prop, ℝ
  { tag: t.number, color: "#b45309" }, // amber-700
  { tag: t.string, color: "#047857" }, // emerald-700
  { tag: t.comment, color: "#6b7280", fontStyle: "italic" }, // gray-500
  { tag: t.meta, color: "#be185d" }, // pink-700: #check, @[simp]
  { tag: t.operator, color: "#475569" }, // slate-600
  // sorry: the hole to fill, underlined with dots (as in the editor, sorryMarks.ts)
  {
    tag: t.invalid,
    color: "#b45309",
    fontWeight: "600",
    textDecoration: "underline dotted #f59e0b",
    textDecorationThickness: "2px",
    textUnderlineOffset: "4px",
  },
]);

const LEAN = StreamLanguage.define(parser);

/** The extensions that make a CodeMirror editor show Lean 4 in colour. */
export function lean() {
  return [LEAN, syntaxHighlighting(LEAN_STYLE)];
}

