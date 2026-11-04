import type { Metadata } from "next";
import { REGIONS, SITE } from "@/site";
import { STORES } from "@/content/stores";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";
import { ListYourStore } from "@/components/ListYourStore";

// The store-owner page every Compare Empire site shares (owner, 2026-11-04).
export const metadata: Metadata = {
  title: "List your figure store, free",
  description: "Run a store that sells Nendoroid, figma or POP UP PARADE figures? Get it listed on FigureCompare's price comparison for free: buyers comparing prices go straight to your product pages.",
  alternates: { canonical: "/list-your-store" },
};

export default function Page() {
  const names = REGIONS.map((r) => r.name);
  const markets = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="List your store on FigureCompare" />
      <Prose>
        <ListYourStore
          showTitle={false}
          site="FigureCompare"
          what="anime figures"
          markets={markets}
          storeCount={STORES.length}
          regions={REGIONS.map((r) => [r.code, r.name])}
          email={SITE.email}
          platforms="Shopify and WooCommerce"
          pricesRule="with three or more stores selling a figure, a price under 40% of their median is dropped as a likely mistake"
          suggestHref="/stores#suggest"
          buttonClassName="btn-pop bg-pink text-white"
        >
          <li><strong>The JAN barcode on each listing.</strong> We match figures only by their barcode (in the variant barcode, the SKU or a &ldquo;JAN:&rdquo; line), never by title, so a listing without one is left out.</li>
        </ListYourStore>
      </Prose>
    </div>
  );
}
