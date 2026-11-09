import Link from "next/link";
import { LINE_BY_KEY, type LineKey } from "@/site";
import { figuresOfLine, storeCount } from "@/lib/data";
import { TileGrid } from "./FigureTile";
import { PageHead } from "./Section";
import { EbayStrip, lineQueries } from "./EbayStrip";
import { Crumbs } from "@/lib/seo";
import { liveCharacters, figuresOfCharacter } from "@/lib/characters";
import { liveSeries, figuresOfSeries } from "@/lib/series";

/** The live series or characters with the most figures in this line (at least 3 there), for the hub's "by series" rows. */
function inLine<T extends { slug: string; name: string }>(list: T[], figuresOf: (slug: string) => { line: LineKey }[], line: LineKey, max = 14) {
  return list
    .map((x) => ({ x, n: figuresOf(x.slug).filter((f) => f.line === line).length }))
    .filter((c) => c.n >= 3)
    .sort((a, b) => b.n - a.n || a.x.name.localeCompare(b.x.name))
    .slice(0, max);
}

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
      <Crumbs items={[{ name: l.name, path: href(1) }]} />
      <PageHead
        emoji={l.emoji}
        title={`${l.name} prices${page > 1 ? ` (page ${page})` : ""}`}
        sub={
          <p>
            {l.about} {all.length.toLocaleString("en-US")} {l.name} figures compared across stores, matched by barcode. Prices show for your region; change it at the top.
          </p>
        }
      />
      {[
        { title: `${l.name} by series`, all: { href: "/series", label: "All series" }, base: "/series", items: inLine(liveSeries(), figuresOfSeries, line) },
        { title: `${l.name} by character`, all: { href: "/characters", label: "All characters" }, base: "/character", items: inLine(liveCharacters(), figuresOfCharacter, line) },
      ].map(
        (row) =>
          row.items.length > 0 && (
            <nav key={row.title} aria-label={row.title} className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-soft">{row.title}</p>
              <ul className="flex flex-wrap gap-1.5">
                {row.items.map(({ x, n }) => (
                  <li key={x.slug}>
                    <Link prefetch={false} href={`${row.base}/${x.slug}`} className="chip border border-line bg-card px-3 py-1 text-sm text-ink hover:border-pink">
                      {x.name} <span className="text-soft">{n}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link prefetch={false} href={row.all.href} className="chip px-3 py-1 text-sm font-semibold text-pink-deep">
                    {row.all.label} →
                  </Link>
                </li>
              </ul>
            </nav>
          ),
      )}
      {list.length ? <TileGrid figures={list} /> : <p className="sticker p-6 text-center text-soft">No {l.name} figures in stock anywhere yet.</p>}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              prefetch={false}
              key={p}
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center rounded-lg border px-3 font-display font-semibold ${p === page ? "border-pink bg-pink text-white" : "border-line bg-card hover:border-pink"}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
      <EbayStrip className="mt-10" placement={`line_${line}`} queries={lineQueries(l.name)} figures={list} title={`${l.name} on eBay`} />
    </div>
  );
}
