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
// Christmas (owner, 2026-11-01: "now that it's November, we want to make all of the sites Christmas themed"): from
// 1 November through Boxing Day, every year, by the visitor's own calendar, keyed on `html[data-season="christmas"]`. To
// switch it off early, set CHRISTMAS_TO to yesterday's month and day: no other file decides it. `?season=christmas`
// previews it out of season, `?season=off` hides any season.
export const CHRISTMAS_FROM = 1101; // mmdd, inclusive
export const CHRISTMAS_TO = 1226;

/** Whether a local calendar date falls in the Christmas window (any year). */
export function isChristmas(d: Date): boolean {
  const k = (d.getMonth() + 1) * 100 + d.getDate();
  return k >= CHRISTMAS_FROM && k <= CHRISTMAS_TO;
}

export type Season = "halloween" | "christmas";

/** The season a local date falls in, or null. */
export function seasonAt(d: Date): Season | null {
  return isHalloween(d) ? "halloween" : isChristmas(d) ? "christmas" : null;
}

export const SEASON_BOOT_SCRIPT = `(function(){try{var s=null,q=(typeof location!="undefined"&&location.search.match(/[?&]season=([a-z]+)/)||[])[1];if(q){if(q==="halloween"||q==="christmas")s=q}else{var n=new Date(),m=(n.getMonth()+1)*100+n.getDate(),k=n.getFullYear()*10000+m;if(k>=${HALLOWEEN_FROM}&&k<=${HALLOWEEN_TO})s="halloween";else if(m>=${CHRISTMAS_FROM}&&m<=${CHRISTMAS_TO})s="christmas"}if(s)document.documentElement.setAttribute("data-season",s)}catch(e){}})();`;
