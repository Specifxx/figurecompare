"use client";
// The paid alternative's line under the cheapest store (lib/paid-alternative.ts): a real row of the
// table below, its real price, how much more it costs and "Paid link". Amazon's price is shown only
// for 24 hours after it was fetched (its licence), so the browser checks the age again, as AmazonPrice does.
import { useEffect, useState } from "react";
import { OutLink } from "./OutLink";

const MAX_AGE_MS = 24 * 3600_000;

export function PaidAlt({
  price,
  name,
  note,
  pctMore,
  href,
  at,
  event,
  className = "",
}: {
  price: string;
  name: string;
  note?: string;
  pctMore: number;
  href: string;
  at?: string;
  event: { source: string; region: string; placement: string; jan?: string };
  className?: string;
}) {
  const [fresh, setFresh] = useState(true);
  useEffect(() => setFresh(!at || Date.now() - Date.parse(at) < MAX_AGE_MS), [at]);
  if (!fresh) return null;
  return (
    <p className={`flex items-baseline gap-2 text-sm ${className}`}>
      {/* One line in the phone buy bar (no note there); the hero's line may wrap. */}
      <OutLink href={href} paid event={event} className={`min-w-0 font-medium text-pink-deep hover:underline ${note ? "" : "truncate"}`}>
        or <span className="tabular-nums">{price}</span> on {name}
        {pctMore > 0 ? <span className="font-normal text-soft"> +{pctMore}%</span> : null}
        {note ? <span className="font-normal text-soft"> ({note})</span> : null} <span aria-hidden>→</span>
      </OutLink>
      <span className="shrink-0 text-[11px] text-soft">Paid link</span>
    </p>
  );
}
