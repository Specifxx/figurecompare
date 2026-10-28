// Halloween look (owner, 2026-10-28): pumpkin and purple accents, a slim stripe under the header and a pumpkin by the logo,
// from 29 to 31 October 2026 by the VISITOR'S OWN calendar. Decided in the browser before first paint by SEASON_BOOT_SCRIPT,
// never on the server: every page is a static file built once a day, and the look turns itself off on 1 November with no deploy.
// globals.css keys everything on `html[data-season="halloween"]`; without JavaScript the site keeps its usual look.

export const HALLOWEEN_FROM = 20261029; // yyyymmdd, inclusive
export const HALLOWEEN_TO = 20261031;

/** Whether a local calendar date falls in the Halloween window. */
export function isHalloween(d: Date): boolean {
  const k = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return k >= HALLOWEEN_FROM && k <= HALLOWEEN_TO;
}

// Inline, dependency-free, never throws. Kept in step with isHalloween() by tests/season.test.ts.
export const SEASON_BOOT_SCRIPT = `(function(){try{var n=new Date(),k=n.getFullYear()*10000+(n.getMonth()+1)*100+n.getDate();if(k>=${HALLOWEEN_FROM}&&k<=${HALLOWEEN_TO})document.documentElement.setAttribute("data-season","halloween")}catch(e){}})();`;
