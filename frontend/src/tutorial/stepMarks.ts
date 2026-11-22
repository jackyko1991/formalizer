/**
 * The proof mirror in the editor: the lines that do each paper step get that step's soft colour, and a numbered badge
 * in the gutter on the step's first line (tap it to read the step in natural language). The steps are found in the editor's own
 * text on every update (locateSteps), so the colours follow edits without waiting for React.
 */
import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, EditorView, gutter, GutterMarker, type DecorationSet } from "@codemirror/view";
import { band } from "./mirror";
import { locateSteps } from "./progress";

class Badge extends GutterMarker {
  constructor(readonly step: number) {
    super();
  }
  eq(other: Badge) {
    return other.step === this.step;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-step-badge";
    el.textContent = String(this.step + 1);
    el.style.background = band(this.step).line;
    el.dataset.step = String(this.step);
    el.title = "";
    return el;
  }
}

export function stepMarks(anchors: readonly (readonly string[])[], active: number | null, onBadge: (step: number) => void): Extension {
  const located = (view: EditorView) => locateSteps(view.state.doc.toString(), anchors.map((lean) => ({ lean: [...lean] })));
  const lines = (view: EditorView): DecorationSet => {
    const builder = new RangeSetBuilder<Decoration>();
    const byLine = new Map<number, number>();
    located(view).forEach((found, i) => found?.forEach((n) => byLine.has(n) || byLine.set(n, i)));
    for (const n of [...byLine.keys()].sort((a, b) => a - b)) {
      if (n > view.state.doc.lines) continue;
      const i = byLine.get(n)!;
      const on = active === i;
      const dim = active !== null && !on;
      builder.add(
        view.state.doc.line(n).from,
        view.state.doc.line(n).from,
        Decoration.line({
          attributes: {
            class: `cm-step-line${on ? " cm-step-active" : ""}`,
            "data-step": String(i),
            style: `background-color: ${band(i).bg}; box-shadow: inset 3px 0 0 ${band(i).line}; opacity: ${dim ? 0.75 : 1}`,
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
        const i = located(view).findIndex((found) => found?.[0] === n);
        return i < 0 ? null : new Badge(i);
      },
      lineMarkerChange: (u) => u.docChanged,
      domEventHandlers: {
        mousedown(_view, _line, event) {
          const step = (event.target as HTMLElement | null)?.closest<HTMLElement>(".cm-step-badge")?.dataset.step;
          if (step === undefined) return false;
          onBadge(Number(step));
          return true;
        },
      },
    }),
  ];
}
