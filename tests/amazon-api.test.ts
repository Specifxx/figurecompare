// Amazon's Creators API prices (2026-11-05): fetched by the build, by barcode, shown 24 hours, never committed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { barcodeMatches, credentialsFor, isWrongAccount, itemsOf, pickListing, tokenEndpoint, type Item } from "../src/lib/amazon-creators";
import { dueForSearch, searchWords } from "../src/lib/amazon-asins";
import { judgeAmazon } from "../scripts/ops-monitor";
import { isFreshAmazonPrice } from "../src/lib/amazon-live";
import { amazonItemUrl } from "../src/lib/affiliate";

test("the token endpoint follows the credential version, else the store's home region", () => {
  assert.equal(tokenEndpoint("3.1", "AU"), "https://api.amazon.com/auth/o2/token");
  assert.equal(tokenEndpoint("3.3", "US"), "https://api.amazon.co.jp/auth/o2/token");
  assert.equal(tokenEndpoint(undefined, "UK"), "https://api.amazon.co.uk/auth/o2/token");
  assert.equal(tokenEndpoint(undefined, "AU"), "https://api.amazon.co.jp/auth/o2/token");
});

test("one credential serves every store: the AU-named variables are the default, a region's own win", () => {
  const au = { AMAZON_CREATORS_AU_CLIENT_ID: " a ", AMAZON_CREATORS_AU_CLIENT_SECRET: "b", AMAZON_CREATORS_AU_VERSION: "3.3" };
  assert.equal(credentialsFor("US", {}), null);
  assert.equal(credentialsFor("US", { AMAZON_CREATORS_AU_CLIENT_ID: "a" }), null);
  assert.deepEqual(credentialsFor("AU", au), { id: "a", secret: "b", version: "3.3" });
  assert.deepEqual(credentialsFor("US", au), { id: "a", secret: "b", version: "3.3" });
  assert.deepEqual(credentialsFor("US", { ...au, AMAZON_CREATORS_US_CLIENT_ID: "u", AMAZON_CREATORS_US_CLIENT_SECRET: "v" }), { id: "u", secret: "v", version: "3.1" });
});

const listing = (amount: number, o: Partial<{ cond: string; avail: string; cur: string; box: boolean; seller: string }> = {}) => ({
  price: { money: { amount, currency: o.cur ?? "USD" } },
  condition: { value: o.cond ?? "New" },
  availability: { type: o.avail ?? "IN_STOCK" },
  isBuyBoxWinner: o.box,
  merchantInfo: { name: o.seller ?? "Amazon.com" },
});
const item = (...listings: ReturnType<typeof listing>[]): Item => ({ asin: "B000000001", offersV2: { listings } });

test("the shown price is the new, in-stock buy box in the store's currency, else the cheapest such listing", () => {
  assert.deepEqual(pickListing(item(listing(30), listing(25, { box: true })), "USD"), { amount: 25, seller: undefined });
  assert.deepEqual(pickListing(item(listing(30, { seller: "AmiAmi" }), listing(28)), "USD"), { amount: 28, seller: undefined });
  assert.equal(pickListing(item(listing(30, { seller: "AmiAmi" })), "USD")!.seller, "AmiAmi");
  assert.equal(pickListing(item(listing(10, { cond: "Used" })), "USD"), null, "used is never shown");
  assert.equal(pickListing(item(listing(10, { avail: "OUT_OF_STOCK" })), "USD"), null);
  assert.equal(pickListing(item(listing(10, { cur: "AUD" })), "USD"), null, "another currency is another store");
  assert.equal(pickListing({ asin: "B000000001", offersV2: null }, "USD"), null);
  assert.deepEqual(itemsOf({ itemResults: { items: [item()] } }).length, 1);
});

test("a price is shown for 24 hours after it was fetched, never from the future", () => {
  const now = Date.parse("2026-11-05T12:00:00Z");
  assert.ok(isFreshAmazonPrice("2026-11-05T00:00:00Z", now));
  assert.ok(!isFreshAmazonPrice("2026-11-04T11:00:00Z", now));
  assert.ok(!isFreshAmazonPrice("2026-11-06T00:00:00Z", now));
  assert.ok(!isFreshAmazonPrice(undefined, now));
});

test("an item link goes to Amazon's own page with the region's tag and the sub id", () => {
  assert.match(amazonItemUrl("B0ABCDEFGH", "US", "figure-us-table_pinned-450")!, /^https:\/\/www\.amazon\.com\/dp\/B0ABCDEFGH\?tag=riftcompare-20&ascsubtag=figure-us-table_pinned-450$/);
  assert.match(amazonItemUrl("B0ABCDEFGH", "AU", "t")!, /amazon\.com\.au\/dp\/.*tag=figurecompare-22/);
  assert.equal(amazonItemUrl("B0ABCDEFGH", "NZ", "t"), null, "no Amazon NZ");
  assert.equal(amazonItemUrl("not-an-asin", "US", "t"), null);
});

