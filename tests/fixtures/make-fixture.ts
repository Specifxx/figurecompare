// Writes a small, obviously synthetic dataset to tests/fixtures/data for local
// development and tests (FIGURE_DATA_DIR=tests/fixtures/data). Never copied to
// data/public: the site only ever publishes prices a store showed.
import fs from "node:fs";
import path from "node:path";
import type { Figure, History, Meta } from "@/lib/types";
import type { RegionCode } from "@/site";

const names = ["Sample Hero", "Test Witch", "Fixture Knight", "Demo Idol", "Example Mage", "Mock Pilot", "Placeholder Cat Girl", "Stub Detective", "Dummy Pirate", "Trial Ninja", "Proto Maid", "Beta Ranger"];
const lines = ["nendoroid", "figma", "pop-up-parade"] as const;
const stores: Record<RegionCode, string[]> = { US: ["us-a", "us-b", "us-c"], UK: ["uk-a", "uk-b"], CA: ["ca-a", "ca-b"], AU: ["au-a", "au-b", "au-c"], NZ: ["nz-a", "nz-b"], EU: ["eu-a", "eu-b"], SG: ["sg-a", "sg-b"], JP: ["jp-a", "jp-b"] };
const base: Record<RegionCode, number> = { US: 5999, UK: 4999, CA: 7999, AU: 8995, NZ: 9995, EU: 5499, SG: 7900, JP: 6800 };

function ean(prefix: string): string {
  const d = prefix.padEnd(12, "0").slice(0, 12);
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(d[i]) * (i % 2 ? 3 : 1);
  return d + ((10 - (s % 10)) % 10);
}

const figures: Figure[] = names.map((n, i) => {
  const line = lines[i % 3];
  const number = line === "pop-up-parade" ? null : String(1000 + i * 37);
  const label = line === "nendoroid" ? "Nendoroid" : line === "figma" ? "figma" : "POP UP PARADE";
  const name = `${label}${number ? ` ${number}` : ""} ${n}`;
  const offers: Figure["offers"] = {};
  (Object.keys(stores) as RegionCode[]).forEach((r, k) => {
    if ((i + k) % 5 === 4) return;
    offers[r] = stores[r].map((s, j) => ({ s, p: base[r] + j * (r === "JP" ? 400 : 700) - (i % 4) * (r === "JP" ? 100 : 150), st: (i + j) % 7 === 3 ? "out" : i % 4 === 1 ? "pre" : "in", u: `https://example.com/${s}/${i}` }));
  });
  return { jan: ean(`45805900${String(i).padStart(4, "0")}`), slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, line, number, img: null, first: `2026-10-${String(10 + i).padStart(2, "0")}`, offers };
});
const history: History = Object.fromEntries(figures.map((f) => [f.jan, { US: [[20740, 6999], [20750, 6499], [20755, f.offers.US?.[0]?.p ?? 5999]] }]));
const meta: Meta = { updatedAt: "2026-10-28T08:00:00Z", figures: figures.length, stores: {} };
const dir = path.join(__dirname, "data");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "figures.json"), JSON.stringify({ figures }, null, 1));
fs.writeFileSync(path.join(dir, "history.json"), JSON.stringify(history));
fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1));
console.log(`${figures.length} fixture figures`);
