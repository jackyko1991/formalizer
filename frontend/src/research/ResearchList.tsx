/**
 * The Problems page's left column, Research tab: your research projects, the finished demos (showcases) and ways to
 * start one. Picking one opens it in the main area (#/problems/research/<project>); the full research home, with
 * import, rename, fork and delete, is one click away.
 */
import { RichText, useLang } from "@learnkit/web";
import { FREE_PROJECTS } from "./store";
import { ago, EMPTY_TEMPLATE, openProject, useProjects } from "./projects";
import { SHOWCASES, TEMPLATES } from "./templates";

const HEAD = "px-1 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase";
const ROW = "flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm";

/** `selected`: the open project, null on the research home, undefined when the main area shows a problem */
export default function ResearchList({ selected }: { selected?: string | null }) {
  const { pick } = useLang();
  const { projects, ready, full, limitNote, error, start } = useProjects({ withProgress: true });
  const on = (id: string) => (selected === id ? "bg-teal-50 text-gray-900 ring-1 ring-teal-200" : "text-gray-700 hover:bg-gray-100");
  return (
    <div className="space-y-1" data-testid="research-list">
      <p className="px-1 text-xs leading-snug text-gray-500">
        {pick([
          "A long proof, split into lemmas. Lean colours each lemma in the blueprint (the map of what uses what) as it is proved.",
          "把長證明拆成一條條引理。Lean 會在藍圖（誰用到誰的地圖）上替每條引理上色，證好了就變綠。",
        ])}
      </p>
      <button
        onClick={() => openProject()}
        className={`${ROW} ${selected === null ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-gray-100"} font-medium text-(--lk-accent)`}
        data-testid="research-home-link"
      >
        ⌂ {pick(["Research home", "研究首頁"])}
      </button>

      <p className={HEAD}>
        {pick(["Your projects", "你的專案"])}{" "}
        <span className="font-normal normal-case">
          · {pick([`free tier: ${FREE_PROJECTS}`, `免費版：${FREE_PROJECTS} 個`])}
        </span>
      </p>
      {projects === null ? (
        <p className="px-2 text-xs text-gray-400">{pick(["Loading…", "載入中……"])}</p>
      ) : projects.length === 0 ? (
        <p className="px-2 text-xs text-gray-500">{pick(["None yet: start one below.", "還沒有：從下面開始一個。"])}</p>
      ) : (
        projects.map((p) => (
          <button key={`${p.where}-${p.id}`} onClick={() => openProject(p.id)} className={`${ROW} ${on(p.id)}`} data-testid="research-list-project">
            <span className="truncate font-medium">{p.title}</span>
            <span className="truncate text-[11px] text-gray-500">
              {p.progress && `✓ ${p.progress.proved}/${p.progress.total} · `}
              {p.where === "disk" ? "⌂ ~/Formalizer" : pick(["this browser", "這個瀏覽器"])} · {ago(p.updated, pick)}
            </span>
          </button>
        ))
      )}
      {!ready && (
        <p className="mx-1 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900">
          {pick([
            "The runner isn't running: projects in ~/Formalizer show up once it starts.",
            "執行器沒有在跑：等它啟動後，~/Formalizer 裡的專案才會出現。",
          ])}
        </p>
      )}

      <p className={HEAD}>{pick(["Start a project", "開始一個專案"])}</p>
      {full && <p className="px-2 text-[11px] leading-snug text-gray-500">{limitNote}</p>}
      {[EMPTY_TEMPLATE(), ...TEMPLATES.filter((t) => t.id !== "empty")].map((t) => (
        <button
          key={t.id}
          onClick={() => void start(t)}
          disabled={full}
          title={full ? limitNote : undefined}
          className={`${ROW} text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent`}
          data-testid={`research-list-start-${t.id}`}
        >
          <span className="truncate">
            {t.id === "empty" ? "＋ " : "◐ "}
            {pick(t.title)}
          </span>
        </button>
      ))}
      {error && <p className="px-2 text-xs text-red-700">{error}</p>}

      <p className={HEAD}>{pick(["Showcase: finished demos", "範例展示：完成的範例"])}</p>
      {SHOWCASES().map((t) => (
        <button
          key={t.id}
          onClick={() => openProject(`showcase-${t.id}`)}
          className={`${ROW} ${on(`showcase-${t.id}`)}`}
          data-testid={`research-list-showcase-${t.id}`}
        >
          <span className="truncate">✓ {pick(t.title)}</span>
          <span className="line-clamp-2 text-[11px] text-gray-500">
            <RichText text={pick(t.about)} />
          </span>
        </button>
      ))}
    </div>
  );
}
