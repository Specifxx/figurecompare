// "More hobby deals from our sister sites" (DECISIONS.md "Sites that grow each other", 2026-11-02): one tile
// per hobby sister (Gunpla on Gundam Compare, WargameCompare) with its best real store deal or pre-order
// today, read at build from the committed data/family/family-cluster.json (lib/family.ts). Every region is
// in the HTML and CSS shows the visitor's (.rp-XX), like every price here; "Ships from Japan" shows the US
// tiles. One block per page; nothing when no sister has anything. Plain followed links: our own sites.
import { REGIONS } from "@/site";
import { familyTiles } from "@/lib/family";
import { FAMILY_REGIONS, blockHeading, familyMoney, tileNote, type FamilyRegion } from "@/lib/family-network";

export function FamilyCluster({ kind }: { kind: "deal" | "preorder" }) {
  const blocks = REGIONS.map((r) => {
    const fr = ((FAMILY_REGIONS as readonly string[]).includes(r.code) ? r.code : "US") as FamilyRegion;
    return { code: r.code, tiles: familyTiles(kind, fr) };
  });
  if (!blocks.some((b) => b.tiles.length)) return null;
  return (
    <section className="mt-10" aria-labelledby={`family-${kind}`}>
      <h2 id={`family-${kind}`} className="h-display text-xl">{blockHeading("hobby", kind)}</h2>
      <p className="mt-1 text-sm text-soft">Today&apos;s best store price on each of our sister sites, from their own daily price check.</p>
      {blocks.map(({ code, tiles }) => (
        <ul key={code} className={`rp rp-${code} mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2`}>
          {tiles.map(({ site, item, more }) => (
            <li key={site.id} className="sticker flex min-w-0 gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- the sister site's own hotlinked photo */}
              {item.image ? <img src={item.image} alt="" aria-hidden="true" loading="lazy" className="h-16 w-14 shrink-0 object-contain" /> : null}
              <div className="min-w-0 text-sm">
                <p className="text-xs uppercase tracking-wide text-soft">{site.topic} · {site.name}</p>
                <a href={item.url} rel="noopener" className="line-clamp-2 font-semibold hover:underline">{item.title}</a>
                <p>
                  <span className="font-bold tabular-nums">{familyMoney(item.cents, item.currency)}</span> <span className="text-soft">at {item.store}</span>
                </p>
                <p className="text-xs text-soft">{tileNote(item)}</p>
                {more ? <a href={more} rel="noopener" className="text-xs underline">More on {site.name}</a> : null}
              </div>
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
