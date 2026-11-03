import Link from "next/link";
import { StarIcon } from "./CreatorCard";

// The creators hub, visible on the homepage before any scroll: RiftCompare's CreatorsCornerBadge (owner, 2026-11-03: "just a
// bubble and then a really nice formatted creators page"). In the hero's top-right corner from sm up; on a phone, where a corner
// badge would sit on the headline, a small pill above it instead. Server component, static: nothing to fetch, nothing to hydrate.
export function CreatorsCornerBadge() {
  return (
    <Link
      href="/creators"
      prefetch={false}
      className="group relative z-20 mb-4 inline-flex min-h-9 items-center gap-2 rounded-full border border-pink/40 bg-card py-1.5 pl-2 pr-3.5 text-xs font-semibold text-ink shadow-pop transition hover:-translate-y-0.5 hover:border-pink sm:absolute sm:right-4 sm:top-4 sm:mb-0 sm:text-sm"
    >
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-pink text-white" aria-hidden>
        <StarIcon className="h-3.5 w-3.5" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-pink" />
      </span>
      <span>
        Figure creators
        <span className="ml-1.5 text-pink-deep group-hover:underline">Buy them a coffee →</span>
      </span>
    </Link>
  );
}
