// The character hubs (/character/<slug>; competitor scan, owner 2026-11-08: search-by-need hubs). Fans search "Gojo
// Nendoroid" or "Frieren figure", not a franchise. A figure joins a character by its NAME only, the same as a series
// (src/content/series.ts): fine for grouping, never for matching a listing (that is the JAN's job). Each pattern is
// the character's full name, or a name nobody else in the catalogue carries; an ambiguous one (Kafka: two different
// characters; Hinata: two) is left out or spelled in full. A hub needs CHARACTER_MIN figures (owner: 3+).
export interface Character {
  slug: string;
  name: string;
  re: RegExp;
  /** the series hub it belongs to, when there is one (src/content/series.ts) */
  series?: string;
}

export const CHARACTER_MIN = 3;

export const CHARACTERS: Character[] = [
  { slug: "hatsune-miku", name: "Hatsune Miku", re: /\bhatsune miku\b|\bmiku hatsune\b|\b(snow|racing|sakura) miku\b/i, series: "hatsune-miku" },
  { slug: "snow-miku", name: "Snow Miku", re: /\bsnow miku\b/i, series: "hatsune-miku" },
  { slug: "kagamine-rin", name: "Kagamine Rin", re: /\bkagamine rin\b|\brin kagamine\b/i, series: "hatsune-miku" },
  { slug: "frieren", name: "Frieren", re: /\bfrieren\b(?!\s*:?\s*beyond journey'?s end\s*-\s*(?!frieren))/i, series: "frieren" },
  { slug: "fern", name: "Fern", re: /\bfern\b/i, series: "frieren" },
  { slug: "rem", name: "Rem", re: /\brem\b/i, series: "re-zero" },
  { slug: "ram", name: "Ram", re: /\bram\b/i, series: "re-zero" },
  { slug: "emilia", name: "Emilia", re: /\bemilia\b/i, series: "re-zero" },
  { slug: "satoru-gojo", name: "Satoru Gojo", re: /\bgojo\b/i, series: "jujutsu-kaisen" },
  { slug: "sukuna", name: "Ryomen Sukuna", re: /\bsukuna\b/i, series: "jujutsu-kaisen" },
  { slug: "yuji-itadori", name: "Yuji Itadori", re: /\bitadori\b/i, series: "jujutsu-kaisen" },
  { slug: "makima", name: "Makima", re: /\bmakima\b/i, series: "chainsaw-man" },
  { slug: "power", name: "Power", re: /\b(figma|nendoroid|pop up parade|chainsaw man\s*-?)\s*(?:-\s*)?(?:nyaako\s*-\s*)?power\b(?!\s*rangers?)/i, series: "chainsaw-man" },
  { slug: "denji", name: "Denji", re: /\bdenji\b/i, series: "chainsaw-man" },
  { slug: "aki-hayakawa", name: "Aki Hayakawa", re: /\baki hayakawa\b|\bhayakawa aki\b/i, series: "chainsaw-man" },
  { slug: "nezuko", name: "Nezuko Kamado", re: /\bnezuko\b/i, series: "demon-slayer" },
  { slug: "tanjiro", name: "Tanjiro Kamado", re: /\btanjiro\b/i, series: "demon-slayer" },
  { slug: "zenitsu", name: "Zenitsu Agatsuma", re: /\bzenitsu\b/i, series: "demon-slayer" },
  { slug: "inosuke", name: "Inosuke Hashibira", re: /\binosuke\b/i, series: "demon-slayer" },
  { slug: "kyojuro-rengoku", name: "Kyojuro Rengoku", re: /\bkyojuro rengoku\b|\brengoku kyojuro\b/i, series: "demon-slayer" },
  { slug: "giyu-tomioka", name: "Giyu Tomioka", re: /\bgiyu\b/i, series: "demon-slayer" },
  { slug: "shinobu-kocho", name: "Shinobu Kocho", re: /\bshinobu kocho\b|\bkocho shinobu\b/i, series: "demon-slayer" },
  { slug: "anya-forger", name: "Anya Forger", re: /\banya forger\b|\bspy x family\b.*\banya\b/i },
  { slug: "loid-forger", name: "Loid Forger", re: /\bloid\b/i },
  { slug: "asuka", name: "Asuka Langley", re: /\basuka\b.*\blangley\b|\bevangelion\b.*\basuka\b/i, series: "evangelion" },
  { slug: "rei-ayanami", name: "Rei Ayanami", re: /\brei ayanami\b|\bayanami rei\b/i, series: "evangelion" },
  { slug: "artoria-pendragon", name: "Artoria Pendragon (Saber)", re: /\baltria\b|\bartoria\b|\bsaber (?:\d\.\d|lily|alter)\b/i, series: "fate" },
  { slug: "jeanne-darc", name: "Jeanne d'Arc", re: /\bjeanne d'?arc\b/i, series: "fate" },
  { slug: "mash-kyrielight", name: "Mash Kyrielight", re: /\bmash kyrielight\b/i, series: "fate" },
  { slug: "megumin", name: "Megumin", re: /\bmegumin\b/i },
  { slug: "aqua-konosuba", name: "Aqua (KonoSuba)", re: /\b(?:konosuba|kono subarashii)\b.*\baqua\b/i },
  { slug: "darkness-konosuba", name: "Darkness (KonoSuba)", re: /\b(?:konosuba|kono subarashii)\b.*\bdarkness\b|^(?:nendoroid|figma|pop up parade) darkness\b/i },
  { slug: "marin-kitagawa", name: "Marin Kitagawa", re: /\bmarin kitagawa\b|\bkitagawa marin\b/i },
  { slug: "hitori-gotoh", name: "Hitori Gotoh (Bocchi)", re: /\bhitori got(?:o|oh)\b/i, series: "bocchi-the-rock" },
  { slug: "zero-two", name: "Zero Two", re: /\bzero two\b/i },
  { slug: "sasuke-uchiha", name: "Sasuke Uchiha", re: /\bsasuke\b/i, series: "naruto" },
  { slug: "levi-ackerman", name: "Levi Ackerman", re: /\blevi\b/i, series: "attack-on-titan" },
  { slug: "eren-yeager", name: "Eren Yeager", re: /\beren (?:yeager|jaeger)\b/i, series: "attack-on-titan" },
  { slug: "izuku-midoriya", name: "Izuku Midoriya (Deku)", re: /\bmidoriya\b|\bdeku\b/i, series: "my-hero-academia" },
  { slug: "katsuki-bakugo", name: "Katsuki Bakugo", re: /\bbakugo\b/i, series: "my-hero-academia" },
  { slug: "shoto-todoroki", name: "Shoto Todoroki", re: /\btodoroki\b/i, series: "my-hero-academia" },
  { slug: "2b", name: "2B (NieR:Automata)", re: /\b2b\b/i, series: "nier" },
  { slug: "link", name: "Link", re: /\blink\b(?!\s*click)/i, series: "the-legend-of-zelda" },
  { slug: "kirito", name: "Kirito", re: /\bkirito\b/i, series: "sword-art-online" },
  { slug: "asuna", name: "Asuna", re: /\basuna\b(?!\s*ichinose)/i, series: "sword-art-online" },
  { slug: "reimu-hakurei", name: "Reimu Hakurei", re: /\breimu\b/i, series: "touhou" },
  { slug: "gawr-gura", name: "Gawr Gura", re: /\bgawr gura\b/i, series: "hololive" },
  { slug: "houshou-marine", name: "Houshou Marine", re: /\bhoushou marine\b|\bmarine houshou\b/i, series: "hololive" },
  { slug: "usada-pekora", name: "Usada Pekora", re: /\bpekora\b/i, series: "hololive" },
  { slug: "kaguya-shinomiya", name: "Kaguya Shinomiya", re: /\bkaguya shinomiya\b|\bshinomiya kaguya\b/i },
  { slug: "chika-fujiwara", name: "Chika Fujiwara", re: /\bchika fujiwara\b|\bfujiwara chika\b/i },
  { slug: "mai-sakurajima", name: "Mai Sakurajima", re: /\bmai sakurajima\b|\bsakurajima mai\b/i },
  { slug: "albedo", name: "Albedo (Overlord)", re: /\balbedo\b/i },
  { slug: "maomao", name: "Maomao", re: /\bmaomao\b/i },
  { slug: "killua", name: "Killua Zoldyck", re: /\bkillua\b/i },
  { slug: "gon-freecss", name: "Gon Freecss", re: /\bgon freecss\b/i },
  { slug: "chisato-nishikigi", name: "Chisato Nishikigi", re: /\bchisato nishikigi\b|\bnishikigi chisato\b/i },
  { slug: "takina-inoue", name: "Takina Inoue", re: /\btakina\b/i },
  { slug: "shoyo-hinata", name: "Shoyo Hinata", re: /\bshoyo hinata\b|\bhinata shoyo\b/i },
];
