/** Coding Skills ▸ Verifying a proof (#/skills/verify[/<section>]). Lean code: lean/Formalizer/Pages/Verify.lean. */
import { Page, P } from "../kit";

export default function VerifySkill({ section }: { section: string | null }) {
  return (
    <Page id="verify" title={["Verifying a proof", "驗證證明"]} intro={["Being written.", "撰寫中。"]} sections={[]} focus={section}>
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
