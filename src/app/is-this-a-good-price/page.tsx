import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { LinkChecker } from "@/components/LinkChecker";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { popular } from "@/lib/data";

// /is-this-a-good-price (2026-11-08): paste a store link, see how its price compares with every store we read in that store's
// region. Prerendered at the release's build like every page; the checker is a client island that fetches the store's static
// /check/<host> file. The copy and FAQ are in the HTML.
export const metadata: Metadata = {
  title: "Is this a good price? Figure price checker",
  description: `Paste a store's link to a Nendoroid, figma or POP UP PARADE figure and see if it's a good price against every store ${SITE.name} compares. Free, no sign-up.`,
  alternates: { canonical: "/is-this-a-good-price" },
};

const STEPS = [
  "Copy the address of the store's product page (in a phone browser: Share, then Copy).",
  "Paste it into the box. The checker looks it up straight away.",
  "Read the verdict and the cheapest and median in-stock prices beside it.",
  "If the page shows a different price now, type it to check again.",
];

const FAQ = [
  { q: "Which links does it work with?", a: `Product pages at any store ${SITE.name} reads: it compares the price with the other stores in that store's country. For Amazon, eBay, marketplaces and stores we don't read, it offers a search of our prices with the link's words.` },
  { q: "Do you open the page I paste?", a: "No. The checker only reads the store's address and the product's part of the link, then looks it up in the listings we already read from that store every day." },
  { q: "Why is the store's price different from the page?", a: "We read each store once a day, so a price can change in between. Type the price the page shows now and the verdict updates." },
  { q: "What counts as a good price?", a: "The cheapest in-stock store price we found, or within 1% of it. Under the median (the middle in-stock store price) is fair; about the median is typical; above it, you can usually pay less elsewhere. Amazon, eBay and partner retailers are not counted as stores here." },
  { q: "Does it include shipping?", a: "No. Every price is the store's own item price before shipping, the way the rest of the site compares them. The product page shows delivery where we know it." },
];

export default function Page() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <PageHead title="Is this a good price?" sub="Paste the link to a Nendoroid, figma or POP UP PARADE figure at any store and see how its price compares with the cheapest and the typical in-stock price at every other store we read." />
      <LinkChecker />
      <section className="mt-10">
        <h2 className="text-xl font-semibold">How to use it</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-soft">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Questions</h2>
        <dl className="mt-3 space-y-4">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-soft">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="mt-8 text-sm text-soft">
        Want the cheapest right now? <Link href="/deals" prefetch={false} className="font-semibold text-pink-deep hover:underline">Today’s deals</Link> list products well under other stores’ prices.
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <EbayStrip className="mt-10" placement="price-check" queries={SITE_QUERIES} figures={popular(30)} title="Figures on eBay" />
    </div>
  );
}
