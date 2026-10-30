import type { Metadata } from "next";
import { SITE } from "@/site";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

// The address, said plainly and linked from every footer (owner, 2026-10-30).
// No form: the site has no server to send one, and an email keeps a record.
export const metadata: Metadata = {
  title: "Contact us",
  description: `Email FigureCompare at ${SITE.email}: a wrong price or match, a store to add or remove, press and partnerships.`,
  alternates: { canonical: "/contact" },
};

const mail = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Contact us" />
      <Prose>
        <p>
          Email <a href={`mailto:${SITE.email}`}><strong>{SITE.email}</strong></a>. A person reads every message, usually within two working days.
        </p>
        <ul>
          <li><a href={mail("Wrong price or match")}>A wrong price or a wrong match</a>: the FigureCompare page, the store, and what is wrong.</li>
          <li><a href={mail("Store listing")}>Stores</a>: to be listed, to fix a listing, or to be removed. Listing is free and never changes the order of prices.</li>
          <li><a href={mail("Missing figure")}>A figure we don&apos;t list yet</a>.</li>
          <li><a href={mail("Press or partnership")}>Press, partnerships and affiliate programmes</a>.</li>
        </ul>
      </Prose>
    </div>
  );
}
