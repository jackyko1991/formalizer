import { go, RichText, routeHash, Shell, SubTabs, Timeline, useLang, useRoute, type ShellPage } from "@learnkit/web";
import { ERAS, HISTORY } from "./history";
import ProblemsPage from "./ProblemPage";
import FeynmanConcept from "./pages/concept/Feynman";
import KernelConcept from "./pages/concept/Kernel";
import LeanMathsConcept from "./pages/concept/LeanMaths";
import LimitsConcept from "./pages/concept/Limits";
import MethodConcept from "./pages/concept/Method";
import ErrorsSkill from "./pages/skills/Errors";
import SearchSkill from "./pages/skills/Search";
import StructureSkill from "./pages/skills/Structure";
import TacticsSkill from "./pages/skills/Tactics";
import VerifySkill from "./pages/skills/Verify";
import { RunnerButton, RunnerProvider } from "./RunnerPanel";
import { STRINGS } from "./strings";

const REPO_URL = "https://github.com/jackyko1991/formalizer";
const SCROLL = "fz-scroll";
/** height of the Concept tab bar (SubTabs), kept free by the History page's sticky parts */
const TABS_PX = 52;
/** Concept's sub-pages (Tensorizer's order, History last); only History is built so far */
const CONCEPT_TABS = ["method", "feynman", "maths", "kernel", "limits", "history"] as const;
const SKILLS_TABS = ["tactics", "search", "structure", "errors", "verify"] as const;
type PageView = (props: { section: string | null }) => React.ReactNode;
const CONCEPT_PAGES: Record<string, PageView> = {
  method: MethodConcept,
  feynman: FeynmanConcept,
  maths: LeanMathsConcept,
  kernel: KernelConcept,
  limits: LimitsConcept,
};
const SKILLS_PAGES: Record<string, PageView> = {
  tactics: TacticsSkill,
  search: SearchSkill,
  structure: StructureSkill,
  errors: ErrorsSkill,
  verify: VerifySkill,
};

export default function App() {
  const { t } = useLang();
  const route = useRoute("concept");
  const pages: ShellPage[] = [
    { id: "problems", label: t("page.problems") },
    {
      id: "concept",
      label: t("page.concept"),
      // no menu under the header tab: the sub-pages are the tab row on the page (SubTabs)
      defaultTab: CONCEPT_TABS[0],
    },
    { id: "skills", label: t("page.skills"), defaultTab: "tactics" },
    {
      id: "agents",
      label: t("page.agents"),
      tabs: [
        { id: "skills", label: t("tab.skills") },
        { id: "mcp", label: t("tab.mcp") },
      ],
    },
    { id: "reading", label: t("page.reading") },
  ];
  const concept = route.page === "concept";
  const conceptTab = CONCEPT_TABS.includes(route.tab as never) ? route.tab! : CONCEPT_TABS[0];
  const history = concept && conceptTab === "history";
  const conceptTabs = CONCEPT_TABS.map((id) => ({ id, label: t(`tab.${id}`) }));
  const skillsTabs = SKILLS_TABS.map((id) => ({ id, label: t(`skills.${id}`) }));
  const skills = route.page === "skills";
  const skillsTab = SKILLS_TABS.includes(route.tab as never) ? route.tab! : "tactics";
  const ConceptView = concept && !history ? CONCEPT_PAGES[conceptTab] : undefined;
  const SkillsView = SKILLS_PAGES[skillsTab];

  return (
    <RunnerProvider>
      <Shell
        brand={{
          name: (
            <>
              Formal<span className="text-teal-200">izer</span>
            </>
          ),
          tagline: t("tagline"),
          logo: `${import.meta.env.BASE_URL}favicon.svg`,
          home: () => go("concept", CONCEPT_TABS[0]),
        }}
        pages={pages}
        route={route}
        scrollId={SCROLL}
        actions={<RunnerButton />}
        footer={
          <>
            <a
              href="https://buymeacoffee.com/jackyko1991"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-yellow-300 px-2.5 py-0.5 font-medium text-gray-900 hover:bg-yellow-400"
            >
              ☕ {t("coffee")}
            </a>
            <span>{t("footer.licence")}</span>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-gray-900">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </>
        }
      >
        {concept && <SubTabs page="concept" tabs={conceptTabs} active={conceptTab} />}
        {skills && <SubTabs page="skills" tabs={skillsTabs} active={skillsTab} />}
        {history ? (
          <HistoryPage section={route.section} />
        ) : ConceptView ? (
          <ConceptView key={route.tab} section={route.section} />
        ) : skills ? (
          <SkillsView key={skillsTab} section={route.section} />
        ) : route.page === "problems" ? (
          <ProblemsPage id={route.tab} />
        ) : (
          <Coming />
        )}
      </Shell>
    </RunnerProvider>
  );
}

function HistoryPage({ section }: { section: string | null }) {
  const { t } = useLang();
  return (
    <div data-testid="history-page">
      <Timeline
        eras={ERAS}
        cards={HISTORY}
        scrollRoot={SCROLL}
        stickyOffset={TABS_PX}
        focus={section}
        labels={{ contents: STRINGS.timeline, sources: STRINGS.sources, open: STRINGS["timeline.open"] }}
        // keep the address shareable without a new history entry (no hashchange, so no re-render)
        onPick={(id) => history.replaceState(null, "", routeHash("concept", "history", id))}
        header={
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t("history.title")}</h1>
            <p className="mt-3 text-gray-600">
              <RichText text={t("history.intro")} />
            </p>
          </>
        }
      />
    </div>
  );
}

function Coming() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center" data-testid="coming">
      <h1 className="text-2xl font-semibold text-gray-900">{t("coming.title")}</h1>
      <p className="mt-3 text-gray-600">{t("coming.body")}</p>
      <button
        onClick={() => go("concept", "history")}
        className="mt-6 rounded-md bg-(--lk-accent) px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {t("coming.history")} →
      </button>
    </div>
  );
}
