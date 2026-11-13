import { test } from "node:test";
import assert from "node:assert/strict";
import { CACHE_DAYS, inBand, indexByName, locsOf, matchByName, parseProductPage, pickPages, variantMarks, type PageCache } from "../src/lib/import/sitemap-store";
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

test("Mangatori: JSON-LD with a relative photo, and its URL pattern", () => {
  const p = parseProductPage(MANGATORI, "https://www.mangatori.fr");
  assert.equal(p?.jan, "4580828673212");
  assert.equal(p?.price, 89.99);
  assert.equal(p?.st, "in");
  assert.equal(p?.img, "https://www.mangatori.fr/3081055-home_default/good-smile-company-gsc67321-hatsune-miku-gt-project-figurine-nendoroid.jpg");
  const re = new RegExp(STORES.find((s) => s.id === "mangatori")!.sitemap!.match, "i");
  assert.ok(re.test("https://www.mangatori.fr/hatsune-miku/860520-good-smile-company-gsc67321-hatsune-miku-gt-project-figurine-nendoroid-4580828673212.html"));
  assert.ok(!re.test("https://www.mangatori.fr/57161-nendoroid"));
});

// gamersheek.co.uk/item/Good-Smile-Company/Blue-Archive-Nendoroid-Kei-Tendou/ECW (2026-11-13, trimmed): no JSON-LD,
// no barcode, the product's offer first and related products' offers after it.
const GAMERSHEEK = (avail: string, pre = false) => `<meta property="og:title" content="Blue Archive Nendoroid Kei Tendou" />
<meta property="og:image" content="https://d3limvviwfp5qk.cloudfront.net/product-media/30R7/1000/1000/001.webp" />
<meta itemprop="mpn" content="GSUK66787">
<h1 itemprop="name"><span class="brand" itemprop="brand">Good Smile Company&nbsp;</span><span class="description" itemprop="description">Blue Archive Nendoroid Kei Tendou</span></h1>
<div class="price-holder" id="price-holder-18608" itemprop="offers" itemscope itemtype="http://schema.org/Offer" rel="18608" data-price="54.95">
  <link itemprop="availability" href="http://schema.org/${avail}" content="${avail}"/>
  <meta itemprop="priceCurrency" content="GBP">
  <span class="price"><span class="curr-symbol">&#163;</span><span class="price-val" itemprop="price" content="54.95">54.95</span></span>
  <link itemprop="itemCondition" href="http://schema.org/NewCondition">
</div>
${pre ? '<input type="checkbox" id="preorderAcknowledgement" class="checkbox" />' : ""}
<div class="price-holder" id="price-holder-18604" rel="18604" itemprop="offers" itemscope itemtype="http://schema.org/Offer" data-price="74.95">
  <link itemprop="availability" href="http://schema.org/InStock" content="InStock"/><meta itemprop="priceCurrency" content="GBP"><span class="price-val" itemprop="price" content="74.95">
</div>`;

test("Gamersheek: the page's own offer (not a related product's), no barcode, pre-orders by their acknowledgement box", () => {
  const p = parseProductPage(GAMERSHEEK("InStock"), "https://www.gamersheek.co.uk", "offer-microdata");
  assert.deepEqual(p, { name: "Blue Archive Nendoroid Kei Tendou", jan: null, price: 54.95, currency: "GBP", st: "in", img: "https://d3limvviwfp5qk.cloudfront.net/product-media/30R7/1000/1000/001.webp" });
  assert.equal(parseProductPage(GAMERSHEEK("InStock", true), "https://www.gamersheek.co.uk", "offer-microdata")?.st, "pre");
  assert.equal(parseProductPage(GAMERSHEEK("OutOfStock"), "https://www.gamersheek.co.uk", "offer-microdata")?.st, "out");
  const s = STORES.find((x) => x.id === "gamersheek")!;
  assert.ok(s.region === "UK" && s.sitemap?.byName && s.sitemap.reader === "offer-microdata");
  const re = new RegExp(s.sitemap!.match, "i");
  assert.ok(re.test("https://www.gamersheek.co.uk/item/Good-Smile-Company/Blue-Archive-Nendoroid-Kei-Tendou/ECW"));
  assert.ok(!re.test("https://www.gamersheek.co.uk/collectibles/good-smile-company/nendoroid?p=view-all"));
  // Only stores the owner's rule covers are matched by name.
  assert.deepEqual(STORES.filter((x) => x.sitemap?.byName).map((x) => x.id), ["gamersheek"]);
});

