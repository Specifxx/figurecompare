import Link from "next/link";
import { saleStrip } from "@/lib/black-friday";

// One line under the header on every page from 1 November to the day after Cyber Monday, linking the Black Friday page,
// then the Cyber Monday page (lib/black-friday.ts saleStrip; DECISIONS.md, "Black Friday strip and Cyber Monday page",
// 2026-11-07). Drawn at the daily build like every page; a plain link, never a pop-up, a countdown or "ends soon".
export function HolidayStrip({ today = new Date().toISOString().slice(0, 10) }: { today?: string }) {
  const s = saleStrip(today);
  if (!s) return null;
  return (
    <div className="border-b border-line bg-card" data-holiday-strip={s.href.slice(1)}>
      <p className="mx-auto max-w-6xl truncate px-4 py-1.5 text-center text-xs sm:text-sm">
        <Link prefetch={false} href={s.href} className="hover:underline">
          <b>{s.name} anime figure deals</b><span className="hidden sm:inline"> · today&apos;s cheapest figure stores, updated daily</span> · <span className="font-semibold text-pink-deep">see the deals →</span>
        </Link>
      </p>
    </div>
  );
}
