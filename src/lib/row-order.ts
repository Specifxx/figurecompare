// Price-row order (owner, 2026-11-17, final): eBay first, then TCGplayer (TCG sites only), then Amazon (priced, or the unpriced
// "Check on Amazon" row), then the other affiliated rows (partner rows, and any in-stock store that pays us) cheapest first; then the
// cheapest store that is not affiliated; then every other store in price order. The pinned rows keep the order they are built in
// (eBay, Amazon, partners). A sold-out store stays with the stores. Never a paywall: every price is shown.
// Identical in every site's repo (tests/row-order.test.ts).
export interface OrderRow {
  paid: boolean;
  price: string | null;
  status: string | null;
  cart?: { priceCents: number };
}

const cents = (r: OrderRow): number | null => (r.price !== null && r.cart && r.cart.priceCents > 0 ? r.cart.priceCents : null);
const affiliated = (r: OrderRow): boolean => r.paid && r.status !== "out";

export function orderRows<T extends OrderRow>(pinned: T[], stores: T[]): { pinned: T[]; stores: T[] } {
  const paidStores = stores.filter(affiliated);
  const priced = paidStores.filter((r) => cents(r) !== null).sort((a, b) => cents(a)! - cents(b)!);
  const unpriced = paidStores.filter((r) => cents(r) === null);
  return { pinned: [...pinned, ...priced, ...unpriced], stores: stores.filter((r) => !affiliated(r)) };
}
