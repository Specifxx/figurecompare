import { SaleSeasonPage, saleMetadata } from "@/components/SaleSeasonPage";

// One URL kept every year (DECISIONS.md, "Seasonal sale pages", 2026-11-02), prerendered at the daily build.
export const generateMetadata = () => saleMetadata("boxing-day");

export default function Page() {
  return <SaleSeasonPage slug="boxing-day" />;
}
