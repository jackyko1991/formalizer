import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
// learnkit (private) is a git submodule at vendor/learnkit
const LEARNKIT = path.resolve(here, "../vendor/learnkit/web/src");

export default defineConfig({
  base: "./", // GitHub Pages serves the site from /formalizer/
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@learnkit/web": LEARNKIT },
    // learnkit's files import react etc.; resolve them from this app's node_modules
    dedupe: ["react", "react-dom", "katex", "@uiw/react-codemirror", "@codemirror/view", "@codemirror/state"],
  },
  server: { fs: { allow: [here, LEARNKIT] } },
});
