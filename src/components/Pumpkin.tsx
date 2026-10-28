// A small pumpkin beside the logo, drawn only while html[data-season="halloween"] is set (src/lib/season.ts).
export function Pumpkin({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="season-halloween shrink-0">
      <path d="M16 9c0-3 1.5-5 4-6" fill="none" stroke="#3f7d2c" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="10" cy="19" rx="7" ry="9" fill="#e8761c" />
      <ellipse cx="22" cy="19" rx="7" ry="9" fill="#e8761c" />
      <ellipse cx="16" cy="19" rx="7" ry="10" fill="#f68b2c" />
      <path d="M11 17l2.5-2.5L16 17zm5 0l2.5-2.5L21 17zm-5.5 4.5c2 3 9 3 11 0l-2 1-1.5-1-2 1.5-2-1.5-1.5 1z" fill="#2a160a" />
    </svg>
  );
}
