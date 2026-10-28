"use client";
// The desktop sidebar (xl and up; owner, 2026-10-28: the empty left side of a
// wide screen becomes navigation): every line, the deal pages and the rest
// (lib/nav.ts), sticky under the header, then a small eBay box. Plain links in
// the static HTML; the current page is marked in the browser.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type NavGroup } from "@/lib/nav";
import type { ReactNode } from "react";

export function SideNav({ groups, footer }: { groups: NavGroup[]; footer?: ReactNode }) {
  const pathname = usePathname() || "/";
  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <nav aria-label="Browse" className="sticky top-[7.5rem] max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain py-6 pl-4 pr-2 [scrollbar-width:thin]">
        {footer && <div className="mb-5">{footer}</div>}
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <h2 className="mb-1 px-2 font-display text-xs font-bold uppercase tracking-wider text-soft">{g.title}</h2>
            <ul>
              {g.links.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-sm transition ${active ? "border-pink bg-lilac-pale font-semibold text-ink" : "border-transparent text-soft hover:bg-lilac-pale hover:text-ink"}`}
                    >
                      <span className="flex-1">{l.label}</span>
                      {l.count != null && <span className="text-xs text-soft">{l.count}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
