import Link from "next/link";
import { LINE_BY_KEY, REGIONS, type RegionCode } from "@/site";
import { bestIn, spreadIn } from "@/lib/data";
import { money, pct } from "@/lib/format";
import type { Figure } from "@/lib/types";
import { FigureImage } from "./FigureImage";

const TINTS = ["bg-pink-pale", "bg-lilac-pale", "bg-sky-pale", "bg-mint-pale", "bg-lemon-pale"];

/** A figure card. With `region` it shows that region's price only (lists
 *  already split by region); without, every region's, switched by CSS. */
export function FigureTile({ f, i = 0, region }: { f: Figure; i?: number; region?: RegionCode }) {
  const line = LINE_BY_KEY[f.line];
  const regions = region ? REGIONS.filter((r) => r.code === region) : REGIONS;
  const cls = (code: RegionCode) => (region ? "" : `rp rp-${code}`);
  return (
    <Link prefetch={false} href={`/figure/${f.slug}`} className="sticker tile-hover group flex flex-col overflow-hidden">
      <div className={`relative aspect-square ${TINTS[i % TINTS.length]}`}>
        <FigureImage src={f.img} alt={f.name} line={f.line} className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
        <span className="chip absolute left-2 top-2 border-2 border-ink bg-card text-ink">
          {line.emoji} {line.name}
          {f.number ? ` ${f.number}` : ""}
        </span>
        {regions.map((r) => {
          const s = spreadIn(f, r.code);
          return s != null && s >= 0.1 ? (
            <span key={r.code} className={`${cls(r.code)} absolute bottom-2 right-2`}>
              <span className="chip rotate-6 border-2 border-ink bg-lemon text-ink shadow-popsm">save {pct(s)}!</span>
            </span>
          ) : null;
        })}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{f.name}</h3>
        <div className="mt-auto text-sm">
          {regions.map((r) => {
            const b = bestIn(f, r.code);
            return (
              <p key={r.code} className={cls(r.code)}>
                {b ? (
                  <>
                    <span className="font-display text-lg font-bold text-pink-deep">{money(b.offer.p, r.code)}</span>
                    <span className="ml-1 text-xs text-soft">
                      {b.offer.st === "pre" ? "pre-order" : "in stock"} · {b.stores} store{b.stores === 1 ? "" : "s"}
                    </span>
                  </>
                ) : f.offers[r.code]?.length ? (
                  <span className="text-xs text-soft">Sold out {r.phrase} (｡•́︿•̀｡)</span>
                ) : (
                  <span className="text-xs text-soft">Not sold {r.phrase} yet</span>
                )}
              </p>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

export function TileGrid({ figures, region }: { figures: Figure[]; region?: RegionCode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {figures.map((f, i) => (
        <FigureTile key={f.jan} f={f} i={i} region={region} />
      ))}
    </div>
  );
}
