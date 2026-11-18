import type { Metadata } from "next";
import { LINES, SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export const metadata: Metadata = {
  title: "About FigureCompare: who runs it and how matching works",
  description: "FigureCompare is run by two people, Bill and George. How we match figure prices by barcode, how the site is paid for and what it costs to run.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="flex items-end gap-4">
        <PageHead title="About FigureCompare" sub="Who runs it, how prices are matched, and how it is paid for." />
      </div>
      <Prose>
        <p>
          FigureCompare checks real figure stores every day and shows you every store&apos;s price for the same figure, side by side, in your own currency. Today it covers {LINES.map((l) => l.name).join(", ")}.
        </p>
        <h2>How a figure is matched</h2>
        <p>
          Every figure in a box carries a 13-digit JAN barcode. We match store listings <strong>only</strong> by that barcode. A listing that does not show one is left out, never guessed from its title, because figures come in look-alike versions: re-releases, store exclusives, &quot;Ver. 2.0&quot; and, sadly, bootlegs. Pre-owned, damaged-box and bundle listings are left out too.
        </p>
        <p>A figure gets a page once at least two stores in one region sell it. Comparing one shop is not a comparison.</p>
        <h2>Which stores</h2>
        <p>
          Specialist anime and hobby shops that sell new, official product. No open marketplaces in the store list. eBay and Amazon appear above the store prices as clearly labelled marketplace links, never as &quot;the cheapest store&quot;.
        </p>
        <h2>Prices and currencies</h2>
        <p>
          Each region shows prices in its own currency, exactly as the store lists them. We never convert currencies. Prices exclude shipping, tax and import charges, which depend on where you live.
        </p>
        <h2>How the site is paid for</h2>
        <p>
          Some links (eBay, Amazon and stores that run an affiliate program) pay us a small commission if you buy, at no cost to you. That never changes the order: stores are always sorted by price. See the <a href="/disclosure">affiliate disclosure</a>.
        </p>
        <h2>The people behind it</h2>
        <p>
          FigureCompare is run by its two co-founders, Bill and George. It is independent: no store, maker or investor owns any part of it. We lean on AI tools to help write the site&apos;s code and draft its guides, and read every guide before it goes up. The prices are never typed in: a program reads them from each store and keeps a listing only when its barcode matches.
        </p>
        <h2>What it costs to run</h2>
        <p>
          FigureCompare runs on the same servers and daily jobs as a few other price sites we look after. All together they cost about A$790 a month (our own books, 30 days to 15 November 2026), which the commission above pays for. No store pays to appear.
        </p>
        <h2>Spotted a mistake? Want a store added?</h2>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </Prose>
      <EbayStrip className="mt-10" placement="about" queries={SITE_QUERIES} />
    </div>
  );
}
