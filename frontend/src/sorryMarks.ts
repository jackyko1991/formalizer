/**
 * The holes in a proof, made visible in the editor: every `sorry` is a highlighted badge, the one the tactics will
 * fill (the "target", picked by clicking it) is outlined, and while a tactic is hovered it is shown in place of the
 * target, so you see the replacement before you press it.
 */
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { sorryOffsets } from "./runner";

class Preview extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  eq(other: Preview) {
    return other.text === this.text;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-sorry-preview";
    // a multi-line chip (an induction skeleton) is previewed by its first line
    const first = this.text.split("\n")[0];
    el.textContent = first + (first !== this.text ? " …" : "");
    return el;
  }
}

function build(view: EditorView, target: number, preview: string | null): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  sorryOffsets(view.state.doc.toString()).forEach((from, i) => {
    const to = from + "sorry".length;
    if (i === target && preview) builder.add(from, to, Decoration.replace({ widget: new Preview(preview) }));
    else
      builder.add(
        from,
        to,
        Decoration.mark({
          class: i === target ? "cm-sorry cm-sorry-target" : "cm-sorry",
          attributes: { title: i === target ? "the tactics fill this sorry" : "click to fill this sorry next" },
        }),
      );
  });
  return builder.finish();
}

/** Editor extension: highlight every sorry; `target` is the index of the one to fill; `preview` the hovered tactic. */
export function sorryMarks(target: number, preview: string | null) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = build(view, target, preview);
      }
      update(u: ViewUpdate) {
        if (u.docChanged) this.decorations = build(u.view, target, preview);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/** Which sorry the cursor is on (inside or just after the word), or -1. */
export function sorryAt(code: string, pos: number): number {
  return sorryOffsets(code).findIndex((from) => pos >= from && pos <= from + "sorry".length);
}
