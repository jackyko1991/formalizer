/**
 * The workspace frame: the columns of a problem page and the look they share (header strips, tabs, chips), kept apart
 * from what goes in them so the frame can move into learnkit and serve Tensorizer, Formalizer and Catalyzer alike.
 *
 *   <WorkspaceFrame library={…}>            the page: a foldable library on the left, then the workspace (or any page)
 *     <Workspace shape="full-height" …/>    library | problem | editor (+ one-line toolbar) | feedback tabs
 *     <Workspace shape="params" …/>         library | problem | [editor | parameters] over results, about 65 / 35
 *
 * "full-height" suits a proof or a molecule (the editor wants every line, the feedback a tall 3D map); "params" suits a
 * page whose inputs are many sliders and whose outputs are small (Tensorizer). Phones (below xl) show one part at a
 * time, picked by the page's own tabs: the problem, the work (editor, toolbar, parameters), the results.
 */
import type { CSSProperties, ReactNode } from "react";

/** a slim header strip over a panel, and its title */
export const PANEL_HEAD = "flex h-8 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 text-xs";
export const PANEL_TITLE = "font-semibold tracking-wide text-gray-500 uppercase";

/** a tab in a strip of tabs (results, map layers…): the picked one raised on white */
export const tabClass = (on: boolean) =>
  `flex shrink-0 items-center gap-1 rounded px-2 py-0.5 ${on ? "bg-white font-medium text-(--lk-accent) shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-800"}`;

export type Tone = "good" | "warn" | "bad" | "plain";
const TONE: Record<Tone, string> = {
  good: "border-green-200 bg-green-50 text-green-800",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  bad: "border-red-200 bg-red-50 text-red-800",
  plain: "border-gray-200 bg-gray-50 text-gray-700",
};
/** the verdict of the last run as a chip: "✓ Proved", "⚠ sorry left", "✗ Error" (TDD light, in Tensorizer's words) */
export function VerdictChip({ tone, children, title, testId }: { tone: Tone; children: ReactNode; title?: string; testId?: string }) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${TONE[tone]}`} title={title} data-testid={testId}>
      {children}
    </span>
  );
}

/** The page: the library column (it folds itself to a rail) and the main area beside it. */
export function WorkspaceFrame({ library, phoneLibrary, children, testId }: { library: ReactNode; phoneLibrary?: ReactNode; children: ReactNode; testId?: string }) {
  return (
    <div className="flex flex-col bg-white xl:h-full xl:min-h-0 xl:flex-row" data-testid={testId}>
      {phoneLibrary}
      {library}
      {children}
    </div>
  );
}

/** The library column: wide when open, a rail with its name written down the side when folded. */
export function LibraryColumn({
  open,
  onToggle,
  head,
  rail,
  foldLabel,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  /** the tabs over the list (shown when open) */
  head?: ReactNode;
  /** the rail's words when folded */
  rail: string;
  /** the fold / open button's title */
  foldLabel: string;
  children: ReactNode;
}) {
  return (
    <aside className={`hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] xl:flex ${open ? "w-64" : "w-10"}`} data-testid="library-column" data-open={open ? "" : undefined}>
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-gray-200 bg-gray-50 px-1.5">
        {open && head}
        <button onClick={onToggle} title={foldLabel} className="rounded px-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800">
          {open ? "«" : "»"}
        </button>
      </div>
      {open ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
      ) : (
        <button
          onClick={onToggle}
          className="flex-1 py-3 text-xs font-medium tracking-wide text-gray-500 [writing-mode:vertical-rl] hover:text-gray-800"
        >
          {rail}
        </button>
      )}
    </aside>
  );
}

export type PhonePart = "problem" | "work" | "results";

type Common = {
  /** the phone tab shown (wide screens show every part) */
  phone: PhonePart;
  /** the phones' tab bar (sticky, over the parts) */
  phoneBar?: ReactNode;
  /** the problem and its explanation */
  problem: ReactNode;
  /** the editor's own tab bar (its files) */
  editorTabs?: ReactNode;
  /** the editor; it is given the rest of its column's height */
  editor: ReactNode;
};

export type WorkspaceProps =
  | (Common & {
      shape: "full-height";
      /** one line of tools over the editor (run, the target, the tactics…) */
      toolbar?: ReactNode;
      /** strips that open under the toolbar on demand (an explanation, the reference proof…) */
      drawer?: ReactNode;
      /** the feedback column: tabs at full height */
      feedback: ReactNode;
    })
  | (Common & {
      shape: "params";
      /** the parameters column beside the editor */
      params: ReactNode;
      /** the results under the editor */
      results: ReactNode;
      /** the editor's share of the work column's height (default 0.65) */
      split?: number;
    });

/** The workspace beside the library, in one of its two shapes. */
export function Workspace(props: WorkspaceProps) {
  const show = (part: PhonePart, display = "xl:flex") => (props.phone === part ? "flex" : `hidden ${display}`);
  const problem = (
    <main
      className={`min-w-0 flex-col border-r border-gray-200 xl:min-h-0 ${props.shape === "full-height" ? "xl:w-[30%] xl:max-w-[30rem] xl:shrink-0" : "xl:flex-1"} ${show("problem")}`}
      data-testid="ws-problem"
    >
      {props.problem}
    </main>
  );
  if (props.shape === "params") {
    const split = props.split ?? 0.65;
    return (
      <>
        {props.phoneBar}
        {problem}
        <section className="flex min-w-0 flex-col xl:min-h-0 xl:w-[54%] xl:shrink-0" data-testid="ws-work" style={{ "--ws-split": split } as CSSProperties}>
          <div className={`min-w-0 flex-col overflow-hidden bg-white xl:min-h-0 xl:flex-row xl:[flex:var(--ws-split)_1_0] ${show("work")}`}>
            <div className="flex min-w-0 flex-1 flex-col">
              {props.editorTabs}
              {props.editor}
            </div>
            {props.params}
          </div>
          <div className={`min-w-0 flex-col border-t border-gray-200 xl:min-h-0 xl:[flex:calc(1-var(--ws-split))_1_0] xl:flex-row ${show("results")}`}>
            {props.results}
          </div>
        </section>
      </>
    );
  }
  return (
    <>
      {props.phoneBar}
      {problem}
      {/* the editor and the feedback share the rest, 3 : 2 */}
      <section className={`min-w-0 flex-col overflow-hidden border-r border-gray-200 bg-white xl:min-h-0 xl:flex-[3] ${show("work")}`} data-testid="ws-editor">
        {props.editorTabs}
        {props.toolbar}
        {props.drawer}
        {props.editor}
      </section>
      <section className={`min-w-0 flex-col bg-white xl:min-h-0 xl:flex-[2] ${show("results")}`} data-testid="ws-feedback">
        {props.feedback}
      </section>
    </>
  );
}
