import { test } from "node:test";
import assert from "node:assert/strict";
import { REGIONS } from "../src/site";
import { bestIn, featureFloor, featuredPopularIn, getFigures } from "../src/lib/data";

test("home shelves keep to figures at or above the region floor", () => {
  for (const r of REGIONS) {
    const floor = featureFloor(r.code);
    const above = getFigures().filter((f) => (bestIn(f, r.code)?.offer.p ?? 0) >= floor && floor > 0).length;
    if (above < 4) continue; // a thin region falls back to the old list
    for (const f of featuredPopularIn(r.code, 8)) assert.ok((bestIn(f, r.code)?.offer.p ?? 0) >= floor, `${f.slug} ${r.code}`);
  }
});
