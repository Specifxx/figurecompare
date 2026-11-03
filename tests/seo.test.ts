// SEO audit (2026-11-03): homepage title and schema, breadcrumbs on deep pages, alt text, llms.txt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { breadcrumbLd } from "../src/lib/seo";
import { SITE } from "../src/site";

const read = (p: string) => readFileSync(p, "utf8");
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

test("homepage title fits 60 characters, keyword first, brand last", () => {
  const t = read("src/app/page.tsx").match(/absolute: `([^`]+)`/)![1].replace("${SITE.name}", SITE.name);
  assert.ok(t.length <= 60, t);
  assert.ok(t.endsWith(SITE.name));
  assert.match(t, /^Nendoroid/);
});

test("breadcrumbs start at Home with absolute URLs", () => {
  const b = breadcrumbLd([{ name: "Nendoroid", path: "/nendoroid" }]);
  assert.equal(b.itemListElement[0].item, SITE.url);
  assert.equal(b.itemListElement[1].item, `${SITE.url}/nendoroid`);
});

test("deep pages carry breadcrumbs; the homepage carries Organization, WebSite and FAQPage", () => {
  for (const f of ["src/app/figure/[slug]/page.tsx", "src/components/LineHub.tsx", "src/app/series/[slug]/page.tsx"]) assert.match(read(f), /breadcrumbLd|<Crumbs/, f);
  assert.match(read("src/app/page.tsx"), /siteLd\(\)/);
  assert.match(read("src/app/page.tsx"), /faqLd\(FAQ\)/);
});

test("no product photo has empty alt text", () => {
  for (const f of walk("src").filter((f) => f.endsWith(".tsx") && !f.endsWith("QuickView.tsx"))) assert.ok(!/<img[^>]*alt=""/.test(read(f)), f);
});

test("llms.txt is a static route", () => {
  assert.match(read("src/app/llms.txt/route.ts"), /force-static/);
});
