import type { MetadataRoute } from "next";
import { SITE } from "@/site";

// Rift Compare's list of bulk crawlers that send nobody (DECISIONS.md there,
// "Vercel cost"). Google, Bing, the AI answer engines, AhrefsBot and
// SemrushBot stay allowed.
const BLOCKED_BOTS = [
  "Bytespider", "meta-externalagent", "Meta-ExternalAgent",
  "MJ12bot", "DotBot", "PetalBot", "DataForSeoBot", "BLEXBot", "Barkrowler", "serpstatbot", "SeekportBot", "ImagesiftBot", "Timpibot",
];
// No sitemap URL carries a query; the longest rule wins, so these beat "/*?".
const QUERY_ALLOWS = ["/_next/", "/*opengraph-image", "/icon", "/apple-icon"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", ...QUERY_ALLOWS], disallow: ["/api/", "/search", "/*?"] },
      { userAgent: BLOCKED_BOTS, disallow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
