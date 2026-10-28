"use client";
// The menu button below xl (owner, 2026-10-28: the phone menu lists
// everything): the same groups as the desktop sidebar (lib/nav.ts), then every
// region. A full-height sheet; closes on a link, Escape or the backdrop.
// Drawn on <body>: inside the blurred header a fixed sheet would be clipped to it.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isActive, type NavGroup } from "@/lib/nav";
import { ACTIVE_REGIONS } from "@/lib/regions";
import { setRegion, useRegion } from "./RegionPicker";

export function MobileMenu({
  groups,
  footer,
}: {
  groups: NavGroup[];
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const region = useRegion();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="site-menu"
        className="grid h-9 w-9 place-items-center rounded-full border-2 border-line bg-card text-lg text-ink transition hover:border-pink"
      >
        <span aria-hidden>☰</span>
        <span className="sr-only">Menu</span>
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            id="site-menu"
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <nav className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto overscroll-contain border-l-2 border-line bg-bg p-4 shadow-sticker">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-lg font-bold text-ink">
                  Menu ✦
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-line bg-card text-ink hover:border-pink"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <Link
                href="/"
                prefetch={false}
                className={`mb-3 flex items-center gap-2 rounded-xl px-2 py-2 text-base ${pathname === "/" ? "bg-pink-pale font-bold" : "hover:bg-pink-pale/60"}`}
              >
                <span aria-hidden>🏠</span> Home
              </Link>
              {groups.map((g) => (
                <div key={g.title} className="mb-4">
                  <h2 className="mb-1 px-2 font-display text-xs font-bold uppercase tracking-wider text-soft">
                    {g.title}
                  </h2>
                  <ul>
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          prefetch={false}
                          aria-current={
                            isActive(pathname, l.href) ? "page" : undefined
                          }
                          className={`flex items-center gap-2 rounded-xl px-2 py-2 text-base text-ink ${isActive(pathname, l.href) ? "bg-pink-pale font-bold" : "hover:bg-pink-pale/60"}`}
                        >
                          <span aria-hidden>{l.emoji}</span>
                          <span className="flex-1">{l.label}</span>
                          {l.count != null && (
                            <span className="text-xs text-soft">{l.count}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="mb-4">
                <h2 className="mb-1 px-2 font-display text-xs font-bold uppercase tracking-wider text-soft">
                  Prices in
                </h2>
                <ul className="grid grid-cols-2 gap-1.5">
                  {ACTIVE_REGIONS.map((r) => (
                    <li key={r.code}>
                      <button
                        type="button"
                        onClick={() => setRegion(r.code)}
                        aria-pressed={region === r.code}
                        className={`w-full rounded-xl border-2 px-2 py-1.5 text-left text-sm ${region === r.code ? "border-ink bg-pink text-white" : "border-line bg-card text-ink hover:border-pink"}`}
                      >
                        {r.flag} {r.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {footer}
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
