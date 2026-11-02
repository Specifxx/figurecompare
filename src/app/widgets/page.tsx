import type { Metadata } from "next";
import Link from "next/link";
import { LINES, SITE } from "@/site";
import { popular } from "@/lib/data";
import { linkBadge } from "@/lib/link-badges";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { PageHead } from "@/components/Section";

// Free link badges (DECISIONS.md, "Free link badges", 2026-11-02): what outreach offers instead of asking for a link.
// Plain HTML only, prerendered at the daily build like every page.
export const metadata: Metadata = {
  title: "Free figure price links for blogs and stores",
  description: "Free plain-HTML badges that link your readers to a Nendoroid, figma or POP UP PARADE price comparison across real figure stores. No script, no signup.",
  alternates: { canonical: "/widgets" },
};

function Snippet({ html }: { html: string }) {
  return (
    <div className="sticker mt-3 p-4">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <pre className="mt-3 overflow-x-auto rounded bg-black/5 p-3 text-xs"><code>{html}</code></pre>
    </div>
  );
}

export default function Widgets() {
  const f = popular(1)[0];
  const figureHref = `${SITE.url}/figure/${f?.slug ?? "FIGURE-SLUG"}`;
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead
        title="Free figure price links"
        sub={<>For collection blogs, unboxing reviews, club pages and figure stores: one line of HTML that sends readers to today&apos;s prices across real figure stores in their region. No script, no image, no tracking, free.</>}
      />
      <section className="mt-6">
        <h2 className="h-display text-xl">A figure you review</h2>
        <p className="mt-1 text-sm text-soft">Change the address to any figure page on {SITE.name} (the part after <code>/figure/</code>) and the text to its name.</p>
        <Snippet html={linkBadge(figureHref, `${f?.name ?? "Figure name"} prices compared on ${SITE.name}`)} />
      </section>
      <section className="mt-8">
        <h2 className="h-display text-xl">A whole figure line</h2>
        {LINES.map((l) => <Snippet key={l.key} html={linkBadge(`${SITE.url}/${l.key}`, `${l.name} prices compared on ${SITE.name}`)} />)}
      </section>
      <section className="mt-8">
        <h2 className="h-display text-xl">For stores we compare</h2>
        <p className="mt-1 text-sm text-soft">Tell customers your prices are compared openly. <Link prefetch={false} href="/stores" className="underline">Stores we read</Link>.</p>
        <Snippet html={linkBadge(`${SITE.url}/stores`, `Our figure prices are compared on ${SITE.name}`)} />
      </section>
      <EbayStrip className="mt-10" placement="widgets" queries={SITE_QUERIES} figures={popular(30)} />
    </div>
  );
}
