import { test } from "node:test";
import assert from "node:assert/strict";
import { CARRY_HOURS, lastGoodRead, stampReads } from "@/lib/import/carry";

const now = new Date("2026-11-19T18:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

test("a store that read today is stamped now and never carried", () => {
  const runs = { a: { ok: true } as { ok: boolean; lastOkAt?: string } };
  const { carry, expired } = stampReads(runs, null, now);
  assert.equal(runs.a.lastOkAt, now.toISOString());
  assert.equal(carry.size, 0);
  assert.deepEqual(expired, []);
});

test("a store that failed today keeps its offers while its last good read is under the limit", () => {
  const runs = { a: { ok: false } as { ok: boolean; lastOkAt?: string } };
  const prev = { updatedAt: hoursAgo(24), stores: { a: { ok: true } } };
  const { carry } = stampReads(runs, prev, now);
  assert.ok(carry.has("a"));
  assert.equal(runs.a.lastOkAt, hoursAgo(24));
});

test("a store failing for longer than the limit is not carried: its old prices leave the site", () => {
  const runs = { a: { ok: false } as { ok: boolean; lastOkAt?: string } };
  const prev = { updatedAt: hoursAgo(24), stores: { a: { ok: false, lastOkAt: hoursAgo(CARRY_HOURS + 1) } } };
  const { carry, expired } = stampReads(runs, prev, now);
  assert.equal(carry.size, 0);
  assert.deepEqual(expired, ["a"]);
  assert.equal(runs.a.lastOkAt, hoursAgo(CARRY_HOURS + 1), "the last good read is remembered, not reset");
});

test("a store that failed with no known good read (old meta, or never read) is never carried", () => {
  const runs = { a: { ok: false }, b: { ok: false } } as Record<string, { ok: boolean; lastOkAt?: string }>;
  const prev = { updatedAt: hoursAgo(24), stores: { a: { ok: false } } };
  const { carry, expired } = stampReads(runs, prev, now);
  assert.equal(carry.size, 0);
  assert.deepEqual(expired.sort(), ["a", "b"]);
});

test("the last good read survives a chain of failed runs", () => {
  assert.equal(lastGoodRead("a", false, { updatedAt: hoursAgo(24), stores: { a: { ok: false, lastOkAt: hoursAgo(48) } } }, now.toISOString()), hoursAgo(48));
});
