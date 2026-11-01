import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LINES, LINE_BY_KEY } from "@/site";
import { SERIES } from "@/content/series";
import { EbayStrip } from "@/components/EbayStrip";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { figuresOfSeries, liveSeries } from "@/lib/series";

export const dynamicParams = false;
export const generateStaticParams = () => liveSeries().map((s) => ({ slug: s.slug }));

const find = (slug: string) => SERIES.find((s) => s.slug === slug);
/** A page shows at most this many figures, most-stocked first (the HTML carries every region's prices). */
const MAX = 96;
const queries = (name: string) => [
  { label: `${name} figures on eBay`, q: `${name} figure` },
  ...LINES.map((l) => ({ label: `${name} ${l.name}`, q: `${name} ${l.name}` })),
];

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = find(params.slug);
  if (!s) return {};
  const n = figuresOfSeries(s.slug).length;
  return {
    title: `${s.name} figures: Nendoroid, figma & POP UP PARADE prices`,
    description: `Compare prices on ${n} ${s.name} figures (Nendoroid, figma, POP UP PARADE) across real figure stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore.`,
    alternates: { canonical: `/series/${s.slug}` },
  };
}

export default function SeriesPage({ params }: { params: { slug: string } }) {
  const s = find(params.slug);
  if (!s) notFound();
  const all = figuresOfSeries(s.slug);
  const lines = LINES.map((l) => ({ l, n: all.filter((f) => f.line === l.key).length })).filter((x) => x.n);
  const others = liveSeries().filter((x) => x.slug !== s.slug);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        title={`${s.name} figures`}
        sub={
          <p>
            {s.about} {all.length.toLocaleString("en-US")} figures compared across stores, matched by barcode:{" "}
            {lines.map((x, i) => (
              <span key={x.l.key}>
                {i ? ", " : ""}
                {x.n} {x.l.name}
              </span>
            ))}
            . Prices show for your region; change it at the top.
          </p>
        }
      />
      <EbayStrip className="mb-8" placement="series_top" queries={queries(s.name)} />
      <TileGrid figures={all.slice(0, MAX)} />
      {all.length > MAX && <p className="mt-4 text-center text-sm text-soft">Showing the {MAX} figures most stores carry. Search for the rest.</p>}
      <section className="mt-10">
        <h2 className="h-display text-xl">Browse by line</h2>
        <p className="mt-2 flex flex-wrap gap-2">
          {lines.map((x) => (
            <Link prefetch={false} key={x.l.key} href={`/${x.l.key}`} className="chip border border-line bg-card px-3 py-1 text-sm text-ink transition hover:border-soft">
              {LINE_BY_KEY[x.l.key].name}
            </Link>
          ))}
        </p>
        <h2 className="h-display mt-6 text-xl">Other series</h2>
        <p className="mt-2 flex flex-wrap gap-2">
          {others.map((x) => (
            <Link prefetch={false} key={x.slug} href={`/series/${x.slug}`} className="chip border border-line bg-card px-3 py-1 text-sm text-ink transition hover:border-soft">
              {x.name}
            </Link>
          ))}
        </p>
      </section>
      <EbayStrip className="mt-10" placement="series" queries={queries(s.name)} figures={all.slice(0, MAX)} title={`${s.name} figures on eBay`} />
    </div>
  );
}
