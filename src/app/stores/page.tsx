import { Flag } from "@/components/Flag";
import type { Metadata } from "next";
import { REGIONS } from "@/site";
import { STORES } from "@/content/stores";
import { activeStores, getMeta, popular } from "@/lib/data";
import { storeUrl } from "@/lib/affiliate";
import { PageHead } from "@/components/Section";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { SuggestStore } from "@/components/ReportForms";

export const metadata: Metadata = {
  title: "Where to buy anime figures online",
  description: "The real figure stores FigureCompare checks every day, by region: specialist anime shops and hobby stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore.",
  alternates: { canonical: "/stores" },
};

/**
 * Big figure stores we don't compare, and why (Reddit, r/Nendoroid, 2026-11-07: "Curious why GoodSmile Global, US and
 * others aren't compared? And I didn't notice AmiAmi or BigBadToys"). From the 2026-11-06 store check; Good Smile Global came
 * back that day and is read now. A store leaves this list once it has a figure on the site.
 */
const NOT_YET: { id?: string; name: string; why: string }[] = [
  { name: "AmiAmi", why: "Its shop is drawn by a private API behind bot protection. We never work around a store's protection." },
  { name: "Good Smile Europe", why: "Its public product feed lists almost nothing and has no barcodes." },
  { name: "Entertainment Earth", why: "Its pages block automated price checks." },
  { name: "Crunchyroll Store", why: "Its pages block automated price checks." },
  { name: "Tokyo Otaku Mode", why: "No product feed and no barcodes on its pages." },
  { name: "Archonia", why: "Its product pages show no barcode, and its titles carry no catalogue number, so a price can't be tied to one figure for sure." },
];

export default function Stores() {
  const counts = activeStores();
  const meta = getMeta();
  const total = Object.values(counts).filter((n) => n > 0).length;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        emoji="🏪"
        title="Where to buy anime figures"
        sub="Every store we check, by region. Real shops only: no open marketplaces, where bootleg figures hide. Know a store we should add? Suggest it below."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REGIONS.map((r) => {
          // Only stores with a figure on the site today; the rest are still
          // read every day and appear once they stock one of our lines.
          const list = STORES.filter((s) => s.region === r.code && (counts[s.id] ?? 0) > 0).sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
          if (!list.length) return null;
          return (
            <section key={r.code} className="sticker p-4">
              <h2 className="h-display mb-2 text-xl">
                <Flag code={r.code} /> {r.name}
              </h2>
              <ul className="space-y-1 text-sm">
                {list.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <a href={storeUrl(s.id, s.base)} rel="nofollow noopener" target="_blank" className="font-semibold hover:text-pink-deep">
                      {s.name}
                    </a>
                    <span className="shrink-0 whitespace-nowrap text-soft">{counts[s.id].toLocaleString("en-US")} figure{counts[s.id] === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-soft">
        {total} stores have a figure on the site today.{" "}
        {meta ? <>Every store was last checked {new Date(meta.updatedAt).toLocaleString("en-US", { timeZone: "UTC", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} UTC. </> : null}
        Japan stores (HobbyLink Japan, Good Smile Global) are shown on every region&apos;s figure pages under &ldquo;Or import from Japan&rdquo;, converted from yen.
      </p>
      <section className="mt-10">
        <h2 className="h-display mb-1 text-2xl">Stores we can&apos;t compare yet</h2>
        <p className="mb-2 text-sm text-soft">Big names you might expect, and the honest reason they&apos;re missing. Check them yourself before you buy.</p>
        <ul className="sticker divide-y divide-line p-0 text-sm">
          {NOT_YET.filter((n) => !(counts[n.id ?? ""] > 0)).map((n) => (
            <li key={n.name} className="px-4 py-3">
              <b>{n.name}</b>
              <span className="block text-soft">{n.why}</span>
            </li>
          ))}
        </ul>
      </section>
      <section id="suggest" className="mt-10">
        <h2 className="h-display mb-1 text-2xl">Suggest a store</h2>
        <p className="mb-2 text-sm text-soft">A real figure shop we don&apos;t check yet? We look at every suggestion and add the store if it lists barcodes we can read (BigBadToyStore, which prints none, is matched by Nendoroid and figma catalogue number instead). Store owners welcome: listing is free.</p>
        <SuggestStore regions={REGIONS.map((r) => [r.code, r.name])} what="figures" buttonClassName="btn-pop bg-pink text-white" />
      </section>
      <EbayStrip className="mt-10" placement="stores" queries={SITE_QUERIES} figures={popular(30)} title="Figures on eBay" />
    </div>
  );
}
