import { CHARACTERS, CHARACTER_MIN, type Character } from "@/content/characters";
import { getFigures, storeCount } from "./data";
import type { Figure } from "./types";

let memo: Map<string, Figure[]> | null = null;
/** Every character's figures, most-stocked first (ties by name). */
function byCharacter(): Map<string, Figure[]> {
  if (memo) return memo;
  const figs = getFigures();
  memo = new Map(CHARACTERS.map((c) => [c.slug, figs.filter((f) => c.re.test(f.name)).sort((a, b) => storeCount(b) - storeCount(a) || a.name.localeCompare(b.name))]));
  return memo;
}

export const figuresOfCharacter = (slug: string): Figure[] => byCharacter().get(slug) ?? [];
/** The characters with CHARACTER_MIN+ figures (owner 2026-11-08: a hub needs 3+), most figures first. */
export const liveCharacters = (): Character[] =>
  CHARACTERS.filter((c) => figuresOfCharacter(c.slug).length >= CHARACTER_MIN).sort((a, b) => figuresOfCharacter(b.slug).length - figuresOfCharacter(a.slug).length || a.name.localeCompare(b.name));
/** The live characters a figure belongs to (for its page's links). */
export const charactersOf = (f: Figure): Character[] => liveCharacters().filter((c) => c.re.test(f.name));
