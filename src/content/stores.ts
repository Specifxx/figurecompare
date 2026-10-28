// Every store FigureCompare reads. Real shops only, never marketplaces (fakes).
// Each one is read through its public Shopify products.json or WooCommerce
// Store API, two at a time at most, about a request a second, and a store that
// keeps answering 403/429 is skipped for the run (never worked around).
// From the 2026-10-28 store probe (/mnt/project-files/next-niche/figure-stores.md
// in the project files): the readable Shopify stores with an anime-figure
// collection. No readable store is Japan-based yet.
import type { RegionCode } from "@/site";

export interface Store {
  id: string;
  name: string;
  region: RegionCode;
  /** https://host, no trailing slash */
  base: string;
  platform: "shopify" | "woo";
  /** Shopify: the figure collections the probe found. Each run first looks for
   *  Nendoroid / figma / POP UP PARADE / Good Smile collections in the store's
   *  /collections.json and reads those; these are the fallback. */
  collections?: string[];
  /** Woo: search terms (default: the three lines). */
  search?: string[];
  /** Pays us a commission (shown as "Paid link" and pinned only if cheapest). */
  affiliate?: { param: string; envVar: string };
}

export const STORES: Store[] = [
  { id: "blacklistcards", name: "Blacklist Cards", region: "AU", base: "https://blacklistcards.com", platform: "shopify", collections: ["popup-parade", "furyu-figures"] },
  { id: "collectorscompany", name: "Collectors Company", region: "AU", base: "https://collectorscompany.com.au", platform: "shopify", collections: ["figures"] },
  { id: "vault-collectables", name: "Filmsmen", region: "AU", base: "https://vault-collectables.com", platform: "shopify", collections: ["nendoroid"] },
  { id: "gameology", name: "Gameology", region: "AU", base: "https://gameology.com.au", platform: "shopify", collections: ["anime-figurines", "attack-on-titan-anime-figures"] },
  { id: "gamerholic", name: "Gamerholic", region: "AU", base: "https://gamerholic.com.au", platform: "shopify", collections: ["good-smile-company-figures", "nendoroid-figures"] },
  { id: "gametraderschermside", name: "Gametraders Chermside", region: "AU", base: "https://gametraderschermside.com.au", platform: "shopify", collections: ["anime-figurines", "figurine-bandai-banpresto", "figurine-bandai-banpresto-qposket", "figurine-sega"] },
  { id: "gametradersseaford", name: "Gametraders Seaford", region: "AU", base: "https://gametradersseaford.com.au", platform: "shopify", collections: ["anime-figures", "anime-figures-in-stock"] },
  { id: "gaminggrounds", name: "Gaming Grounds", region: "AU", base: "https://gaminggrounds.com.au", platform: "shopify", collections: ["collectable-figures"] },
  { id: "generalgames", name: "General Games", region: "AU", base: "https://generalgames.com.au", platform: "shopify", collections: ["nendoroids", "pop-up-parade"] },
  { id: "goodgames", name: "Good Games", region: "AU", base: "https://goodgames.com.au", platform: "shopify", collections: ["anime-figure", "bandai-figures"] },
  { id: "hobbykitz", name: "Hobby Kitz", region: "AU", base: "https://hobbykitz.com.au", platform: "shopify", collections: ["nendoroid"] },
  { id: "metrohobbies", name: "Metro Hobbies", region: "AU", base: "https://metrohobbies.com.au", platform: "shopify", collections: ["anime-figure-figma", "anime-action-figures", "anime-figure"] },
  { id: "pokebox", name: "PokéBox", region: "AU", base: "https://pokebox.com.au", platform: "shopify", collections: ["figures"] },
  { id: "popincollectables", name: "POPin Collectables", region: "AU", base: "https://popincollectables.com.au", platform: "shopify", collections: ["nendoroid"] },
  { id: "thefinalbosscollectables", name: "The Final Boss Collectables", region: "AU", base: "https://thefinalbosscollectables.com.au", platform: "shopify", collections: ["figurines"] },
  { id: "401games", name: "401 Games", region: "CA", base: "https://store.401games.ca", platform: "shopify", collections: ["all-non-scale-figures"] },
  { id: "acgamesonline", name: "A & C Games", region: "CA", base: "https://acgamesonline.com", platform: "shopify", collections: ["figma-figures", "banpresto-figures"] },
  { id: "animeotakuhobby", name: "Anime Otaku Hobby", region: "CA", base: "https://animeotakuhobby.com", platform: "shopify", collections: ["nendoroid"] },
  { id: "bentogaming", name: "Bento Gaming", region: "CA", base: "https://bentogaming.com", platform: "shopify", collections: ["nendoroid", "pop-up-parade", "anime-statue"] },
  { id: "cardcastergames", name: "Card Caster", region: "CA", base: "https://cardcastergames.com", platform: "shopify", collections: ["figures"] },
  { id: "derpycards", name: "Derpy Cards", region: "CA", base: "https://derpycards.ca", platform: "shopify", collections: ["anime-figurines"] },
  { id: "emmettstoystop", name: "Emmett's ToyStop", region: "CA", base: "https://emmettstoystop.com", platform: "shopify", collections: ["action-toy-figures"] },
  { id: "exorgames", name: "Exor Games Charlottetown", region: "CA", base: "https://exorgames.com", platform: "shopify", collections: ["all-figma", "all-nendoroid", "all-pop-up-parade"] },
  { id: "hobbiesville", name: "Hobbiesville", region: "CA", base: "https://hobbiesville.com", platform: "shopify", collections: ["bandai"] },
  { id: "lamoodcomics", name: "L.A. Mood Comics and Games", region: "CA", base: "https://lamoodcomics.ca", platform: "shopify", collections: ["anime-figures-1", "anime-figures"] },
  { id: "pandahobby", name: "Panda Hobby", region: "CA", base: "https://pandahobby.ca", platform: "shopify", collections: ["figma"] },
  { id: "pokejeux", name: "PokéJeux", region: "CA", base: "https://pokejeux.ca", platform: "shopify", collections: ["tout-nos-figurines"] },
  { id: "shopverse", name: "Shopverse", region: "CA", base: "https://shopverse.com", platform: "shopify", collections: ["bandai-figures", "scale-figures"] },
  { id: "skyfoxgames", name: "SKYFOX GAMES", region: "CA", base: "https://skyfoxgames.com", platform: "shopify", collections: ["figma", "anime-figures-1", "anime-figurines"] },
  { id: "torchlightgh", name: "Torchlight Games and Hobbies", region: "CA", base: "https://torchlightgh.com", platform: "shopify", collections: ["figma", "anime-figures", "furyu-figures"] },
  { id: "toysnowman", name: "Toy Snowman", region: "CA", base: "https://toysnowman.com", platform: "shopify", collections: ["anime"] },
  { id: "trinityhobby", name: "Trinity Hobby", region: "CA", base: "https://trinityhobby.com", platform: "shopify", collections: ["anime-figure", "anime-figure-1", "new-anime-figures"] },
  { id: "untouchables", name: "Untouchables", region: "CA", base: "https://untouchables.ca", platform: "shopify", collections: ["popup-parade-figures", "figma", "nendoroid-figures"] },
  { id: "gamestimeaversa", name: "Games Time Aversa", region: "EU", base: "https://gamestimeaversa.com", platform: "shopify", collections: ["nendoroid"] },
  { id: "ocare", name: "OCARE", region: "NZ", base: "https://ocare.co.nz", platform: "shopify", collections: ["figures", "figurines"] },
  { id: "otakumart", name: "Otaku Mart", region: "NZ", base: "https://otakumart.co.nz", platform: "shopify", collections: ["anime-figures", "articulated-anime-figures"] },
  { id: "playx", name: "PlayX", region: "NZ", base: "https://playx.co.nz", platform: "shopify", collections: ["anime-tv-film-model-kits-and-action-figures"] },
  { id: "popstop", name: "Pop Stop", region: "NZ", base: "https://popstop.co.nz", platform: "shopify", collections: ["anime-action-figures", "anime-vinyl-figures", "anime-figures-statues", "anime-figures-statues-hot-right-now", "anime-figures-and-statues-just-announced"] },
  { id: "theavidcollectors", name: "The Avid Collectors", region: "SG", base: "https://theavidcollectors.com", platform: "shopify", collections: ["figma", "nendoroid", "pop-up-parade"] },
  { id: "collecteebles", name: "Collecteebles", region: "UK", base: "https://collecteebles.co.uk", platform: "shopify", collections: ["toys"] },
  { id: "cgc-emporium", name: "Comics Games And Coffee", region: "UK", base: "https://cgc-emporium.com", platform: "shopify", collections: ["action-figures"] },
  { id: "japan2uk", name: "Japan2UK", region: "UK", base: "https://japan2uk.com", platform: "shopify", collections: ["banpresto-figures"] },
  { id: "koolthings", name: "Koolthings", region: "UK", base: "https://koolthings.co.uk", platform: "shopify", collections: ["anime-figurines"] },
  { id: "livingrealms", name: "Living Realms", region: "UK", base: "https://livingrealms.co.uk", platform: "shopify", collections: ["anime-figures-revised"] },
  { id: "collect", name: "TGC Collectables (The Game Collection)", region: "UK", base: "https://collect.thegamecollection.net", platform: "shopify", collections: ["anime-figures", "banpresto"] },
  { id: "thecardvault", name: "The Card Vault", region: "UK", base: "https://thecardvault.co.uk", platform: "shopify", collections: ["action-toy-figures"] },
  { id: "tokyotoys", name: "TokyoToys", region: "UK", base: "https://tokyotoys.com", platform: "shopify", collections: ["nendoroids", "pop-up-parade"] },
  { id: "zatu", name: "Zatu Games", region: "UK", base: "https://zatu.com", platform: "shopify", collections: ["action-figures"] },
  { id: "allaccesscardshop", name: "All Access Card Shop", region: "US", base: "https://allaccesscardshop.com", platform: "shopify", collections: ["anime-figures-statues"] },
  { id: "animeislandca", name: "Anime Island CA", region: "US", base: "https://animeislandca.com", platform: "shopify", collections: ["figures-figures"] },
  { id: "boardwipe", name: "Board Wipe", region: "US", base: "https://boardwipe.com", platform: "shopify", collections: ["anime-figures"] },
  { id: "collectorstore", name: "Collector Store", region: "US", base: "https://collectorstore.com", platform: "shopify", collections: ["plush-blind-boxes-anime-figures-more-sale", "anime-figures"] },
  { id: "dxgamesllc", name: "Dx Games & More", region: "US", base: "https://dxgamesllc.com", platform: "shopify", collections: ["anime-figurines"] },
  { id: "galactictoys", name: "Galactic Toys & Collectibles", region: "US", base: "https://galactictoys.com", platform: "shopify", collections: ["attack-on-titan-nendoroid", "bandai-ichibansho-figures"] },
  { id: "gamersngeeks", name: "Gamers N Geeks", region: "US", base: "https://gamersngeeks.com", platform: "shopify", collections: ["anime-game-figures"] },
  { id: "gamescape", name: "Gamescape", region: "US", base: "https://gamescape.com", platform: "shopify", collections: ["anime-figures-statues"] },
  { id: "ginzamkt", name: "GinzaTCG", region: "US", base: "https://ginzamkt.com", platform: "shopify", collections: ["figures"] },
  { id: "heroesandgames", name: "Heroes and Games", region: "US", base: "https://heroesandgames.com", platform: "shopify", collections: ["action-figures"] },
  { id: "hypercollectiblestcg", name: "Hyper Collectibles", region: "US", base: "https://hypercollectiblestcg.com", platform: "shopify", collections: ["figures"] },
  { id: "impactgamingcenter", name: "Impact Gaming Center", region: "US", base: "https://impactgamingcenter.gg", platform: "shopify", collections: ["hobbies-toys-figurines-statues"] },
  { id: "joshscards", name: "Josh's Cards", region: "US", base: "https://joshscards.com", platform: "shopify", collections: ["figures"] },
  { id: "lspbstore", name: "lspbstore", region: "US", base: "https://lspbstore.com", platform: "shopify", collections: ["figurines-pops"] },
  { id: "mantisgamestudio", name: "Mantis Game Studio", region: "US", base: "https://mantisgamestudio.com", platform: "shopify", collections: ["figures-statues-anime"] },
  { id: "millenniumgames", name: "Millennium Games", region: "US", base: "https://shop.millenniumgames.com", platform: "shopify", collections: ["good-smile-company", "anime-figures"] },
  { id: "n4ytcg", name: "N4YTCG", region: "US", base: "https://n4ytcg.com", platform: "shopify", collections: ["figures"] },
  { id: "nerdzoic", name: "Nerdzoic", region: "US", base: "https://nerdzoic.com", platform: "shopify", collections: ["figma-1"] },
  { id: "nxtlegacigaming", name: "Nxt Legaci Gaming", region: "US", base: "https://nxtlegacigaming.com", platform: "shopify", collections: ["toys-vinyl-figures"] },
  { id: "pcatoys", name: "PCA Designer Toys", region: "US", base: "https://pcatoys.com", platform: "shopify", collections: ["nendoroid"] },
  { id: "robohunters", name: "Robo Hunters", region: "US", base: "https://robohunters.com", platform: "shopify", collections: ["current-anime-figures"] },
  { id: "solarisjapan", name: "Solaris Japan", region: "US", base: "https://solarisjapan.com", platform: "shopify", collections: ["anya-new-prize-figures"] },
  { id: "superanimestore", name: "Super Anime Store", region: "US", base: "https://superanimestore.com", platform: "shopify", collections: ["figures"] },
  { id: "undiscoveredrealm", name: "Undiscovered Realm", region: "US", base: "https://undiscoveredrealm.com", platform: "shopify", collections: ["nendoroid"] },
];

export const STORE_BY_ID: Record<string, Store> = Object.fromEntries(STORES.map((s) => [s.id, s]));
