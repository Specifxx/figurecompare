import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { isHalloween, isChristmas, seasonAt, SEASON_BOOT_SCRIPT } from "../src/lib/season";

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

test("Christmas runs 1 November to Boxing Day every year, by the visitor's own date", () => {
  assert.equal(isChristmas(new Date(2026, 9, 31, 23, 59)), false);
  assert.equal(isChristmas(new Date(2026, 10, 1, 0, 0)), true);
  assert.equal(isChristmas(new Date(2026, 11, 26, 23, 59)), true);
  assert.equal(isChristmas(new Date(2026, 11, 27, 0, 0)), false);
  assert.equal(isChristmas(new Date(2027, 10, 20)), true, "it comes back every year");
  assert.equal(seasonAt(new Date(2026, 9, 30)), "halloween");
  assert.equal(seasonAt(new Date(2026, 11, 1)), "christmas");
});

test("the boot script stamps Christmas, and ?season= previews or hides it", () => {
  const run = (d: Date, search = "") => {
    const attrs: Record<string, string> = {};
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor() {
        super(d.getTime());
      }
    }
    vm.runInNewContext(SEASON_BOOT_SCRIPT, { Date: FixedDate, location: { search }, document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } } });
    return attrs["data-season"] ?? null;
  };
  for (const d of [new Date(2026, 9, 30), new Date(2026, 10, 1), new Date(2026, 11, 26), new Date(2026, 11, 27), new Date(2027, 2, 3)]) assert.equal(run(d), seasonAt(d), d.toDateString());
  assert.equal(run(new Date(2027, 2, 3), "?season=christmas"), "christmas");
  assert.equal(run(new Date(2026, 10, 20), "?season=off"), null);
});

test("Christmas is at most one quiet line, never a costume (owner, 2026-11-08: the theme must match the domain)", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  for (const gone of [".xmas-snow", ".xmas-lights", ".xmas-art", ".xmas-logo-hat", ".xmas-banner", "/xmas/", "#dc2626 0 10px"]) {
    assert.ok(!css.includes(gone), `${gone} is gone`);
  }
  assert.doesNotMatch(css, /data-season="christmas"\][^{]*\{[^}]*--(brand|spark|lilac)/, "no palette swap");
  assert.match(css, /\.xmas-pill \{[^}]*color: inherit;/, "the one line is drawn in the site's own colours");
});
