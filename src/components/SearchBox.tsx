"use client";
// Typeahead over /search-index.json: one static file built with each release,
// fetched the first time the box is focused. A keystroke never reaches a server.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRegion } from "./RegionPicker";
import { money } from "@/lib/format";
import type { RegionCode } from "@/site";

export type IndexRow = [slug: string, name: string, line: string, jan: string, prices: Partial<Record<RegionCode, number>>];

const LINE_EMOJI: Record<string, string> = { nendoroid: "🍡", figma: "🤸", "pop-up-parade": "🎀" };
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

export function SearchBox({ big = false, autoFocus = false }: { big?: boolean; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<IndexRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
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

  const results = useMemo(() => (rows ? searchRows(rows, q) : []), [rows, q]);
  const go = (slug: string) => (window.location.href = `/figure/${slug}`);

  return (
    <div ref={box} className="relative w-full">
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          if (results[active]) {
            e.preventDefault();
            go(results[active][0]);
          }
        }}
        className={`flex items-center gap-2 rounded-full border-2 border-ink bg-card pl-4 pr-1.5 shadow-popsm focus-within:shadow-pop ${big ? "py-2" : "py-1"}`}
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
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={big ? "Search a Nendoroid, figma or character…" : "Search figures…"}
          aria-label="Search figures"
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent font-sans text-ink placeholder:text-soft focus:outline-none ${big ? "text-lg" : "text-sm"}`}
        />
        <button type="submit" className={`rounded-full bg-pink font-display font-semibold text-white ${big ? "px-5 py-2" : "px-3 py-1 text-sm"}`}>
          Find ✧
        </button>
      </form>
      {open && q.trim().length > 1 && (
        <ul className="sticker absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto p-1.5 text-left">
          {!rows && <li className="px-3 py-2 text-sm text-soft">Loading the figure list… (◕‿◕)</li>}
          {rows && !results.length && <li className="px-3 py-2 text-sm text-soft">No figure matches yet (；ω；) Try the character&apos;s name.</li>}
          {results.map((r, i) => (
            <li key={r[0]}>
              <a
                href={`/figure/${r[0]}`}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${i === active ? "bg-pink-pale" : ""}`}
              >
                <span aria-hidden className="text-xl">{LINE_EMOJI[r[2]] ?? "✦"}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r[1]}</span>
                {r[4][region] != null && <span className="shrink-0 font-display text-sm font-bold text-pink-deep">{money(r[4][region]!, region)}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
