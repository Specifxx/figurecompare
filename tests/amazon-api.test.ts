// Amazon's Creators API prices (2026-11-05): fetched by the build, by barcode, shown 24 hours, never committed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { credentialsFor, itemsOf, pickListing, tokenEndpoint, type Item } from "../src/lib/amazon-creators";
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
