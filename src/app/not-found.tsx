import Link from "next/link";
import { LINES } from "@/site";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="h-display mt-4 text-4xl">Page not found</h1>
      <p className="mt-2 text-soft">This figure may have sold out everywhere and left the list. Try a search, or head home.</p>
      <Link prefetch={false} href="/" className="btn-pop mt-6 min-h-11 bg-buy px-5 text-white">
        Back home
      </Link>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {LINES.map((l) => (
          <Link key={l.key} prefetch={false} href={`/${l.key}`} className="inline-flex min-h-10 items-center rounded-lg border border-line bg-card px-3 text-sm font-semibold transition hover:border-soft">
            {l.name}
          </Link>
        ))}
      </div>
      <EbayStrip className="mt-12 text-left" placement="notfound" queries={SITE_QUERIES} />
    </div>
  );
}
