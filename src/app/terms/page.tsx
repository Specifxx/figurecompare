import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Terms" />
      <Prose>
        <p>FigureCompare is a free price guide. Prices, stock and pre-order dates are what each store showed at our last check and can change at any time; the store&apos;s own page is always right. We do not sell anything and are not a party to any purchase.</p>
        <p>FigureCompare is a fan-made site, not affiliated with or endorsed by Good Smile Company, Max Factory, any licensor or any store. Product names, trademarks and photos belong to their owners and are used to identify the products.</p>
        <p>The site is provided as is. Use it at your own risk.</p>
      </Prose>
    </div>
  );
}
