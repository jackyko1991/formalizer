/** Coding Skills ▸ Structuring a proof (#/skills/structure[/<section>]). Lean code: lean/Formalizer/Pages/Structure.lean. */
import { Page, P } from "../kit";

export default function StructureSkill({ section }: { section: string | null }) {
  return (
    <Page id="structure" title={["Structuring a proof", "組織證明"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
