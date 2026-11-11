/** Concept ▸ From statement to proof (#/concept/method[/<section>]). Lean code: lean/Formalizer/Pages/Method.lean. */
import { Page, P } from "../kit";

export default function MethodConcept({ section }: { section: string | null }) {
  return (
    <Page
      id="method"
      title={["From statement to proof", "從陳述到證明"]}
      intro={["Being written.", "撰寫中。"]}
      sections={[]}
      focus={section}
    >
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
