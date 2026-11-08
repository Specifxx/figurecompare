import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { FAMILY_SITES, NETWORK_PAGE } from "@/lib/family-network";

// The one page that links the owner's other sites (2026-11-08, DECISIONS.md "One Our sites page instead of footer
// cross-links"): every footer links here once, and this page links each site once, by its plain name, instead of a
// site-wide link from every page to another of our domains. Prerendered like every page.
export const metadata: Metadata = {
  title: "Our other sites",
  description: "FigureCompare is one of the Compare Empire price comparison sites. The others compare card games, hobby and tech prices the same way.",
  alternates: { canonical: "/our-sites" },
};

export default function OurSites() {
  const sites = FAMILY_SITES.filter((s) => s.id !== "figure");
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Our other sites" sub="FigureCompare is one of the Compare Empire sites: independent price comparison, no paid ranking." />
      <Prose>
        <ul>
          {sites.map((s) => (
            <li key={s.id}>
              <a href={s.url} rel="noopener">{s.name}</a>: {s.label}
            </li>
          ))}
        </ul>
        <p>
          <a href={NETWORK_PAGE} rel="noopener">Every Compare Empire site →</a>
        </p>
      </Prose>
    </div>
  );
}
