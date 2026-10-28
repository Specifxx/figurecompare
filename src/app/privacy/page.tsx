import type { Metadata } from "next";
import { SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Privacy" />
      <Prose>
        <p>FigureCompare has no accounts, no sign-in and no forms, and sets no cookies of its own.</p>
        <ul>
          <li><strong>Your region and theme</strong> are guessed from your browser&apos;s time zone and kept in your browser&apos;s local storage. They never leave your device.</li>
          <li><strong>Vercel Web Analytics</strong> counts page views and clicks on buy links without cookies and without identifying you.</li>
          <li><strong>Affiliate partners</strong> (eBay, Amazon, stores) may set their own cookies once you follow a link to their site, under their own privacy policies.</li>
          <li><strong>Product photos</strong> load from the stores&apos; own servers.</li>
        </ul>
        <p>Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </Prose>
    </div>
  );
}
