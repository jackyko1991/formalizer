/** Concept ▸ The Feynman technique (#/concept/feynman[/<section>]). Lean code: lean/Formalizer/Pages/Feynman.lean. */
import { Page, P } from "../kit";

export default function FeynmanConcept({ section }: { section: string | null }) {
  return (
    <Page id="feynman" title={["The Feynman technique", "費曼學習法"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
