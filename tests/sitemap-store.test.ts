import { test } from "node:test";
import assert from "node:assert/strict";
import { CACHE_DAYS, inBand, indexByName, locsOf, matchByName, parseProductPage, pickPages, type PageCache } from "../src/lib/import/sitemap-store";
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
  assert.deepEqual(pickPages(["e", "a", "b", "c", "d"], cache, 3), ["b", "c", "e"]);
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

// mangatori.fr (PrestaShop JSON-LD, 2026-11-07, trimmed).
const MANGATORI = `<script type="application/ld+json">{ "@context": "http://schema.org/", "@type": "Product", "name": "Hatsune Miku GT Project figurine Nendoroid Racing Miku: 2026 Ver. 10 cm", "image" :"/3081055-home_default/good-smile-company-gsc67321-hatsune-miku-gt-project-figurine-nendoroid.jpg", "sku": "GSC67321", "gtin13": "4580828673212", "offers": { "@type": "Offer", "priceCurrency": "EUR", "price": "89.99", "gtin13": "4580828673212", "availability": "http://schema.org/InStock" } }</script>`;

// animeimport.it (WooCommerce + Elementor, no JSON-LD; a related product's price follows).
const ANIMEIMPORT = (button: string) => `<h1 class="product_title entry-title elementor-heading-title elementor-size-default">Nagito Komaeda Nendoroid</h1>
<p class="price nasa-single-product-price"><del aria-hidden="true"><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&euro;</span>65,00</bdi></span></del> <ins><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">&euro;</span>55,00</bdi></span></ins></p>
<p class="elementor-heading-title elementor-size-default">EAN: 4570232594333</p>
<form class="cart">${button ? `<button type="submit" name="add-to-cart" value="187514" class="ns-single-add-btn single_add_to_cart_button button alt">${button}</button>` : ""}</form>
<meta property="og:image" content="https://animeimport.it/wp-content/uploads/2026/10/4570232594333_1.webp" />
<p class="price"><span class="woocommerce-Price-amount amount">&euro;59,00</span></p>`;

test("Mangatori: JSON-LD with a relative photo", () => {
  const p = parseProductPage(MANGATORI, "https://www.mangatori.fr");
  assert.equal(p?.jan, "4580828673212");
  assert.equal(p?.price, 89.99);
  assert.equal(p?.st, "in");
  assert.equal(p?.img, "https://www.mangatori.fr/3081055-home_default/good-smile-company-gsc67321-hatsune-miku-gt-project-figurine-nendoroid.jpg");
});

test("Anime Import: the sale price, the EAN line, stock from the button", () => {
  const p = parseProductPage(ANIMEIMPORT("Pre-ordina"), "https://animeimport.it");
  assert.deepEqual(p, { name: "Nagito Komaeda Nendoroid", jan: "4570232594333", price: 55, currency: "EUR", st: "pre", img: "https://animeimport.it/wp-content/uploads/2026/10/4570232594333_1.webp" });
  assert.equal(parseProductPage(ANIMEIMPORT("Aggiungi al carrello"), "https://animeimport.it")?.st, "in");
  assert.equal(parseProductPage(ANIMEIMPORT(""), "https://animeimport.it")?.st, "out");
});

const L = (jan: string, title: string, cents = 8000, region: "EU" | "US" = "EU") => ({ store: "s", region, title, jan, cents, st: "in" as const, url: "", img: null });

test("Archonia: a name names one figure, both ways, or none", () => {
  const idx = indexByName([
    L("4570232590250", "Nendoroid Zenless Zone Zero - Sunna"),
    L("4570232590250", "Zenless Zone Zero Sunna Nendoroid Figur Good Smile Company"),
    L("4580590100000", "Nendoroid Hatsune Miku"),
    L("4580590100001", "Nendoroid Hatsune Miku: Snow Ver."),
    L("4580590123489", "Nendoroid 1536 Kagome Higurashi"),
  ]);
  assert.equal(matchByName("Zenless Zone Zero PVC Figure - Nendoroid Sunna", idx), "4570232590250");
  // The base figure, not the Snow version, and the Snow version, not the base.
  assert.equal(matchByName("Vocaloid PVC Figure - Nendoroid Hatsune Miku", idx), null); // "vocaloid" is no store's word for it
  assert.equal(matchByName("PVC Figure - Nendoroid Hatsune Miku", idx), "4580590100000");
  assert.equal(matchByName("PVC Figure - Nendoroid Hatsune Miku Snow Ver", idx), "4580590100001");
  // A variant the catalogue doesn't have is no match.
  assert.equal(matchByName("Zenless Zone Zero PVC Figure - Nendoroid Sunna Swimsuit", idx), null);
  // A different line, or a different number, is no match.
  assert.equal(matchByName("Zenless Zone Zero - Pop Up Parade Sunna", idx), null);
  assert.equal(matchByName("Inuyasha PVC Figure - Nendoroid 1537 Kagome Higurashi", idx), null);
  // Refused titles stay refused.
  assert.equal(matchByName("Zenless Zone Zero - Nendoroid Doll Sunna", idx), null);
});

test("Archonia: a name match also needs a nearby price from another store in its region", () => {
  assert.equal(inBand(8299, [7590, 9000]), true);
  assert.equal(inBand(20000, [7590, 9000]), false);
  assert.equal(inBand(8299, undefined), false);
  const idx = indexByName([L("4570232590250", "Nendoroid Zenless Zone Zero - Sunna", 7590, "US")]);
  assert.equal(idx["4570232590250"].prices.EU, undefined);
});

test("the URL patterns of Mangatori, Anime Import and Archonia", () => {
  const re = (id: string) => new RegExp(STORES.find((s) => s.id === id)!.sitemap!.match, "i");
  assert.ok(re("mangatori").test("https://www.mangatori.fr/hatsune-miku/860520-good-smile-company-gsc67321-hatsune-miku-gt-project-figurine-nendoroid-4580828673212.html"));
  assert.ok(!re("mangatori").test("https://www.mangatori.fr/57161-nendoroid"));
  assert.ok(re("animeimport").test("https://animeimport.it/product/nagito-komaeda-nendoroid/"));
  assert.ok(!re("animeimport").test("https://animeimport.it/product-category/figure/nendoroid-figure/"));
  assert.ok(re("archonia").test("https://www.archonia.com/en-us/product/561741/zenless-zone-zero-pvc-figure-nendoroid-sunna"));
  assert.ok(!re("archonia").test("https://www.archonia.com/nl-be/product/561741/zenless-zone-zero-pvc-figure-nendoroid-sunna"));
  assert.equal(STORES.find((s) => s.id === "archonia")!.sitemap!.byName, true);
});
