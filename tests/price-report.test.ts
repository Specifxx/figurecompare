import { test } from "node:test";
import assert from "node:assert/strict";
import { regionStats, reportMonth, typicalPrice, type ReportItem } from "../src/lib/price-report";

const item = (...o: [string, number, "in" | "pre" | "out"][]): ReportItem => ({ offers: { US: o.map(([s, p, st]) => ({ s, p, st })) } });

test("region stats: orderable items, compared items and the store gap", () => {
  const items = [item(["a", 80, "in"], ["b", 100, "in"]), item(["a", 95, "in"], ["c", 100, "pre"]), item(["a", 50, "in"]), item(["b", 10, "out"], ["c", 20, "out"])];
  const r = regionStats(items, "US");
  assert.equal(r.orderable, 3);
  assert.equal(r.compared, 2);
  assert.equal(r.stores, 3);
  assert.ok(Math.abs((r.medianGap ?? 0) - 0.125) < 1e-9);
  assert.equal(r.gap10, 0.5);
  assert.equal(regionStats(items, "UK").medianGap, null);
});

test("typical price is the median of each item's cheapest orderable price", () => {
  assert.equal(typicalPrice([item(["a", 80, "in"], ["b", 100, "in"]), item(["a", 50, "in"]), item(["a", 70, "out"])], "US"), 65);
});

test("the report month comes from the data date", () => {
  assert.equal(reportMonth("2026-11-02T08:00:00Z"), "November 2026");
});
