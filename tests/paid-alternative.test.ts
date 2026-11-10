// The paid alternative under the cheapest store (lib/paid-alternative.ts, 2026-11-10).
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { PAID_ALTERNATIVE_BAND, paidAlternative, type PaidCandidate } from "../src/lib/paid-alternative";

const c = (name: string, p: number): PaidCandidate => ({ name, p, href: `https://x/${name}`, source: name.toLowerCase() });

test("names the cheapest paid row within 20% of an unpaid cheapest store, with how much more it is", () => {
  const alt = paidAlternative({ p: 2000, paid: false }, [c("Amazon", 2300), c("eBay", 2200)]);
  assert.equal(alt?.c.name, "eBay");
  assert.equal(alt?.pctMore, 10);
  assert.equal(PAID_ALTERNATIVE_BAND, 1.2);
  assert.equal(paidAlternative({ p: 2000, paid: false }, [c("eBay", 2400)])?.pctMore, 20, "exactly 20% more still counts");
});

test("nothing when the cheapest store pays, nothing qualifies, or there is no store price", () => {
  assert.equal(paidAlternative({ p: 2000, paid: true }, [c("eBay", 2100)]), null);
  assert.equal(paidAlternative({ p: 2000, paid: false }, [c("eBay", 2401)]), null, "over 20% more");
  assert.equal(paidAlternative({ p: 2000, paid: false }, []), null);
  assert.equal(paidAlternative(null, [c("eBay", 2100)]), null);
  assert.equal(paidAlternative({ p: 2000, paid: false }, [c("eBay", 0)]), null, "an unpriced row is never quoted");
});

test("a paid row cheaper than the cheapest store is quoted at its price, never as a percentage below", () => {
  assert.equal(paidAlternative({ p: 2000, paid: false }, [c("eBay", 1900)])?.pctMore, 0);
});

test("the hero and the phone buy bar carry it, tracked as their own _alt placements", () => {
  const page = fs.readFileSync("src/app/figure/[slug]/page.tsx", "utf8");
  assert.match(page, /"hero_alt"/);
  assert.match(page, /"buybar_alt"/);
  assert.match(fs.readFileSync("src/components/PaidAlt.tsx", "utf8"), /Paid link/);
});
