import Link from "next/link";
import { Logo } from "./Logo";
import { RegionPicker } from "./RegionPicker";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";
import { EbayNavBox } from "./EbayStrip";
import { CartHeaderLink } from "./cart/CartHeaderLink";
import { HeaderMenus } from "./HeaderMenus";
import type { HeaderMenu, NavGroup } from "@/lib/nav";


export function Header({ groups, menus }: { groups: NavGroup[]; menus: HeaderMenu[] }) {
  const links = (t: string) => groups.find((g) => g.title === t)?.links ?? [];
  const quick = [...links("Figure lines"), ...links("Series & characters").filter((l) => l.href === "/series" || l.href === "/characters"), ...links("Deals & stock").filter((l) => ["/deals", "/preorders", "/new"].includes(l.href))];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 xl:max-w-[1440px]">
        <Link href="/" prefetch={false} className="shrink-0" aria-label="FigureCompare home">
          <Logo wordmark="hidden min-[400px]:inline" />
        </Link>
        <HeaderMenus menus={menus} />
        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RegionPicker compact />
          <ThemeToggle />
          {/* The cart list (components/cart, owner 2026-11-06); below md it sits beside the search. */}
          <CartHeaderLink className="hidden text-soft hover:text-ink md:inline-flex" />
          <MobileMenu groups={groups} footer={<EbayNavBox placement="menu" />} />
        </div>
      </div>
      <div className="flex items-center gap-1 px-4 pb-2 md:hidden">
        <div className="min-w-0 flex-1">
          <SearchBox />
        </div>
        <CartHeaderLink className="shrink-0 text-soft hover:text-ink md:hidden" />
      </div>
      {/* Below lg the quick chips (the lines, then series and characters, how a collector looks, drawn from the same groups); from lg the header menus carry them. */}
      <nav aria-label="Sections" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:hidden">
        <ul className="flex gap-1.5 whitespace-nowrap">
          {quick.map((n) => (
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
