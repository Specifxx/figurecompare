import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isCheckoutLink } from "../src/lib/checkout-link";
import { storeUrl } from "../src/lib/affiliate";

// Straight to checkout (owner, 2026-11-06), as RiftCompare #340, OP Compare #99 and KaeYoung #58.
const STORE = "blacklistcards";
const BASE = "https://blacklistcards.com";

test("an orderable Shopify listing opens the store's cart, tagged; a listing without a variant keeps its page", () => {
  const out = storeUrl(STORE, `${BASE}/products/nendoroid-x?variant=44123456789012`);
  const u = new URL(out);
  assert.equal(u.pathname, "/cart/44123456789012:1");
  assert.ok(u.searchParams.get("utm_source"));
  assert.equal(u.searchParams.get("utm_content"), "checkout");
  assert.ok(isCheckoutLink(out));
  assert.equal(new URL(storeUrl(STORE, `${BASE}/products/nendoroid-x`)).pathname, "/products/nendoroid-x");
  assert.ok(!isCheckoutLink(storeUrl(STORE, BASE)), "the store's home page stays a home page");
});

test("paying stores are returned before the cart; the import names only an orderable variant", () => {
  const src = readFileSync(new URL("../src/lib/affiliate.ts", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("export function storeUrl("));
  assert.ok(body.indexOf("if (awin) return awin;") > 0 && body.indexOf("shopifyCartUrl(") > body.indexOf("if (awin) return awin;"));
  assert.ok(body.indexOf("if (!(store?.affiliate && aff))") < body.indexOf("shopifyCartUrl("));
  assert.match(readFileSync(new URL("../src/lib/import/shopify.ts", import.meta.url), "utf8"), /v\.available && v\.id \? `\?variant=\$\{v\.id\}` : ""/);
});
