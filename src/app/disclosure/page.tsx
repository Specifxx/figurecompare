import type { Metadata } from "next";
import { PageHead } from "@/components/Section";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "Affiliate disclosure", alternates: { canonical: "/disclosure" } };

export default function Disclosure() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <PageHead title="Affiliate disclosure" />
      <Prose>
        <p>FigureCompare is free to use. It is paid for by affiliate links: if you buy after following one, the shop may pay us a commission. You pay the same price.</p>
        <ul>
          <li><strong>eBay Partner Network:</strong> links to eBay listings and searches.</li>
          <li><strong>Amazon Associates:</strong> as an Amazon Associate we earn from qualifying purchases.</li>
          <li><strong>Store programs:</strong> stores marked &quot;Paid link&quot; run an affiliate program we belong to.</li>
        </ul>
        <p>Links that can pay us are marked &quot;Paid link&quot; or &quot;Ad&quot; and carry rel=&quot;sponsored&quot;. Commission never decides the order of prices: stores are sorted by price, cheapest first, and eBay and Amazon sit in their own labelled rows.</p>
        <p>Links to stores that pay us nothing carry a referral tag (utm_source=figurecompare.com) so the store can see we sent you.</p>
      </Prose>
    </div>
  );
}
