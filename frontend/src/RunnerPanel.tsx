import { useLang } from "@learnkit/web";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { health, runnerUrl, type Health } from "./runner";

/** null = no runner answers; "checking" = first poll not back yet */
export type RunnerState = Health | null | "checking";

interface RunnerContextValue {
  runner: RunnerState;
  open: () => void;
}
const RunnerContext = createContext<RunnerContextValue>({
  runner: "checking",
  open: () => {},
});

export const useRunner = () => useContext(RunnerContext);
export const runnerReady = (r: RunnerState) => r !== "checking" && r?.state === "ready";

const START = "git clone https://github.com/jackyko1991/formalizer\ncd formalizer && pixi run lean-build && pixi run runner";

/** Polls the local runner (every 3 s until ready, then every 15 s) and owns the runner panel. */
export function RunnerProvider({ children }: { children: ReactNode }) {
  const [runner, setRunner] = useState<RunnerState>("checking");
  const [panel, setPanel] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const h = await health();
      if (!alive) return;
      setRunner(h);
      timer.current = setTimeout(poll, h?.state === "ready" ? 15000 : 3000);
    };
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <RunnerContext.Provider value={{ runner, open: () => setPanel(true) }}>
      {children}
      {panel && <RunnerPanel runner={runner} onClose={() => setPanel(false)} />}
    </RunnerContext.Provider>
  );
}

/** The header's top-right chip, like Tensorizer's Backend button: a status dot, the runner, a gear. */
export function RunnerButton() {
  const { t } = useLang();
  const { runner, open } = useRunner();
  const dot =
    runner === "checking"
      ? "bg-gray-300"
      : !runner || runner.state === "failed" || runner.state === "stopped"
        ? "bg-amber-400"
        : runner.state === "warming"
          ? "animate-pulse bg-yellow-300"
          : "bg-green-500";
  const label =
    runner === "checking"
      ? t("runner.checking")
      : runner
        ? `${runner.runner === "lite" ? t("runner.lite") : t("runner.full")} / ${t(`runner.state.${runner.state}`)}`
        : t("runner.short.offline");
  return (
    <button
      onClick={open}
      title={t("runner.button")}
      data-testid="runner-button"
      className="flex h-8 items-center gap-2 rounded-md border border-white/30 bg-white/10 px-2.5 text-xs text-white hover:bg-white/20"
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="hidden sm:inline">{label}</span>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.34 1.8A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.8l.28 1.4c.5.17.97.4 1.4.68l1.33-.53a1 1 0 0 1 1.21.42l.68 1.18a1 1 0 0 1-.23 1.26l-1.1.9a5.6 5.6 0 0 1 0 1.78l1.1.9a1 1 0 0 1 .23 1.26l-.68 1.18a1 1 0 0 1-1.21.42l-1.33-.53c-.43.28-.9.51-1.4.68l-.28 1.4a1 1 0 0 1-.98.8H9.32a1 1 0 0 1-.98-.8l-.28-1.4a5.6 5.6 0 0 1-1.4-.68l-1.33.53a1 1 0 0 1-1.21-.42l-.68-1.18a1 1 0 0 1 .23-1.26l1.1-.9a5.6 5.6 0 0 1 0-1.78l-1.1-.9a1 1 0 0 1-.23-1.26l.68-1.18a1 1 0 0 1 1.21-.42l1.33.53c.43-.28.9-.51 1.4-.68l.28-1.4ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function RunnerPanel({ runner, onClose }: { runner: RunnerState; onClose: () => void }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  const online = runner !== "checking" && runner !== null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t("runner.button")}
        data-testid="runner-panel"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("runner.button")}</h2>
            <p className="mt-1 text-sm text-gray-600">{t("runner.about")}</p>
          </div>
          <button onClick={onClose} aria-label={t("runner.close")} className="ml-auto rounded-md p-1 text-gray-500 hover:bg-gray-100">
            ✕
          </button>
        </div>
        {online ? (
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm" data-testid="runner-status">
            <dt className="text-gray-500">{t("runner.status")}</dt>
            <dd className="text-gray-900">{t(`runner.state.${runner.state}`)}</dd>
            <dt className="text-gray-500">{t("runner.kind")}</dt>
            <dd className="text-gray-900">{runner.runner === "lite" ? t("runner.lite") : t("runner.full")}</dd>
            <dt className="text-gray-500">Lean</dt>
            <dd className="font-mono text-gray-900">{runner.lean}</dd>
            <dt className="text-gray-500">{t("runner.address")}</dt>
            <dd className="font-mono text-gray-900">{runnerUrl()}</dd>
            {runner.error && (
              <>
                <dt className="text-gray-500">{t("error.title")}</dt>
                <dd className="font-mono text-xs text-red-700">{runner.error}</dd>
              </>
            )}
          </dl>
        ) : (
          <div
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            data-testid="runner-offline"
          >
            <p className="font-medium">{runner === "checking" ? t("runner.checking") : t("runner.offline")}</p>
            <p className="mt-1">{t("runner.start")}</p>
            <div className="relative mt-2">
              <pre className="overflow-x-auto rounded bg-gray-900 px-3 py-2 pr-16 font-mono text-xs text-gray-100">{START}</pre>
              <button
                onClick={() => void navigator.clipboard.writeText(START).then(() => setCopied(true))}
                className="absolute top-1.5 right-1.5 rounded bg-white/10 px-2 py-0.5 text-[11px] text-gray-100 hover:bg-white/20"
              >
                {copied ? t("runner.copied") : t("runner.copy")}
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-800">{t("runner.where").replace("{url}", runnerUrl())}</p>
          </div>
        )}
      </div>
    </div>
  );
}
