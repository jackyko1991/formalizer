/**
 * The holes in a proof, made visible in the editor: every `sorry` in amber, the one the tactics will fill (the
 * "target", picked by clicking it) on an amber ground, and the tactic under the list's cursor shown in its place, so
 * you see the replacement before you choose it. With tactic hints off, a faint "Ctrl+Space" after the target.
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

/** The "Tactic ▾" pill after the target sorry: it opens the tactic list (tacticCompletion.ts). */
class Pill extends WidgetType {
  constructor(
    readonly label: string,
    readonly at: number,
    readonly onOpen: (view: EditorView, at: number) => void,
    readonly ghost = false,
  ) {
    super();
  }
  eq(other: Pill) {
    return other.label === this.label && other.at === this.at && other.ghost === this.ghost;
  }
  toDOM(view: EditorView) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = this.ghost ? "cm-tactic-ghost" : "cm-tactic-pill";
    el.textContent = this.label;
    el.setAttribute("data-testid", "tactic-pill");
    el.onmousedown = (e) => e.preventDefault();
    el.onclick = (e) => (e.preventDefault(), this.onOpen(view, this.at));
    return el;
  }
  ignoreEvent() {
    return true;
  }
}

export interface PillOptions {
  label: string;
  /** open the list on the sorry that ends at `at` */
  onOpen: (view: EditorView, at: number) => void;
  /** a faint hint ("Ctrl+Space") rather than a pill: tactic hints are off */
  ghost?: boolean;
}

function build(view: EditorView, target: number, preview: string | null, pill?: PillOptions): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const all = sorryOffsets(view.state.doc.toString());
  const aim = target < all.length ? target : 0;
  all.forEach((from, i) => {
    const to = from + "sorry".length;
    if (i === aim && preview) builder.add(from, to, Decoration.replace({ widget: new Preview(preview) }));
    else
      builder.add(
        from,
        to,
        Decoration.mark({
          class: i === aim ? "cm-sorry cm-sorry-target" : "cm-sorry",
          attributes: { title: i === aim ? "the tactics fill this sorry" : "click to fill this sorry next" },
        }),
      );
    if (i === aim && pill && !preview) builder.add(to, to, Decoration.widget({ widget: new Pill(pill.label, to, pill.onOpen, pill.ghost), side: 1 }));
  });
  return builder.finish();
}

/** Editor extension: highlight every sorry; `target` is the index of the one to fill; `preview` the hovered tactic. */
export function sorryMarks(target: number, preview: string | null, pill?: PillOptions) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = build(view, target, preview, pill);
      }
      update(u: ViewUpdate) {
        if (u.docChanged) this.decorations = build(u.view, target, preview, pill);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/** Which sorry the cursor is on (inside or just after the word), or -1. */
export function sorryAt(code: string, pos: number): number {
  return sorryOffsets(code).findIndex((from) => pos >= from && pos <= from + "sorry".length);
}
