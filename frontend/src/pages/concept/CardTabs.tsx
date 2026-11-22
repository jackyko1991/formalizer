import { useLang } from "@learnkit/web";
import { useState, type ReactNode } from "react";
import type { L } from "../kit";

export type CardTab = { id: string; label: L; body: ReactNode };

/** One card with a tab row on top; only the open tab's body is rendered (so lazy maps load only when opened). */
export function CardTabs({ tabs, testid }: { tabs: CardTab[]; testid?: string }) {
  const { pick } = useLang();
  const [open, setOpen] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === open) ?? tabs[0];
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white" data-testid={testid}>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === current.id}
            onClick={() => setOpen(t.id)}
            className={`-mb-px rounded-t-md border px-3 py-1.5 text-sm ${
              t.id === current.id
                ? "border-gray-200 border-b-white bg-white font-medium text-(--lk-accent)"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {pick(t.label)}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="space-y-4 p-4">
        {current.body}
      </div>
    </div>
  );
}
