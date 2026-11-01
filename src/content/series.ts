// The series hubs (/series/<slug>): one page per franchise with enough figures to compare. A figure joins a series by
// its NAME only, which is fine for grouping and never for matching a listing (that is the JAN's job). Each pattern is
// specific on purpose: a series name or a character name nobody else carries. A hub needs SERIES_MIN figures.
export interface Series {
  slug: string;
  name: string;
  re: RegExp;
  /** One line under the title. */
  about: string;
}

export const SERIES_MIN = 12;

export const SERIES: Series[] = [
  { slug: "hatsune-miku", name: "Hatsune Miku", re: /\bhatsune miku\b|\b(snow|racing|sakura|magical mirai) miku\b|\bpiapro\b|\bvocaloid\b|\bkagamine\b|\bmegurine luka\b/i, about: "Miku and the Piapro characters, from Snow Miku to Racing Miku." },
  { slug: "hololive", name: "hololive", re: /\bhololive\b|\bgawr gura\b|\bhoushou marine\b|\bmarine houshou\b|\bshirakami fubuki\b|\busada pekora\b|\bpekora\b|\bmori calliope\b|\bninomae ina'?nis\b|\bwatson amelia\b|\btakanashi kiara\b/i, about: "hololive VTubers in Nendoroid, figma and POP UP PARADE." },
  { slug: "fate", name: "Fate", re: /\bfate\s*\/|\bfate grand order\b|\baltria\b|\bartoria\b|\bjeanne d'?arc\b.*\b(alter|ruler)\b/i, about: "Fate/Grand Order, Fate/stay night and the rest of the Type-Moon Fate series." },
  { slug: "kancolle", name: "Kantai Collection", re: /\bkancolle\b|\bkantai collection\b/i, about: "The KanColle shipgirls." },
  { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", re: /\bjujutsu kaisen\b|\bsatoru gojo\b|\bgojo satoru\b|\bryomen sukuna\b|\bsukuna\b|\byuji itadori\b|\bitadori yuji\b|\bmegumi fushiguro\b|\bnobara kugisaki\b|\bkugisaki nobara\b|\bsuguru geto\b|\btoji fushiguro\b/i, about: "Gojo, Itadori, Sukuna and the rest of Jujutsu Kaisen." },
  { slug: "blue-archive", name: "Blue Archive", re: /\bblue archive\b/i, about: "Students of Kivotos from Blue Archive." },
  { slug: "demon-slayer", name: "Demon Slayer", re: /\bdemon slayer\b|\bkimetsu no yaiba\b|\btanjiro\b|\bnezuko\b|\bzenitsu\b|\binosuke\b|\brengoku\b|\bgiyu tomioka\b|\btomioka giyu\b/i, about: "Tanjiro, Nezuko and the Hashira from Demon Slayer: Kimetsu no Yaiba." },
  { slug: "attack-on-titan", name: "Attack on Titan", re: /\battack on titan\b|\bshingeki no kyojin\b|\beren (yeager|jaeger)\b|\bmikasa\b|\blevi ackerman\b|\berwin smith\b|\barmin arlert\b/i, about: "Eren, Mikasa, Levi and the Survey Corps." },
  { slug: "evangelion", name: "Evangelion", re: /\bevangelion\b|\brei ayanami\b|\bayanami rei\b|\basuka langley\b|\bshinji ikari\b|\bmari makinami\b|\bkaworu nagisa\b/i, about: "Rei, Asuka, Shinji and the Evangelion films." },
  { slug: "my-hero-academia", name: "My Hero Academia", re: /\bmy hero academia\b|\bboku no hero\b|\bizuku midoriya\b|\bmidoriya izuku\b|\bkatsuki bakugo\b|\bbakugo\b|\bshoto todoroki\b|\btodoroki shoto\b|\ball might\b/i, about: "Deku, Bakugo, Todoroki and the heroes of U.A." },
  { slug: "persona", name: "Persona", re: /\bpersona\s?[345]\b|\bpersona\s?(3|5) the\b/i, about: "Persona 3, 4 and 5 characters." },
  { slug: "love-live", name: "Love Live!", re: /\blove live\b/i, about: "μ's, Aqours and the Love Live! school idols." },
  { slug: "sword-art-online", name: "Sword Art Online", re: /\bsword art online\b|\bkirito\b|\basuna\b(?!\s*ichinose)/i, about: "Kirito, Asuna and Sword Art Online." },
  { slug: "re-zero", name: "Re:Zero", re: /\bre:\s?zero\b|\bre zero\b/i, about: "Rem, Ram, Emilia and Re:Zero." },
  { slug: "chainsaw-man", name: "Chainsaw Man", re: /\bchainsaw man\b|\bpochita\b|\bmakima\b|\bdenji\b|\baki hayakawa\b|\bhayakawa aki\b/i, about: "Denji, Power, Makima and Pochita." },
  { slug: "naruto", name: "Naruto", re: /\bnaruto\b/i, about: "Naruto and Naruto Shippuden." },
  { slug: "nier", name: "NieR", re: /\bnier\b|\byorha\b/i, about: "2B, 9S, A2 and NieR:Automata." },
  { slug: "touhou", name: "Touhou Project", re: /\btouhou\b|\bhakurei reimu\b|\breimu hakurei\b|\bmarisa kirisame\b|\bkirisame marisa\b/i, about: "Reimu, Marisa and Gensokyo." },
  { slug: "frieren", name: "Frieren", re: /\bfrieren\b|\bhimmel\b|\bstark\b.*\bfrieren\b/i, about: "Frieren: Beyond Journey's End." },
  { slug: "bocchi-the-rock", name: "Bocchi the Rock!", re: /\bbocchi\b|\bhitori got(o|oh)\b|\bikuyo kita\b|\bkita ikuyo\b|\bnijika ijichi\b|\bryo yamada\b/i, about: "Kessoku Band from Bocchi the Rock!" },
  { slug: "the-legend-of-zelda", name: "The Legend of Zelda", re: /\bzelda\b|\blink\b.*\b(breath of the wild|tears of the kingdom|twilight princess|skyward sword|ocarina)\b/i, about: "Link and Zelda across the Legend of Zelda games." },
  { slug: "delicious-in-dungeon", name: "Delicious in Dungeon", re: /\bdungeon meshi\b|\bdelicious in dungeon\b|\bmarcille\b|\blaios\b|\bchilchuck\b|\bsenshi\b/i, about: "Laios, Marcille and the Delicious in Dungeon party." },
];
