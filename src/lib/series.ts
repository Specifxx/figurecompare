import { SERIES, SERIES_MIN, type Series } from "@/content/series";
import { getFigures, storeCount } from "./data";
import type { Figure } from "./types";

let memo: Map<string, Figure[]> | null = null;
/** Every series' figures, most-stocked first (ties by name); a figure may sit in more than one series (a collab). */
function bySeries(): Map<string, Figure[]> {
  if (memo) return memo;
  const figs = getFigures();
  memo = new Map(SERIES.map((s) => [s.slug, figs.filter((f) => s.re.test(f.name)).sort((a, b) => storeCount(b) - storeCount(a) || a.name.localeCompare(b.name))]));
  return memo;
}

export const figuresOfSeries = (slug: string): Figure[] => bySeries().get(slug) ?? [];
/** The series with enough figures for a page, biggest first. */
export const liveSeries = (): Series[] => SERIES.filter((s) => figuresOfSeries(s.slug).length >= SERIES_MIN).sort((a, b) => figuresOfSeries(b.slug).length - figuresOfSeries(a.slug).length);
/** The live series a figure belongs to (for its page's links). */
export const seriesOf = (f: Figure): Series[] => liveSeries().filter((s) => s.re.test(f.name));
