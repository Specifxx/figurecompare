// The blog (owner, 2026-11-04: a trend post with a thumbnail on every site). A post is prose around numbers computed from the
// day's figures.json at build (src/app/blog/[slug]/page.tsx), so every figure in it is a real store price and the pages are
// static like everything else. A post answers one question the data answers; it never repeats a line hub or a series page.
export interface Post {
  slug: string;
  title: string;
  description: string;
  /** The real publication date (YYYY-MM-DD), never a backdate. */
  date: string;
  /** The post's own thumbnail (public/blog/<slug>.jpg, 1200×630): its link preview and the picture on its card. */
  image: { src: string; alt: string };
}

export const POSTS: Post[] = [
  {
    slug: "how-to-spot-bootleg-nendoroids",
    title: "How to spot a bootleg Nendoroid: the price test, the box, the paint and the number",
    description:
      "Five checks that catch a fake Nendoroid before it costs you money, starting with the one that needs no figure in hand: what a real Nendoroid costs at real stores in your country today, computed from the day's prices.",
    date: "2026-11-05",
    image: { src: "/blog/how-to-spot-bootleg-nendoroids.jpg", alt: "How to spot a bootleg Nendoroid: the five checks" },
  },
  {
    slug: "anime-figure-market-november-2026",
    title: "The anime figure market in November 2026: Nendoroid past #3300, POP UP PARADE's rise, and what a figure costs where",
    description:
      "What 4,600 barcode-matched figures across 116 stores say about the hobby right now: the lines growing fastest, the typical price of each in every region, how far prices spread between stores, and what to expect into 2027.",
    date: "2026-11-04",
    image: { src: "/blog/anime-figure-market-november-2026.jpg", alt: "Bar chart of the median orderable Nendoroid price by region in November 2026" },
  },
];

export const POST_BY_SLUG = Object.fromEntries(POSTS.map((p) => [p.slug, p])) as Record<string, Post>;
