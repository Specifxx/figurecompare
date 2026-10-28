import type { Metadata } from "next";
import { SearchBox } from "@/components/SearchBox";
import { PageHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "Search figures",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default function Search() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-40">
      <PageHead emoji="🔍" title="Search figures" sub="Type a character, a series, a Nendoroid or figma number, or a 13-digit barcode." />
      <SearchBox big autoFocus />
    </div>
  );
}
