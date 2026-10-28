// Pings IndexNow (Bing, Yandex, Seznam…) after each import with the hubs and
// every figure first seen in the last 7 days. At most 1,000 URLs a day; Bing
// Webmaster Tools also reads the sitemap.
import { LINES, SITE } from "@/site";
import { getFigures } from "@/lib/data";
import { isIndexable } from "@/lib/index-tiers";

async function main() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return console.log("[indexnow] INDEXNOW_KEY not set: skipped");
  const site = SITE.url;
  const week = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const hubs = ["", "/deals", "/preorders", "/new", ...LINES.map((l) => `/${l.key}`)].map((p) => `${site}${p}`);
  const fresh = getFigures().filter((f) => f.first >= week && isIndexable(f)).map((f) => `${site}/figure/${f.slug}`);
  const urls = [...new Set([...hubs, ...fresh])].slice(0, 1000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/indexnow-key.txt`, urlList: urls }),
  });
  console.log(`[indexnow] ${res.status} for ${urls.length} URLs`);
}
main();
