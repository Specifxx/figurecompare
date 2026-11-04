import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LINES, SITE, type LineKey, type RegionCode } from "@/site";
import { POST_BY_SLUG, POSTS } from "@/content/blog";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { Prose } from "@/components/Prose";
import { PageHead } from "@/components/Section";
import { getFigures, getMeta } from "@/lib/data";
import { money, niceDate } from "@/lib/format";
import { Crumbs, JsonLd } from "@/lib/seo";
import { marketStats } from "@/lib/blog-stats";

export const dynamicParams = false;
export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = POST_BY_SLUG[params.slug];
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description: p.description, publishedTime: p.date, images: [{ url: p.image.src, width: 1200, height: 630, alt: p.image.alt }] },
    twitter: { card: "summary_large_image", images: [p.image.src] },
  };
}

const fmt = (n: number) => n.toLocaleString("en-US");

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = POST_BY_SLUG[params.slug];
  if (!p) notFound();
  const figures = getFigures();
  const meta = getMeta();
  const s = marketStats(figures);
  const us = s.regions.find((x) => x.r.code === "US");
  const line = (k: LineKey) => LINES.find((l) => l.key === k)!;
  const m = (cents: number | null, code: RegionCode) => (cents == null ? "—" : money(cents, code));
  return (
    <article className="mx-auto max-w-4xl px-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.title,
          description: p.description,
          datePublished: p.date,
          image: `${SITE.url}${p.image.src}`,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          mainEntityOfPage: `${SITE.url}/blog/${p.slug}`,
        }}
      />
      <Crumbs items={[{ name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]} />
      <PageHead title={p.title} sub={<p>{p.description}</p>} />
      <p className="mb-4 text-sm text-soft">
        Published {niceDate(p.date)}
        {meta ? <> · prices as of {niceDate(meta.updatedAt)}</> : null}
      </p>
      {/* The post's own thumbnail, a static file in public/blog: no optimiser, no function. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image.src} alt={p.image.alt} width={1200} height={630} className="mb-6 aspect-[1200/630] w-full rounded-2xl border border-line object-cover" />
      <Prose>
        <p>
          FigureCompare matches store listings to figures by the barcode on the box, so for the first time we can say something about the hobby that is not an impression: how
          many figures of each line real stores are selling right now, what the typical one costs in each country, in that country&rsquo;s own money, and how far the same box&rsquo;s
          price spreads between shops. This is that picture as of {meta ? niceDate(meta.updatedAt) : "today"}: {fmt(s.total)} figures across {s.stores} stores in seven regions.
          The numbers below are computed from the day&rsquo;s prices when the page is built, so they move with the market.
        </p>

        <h2>Nendoroid is past #{s.maxNum ? fmt(s.maxNum) : "3,300"}, and still the hobby&rsquo;s centre</h2>
        <p>
          Of the {fmt(s.total)} figures stores are selling, {fmt(s.perLine.nendoroid)} are Nendoroids, against {fmt(s.perLine["pop-up-parade"])} POP UP PARADE and{" "}
          {fmt(s.perLine.figma)} figma. Good Smile&rsquo;s numbering is the hobby&rsquo;s clock: the highest Nendoroid number on sale at a store we compare is{" "}
          {s.maxNum ? `#${fmt(s.maxNum)}` : "past #3,300"}, and {fmt(s.over3000)} figures numbered 3000 or above are already on shelves or on pre-order. The line that started at
          #1 in 2006 now adds several hundred numbers a year, and most of them are still available somewhere: the long tail of older Nendoroids that stores keep in stock is what
          makes the <Link prefetch={false} href="/nendoroid">Nendoroid hub</Link> the biggest page on the site.
        </p>
        <p>
          The change inside that is <Link prefetch={false} href="/pop-up-parade">POP UP PARADE</Link>. A line that did not exist before 2019 has, by count of figures stores sell,
          overtaken <Link prefetch={false} href="/figma">figma</Link>, which has been going since 2008. The reason is price: a fixed-pose, non-scale figure at roughly the cost of a
          Nendoroid, in a market where the typical scale figure has moved out of impulse-buy territory. Our read is that this continues, because the publisher&rsquo;s own release
          lists lean the same way: more POP UP PARADE announcements a month than figma, and figma increasingly reserved for re-releases and the big licences.
        </p>

        <h2>What a figure costs, country by country</h2>
        <p>
          The median orderable price (in stock or on pre-order, cheapest store) of each line in each region, in the region&rsquo;s own currency. Prices are never converted here,
          because a converted price is not what you pay; this is what the stores in each place actually ask.
        </p>
      </Prose>
      <div className="sticker mt-4 overflow-x-auto p-2">
        <table className="w-full text-sm">
          <caption className="sr-only">Median orderable price of each figure line by region</caption>
          <thead>
            <tr className="border-b border-line text-left text-soft">
              <th className="px-3 py-2">Region</th>
              {LINES.map((l) => (
                <th key={l.key} className="px-3 py-2 text-right">{l.name}</th>
              ))}
              <th className="px-3 py-2 text-right">Figures listed</th>
              <th className="px-3 py-2 text-right">Stores</th>
            </tr>
          </thead>
          <tbody>
            {s.regions.map((x) => (
              <tr key={x.r.code} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-semibold">{x.r.name}</td>
                {LINES.map((l) => (
                  <td key={l.key} className="px-3 py-2 text-right tabular-nums">{m(x.median[l.key], x.r.code)}</td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums">{fmt(x.listed)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{x.stores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Prose>
        <p>
          Two things stand out. The US has by far the deepest market: {us ? fmt(us.listed) : "the most"} figures listed at {us?.stores ?? "the most"} stores, and the lowest typical
          Nendoroid price in its own currency. And the gap between a Nendoroid and a figma is not the same everywhere: in the US a figma typically costs about half as much
          again as a Nendoroid, while in Canada and Australia it is closer to double, because figma are imported in smaller numbers and fewer stores compete on them.
        </p>

        <h2>How far the same figure&rsquo;s price spreads</h2>
        <p>
          For figures sold by three or more stores in a region, the dearest store charges, at the median,{" "}
          {s.regions
            .filter((x) => x.spread != null && x.spreadN >= 50)
            .map((x, i, a) => (
              <span key={x.r.code}>
                {i ? (i === a.length - 1 ? " and " : ", ") : ""}
                {x.spread!.toFixed(2)} times the cheapest in {x.r.name === "United States" ? "the US" : x.r.name === "United Kingdom" ? "the UK" : x.r.name}
              </span>
            ))}
          . That spread is the most useful number on this page: it is larger than any seasonal sale, and it is the whole reason to compare before you buy. In the US, where the
          most stores compete, the spread is widest, not narrowest, because a few stores price old stock at its original pre-order price years later while others clear it.
          The <Link prefetch={false} href="/deals">deals page</Link> is simply the figures with the widest gap today.
        </p>

        <h2>The figures stocked by the most stores</h2>
        <p>
          A rough measure of what the hobby is buying right now: the figures the most stores are carrying across all seven regions. Nearly all are Nendoroids, and the mix (a decade-old
          Danganronpa character beside this year&rsquo;s Blue Archive and Umamusume releases) is the long tail and the new wave in one list.
        </p>
        <ul>
          {s.stocked.map(({ f, n }) => (
            <li key={f.slug}>
              <Link prefetch={false} href={`/figure/${f.slug}`}>{f.name}</Link>: {n} store listings
            </li>
          ))}
        </ul>

        <h2>Where we think it goes</h2>
        <p>
          Three expectations for the year ahead, for what they are worth. First, the pre-order window keeps getting longer and the pre-order price keeps being the best price:
          the figures that sell out at release go to the secondary market at a premium, and the ones that do not sit at full price at most stores for years, so there is little
          reason to wait once you know you want one. Second, POP UP PARADE keeps growing faster than the other two lines, and the publisher&rsquo;s larger &ldquo;L&rdquo; and
          &ldquo;XL&rdquo; POP UP PARADE sizes blur the line with scale figures from below. Third, the US-versus-everywhere price gap persists, because it is set by import volume and
          store competition rather than by exchange rates. The practical advice is unchanged: find the figure, look at every store&rsquo;s price, and set a price alert on the one
          you want.
        </p>
        <p>
          Every number above is from the same daily check that feeds the product pages, matched by barcode, in each store&rsquo;s own currency and before delivery. The
          store&rsquo;s own page is always the final word.
        </p>
      </Prose>
      <EbayStrip className="mt-10" placement="blog_post" queries={SITE_QUERIES} />
      <p className="mt-6 text-sm text-soft">
        <Link prefetch={false} href="/blog" className="font-semibold text-pink-deep hover:underline">More posts</Link> · Data as of {meta ? niceDate(meta.updatedAt) : "today"} from {s.stores} stores.
      </p>
    </article>
  );
}
