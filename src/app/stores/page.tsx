import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { STORES } from "@/content/stores";
import { activeStores } from "@/lib/data";
import { storeUrl } from "@/lib/affiliate";
import { PageHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "Where to buy anime figures online",
  description: "The real figure stores FigureCompare checks every day, by region: specialist anime shops and hobby stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore.",
  alternates: { canonical: "/stores" },
};

export default function Stores() {
  const counts = activeStores();
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        emoji="🏪"
        title="Where to buy anime figures"
        sub="Every store we check, by region. Real shops only: no open marketplaces, where bootleg figures hide. Know a store we should add? Tell us via the about page."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REGIONS.map((r) => {
          const list = STORES.filter((s) => s.region === r.code).sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
          if (!list.length) return null;
          return (
            <section key={r.code} className="sticker p-4">
              <h2 className="h-display mb-2 text-xl">
                {r.flag} {r.name}
              </h2>
              <ul className="space-y-1 text-sm">
                {list.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <a href={storeUrl(s.id, s.base)} rel="nofollow noopener" target="_blank" className="font-semibold hover:text-pink-deep">
                      {s.name}
                    </a>
                    <span className="text-soft">{(counts[s.id] ?? 0).toLocaleString("en-US")} figures</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
