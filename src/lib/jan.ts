// JAN (Japanese EAN-13) barcodes: the only thing a store listing is matched
// on. A listing without a valid Japanese JAN is skipped, never guessed from its
// title (research rule, 2026-10-28: figures come in look-alike versions,
// re-releases, store exclusives and fakes).

/** True for a 13-digit EAN with a correct check digit. */
export function validEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(code[i]) * (i % 2 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === Number(code[12]);
}

/** Japanese GS1 prefixes are 45 and 49; every Good Smile Company and Max
 *  Factory product carries one. */
export function isJapaneseJan(code: string): boolean {
  return validEan13(code) && (code.startsWith("45") || code.startsWith("49"));
}

/** Normalise a barcode field: digits only, a 12-digit UPC-A padded to EAN-13. */
export function normaliseBarcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = String(raw).replace(/[\s-]/g, "");
  if (!/^\d+$/.test(d)) return null;
  if (d.length === 13) return d;
  if (d.length === 12) return `0${d}`;
  return null;
}

const JAN_IN_TEXT = /(?:JAN|EAN|barcode|UPC)\s*(?:code)?\s*(?:[:：#]|no\.?)?\s*((?:45|49)\d{11})(?!\d)/gi;

/**
 * The JAN of a listing, from (in order) the variant's barcode field, its SKU,
 * and a labelled "JAN: …" in the description. Returns null unless exactly one
 * distinct valid Japanese JAN is found: a listing naming two barcodes (a set,
 * a bundle) is skipped.
 */
export function janOf(input: { barcode?: string | null; sku?: string | null; text?: string | null }): string | null {
  const bc = normaliseBarcode(input.barcode);
  if (bc && isJapaneseJan(bc)) return bc;
  const sku = normaliseBarcode(input.sku);
  if (sku && isJapaneseJan(sku)) return sku;
  if (input.text) {
    const found = new Set<string>();
    for (const m of input.text.matchAll(JAN_IN_TEXT)) if (isJapaneseJan(m[1])) found.add(m[1]);
    if (found.size === 1) return [...found][0];
  }
  return null;
}
