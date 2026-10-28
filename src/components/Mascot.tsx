// Kira, FigureCompare's mascot: an original round mochi with cat ears holding a
// price tag. Drawn here so the site never borrows a real character.
export function Mascot({ size = 140, className = "", mood = "happy" }: { size?: number; className?: string; mood?: "happy" | "wow" | "sleepy" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className={className} role="img" aria-label="Kira, the FigureCompare mascot">
      <defs>
        <radialGradient id="kb" cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#ffe3f0" />
          <stop offset="1" stopColor="#ffc2dd" />
        </radialGradient>
      </defs>
      {/* ears */}
      <path d="M38 52 L46 18 L70 42 Z" fill="#ffc2dd" stroke="#3b2350" strokeWidth="4" strokeLinejoin="round" />
      <path d="M122 52 L114 18 L90 42 Z" fill="#ffc2dd" stroke="#3b2350" strokeWidth="4" strokeLinejoin="round" />
      <path d="M46 44 L49 28 L60 40 Z" fill="#ff8fc0" />
      <path d="M114 44 L111 28 L100 40 Z" fill="#ff8fc0" />
      {/* body */}
      <ellipse cx="80" cy="92" rx="58" ry="52" fill="url(#kb)" stroke="#3b2350" strokeWidth="4" />
      {/* eyes */}
      {mood === "sleepy" ? (
        <>
          <path d="M54 88 q8 6 16 0" stroke="#3b2350" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M90 88 q8 6 16 0" stroke="#3b2350" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <g className="origin-center motion-safe:animate-blink" style={{ transformOrigin: "80px 86px" }}>
          <ellipse cx="62" cy="86" rx="8" ry={mood === "wow" ? 11 : 10} fill="#3b2350" />
          <ellipse cx="98" cy="86" rx="8" ry={mood === "wow" ? 11 : 10} fill="#3b2350" />
          <circle cx="65" cy="82" r="3" fill="#fff" />
          <circle cx="101" cy="82" r="3" fill="#fff" />
          <circle cx="59" cy="90" r="1.6" fill="#fff" />
          <circle cx="95" cy="90" r="1.6" fill="#fff" />
        </g>
      )}
      {/* blush + mouth */}
      <ellipse cx="48" cy="102" rx="9" ry="5" fill="#ff8fc0" opacity=".7" />
      <ellipse cx="112" cy="102" rx="9" ry="5" fill="#ff8fc0" opacity=".7" />
      {mood === "wow" ? (
        <ellipse cx="80" cy="104" rx="6" ry="7" fill="#3b2350" />
      ) : (
        <path d="M72 101 q4 5 8 0 q4 5 8 0" stroke="#3b2350" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      {/* price tag */}
      <g transform="rotate(-14 132 120)">
        <path d="M112 108 h34 a6 6 0 0 1 6 6 v18 a6 6 0 0 1 -6 6 h-34 l-10 -15 z" fill="#ffd54a" stroke="#3b2350" strokeWidth="3.5" strokeLinejoin="round" />
        <circle cx="111" cy="123" r="3" fill="#3b2350" />
        <text x="132" y="129" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="15" fill="#3b2350">
          ¥$£
        </text>
      </g>
      {/* sparkle */}
      <path d="M140 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#9b7bff" className="motion-safe:animate-twinkle" style={{ transformOrigin: "140px 41px" }} />
    </svg>
  );
}
