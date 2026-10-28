// Decorative twinkles, placed by a fixed recipe (no randomness: the HTML is
// identical on every build, so it caches and never mismatches on hydration).
const SHAPES = ["✦", "✧", "♡", "★", "✿", "⋆"];
const COLORS = ["text-pink", "text-lilac", "text-sky", "text-mint", "text-lemon"];

export function Sparkles({ count = 10, seed = 1, className = "" }: { count?: number; seed?: number; className?: string }) {
  const items = Array.from({ length: count }, (_, i) => {
    // R2 low-discrepancy sequence: evenly spread, identical every build.
    const n = (i + 1) * 7919 * seed;
    return {
      left: Math.round((((i + seed) * 0.7548776662) % 1) * 92 + 2),
      top: Math.round((((i + seed) * 0.5698402910) % 1) * 88 + 2),
      size: 12 + ((n * 3) % 16),
      delay: ((n * 7) % 30) / 10,
      shape: SHAPES[(n >> 2) % SHAPES.length],
      color: COLORS[(n >> 3) % COLORS.length],
    };
  });
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {items.map((s, i) => (
        <span
          key={i}
          className={`absolute select-none motion-safe:animate-twinkle ${s.color}`}
          style={{ left: `${s.left}%`, top: `${s.top}%`, fontSize: s.size, animationDelay: `${s.delay}s` }}
        >
          {s.shape}
        </span>
      ))}
    </div>
  );
}
