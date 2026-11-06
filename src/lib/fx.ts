// Yen → each region's currency, for the "Or import from Japan" table only (owner, 2026-11-06: "even if it's
// priced in yen, convert it ... as long as it can ship to that country"). The import writes the day's European
// Central Bank reference rates to data/public/fx.json (scripts/import.ts, fetchFx); pages show a Japan store's
// price as "≈ US$41.07" with the yen price beside it. Rates older than FX_MAX_AGE_DAYS are not used: the row
// falls back to yen alone rather than show a stale conversion. A converted price is never a region's best
// price, a deal, an alert price, an eBay reference or JSON-LD: those stay the region's own stores.
import { REGION_BY_CODE, REGIONS, type RegionCode } from "@/site";

export interface Fx {
  /** when the rates were fetched (ISO) */
  at: string;
  /** the ECB reference date the rates are for (YYYY-MM-DD) */
  date: string;
  /** currency → units of it per one yen */
  rates: Record<string, number>;
}

export const FX_MAX_AGE_DAYS = 7;
export const FX_SOURCE = "https://api.frankfurter.app/latest";

/** Region currencies other than the yen, the ones a Japan price is converted into. */
export const FX_TARGETS = [...new Set(REGIONS.map((r) => r.currency).filter((c) => c !== "JPY"))];

export function fxUsable(fx: Fx | null | undefined, now = Date.now()): fx is Fx {
  return !!fx && Number.isFinite(Date.parse(fx.at)) && (now - Date.parse(fx.at)) / 86_400_000 <= FX_MAX_AGE_DAYS;
}

/** A yen price in a region's minor unit (cents), or null when there is no usable rate. */
export function convertYen(yen: number, region: RegionCode, fx: Fx | null | undefined, now = Date.now()): number | null {
  if (!fxUsable(fx, now)) return null;
  const rate = fx.rates[REGION_BY_CODE[region].currency];
  if (!(rate > 0)) return null;
  return Math.round(yen * rate * 100);
}

/** Today's rates from the ECB (via Frankfurter, no key). Throws on a bad answer, so the caller keeps yesterday's file. */
export async function fetchFx(): Promise<Fx> {
  const res = await fetch(`${FX_SOURCE}?from=JPY&to=${FX_TARGETS.join(",")}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const d = (await res.json()) as { date?: string; rates?: Record<string, number> };
  const rates = d.rates ?? {};
  const missing = FX_TARGETS.filter((c) => !(rates[c] > 0));
  if (missing.length) throw new Error(`FX answer has no rate for ${missing.join(", ")}`);
  return { at: new Date().toISOString(), date: d.date ?? new Date().toISOString().slice(0, 10), rates };
}
