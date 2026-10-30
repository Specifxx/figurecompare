// The rows of a price table, shared by the figure page and the quick view.
// Marketplaces (eBay first, Amazon second) sit pinned above the stores,
// labelled, never counted as a store and never the "best price".
import type { Offer } from "@/lib/types";
import { OutLink } from "./OutLink";

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
  tint?: string;
  event: { source: string; region: string; placement: string; jan?: string };
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

function Row({ name, sub, price, status, href, paid, highlight = false, tint = "bg-card", event }: RowData) {
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
