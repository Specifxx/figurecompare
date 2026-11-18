// How long a store that failed to read keeps its previous offers (stale-price guard, 2026-11-19).
//
// A store whose read fails keeps its last good offers so one timeout does not drop a product under the two-store rule.
// Until 2026-11-19 that carry had no end: a store blocked for two weeks still showed its two-week-old prices, "in stock",
// sometimes as the cheapest row, under a page that said "prices checked today". Now every store remembers its last good
// read (`lastOkAt`), and its offers are carried only while that read is under CARRY_HOURS old. After that the store's
// rows are dropped until it reads again. A store with no known good read is never carried.

/** Offers of a store that failed to read are kept at most this long after its last good read. */
export const CARRY_HOURS = 72;

interface Run {
  ok: boolean;
  lastOkAt?: string;
}

interface PrevMeta {
  updatedAt?: string;
  stores?: Record<string, Run>;
}

/** The last good read of a store, as of this run: now when it read, else what the previous run knew. */
export function lastGoodRead(id: string, ok: boolean, prev: PrevMeta | null | undefined, now: string): string | undefined {
  if (ok) return now;
  const p = prev?.stores?.[id];
  if (!p) return undefined;
  // Runs before 2026-11-19 recorded no lastOkAt: a store that read then read at the previous run's time.
  return p.lastOkAt ?? (p.ok ? prev?.updatedAt : undefined);
}

/**
 * Stamps every run with its last good read and returns the failed stores whose previous offers may still be shown
 * (last good read under CARRY_HOURS old). Failed stores past that are reported in `expired`.
 */
export function stampReads<R extends Run>(runs: Record<string, R>, prev: PrevMeta | null | undefined, now: Date): { carry: Set<string>; expired: string[] } {
  const iso = now.toISOString();
  const carry = new Set<string>();
  const expired: string[] = [];
  for (const [id, r] of Object.entries(runs)) {
    const at = lastGoodRead(id, r.ok, prev, iso);
    if (at) r.lastOkAt = at;
    else delete r.lastOkAt;
    if (r.ok) continue;
    const age = at ? now.getTime() - Date.parse(at) : Infinity;
    if (age <= CARRY_HOURS * 3_600_000) carry.add(id);
    else expired.push(id);
  }
  return { carry, expired };
}
