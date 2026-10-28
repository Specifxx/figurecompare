import { LINE_BY_KEY, type LineKey } from "@/site";

/** A store's own product photo (hotlinked, lazy), or a cute placeholder. */
export function FigureImage({ src, alt, line, className = "", eager = false }: { src: string | null; alt: string; line: LineKey; className?: string; eager?: boolean }) {
  if (!src)
    return (
      <div className={`grid place-items-center text-5xl ${className}`} aria-label={`${alt} (no photo yet)`} role="img">
        <span aria-hidden>{LINE_BY_KEY[line].emoji}</span>
      </div>
    );
  // text-transparent: if a store pulls its photo, the browser's broken-image
  // alt text does not spill over the tile.
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" className={`text-transparent ${className}`} />;
}
