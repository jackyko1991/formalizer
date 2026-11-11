import { go, RichText, Shell, Timeline, useLang, useRoute, type ShellPage } from "@learnkit/web";
import { ERAS, HISTORY } from "./history";
import ProblemPage from "./ProblemPage";
import { RunnerButton, RunnerProvider } from "./RunnerPanel";
import { PROBLEMS } from "./problems";
import { STRINGS } from "./strings";

const REPO_URL = "https://github.com/jackyko1991/formalizer";
const SCROLL = "fz-scroll";

export default function App() {
  const { t } = useLang();
  const route = useRoute("concept");
  const pages: ShellPage[] = [
    { id: "problems", label: t("page.problems") },
    {
      id: "concept",
      label: t("page.concept"),
      tabs: [{ id: "history", label: t("tab.history") }],
    },
    { id: "skills", label: t("page.skills") },
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
  const history = route.page === "concept" && (route.tab ?? "history") === "history";

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
        {history ? <HistoryPage section={route.section} /> : route.page === "problems" ? <Problems id={route.tab} /> : <Coming />}
      </Shell>
    </RunnerProvider>
  );
}

function HistoryPage({ section }: { section: string | null }) {
  const { t } = useLang();
  return (
    <div data-testid="history-page">
      <header className="mx-auto max-w-6xl px-5 pt-8">
        <div className="lg:pl-64">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t("history.title")}</h1>
          <p className="mt-3 max-w-3xl text-gray-600">
            <RichText text={t("history.intro")} />
          </p>
        </div>
      </header>
      <Timeline
        eras={ERAS}
        cards={HISTORY}
        scrollRoot={SCROLL}
        focus={section}
        labels={{ contents: STRINGS.contents, sources: STRINGS.sources }}
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

function Problems({ id }: { id: string | null }) {
  const { t, pick } = useLang();
  const problem = PROBLEMS.find((p) => p.id === id);
  if (problem) return <ProblemPage problem={problem} />;
  return (
    <div className="mx-auto max-w-4xl px-5 py-8" data-testid="problems">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t("problems.title")}</h1>
      <p className="mt-3 text-gray-600">
        <RichText text={t("problems.intro")} />
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {PROBLEMS.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => go("problems", p.id)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-(--lk-accent)"
            >
              <p className="text-xs font-semibold text-(--lk-accent)">{p.level}</p>
              <p className="mt-1 font-semibold text-gray-900">
                <RichText text={pick(p.title)} />
              </p>
              <p className="mt-2 text-sm text-(--lk-accent)">{t("problems.open")} →</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
