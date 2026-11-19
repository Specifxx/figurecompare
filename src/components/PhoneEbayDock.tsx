// The phone eBay dock's tiles (PhoneDock.tsx), built at the daily build like the rest of the page: per region, the most
// popular figures that have a believable new Buy It Now eBay listing (data/public/ebay.json, scripts/ebay-import.ts), else
// eBay searches for the three lines. Every link is tagged figure-<region>-dock-<jan|search>, rel sponsored, a buy_click.
import type { ReactNode } from "react";
import { ebayAffiliateUrl, ebaySearchUrl, subId } from "@/lib/affiliate";
import { getEbay, popularIn } from "@/lib/data";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { money } from "@/lib/format";
import { OutLink } from "./OutLink";
import { PhoneDock } from "./PhoneDock";

const PLACEMENT = "dock";
const MAX = 8;
const LINK = "flex h-12 min-w-0 items-center gap-2 rounded-lg pr-1 outline-offset-2";
const SEARCHES = ["Nendoroid", "figma figure", "POP UP PARADE"];

function Body({ img, alt, title, price, cta }: { img: string | null; alt: string; title: string; price: string; cta: string }) {
  return (
    <>
      <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-md bg-white">
        {img ? <img src={img} alt={alt} width={44} height={44} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-contain p-0.5" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex h-3.5 items-center gap-1 text-[10px] font-semibold leading-none text-soft">
          eBay
          <span className="rounded bg-lilac-pale px-1 py-px text-[9px] uppercase tracking-wide">Ad</span>
        </span>
        <span className="mt-0.5 truncate text-xs font-semibold leading-4 text-ink">{title}</span>
        <span className="truncate text-sm font-bold tabular-nums leading-4 text-pink-deep">{price}</span>
      </span>
      <span className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink">
        {cta} <span aria-hidden="true">↗</span>
      </span>
    </>
  );
}

export function PhoneEbayDock() {
  const ebay = getEbay();
  const byRegion: Record<string, ReactNode[]> = {};
  for (const r of ACTIVE_REGIONS) {
    const tiles: ReactNode[] = [];
    for (const f of popularIn(r.code, 60)) {
      const pick = ebay[f.jan]?.[r.code];
      if (!pick) continue;
      tiles.push(
        <OutLink key={f.jan} href={ebayAffiliateUrl(pick.u, subId(r.code, PLACEMENT, f.jan))} paid event={{ source: "ebay", region: r.code, placement: PLACEMENT, jan: f.jan }} className={LINK}>
          <Body img={pick.img} alt={`${f.name} on eBay`} title={f.name} price={money(pick.p, r.code)} cta="View" />
        </OutLink>,
      );
      if (tiles.length >= MAX) break;
    }
    if (tiles.length < 3) {
      tiles.length = 0;
      for (const q of SEARCHES) {
        const href = ebaySearchUrl(q, r.code, subId(r.code, PLACEMENT, "search"));
        if (!href) continue;
        tiles.push(
          <OutLink key={q} href={href} paid event={{ source: "ebay", region: r.code, placement: PLACEMENT }} className={LINK}>
            <Body img={null} alt="" title={`${q.replace(" figure", "")} on eBay`} price="New, Buy It Now" cta="Shop" />
          </OutLink>,
        );
      }
    }
    if (tiles.length) byRegion[r.code] = tiles;
  }
  return <PhoneDock byRegion={byRegion} />;
}
