// Joins the shards' outputs into results.json and summary.md (readable shops
// per currency, and how many barcodes 2+ shops in one currency share).
import fs from "node:fs";
const dir = process.argv[2];
let all = [];
for (const d of fs.readdirSync(dir)) for (const f of fs.readdirSync(`${dir}/${d}`)) all = all.concat(JSON.parse(fs.readFileSync(`${dir}/${d}/${f}`, "utf8")));
all.sort((a, b) => a.host.localeCompare(b.host));
const ok = all.filter((r) => r.shopify && r.products);
const byCur = {};
for (const r of ok) (byCur[r.currency ?? "?"] ??= []).push(r);
let md = `# Skincare store probe ${new Date().toISOString().slice(0, 10)}\n\n${all.length} candidates, ${ok.length} readable Shopify shops.\n\n`;
md += "| Currency | Readable shops | With 50+ K-beauty products | Barcodes in 2+ shops (all / 880) |\n| --- | --- | --- | --- |\n";
for (const [cur, rs] of Object.entries(byCur).sort()) {
  const count = new Map();
  for (const r of rs) for (const c of new Set(r.codes ?? [])) count.set(c, (count.get(c) ?? 0) + 1);
  const shared = [...count].filter(([, n]) => n >= 2);
  md += `| ${cur} | ${rs.length} | ${rs.filter((r) => r.kbeauty >= 50).length} | ${shared.length} / ${shared.filter(([c]) => c.startsWith("880")).length} |\n`;
}
md += "\n| Shop | Currency | Products | K-beauty | EAN in SKU | Sample with barcode | Korean codes |\n| --- | --- | --- | --- | --- | --- | --- |\n";
for (const r of ok.sort((a, b) => b.kbeauty - a.kbeauty)) md += `| ${r.base} | ${r.currency ?? "?"} | ${r.products} | ${r.kbeauty} | ${r.skuEan} | ${r.sampleWithBarcode}/${r.sampleLooked} | ${r.koreanCodes} |\n`;
md += "\nNot readable: " + all.filter((r) => !(r.shopify && r.products)).map((r) => `${r.host}${r.error ? ` (${r.error})` : r.shopify === false ? " (not Shopify)" : ""}`).join(", ") + "\n";
fs.writeFileSync("probe/skincare/results.json", JSON.stringify(all, null, 1) + "\n");
fs.writeFileSync("probe/skincare/summary.md", md);
console.log(md);
