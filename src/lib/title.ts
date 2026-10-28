// What a store title is. The barcode decides WHICH product a listing is; the
// title only decides whether it belongs on the site at all (a line we cover,
// new, not an accessory) and gives us a readable name. Every rule changed here
// gets a real store title in tests/title.test.ts.
import type { LineKey } from "@/site";

export type Refusal =
  | "not-a-line"
  | "accessory"
  | "pre-owned"
  | "damaged"
  | "bootleg"
  | "bundle"
  | "lucky-bag";

export interface TitleInfo {
  line: LineKey;
  /** Nendoroid / figma catalogue number ("1234", "1234-DX", "SP-123"), when the title has one. */
  number: string | null;
  preorder: boolean;
}

// Nendoroid sub-lines that are not Nendoroid figures (parts, plush, dolls,
// mini figures), and figma's non-figure products.
const NOT_FIGURE =
  /\bnendoroid\s*(more|plus|petite|doll|swacchao|surprise|play\s*set|playset|pouch|parts|face\s*parts|customi[sz]able|accessor|stand|base|keychain|key\s*chain|strap|acrylic|plush|cushion)|\bfigma\s*(styles?|parts|stand|base|accessor)|\b(plush|keychain|key\s*chain|acrylic\s*stand|t-?shirt|hoodie|poster|mouse\s*pad|tapestry|sticker|badge|art\s*book|artbook|empty\s*box|box\s*only|display\s*case|dust\s*cover|replacement|custom\s*face|face\s*plate|faceplate|decal)\b/i;
const PRE_OWNED = /\b(pre-?owned|pre-?loved|second\s*-?\s*hand|used|loose|opened|open\s*box|no\s*box|unboxed|b-?grade|grade\s*[bc])\b/i;
const DAMAGED = /\b(damaged?|dented|crushed|box\s*damage|imperfect|defect|as[\s-]is|missing)\b/i;
const BOOTLEG = /\b(bootleg|replica|knock-?off|unofficial|fake|copy\s*version)\b/i;
const BUNDLE = /\b(bundle|set\s*of\s*\d|lot\s*of|\d\s*x\s+nendoroid|combo)\b|\s\+\s/i;
const LUCKY = /\b(lucky\s*bag|mystery\s*(box|bag)|blind\s*box|random)\b/i;
const PREORDER = /\b(pre-?order|preorder|p\/o|coming\s*soon|reservation|backorder)\b|【予約】|予約/i;

/** Which figure line a title is, or null. POP UP PARADE is checked first:
 *  "POP UP PARADE ... (Nendoroid ver.)" style titles exist. */
