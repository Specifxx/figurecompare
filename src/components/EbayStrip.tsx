// The eBay strip (owner, 2026-10-28: eBay is the commission while the stores'
// programs come; ads on every page). Built at the daily build like the rest of
// the page, one block per region, CSS showing the visitor's (no request, no
// function):
//   • real listings first: the cheapest believable new Buy It Now listing per
//     figure from data/public/ebay.json (scripts/ebay-import.ts, by barcode),
//     as tiles with the listing's photo and price;
//   • with fewer than three, eBay searches (new, Buy It Now, cheapest first)
//     for the page's own lines and figures, as buttons.
// Always labelled "Ad", rel sponsored, a buy_click per click, tagged
// figure-<region>-<placement>-<jan|search> for the earnings reports. Never a
// pop-up, never beside a store's buy button.
import { type RegionCode } from "@/site";
import { ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, subId } from "@/lib/affiliate";
import { getEbay } from "@/lib/data";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { money } from "@/lib/format";
import type { Figure } from "@/lib/types";
import { OutLink } from "./OutLink";

export type EbayQuery = { label: string; q: string };

const MIN_TILES = 3;
const MAX_TILES = 6;

export function EbayStrip({
  placement,
  queries,
  figures = [],
  title = "Also on eBay",
  className = "",
}: {
  placement: string;
  queries: EbayQuery[];
  figures?: Figure[];
  title?: string;
  className?: string;
}) {
  const ebay = getEbay();
  return (
    <>
      {ACTIVE_REGIONS.map((r) => {
        const host = ebayShopHost(r.code);
        if (!host) return null;
        const picks = figures
          .map((f) => ({ f, pick: ebay[f.jan]?.[r.code] }))
          .filter((x): x is { f: Figure; pick: NonNullable<typeof x.pick> } => !!x.pick)
          .slice(0, MAX_TILES);
        return (
          <aside key={r.code} className={`rp rp-${r.code} ${className}`} aria-label={`${title} (ad)`}>
            <div className="rounded-blob border-2 border-dashed border-lemon bg-lemon-pale/60 p-4">
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-lg font-bold text-ink">
                  <span aria-hidden>🛍️</span> {title}
                </h2>
                <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-soft ring-1 ring-line">Ad · Paid link</span>
                <span className="text-xs text-soft">New, Buy It Now on {host.replace("www.", "")}</span>
              </div>
              {picks.length >= MIN_TILES ? (
                <Tiles region={r.code} placement={placement} picks={picks} />
              ) : (
                <Searches region={r.code} placement={placement} queries={queries} />
              )}
            </div>
          </aside>
        );
      })}
    </>
  );
}

function Tiles({ region, placement, picks }: { region: RegionCode; placement: string; picks: { f: Figure; pick: { p: number; u: string; t: string; img: string | null } }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {picks.map(({ f, pick }) => (
        <li key={f.jan}>
          <OutLink
            href={ebayAffiliateUrl(pick.u, subId(region, placement, f.jan))}
            paid
            event={{ source: "ebay", region, placement, jan: f.jan }}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-line bg-card transition hover:-translate-y-0.5 hover:border-pink"
          >
            <span className="grid aspect-square place-items-center bg-white p-2">
              {pick.img ? (
                <img src={pick.img} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain text-transparent" />
              ) : (
                <span aria-hidden className="text-4xl">
                  🎀
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col gap-1 p-2">
              <span className="line-clamp-2 text-xs font-semibold text-ink">{f.name}</span>
              <span className="mt-auto font-display text-base font-bold text-pink-deep">{money(pick.p, region)}</span>
              <span className="text-[11px] text-soft">on eBay ›</span>
            </span>
          </OutLink>
        </li>
      ))}
    </ul>
  );
}

function Searches({ region, placement, queries }: { region: RegionCode; placement: string; queries: EbayQuery[] }) {
  const links = queries.map((x) => ({ ...x, href: ebaySearchUrl(x.q, region, subId(region, placement, "search")) })).filter((x) => x.href);
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((x) => (
        <li key={x.q}>
          <OutLink
            href={x.href!}
            paid
            event={{ source: "ebay", region, placement }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-2 border-ink bg-card px-4 py-2 text-sm font-bold text-ink shadow-popsm transition hover:-translate-y-0.5 hover:bg-pink hover:text-white"
          >
            {x.label} <span aria-hidden>›</span>
          </OutLink>
        </li>
      ))}
    </ul>
  );
}

/** The searches a page about one line offers: the line, its pre-orders, and its most-stocked series. */
export function lineQueries(lineName: string): EbayQuery[] {
  return [
    { label: `${lineName} on eBay`, q: lineName },
    { label: `${lineName} pre-orders`, q: `${lineName} pre-order` },
    { label: `Hatsune Miku ${lineName}`, q: `Hatsune Miku ${lineName}` },
    { label: `Hololive ${lineName}`, q: `Hololive ${lineName}` },
  ];
}

/** The searches for the site as a whole. */
export const SITE_QUERIES: EbayQuery[] = [
  { label: "Nendoroid", q: "Nendoroid" },
  { label: "figma", q: "figma figure" },
  { label: "POP UP PARADE", q: "POP UP PARADE" },
  { label: "Hatsune Miku figures", q: "Hatsune Miku figure" },
  { label: "Hololive figures", q: "Hololive figure" },
];

/** The small eBay box at the foot of the sidebar and the phone menu. */
export function EbayNavBox({ placement }: { placement: string }) {
  return (
    <>
      {ACTIVE_REGIONS.map((r) => {
        const href = ebaySearchUrl("Nendoroid", r.code, subId(r.code, placement, "search"));
        if (!href) return null;
        return (
          <div key={r.code} className={`rp rp-${r.code}`}>
            <OutLink
              href={href}
              paid
              event={{ source: "ebay", region: r.code, placement }}
              className="block rounded-2xl border-2 border-dashed border-lemon bg-lemon-pale/60 p-3 text-sm transition hover:border-pink"
            >
              <span className="block font-display font-bold text-ink">🛍️ Figures on eBay ›</span>
              <span className="text-[11px] text-soft">New, Buy It Now · Ad</span>
            </OutLink>
          </div>
        );
      })}
    </>
  );
}
