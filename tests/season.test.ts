import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { isHalloween, SEASON_BOOT_SCRIPT } from "../src/lib/season";

test("the Halloween look runs 29–31 October 2026 only, by the visitor's own date", () => {
  assert.equal(isHalloween(new Date(2026, 9, 28, 23, 59)), false);
  assert.equal(isHalloween(new Date(2026, 9, 29, 0, 0)), true);
  assert.equal(isHalloween(new Date(2026, 9, 31, 23, 59)), true);
  assert.equal(isHalloween(new Date(2026, 10, 1, 0, 0)), false);
  assert.equal(isHalloween(new Date(2027, 9, 30)), false);
});

test("the boot script agrees with isHalloween() and never throws", () => {
  for (const d of [new Date(2026, 9, 28), new Date(2026, 9, 29), new Date(2026, 9, 31), new Date(2026, 10, 1)]) {
    const attrs: Record<string, string> = {};
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor() {
        super(d.getTime());
      }
    }
    vm.runInNewContext(SEASON_BOOT_SCRIPT, { Date: FixedDate, document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } } });
    assert.equal(attrs["data-season"] === "halloween", isHalloween(d), d.toDateString());
  }
  assert.doesNotThrow(() => vm.runInNewContext(SEASON_BOOT_SCRIPT, { Date }));
});
