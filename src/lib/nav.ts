// Every place the site goes, grouped the way a buyer looks: which line, where
// the value is, and the rest. The header mega menus (components/HeaderMenus.tsx, lg up; Bill
// 2026-11-09), the sidebar (components/SideNav.tsx, xl) and the phone menu (components/MobileMenu.tsx) draw this one list,
// so the two never disagree (owner, 2026-10-28: the DexCompare / MTG Compare
// navigation on every new site). Static links to pages that exist.
// No data import here: the client menus import isActive from this file.
import { saleStrip } from "@/lib/black-friday";
import { LINES, type LineKey } from "@/site";

export type NavItem = { href: string; label: string; emoji: string; count?: number };
export type NavGroup = { title: string; links: NavItem[] };
/** A header menu link; `regions` = the markets it has figures in (absent: every market), drawn with the engine's rp-XX classes. */
export type MenuLink = { href: string; label: string; regions?: string[] };
export type HeaderMenu = { label: string; all: { href: string; label: string }; columns: { title?: string; links: MenuLink[] }[] };
/** What the header menus list beyond the groups, filtered to figures and tagged with the markets that have them. */
export interface MenuFacts {
  lineRegions: Partial<Record<LineKey, string[]>>;
  series: MenuLink[];
  characters: MenuLink[];
}

function saleLinks(): NavItem[] {
  const s = saleStrip(new Date().toISOString().slice(0, 10));
  return s ? [{ href: s.href, label: `${s.name} deals`, emoji: "🛍️" }] : [];
}

export function navGroups(counts: Record<LineKey, number>, topSeries: { slug: string; name: string }[] = []): NavGroup[] {
  return [
    { title: "Figure lines", links: LINES.map((l) => ({ href: `/${l.key}`, label: l.name, emoji: l.emoji, count: counts[l.key] })) },
    {
      // How a collector looks once the line is picked (Bill, 2026-11-09): the franchise, then the character.
      title: "Series & characters",
      links: [
        ...topSeries.map((x) => ({ href: `/series/${x.slug}`, label: x.name, emoji: "📚" })),
        { href: "/series", label: "All series", emoji: "📚" },
        { href: "/characters", label: "All characters", emoji: "🎎" },
      ],
    },
    {
      title: "Deals & stock",
      links: [
        // Black Friday, then Cyber Monday, while the strip shows (lib/black-friday.ts saleStrip).
        ...saleLinks(),
        { href: "/deals", label: "Deals", emoji: "💸" },
        { href: "/preorders", label: "Pre-orders", emoji: "📅" },
        { href: "/new", label: "New arrivals", emoji: "✨" },
        { href: "/blog", label: "Blog", emoji: "📝" },
      ],
    },
    {
      title: "More",
      links: [
        { href: "/search", label: "Search", emoji: "🔍" },
        { href: "/stores", label: "Where to buy", emoji: "🏪" },
        { href: "/forum", label: "Community forum", emoji: "💬" },
        { href: "/creators", label: "Creators", emoji: "⭐" },
        { href: "/about", label: "About", emoji: "💌" },
        { href: "/disclosure", label: "How we make money", emoji: "🪙" },
      ],
    },
  ];
}

/**
 * The header's mega menus (components/HeaderMenus.tsx, lg up): the lines ARE the first group the sidebar and phone menu draw; series and
 * characters are the longer lists their "All ..." links reach; the last menu is the deals and site groups. A link with no figures in
 * any market is left out (regions: []).
 */
export function headerMenus(groups: NavGroup[], f: MenuFacts): HeaderMenu[] {
  const live = (l: MenuLink) => !l.regions || l.regions.length > 0;
  const key = (href: string) => href.slice(1) as LineKey;
  const lines: MenuLink[] = (groups[0]?.links ?? []).map((l) => ({ href: l.href, label: l.label, regions: f.lineRegions[key(l.href)] })).filter(live);
  const group = (title: string) => (groups.find((g) => g.title === title)?.links ?? []).map(({ href, label }) => ({ href, label }));
  return [
    { label: "Figure lines", all: { href: "/new", label: "New arrivals" }, columns: [{ title: "Nendoroid, figma and more", links: lines }] },
    { label: "Series", all: { href: "/series", label: "All series" }, columns: [{ links: f.series.filter(live) }] },
    { label: "Characters", all: { href: "/characters", label: "All characters" }, columns: [{ links: f.characters.filter(live) }] },
    { label: "Deals & more", all: { href: "/deals", label: "Deals" }, columns: [{ title: "Deals & stock", links: group("Deals & stock") }, { title: "More", links: group("More") }] },
  ];
}

/** The current page is this link, or inside it ("/nendoroid/page/2" is in Nendoroid). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
