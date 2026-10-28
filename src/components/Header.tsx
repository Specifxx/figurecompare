import Link from "next/link";
import { LINES } from "@/site";
import { Logo } from "./Logo";
import { RegionPicker } from "./RegionPicker";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  ...LINES.map((l) => ({ href: `/${l.key}`, label: l.name, emoji: l.emoji })),
  { href: "/deals", label: "Deals", emoji: "💸" },
  { href: "/preorders", label: "Pre-orders", emoji: "📅" },
  { href: "/new", label: "New", emoji: "✨" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-bg/85 backdrop-blur">
      <div className="ribbon h-1.5 w-full" aria-hidden />
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" prefetch={false} className="shrink-0" aria-label="FigureCompare home">
          <Logo />
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RegionPicker compact />
          <ThemeToggle />
        </div>
      </div>
      <div className="px-4 pb-2 md:hidden">
        <SearchBox />
      </div>
      <nav aria-label="Sections" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        <ul className="flex gap-1.5 whitespace-nowrap">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link prefetch={false} href={n.href} className="chip border-2 border-line bg-card px-3 py-1 text-sm text-ink transition hover:-translate-y-0.5 hover:border-pink hover:bg-pink-pale">
                <span aria-hidden>{n.emoji}</span> {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
