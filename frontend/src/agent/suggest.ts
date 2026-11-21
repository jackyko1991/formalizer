/**
 * Suggested questions for the agent panel, from what is on screen (at most four). Lean-specific: the goal, the
 * error, a hint rather than the answer (problems teach), and the blueprint (research). Pure, for node tests.
 */
import type { AgentContext } from "./bus";

export type Pair = readonly [string, string];
const MAX = 4;

export function suggestQuestions(c: AgentContext | null): Pair[] {
  if (!c) return [];
  const out: Pair[] = [];
  const add = (p: Pair) => out.length < MAX && !out.some((q) => q[0] === p[0]) && out.push(p);
  const error = c.errors?.find((e) => e.line > 0);
  if (c.target.startsWith("problem/")) {
    if (!c.verdict) {
      add(["What does this statement say, in plain words?", "這個陳述用白話說是什麼意思？"]);
      add(["Give me a hint for the first step, not the answer.", "給我第一步的提示，不要直接給答案。"]);
    }
    if (error) add([`Why does Lean reject line ${error.line} of ${error.file}?`, `為什麼 Lean 不接受 ${error.file} 第 ${error.line} 行？`]);
    if (c.verdict === "incomplete") {
      add(["Explain the open goal in words.", "用文字解釋目前還沒完成的目標。"]);
      add(["Which tactic fits this goal, and why?", "哪個戰術適合這個目標？為什麼？"]);
      add(["Give me a hint, not the answer.", "給我提示，不要直接給答案。"]);
    }
    if (c.verdict === "proved") {
      add(["Explain this proof step by step.", "一步一步解釋這個證明。"]);
      add(["Is there a shorter proof?", "有更短的證明嗎？"]);
    }
    add(["Give me a hint, not the answer.", "給我提示，不要直接給答案。"]);
    return out;
  }
  const f = c.focus;
  const statuses = Object.values(c.statuses ?? {});
  const open = statuses.some((s) => s === "sorry" || s === "depends" || s === "error");
  if (f && f.status === "error") add([`Why does Lean reject \`${f.name}\`?`, `為什麼 Lean 不接受 \`${f.name}\`？`]);
  if (f && f.status === "sorry") {
    if (f.note?.trim()) add([`Write \`${f.name}\` in Lean from my note.`, `照我的筆記，把 \`${f.name}\` 寫成 Lean。`]);
    add([`Give me a hint for \`${f.name}\`, not the proof.`, `給我 \`${f.name}\` 的提示，不要直接給證明。`]);
    add([`Split \`${f.name}\` into smaller lemmas.`, `把 \`${f.name}\` 拆成幾條較小的引理。`]);
  }
  if (open) add(["Which lemma should I work on next?", "接下來我該做哪一條引理？"]);
  if (statuses.length && !open && c.main) {
    add([`Explain the proof of \`${c.main}\` in words.`, `用文字解釋 \`${c.main}\` 的證明。`]);
    add([`Is there a shorter proof of \`${c.main}\`?`, `\`${c.main}\` 有更短的證明嗎？`]);
  }
  if (!statuses.length) add(["What does this project prove, in plain words?", "這個專案在證明什麼？用白話說明。"]);
  return out;
}
