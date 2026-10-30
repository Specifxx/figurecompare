// Skincare store probe (2026-10-30, research only; not part of FigureCompare).
// For each candidate host: is it Shopify, what currency, how many products,
// how many K-beauty brand products, how many EAN-13 barcodes (880 = Korea)
// in variant SKUs, and, from a capped sample of single-product reads, how many
// carry variants[].barcode. Writes out-<shard>.json. ~1 request/second.
import fs from "node:fs";

const SHARD = Number(process.env.SHARD ?? 0);
const SHARDS = Number(process.env.SHARDS ?? 1);
const PAGES = 12; // up to 3,000 products
const LOOKUPS = 120;
const UA = "Mozilla/5.0 (compatible; CompareEmpireProbe/1.0; +https://compareempire.com)";
const KBRANDS = /\b(cosrx|beauty of joseon|anua|skin1004|round ?lab|torriden|isntree|laneige|innisfree|etude|missha|some ?by ?mi|klairs|purito|medicube|numbuzin|ma:nyo|manyo|mixsoon|abib|axis-y|haruharu|dr\.? ?jart|sulwhasoo|tirtir|banila|pyunkang|heimish|benton|neogen|illiyoon|aestura|biodance|goodal|d'alba|dalba|apieu|tonymoly|holika|skinfood|by wishtrend|iunik|cos de baha|elizavecca|mediheal|nacific|rovectin|aprilskin|celimax|vt cosmetics|ample:n|jumiso|beplain|make p:rem|tocobo|thank you farmer|i'm from|im from|papa recipe|hanyul|belif|hera|peripera|rom&nd|romand|clio|3ce|amuse|fwee|dear,? klairs|kaine|dr\.? ?g|uiq|zeroid|bringgreen|cnp|daeng gi meo ri|ryo|mise en scene|stridex)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25_000) });
      if (res.status === 429) { await sleep(10_000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      await sleep(900);
      return { url: res.url, json: JSON.parse(text) };
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(3000);
    }
  }
  throw new Error("429");
}
const ean = (s) => {
  const d = String(s ?? "").replace(/\D/g, "");
  if (!/^\d{13}$/.test(d)) return null;
  const sum = [...d.slice(0, 12)].reduce((a, c, i) => a + Number(c) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(d[12]) ? d : null;
};

const hosts = [...new Set(fs.readFileSync(new URL("./candidates.txt", import.meta.url), "utf8").split("\n")
  .map((l) => l.replace(/#.*/, "").trim().toLowerCase()).filter(Boolean))].filter((_, i) => i % SHARDS === SHARD);

async function probe(host) {
  const r = { host };
  let base;
  try {
    const first = await get(`https://${host}/products.json?limit=250&page=1`, 2);
    if (!Array.isArray(first.json.products)) return { ...r, shopify: false };
    base = new URL(first.url).origin;
    r.shopify = true;
    r.base = base;
    try { const m = await get(`${base}/meta.json`, 1); r.name = m.json.name; r.currency = m.json.currency; r.country = m.json.country; } catch {}
    const products = [...first.json.products];
    for (let p = 2; p <= PAGES && products.length === (p - 1) * 250; p++) {
      const d = await get(`${base}/products.json?limit=250&page=${p}`);
      products.push(...d.json.products);
    }
    r.products = products.length;
    const kb = products.filter((p) => KBRANDS.test(`${p.vendor} ${p.title}`));
    r.kbeauty = kb.length;
    const codes = new Set(), kcodes = new Set();
    let skuEan = 0;
    for (const p of products) for (const v of p.variants ?? []) {
      const c = ean(v.sku);
      if (c) { skuEan++; codes.add(c); if (c.startsWith("880")) kcodes.add(c); }
    }
    r.skuEan = skuEan;
    // Single-product sample: K-beauty products first, those whose SKU had no EAN.
    // Bestselling brands first, so shops' samples overlap.
    const TOP = /\b(cosrx|beauty of joseon|anua|skin1004|round ?lab|torriden|isntree|medicube|numbuzin|laneige|some ?by ?mi|purito|klairs|biodance|mixsoon|tirtir)\b/i;
    const ranked = [...kb.filter((p) => TOP.test(`${p.vendor} ${p.title}`)), ...kb.filter((p) => !TOP.test(`${p.vendor} ${p.title}`))];
    const sample = [...ranked, ...products.filter((p) => !kb.includes(p))].filter((p) => !(p.variants ?? []).some((v) => ean(v.sku))).slice(0, LOOKUPS);
    let looked = 0, withBarcode = 0;
    for (const p of sample) {
      try {
        const d = await get(`${base}/products/${p.handle}.json`, 2);
        looked++;
        let any = false;
        for (const v of d.json.product?.variants ?? []) {
          const c = ean(v.barcode);
          if (c) { any = true; codes.add(c); if (c.startsWith("880")) kcodes.add(c); }
        }
        if (any) withBarcode++;
      } catch { /* skip */ }
    }
    r.sampleLooked = looked;
    r.sampleWithBarcode = withBarcode;
    r.codes = [...codes];
    r.koreanCodes = kcodes.size;
    return r;
  } catch (e) {
    return { ...r, shopify: base ? true : null, error: String(e.message ?? e) };
  }
}

const out = [];
for (const h of hosts) {
  const t = Date.now();
  const res = await probe(h).catch((e) => ({ host: h, error: String(e) }));
  out.push(res);
  const { codes, ...log } = res;
  console.log(JSON.stringify(log), `${Math.round((Date.now() - t) / 1000)}s`);
  fs.writeFileSync(new URL(`./out-${SHARD}.json`, import.meta.url), JSON.stringify(out));
}
