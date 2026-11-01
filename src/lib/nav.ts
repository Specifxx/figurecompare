// Every place the site goes, grouped the way a buyer looks: which line, where
// the value is, and the rest. The desktop sidebar (components/SideNav.tsx, xl
// and up) and the phone menu (components/MobileMenu.tsx) draw this one list,
// so the two never disagree (owner, 2026-10-28: the DexCompare / MTG Compare
// navigation on every new site). Static links to pages that exist.
// No data import here: the client menus import isActive from this file.
import { LINES, type LineKey } from "@/site";

export type NavItem = { href: string; label: string; emoji: string; count?: number };
export type NavGroup = { title: string; links: NavItem[] };

export function navGroups(counts: Record<LineKey, number>): NavGroup[] {
  return [
    { title: "Figure lines", links: LINES.map((l) => ({ href: `/${l.key}`, label: l.name, emoji: l.emoji, count: counts[l.key] })) },
    {
      title: "Deals & stock",
      links: [
        { href: "/deals", label: "Deals", emoji: "💸" },
        { href: "/preorders", label: "Pre-orders", emoji: "📅" },
        { href: "/new", label: "New arrivals", emoji: "✨" },
      ],
    },
    {
      title: "More",
      links: [
        { href: "/search", label: "Search", emoji: "🔍" },
        { href: "/stores", label: "Where to buy", emoji: "🏪" },
        { href: "/forum", label: "Community forum", emoji: "💬" },
        { href: "/about", label: "About", emoji: "💌" },
        { href: "/disclosure", label: "How we make money", emoji: "🪙" },
      ],
    },
  ];
}

/** The current page is this link, or inside it ("/nendoroid/page/2" is in Nendoroid). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
