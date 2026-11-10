/** UI strings: one row per key, [English, Traditional Chinese] (the order of LANGS). */
import type { Language, StringTable } from "@learnkit/web";

export const LANGS: Language[] = [
  { code: "en", name: "English" },
  { code: "zh-Hant", name: "繁體中文" },
];

export const STRINGS = {
  tagline: ["Formal mathematics in Lean 4, learned by doing", "用 Lean 4 學形式化數學：動手做"],
  "page.problems": ["Problems", "題庫"],
  "page.concept": ["Concept", "概念"],
  "page.skills": ["Coding Skills", "程式技巧"],
  "page.agents": ["AI agent", "AI 代理"],
  "page.reading": ["Further reading", "延伸閱讀"],
  "tab.history": ["History", "歷史"],
  "tab.skills": ["Skills", "Skills"],
  "tab.mcp": ["MCP", "MCP"],
  "history.title": ["How mathematics learned to be checked by machines", "數學如何學會讓機器檢查"],
  "history.intro": [
    "From Automath in 1967 to the Lean certificates of 2026: the ideas behind every Formalizer problem. A proof assistant does not make mathematics true; it makes every step checkable, by a small program anyone can trust.",
    "從 1967 年的 Automath 到 2026 年的 Lean 證書：每一道 Formalizer 題目背後的想法。證明輔助器不會讓數學變成真的；它讓每一步都能被一個人人可信的小程式檢查。",
  ],
  contents: ["On this page", "本頁內容"],
  sources: ["Sources", "資料來源"],
  "coming.title": ["Coming soon", "即將推出"],
  "coming.body": [
    "This part of Formalizer is being built: problems you check with Lean on your own computer, from a two-line hello world to the Navier–Stokes challenge. The History page is ready now.",
    "Formalizer 的這一部分正在建置：在你自己的電腦上用 Lean 檢查的題目，從兩行的 hello world 到 Navier–Stokes 挑戰。歷史頁已經可以閱讀。",
  ],
  "coming.history": ["Read the History", "閱讀歷史"],
  "footer.licence": ["Apache-2.0", "Apache-2.0"],
} satisfies StringTable;
