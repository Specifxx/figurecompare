import { test } from "node:test";
import assert from "node:assert/strict";
import { CACHE_DAYS, locsOf, parseProductPage, pickPages, type PageCache } from "../src/lib/import/sitemap-store";
import { STORES } from "../src/content/stores";

// Real markup, 2026-11-07 (trimmed): figuya.com/en/products/nendoroid-1536-kagome-higurashi.
const FIGUYA = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Nendoroid 1536 Kagome Higurashi","url":"https://figuya.com/en/products/nendoroid-1536-kagome-higurashi","sku":"28752","gtin13":"4580590123489","mpn":"GSC12348","brand":{"@type":"Brand","name":"Nendoroid Series"},"image":["https://figuya-media.com/uploads/store/36ad.jpg","https://figuya-media.com/uploads/store/3628.jpg"],"offers":{"@type":"Offer","priceCurrency":"EUR","price":64.9,"itemCondition":"https://schema.org/NewCondition","availability":"https://schema.org/SoldOut"}}</script>
<a href="tel:+4930577011989">+49 (0)30 577 011 989</a>`;

// kurogami.com/en/product/denji-nendoroid-1560-chainsaw-man-1: a relative image path.
const KUROGAMI = `<script type="application/ld+json">{"@context":"http:\\/\\/schema.org","@type":"Product","name":"Denji Nendoroid 1560 Chainsaw Man","image":"/img/productos/55/27/nendoroid-denji-1560-chainsaw-man-1.jpg","url":"https://kurogami.com/en/product/denji-nendoroid-1560-chainsaw-man-1","offers":{"@type":"Offer","priceCurrency":"EUR","price":"74.9","availability":"https://schema.org/InStock"},"sku":"FIG21680","gtin13":"4580590129832","brand":{"@type":"Thing","name":"Good Smile Company"}}</script>`;

// yorokonde.de (Shopware 5 microdata): one ready to ship, one sold out.
const yorokonde = (typ: string, qty: boolean) => `<meta property="og:image" content="https://www.yorokonde.de/media/image/0a/38/39/DeliciousinDungeonSenshiNen1.jpg" />
<h1 class="product--title" itemprop="name"> Delicious in Dungeon: Senshi - Nendoroid </h1>
<meta itemprop="gtin13" content="4580828673779"/>
<div itemprop="offers" itemscope itemtype="https://schema.org/Offer" class="buybox--inner">
<meta itemprop="priceCurrency" content="EUR"/>
<div class="product--price price--default"><span class="price--content content--default"><meta itemprop="price" content="54.90"> &euro;54.90 * </span></div>
<span class="preorder--typ ${typ}">${typ === "is--sold" ? "Sold out" : "Ready for shipment, delivery in 1-3 days"}</span>
${qty ? '<div class="buybox--quantity block"><select id="sQuantity" name="sQuantity" class="quantity--select">' : ""}
</div>`;

test("Figuya: the JAN, euro price and stock from the product JSON-LD (not the phone number)", () => {
  const p = parseProductPage(FIGUYA, "https://figuya.com");
  assert.deepEqual(p, { name: "Nendoroid 1536 Kagome Higurashi", jan: "4580590123489", price: 64.9, currency: "EUR", st: "out", img: "https://figuya-media.com/uploads/store/36ad.jpg" });
});

test("Kurogami: a relative photo becomes absolute, InStock is in stock", () => {
  const p = parseProductPage(KUROGAMI, "https://kurogami.com");
  assert.equal(p?.jan, "4580590129832");
  assert.equal(p?.st, "in");
  assert.equal(p?.price, 74.9);
  assert.equal(p?.img, "https://kurogami.com/img/productos/55/27/nendoroid-denji-1560-chainsaw-man-1.jpg");
});

test("Yorokonde: Shopware microdata, stock from its delivery line", () => {
  const ready = parseProductPage(yorokonde("is--available", true), "https://www.yorokonde.de");
  assert.deepEqual(ready, { name: "Delicious in Dungeon: Senshi - Nendoroid", jan: "4580828673779", price: 54.9, currency: "EUR", st: "in", img: "https://www.yorokonde.de/media/image/0a/38/39/DeliciousinDungeonSenshiNen1.jpg" });
  assert.equal(parseProductPage(yorokonde("is--sold", false), "https://www.yorokonde.de")?.st, "out");
  assert.equal(parseProductPage(yorokonde("is--available", false), "https://www.yorokonde.de")?.st, "out");
});

test("a page without a Japanese JAN gives no JAN", () => {
  const p = parseProductPage(FIGUYA.replace("4580590123489", "8436546894458"), "https://figuya.com");
  assert.equal(p?.jan, null);
  assert.equal(parseProductPage("<html>no product</html>", "https://figuya.com"), null);
});

test("pages to read: orderable last time first, then never read, then the rest oldest first", () => {
  const cache: PageCache = {
    a: { j: "4580590123489", p: 100, s: "out", n: "x", i: null, d: "2026-11-01" },
    b: { j: "4580590123489", p: 100, s: "in", n: "x", i: null, d: "2026-11-06" },
    d: { j: null, p: 0, s: "out", n: "", i: null, d: "2026-10-20" },
  };
  assert.deepEqual(pickPages(["a", "b", "c", "d"], cache, 10), ["b", "c", "d", "a"]);
  assert.deepEqual(pickPages(["a", "b", "c", "d"], cache, 2), ["b", "c"]);
  assert.ok(CACHE_DAYS <= 7);
});

test("sitemap locs are decoded", () => {
  assert.deepEqual(locsOf("<urlset><url><loc> https://x.com/a?b=1&amp;c=2 </loc></url></urlset>"), ["https://x.com/a?b=1&c=2"]);
});

test("each sitemap store's URL pattern keeps its figure pages and nothing else", () => {
  const cases: Record<string, [string, boolean][]> = {
    figuya: [
      ["https://figuya.com/en/products/nendoroid-1536-kagome-higurashi", true],
      ["https://figuya.com/en/products/figma-116-black-rock-shooter-2035", true],
      ["https://figuya.com/de/products/nendoroid-1536-kagome-higurashi", false],
      ["https://figuya.com/en/products/chuya-nakahara-chain-collection", false],
    ],
    kurogami: [
      ["https://kurogami.com/en/product/denji-nendoroid-1560-chainsaw-man-1", true],
      ["https://kurogami.com/es/producto/nendoroid-denji-1560-chainsaw-man", false],
    ],
    yorokonde: [
      ["https://www.yorokonde.de/eng/figures/nendoroid/20831-delicious-in-dungeon-senshi-nendoroid-sw19945.html", true],
      ["https://www.yorokonde.de/eng/figures/nendoroid/", false],
      ["https://www.yorokonde.de/deu/figuren/nendoroid/20831-delicious-in-dungeon-senshi-nendoroid-sw19945.html", false],
    ],
  };
  for (const [id, urls] of Object.entries(cases)) {
    const s = STORES.find((x) => x.id === id);
    assert.ok(s?.sitemap && s.platform === "sitemap" && s.region === "EU", id);
    const re = new RegExp(s.sitemap.match, "i");
    for (const [u, want] of urls) assert.equal(re.test(u), want, `${id}: ${u}`);
  }
});
