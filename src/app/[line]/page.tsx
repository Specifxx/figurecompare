import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LINES, LINE_BY_KEY, type LineKey } from "@/site";
import { LineHub } from "@/components/LineHub";

export const dynamicParams = false;
export const generateStaticParams = () => LINES.map((l) => ({ line: l.key }));

export function generateMetadata({ params }: { params: { line: string } }): Metadata {
  const l = LINE_BY_KEY[params.line as LineKey];
  if (!l) return {};
  return {
    title: `${l.name} prices: compare every store`,
    description: `Compare ${l.name} prices across real figure stores in the US, UK, Canada, Australia, New Zealand, Europe and Singapore. In stock and pre-order, matched by barcode, updated daily.`,
    alternates: { canonical: `/${l.key}` },
  };
}

export default function LinePage({ params }: { params: { line: string } }) {
  if (!LINE_BY_KEY[params.line as LineKey]) notFound();
  return <LineHub line={params.line as LineKey} page={1} />;
}
