import type { Metadata } from "next";
import Link from "next/link";
import { LINES, REGIONS, SITE } from "@/site";
import { figuresOfLine, getFigures, getMeta, popular } from "@/lib/data";
import { money } from "@/lib/format";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { PageHead } from "@/components/Section";
import { pctText, regionStats, reportMonth, typicalPrice } from "@/lib/price-report";

// The self-updating monthly price report (DECISIONS.md, "Self-updating price report", 2026-11-02): prerendered at
// the daily build from that day's prices, one URL kept for good. What outreach offers figure writers to quote.
export function generateMetadata(): Metadata {
  const month = reportMonth(getMeta()?.updatedAt);
  return {
    title: `Anime figure price report, ${month}: Nendoroid, figma, POP UP PARADE`,
    description: "How much the same Nendoroid, figma or POP UP PARADE costs from store to store this month, region by region, and what a typical figure of each line costs. Free to cite.",
    alternates: { canonical: "/price-report" },
  };
}

export default function PriceReport() {
  const figures = getFigures();
  const meta = getMeta();
  const month = reportMonth(meta?.updatedAt);
  const asOf = meta?.updatedAt ? new Date(meta.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : null;
  const regions = REGIONS.map((r) => ({ r, s: regionStats(figures, r.code) })).filter((x) => x.s.orderable > 0);
  const citation = `${SITE.name}, "Anime figure price report, ${month}", ${SITE.url}/price-report`;
  return (
    <div className="mx-auto max-w-4xl px-4">
      <PageHead
        title={`Anime figure price report, ${month}`}
        sub={<>The same figure, matched by its barcode, at real figure stores in each region: how far apart the stores are, and what a typical figure costs.{asOf ? ` Last updated ${asOf}.` : ""} Free to quote with a link.</>}
      />
      <section>
        <h2 className="h-display text-xl">How much stores differ, by region</h2>
        <div className="sticker mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-soft">
              <tr><th className="px-3 py-2">Region</th><th className="px-3 py-2 text-right">Stores</th><th className="px-3 py-2 text-right">Figures on sale</th><th className="px-3 py-2 text-right">Typical gap</th><th className="px-3 py-2 text-right">10%+ apart</th></tr>
            </thead>
            <tbody>
              {regions.map(({ r, s }) => (
                <tr key={r.code} className="border-t border-black/10">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.stores}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.orderable.toLocaleString("en-GB")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pctText(s.medianGap)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pctText(s.gap10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-soft">&ldquo;Typical gap&rdquo;: for figures two or more stores sell (in stock or on pre-order), the median difference between the cheapest and the dearest store, as a share of the dearest. &ldquo;10%+ apart&rdquo;: how many of those the cheapest store sells at least 10% under the dearest. Item prices before shipping, in each region&apos;s own currency.</p>
      </section>
      <section className="mt-10">
        <h2 className="h-display text-xl">What a typical figure costs</h2>
        <p className="mt-1 text-sm text-soft">The median of each figure&apos;s cheapest store price, by line.</p>
        <div className="sticker mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase text-soft">
              <tr><th className="px-3 py-2">Line</th>{regions.map(({ r }) => <th key={r.code} className="px-3 py-2 text-right">{r.code}</th>)}</tr>
            </thead>
            <tbody>
              {LINES.map((l) => {
                const list = figuresOfLine(l.key);
                return (
                  <tr key={l.key} className="border-t border-black/10">
                    <td className="px-3 py-2"><Link prefetch={false} className="underline" href={`/${l.key}`}>{l.name}</Link></td>
                    {regions.map(({ r }) => { const t = typicalPrice(list, r.code); return <td key={r.code} className="px-3 py-2 text-right tabular-nums">{t == null ? "—" : money(t, r.code)}</td>; })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="sticker mt-10 p-5">
        <h2 className="h-display text-xl">Quote this report</h2>
        <p className="mt-1 text-sm">You&apos;re welcome to use any number here in an article, video or post, with a link to this page. It updates itself, so the link stays current.</p>
        <p className="mt-3 rounded bg-black/5 p-2 font-mono text-xs">{citation}</p>
        <p className="mt-3 text-sm"><Link prefetch={false} className="underline" href="/widgets">Free price links for your site →</Link></p>
      </section>
      <EbayStrip className="mt-10" placement="price_report" queries={SITE_QUERIES} figures={popular(30)} />
    </div>
  );
}
