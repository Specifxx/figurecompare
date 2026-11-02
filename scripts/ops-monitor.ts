// Runs in GitHub Actions every three hours (ops-monitor.yml), so it works when
// the site or the deploy is what broke. A failing check fails the run, and
// GitHub emails the owner. Add a check here for every new scheduled job, API
// or limit (family rule: the owner is not watching).
import fs from "node:fs";
import path from "node:path";
import { STORES } from "@/content/stores";
import type { Meta } from "@/lib/types";

type Status = "ok" | "warn" | "fail";
type Result = { name: string; status: Status; detail: string };
const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const DATA = path.join(process.cwd(), "data/public");

async function check(name: string, fn: () => Promise<Omit<Result, "name">> | Omit<Result, "name">): Promise<Result> {
  try {
    return { name, ...(await fn()) };
  } catch (e) {
    return { name, status: "fail", detail: (e as Error).message };
  }
}

async function get(p: string) {
  const r = await fetch(`${site}${p}`, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "FigureCompare ops monitor" } });
  return r;
}

export function judgeFreshness(updatedAt: string, now = Date.now()): Omit<Result, "name"> {
  const h = (now - Date.parse(updatedAt)) / 3_600_000;
  if (h < 30) return { status: "ok", detail: `${h.toFixed(1)}h old` };
  return { status: h < 54 ? "warn" : "fail", detail: `prices are ${h.toFixed(0)}h old: check the Import prices workflow` };
}

export function judgeStores(meta: Meta, total: number): Omit<Result, "name"> {
  const bad = Object.entries(meta.stores).filter(([, s]) => !s.ok);
  // A store whose figure collections came back empty: its collection moved or
  // was renamed. (A store reading products but none of our lines is normal.)
  const empty = Object.entries(meta.stores).filter(([, s]) => s.ok && s.listings === 0);
  if (!bad.length && !empty.length) return { status: "ok", detail: `${total} stores read` };
  const detail = [...bad.map(([k, s]) => `${k}: ${s.error}`), ...empty.map(([k]) => `${k}: figure collection empty`)].join("; ");
  return { status: bad.length > total / 3 ? "fail" : "warn", detail };
}

async function main() {
  if (!fs.existsSync(path.join(DATA, "meta.json"))) {
    // Before the first import there is nothing to judge; a setup step, not an incident.
    console.log("WARN Daily price import: no import has run yet (data/public/meta.json not set)");
    return;
  }
  const meta = JSON.parse(fs.readFileSync(path.join(DATA, "meta.json"), "utf8")) as Meta;
  const size = fs.statSync(path.join(DATA, "figures.json")).size;
  const results = await Promise.all([
    check("Live site", async () => {
      if (!site) return { status: "warn", detail: "SITE_URL repository variable not set: live checks skipped" };
      const r = await get("/");
      return r.ok ? { status: "ok", detail: `HTTP ${r.status}` } : { status: "fail", detail: `HTTP ${r.status}` };
    }),
    check("Search index", async () => {
      if (!site) return { status: "warn", detail: "SITE_URL not set" };
      const r = await get("/search-index.json");
      if (!r.ok) return { status: "fail", detail: `HTTP ${r.status}` };
      const n = ((await r.json()) as unknown[]).length;
      return n >= meta.figures * 0.5 ? { status: "ok", detail: `${n} figures live` } : { status: "warn", detail: `live site has ${n} figures, data has ${meta.figures}: is the daily release deploying?` };
    }),
    check("Daily price import", () => judgeFreshness(meta.updatedAt)),
    check("Store imports", () => judgeStores(meta, STORES.length)),
    check("Catalogue", () => (meta.figures > 0 ? { status: "ok", detail: `${meta.figures} figures` } : { status: "fail", detail: "no figures in data/public/figures.json" })),
    check("Data size", () =>
      size < 12e6 ? { status: "ok", detail: `${(size / 1e6).toFixed(1)} MB` } : { status: "warn", detail: `figures.json is ${(size / 1e6).toFixed(1)} MB: builds slow down; raise minStoresPerRegion or trim` },
    ),
    check("eBay listings", () => {
      if (!process.env.EBAY_CLIENT_ID) return { status: "warn", detail: "EBAY_CLIENT_ID not set in GitHub secrets: no eBay listings yet" };
      if (!meta.ebay) return { status: "warn", detail: "no eBay run recorded yet" };
      const age = (Date.now() - Date.parse(meta.ebay.at)) / 3_600_000;
      if (age > 30) return { status: "warn", detail: `last eBay run ${age.toFixed(0)}h ago` };
      return { status: "ok", detail: `${meta.ebay.calls}/${meta.ebay.budget} calls on ${meta.ebay.day}` };
    }),
  ]);
  for (const r of results) console.log(`${r.status.toUpperCase().padEnd(4)} ${r.name}: ${r.detail}`);
  // Empire HQ's copy (riftcompare.com/admin/hq and the one Monday report; owner, 2026-11-02): the
  // workflow publishes it on the public `ops-status` branch. Status and our own sentences only.
  const overall = results.some((r) => r.status === "fail") ? "fail" : results.some((r) => r.status === "warn") ? "warn" : "ok";
  fs.writeFileSync(process.env.OPS_STATUS_FILE || "ops-status.json", JSON.stringify({ v: 1, site: "figurecompare.com", at: new Date().toISOString(), overall, checks: results }, null, 1) + "\n");
  // Only red fails the run (GitHub's failed-run email is the alert); amber waits for HQ and Monday.
  const bad = results.filter((r) => r.status === "fail");
  if (bad.length) {
    console.error(`\n${bad.length} check(s) failed: ${bad.map((r) => r.name).join(", ")}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("ops-monitor.ts")) main();
