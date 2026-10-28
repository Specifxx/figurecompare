import Link from "next/link";
import { LINE_BY_KEY, type LineKey } from "@/site";
import { figuresOfLine, storeCount } from "@/lib/data";
import { TileGrid } from "./FigureTile";
import { PageHead } from "./Section";

export const PER_PAGE = 48;

/** A line's figures, most-stocked first (ties by name), 48 a page. */
export function lineFigures(line: LineKey) {
  return figuresOfLine(line).sort((a, b) => storeCount(b) - storeCount(a) || a.name.localeCompare(b.name));
}

export function pageCount(line: LineKey) {
  return Math.max(1, Math.ceil(lineFigures(line).length / PER_PAGE));
}

export function LineHub({ line, page }: { line: LineKey; page: number }) {
  const l = LINE_BY_KEY[line];
  const all = lineFigures(line);
  const pages = pageCount(line);
  const list = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (p: number) => (p === 1 ? `/${line}` : `/${line}/page/${p}`);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        emoji={l.emoji}
        title={`${l.name} prices${page > 1 ? ` (page ${page})` : ""}`}
        sub={
          <p>
            {l.about} {all.length.toLocaleString("en-US")} {l.name} figures compared across stores, matched by barcode. Prices show for your region; change it at the top.
          </p>
        }
      />
      {list.length ? <TileGrid figures={list} /> : <p className="sticker p-6 text-center text-soft">No {l.name} figures in stock anywhere yet (；ω；)</p>}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              prefetch={false}
              key={p}
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center rounded-full border-2 px-3 font-display font-semibold ${p === page ? "border-ink bg-pink text-white shadow-popsm" : "border-line bg-card hover:border-pink"}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
