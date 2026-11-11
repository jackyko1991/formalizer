/** Coding Skills ▸ First tactics (#/skills/tactics[/<section>]). Lean code: lean/Formalizer/Pages/Tactics.lean. */
import { Page, P } from "../kit";

export default function TacticsSkill({ section }: { section: string | null }) {
  return (
    <Page id="tactics" title={["First tactics", "第一批戰術"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
