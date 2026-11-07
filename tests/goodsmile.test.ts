import { test } from "node:test";
import assert from "node:assert/strict";
import { listUrl, parseListPage, parseProductPage } from "../src/lib/import/goodsmile";
import { readTitle } from "../src/lib/title";

// Real markup from goodsmile.com/en, 2026-11-07 (trimmed).
const LIST = `<div class="p-product-list__item">
    <a class="p-product-list__link" href="/en/product/1137156">
        <div class="b-product-item ">
            <div class="b-product-item__title">
                <h2 class="c-title c-title--level8">Nendoroid Plus Chisato Nishikigi Rubber Mascot</h2>
            </div>
            <div class="b-product-item__price"><p class="c-price__text"><span class="c-price__main">￥1,400</span></p></div>
        </div>
    </a>
</div>
<div class="p-product-list__item">
    <a class="p-product-list__link" href="/en/product/1141832">
        <div class="b-product-item ">
            <div class="b-product-item__title">
                <h2 class="c-title c-title--level8">Nendoroid Gintoki Sakata</h2>
            </div>
        </div>
    </a>
</div>`;

const PRODUCT = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","productID":"1146568","name":"Super Creek","brand":"Phat! Company","category":"Scale Figure","gtin":"4580678968605","image":"/gsc-webrevo-sdk-storage-prd/product/image/1146568/K8Q.jpg","url":"https://www.goodsmile.com/en/product/1146568/Super+Creek","offers":{"@type":"Offer","availability":"https://schema.org/PreOrder","price":"28800","priceCurrency":"JPY"}}
</script>`;

test("Good Smile list fragment: product id and English title", () => {
  const items = parseListPage(LIST);
  assert.deepEqual(items, [
    { id: "1137156", name: "Nendoroid Plus Chisato Nishikigi Rubber Mascot" },
    { id: "1141832", name: "Nendoroid Gintoki Sakata" },
  ]);
  assert.ok("refused" in readTitle(items[0].name), "a Nendoroid Plus mascot is not a figure");
  assert.ok(!("refused" in readTitle(items[1].name)));
});

test("Good Smile product page: JAN from gtin, yen price, pre-order", () => {
  const p = parseProductPage(PRODUCT, "https://www.goodsmile.com");
  assert.deepEqual(p, {
    jan: "4580678968605",
    yen: 28800,
    st: "pre",
    img: "https://www.goodsmile.com/gsc-webrevo-sdk-storage-prd/product/image/1146568/K8Q.jpg",
    url: "https://www.goodsmile.com/en/product/1146568/Super+Creek",
  });
  assert.equal(parseProductPage(PRODUCT.replace("JPY", "USD"), "https://www.goodsmile.com"), null);
});

test("Good Smile list URL asks one line and one stock state", () => {
  const u = new URL(listUrl("https://www.goodsmile.com", 6, "2", 60));
  assert.equal(u.pathname, "/en/search/list");
  const f = JSON.parse(u.searchParams.get("filter")!);
  assert.deepEqual(f.search_category, [6]);
  assert.equal(f.search_status, "2");
  assert.equal(u.searchParams.get("offset"), "60");
});
