/**
 * Tactic completion at a `sorry`, in the editor (the pure part is tacticComplete.ts):
 *   - a "Tactic ▾" pill right after the target sorry: click it (or Ctrl+Space on a sorry) for the list;
 *   - typing where a tactic goes (in place of a sorry, at the start of a line…) opens the same list, filtered;
 *   - each row: the tactic (steps marked), what it does, a Mathlib badge; the side pane says more;
 *   - moving through the list previews the tactic in place of the sorry; Enter or a click puts it in and runs.
 * Tutorial mode lists only the unlocked tools, then a row saying how many wait.
 * On phones the list is a sheet at the bottom of the screen.
 */
import {
  autocompletion,
  closeCompletion,
  completionStatus,
  selectedCompletion,
  startCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { sorryAt } from "./sorryMarks";
import { AI_ROW, applyTactic, tacticPosition, type TacticItem } from "./tacticComplete";
import { sorryOffsets } from "./runner";

type L = readonly [string, string];

export interface TacticCompletionOptions {
  items: TacticItem[];
  /** tutorial mode: how many tools are still locked (a last, inert row says so) */
  locked: number;
  /** the reader's language: 0 English, 1 繁體中文 */
  lang: 0 | 1;
  /** a tactic chosen: the new file, the sorry it filled and the tactic */
  onPick: (code: string, hole: number, item: TacticItem) => void;
  /** the tactic under the list's cursor (null when the list closes): previewed in place of the sorry */
  onPreview: (tactic: string | null) => void;
  /** the last row, "AI": ask the reader's agent about the sorry on this line (absent: no AI row) */
  ai?: { connected: boolean; onAsk: (line: number) => void };
}

interface TacticCompletion extends Completion {
  item?: TacticItem;
  /** the AI row's subtitle and badge */
  ai?: { subtitle: string; pro: boolean };
}

const WORDS = {
  step: ["step", "一步"],
  try: ["try", "試試"],
  locked: (n: number): L => [`🔒 ${n} more ${n === 1 ? "tool" : "tools"} not unlocked yet`, `🔒 還有 ${n} 個工具尚未解鎖`],
} as const;

/** The completion source: on a sorry (asked for), or a word typed where a tactic goes. */
function source(opts: TacticCompletionOptions) {
  return (ctx: CompletionContext): CompletionResult | null => {
    const doc = ctx.state.doc.toString();
    const hole = sorryAt(doc, ctx.pos);
    let from: number;
    let to: number;
    if (hole >= 0 && ctx.explicit) {
      from = sorryOffsets(doc)[hole];
      to = from + "sorry".length;
    } else {
      const word = ctx.matchBefore(/[A-Za-z_?!][\w.?!']*$/);
      if (!word && !ctx.explicit) return null;
      from = word ? word.from : ctx.pos;
      to = ctx.pos;
      const line = ctx.state.doc.lineAt(from);
      if (!tacticPosition(doc.slice(line.from, from))) return null;
      if (!ctx.explicit && (!word || word.text === "sorry")) return null;
    }
    const pick = (l: L | undefined) => (l ? l[opts.lang] : "");
    const options: TacticCompletion[] = opts.items.map((item, i) => ({
      label: item.label,
      item,
      boost: 99 - i,
      detail: pick(item.step ? WORDS.step : WORDS.try),
      info: () => {
        const el = document.createElement("div");
        el.className = "cm-tactic-info";
        const parts: [string, string][] = [
          ["cm-tactic-code", item.tactic],
          ["", strip(pick(item.long ?? item.meaning))],
          ["cm-tactic-origin", strip(pick(item.origin))],
        ];
        for (const [cls, text] of parts) {
          if (!text) continue;
          const p = document.createElement(cls === "cm-tactic-code" ? "pre" : "p");
          p.className = cls;
          p.textContent = text;
          el.appendChild(p);
        }
        return el;
      },
      apply: (view, _c, f, t) => {
        const next = applyTactic(view.state.doc.toString(), f, t, item);
        opts.onPreview(null);
        opts.onPick(next.code, next.hole, item);
      },
    }));
    if (opts.locked > 0)
      options.push({ label: pick(WORDS.locked(opts.locked)), boost: -98, type: "locked", apply: () => {} });
    if (opts.ai) {
      const { connected, onAsk } = opts.ai;
      options.push({
        label: `✨ ${pick(connected ? AI_ROW.connected : AI_ROW.label)}`,
        boost: -99,
        type: "ai",
        ai: { subtitle: pick(connected ? AI_ROW.connectedSubtitle : AI_ROW.subtitle), pro: !connected },
        apply: (view, _c, f) => {
          opts.onPreview(null);
          onAsk(view.state.doc.lineAt(f).number);
        },
      });
    }
    // what was typed filters the list; on a sorry (asked for) everything is shown
    return { from, to, options, filter: !(hole >= 0 && ctx.explicit) };
  };
}

/** the words of a meaning without the Markdown backticks */
const strip = (s: string) => s.replace(/`/g, "");

/** Open the list on the target sorry (the pill and Ctrl+Space). */
export function openTactics(view: EditorView, at?: number) {
  if (at !== undefined) view.dispatch({ selection: { anchor: at } });
  view.focus();
  startCompletion(view);
}

export function tacticCompletion(opts: TacticCompletionOptions): Extension {
  const pick = (l: L | undefined) => (l ? l[opts.lang] : "");
  return [
    autocompletion({
      override: [source(opts)],
      icons: false,
      activateOnTyping: true,
      tooltipClass: () => "cm-tactic-list",
      optionClass: (c) =>
        (c as TacticCompletion).item?.step ? "cm-tactic-step" : c.type === "locked" ? "cm-tactic-locked" : c.type === "ai" ? "cm-tactic-ai" : "",
      addToOptions: [
        {
          // the meaning under the tactic, and the Mathlib badge
          render: (c) => {
            const item = (c as TacticCompletion).item;
            const ai = (c as TacticCompletion).ai;
            const el = document.createElement("span");
            el.className = "cm-tactic-meaning";
            if (ai) {
              if (ai.pro) {
                const b = document.createElement("span");
                b.className = "cm-tactic-mathlib";
                b.textContent = "Pro";
                el.appendChild(b);
              }
              el.appendChild(document.createTextNode(ai.subtitle));
              return el;
            }
            if (!item) return el;
            if (item.mathlib) {
              const b = document.createElement("span");
              b.className = "cm-tactic-mathlib";
              b.textContent = "Mathlib";
              el.appendChild(b);
            }
            el.appendChild(document.createTextNode(strip(pick(item.meaning))));
            return el;
          },
          position: 90,
        },
      ],
    }),
    // the tactic under the list's cursor is previewed in place of the sorry
    EditorView.updateListener.of((u) => {
      const open = completionStatus(u.state) === "active";
      const sel = open ? (selectedCompletion(u.state) as TacticCompletion | null) : null;
      const was = completionStatus(u.startState) === "active" ? (selectedCompletion(u.startState) as TacticCompletion | null) : null;
      if (sel?.item?.tactic !== was?.item?.tactic) opts.onPreview(sel?.item?.tactic ?? null);
    }),
    keymap.of([{ key: "Escape", run: (v) => (opts.onPreview(null), closeCompletion(v)) }]),
    EditorView.theme({
      ".cm-tooltip.cm-tactic-list": {
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        fontFamily: 'ui-sans-serif, system-ui, "Noto Sans TC", "Noto Sans", sans-serif',
        overflow: "hidden",
      },
      ".cm-tactic-list > ul": { maxHeight: "18rem !important", minWidth: "17rem", maxWidth: "26rem" },
      ".cm-tactic-list > ul > li": {
        display: "grid !important",
        gridTemplateColumns: "1fr auto",
        gap: "0 0.5rem",
        padding: "4px 10px !important",
        lineHeight: "1.35",
        borderBottom: "1px solid #f3f4f6",
      },
      ".cm-tactic-list > ul > li[aria-selected]": { background: "#f0fdfa !important", color: "#111827 !important" },
      ".cm-tactic-list .cm-completionLabel": { fontFamily: "ui-monospace, monospace", fontSize: "12px", color: "#1f2937" },
      ".cm-tactic-list .cm-completionDetail": {
        fontStyle: "normal",
        fontSize: "10px",
        borderRadius: "4px",
        padding: "0 4px",
        alignSelf: "center",
        background: "#f0fdfa",
        color: "#0f766e",
      },
      ".cm-tactic-list li.cm-tactic-step .cm-completionDetail": { background: "#f0f9ff", color: "#0369a1" },
      ".cm-tactic-list .cm-tactic-meaning": { gridColumn: "1 / -1", fontFamily: "inherit", fontSize: "11px", color: "#6b7280", whiteSpace: "normal" },
      ".cm-tactic-list .cm-tactic-mathlib": {
        fontSize: "10px",
        background: "#fffbeb",
        color: "#92400e",
        borderRadius: "4px",
        padding: "0 4px",
        marginRight: "6px",
      },
      ".cm-tactic-list li.cm-tactic-ai .cm-completionLabel": { fontFamily: "inherit", color: "#6d28d9", fontSize: "12px" },
      ".cm-tactic-list li.cm-tactic-locked": { color: "#9ca3af", fontSize: "11px", cursor: "default" },
      ".cm-tactic-list li.cm-tactic-locked .cm-completionLabel": { fontFamily: "inherit", color: "#9ca3af", fontSize: "11px" },
      ".cm-tooltip.cm-completionInfo": {
        fontFamily: 'ui-sans-serif, system-ui, "Noto Sans TC", "Noto Sans", sans-serif',
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "#f9fafb",
        padding: "8px 10px",
        maxWidth: "22rem",
        fontSize: "12px",
        lineHeight: "1.5",
        color: "#374151",
      },
      ".cm-tactic-info p": { margin: "4px 0 0" },
      ".cm-tactic-info .cm-tactic-code": { margin: 0, fontFamily: "ui-monospace, monospace", fontSize: "12px", color: "#111827", whiteSpace: "pre-wrap" },
      ".cm-tactic-info .cm-tactic-origin": { color: "#6b7280", fontSize: "11px" },
      // the pill after the target sorry
      ".cm-tactic-pill": {
        display: "inline-flex",
        alignItems: "center",
        marginLeft: "6px",
        padding: "0 7px",
        height: "18px",
        borderRadius: "9999px",
        border: "1px solid #5eead4",
        background: "#f0fdfa",
        color: "#0f766e",
        fontFamily: "inherit",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
        verticalAlign: "1px",
      },
      ".cm-tactic-pill:hover": { background: "#ccfbf1" },
      // phones: the list is a sheet at the bottom of the screen, the side pane under it
      "@media (max-width: 1279px)": {
        ".cm-tooltip.cm-tactic-list": {
          position: "fixed !important",
          left: "0 !important",
          right: "0 !important",
          top: "auto !important",
          bottom: "0 !important",
          borderRadius: "12px 12px 0 0",
          zIndex: "80",
        },
        ".cm-tactic-list > ul": { maxWidth: "none", maxHeight: "50vh !important" },
        ".cm-tooltip.cm-completionInfo": { display: "none" },
      },
    }),
  ];
}
