import type { Metadata } from "next";
import { LINES } from "@/site";
import { Mascot } from "@/components/Mascot";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "About FigureCompare and how matching works",
  description: "How FigureCompare compares anime figure prices: barcode matching, real stores only, daily checks, and how the site is paid for.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="flex items-end gap-4">
        <PageHead title="About FigureCompare" sub="A price guide for figure collectors, made by fans of the hobby." />
        <Mascot size={110} className="hidden shrink-0 sm:block" mood="wow" />
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
        <h2>Spotted a mistake? Want a store added?</h2>
        <p>
          Email <a href="mailto:hello@figurecompare.com">hello@figurecompare.com</a>. FigureCompare is part of a family of price comparison sites, linked at the bottom of every page.
        </p>
      </Prose>
    </div>
  );
}
