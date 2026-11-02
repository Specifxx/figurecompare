import Link from "next/link";
import { LINES, SISTER_SITES, SITE } from "@/site";
import { LogoMark } from "./Logo";

export function Footer({ updated }: { updated?: string | null }) {
  return (
    <footer className="relative mt-16 border-t border-line bg-card pt-10 text-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="h-display text-lg">FigureCompare</span>
          </div>
          <p className="mt-2 text-soft">
            Nendoroid, figma and POP UP PARADE prices from real figure stores, matched by barcode and checked every day.
          </p>
          {updated && <p className="mt-2 text-xs text-soft">Prices updated {updated}.</p>}
        </div>
        <div>
          <h2 className="h-display mb-2 text-base">Figures</h2>
          <ul className="space-y-1">
            {LINES.map((l) => (
              <li key={l.key}>
                <Link prefetch={false} href={`/${l.key}`} className="hover:text-pink-deep">
                  {l.name} prices
                </Link>
              </li>
            ))}
            <li><Link prefetch={false} href="/deals" className="hover:text-pink-deep">Figure deals today</Link></li>
            <li><Link prefetch={false} href="/black-friday" className="hover:text-pink-deep">Black Friday figure deals</Link></li>
            <li><Link prefetch={false} href="/preorders" className="hover:text-pink-deep">Figure pre-orders</Link></li>
            <li><Link prefetch={false} href="/stores" className="hover:text-pink-deep">Where to buy anime figures</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="h-display mb-2 text-base">FigureCompare</h2>
          <ul className="space-y-1">
            <li><Link prefetch={false} href="/about" className="hover:text-pink-deep">About &amp; how matching works</Link></li>
            <li><Link prefetch={false} href="/forum" className="hover:text-pink-deep">Community forum (beta)</Link></li>
            <li><Link prefetch={false} href="/price-report" className="hover:text-pink-deep">Monthly figure price report</Link></li>
            <li><Link prefetch={false} href="/widgets" className="hover:text-pink-deep">Free price links for your site</Link></li>
            <li><Link prefetch={false} href="/disclosure" className="hover:text-pink-deep">Affiliate disclosure</Link></li>
            <li><Link prefetch={false} href="/privacy" className="hover:text-pink-deep">Privacy</Link></li>
            <li><Link prefetch={false} href="/terms" className="hover:text-pink-deep">Terms</Link></li>
            <li><Link prefetch={false} href="/contact" className="hover:text-pink-deep">Contact us</Link></li>
            <li><Link prefetch={false} href="/stores#suggest" className="hover:text-pink-deep">Suggest a store</Link></li>
            <li><a href={`mailto:${SITE.email}`} className="hover:text-pink-deep">{SITE.email}</a></li>
          </ul>
        </div>
        <div>
          <h2 className="h-display mb-2 text-base">More price comparison</h2>
          <ul className="space-y-1">
            {SISTER_SITES.map((s) => (
              <li key={s.url}>
                <a href={s.url} className="hover:text-pink-deep">
                  {s.anchor} · {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-soft">
        <p>
          Some links earn us a small commission at no cost to you; they never change the order of prices. Prices and stock change fast: the store&apos;s page is always right.
        </p>
        <p className="mt-1">
          FigureCompare is a fan-made price guide, not affiliated with Good Smile Company, Max Factory or any store. Product names and photos belong to their owners.
        </p>
      </div>
    </footer>
  );
}
