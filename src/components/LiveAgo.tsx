"use client";

import { useEffect, useState } from "react";
import { ago } from "@/lib/format";

// Pages are built once per release and cached for hours, so "2 hours ago" worked out on the server freezes and can read
// "2 hours ago" a day later (stale-price audit, 2026-11-19). Render the server's text, then correct it in the browser.
export function LiveAgo({ iso, initial }: { iso: string; initial: string }) {
  const [text, setText] = useState(initial);
  useEffect(() => setText(ago(iso)), [iso]);
  return (
    <time dateTime={iso} title={new Date(iso).toUTCString()} suppressHydrationWarning>
      {text}
    </time>
  );
}
