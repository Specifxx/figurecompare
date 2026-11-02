import type { Metadata } from "next";
import { STORES } from "@/content/stores";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { HowWePickStores } from "@/components/HowWePickStores";

export const metadata: Metadata = {
  title: "How we pick stores",
  description: "How FigureCompare checks every figure store before listing it, keeps checking it, and how to report one.",
  alternates: { canonical: "/how-we-pick-stores" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="How we pick stores" />
      <Prose>
        <HowWePickStores
          showTitle={false}
          site="FigureCompare"
          what="anime figures"
          stores={STORES.map((s) => s.name)}
          priceRule="With three or more stores selling a figure, a price under 40% of their median is dropped automatically, and a figure is only matched by its barcode, so a bootleg can't borrow a real figure's page."
          marketplaces="eBay and Amazon rows are marketplaces, not stores: they are labelled and never counted as a store or as the cheapest. We don't vet the individual sellers there, so check a seller's feedback before you buy."
          buttonClassName="btn-pop"
          suggestHref="/stores#suggest"
        />
      </Prose>
    </div>
  );
}
