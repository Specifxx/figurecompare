"use client";
// The small, neutral "Best price" tag on a plain (non-affiliate) cheapest row (owner, 2026-11-18), with an optional "i" hint:
// the title and aria-label carry the text for a pointer and a screen reader, a tap shows it as a muted line on a phone.
import { useState } from "react";
import { BEST_PRICE_TAG } from "@/lib/best-tag";

export function BestTag({ hint }: { hint?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-best-tag>
      <span className="chip bg-line/50 text-soft">{BEST_PRICE_TAG}</span>
      {hint && (
        <>
          <button
            type="button"
            title={hint}
            aria-label={hint}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-semibold leading-none text-soft hover:border-soft"
          >
            i
          </button>
          {open && (
            <span role="note" className="basis-full text-xs font-normal text-soft">
              {hint}
            </span>
          )}
        </>
      )}
    </span>
  );
}