const N = (jan: string, title: string, cents = 5000, region: "UK" | "US" = "UK") => ({ store: "s", region, title, jan, cents, st: "in" as const, url: "", img: null });

test("a name names one figure, both ways, or none", () => {
  const idx = indexByName([
    N("4570232590250", "Nendoroid Zenless Zone Zero - Sunna"),
    N("4570232590250", "Zenless Zone Zero Sunna Nendoroid Figur Good Smile Company"),
    N("4580590100000", "Nendoroid Hatsune Miku"),
    N("4580590100001", "Nendoroid Hatsune Miku: Snow Ver."),
    N("4580590123489", "Nendoroid 1536 Kagome Higurashi"),
  ]);
  assert.equal(matchByName("Zenless Zone Zero Nendoroid Sunna", idx), "4570232590250");
  assert.equal(matchByName("Vocaloid Nendoroid Hatsune Miku", idx), null); // "vocaloid" is no store's word for it
  assert.equal(matchByName("Nendoroid Hatsune Miku", idx), "4580590100000");
  assert.equal(matchByName("Nendoroid Hatsune Miku Snow Ver", idx), "4580590100001");
  assert.equal(matchByName("Zenless Zone Zero Nendoroid Sunna Swimsuit", idx), null);
  assert.equal(matchByName("Zenless Zone Zero - Pop Up Parade Sunna", idx), null);
  assert.equal(matchByName("Inuyasha Nendoroid 1537 Kagome Higurashi", idx), null);
  assert.equal(matchByName("Zenless Zone Zero - Nendoroid Doll Sunna", idx), null);
});

test("a DX, a 2.0 or an L-size title only fits a figure a barcode store calls the same", () => {
  assert.deepEqual(variantMarks("STEEL BALL RUN Nendoroid Johnny Joestar DX"), ["~dx"]);
  assert.deepEqual(variantMarks("K-ON! Nendoroid Mio Akiyama 2.0"), ["~v2"]);
  assert.deepEqual(variantMarks("DARLING in the FRANXX POP UP PARADE L Zero Two"), ["~l"]);
  assert.deepEqual(variantMarks("POP UP PARADE Renne L Size"), ["~l"]);
  assert.deepEqual(variantMarks("Nendoroid Loid Forger"), []);
  const idx = indexByName([
    N("4580590100010", "Nendoroid JoJo's Bizarre Adventure Steel Ball Run - Johnny Joestar"),
    N("4580590100027", "POP UP PARADE Darling in the Franxx - Zero Two"),
    N("4580590100034", "Nendoroid K-ON! - Mio Akiyama 2.0"),
  ]);
  assert.equal(matchByName("STEEL BALL RUN JoJo's Bizarre Adventure Nendoroid Johnny Joestar", idx), "4580590100010");
  assert.equal(matchByName("STEEL BALL RUN JoJo's Bizarre Adventure Nendoroid Johnny Joestar DX", idx), null);
  assert.equal(matchByName("DARLING in the FRANXX POP UP PARADE L Zero Two", idx), null);
  assert.equal(matchByName("DARLING in the FRANXX POP UP PARADE Zero Two", idx), "4580590100027");
  assert.equal(matchByName("K-ON! Nendoroid Mio Akiyama", idx), null);
  assert.equal(matchByName("K-ON! Nendoroid Mio Akiyama 2.0", idx), "4580590100034");
});

test("a name match also needs a nearby price from another store in its region", () => {
  assert.equal(inBand(5495, [4999, 5800]), true);
  assert.equal(inBand(12000, [4999, 5800]), false);
  assert.equal(inBand(5495, undefined), false);
  const idx = indexByName([N("4570232590250", "Nendoroid Zenless Zone Zero - Sunna", 4999, "US")]);
  assert.equal(idx["4570232590250"].prices.UK, undefined);
});
