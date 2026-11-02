// The Compare Empire network's daily step (lib/family-network.ts, DECISIONS.md "Sites that grow each
// other", 2026-11-02), run by import.yml after the imports and before the data commit:
//
//   1. data/family/family-feed.json: this site's best store deals and pre-orders today, per region, from the
//      files just imported. Sister sites read it from GitHub.
//   2. data/family/family-cluster.json: the hobby sisters' feeds, read from GitHub now, for
//      the "More hobby deals" and pre-order blocks (lib/family.ts).
//
// Never fails the run: a missing or stale sister feed is left out, and the old cluster file is kept when
// every read fails (it ages out by itself).
import fs from "node:fs";
import path from "node:path";
import { FAMILY_DIR, FAMILY_ID, familyItems, familyLinks } from "../src/lib/family";
import { CLUSTER_FILE, FEED_FILE, buildFeed, clusterIds, fetchFamilyFeeds, type FamilyCluster } from "../src/lib/family-network";

async function main() {
  fs.mkdirSync(FAMILY_DIR, { recursive: true });
  const feed = buildFeed(FAMILY_ID, familyItems(), familyLinks());
  fs.writeFileSync(path.join(FAMILY_DIR, FEED_FILE), JSON.stringify(feed, null, 1) + "\n");
  console.log(`[family] ${FEED_FILE}: ${feed.items.length} items`);
  const ids = clusterIds(FAMILY_ID);
  const feeds = await fetchFamilyFeeds(ids);
  console.log(`[family] read ${feeds.length}/${ids.length} sister feeds: ${feeds.map((f) => f.site).join(", ") || "none"}`);
  if (!feeds.length && fs.existsSync(path.join(FAMILY_DIR, CLUSTER_FILE))) return console.log("[family] kept the previous cluster file");
  const out: FamilyCluster = { v: 1, site: FAMILY_ID, fetchedAt: new Date().toISOString(), feeds };
  fs.writeFileSync(path.join(FAMILY_DIR, CLUSTER_FILE), JSON.stringify(out) + "\n");
}

main()
  .catch((e) => console.warn("[family] skipped:", e instanceof Error ? e.message : e))
  .finally(() => process.exit(0));
