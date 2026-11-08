import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LINES } from "@/site";
import { CHARACTERS } from "@/content/characters";
import { SERIES } from "@/content/series";
import { EbayStrip } from "@/components/EbayStrip";
import { TileGrid } from "@/components/FigureTile";
import { PageHead } from "@/components/Section";
import { figuresOfCharacter, liveCharacters } from "@/lib/characters";
import { liveSeries } from "@/lib/series";
import { Crumbs } from "@/lib/seo";

// Character hubs (src/content/characters.ts, DECISIONS.md 2026-11-08): every figure of one character, prerendered at the
// release build like the series pages; only characters with CHARACTER_MIN+ figures have one.
export const dynamicParams = false;
export const generateStaticParams = () => liveCharacters().map((c) => ({ slug: c.slug }));

const find = (slug: string) => CHARACTERS.find((c) => c.slug === slug);
const MAX = 96;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = find(params.slug);
  if (!c) return {};
  const n = figuresOfCharacter(c.slug).length;
  return {
    title: `${c.name} figures: ${n} Nendoroid, figma & POP UP PARADE prices`,
    description: `Compare prices on every ${c.name} figure we track (${n}: Nendoroid, figma, POP UP PARADE) across real figure stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore.`,
    alternates: { canonical: `/character/${c.slug}` },
  };
}

export default function CharacterPage({ params }: { params: { slug: string } }) {
  const c = find(params.slug);
  if (!c) notFound();
  const all = figuresOfCharacter(c.slug);
  const lines = LINES.map((l) => ({ l, n: all.filter((f) => f.line === l.key).length })).filter((x) => x.n);
  const series = c.series && liveSeries().some((s) => s.slug === c.series) ? SERIES.find((s) => s.slug === c.series) : undefined;
  const sameSeries = liveCharacters().filter((x) => x.slug !== c.slug && x.series && x.series === c.series);
  const others = sameSeries.length ? sameSeries : liveCharacters().filter((x) => x.slug !== c.slug).slice(0, 20);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Crumbs items={[{ name: "Characters", path: "/characters" }, { name: c.name, path: `/character/${c.slug}` }]} />
      <PageHead
        title={`${c.name} figures`}
        sub={
          <p>
            Every {c.name} figure we compare, {all.length} in all:{" "}
            {lines.map((x, i) => (
              <span key={x.l.key}>
                {i ? ", " : ""}
                {x.n} {x.l.name}
              </span>
            ))}
            . Matched by barcode across real figure stores, most widely stocked first; prices show for your region.
            {series && (
              <>
                {" "}
                More from{" "}
                <Link prefetch={false} href={`/series/${series.slug}`} className="font-medium text-ink underline underline-offset-4">
                  {series.name}
                </Link>
                .
              </>
            )}
          </p>
        }
      />
      <TileGrid figures={all.slice(0, MAX)} />
      <section className="mt-10">
        <h2 className="h-display text-xl">{sameSeries.length ? `More ${series?.name ?? ""} characters` : "Other characters"}</h2>
        <p className="mt-2 flex flex-wrap gap-2">
          {others.map((x) => (
            <Link prefetch={false} key={x.slug} href={`/character/${x.slug}`} className="chip border border-line bg-card px-3 py-1 text-sm text-ink transition hover:border-soft">
              {x.name}
            </Link>
          ))}
        </p>
      </section>
      <EbayStrip className="mt-10" placement="character" queries={[{ label: `${c.name} figures on eBay`, q: `${c.name.replace(/\s*\(.*\)/, "")} figure` }, ...LINES.map((l) => ({ label: `${c.name} ${l.name}`, q: `${c.name.replace(/\s*\(.*\)/, "")} ${l.name}` }))]} figures={all.slice(0, MAX)} title={`${c.name} figures on eBay`} />
    </div>
  );
}
