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
      defaultTab: "history",
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
  const history = concept && (route.tab ?? "history") === "history";
  const conceptTabs = CONCEPT_TABS.map((id) => ({ id, label: t(`tab.${id}`) }));
  const skillsTabs = SKILLS_TABS.map((id) => ({ id, label: t(`skills.${id}`) }));
  const skills = route.page === "skills";
  const skillsTab = SKILLS_TABS.includes(route.tab as never) ? route.tab! : "tactics";
  const ConceptView = concept && !history ? CONCEPT_PAGES[route.tab ?? ""] : undefined;
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
          home: () => go("concept", "history"),
        }}
        pages={pages}
        route={route}
        scrollId={SCROLL}
        actions={<RunnerButton />}
        footer={
          <>
            <span>{t("footer.licence")}</span>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-gray-900">
              GitHub
            </a>
          </>
        }
      >
        {concept && <SubTabs page="concept" tabs={conceptTabs} active={route.tab ?? "history"} />}
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
