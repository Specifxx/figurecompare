"use client";
// The figure page's price alert (PriceAlertForm.tsx) in the visitor's region:
// the page is one prerendered file for every region, so the server passes every
// region's headline price (lib/alert-feed.ts alertPrices) and the region comes
// from the browser (RegionPicker.tsx useRegion), like the rest of the page.
import { useRegion } from "./RegionPicker";
import { PriceAlertForm } from "./PriceAlertForm";

export function FigureAlert({ site, jan, prices }: { site: string; jan: string; prices: Record<string, number> }) {
  const region = useRegion();
  if (region === "JP") return null;
  return <PriceAlertForm key={region} site={site} productId={jan} region={region} priceCents={prices[region] ?? null} className="mt-3 text-sm" />;
}
