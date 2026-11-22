import { useEffect, useState } from "react";

/** The value of a promise, or its error, once settled (`load` must be stable or memoised by `key`). */
export function useAsync<T>(load: () => Promise<T>, key: unknown): { data: T | null; error: string | null } {
  const [state, setState] = useState<{ key: unknown; data: T | null; error: string | null }>({ key, data: null, error: null });
  useEffect(() => {
    let alive = true;
    load().then(
      (data) => alive && setState({ key, data, error: null }),
      (e) => alive && setState({ key, data: null, error: String(e?.message ?? e) }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state : { data: null, error: null };
}

/** "3d" when WebGL works, motion is welcome and the screen is wide; "tree" otherwise. The reader can switch when WebGL works. */
export function useViewMode(): ["3d" | "tree", (m: "3d" | "tree") => void, boolean] {
  const [ok] = useState(() => hasWebGL());
  const [mode, setMode] = useState<"3d" | "tree">(() => (can3D() ? "3d" : "tree"));
  return [mode, setMode, ok];
}

/** WebGL, no reduced-motion preference and a screen wide enough: otherwise the page starts with its 2D views. */
export function can3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.innerWidth < 640) return false;
  return hasWebGL();
}

export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
