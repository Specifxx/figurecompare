"use client";
// The visitor's region: picked from their time zone by the <head> script on
// the first visit, changed here, remembered in this browser only.
import { useEffect, useState } from "react";
import { REGIONS, type RegionCode } from "@/site";
import { ACTIVE_REGIONS } from "@/lib/regions";

export function setRegion(code: RegionCode) {
  document.documentElement.dataset.region = code;
  try {
    localStorage.setItem("fc-region", code);
  } catch {}
  window.dispatchEvent(new CustomEvent("fc-region", { detail: code }));
}

export function useRegion(): RegionCode {
  const [r, setR] = useState<RegionCode>("US");
  useEffect(() => {
    const read = () => setR((document.documentElement.dataset.region as RegionCode) || "US");
    read();
    window.addEventListener("fc-region", read);
    return () => window.removeEventListener("fc-region", read);
  }, []);
  return r;
}

export function RegionPicker({ compact = false }: { compact?: boolean }) {
  const region = useRegion();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Your region</span>
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value as RegionCode)}
        className={`cursor-pointer appearance-none rounded-full border-2 border-line bg-card py-1.5 pl-3 pr-7 font-display text-sm font-semibold text-ink hover:border-pink ${compact ? "max-w-[5.5rem]" : ""}`}
      >
        {ACTIVE_REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.flag} {compact ? r.code : r.name}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-xs text-pink">▼</span>
    </label>
  );
}

/** Buttons that switch region inside a page ("Prices in: 🇺🇸 🇬🇧 …"). */
export function RegionTabs({ available }: { available: RegionCode[] }) {
  const region = useRegion();
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Prices by region">
      {REGIONS.filter((r) => available.includes(r.code)).map((r) => (
        <button
          key={r.code}
          role="tab"
          aria-selected={region === r.code}
          onClick={() => setRegion(r.code)}
          className={`chip border-2 px-3 py-1 text-sm transition ${region === r.code ? "border-ink bg-pink text-white shadow-popsm" : "border-line bg-card text-ink hover:border-pink"}`}
        >
          <span aria-hidden>{r.flag}</span> {r.code === "JP" ? "From Japan" : r.code}
        </button>
      ))}
    </div>
  );
}
