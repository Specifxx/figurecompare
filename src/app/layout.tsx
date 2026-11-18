import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { ShareArrival } from "@/components/ShareArrival";
import "./globals.css";
// The cart list's styles (components/cart): imported here, never from a component, so node tests can load them.
import "@/components/cart/cart.css";
import "@/components/cart/cart-drawer.css";
import "@/components/site-reviews/site-reviews.css";
import { SITE } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { Header } from "@/components/Header";
import { HolidayStrip } from "@/components/HolidayStrip";
import { Footer } from "@/components/Footer";
import { SideNav } from "@/components/SideNav";
import { QuickView } from "@/components/QuickView";
import { RateCard } from "@/components/site-reviews/RateCard";
import { EbayNavBox } from "@/components/EbayStrip";
import { headerMenus, navGroups } from "@/lib/nav";
import { menuFacts } from "@/lib/menu-facts";
import { liveSeries } from "@/lib/series";
import { getMeta, lineCounts } from "@/lib/data";
import { niceDate } from "@/lib/format";
import { CHRISTMAS_FESTIVE_LAYER, SEASON_BOOT_SCRIPT } from "@/lib/season";
import { BottomNav } from "@/components/BottomNav";
import { BOTTOM_NAV } from "@/lib/bottom-nav";


// Fonts (2026-11-18, "Speed up sites on mobile"): the latin files of the same variable fonts, bundled through next/font
// (OFL, src/app/fonts) instead of @fontsource's CSS. next/font preloads them and draws the first paint in a fallback
// sized to match, and display "optional" never swaps a face in after the text is laid out: with @fontsource's swap,
// the text re-wrapped when the font landed and moved everything below it (Lighthouse mobile layout shift 0.07 to 0.13,
// live). The DexCompare engine made the same choice for the same reason (MTG Compare measured 0.209 with swap).
const inter = localFont({ src: "./fonts/Inter-latin.woff2", weight: "100 900", style: "normal", display: "optional", variable: "--font-inter", adjustFontFallback: "Arial" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", locale: "en" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { color: "#0e0e12" },
  ],
};

// Runs before paint: the visitor's saved region (else one guessed from their
// time zone) and theme, so the right prices show with no flash and no cookie.
const zones = JSON.stringify(ACTIVE_REGIONS.map((r) => [r.code, r.zones]));
const BOOT = `(function(){var d=document.documentElement;try{var r=localStorage.getItem("fc-region");if(!r){var z=Intl.DateTimeFormat().resolvedOptions().timeZone||"",b="US",l=0;${zones}.forEach(function(e){e[1].forEach(function(p){if(z.indexOf(p)===0&&p.length>l){b=e[0];l=p.length}})});r=b}d.dataset.region=r;var t=localStorage.getItem("fc-theme");d.dataset.theme=t==="day"?"day":"night"}catch(e){d.dataset.region="US"}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  const groups = navGroups(
    lineCounts(),
    liveSeries()
      .slice(0, 8)
      .map((x) => ({ slug: x.slug, name: x.name })),
  );
  return (
    <html className={`${inter.variable}`} lang="en" data-theme="night" data-festive={CHRISTMAS_FESTIVE_LAYER ? "on" : undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT + SEASON_BOOT_SCRIPT }} />
        {/* Impact (affiliate network) site check, in the exact form Impact gives: a `value` attribute. */}
        <meta {...({ name: "impact-site-verification", value: "9ae35991-78aa-4f7c-af7a-cf140e3ff2b0" } as object)} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-1">
          Skip to content
        </a>
        <Header groups={groups} menus={headerMenus(groups, menuFacts())} />
        <HolidayStrip />
        {/* From xl the left side of a wide screen is the sidebar; the pages keep their own width. */}
        <div className="mx-auto flex max-w-[1440px]">
          <SideNav groups={groups} footer={<EbayNavBox placement="sidebar" />} />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
        <Footer updated={meta ? niceDate(meta.updatedAt) : null} />
        <QuickView />
        {/* Rate us (owner, 2026-11-03): the corner card, asking only after real use; RiftCompare keeps the ratings. */}
        <RateCard />
        <Analytics />
        <ShareArrival />
        {/* The phone bottom nav (components/BottomNav.tsx, lib/bottom-nav.ts): browser only, phones only, BOTTOM_NAV is its switch. */}
        {BOTTOM_NAV !== "off" && <BottomNav mode={BOTTOM_NAV} />}
      </body>
    </html>
  );
}
