"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The phone eBay dock (owner, 2026-11-19: "the strip ads … right above the banner … for every single site … eBay as a strip
// banner there"). Ported from the sister sites' AdDock (KaeYoung, ScentCompare, WargameCompare) in its stacked form:
//
//   • Browser only, phones only (below 768px). Nothing in the server HTML is visible; the tiles of every region are built at the
//     daily build (PhoneEbayDock.tsx) and the visitor's region (html[data-region], set before paint) picks one list.
//   • Never on the first screen: it shows only once the visitor has scrolled DOCK_ARM of a screen.
//   • Never beside another unit: hidden while the footer, the rating card, a price table or anything marked [data-dock-yield] is in
//     view or near it, on a page with the buy bar ([data-buybar]), and while a dialog, the menu or the keyboard is open.
//   • Above the bottom nav while the nav shows (html[data-bottomnav] [data-dock-stack] in globals.css): both bars at once.
//   • Fixed, sliding on transform only: nothing on the page moves (CLS 0).
//   • eBay only (Amazon allows no link in an overlay). Labelled "Ad", rel sponsored, ✕ hides it for the visit.

export const DOCK_ARM = 0.6;
export const DOCK_MIN_WIDTH = 768;
const DISMISS_KEY = "ad-dock-off";

export interface DockState {
  narrow: boolean;
  scrolled: number;
  screen: number;
  blockers: number;
  buybar: boolean;
  modal: boolean;
  typing: boolean;
}

/** Whether the dock shows. Pure, for the tests. */
export function dockShows(s: DockState): boolean {
  return s.narrow && s.scrolled >= s.screen * DOCK_ARM && s.blockers === 0 && !s.buybar && !s.modal && !s.typing;
}

function dismissedThisVisit(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function PhoneDock({ byRegion }: { byRegion: Record<string, ReactNode[]> }) {
  const [region, setRegion] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (dismissedThisVisit()) return;
    const root = document.documentElement;
    const read = () => setRegion(root.dataset.region ?? "US");
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-region"] });
    const wide = window.matchMedia(`(min-width: ${DOCK_MIN_WIDTH}px)`);
    const check = () => {
      if (!wide.matches && window.scrollY >= window.innerHeight * (DOCK_ARM / 2)) {
        setArmed(true);
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, []);
  const items = region ? byRegion[region] : undefined;
  if (!armed || !items?.length) return null;
  return <Dock key={region} items={items} placement="dock" />;
}

function Dock({ items, placement }: { items: ReactNode[]; placement: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [turn, setTurn] = useState(0);
  const visible = shown && !dismissed;

  useEffect(() => {
    const dock = ref.current;
    if (!dock || typeof IntersectionObserver === "undefined") return;
    const wide = window.matchMedia(`(min-width: ${DOCK_MIN_WIDTH}px)`);
    const blockers = new Set<Element>();
    let typing = false;
    const modal = () =>
      !!document.querySelector("dialog[open], [aria-modal='true']:not([aria-hidden='true'] *):not([inert] *)") ||
      document.body.style.overflow === "hidden" ||
      document.documentElement.style.overflow === "hidden";
    const update = () =>
      setShown(
        dockShows({
          narrow: !wide.matches,
          scrolled: window.scrollY,
          screen: window.innerHeight,
          blockers: blockers.size,
          buybar: !!document.querySelector("[data-buybar]:not([data-buybar='hidden'])"),
          modal: modal(),
          typing,
        }),
      );
    const watched = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.isConnected) blockers.add(e.target);
          else blockers.delete(e.target);
        }
        update();
      },
      { rootMargin: "120px 0px 120px 0px" },
    );
    const scan = () => {
      const now = new Set<Element>([...document.querySelectorAll("footer, [data-dock-yield], [data-rate-card], table")].filter((el) => !dock.contains(el)));
      for (const el of now) if (!watched.has(el)) (watched.add(el), io.observe(el));
      for (const el of [...watched]) {
        if (now.has(el)) continue;
        watched.delete(el);
        io.unobserve(el);
        blockers.delete(el);
      }
      update();
    };
    scan();
    let frame = 0;
    const later = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), scan()));
    };
    const mo = new MutationObserver(later);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-dock-yield", "data-buybar", "open", "aria-modal", "style"] });
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      typing = !!t?.matches?.("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable='true']");
      update();
    };
    const onBlur = () => {
      typing = false;
      update();
    };
    window.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later, { passive: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      io.disconnect();
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  // Each time it comes back, the next tile.
  useEffect(() => {
    if (visible) setTurn((n) => n + 1);
  }, [visible]);
  useEffect(() => {
    const ul = list.current;
    const first = ul?.firstElementChild as HTMLElement | null;
    if (!ul || !first || items.length === 0) return;
    ul.scrollTo({ left: (Math.max(0, turn - 1) % items.length) * (first.offsetWidth + 8), behavior: "instant" as ScrollBehavior });
  }, [turn, items.length]);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (el) el.inert = !visible;
    root.toggleAttribute("data-ad-dock", visible);
    return () => root.removeAttribute("data-ad-dock");
  }, [visible]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage blocked: hidden for this page only */
    }
  }

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Figures on eBay (ad)"
      aria-hidden={visible ? undefined : true}
      data-ad={visible ? placement : undefined}
      data-dock={visible ? "shown" : "hidden"}
      data-dock-stack=""
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden ${
        visible ? "translate-y-0 transition-transform duration-200 ease-out motion-reduce:transition-none" : "invisible translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[640px] items-center gap-2">
        <ul ref={list} role="list" className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <li key={i} className="w-[calc(100%-14px)] shrink-0 snap-start sm:w-[calc(50%-8px)]">
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide these ads for this visit"
          className="-mr-2 inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-full text-soft hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
