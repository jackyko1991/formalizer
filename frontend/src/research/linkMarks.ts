/**
 * Text ↔ code links in the research editor, with the problems' mirror look (tutorial/stepMarks.ts): the lines tied to a
 * sentence get its soft colour, and its number sits in a badge in the gutter on its first line. While linking by
 * hand, a click on a line (or its badge) ties or unties it instead of moving the cursor.
 */
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, gutter, GutterMarker, type DecorationSet } from "@codemirror/view";
import { band } from "../tutorial/mirror";

class Badge extends GutterMarker {
  constructor(readonly sentence: number) {
    super();
  }
  eq(other: Badge) {
    return other.sentence === this.sentence;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-step-badge";
    el.textContent = String(this.sentence + 1);
    el.style.background = band(this.sentence).line;
    el.dataset.step = String(this.sentence);
    return el;
  }
}

/**
 * `byLine`: each line's sentence (the one it shows); `firsts`: each sentence's first line; `active`: the sentence
 * pointed at (its lines stand out, the others dim); `picked`: lines chosen while linking by hand (outlined).
 */
export function linkMarks({
  byLine,
  firsts,
  active,
  picked,
  hand,
  onBadge,
  onLine,
  onPoint,
}: {
  byLine: ReadonlyMap<number, number>;
  firsts: ReadonlyMap<number, number>;
  active: number | null;
  picked: ReadonlySet<number>;
  hand: boolean;
  onBadge: (sentence: number) => void;
  /** linking by hand: a line clicked */
  onLine: (line: number) => void;
  /** otherwise: a line clicked (its sentence lights up) */
  onPoint: (line: number) => void;
}): Extension {
  const lines = (view: EditorView): DecorationSet => {
    const builder = new RangeSetBuilder<Decoration>();
    const all = [...new Set([...byLine.keys(), ...picked])].sort((a, b) => a - b);
    for (const n of all) {
      if (n < 1 || n > view.state.doc.lines) continue;
      const i = byLine.get(n);
      const on = i !== undefined && active === i;
      const dim = active !== null && !on;
      const style =
        i === undefined
          ? ""
          : `background-color: ${band(i).bg}; box-shadow: inset 3px 0 0 ${band(i).line}; opacity: ${dim ? 0.75 : 1};`;
      const pick = picked.has(n) ? " outline: 2px dashed #0f766e; outline-offset: -2px;" : "";
      builder.add(
        view.state.doc.line(n).from,
        view.state.doc.line(n).from,
        Decoration.line({
          attributes: {
            class: `cm-step-line${on ? " cm-step-active" : ""}`,
            ...(i !== undefined ? { "data-sentence": String(i) } : {}),
            style: style + pick,
          },
        }),
      );
    }
    return builder.finish();
  };
  return [
    EditorView.decorations.of(lines),
    gutter({
      class: "cm-step-gutter",
      lineMarker(view, line) {
        const n = view.state.doc.lineAt(line.from).number;
        const i = firsts.get(n);
        return i === undefined ? null : new Badge(i);
      },
      lineMarkerChange: () => true,
      domEventHandlers: {
        mousedown(view, line, event) {
          const n = view.state.doc.lineAt(line.from).number;
          if (hand) {
            onLine(n);
            return true;
          }
          const s = (event.target as HTMLElement | null)?.closest<HTMLElement>(".cm-step-badge")?.dataset.step;
          if (s === undefined) return false;
          onBadge(Number(s));
          return true;
        },
      },
    }),
    EditorView.domEventHandlers({
      mousedown(event, view) {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return false;
        const n = view.state.doc.lineAt(pos).number;
        if (!hand) {
          onPoint(n); // the line clicked lights its sentence (also in a read-only editor, which takes no cursor)
          return false;
        }
        onLine(n);
        event.preventDefault();
        return true;
      },
    }),
    ...(hand ? [EditorView.editorAttributes.of({ class: "cm-linking" })] : []),
  ];
}
