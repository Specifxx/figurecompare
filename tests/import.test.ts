import { test } from "node:test";
import assert from "node:assert/strict";
import { cachedJan, listingFromProduct, sizedImage, type ShopifyProduct } from "@/lib/import/shopify";
import { listingFromWoo, type WooProduct } from "@/lib/import/woo";
import type { Store } from "@/content/stores";

const shop: Store = { id: "s", name: "Shop", region: "AU", base: "https://shop.example", platform: "shopify" };
const product = (over: Partial<ShopifyProduct> = {}): ShopifyProduct => ({
  id: 1,
  title: "Nendoroid 2345 Frieren",
  handle: "nendoroid-2345-frieren",
  tags: [],
  variants: [{ id: 9, title: "Default Title", price: "89.95", available: true, sku: "4580590174528" }],
  images: [{ src: "https://cdn.shopify.com/s/files/1/x.jpg?v=1" }],
  ...over,
});

test("a Shopify product with a JAN in its SKU becomes a listing", () => {
  const l = listingFromProduct(shop, product());
  assert.ok("jan" in l);
  assert.equal(l.jan, "4580590174528");
  assert.equal(l.cents, 8995);
  assert.equal(l.st, "in");
  assert.equal(l.url, "https://shop.example/products/nendoroid-2345-frieren");
  assert.match(l.img!, /width=600/);
});

test("no JAN, no listing; never guessed from the title", () => {
  assert.deepEqual(listingFromProduct(shop, product({ variants: [{ id: 9, title: "Default Title", price: "89.95", available: true, sku: "GSC-2345" }] })), { noJan: true });
});

test("a cached barcode from /products/<handle>.json is used", () => {
  const l = listingFromProduct(shop, product({ variants: [{ id: 9, title: "Default Title", price: "89.95", available: true }] }), "4580590174528");
  assert.ok("jan" in l);
});

test("pre-order tag and sold-out stock", () => {
  const pre = listingFromProduct(shop, product({ tags: ["Pre-Order"] }));
  assert.ok("st" in pre && pre.st === "pre");
  const out = listingFromProduct(shop, product({ variants: [{ id: 9, title: "Default Title", price: "89.95", available: false, sku: "4580590174528" }] }));
  assert.ok("st" in out && out.st === "out");
});

test("a deposit or pre-owned variant is never the offer", () => {
  const l = listingFromProduct(
    shop,
    product({
      variants: [
        { id: 1, title: "Deposit", price: "20.00", available: true, sku: "4580590174528" },
        { id: 2, title: "Full payment", price: "89.95", available: true, sku: "4580590174528" },
      ],
    }),
  );
  assert.ok("cents" in l && l.cents === 8995);
});

test("Solaris Japan's \"Pre Owned\" variant (a space, no hyphen) is never the offer", () => {
  const l = listingFromProduct(
    shop,
    product({
      variants: [
        { id: 1, title: "Brand New", price: "29.77", available: true, sku: "4545784061121" },
        { id: 2, title: "Pre Owned", price: "18.50", available: true, sku: "4545784061121" },
      ],
    }),
  );
  assert.ok("cents" in l && l.cents === 2977);
});

test("yen prices are whole yen", () => {
  const jp: Store = { ...shop, region: "JP" };
  const l = listingFromProduct(jp, product({ variants: [{ id: 9, title: "Default Title", price: "6800", available: true, sku: "4580590174528" }] }));
  assert.ok("cents" in l && l.cents === 6800);
});

test("Woo: minor units, currency must match the region", () => {
  const woo: Store = { id: "w", name: "Woo", region: "UK", base: "https://woo.example", platform: "woo" };
  const p: WooProduct = {
    id: 1,
    name: "Nendoroid 2345 Frieren &#8211; Pre-order",
    permalink: "https://woo.example/p/frieren",
    sku: "4580590174528",
    is_in_stock: true,
    prices: { price: "4999", currency_code: "GBP", currency_minor_unit: 2 },
  };
  const l = listingFromWoo(woo, p);
  assert.ok("cents" in l && l.cents === 4999 && l.st === "pre");
  assert.deepEqual(listingFromWoo(woo, { ...p, prices: { ...p.prices, currency_code: "USD" } }), { refused: "currency" });
});

test("only Shopify CDN images are resized", () => {
  assert.equal(sizedImage("https://other.example/a.jpg"), "https://other.example/a.jpg");
  assert.equal(sizedImage(null), null);
});

test("collections: a line's own first, then anime figures; never dolls, parts or Funko", async () => {
  const { pickCollections } = await import("@/lib/import/shopify");
  assert.deepEqual(
    pickCollections(["funko-pop", "nendoroid", "nendoroid-doll", "nendoroid-more", "figma", "pop-up-parade", "anime-figures", "all"], ["fallback"]),
    ["nendoroid", "figma", "pop-up-parade", "anime-figures"],
  );
  assert.deepEqual(pickCollections(["trading-cards", "all"], ["figures"]), ["figures"]);
  assert.deepEqual(pickCollections([], []), []);
});

test("a barcode found once is kept; a missing one is asked again after 30 days", () => {
  const now = Date.parse("2026-11-30T00:00:00Z");
  assert.equal(cachedJan(undefined, now), undefined);
  // Shopify's updated_at moves on every stock sync; it must not expire a found barcode.
  assert.equal(cachedJan({ at: "2026-10-28T13:42:14Z", jan: "4580590174528" }, now), "4580590174528");
  assert.equal(cachedJan({ at: "2026-11-20", jan: null }, now), null);
  assert.equal(cachedJan({ at: "2026-10-28", jan: null }, now), undefined);
});
