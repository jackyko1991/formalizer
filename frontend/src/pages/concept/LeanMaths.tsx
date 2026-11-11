/** Concept ▸ Lean maths (#/concept/maths[/<section>]). Lean code: lean/Formalizer/Pages/LeanMaths.lean. */
import { Page, P } from "../kit";

export default function LeanMathsConcept({ section }: { section: string | null }) {
  return (
    <Page id="maths" title={["Lean maths", "Lean 數學"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
