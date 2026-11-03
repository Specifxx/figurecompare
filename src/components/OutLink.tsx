"use client";
// Every outbound buy link. The href is already tagged at build time; the click
// is a Vercel Analytics event (no function, no cookie):
//   buy_click { retailer: "<store id> (<region>)", placement }
// EXACTLY two properties, the same shape WargameCompare and MTG Compare send:
// Vercel's Pro plan keeps two custom-event properties per event and drops the
// rest, so the old four (source, region, placement, jan) lost placement.
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

export function OutLink({
  href,
  children,
  className = "",
  paid = false,
  event,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** a link that can earn us a commission: rel sponsored */
  paid?: boolean;
  event: { source: string; region: string; placement: string; jan?: string };
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={paid ? "sponsored noopener" : "nofollow noopener"}
      className={className}
      onClick={() => {
        try {
          track("buy_click", {
            retailer: `${event.source} (${event.region})`.slice(0, 255),
            placement: event.placement.slice(0, 255),
          });
        } catch {}
      }}
    >
      {children}
    </a>
  );
}
