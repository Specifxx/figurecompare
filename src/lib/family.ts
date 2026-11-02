// This site's side of the Compare Empire network (lib/family-network.ts, DECISIONS.md "Sites that grow
// each other", 2026-11-02): the feed the daily import commits, and the cluster file it copies from the
// hobby sisters (Gunpla on Gundam Compare, WargameCompare), both in data/family/. Pages read the
// committed cluster file at build, like every other page here: no fetch at request time.
import fs from "node:fs";
import path from "node:path";
import { REGIONS, SITE, type RegionCode } from "@/site";
import { dealsIn, preordersIn, storeName } from "./data";
import { CLUSTER_FILE, FAMILY_REGIONS, pickTiles, validCluster, type FamilyFeed, type FamilyItem, type FamilyRegion, type FamilyTile } from "./family-network";

export const FAMILY_ID = "figure" as const;
export const FAMILY_DIR = path.join(process.cwd(), "data", "family");
/** The regions the network shares (FigureCompare's "Ships from Japan" is its own and stays here). */
export const FAMILY_REGION_CODES = REGIONS.map((r) => r.code).filter((c): c is RegionCode & FamilyRegion => (FAMILY_REGIONS as readonly string[]).includes(c));

let cluster: FamilyFeed[] | null = null;
export function familyFeeds(now = Date.now()): FamilyFeed[] {
  if (cluster) return cluster;
  try {
    cluster = validCluster(JSON.parse(fs.readFileSync(path.join(FAMILY_DIR, CLUSTER_FILE), "utf8")), FAMILY_ID, now);
  } catch {
    cluster = [];
  }
  return cluster;
}

/** One tile per hobby sister for a region (else the US). Empty when no sister has anything real. */
export function familyTiles(kind: "deal" | "preorder", region: FamilyRegion): FamilyTile[] {
  return pickTiles(familyFeeds(), { self: FAMILY_ID, cluster: "hobby", kind, region, max: 6 });
}

/** Today's deals (cheapest in-stock store 10%+ under the dearest) and pre-orders' cheapest store, per region. */
export function familyItems(): FamilyItem[] {
  const out: FamilyItem[] = [];
  for (const code of FAMILY_REGION_CODES) {
    const currency = REGIONS.find((r) => r.code === code)!.currency;
    for (const { f, best } of dealsIn(code, 8)) {
      const dearest = Math.max(...(f.offers[code] ?? []).filter((o) => o.st !== "out").map((o) => o.p));
      out.push({ kind: "deal", cluster: "hobby", region: code, title: f.name, url: `${SITE.url}/figure/${f.slug}`, image: f.img, cents: best.offer.p, currency, store: storeName(best.offer.s), refCents: dearest, refLabel: "dearest store" });
    }
    for (const f of preordersIn(code, 6)) {
      const o = (f.offers[code] ?? []).filter((x) => x.st === "pre").sort((a, b) => a.p - b.p)[0];
      if (o) out.push({ kind: "preorder", cluster: "hobby", region: code, title: f.name, url: `${SITE.url}/figure/${f.slug}`, image: f.img, cents: o.p, currency, store: storeName(o.s) });
    }
  }
  return out;
}

export function familyLinks(): FamilyFeed["links"] {
  const links: FamilyFeed["links"] = {};
  for (const code of FAMILY_REGION_CODES) links[code] = { deals: `${SITE.url}/deals`, preorders: `${SITE.url}/preorders` };
  return links;
}
