// The rows of a price table, shared by the figure page and the quick view.
// Marketplaces (eBay first, Amazon second) sit pinned above the stores,
// labelled, never counted as a store and never the "best price".
import type { Offer } from "@/lib/types";
import { OutLink } from "./OutLink";
import { AMAZON_PRICE_DISCLAIMER, AmazonPrice } from "./AmazonPrice";
import { StoreVote } from "./StoreVote";
import { CartAddButton } from "./cart/CartAddButton";

const STOCK: Record<Offer["st"], { label: string; cls: string }> = {
  in: { label: "In stock", cls: "bg-mint-pale text-mint" },
  pre: { label: "Pre-order", cls: "bg-lilac-pale text-ink" },
  out: { label: "Sold out", cls: "bg-line/50 text-soft" },
};

export interface RowData {
  name: string;
  sub: string | null;
  price: string | null;
  status: Offer["st"] | null;
  href: string;
  paid: boolean;
  highlight?: boolean;
  /** Amazon's own price from the Creators API (lib/amazon-live.ts): shown with its time, hidden after 24 hours. */
  live?: { at: string; timeZone: string; zoneLabel: string };
  event: { source: string; region: string; placement: string; jan?: string };
  /** Stores only: the store's own listing URL, for the shared thumbs up / down (StoreVote.tsx). */
  vote?: string;
  /** In-stock stores only: the cart list's line (components/cart, owner 2026-11-06). */
  cart?: { title: string; image: string | null; priceCents: number; currency: string };
}

export interface RowsData {
  pinned: RowData[];
  stores: RowData[];
}

export function PriceRows({ pinned, stores }: RowsData) {
  return (
    <div className="space-y-2">
      {pinned.length > 0 && (
        <div className="space-y-2" aria-label="Marketplaces">
          {pinned.map((r) => (
            <Row key={r.event.source} {...r} />
          ))}
          {pinned.some((r) => r.live) && <p className="px-1 text-[11px] text-soft">* Amazon price: {AMAZON_PRICE_DISCLAIMER}</p>}
        </div>
      )}
      <ol className="space-y-2">
        {stores.map((r) => (
          <li key={r.event.source}>
            <Row {...r} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Row({ name, sub, price, status, href, paid, highlight = false, live, event, vote, cart }: RowData) {
  const s = status ? STOCK[status] : null;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 ${
        highlight ? "border-pink shadow-sticker" : "border-line"
      } ${status === "out" ? "opacity-70" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-bold">
          <span className="min-w-0 max-w-full truncate">{name}</span>
          {vote && <StoreVote url={vote} name={name} className="shrink-0 text-xs font-normal text-soft" />}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-soft">
          {s && <span className={`chip ${s.cls}`}>{s.label}</span>}
          {sub && <span className={highlight ? "font-bold text-pink-deep" : ""}>{sub}</span>}
          {paid && <span>Paid link</span>}
          {/* Phones: the cart list's add button as a word on this line, where the row has no width to spare. */}
          {cart && vote && (
            <CartAddButton inline href={href} productUrl={vote} storeName={name} title={cart.title} priceCents={cart.priceCents} currency={cart.currency} image={cart.image} className="text-xs sm:hidden" />
          )}
        </p>
      </div>
      {price && live && <AmazonPrice price={price} at={live.at} timeZone={live.timeZone} zoneLabel={live.zoneLabel} />}
      {price && !live && <span className={`font-display text-lg font-bold ${highlight ? "text-pink-deep" : ""}`}>{price}</span>}
      {cart && vote && (
        <CartAddButton href={href} productUrl={vote} storeName={name} title={cart.title} priceCents={cart.priceCents} currency={cart.currency} image={cart.image} className="hidden text-soft sm:inline-flex" />
      )}
      <OutLink
        href={href}
        paid={paid}
        event={event}
        className={`btn-pop shrink-0 px-3 py-1.5 text-sm ${status === "out" ? "bg-card text-ink" : "bg-buy text-white"}`}
      >
        {status === "out" ? "View" : price ? "Buy" : "Shop"} <span aria-hidden>→</span>
      </OutLink>
    </div>
  );
}
