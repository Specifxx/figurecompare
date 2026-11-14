import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/site";
import { CoffeeIcon, CreatorCard, StarIcon } from "@/components/creators/CreatorCard";
import { featuredCreators } from "@/lib/creators";
import { Crumbs, JsonLd, faqLd } from "@/lib/seo";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

// /creators: the figure creators hub, RiftCompare's /creators brought over (owner, 2026-11-03: "a really nice formatted
// creators page, just like how RiftCompare does it", on every site). Two audiences: collectors finding creators to follow
// and tip, and creators deciding whether a listing is worth a mention in their content. The list is static
// (src/lib/creators.ts), so the page is prerendered like every other: no data read, no request read. No emoji
// decoration, no character art (the design rules): the marks are the logo's star and a coffee cup, drawn inline.

const TITLE = "Anime Figure Creators: Follow & Buy Them a Coffee";
const DESCRIPTION =
  "The anime figure creators we feature: unboxings, collection tours, pre-order news and photography. Follow them, and buy your favourite a coffee. Creators: get featured free.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/creators" },
};

const FAQS: [string, string][] = [
  [
    "What does “Buy them a coffee” do?",
    `It opens the creator's own tip page (Ko-fi, Buy Me a Coffee, Patreon or similar). The money goes straight to them. ${SITE.name} never handles it and takes no cut.`,
  ],
  [
    "Does it cost anything to be featured?",
    `No. A listing is free. We ask featured creators to mention ${SITE.name} in their content, for example a link in a video description or a price check on screen, and we send our visitors their way in return.`,
  ],
  [
    "Who can apply?",
    "Anyone who makes anime figure content regularly: YouTube, TikTok, Instagram, X, Threads, a podcast or a blog. Audience size matters less than making content collectors enjoy. A real person reviews every application.",
  ],
  [
    "Will I see how many clicks my listing sends?",
    "Yes. We count clicks on every featured creator's links and tip button, and share the numbers with them on request.",
  ],
];

// "How to work with us" (owner, 2026-11-01): flexible on purpose, any one of these is plenty. Creators call us their
// "partner" in their own content, not "sponsor": we don't pay them for a mention.
const WORK_WITH_US = [
  { title: "Link us", body: `Put ${SITE.domain} in your bio, video description or a story link. That's the one thing that helps most.` },
  { title: "Shout us out", body: `In the content you already make, a quick line: “check out our partner ${SITE.name}” while you unbox a Nendoroid, tour your shelf or talk pre-orders.` },
  { title: "Show how it works", body: "A short walkthrough or honest review: look up a figure, compare the stores, find who has it cheapest. Say what you really think." },
];

const PERKS = [
  { title: "A spotlight card, free", body: "Your avatar, what you make and every channel you're on, here and in the creators bubble on our homepage." },
  { title: "A “Buy them a coffee” button", body: "Straight to your own Ko-fi, Patreon or tip page. Fans support you directly; we never touch the money." },
  { title: "Figure collectors, not random traffic", body: "Collectors visit every day to price Nendoroids, figma and POP UP PARADE: the people who watch figure content." },
  { title: "Shout-outs and real numbers", body: "We share your new videos on our socials, and tell you how many clicks your listing sent you." },
];

const APPLY_HREF = `mailto:${SITE.email}?subject=${encodeURIComponent(`${SITE.name} creator feature`)}&body=${encodeURIComponent(
  "Hi! I make anime figure content and I'd like to be featured.\n\nName / channel:\nWhat I make:\nLinks (YouTube, TikTok, Instagram, X, Threads…):\nTip page (Ko-fi, Patreon…), if any:\nWhere I'm based:\n",
)}`;

