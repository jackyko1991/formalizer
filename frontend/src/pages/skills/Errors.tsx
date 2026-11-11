/** Coding Skills ▸ Reading goals and errors (#/skills/errors[/<section>]). Lean code: lean/Formalizer/Pages/Errors.lean. */
import { Page, P } from "../kit";

export default function ErrorsSkill({ section }: { section: string | null }) {
  return (
    <Page
      id="errors"
      title={["Reading goals and errors", "讀懂目標與錯誤"]}
      intro={["Being written.", "撰寫中。"]}
      sections={[]}
      focus={section}
    >
      <P t={["This page is being written.", "這一頁正在撰寫中。"]} />
    </Page>
  );
}
