// Draws the link preview (src/app/opengraph-image.jpg) from today's data: five
// well-known figures in stock at five or more US shops, each with the lowest
// and highest item price, so the thumbnail shows the gap the site closes. Run
// by hand (`node scripts/og/render.mjs`) and look at the JPG before committing:
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
const REGION = "US";
const money = (c) => `$${(c / 100).toFixed(2)}`;
// Names people recognise in a feed beat the most-stocked obscure ones.
// Best known first; one figure per franchise.
const FAMOUS = ["frieren", "hatsune miku", "chainsaw man", "jujutsu kaisen", "spy x family", "hololive", "attack on titan", "demon slayer", "blue archive", "genshin"];
const fame = (n) => {
  const i = FAMOUS.findIndex((k) => n.toLowerCase().includes(k));
  return i < 0 ? FAMOUS.length : i;
};

const cands = [];
for (const f of figures) {
  const live = (f.offers[REGION] ?? []).filter((o) => o.st === "in").sort((a, b) => a.p - b.p);
  if (live.length < 5) continue;
  cands.push({ f, n: live.length, low: live[0].p, high: live.at(-1).p, fame: fame(f.name) });
}
cands.sort((a, b) => a.fame - b.fame || b.n - a.n || b.high - b.low - (a.high - a.low));
const picks = [];
const seen = new Set();
for (const c of cands) {
  const k = c.fame < FAMOUS.length ? FAMOUS[c.fame] : c.f.slug;
  if (seen.has(k)) continue;
  seen.add(k);
  picks.push(c);
  if (picks.length === 5) break;
}
if (picks.length < 5) throw new Error("fewer than five figures in stock at five US shops");
const usShops = new Set(figures.flatMap((f) => (f.offers[REGION] ?? []).map((o) => o.s)));
const allShops = new Set(figures.flatMap((f) => Object.values(f.offers).flat().map((o) => o.s)));
const short = (n) => n.replace(/\s+-\s+/g, ": ").replace(/hololive production\s*:?\s*/i, "").replace(/\s{2,}/g, " ");
const biggest = Math.max(...picks.map((p) => p.high - p.low));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${path.join(here, "og.html")}`);
await page.evaluate((d) => window.draw(d), {
  sub: `${allShops.size} real figure shops in 7 regions, ${usShops.size} of them selling to the US. Matched by the barcode on the box, checked every day.`,
  regions: ["US", "UK", "Canada", "Australia", "New Zealand", "Europe", "Singapore"],
  kicker: "In stock at US shops today",
  rows: picks.map((p) => ({ name: short(p.f.name), n: p.n, low: money(p.low), high: money(p.high) })),
  save: `Up to ${money(biggest)} apart for the same box`,
});
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "src/app/opengraph-image.jpg"), type: "jpeg", quality: 90 });
await browser.close();
for (const p of picks) console.log(`${p.f.name}: ${p.n} US shops, ${money(p.low)} to ${money(p.high)}`);
