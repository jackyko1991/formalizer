import { LangProvider } from "@learnkit/web";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/source-code-pro/400.css";
import App from "./App";
import "./index.css";
import { LANGS, STRINGS } from "./strings";

// The Traditional Chinese text font loads only when that language is chosen.
const FONTS = {
  "zh-Hant": () => [
    import("@fontsource/noto-sans-tc/400.css"),
    import("@fontsource/noto-sans-tc/500.css"),
    import("@fontsource/noto-sans-tc/600.css"),
    import("@fontsource/noto-sans-tc/700.css"),
  ],
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider langs={LANGS} strings={STRINGS} storageKey="formalizer.lang" fonts={FONTS}>
      <App />
    </LangProvider>
  </StrictMode>,
);
