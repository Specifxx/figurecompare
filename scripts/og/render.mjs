// Draws the link preview (src/app/opengraph-image.jpg): one real figure's store
// prices from data/public, so the thumbnail shows what the site does. Run by
// hand (`node scripts/og/render.mjs`) and look at the JPG before committing:
// Reddit and X keep a post's thumbnail forever. No dashes in the copy.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "../..");

const figures = JSON.parse(readFileSync(path.join(root, "data/public/figures.json"), "utf8")).figures;
const storesTs = readFileSync(path.join(root, "src/content/stores.ts"), "utf8");
const names = Object.fromEntries([...storesTs.matchAll(/id: "([^"]+)", name: "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const REGION = { US: ["US$", "the US"], CA: ["C$", "Canada"], AU: ["A$", "Australia"], UK: ["£", "the UK"], NZ: ["NZ$", "New Zealand"] };

// The figure with the most in-stock stores in one region, then the widest spread.
let pick = null;
for (const f of figures) {
  for (const [region, offers] of Object.entries(f.offers)) {
    if (!REGION[region]) continue;
    const live = offers.filter((o) => o.st === "in").sort((a, b) => a.p - b.p);
    if (live.length < 4) continue;
    const spread = (live.at(-1).p - live[0].p) / live.at(-1).p;
    const score = Math.min(live.length, 5) * 10 + spread;
    if (!pick || score > pick.score) pick = { f, region, live: live.slice(0, 5), score };
  }
}
if (!pick) throw new Error("no figure with four in-stock stores");
const [sym, where] = REGION[pick.region];
const money = (c) => `${sym}${(c / 100).toFixed(2)}`;
const active = new Set(figures.flatMap((f) => Object.values(f.offers).flat().map((o) => o.s)));
const low = pick.live[0].p;
const high = pick.live.at(-1).p;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${path.join(here, "og.html")}`);
await page.evaluate(
  (d) => window.draw(d),
  {
    sub: `${active.size} real figure stores compared. Matched by the barcode on the box, checked every day.`,
    regions: ["US", "UK", "Canada", "Australia", "New Zealand", "Europe", "Singapore"],
    kicker: `In stock in ${where} today`,
    name: pick.f.name.replace(/\s+-\s+/g, ": "),
    rows: pick.live.map((o) => ({ store: names[o.s] ?? o.s, price: money(o.p) })),
    save: `Save ${money(high - low)} on the same box`,
  },
);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "src/app/opengraph-image.jpg"), type: "jpeg", quality: 90 });
await browser.close();
console.log(`${pick.f.name} (${pick.region}): ${pick.live.length} stores, ${money(low)} to ${money(high)}`);
