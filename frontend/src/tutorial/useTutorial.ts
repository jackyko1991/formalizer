/**
 * The tutorial progress (progress.ts) shared by every component on the page and kept in localStorage. Storage may be
 * blocked (private windows): then the progress lasts for this visit only, and the page works the same.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { parseProgress, serializeProgress, TUTORIAL_KEY, type TutorialProgress } from "./progress";

let current: TutorialProgress | null = null;
const listeners = new Set<() => void>();

function load(): TutorialProgress {
  if (current) return current;
  let text: string | null = null;
  try {
    text = localStorage.getItem(TUTORIAL_KEY);
  } catch {
    /* storage blocked */
  }
  current = parseProgress(text);
  return current;
}

/** Change the progress (pure update); saved and announced to every user of the hook. */
export function updateTutorial(change: (p: TutorialProgress) => TutorialProgress): void {
  const before = load();
  const next = change(before);
  if (next === before) return;
  current = next;
  try {
    localStorage.setItem(TUTORIAL_KEY, serializeProgress(next));
  } catch {
    /* storage blocked: remembered for this visit */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));

export function useTutorial(): TutorialProgress {
  return useSyncExternalStore(subscribe, load, load);
}

/** prefers-reduced-motion, live. */
export function useReducedMotion(): boolean {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduce, setReduce] = useState(() => typeof matchMedia === "function" && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const m = matchMedia(query);
    const on = () => setReduce(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduce;
}
