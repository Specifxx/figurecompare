// The line under "Or import from Japan": says the prices are converted, at which day's rate, and what is not included.
import { REGION_BY_CODE, type RegionCode } from "@/site";
import { getFx } from "./data";
import { fxUsable } from "./fx";

export function fxNote(view: RegionCode): string {
  const fx = getFx();
  const cur = REGION_BY_CODE[view].currency;
  if (!fxUsable(fx) || !(fx.rates[cur] > 0)) return "Prices in yen, before international shipping and any import tax.";
  return `≈ converted from yen to ${cur} at the European Central Bank rate of ${fx.date}; the store charges in yen. Before international shipping and any import tax.`;
}
