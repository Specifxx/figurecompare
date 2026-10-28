import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Mascot size={150} mood="sleepy" className="mx-auto" />
      <h1 className="h-display mt-4 text-4xl">Page not found (´・ω・`)</h1>
      <p className="mt-2 text-soft">This figure may have sold out everywhere and left the list. Try a search, or head home.</p>
      <Link prefetch={false} href="/" className="btn-pop mt-6 bg-pink text-white">
        Back home ♡
      </Link>
      <EbayStrip className="mt-12 text-left" placement="notfound" queries={SITE_QUERIES} />
    </div>
  );
}
