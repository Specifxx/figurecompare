import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAlertFeed, ALERT_SITE_KEY } from "../src/lib/alert-feed";
import { bestIn, getFigures } from "../src/lib/data";
import { parseAmount, suggestTarget, ALERT_SERVICE } from "../src/components/PriceAlertForm";

// Price alerts through RiftCompare's shared service (DECISIONS.md, 2026-11-02).

test("the feed's price is the page's headline price per region, keyed by JAN, never Japan", () => {
  const f = buildAlertFeed(new Date("2026-11-02T00:00:00Z"));
  assert.equal(f.site, ALERT_SITE_KEY);
  for (const fig of getFigures().slice(0, 50)) {
    const item = f.items[fig.jan];
    const us = bestIn(fig, "US");
    if (us) assert.equal(item?.p.US, us.offer.p);
    if (item) {
      assert.equal(item.u, `/figure/${fig.slug}`);
      assert.equal(item.p.JP, undefined);
    }
  }
});

test("the form posts only to the shared service and the feed is a static file", () => {
  assert.equal(ALERT_SERVICE, "https://riftcompare.com/api/sister-alerts");
  assert.equal(parseAmount("45"), 4500);
  assert.equal(parseAmount("x"), null);
  assert.equal(suggestTarget(13999), 12500);
  assert.ok(!/localStorage|document\.cookie/.test(fs.readFileSync("src/components/PriceAlertForm.tsx", "utf8")));
  assert.match(fs.readFileSync("src/app/alert-feed.json/route.ts", "utf8"), /export const dynamic = "force-static";/);
});