export default function CreatorsPage() {
  const creators = featuredCreators();
  const openSpots = creators.length === 0 ? 3 : (3 - (creators.length % 3)) % 3 || 3;
  const base = `https://${SITE.domain}`;

  return (
    <div className="mx-auto max-w-5xl px-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${TITLE} | ${SITE.name}`,
          url: `${base}/creators`,
          ...(creators.length
            ? {
                mainEntity: {
                  "@type": "ItemList",
                  itemListElement: creators.map((c, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    item: { "@type": "Person", name: c.name, url: `${base}/creators#${c.slug}`, sameAs: c.links.map((l) => l.url) },
                  })),
                },
              }
            : {}),
        }}
      />
      <JsonLd data={faqLd(FAQS)} />
      <Crumbs items={[{ name: "Creators", path: "/creators" }]} />

      {/* Hero */}
      <header className="sticker relative mt-4 overflow-hidden p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-pink-pale blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-lilac-pale blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-pink">
            <StarIcon className="h-3.5 w-3.5" /> Creators
          </p>
          <h1 className="h-display mt-3 text-3xl leading-[1.05] sm:text-5xl">
            Figure creators we <span className="text-pink">love</span>
          </h1>
          <p className="mt-3 text-base leading-7 text-soft">
            The people who make collecting figures fun to follow: unboxings, shelf tours, pre-order news and the photos that sell you on a
            release. Watch them, follow them, and buy your favourite a coffee.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#featured" className="btn-pop min-h-11 bg-buy px-5 text-white">
              Meet the creators
            </a>
            <a href="#apply" className="btn-pop min-h-11 border border-line bg-card px-5 text-ink">
              I make figure content →
            </a>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute right-8 top-6 hidden h-56 w-72 md:block">
          {["left-0 top-8 -rotate-[10deg] from-pink-pale to-lilac-pale", "left-[88px] top-0 z-10 rotate-[2deg] from-lilac-pale to-sky-pale", "left-[176px] top-10 rotate-[11deg] from-mint-pale to-lemon-pale"].map((cls) => (
            <div key={cls} className={`absolute h-48 w-36 rounded-xl border border-line bg-gradient-to-br shadow-pop ${cls}`}>
              <div className="m-3 h-20 rounded-lg bg-card/80" />
              <div className="mx-3 mt-3 h-2 w-20 rounded bg-card/80" />
              <div className="mx-3 mt-2 h-2 w-12 rounded bg-card/80" />
            </div>
          ))}
        </div>
      </header>

      {/* Featured creators */}
      <section id="featured" className="mt-10 scroll-mt-24">
        <h2 className="h-display text-2xl">Featured creators</h2>
        <p className="mt-1 text-sm text-soft">
          {creators.length ? "Newest first. Tap a channel to follow, or buy them a coffee to say thanks." : "Our first creators are joining now. Want to be one of them?"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c, i) => (
            <CreatorCard key={c.slug} creator={c} index={i} />
          ))}
          {/* Open spots fill the last row (a full row of three while the list is empty), so the grid reads as "join us" rather
              than a finished list. Never an invented creator. */}
          {Array.from({ length: openSpots }).map((_, i) => (
            <a key={`open-${i}`} href="#apply" className="group flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-card/60 p-6 text-center transition hover:border-pink hover:bg-pink-pale/40">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-pale text-pink transition-transform group-hover:scale-110" aria-hidden>
                <StarIcon className="h-8 w-8" />
              </span>
              <span className="h-display mt-4 text-base">Your channel here</span>
              <span className="mt-1 max-w-[16rem] text-sm text-soft">Make figure content? Get a free spotlight card and a “Buy them a coffee” button.</span>
              <span className="mt-4 text-sm font-semibold text-pink-deep">Apply to be featured →</span>
            </a>
          ))}
        </div>
      </section>

      {/* How tipping works */}
      <section className="sticker mt-10 grid items-center gap-6 border-pink/30 bg-gradient-to-br from-pink-pale via-card to-card p-6 sm:grid-cols-[auto,1fr] sm:p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-buy text-white shadow-pop">
          <CoffeeIcon className="h-10 w-10" />
        </div>
        <div>
          <h2 className="h-display text-xl">Buy your favourite creator a coffee</h2>
          <p className="mt-2 text-sm leading-6 text-soft">
            Every featured creator with a tip page gets a “Buy them a coffee” button. It goes straight to their own Ko-fi, Patreon or tip
            page, so <strong className="text-ink">100% of what you send goes to them</strong>. {SITE.name} never handles the money and takes
            no cut. It&rsquo;s the easiest way to say thanks for the unboxing that made your day.
          </p>
        </div>
      </section>

      {/* For creators */}
      <section id="apply" className="mt-10 scroll-mt-24">
        <h2 className="h-display text-2xl">Make figure content? Let&rsquo;s grow together</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-soft">
          Mention {SITE.name} in your content (a link in your description, a price check on screen, a shout-out in a video) and we feature
          you here, free. Here&rsquo;s what you get.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PERKS.map((p, i) => (
            <div key={p.title} className="sticker flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-pale font-display text-base font-bold text-pink-deep" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm leading-6 text-soft">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="sticker mt-5 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="h-display text-lg">Apply to be featured</h3>
            <p className="mt-1 text-sm text-soft">Email us your channel links and what you make. A real person replies, usually within a few days.</p>
          </div>
          <a href={APPLY_HREF} className="btn-pop min-h-11 shrink-0 bg-buy px-5 text-white">
            Email us to get featured
          </a>
        </div>
      </section>

      {/* How to work with us */}
      <section id="work-with-us" className="mt-10 scroll-mt-24">
        <h2 className="h-display text-2xl">How to work with us</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-soft">
          Creators often ask how we&rsquo;d like {SITE.name} promoted. Honestly, however suits you: no contract, no script, no quota and
          nothing to send us first. We help you, you help us, and we keep featuring you either way.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {WORK_WITH_US.map((w, i) => (
            <li key={w.title} className="sticker p-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-pink">Option {i + 1}</span>
              <h3 className="mt-1 font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-soft">{w.body}</p>
            </li>
          ))}
        </ol>
        <div className="sticker mt-3 p-5">
          <h3 className="font-semibold">Lines you can borrow</h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-soft">
            <li>“Prices checked on our partner {SITE.domain}. Link in my bio.”</li>
            <li>“Be sure to check out our partner {SITE.name}: it compares figure prices across real stores, so you find who has it cheapest.”</li>
          </ul>
          <p className="mt-3 text-sm leading-6 text-soft">
            Please say we&rsquo;re partners (“our partner”, or your platform&rsquo;s partnership label) so your followers know. Ad rules such
            as the FTC&rsquo;s in the US and the ASA&rsquo;s in the UK ask for that even when no money changes hands.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-3xl" aria-labelledby="creators-faq">
        <h2 id="creators-faq" className="h-display text-2xl">
          Creators FAQ
        </h2>
        <dl className="mt-4 space-y-5">
          {FAQS.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-sm leading-6 text-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-sm text-soft">
        While you&rsquo;re here:{" "}
        <Link prefetch={false} href="/deals" className="font-semibold text-pink-deep hover:underline">
          see today&rsquo;s figure deals
        </Link>
        .
      </p>
      {/* Every page carries one eBay strip below its content (owner, 2026-10-28; tests/site.test.ts), the legal pages aside. */}
      <EbayStrip className="mb-16 mt-10" placement="creators" queries={SITE_QUERIES} />
    </div>
  );
}
