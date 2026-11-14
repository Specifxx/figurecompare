import { initials, PLATFORM_STYLE, type Creator } from "@/lib/creators";

// One featured creator: avatar, what they make, their channels, and the "Buy them a coffee" button that goes to THEIR tip
// page. Server HTML, no script, no emoji (the design rules). rel="noopener" without "noreferrer": the creator's analytics
// should see this site as the referrer, that is the point of the listing.
const TINTS = ["from-pink-pale via-lilac-pale to-mint-pale", "from-sky-pale via-pink-pale to-lemon-pale", "from-mint-pale via-lilac-pale to-pink-pale", "from-lemon-pale via-sky-pale to-pink-pale"];

export function CreatorCard({ creator, index = 0 }: { creator: Creator; index?: number }) {
  const main = creator.links[0];
  return (
    <article id={creator.slug} className="sticker tile-hover relative flex scroll-mt-24 flex-col overflow-hidden">
      <div className={`h-20 bg-gradient-to-br ${TINTS[index % TINTS.length]}`} aria-hidden />
      <div className="-mt-10 flex flex-1 flex-col px-5 pb-5">
        <div className="flex items-end justify-between gap-3">
          {creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatar} alt={`${creator.name}'s avatar`} width={80} height={80} loading="lazy" decoding="async" className="h-20 w-20 rounded-2xl border-4 border-card bg-lilac-pale object-cover shadow-pop" />
          ) : (
            <div aria-hidden className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-pink text-2xl font-bold text-white shadow-pop">
              {initials(creator.name)}
            </div>
          )}
          {creator.region && <span className="chip mb-1 bg-lilac-pale text-soft">{creator.region}</span>}
        </div>
        <h3 className="h-display mt-3 text-lg">{creator.name}</h3>
        <p className="mt-1 text-sm leading-6 text-soft">{creator.blurb}</p>
        {creator.tags && creator.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {creator.tags.slice(0, 3).map((t) => (
              <li key={t} className="chip bg-lilac-pale text-soft">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {creator.links.map((l) => {
            const st = PLATFORM_STYLE[l.platform];
            return (
              <a key={l.url} href={l.url} target="_blank" rel="noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-opacity hover:opacity-85" style={{ backgroundColor: st.bg, color: st.fg }}>
                {l.platform}
                {l.handle && <span className="font-medium opacity-80">{l.handle}</span>}
              </a>
            );
          })}
        </div>
        <div className="mt-auto pt-5">
          {creator.tipUrl ? (
            <a href={creator.tipUrl} target="_blank" rel="noopener" className="btn-pop flex min-h-11 w-full bg-buy text-white">
              <CoffeeIcon /> Buy {creator.name.split(" ")[0]} a coffee
            </a>
          ) : main ? (
            <a href={main.url} target="_blank" rel="noopener" className="btn-pop flex min-h-11 w-full border border-line bg-card text-ink">
              Watch on {main.platform} →
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CoffeeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
      <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M8 3v2M11 3v2M14 3v2" />
    </svg>
  );
}

/** A four-point star, the logo's: the creators mark everywhere the page needs one. */
export function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 2c.6 4.6 2.4 7.4 10 10-7.6 2.6-9.4 5.4-10 10-.6-4.6-2.4-7.4-10-10 7.6-2.6 9.4-5.4 10-10z" />
    </svg>
  );
}
