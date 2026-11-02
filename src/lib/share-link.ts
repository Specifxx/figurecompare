// Word of mouth (owner, 2026-11-02): shared links and the share message. The site is static, so the messages are
// written at build (one per region, for the button to pick the visitor's) and the button is client-side only: no new
// function (this file is client-safe; the messages are in share-texts.ts). Every shared link carries utm_source=share&utm_medium=<what>; the button sends a Vercel "share" event,
// ShareArrival one "share_visit" when a shared link brings someone, and RiftCompare's weekly growth report counts both.

export type ShareMedium = "figure" | "page";

/** `path` (its own query string kept) on `origin`, with the share tags. */
export function shareUrl(origin: string, path: string, medium: ShareMedium): string {
  const u = new URL(path, origin);
  u.searchParams.set("utm_source", "share");
  u.searchParams.set("utm_medium", medium);
  return u.toString();
}

export interface GapRow {
  priceCents: number;
  storeName: string;
}

/** One region's real spread: cheapest and dearest orderable store, in its own currency; null without two stores and a gap. */
export function priceGap(rows: readonly GapRow[]): { low: GapRow; high: GapRow; pct: number } | null {
  const live = rows.filter((r) => r.priceCents > 0).slice().sort((a, b) => a.priceCents - b.priceCents);
  if (live.length < 2) return null;
  const low = live[0];
  const high = live[live.length - 1];
  if (new Set(live.map((r) => r.storeName)).size < 2 || high.priceCents <= low.priceCents) return null;
  return { low, high, pct: Math.round(((high.priceCents - low.priceCents) / high.priceCents) * 100) };
}
