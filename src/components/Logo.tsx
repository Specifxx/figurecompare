// The mark: a dark rounded square with a white four-point star (the one anime
// touch) and a red dot. Same as src/app/icon.svg.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#181820" />
      <path d="M32 12 l5 15 L52 32 l-15 5 L32 52 l-5 -15 L12 32 l15 -5z" fill="#fff" />
      <circle cx="49" cy="15" r="5" fill="#e13848" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="h-display text-xl leading-none sm:text-[22px]">
        Figure<span className="text-pink">Compare</span>
      </span>
    </span>
  );
}
