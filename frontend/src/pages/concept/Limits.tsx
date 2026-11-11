/** Concept ▸ Limits of proofs (#/concept/limits[/<section>]). Lean code: lean/Formalizer/Pages/Limits.lean. */
import { Page, P } from "../kit";

export default function LimitsConcept({ section }: { section: string | null }) {
  return (
    <Page id="limits" title={["Limits of proofs", "證明的限度"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