export function lineOf(title: string): LineKey | null {
  if (/\bpop\s*up\s*parade\b/i.test(title) || /\bPUP\b/.test(title)) return "pop-up-parade";
  if (/\bnendoroid\b|ねんどろいど/i.test(title)) return "nendoroid";
  if (/\bfigma\b/.test(title) || /\bFIGMA\b/.test(title) || /\bFigma\s*(?:#|No\.?\s*)?\d/.test(title)) return "figma";
  return null;
}

/** The catalogue number in a Nendoroid or figma title. */
export function numberOf(title: string, line: LineKey): string | null {
  if (line === "nendoroid") {
    // "Nendoroid 2345", "Nendoroid No.2345", "Nendoroid - 2345 Frieren", or a
    // store that leads with it: "2345 Frieren Nendoroid".
    const m =
      title.match(/nendoroid\s*(?:[-–:]\s*)?(?:no\.?|#)?\s*(\d{2,4}(?:-?(?:a|b|c|d|dx|sp))?)\b(?!\.\d)/i) ??
      title.match(/^\s*(?:#|no\.?\s*)?(\d{3,4}(?:-?(?:dx|sp))?)\b(?!\.\d)\s+(?=\D)/i) ??
      // "... Nendoroid Aang - 1867", "Nendoroid Death Note L 2.0 - 1200"
      title.match(/\s[-–#]\s*(\d{3,4}(?:-?dx)?)\s*$/i);
    return m ? m[1].toUpperCase().replace(/^0+(?=\d)/, "").replace(/^(\d+)([A-Z])/, "$1-$2") : null;
  }
  if (line === "figma") {
    const m = title.match(/figma\s*(?:no\.?|#)?\s*((?:sp-|ex-)?\d{1,3}(?:-?(?:dx|a|b))?)\b/i);
    return m ? m[1].toUpperCase().replace(/^(\d+)([A-Z])/, "$1-$2") : null;
  }
  return null;
}

/** Read a store title. Returns a refusal reason or the line and number. */
export function readTitle(title: string): TitleInfo | { refused: Refusal } {
  const line = lineOf(title);
  if (!line) return { refused: "not-a-line" };
  if (NOT_FIGURE.test(title)) return { refused: "accessory" };
  if (PRE_OWNED.test(title)) return { refused: "pre-owned" };
  if (DAMAGED.test(title)) return { refused: "damaged" };
  if (BOOTLEG.test(title)) return { refused: "bootleg" };
  if (LUCKY.test(title)) return { refused: "lucky-bag" };
  if (BUNDLE.test(title)) return { refused: "bundle" };
  return { line, number: numberOf(title, line), preorder: PREORDER.test(title) };
}

// Store noise stripped before a title becomes a product name.
const NOISE = [
  /【[^】]*】/g,
  /\[(?:pre-?order|preorder|in\s*stock|instock|new|restock|re-?release|ready\s*stock|sale|hot|limited)[^\]]*\]/gi,
  /\((?:pre-?order|preorder|in\s*stock|ready\s*stock|restock|re-?release|eta|est\.?|ships?|release|deposit)[^)]*\)/gi,
  /\b(?:pre-?order|preorder)\b\s*[:\-–]?/gi,
  /\b(?:eta|est\.?\s*release|release(?:d|s)?\s*(?:date)?|ships?\s*in|arriving)\s*[:\-–]?\s*(?:q[1-4]|early|mid|late|end)?\s*(?:[a-z]{3,9}\.?\s*)?(?:20\d\d)?\b/gi,
  /\b(?:good\s*smile\s*company|good\s*smile|gsc|max\s*factory)\b\s*[:\-–]?/gi,
  /\b(?:anime\s*)?(?:action\s*)?figure\b$/i,
  /\s{2,}/g,
];

/** A clean display name from a store title ("[PRE-ORDER] Good Smile Company
 *  Nendoroid 2345 Frieren (ETA Mar 2027)" → "Nendoroid 2345 Frieren"). */
export function cleanName(title: string): string {
  let t = title;
  for (const re of NOISE) t = t.replace(re, " ");
  t = t
    .replace(/\s+([,:;])/g, "$1")
    .replace(/^[\s\-–:|,]+|[\s\-–:|,]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Shouting stores: "NENDOROID FRIEREN" → title case, keeping figma lower-case.
  if (t.length > 8 && t === t.toUpperCase()) {
    t = t.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
  }
  t = t.replace(/\bfigma\b/gi, "figma").replace(/\bnendoroid\b/gi, "Nendoroid").replace(/\bpop\s*up\s*parade\b/gi, "POP UP PARADE");
  return t;
}

const LINE_TOKEN: Record<LineKey, RegExp> = {
  nendoroid: /\bnendoroid\b/gi,
  figma: /\bfigma\b/gi,
  "pop-up-parade": /\bpop\s*up\s*parade\b/gi,
};
const LINE_LABEL: Record<LineKey, string> = { nendoroid: "Nendoroid", figma: "figma", "pop-up-parade": "POP UP PARADE" };
const SEP = /^[\s\-–—:|,#/]+|[\s\-–—:|,#/]+$/g;

/**
 * One name shape for every store's way of writing a title: the line first,
 * then the rest with the catalogue number taken out (the page shows it on its
 * own), store filler removed, and the line word in the middle turned into a
 * dash. "2014 Chainsaw Man Nendoroid Kobeni" → "Nendoroid Chainsaw Man - Kobeni",
 * "(Stellar Blade) EVE | Nendoroid #2932" → "Nendoroid EVE (Stellar Blade)".
 */
export function tidyName(title: string, line: LineKey, number: string | null): string {
  let t = cleanName(title)
    .replace(/\(\s*\)|\[\s*\]/g, " ")
    .replace(/\((?:re-?run|re-?issue|re-?release|reprint)\)|\b(?:re-?run|reissue)\b/gi, " ")
    .replace(/\banime\s*collectibles?\b|\bcollectible\s*figure\b/gi, " ")
    .replace(/\bpvc\s*fig(?:ure)?\b\.?|\b(?:non-?scale\s+)?(?:pvc\s+)?figure\b/gi, " ");
  if (number) {
    const n = "0*" + number.replace(/-/g, "-?").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`(?:#|\\bno\\.?\\s*)?(?<![\\w.])${n}\\b(?!\\.\\d)\\s*:?`, "gi"), " ");
  }
  if (line !== "pop-up-parade") t = t.replace(/^\s*\d{3,4}\s+(?=\D)/, " ");
  const parts = t
    .split(LINE_TOKEN[line])
    .map((p) => p.replace(/\s*[|–—]\s*/g, " - ").replace(/\s{2,}/g, " ").replace(SEP, "").trim())
    .filter(Boolean);
  let rest = parts.join(" - ").replace(/(?:\s-\s)+/g, " - ").replace(/\s-\s(?=[([])/g, " ").replace(SEP, "");
  // "(Series) Character" → "Character (Series)".
  const lead = rest.match(/^\(([^)]+)\)\s*(.+)$/);
  if (lead) rest = `${lead[2]} (${lead[1]})`;
  return rest ? `${LINE_LABEL[line]} ${rest}` : LINE_LABEL[line];
}

/** Pick the product's display name from every store's cleaned title: the most
 *  common one wins, then the one that carries the catalogue number, then the
 *  shortest that still says more than the line name. */
export function pickName(titles: string[], number: string | null): string {
  const names = titles.map(cleanName).filter((n) => n.length >= 6);
  if (!names.length) return cleanName(titles[0] ?? "");
  const count = new Map<string, number>();
  for (const n of names) count.set(n.toLowerCase(), (count.get(n.toLowerCase()) ?? 0) + 1);
  const score = (n: string) =>
    (count.get(n.toLowerCase()) ?? 0) * 1000 + (number && n.includes(number) ? 500 : 0) - Math.abs(n.length - 48);
  return names.slice().sort((a, b) => score(b) - score(a) || a.localeCompare(b))[0];
}
