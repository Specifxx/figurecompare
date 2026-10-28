import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LINES, LINE_BY_KEY, type LineKey } from "@/site";
import { LineHub, pageCount } from "@/components/LineHub";

export const dynamicParams = false;
export function generateStaticParams() {
  return LINES.flatMap((l) => Array.from({ length: pageCount(l.key) - 1 }, (_, i) => ({ line: l.key, n: String(i + 2) })));
}

export function generateMetadata({ params }: { params: { line: string; n: string } }): Metadata {
  const l = LINE_BY_KEY[params.line as LineKey];
  if (!l) return {};
  return {
    title: `${l.name} prices, page ${params.n}`,
    alternates: { canonical: `/${l.key}/page/${params.n}` },
  };
}

export default function LinePaged({ params }: { params: { line: string; n: string } }) {
  const line = params.line as LineKey;
  const n = Number(params.n);
  if (!LINE_BY_KEY[line] || !Number.isInteger(n) || n < 2 || n > pageCount(line)) notFound();
  return <LineHub line={line} page={n} />;
}
