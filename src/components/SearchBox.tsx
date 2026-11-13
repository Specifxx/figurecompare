"use client";
// Typeahead over /search-index.json: one static file built with each release,
// fetched the first time the box is focused. A keystroke never reaches a server.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRegion } from "./RegionPicker";
import { money } from "@/lib/format";
import type { RegionCode } from "@/site";

export type IndexRow = [slug: string, name: string, line: string, jan: string, prices: Partial<Record<RegionCode, number>>];

let cache: Promise<IndexRow[]> | null = null;
const loadIndex = () => (cache ??= fetch("/search-index.json").then((r) => (r.ok ? r.json() : [])).catch(() => []));

export function norm(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Every query word must appear; names starting with the query rank first. */
export function searchRows(rows: IndexRow[], q: string, limit = 8): IndexRow[] {
  const nq = norm(q);
  if (!nq) return [];
  if (/^\d{13}$/.test(nq)) return rows.filter((r) => r[3] === nq).slice(0, limit);
  const words = nq.split(" ");
  const hits: { r: IndexRow; score: number }[] = [];
  for (const r of rows) {
    const n = norm(r[1]);
    if (!words.every((w) => n.includes(w))) continue;
    const score = (n.startsWith(nq) ? 0 : 10) + (n.split(" ").some((t) => t === words[words.length - 1]) ? 0 : 3) + n.length / 100;
    hits.push({ r, score });
  }
  return hits.sort((a, b) => a.score - b.score).slice(0, limit).map((h) => h.r);
}

/** How many rows the dropdown shows before it offers the full results page. */
export const DROPDOWN_ROWS = 8;
/** The most rows the full results page draws. */
export const PAGE_ROWS = 300;
const LINE_LABEL: Record<string, string> = { nendoroid: "Nendoroid", figma: "figma", "pop-up-parade": "POP UP PARADE" };

/**
 * `full` (the /search page): every match is listed under the box, not just the dropdown's first eight
 * (Reddit, 2026-11-12: "the search needs a see all results option").
 */
export function SearchBox({ big = false, autoFocus = false, full = false }: { big?: boolean; autoFocus?: boolean; full?: boolean }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<IndexRow[] | null>(null);
  const [open, setOpen] = useState(false);
  // -1: no row picked with the arrow keys, so Enter opens the full results, not the first row.
  const [active, setActive] = useState(-1);
  const region = useRegion();
  const box = useRef<HTMLDivElement>(null);

  // On /search, start from ?q= (the form's no-JS fallback lands there).
  useEffect(() => {
    if (!autoFocus) return;
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQ(initial);
      setOpen(true);
      loadIndex().then(setRows);
    }
  }, [autoFocus]);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const all = useMemo(() => (rows ? searchRows(rows, q, PAGE_ROWS + 1) : []), [rows, q]);
  const results = full ? [] : all.slice(0, DROPDOWN_ROWS);
  const allHref = `/search?q=${encodeURIComponent(q.trim())}`;
  const go = (slug: string) => (window.location.href = `/figure/${slug}`);

  return (
    <div ref={box} className="relative w-full">
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          if (/^\s*(https?:\/\/|[a-z0-9-]+(\.[a-z0-9-]+)+\/)/i.test(q)) {
            e.preventDefault();
            window.location.href = `/is-this-a-good-price#link=${encodeURIComponent(q.trim())}`;
            return;
          }
          if (results[active]) {
            e.preventDefault();
            go(results[active][0]);
            return;
          }
          if (full) {
            // Already on the results page: keep the list, and make the address shareable.
            e.preventDefault();
            window.history.replaceState(null, "", allHref);
          }
        }}
        className={`flex items-center gap-2 rounded-lg border border-line bg-card pl-3 pr-1.5 focus-within:border-soft ${big ? "py-2" : "py-1"}`}
      >
        <span aria-hidden className="text-pink">⌕</span>
        <input
          name="q"
          value={q}
          autoFocus={autoFocus}
          onFocus={() => {
            setOpen(true);
            if (!rows) loadIndex().then(setRows);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, -1));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={big ? "Search a Nendoroid, figma or character…" : "Search figure, character, series…"}
          aria-label="Search figures"
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent font-sans text-ink placeholder:text-soft focus:outline-none ${big ? "text-lg" : "text-sm"}`}
        />
        <button type="submit" className={`rounded-md bg-pink font-display font-semibold text-white ${big ? "px-5 py-2" : "px-3 py-1 text-sm"}`}>
          Find
        </button>
      </form>
      {!full && open && q.trim().length > 1 && (
        <ul className="sticker absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto p-1.5 text-left">
          {!rows && <li className="px-3 py-2 text-sm text-soft">Loading the figure list…</li>}
          {rows && !results.length && (
            <li className="px-3 py-2 text-sm text-soft">
              No figure matches yet. Try the character&apos;s name. <a href="/stores#missing" className="underline">Why a figure can be missing</a>
            </li>
          )}
          {results.map((r, i) => (
            <li key={r[0]}>
              <a
                href={`/figure/${r[0]}`}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${i === active ? "bg-lilac-pale" : ""}`}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r[1]}</span>
                {r[4][region] != null && <span className="shrink-0 font-display text-sm font-bold text-pink-deep">{money(r[4][region]!, region)}</span>}
              </a>
            </li>
          ))}
          {all.length > results.length && (
            <li>
              <a href={allHref} className="block rounded-lg px-3 py-2 text-sm font-semibold text-pink-deep underline">
                See all {all.length > PAGE_ROWS ? `${PAGE_ROWS}+` : all.length} results
              </a>
            </li>
          )}
        </ul>
      )}
      {full && q.trim().length > 1 && (
        <div className="mt-4 text-left">
          {!rows && <p className="text-sm text-soft">Loading the figure list…</p>}
          {rows && (
            <p className="mb-2 text-sm text-soft">
              {all.length > PAGE_ROWS ? `More than ${PAGE_ROWS} figures match. Showing the first ${PAGE_ROWS}; add a word to narrow it.` : `${all.length} figure${all.length === 1 ? "" : "s"} match${all.length === 1 ? "es" : ""}.`}
            </p>
          )}
          <ul className="divide-y divide-line rounded-lg border border-line bg-card">
            {all.slice(0, PAGE_ROWS).map((r) => (
              <li key={r[0]}>
                <a href={`/figure/${r[0]}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-lilac-pale">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r[1]}</span>
                    <span className="block text-xs text-soft">{LINE_LABEL[r[2]] ?? r[2]}</span>
                  </span>
                  {r[4][region] != null ? (
                    <span className="shrink-0 font-display text-sm font-bold text-pink-deep">{money(r[4][region]!, region)}</span>
                  ) : (
                    <span className="shrink-0 text-xs text-soft">Other regions</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          {rows && (
            <p className="mt-3 text-xs text-soft">
              Can&apos;t find a figure? It gets a page once two stores we check list it with its barcode in one region (or one local store and one Japan store).{" "}
              <a href="/stores#missing" className="underline">Why a figure can be missing, and how to tell us</a>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