const walk = (d: string): string[] => fs.readdirSync(d).flatMap((f) => (fs.statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));

test("the Creators API client stays build-side; only the price table reads live Amazon prices; prices are never committed", () => {
  for (const f of [...walk("src/app"), ...walk("src/components"), ...walk("src/lib")].filter((f) => /\.tsx?$/.test(f))) {
    const s = fs.readFileSync(f, "utf8");
    if (f !== "src/lib/amazon-creators.ts") assert.ok(!/amazon-creators/.test(s), `${f} imports the Creators API client`);
    if (/from "@\/lib\/amazon-live"/.test(s)) assert.equal(f, "src/components/PriceTable.tsx", `${f} reads live Amazon prices`);
    assert.ok(!/AMAZON_CREATORS/.test(s) || f === "src/lib/amazon-creators.ts", `${f} names the credentials`);
  }
  assert.match(fs.readFileSync(".gitignore", "utf8"), /^data\/amazon-live\/$/m);
  assert.match(JSON.parse(fs.readFileSync("package.json", "utf8")).scripts.build, /^\(tsx scripts\/fetch-amazon-prices\.ts \|\| true\) && (\(tsx scripts\/fetch-awin\.ts \|\| true\) && )?next build/);
});

test("an ASIN counts only when Amazon's own barcodes carry ours (EAN-13, or the UPC-A inside it)", () => {
  const it = (eans: string[], upcs: string[] = []): Item => ({ asin: "B000000001", itemInfo: { externalIds: { eans: { displayValues: eans }, upcs: { displayValues: upcs } } } });
  assert.ok(barcodeMatches(it(["4580590172463"]), "4580590172463"));
  assert.ok(barcodeMatches(it([], ["085715166234"]), "0085715166234"), "a UPC-A is our EAN without its leading 0");
  assert.ok(barcodeMatches(it(["0085715166234"]), "0085715166234"));
  assert.ok(!barcodeMatches(it(["4580590172470"]), "4580590172463"), "another figure is not this one");
  assert.ok(!barcodeMatches({ asin: "B000000001" }, "4580590172463"), "no barcodes on Amazon's side, no match");
});

test("a credential from another country's account stops that store at once", () => {
  assert.ok(isWrongAccount('{"__type":"InvalidAssociate","message":"Your credential is not linked to the partner tag"}'));
  assert.ok(!isWrongAccount('{"__type":"ThrottleException"}'));
});

test("a found ASIN is kept; a miss is searched again after 30 days", () => {
  assert.ok(dueForSearch(undefined, "2026-11-06"));
  assert.ok(!dueForSearch(["B000000001", "2026-01-01"], "2026-11-06"));
  assert.ok(!dueForSearch([null, "2026-10-20"], "2026-11-06"));
  assert.ok(dueForSearch([null, "2026-10-01"], "2026-11-06"));
});

test("the name search is the figure's own name", () => {
  assert.equal(searchWords({ name: "Nendoroid Hatsune Miku" }), "Nendoroid Hatsune Miku");
});

test("the ops check is never red: Amazon's sales gate is expected, only a silent finder turns amber", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  assert.equal(judgeAmazon({}, now).status, "ok");
  const r = judgeAmazon({ US: { at: "2026-11-06T06:00:00Z", state: "refused", note: "AssociateNotEligible" }, AU: { at: "2026-11-06T06:00:00Z", state: "ok", known: 40, waiting: 3 } }, now);
  assert.equal(r.status, "ok");
  assert.match(r.detail, /US waiting for Amazon API access; AU 40 ASINs/);
  assert.equal(judgeAmazon({ US: { at: "2026-11-03T06:00:00Z", state: "ok" } }, now).status, "warn");
});

test("pages never read the ASIN files; the import finds ASINs with the credentials as GitHub secrets", () => {
  for (const f of [...walk("src/app"), ...walk("src/components")].filter((f) => /\.tsx?$/.test(f)))
    assert.ok(!/amazon-asins/.test(fs.readFileSync(f, "utf8")), `${f} reads the ASIN files`);
  const wf = fs.readFileSync(".github/workflows/import.yml", "utf8");
  assert.match(wf, /npx tsx scripts\/amazon-asins\.ts/);
  for (const r of ["US", "UK", "CA", "EU", "AU"]) assert.match(wf, new RegExp(`AMAZON_CREATORS_${r}_CLIENT_SECRET: \\$\\{\\{ secrets\\.AMAZON_CREATORS_${r}_CLIENT_SECRET \\}\\}`));
});

test("the quick view's Amazon row is the tagged Amazon link itself, never Amazon's price (owner, 2026-11-06)", () => {
  const src = fs.readFileSync("src/components/PriceTable.tsx", "utf8");
  assert.doesNotMatch(src, /startsWith\("quickview"\) \? null : \(?liveUrl/, "the quick view keeps the Amazon link");
  assert.match(src, /const live = [^;]*quick[^;]*\? null : found;/, "Amazon's price stays on the product page");
});
