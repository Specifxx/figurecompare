import type { Metadata } from "next";
import Link from "next/link";
import { EbayStrip, lineQueries } from "@/components/EbayStrip";
import { PageHead } from "@/components/Section";
import { figuresOfSeries, liveSeries } from "@/lib/series";

export const metadata: Metadata = {
  title: "Anime figures by series: Nendoroid, figma & POP UP PARADE prices",
  description: "Every anime and game series with enough figures to compare: Hatsune Miku, hololive, Fate, Jujutsu Kaisen and more, priced across real figure stores.",
  alternates: { canonical: "/series" },
};

export default function SeriesIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead title="Figures by series" sub={<p>Every series with enough Nendoroid, figma and POP UP PARADE figures to compare, most figures first.</p>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liveSeries().map((s) => (
          <Link prefetch={false} key={s.slug} href={`/series/${s.slug}`} className="sticker block p-4 hover:border-pink">
            <p className="font-display text-lg font-semibold">{s.name}</p>
            <p className="mt-1 text-sm text-soft">
              {figuresOfSeries(s.slug).length} figures · {s.about}
            </p>
          </Link>
        ))}
      </div>
      <EbayStrip className="mt-10" placement="series_index" queries={lineQueries("Nendoroid")} />
    </div>
  );
}
