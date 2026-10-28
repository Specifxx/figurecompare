import type { RegionCode } from "@/site";
import { dayToDate } from "@/lib/history";
import { money } from "@/lib/format";

/** The lowest orderable price over time, as a step line. Server-rendered SVG. */
export function PriceHistory({ series, region, today }: { series: [number, number][] | undefined; region: RegionCode; today: number }) {
  if (!series || series.length < 2) {
    return <p className="text-sm text-soft">Price history starts the day we first saw this figure; check back in a few days (・ω・)ノ</p>;
  }
  const pts = [...series, [today, series[series.length - 1][1]] as [number, number]];
  const x0 = pts[0][0];
  const x1 = Math.max(today, x0 + 1);
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const W = 600;
  const H = 140;
  const X = (d: number) => ((d - x0) / (x1 - x0)) * (W - 20) + 10;
  const Y = (v: number) => (hi === lo ? H / 2 : H - 16 - ((v - lo) / (hi - lo)) * (H - 36));
  let d = `M${X(pts[0][0])},${Y(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += ` H${X(pts[i][0])} V${Y(pts[i][1])}`;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" role="img" aria-label={`Lowest price from ${money(lo, region)} to ${money(hi, region)} since ${dayToDate(x0)}`}>
        <defs>
          <linearGradient id={`g-${region}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--pink))" stopOpacity=".35" />
            <stop offset="1" stopColor="rgb(var(--pink))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} V${H} H${X(pts[0][0])} Z`} fill={`url(#g-${region})`} />
        <path d={d} fill="none" stroke="rgb(var(--pink))" strokeWidth="3" strokeLinejoin="round" />
        {pts.slice(0, -1).map(([dd, v]) => (
          <circle key={dd} cx={X(dd)} cy={Y(v)} r="4" fill="rgb(var(--card))" stroke="rgb(var(--pink))" strokeWidth="2.5" />
        ))}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-soft">
        <span>{dayToDate(x0)}</span>
        <span>
          low {money(lo, region)} · high {money(hi, region)}
        </span>
        <span>today</span>
      </figcaption>
    </figure>
  );
}
