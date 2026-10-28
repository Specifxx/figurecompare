export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect x="3" y="3" width="58" height="58" rx="18" fill="#ff5fa2" stroke="#3b2350" strokeWidth="4" />
      <path d="M32 11 l5.5 14.5 L52 31 l-14.5 5.5 L32 51 l-5.5 -14.5 L12 31 l14.5 -5.5z" fill="#fff" />
      <circle cx="48" cy="15" r="4" fill="#ffd54a" />
      <circle cx="16" cy="49" r="3" fill="#9b7bff" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="h-display text-xl leading-none sm:text-2xl">
        <span className="rainbow-text">Figure</span>
        <span className="text-ink">Compare</span>
      </span>
    </span>
  );
}
