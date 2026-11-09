// What the header menus list, from data already loaded (no new read): each link tagged with the markets that have figures behind it,
// so a visitor is never sent to an empty page (Bill, 2026-11-09). Server-side; lib/nav.ts is the pure client-safe half.
import { LINES } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { figuresOfLine, regionsOf } from "@/lib/data";
import { liveSeries, figuresOfSeries } from "@/lib/series";
import { liveCharacters, figuresOfCharacter } from "@/lib/characters";
import type { MenuFacts } from "@/lib/nav";
import type { Figure } from "@/lib/types";

/** The markets with at least one of these figures; undefined when that is every market the site serves (no class needed). */
export function marketsOf(list: Figure[]): string[] | undefined {
  const have = new Set<string>();
  for (const f of list) for (const r of regionsOf(f)) have.add(r);
  const out = ACTIVE_REGIONS.map((r) => r.code as string).filter((c) => have.has(c));
  return out.length === ACTIVE_REGIONS.length ? undefined : out;
}

export function menuFacts(): MenuFacts {
  return {
    lineRegions: Object.fromEntries(LINES.map((l) => [l.key, marketsOf(figuresOfLine(l.key))])),
    series: liveSeries()
      .slice(0, 14)
      .map((x) => ({ href: `/series/${x.slug}`, label: x.name, regions: marketsOf(figuresOfSeries(x.slug)) })),
    characters: liveCharacters()
      .slice(0, 14)
      .map((c) => ({ href: `/character/${c.slug}`, label: c.name, regions: marketsOf(figuresOfCharacter(c.slug)) })),
  };
}
