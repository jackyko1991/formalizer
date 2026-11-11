/**
 * Further reading ▸ Books (#/reading/books[/<group>]), in Tensorizer's way: books in groups, top picks (★) first, each
 * card with title, authors, publisher and year, a one-line reason, a free official edition when there is one, and the
 * page of this site it goes with. Data: src/reading.ts.
 */
import { go, PageToc, RichText, useLang } from "@learnkit/web";
import { useEffect } from "react";
import { BOOK_GROUPS, BOOKS, type Book } from "../../reading";
import { SCROLL } from "../kit";

export default function BooksReading({ section }: { section: string | null }) {
  const { pick } = useLang();
  useEffect(() => {
    const el = section && document.getElementById(`reading-${section}`);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
    else document.getElementById(SCROLL)?.scrollTo({ top: 0 });
  }, [section]);
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-5 pt-6 pb-10" data-testid="page-books">
      <PageToc
        scrollRoot={SCROLL}
        title={pick(["On this page", "本頁內容"])}
        className="top-20"
        items={BOOK_GROUPS.map((g, i) => ({ id: `reading-${g.id}`, mark: i + 1, label: pick(g.title) }))}
      />
      <article className="min-w-0 max-w-4xl flex-1 space-y-10">
        <header>
          <p className="text-sm font-medium text-(--lk-accent)">{pick(["Further reading", "延伸閱讀"])}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{pick(["Books", "書籍"])}</h1>
          <p className="mt-3 text-gray-600">
            <RichText
              text={pick([
                "Where to go after Formalizer: free online books to keep learning Lean, then printed books on proofs, types, and the story of machine-checked mathematics. Top picks are marked ★.",
                "離開 Formalizer 之後可以去哪裡：先是繼續學 Lean 的免費線上書，接著是關於證明、型別，以及機器檢查數學這段故事的紙本書。首選以 ★ 標示。",
              ])}
            />
          </p>
        </header>
        {BOOK_GROUPS.map((g, i) => (
          <section key={g.id} id={`reading-${g.id}`} className="scroll-mt-20">
            <h2 className="flex flex-wrap items-baseline gap-3 text-lg font-semibold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--lk-accent) text-sm text-white">{i + 1}</span>
              {pick(g.title)}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {BOOKS.filter((b) => b.group === g.id)
                .sort((a, b) => Number(b.top) - Number(a.top))
                .map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
            </div>
          </section>
        ))}
        <p className="border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
          {pick([
            "Books chosen for this site; publishers and ISBNs were checked when this page was written. No paid links.",
            "這些書是為本站挑選的；出版社與 ISBN 在撰寫本頁時都已核對。沒有付費連結。",
          ])}
        </p>
      </article>
    </div>
  );
}

function BookCard({ book: b }: { book: Book }) {
  const { pick } = useLang();
  const online = b.publisher === "online";
  return (
    <div
      className={`flex flex-col rounded-xl border bg-white p-4 sm:p-5 ${b.top ? "border-amber-300" : "border-gray-200"}`}
      data-testid={`book-${b.id}`}
    >
      {b.top && (
        <span className="mb-2 self-start rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          ★ {pick(["Top pick", "首選"])}
        </span>
      )}
      <h3 className="leading-snug font-semibold text-gray-900" lang="en">
        {b.title}
        {b.edition && <span className="font-normal text-gray-600"> ({b.edition})</span>}
      </h3>
      <p className="mt-1 text-sm text-gray-600" lang="en">
        {b.authors}
      </p>
      <p className="text-xs text-gray-500" lang={online ? undefined : "en"}>
        {online ? pick(["Free online book", "免費線上書"]) : `${b.publisher}, ${b.year}`}
        {b.isbn13 && <span className="ml-2 text-gray-400">ISBN {b.isbn13}</span>}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-700">
        <RichText text={pick(b.why)} />
      </p>
      {b.free && (
        <div className="mt-4 text-sm">
          <a href={b.free} target="_blank" rel="noopener noreferrer" className="font-medium text-(--lk-accent) hover:underline">
            {online ? pick(["Read it online", "線上閱讀"]) : pick(["Free companion online", "免費線上姊妹篇"])} ↗
          </a>
        </div>
      )}
      <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
        {pick(["On this site:", "本站相關："])}{" "}
        <button onClick={() => go(...b.site.to)} className="font-medium text-(--lk-accent) hover:underline">
          {pick(b.site.label)}
        </button>
      </p>
    </div>
  );
}
