// One region's price table. Stores are in price order (orderable first);
// marketplaces (eBay, Amazon) sit pinned above them, labelled, never counted
// as a store and never the "best price" (family rule: paid rows pinned).
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { amazonSearchUrl, ebayAffiliateUrl, ebaySearchUrl, ebayShopHost, hljUrl, storePays, storeUrl, subId } from "@/lib/affiliate";
import { storeName } from "@/lib/data";
import { money } from "@/lib/format";
import type { EbayPick, Figure, Offer } from "@/lib/types";
import { OutLink } from "./OutLink";

const STOCK: Record<Offer["st"], { label: string; cls: string }> = {
  in: { label: "In stock", cls: "bg-mint-pale text-mint" },
  pre: { label: "Pre-order", cls: "bg-lilac-pale text-ink" },
  out: { label: "Sold out", cls: "bg-line/50 text-soft" },
};

export function searchQuery(f: Figure): string {
  return f.name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
}

/** How an eBay price compares with the cheapest store: never re-ranked, just said. */
function vsBest(p: number, bestP: number | undefined): string {
  if (bestP == null) return "new, Buy It Now";
  if (p < bestP) return "cheaper than every store";
  if (p === bestP) return "same as the cheapest store";
  return `+${Math.round(((p - bestP) / bestP) * 100)}% vs cheapest store`;
}

export function PriceTable({ f, region, ebay, placement = "table" }: { f: Figure; region: RegionCode; ebay?: EbayPick; placement?: string }) {
  const offers = f.offers[region] ?? [];
  const r = REGION_BY_CODE[region];
  const best = offers.find((o) => o.st !== "out");
  const q = searchQuery(f);
  const ebayUrl = ebay ? ebayAffiliateUrl(ebay.u, subId(region, `${placement}_pinned`, f.jan)) : ebaySearchUrl(q, region, subId(region, `${placement}_pinned`, f.jan));
  const amazonUrl = amazonSearchUrl(q, region, subId(region, `${placement}_pinned`, f.jan));
  // HobbyLink Japan ships worldwide from Japan: shown with the Japan table.
  const hlj = region === "JP" ? hljUrl(f.jan) : null;
  return (
    <div className="space-y-2">
      {(ebayUrl || amazonUrl || hlj) && (
        <div className="space-y-2" aria-label="Marketplaces">
          {ebayUrl && (
            <Row
              name={ebay ? "eBay" : "Search eBay"}
              sub={ebay ? vsBest(ebay.p, best?.p) : `New listings on ${ebayShopHost(region)?.replace("www.", "")}`}
              price={ebay ? money(ebay.p, region) : null}
              status={null}
              href={ebayUrl}
              paid
              tint="bg-lemon-pale"
              event={{ source: "ebay", region, placement: `${placement}_pinned`, jan: f.jan }}
            />
          )}
          {amazonUrl && (
            <Row
              name="Search Amazon"
              sub={`${r.amazonHost?.replace("www.", "")} · check the seller · Ad`}
              price={null}
              status={null}
              href={amazonUrl}
              paid
              tint="bg-lemon-pale"
              event={{ source: "amazon", region, placement: `${placement}_pinned`, jan: f.jan }}
            />
          )}
          {hlj && (
            <Row
              name="HobbyLink Japan"
              sub="Search by barcode · ships worldwide · Ad"
              price={null}
              status={null}
              href={hlj}
              paid
              tint="bg-lemon-pale"
              event={{ source: "hlj", region, placement: `${placement}_pinned`, jan: f.jan }}
            />
          )}
        </div>
      )}
      <ol className="space-y-2">
        {offers.map((o) => (
          <li key={o.s}>
            <Row
              name={storeName(o.s)}
              sub={o === best ? "Cheapest store" : null}
              price={money(o.p, region)}
              status={o.st}
              href={storeUrl(o.s, o.u)}
              paid={storePays(o.s)}
              highlight={o === best}
              event={{ source: o.s, region, placement, jan: f.jan }}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Row({
  name,
  sub,
  price,
  status,
  href,
  paid,
  highlight = false,
  tint = "bg-card",
  event,
}: {
  name: string;
  sub: string | null;
  price: string | null;
  status: Offer["st"] | null;
  href: string;
  paid: boolean;
  highlight?: boolean;
  tint?: string;
  event: { source: string; region: string; placement: string; jan?: string };
}) {
  const s = status ? STOCK[status] : null;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${tint} ${
        highlight ? "border-pink shadow-sticker" : "border-line"
      } ${status === "out" ? "opacity-70" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{name}</p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-soft">
          {s && <span className={`chip ${s.cls}`}>{s.label}</span>}
          {sub && <span className={highlight ? "font-bold text-pink-deep" : ""}>{sub}</span>}
          {paid && <span>Paid link</span>}
        </p>
      </div>
      {price && <span className={`font-display text-lg font-bold ${highlight ? "text-pink-deep" : ""}`}>{price}</span>}
      <OutLink
        href={href}
        paid={paid}
        event={event}
        className={`btn-pop shrink-0 px-3 py-1.5 text-sm ${status === "out" ? "bg-card text-ink" : "bg-buy text-white"}`}
      >
        {status === "out" ? "View" : price ? "Buy" : "Look"} <span aria-hidden>→</span>
      </OutLink>
    </div>
  );
}
