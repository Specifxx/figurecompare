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

/** The November 2026 market post, written around marketStats. */
function MarketBody({ s, meta, us, line, m }: { s: ReturnType<typeof marketStats>; meta: ReturnType<typeof getMeta>; us: ReturnType<typeof marketStats>["regions"][number] | undefined; line: (k: LineKey) => (typeof LINES)[number]; m: (cents: number | null, code: RegionCode) => string }) {
  return (
    <>
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
      <div className="sticker my-6 max-w-[68ch] overflow-x-auto p-2">
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
    </>
  );
}

/** How to spot a bootleg: the checks, then the day's median Nendoroid price per region as the price test. */
function BootlegBody({ s, meta, m }: { s: ReturnType<typeof marketStats>; meta: ReturnType<typeof getMeta>; m: (cents: number | null, code: RegionCode) => string }) {
  const nendo = s.regions.filter((x) => x.median.nendoroid != null);
  return (
    <>
      <Prose>
        <p>
          Bootleg Nendoroids are the hobby&rsquo;s oldest problem, and they have got better. The crude ones with melted faces are still sold, but the copies that cost
          people money now come in a box that photographs like the real thing and sell for a price that is just low enough to tempt. This guide is the checks that
          catch them, in the order that costs you least effort, followed by the one test that needs no figure in hand: what a real Nendoroid costs at a real store in
          your country this morning. The numbers are computed from the day&rsquo;s prices when the page is built, so they move with the market.
        </p>

        <h2>1. The price</h2>
        <p>
          Start here, because it rules out most listings before you read them. A new Nendoroid from Good Smile Company has a Japanese list price of around &yen;5,000 to
          &yen;7,500, and a store in your country sells it for that plus import and margin. The table below is the median price of an orderable Nendoroid (in stock or
          on pre-order, cheapest store) at the stores we compare in each region today. A listing at a quarter of that figure is not a bargain: it is a bootleg, and
          the same goes for a sold-out figure from years ago offered &ldquo;new in box&rdquo; at under its original price.
        </p>
      </Prose>
      <div className="sticker my-6 max-w-[68ch] overflow-x-auto p-2">
        <table className="w-full text-sm">
          <caption className="sr-only">Median orderable Nendoroid price by region today</caption>
          <thead>
            <tr className="border-b border-line text-left text-soft">
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2 text-right">Median Nendoroid price</th>
              <th className="px-3 py-2 text-right">Figures listed</th>
              <th className="px-3 py-2 text-right">Stores</th>
            </tr>
          </thead>
          <tbody>
            {nendo.map((x) => (
              <tr key={x.r.code} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-semibold">{x.r.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{m(x.median.nendoroid, x.r.code)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(x.listed)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{x.stores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Prose>
        <p>
          Every figure page on this site shows each store&rsquo;s price for that exact barcode, so you can see in a moment what the real range is. Real stores do go
          under the list price on old stock, but by a fifth, not by three quarters.
        </p>

        <h2>2. The seller</h2>
        <p>
          We compare real figure stores only, never marketplaces, for exactly this reason: the bootleg trade lives on marketplaces. On AliExpress, Temu, Wish and
          the China-based sellers on eBay and Amazon, a &ldquo;Nendoroid&rdquo; at a tenth of the price is a copy, whatever the listing says, and a listing that
          names a popular character but not a Nendoroid number is a copy with a different name. A seller who has every sold-out Nendoroid of the last decade in
          stock at once does not exist in the real trade. The stores we list are on <Link prefetch={false} href="/stores">the stores page</Link>; each sells sealed
          product from the Japanese distributor or a licensed regional one.
        </p>

        <h2>3. The box</h2>
        <p>
          Good Smile Company puts a holographic authenticity sticker on its boxes, and the bootleggers copy it, so the sticker alone proves nothing: look at the
          printing around it. A real box has crisp text, correct Japanese, the Nendoroid number on the front and the barcode (a JAN starting 45 or 49) on the back or
          side that matches the figure. Bootleg boxes are softer and often slightly the wrong size, the colours are off, the window film is cloudy, and the
          small print has spelling mistakes or a blurred copyright line. A box that lists the figure&rsquo;s number but shows a different pose on the photo is a
          copy of a different release.
        </p>

        <h2>4. The figure</h2>
        <p>
          Out of the box, a bootleg gives itself away in the paint and the joints. Real Nendoroid paint is even, with sharp edges where colours meet and no bleed
          into the face; bootlegs have smudged edges, pupils that are not symmetrical, and skin tones that are too pink or too grey. The plastic is softer and often
          slightly translucent in the hair, seams are rough, the joints are loose or so stiff they crack, and the spare face plates do not sit flush. Accessories are
          missing or moulded in one colour. Hold the figure to the light and compare it with photos of the real release on the figure&rsquo;s page here.
        </p>

        <h2>5. The number</h2>
        <p>
          Every Nendoroid has a number, printed on the box, and the number identifies the release: the same character can have several Nendoroids, and a
          re-release keeps the number of the original. Search the name on this site and open the figure whose number matches. If the seller&rsquo;s box shows a
          number that belongs to a different character, or no number at all, it is not a Good Smile Company release. The <Link prefetch={false} href="/nendoroid">Nendoroid hub</Link>{" "}
          lists every number stores are selling now.
        </p>

        <h2>What to do if you have one</h2>
        <p>
          Marketplaces refund counterfeit goods: open a case with photos beside the real release&rsquo;s product images and quote the price and box checks above. Do not
          resell it, even described as a copy. And if the figure you wanted is sold out everywhere, wait: Good Smile re-releases popular Nendoroids regularly, and the{" "}
          <Link prefetch={false} href="/preorders">pre-orders page</Link> lists every re-release the stores we compare are taking orders for.
        </p>
        <p>
          Data as of {meta ? niceDate(meta.updatedAt) : "today"}: {fmt(s.total)} figures across {s.stores} stores, matched by barcode, in each store&rsquo;s own currency and before delivery.
        </p>
      </Prose>
    </>
  );
}

/** Black Friday 2026: the day's median price per line and region as the prices to beat, the spread, and the checks. */
function BlackFridayBody({ s, meta, m }: { s: ReturnType<typeof marketStats>; meta: ReturnType<typeof getMeta>; m: (cents: number | null, code: RegionCode) => string }) {
  return (
    <>
      <Prose>
        <p>
          Black Friday is 27 November 2026 and Cyber Monday is 30 November. Figure stores do run sales that week, mostly as site-wide codes and clearance of older
          stock, but anime figures are not a category where everything gets cheaper at once: a new Nendoroid&rsquo;s price is set by the Japanese list price and the
          import, and the best price on a new release is usually its pre-order. The useful thing to do before the sales is to know what a figure really costs, so you can
          tell a deal from a normal price with a banner on it. The numbers below are computed from the day&rsquo;s prices when the page is built, so they move with the market.
        </p>
        <p>
          The deals themselves are on our <Link prefetch={false} href="/black-friday">anime figure Black Friday deals</Link> page: every figure in stock today where the cheapest
          store is at least 10% under the dearest in your region, updated every day through the sales, and <Link prefetch={false} href="/cyber-monday">Cyber Monday deals</Link> does
          the same that weekend.
        </p>

        <h2>The prices to beat</h2>
        <p>
          The median orderable price (in stock or on pre-order, cheapest store) of each line in each region today, in the region&rsquo;s own currency. A Black Friday price for an
          ordinary current figure that is not under this is not a deal; it is the going rate.
        </p>
      </Prose>
      <div className="sticker my-6 max-w-[68ch] overflow-x-auto p-2">
        <table className="w-full text-sm">
          <caption className="sr-only">Median orderable price of each figure line by region today</caption>
          <thead>
            <tr className="border-b border-line text-left text-soft">
              <th className="px-3 py-2">Region</th>
              {LINES.map((l) => (
                <th key={l.key} className="px-3 py-2 text-right">{l.name}</th>
              ))}
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
                <td className="px-3 py-2 text-right tabular-nums">{x.stores}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Prose>
        <h2>The gap between stores is bigger than the sale</h2>
        <p>
          For figures three or more stores sell in a region, the dearest store charges, at the median,{" "}
          {s.regions
            .filter((x) => x.spread != null && x.spreadN >= 50)
            .map((x, i, a) => (
              <span key={x.r.code}>
                {i ? (i === a.length - 1 ? " and " : ", ") : ""}
                {x.spread!.toFixed(2)} times the cheapest in {x.r.name === "United States" ? "the US" : x.r.name === "United Kingdom" ? "the UK" : x.r.name}
              </span>
            ))}
          . A 20% code at the dearest store can still cost more than the cheapest store charges on an ordinary day, so compare the figure&rsquo;s every store before you count
          the discount. Every figure page here lists each store&rsquo;s price for that exact barcode.
        </p>

        <h2>Five checks before you pay</h2>
        <ol>
          <li><b>Compare with today&rsquo;s cheapest store, not the &ldquo;was&rdquo; price.</b> Crossed-out prices are often the original pre-order price of a figure that has sold for less for months.</li>
          <li><b>Add the delivery.</b> Figures are bulky; a few dollars off with paid shipping can lose to a dearer store with free shipping over a threshold.</li>
          <li><b>Check it is in stock.</b> A pre-order is often the best price for a new release, but it ships months later; a backorder may never ship.</li>
          <li><b>Be wary of prices far under every store.</b> A Nendoroid at a quarter of the table above is a bootleg, not a doorbuster. See <Link prefetch={false} href="/blog/how-to-spot-bootleg-nendoroids">how to spot a bootleg Nendoroid</Link>.</li>
          <li><b>Read the code&rsquo;s terms.</b> Stores often leave pre-orders and new releases out of site-wide codes.</li>
        </ol>

        <h2>What tends to be on sale</h2>
        <p>
          In our view the week&rsquo;s real savings are on older in-stock figures that stores want to clear before the new year, and on POP UP PARADE, where more stores compete.
          New Nendoroids and figma rarely drop much in the first months after release. If a figure you want is already at a good price today, waiting can cost more than it saves:
          popular figures sell out in December. Otherwise, set a price alert on its page and we will email you when it drops.
        </p>
        <p>
          Data as of {meta ? niceDate(meta.updatedAt) : "today"}: {fmt(s.total)} figures across {s.stores} stores, matched by barcode, in each store&rsquo;s own currency and before delivery.
        </p>
      </Prose>
    </>
  );
}

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
      {p.slug === "anime-figure-black-friday-2026" ? <BlackFridayBody s={s} meta={meta} m={m} /> : p.slug === "how-to-spot-bootleg-nendoroids" ? <BootlegBody s={s} meta={meta} m={m} /> : <MarketBody s={s} meta={meta} us={us} line={line} m={m} />}
      <EbayStrip className="mt-10" placement="blog_post" queries={SITE_QUERIES} />
      <p className="mt-6 text-sm text-soft">
        <Link prefetch={false} href="/blog" className="font-semibold text-pink-deep hover:underline">More posts</Link> · Data as of {meta ? niceDate(meta.updatedAt) : "today"} from {s.stores} stores.
      </p>
    </article>
  );
}
