// The beta forum (docs/forum.md). Prerendered at the daily release with the
// threads as they were then (for search engines); the browser fetches the newest
// posts from GitHub itself, so new posts show without a build or a function.
import type { Metadata } from "next";
import { ForumApp } from "@/components/forum/Forum";
import "@/components/forum/forum.css";
import { EbayStrip, SITE_QUERIES } from "@/components/EbayStrip";
import { forumIndexable } from "@/lib/forum/core";
import { FORUM_SITE } from "@/lib/forum/site";
import { readForum } from "@/lib/forum/store";

export async function generateMetadata(): Promise<Metadata> {
  const forum = await readForum(FORUM_SITE, false);
  return {
    title: "Community forum",
    description: `The ${FORUM_SITE.siteName} community forum. Talk ${FORUM_SITE.topic} prices, deals and favourites. No account needed.`,
    alternates: { canonical: "/forum" },
    ...(forumIndexable(forum) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Page() {
  const forum = await readForum(FORUM_SITE, false);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ForumApp site={FORUM_SITE} initial={forum} now={Date.now()} />
      <EbayStrip className="mt-6" placement="forum" queries={SITE_QUERIES} />
    </div>
  );
}
