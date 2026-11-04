import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/content/blog";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { PageHead } from "@/components/Section";
import { niceDate } from "@/lib/format";
import { Crumbs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Figure price blog: trends, lines and what a figure costs where",
  description: "Posts written around the day's figure prices: which lines are growing, what a Nendoroid, figma or POP UP PARADE costs in each region, and where the market is heading.",
  alternates: { canonical: "/blog" },
};

export default function Blog() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <Crumbs items={[{ name: "Blog", path: "/blog" }]} />
      <PageHead title="The figure price blog" sub="Questions the prices answer, written around the day's store prices. Every number comes from the same daily check as the product pages." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link prefetch={false} href={`/blog/${p.slug}`} className="sticker group flex h-full flex-col overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image.src} alt={p.image.alt} width={1200} height={630} loading="lazy" decoding="async" className="aspect-[1200/630] w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs text-soft">{niceDate(p.date)}</p>
                <h2 className="h-display mt-1.5 text-xl leading-snug group-hover:text-pink-deep">{p.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-soft">{p.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <EbayStrip className="mt-10" placement="blog_index" queries={SITE_QUERIES} />
    </div>
  );
}
