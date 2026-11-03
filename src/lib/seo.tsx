// Structured data helpers (SEO audit, 2026-11-03). Every block describes only what the page shows: the breadcrumb trail
// printed at the top, the questions printed in a FAQ, the prices printed in the table. Region is chosen in the browser on
// ONE URL per page (every region's prices are in the HTML), so the site has no hreflang alternates by design.
import Link from "next/link";
import { SITE } from "@/site";

export const ldJson = (obj: unknown) => JSON.stringify(obj).replace(/</g, "\\u003c");

export function siteLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE.url}/#org`, name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, email: SITE.email },
      { "@type": "WebSite", "@id": `${SITE.url}/#website`, url: SITE.url, name: SITE.name, description: SITE.description, publisher: { "@id": `${SITE.url}/#org` }, inLanguage: "en" },
    ],
  };
}

/** The visible trail, Home first; the last item is the page itself. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}${it.path === "/" ? "" : it.path}` })),
  };
}

export function faqLd(qa: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />;
}

/** A visible breadcrumb trail (Home first, the page itself last, unlinked) and its BreadcrumbList. */
export function Crumbs({ items, className = "mt-5 text-sm text-soft" }: { items: { name: string; path: string }[]; className?: string }) {
  const trail = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbLd(items)} />
      <nav aria-label="Breadcrumb" className={className}>
        {trail.map((it, i) => (
          <span key={it.path}>
            {i > 0 && <span className="mx-1.5">/</span>}
            {i < trail.length - 1 ? (
              <Link prefetch={false} href={it.path} className="hover:text-ink">{it.name}</Link>
            ) : (
              <span className="text-ink">{it.name}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
