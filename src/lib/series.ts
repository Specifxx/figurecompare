import { SERIES, seriesIsLive, type Series } from "@/content/series";
import { getFigures, getPageState, storeCount } from "./data";
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
/** The series with enough figures for a page, biggest first. A hub that had a page yesterday keeps it down to
 *  SERIES_KEEP figures (content/series.ts seriesIsLive), so a hub at the line does not 404 one day and return the next. */
export const liveSeries = (): Series[] => {
  const was = new Set(getPageState()?.series ?? []);
  return SERIES.filter((s) => seriesIsLive(figuresOfSeries(s.slug).length, was.has(s.slug))).sort((a, b) => figuresOfSeries(b.slug).length - figuresOfSeries(a.slug).length);
};
/** The live series a figure belongs to (for its page's links). */
export const seriesOf = (f: Figure): Series[] => liveSeries().filter((s) => s.re.test(f.name));
