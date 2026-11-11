/** Concept ▸ How Lean checks (#/concept/kernel[/<section>]). Lean code: lean/Formalizer/Pages/Kernel.lean. */
import { Page, P } from "../kit";

export default function KernelConcept({ section }: { section: string | null }) {
  return (
    <Page id="kernel" title={["How Lean checks", "Lean 如何檢查"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
