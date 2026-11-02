import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ShareArrival } from "@/components/ShareArrival";
import "@fontsource-variable/inter";
import "./globals.css";
import { SITE } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SideNav } from "@/components/SideNav";
import { QuickView } from "@/components/QuickView";
import { EbayNavBox } from "@/components/EbayStrip";
import { navGroups } from "@/lib/nav";
import { getMeta, lineCounts } from "@/lib/data";
import { niceDate } from "@/lib/format";
import { SEASON_BOOT_SCRIPT } from "@/lib/season";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", locale: "en" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a122e" },
  ],
};

// Runs before paint: the visitor's saved region (else one guessed from their
// time zone) and theme, so the right prices show with no flash and no cookie.
const zones = JSON.stringify(ACTIVE_REGIONS.map((r) => [r.code, r.zones]));
const BOOT = `(function(){var d=document.documentElement;try{var r=localStorage.getItem("fc-region");if(!r){var z=Intl.DateTimeFormat().resolvedOptions().timeZone||"",b="US",l=0;${zones}.forEach(function(e){e[1].forEach(function(p){if(z.indexOf(p)===0&&p.length>l){b=e[0];l=p.length}})});r=b}d.dataset.region=r;var t=localStorage.getItem("fc-theme");d.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"night":"day")}catch(e){d.dataset.region="US"}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();
  const groups = navGroups(lineCounts());
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT + SEASON_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-1">
          Skip to content
        </a>
        <Header groups={groups} />
        {/* From xl the left side of a wide screen is the sidebar; the pages keep their own width. */}
        <div className="mx-auto flex max-w-[1440px]">
          <SideNav groups={groups} footer={<EbayNavBox placement="sidebar" />} />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
        <Footer updated={meta ? niceDate(meta.updatedAt) : null} />
        <QuickView />
        <Analytics />
        <ShareArrival />
      </body>
    </html>
  );
}
