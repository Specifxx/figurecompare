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
  // Added from the second store probe, 2026-10-28 (probe/results.json): shops whose own
  // currency (/meta.json) is the region's and that list our lines. "all" is only the
  // fallback when /collections.json has no figure collection.
  { id: "animateusa", name: "animate USA", region: "US", base: "https://animateusaonlineshop.com", platform: "shopify", collections: ["all"] },
  { id: "animepopshop", name: "Anime Pop", region: "US", base: "https://animepopshop.com", platform: "shopify", collections: ["all"] },
  { id: "animeseki", name: "AnimeSeki", region: "US", base: "https://animeseki.com", platform: "shopify", collections: ["all"] },
  { id: "atlantiscomics", name: "Atlantis Games & Comics", region: "US", base: "https://atlantis-comics.com", platform: "shopify", collections: ["all"] },
  { id: "chibichopshop", name: "Chibi Chop Shop", region: "US", base: "https://chibichopshop.com", platform: "shopify", collections: ["all"] },
  { id: "cosmicdestroyers", name: "Cosmic Destroyer's Collectibles", region: "US", base: "https://cosmicdestroyers.com", platform: "shopify", collections: ["all"] },
  { id: "exfigure", name: "Exfigure", region: "US", base: "https://exfigure.com", platform: "shopify", collections: ["all"] },
  { id: "goodgameanime", name: "Good Game Anime", region: "US", base: "https://goodgameanime.com", platform: "shopify", collections: ["all"] },
  { id: "goodsmileus", name: "Good Smile US", region: "US", base: "https://www.goodsmileus.com", platform: "shopify", collections: ["all"] },
  { id: "gundamplanet", name: "Gundam Planet", region: "US", base: "https://www.gundamplanet.com", platform: "shopify", collections: ["all"] },
  { id: "japanfigure", name: "Japan Figure Store", region: "US", base: "https://japan-figure.com", platform: "shopify", collections: ["all"] },
  { id: "kappahobby", name: "Kappa Hobby", region: "US", base: "https://www.kappahobby.com", platform: "shopify", collections: ["all"] },
  { id: "kollectkorner", name: "Kollect Korner", region: "US", base: "https://www.kollectkorner.com", platform: "shopify", collections: ["all"] },
  { id: "nekotwo", name: "Nekotwo", region: "US", base: "https://nekotwo.com", platform: "shopify", collections: ["all"] },
  { id: "ohayopop", name: "OhayoPop", region: "US", base: "https://ohayopop.com", platform: "shopify", collections: ["all"] },
  { id: "ozziecollectables", name: "Ozzie Collectables", region: "US", base: "https://www.ozziecollectables.com", platform: "shopify", collections: ["all"] },
  { id: "shumistore", name: "Shumi Toys & Gifts", region: "US", base: "https://shumistore.com", platform: "shopify", collections: ["all"] },
  { id: "spankyslootstash", name: "Spanky's Loot Stash", region: "US", base: "https://www.spankyslootstash.com", platform: "shopify", collections: ["all"] },
  { id: "spiedagames", name: "Spieda Games", region: "US", base: "https://spiedagames.com", platform: "shopify", collections: ["all"] },
  { id: "sugoimart", name: "Sugoi Mart", region: "US", base: "https://www.sugoimart.com", platform: "shopify", collections: ["all"] },
  { id: "sweetsandgeeks", name: "Sweets and Geeks", region: "US", base: "https://www.sweetsandgeeks.com", platform: "shopify", collections: ["all"] },
  { id: "theanimethrone", name: "The Anime Throne", region: "US", base: "https://theanimethrone.com", platform: "shopify", collections: ["all"] },
  { id: "tohoanimation", name: "TOHO animation Store", region: "US", base: "https://tohoanimationstore.us", platform: "shopify", collections: ["all"] },
  { id: "toyarena", name: "ToyArena", region: "US", base: "https://toyarena.com", platform: "shopify", collections: ["all"] },
  { id: "toynk", name: "Toynk Toys", region: "US", base: "https://www.toynk.com", platform: "shopify", collections: ["all"] },
  { id: "toyshnip", name: "ToyShnip", region: "US", base: "https://www.toyshnip.com", platform: "shopify", collections: ["all"] },
  { id: "ultimasupply", name: "Ultima Supply", region: "US", base: "https://ultimasupply.com", platform: "shopify", collections: ["all"] },
  { id: "usagundamstore", name: "USA Gundam Store", region: "US", base: "https://www.usagundamstore.com", platform: "shopify", collections: ["all"] },
  { id: "utopiatoys", name: "Utopia Toys and Models", region: "US", base: "https://utopiatoysandmodels.com", platform: "shopify", collections: ["all"] },
  { id: "nendoworld", name: "Nendo World", region: "US", base: "https://nendoworld.com", platform: "woo" },
  { id: "hobbybee", name: "Hobby Bee Canada", region: "CA", base: "https://hobby-bee.com", platform: "shopify", collections: ["all"] },
  { id: "animecity", name: "Anime City", region: "CA", base: "https://animecity.ca", platform: "shopify", collections: ["all"] },
  { id: "chonkycollectibles", name: "Chonky Collectibles", region: "CA", base: "https://chonkycollectibles.com", platform: "shopify", collections: ["all"] },
  { id: "envcollectible", name: "ENV Collectible", region: "CA", base: "https://envcollectible.com", platform: "shopify", collections: ["all"] },
  { id: "gamezilla", name: "GameZilla", region: "CA", base: "https://gamezilla.ca", platform: "shopify", collections: ["all"] },
  { id: "geekandco", name: "Geek & Co.", region: "CA", base: "https://geekandco.ca", platform: "shopify", collections: ["all"] },
  { id: "nabema", name: "Nabema Collectibles", region: "CA", base: "https://www.nabemacollectibles.com", platform: "shopify", collections: ["all"] },
  { id: "oomomo", name: "Oomomo Canada", region: "CA", base: "https://www.oomomostore.com", platform: "shopify", collections: ["all"] },
  { id: "prexhobby", name: "P-Rex Hobby", region: "CA", base: "https://www.prexhobby.com", platform: "shopify", collections: ["all"] },
  { id: "unifig", name: "UniFig", region: "CA", base: "https://unifigshop.com", platform: "shopify", collections: ["all"] },
  { id: "camdenanime", name: "Camden Anime", region: "UK", base: "https://camdenanime.co.uk", platform: "shopify", collections: ["all"] },
  { id: "charmingsushi", name: "CharmingSushi", region: "UK", base: "https://www.charmingsushi.co.uk", platform: "shopify", collections: ["all"] },
  { id: "curibo", name: "Curibo", region: "UK", base: "https://curibo.co.uk", platform: "shopify", collections: ["all"] },
  { id: "hobbyfigures", name: "Hobby Figures", region: "UK", base: "https://hobbyfigures.co.uk", platform: "shopify", collections: ["all"] },
  { id: "loadeddice", name: "Loaded Dice", region: "UK", base: "https://www.loadeddice.uk", platform: "shopify", collections: ["all"] },
  { id: "oshoppu", name: "oshoppu", region: "UK", base: "https://oshoppu.com", platform: "shopify", collections: ["all"] },
  { id: "sincitycomics", name: "Sin City Comics & Gaming", region: "UK", base: "https://sincitycomicsgaming.com", platform: "shopify", collections: ["all"] },
  { id: "forbiddenplanet", name: "Forbidden Planet International", region: "UK", base: "https://shop.forbiddenplanet.co.uk", platform: "shopify", collections: ["all"] },
  { id: "aniimeshop", name: "Aniime Shop", region: "EU", base: "https://aniimeshop.com", platform: "shopify", collections: ["all"] },
  { id: "elbenwald", name: "Elbenwald", region: "EU", base: "https://elbenwald.com", platform: "shopify", collections: ["all"] },
  { id: "fictionaryworld", name: "fictionary world", region: "EU", base: "https://fictionary-world.de", platform: "shopify", collections: ["all"] },
  { id: "jumpichiban", name: "JumpIchiban", region: "EU", base: "https://jumpichiban.com", platform: "shopify", collections: ["all"] },
  { id: "orbitopia", name: "OrbiTopia", region: "EU", base: "https://orbitopia-figures.com", platform: "shopify", collections: ["all"] },
  { id: "nendoaddicts", name: "Nendo Addicts", region: "EU", base: "https://nendoaddicts.be", platform: "woo" },
  { id: "hobbyco", name: "Hobbyco", region: "AU", base: "https://www.hobbyco.com.au", platform: "shopify", collections: ["all"] },
  { id: "japantoys", name: "JapanToys", region: "AU", base: "https://www.japantoys.com.au", platform: "shopify", collections: ["all"] },
  { id: "raptorgames", name: "Raptor Games", region: "AU", base: "https://raptorgames.com", platform: "shopify", collections: ["all"] },
  { id: "sugoishop", name: "Sugoi Shop", region: "AU", base: "https://sugoi.shop", platform: "shopify", collections: ["all"] },
  { id: "wonderlandgames", name: "Wonderland Games", region: "AU", base: "https://www.wonderlandgames.com.au", platform: "shopify", collections: ["all"] },
  { id: "figurecentral", name: "Figure Central", region: "AU", base: "https://www.figurecentral.com.au", platform: "shopify", collections: ["all"] },
  { id: "popculturetengoku", name: "Popculture Tengoku", region: "NZ", base: "https://www.popculturetengoku.co.nz", platform: "shopify", collections: ["all"] },
  { id: "treasuretrip", name: "Treasure Trip", region: "NZ", base: "https://treasuretrip.co.nz", platform: "woo" },
  { id: "otakuhouse", name: "Otaku House", region: "SG", base: "https://shop.otakuhouse.com", platform: "shopify", collections: ["all"] },
  { id: "toycoin", name: "ToyCoin", region: "SG", base: "https://toycoin.com.sg", platform: "shopify", collections: ["all"] },
];

export const STORE_BY_ID: Record<string, Store> = Object.fromEntries(STORES.map((s) => [s.id, s]));
