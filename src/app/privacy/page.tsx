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
        <p>FigureCompare has no accounts and no sign-in, and sets no cookies of its own.</p>
        <ul>
          <li><strong>Your region and theme</strong> are guessed from your browser&apos;s time zone and kept in your browser&apos;s local storage. They never leave your device.</li>
          <li><strong>Vercel Web Analytics</strong> counts page views and clicks on buy links without cookies and without identifying you.</li>
          <li><strong>Affiliate partners</strong> (eBay, Amazon, stores) may set their own cookies once you follow a link to their site, under their own privacy policies.</li>
          <li><strong>Product photos</strong> load from the stores&apos; own servers.</li>
          <li><strong>Price alerts</strong>: if you ask to be emailed when a price drops, the form sends your email address, the figure, your region and your price to our sister site RiftCompare&apos;s alert service, which keeps them only for that alert, emails you once to confirm, and deletes them when you stop the alert (every email has a link) or after six months. FigureCompare itself never stores them. Details: <a href="https://riftcompare.com/privacy#sister-alerts">RiftCompare&apos;s privacy policy</a>.</li>
        </ul>
        <p>Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      </Prose>
    </div>
  );
}
