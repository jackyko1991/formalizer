/** Coding Skills ▸ Finding lemmas (#/skills/search[/<section>]). Lean code: lean/Formalizer/Pages/Search.lean. */
import { Page, P } from "../kit";

export default function SearchSkill({ section }: { section: string | null }) {
  return (
    <Page id="search" title={["Finding lemmas", "尋找引理"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
