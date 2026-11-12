import Link from "next/link";
import { CHRISTMAS_FESTIVE_LAYER } from "@/lib/season";

// Christmas gift-guide card (owner, 2026-11-12; lib/season.ts CHRISTMAS_FESTIVE_LAYER is the one off switch): one line at the top of
// the home page to the existing Black Friday deals page (there is no gift page), in the static HTML and shown only while <html>
// carries data-season="christmas" (globals.css .xmas-guide). Not a heading; no script, no image.
export function ChristmasGuide() {
  if (!CHRISTMAS_FESTIVE_LAYER) return null;
  return (
    <div className="xmas-pill-row mb-4">
      <Link prefetch={false} href="/black-friday" className="xmas-guide">
        <svg className="xmas-guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1-4-2.5S9.5 3 12 8c2.5-5 4-3.5 4-2.5S14.5 8 12 8z" /></svg>
        <span className="xmas-guide-text">
          <b>Christmas gift guide</b>
          <span className="xmas-guide-more hidden sm:inline"> · anime figures to gift, cheapest store first</span>
        </span>
        <span className="xmas-guide-go" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
