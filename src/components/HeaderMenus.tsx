"use client";
// The header's mega menus, from lg up (Bill, 2026-11-09: "navigation is very, very important"). Every panel is in the server HTML as
// plain links (crawlable; closed panels are only hidden by CSS), and lib/nav.ts builds them from the same lists as the phone menu.
// Opens on hover with a short intent delay (no flicker while the pointer crosses the bar), on click or tap, and with the keyboard:
// Enter/Space/ArrowDown opens, Tab walks the links, Escape closes and returns to the button. Region-bound links carry the engine's
// `rp rp-XX` classes, so a visitor sees only what is listed in their market. No library, no layout shift (panels are absolute).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isActive, type HeaderMenu } from "@/lib/nav";

const regionClass = (regions?: string[]) => (regions ? `rp ${regions.map((r) => `rp-${r}`).join(" ")}` : "");

export function HeaderMenus({ menus }: { menus: HeaderMenu[] }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      root.current?.querySelector<HTMLElement>(`[data-menu="${open}"]`)?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <nav ref={root} aria-label="Shop menus" className="hidden shrink-0 lg:block" onPointerLeave={(e) => e.pointerType === "mouse" && later(() => setOpen(null), 220)}>
      <ul className="flex items-center gap-0.5">
        {menus.map((m, i) => {
          const isOpen = open === i;
          const here = m.columns.some((c) => c.links.some((l) => isActive(pathname, l.href))) || isActive(pathname, m.all.href);
          return (
            <li
              key={m.label}
              className="relative"
              onPointerEnter={(e) => e.pointerType === "mouse" && later(() => setOpen(i), open === null ? 90 : 0)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen((o) => (o === i ? null : o));
              }}
            >
              <button
                type="button"
                data-menu={i}
                aria-expanded={isOpen}
                aria-controls={`hm-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(i);
                    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(`#hm-${i} a`)?.focus());
                  }
                }}
                className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition hover:bg-bg hover:text-ink ${here || isOpen ? "text-ink" : "text-soft"}`}
              >
                {m.label}
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div id={`hm-${i}`} className={`absolute left-0 top-full z-50 pt-1 ${isOpen ? "block" : "hidden"}`}>
                <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-line bg-card p-4 shadow-lg">
                  <div className="flex gap-8">
                    {m.columns.map((c, ci) => (
                      <div key={ci} className="min-w-[11rem]">
                        {c.title && <p className="eyebrow mb-1.5 px-2">{c.title}</p>}
                        <ul>
                          {c.links.map((l) => (
                            <li key={l.href} className={regionClass(l.regions)}>
                              <Link
                                href={l.href}
                                prefetch={false}
                                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                                className={`block whitespace-nowrap rounded-md px-2 py-1.5 text-[14px] transition hover:bg-bg hover:text-ink ${isActive(pathname, l.href) ? "font-semibold text-ink" : "text-soft"}`}
                              >
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <Link href={m.all.href} prefetch={false} className="mt-3 block border-t border-line px-2 pt-2.5 text-sm font-semibold text-ink hover:underline">
                    {m.all.label} →
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
