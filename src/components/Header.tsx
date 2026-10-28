import Link from "next/link";
import { LINES } from "@/site";
import { Logo } from "./Logo";
import { RegionPicker } from "./RegionPicker";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { EbayNavBox } from "./EbayStrip";
import type { NavGroup } from "@/lib/nav";

const NAV = [
  ...LINES.map((l) => ({ href: `/${l.key}`, label: l.name, emoji: l.emoji })),
  { href: "/deals", label: "Deals", emoji: "💸" },
  { href: "/preorders", label: "Pre-orders", emoji: "📅" },
  { href: "/new", label: "New", emoji: "✨" },
];

export function Header({ groups }: { groups: NavGroup[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 xl:max-w-[1440px]">
        <Link href="/" prefetch={false} className="shrink-0" aria-label="FigureCompare home">
          <Logo />
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RegionPicker compact />
          <ThemeToggle />
          <MobileMenu groups={groups} footer={<EbayNavBox placement="menu" />} />
        </div>
      </div>
      <div className="px-4 pb-2 md:hidden">
        <SearchBox />
      </div>
      {/* Below xl the quick chips; from xl the sidebar carries them. */}
      <nav aria-label="Sections" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2 [scrollbar-width:none] xl:hidden">
        <ul className="flex gap-1.5 whitespace-nowrap">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link prefetch={false} href={n.href} className="chip border border-line bg-card px-3 py-1 text-sm text-ink transition hover:border-soft">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
