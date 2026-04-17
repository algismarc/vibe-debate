import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

const TOTAL_MS = 3000
const FADE_OUT_MS = 500

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), TOTAL_MS - FADE_OUT_MS)
    const doneTimer = setTimeout(onDone, TOTAL_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a1020',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        zIndex: 9999,
        transition: `opacity ${FADE_OUT_MS}ms ease`,
        opacity: fading ? 0 : 1,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '0.5rem',
          position: 'relative',
        }}
      >
        {/* Left bust (facing right, speaking first) */}
        <div style={{ position: 'relative', animation: 'statueIn 0.6s ease-out 0.05s backwards' }}>
          <SquigglyBubble side="left" delay={0.9} />
          <Bust facing="right" />
        </div>

        {/* Right bust (facing left, speaking back) */}
        <div style={{ position: 'relative', animation: 'statueIn 0.6s ease-out 0.2s backwards' }}>
          <SquigglyBubble side="right" delay={1.6} />
          <Bust facing="left" variant="helmeted" />
        </div>
      </div>

      <h1
        style={{
          margin: 0,
          fontFamily: "'GFS Heraklit', Georgia, serif",
          fontSize: '2.25rem',
          color: '#d4808a',
          letterSpacing: '-0.02em',
          opacity: 0,
          animation: 'splashFadeIn 0.5s ease-out 0.35s forwards',
        }}
      >
        Vibe Debate
      </h1>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statueIn {
          from { opacity: 0; transform: translateY(14px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bubblePop {
          0%   { opacity: 0; transform: scale(0.4) translateY(6px); }
          60%  { opacity: 1; transform: scale(1.1) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dotBlink {
          0%, 60%, 100% { opacity: 0.25; }
          30%           { opacity: 1; }
        }
        @keyframes squiggleDraw {
          from { stroke-dashoffset: 400; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

/* ─── Chat bubble with hand-drawn squiggly edge ───────────────── */
function SquigglyBubble({ side, delay }: { side: 'left' | 'right'; delay: number }) {
  const isLeft = side === 'left'
  return (
    <div
      style={{
        position: 'absolute',
        top: -38,
        [isLeft ? 'right' : 'left']: -22,
        width: 96,
        height: 54,
        opacity: 0,
        animation: `bubblePop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay}s forwards`,
      }}
    >
      <svg viewBox="0 0 120 70" width="100%" height="100%" style={{ overflow: 'visible' }}>
        {/* Squiggly bubble outline */}
        <path
          d={
            isLeft
              ? 'M 10 14 Q 8 6 18 5 Q 40 2 62 4 Q 88 3 108 8 Q 116 12 112 22 Q 115 32 109 42 Q 110 52 100 52 Q 78 56 52 54 L 44 64 L 40 52 Q 22 52 14 48 Q 4 44 8 34 Q 3 24 10 14 Z'
              : 'M 12 14 Q 8 6 20 5 Q 42 2 68 4 Q 94 3 110 8 Q 118 12 114 22 Q 117 32 111 42 Q 112 52 100 52 Q 78 56 60 54 L 76 64 L 78 52 Q 62 52 52 52 Q 18 54 10 46 Q 2 38 8 28 Q 4 18 12 14 Z'
          }
          fill="#141230"
          stroke="#d4a0aa"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: 400,
            animation: `squiggleDraw 0.6s ease-out ${delay}s backwards`,
          }}
        />
        {/* Three dots */}
        {[0, 1, 2].map(i => (
          <circle
            key={i}
            cx={38 + i * 22}
            cy={28}
            r="4"
            fill="#d4a0aa"
            style={{
              animation: `dotBlink 1.2s ease-in-out ${delay + 0.3 + i * 0.15}s infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

/* ─── Line-art Greek bust ─────────────────────────────────────── */
function Bust({
  facing,
  variant = 'bearded',
}: {
  facing: 'left' | 'right'
  variant?: 'bearded' | 'helmeted'
}) {
  return (
    <svg
      viewBox="0 0 160 200"
      width="130"
      height="162"
      style={{
        transform: facing === 'left' ? 'scaleX(-1)' : undefined,
        display: 'block',
      }}
    >
      <defs>
        <linearGradient id={`stone-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a0aa" />
          <stop offset="100%" stopColor="#b07888" />
        </linearGradient>
      </defs>

      {/* Pedestal */}
      <rect x="46" y="178" width="68" height="18" fill={`url(#stone-${variant})`} stroke="#7a3850" strokeWidth="1.5" />
      <rect x="52" y="168" width="56" height="12" fill={`url(#stone-${variant})`} stroke="#7a3850" strokeWidth="1.5" />

      {/* Shoulders / drapery */}
      <path
        d="M 30 170 Q 36 150 58 140 L 102 140 Q 124 150 130 170 Z"
        fill={`url(#stone-${variant})`}
        stroke="#7a3850"
        strokeWidth="1.5"
      />
      <path d="M 56 150 Q 80 162 104 150" stroke="#7a3850" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Neck */}
      <path
        d="M 66 140 Q 66 128 70 118 L 90 118 Q 94 128 94 140 Z"
        fill={`url(#stone-${variant})`}
        stroke="#7a3850"
        strokeWidth="1.5"
      />

      {/* Head */}
      <ellipse cx="80" cy="80" rx="32" ry="40" fill={`url(#stone-${variant})`} stroke="#7a3850" strokeWidth="1.8" />

      {/* Ear (on visible side) */}
      <path d="M 108 78 Q 114 82 112 92 Q 108 94 106 90" fill="none" stroke="#7a3850" strokeWidth="1.3" />

      {/* Hair waves — different per variant */}
      {variant === 'bearded' ? (
        <>
          {/* Bearded philosopher hair */}
          <path
            d="M 50 56 Q 52 40 66 36 Q 80 30 96 36 Q 110 42 112 56 Q 114 48 108 44 Q 102 30 88 28 Q 72 26 62 34 Q 52 42 50 56 Z"
            fill={`url(#stone-${variant})`}
            stroke="#7a3850"
            strokeWidth="1.5"
          />
          <path d="M 56 52 Q 62 46 70 48" fill="none" stroke="#7a3850" strokeWidth="1" />
          <path d="M 72 44 Q 80 40 88 44" fill="none" stroke="#7a3850" strokeWidth="1" />
          <path d="M 92 46 Q 100 46 106 52" fill="none" stroke="#7a3850" strokeWidth="1" />
          {/* Beard */}
          <path
            d="M 62 108 Q 58 128 70 138 Q 80 144 90 138 Q 102 128 98 108 Q 94 118 80 120 Q 66 118 62 108 Z"
            fill={`url(#stone-${variant})`}
            stroke="#7a3850"
            strokeWidth="1.5"
          />
          <path d="M 66 118 Q 72 128 78 128" fill="none" stroke="#7a3850" strokeWidth="0.9" />
          <path d="M 82 130 Q 88 130 94 120" fill="none" stroke="#7a3850" strokeWidth="0.9" />
          <path d="M 72 122 Q 78 134 82 122" fill="none" stroke="#7a3850" strokeWidth="0.9" />
        </>
      ) : (
        <>
          {/* Helmet / crested cap */}
          <path
            d="M 46 66 Q 44 38 66 30 Q 80 24 96 30 Q 116 38 114 66 Q 112 54 100 50 Q 80 42 60 50 Q 48 54 46 66 Z"
            fill={`url(#stone-${variant})`}
            stroke="#7a3850"
            strokeWidth="1.8"
          />
          {/* Helmet ridge */}
          <path d="M 60 48 Q 80 36 100 48" fill="none" stroke="#7a3850" strokeWidth="1.4" />
          {/* Small crest notch */}
          <path d="M 78 28 Q 80 22 82 28" fill="none" stroke="#7a3850" strokeWidth="1.2" />
          {/* Short beard */}
          <path
            d="M 66 104 Q 64 120 74 126 Q 80 130 86 126 Q 96 120 94 104 Q 88 114 80 114 Q 72 114 66 104 Z"
            fill={`url(#stone-${variant})`}
            stroke="#7a3850"
            strokeWidth="1.4"
          />
          <path d="M 72 112 Q 78 120 80 116" fill="none" stroke="#7a3850" strokeWidth="0.9" />
          <path d="M 82 116 Q 84 120 88 112" fill="none" stroke="#7a3850" strokeWidth="0.9" />
        </>
      )}

      {/* Brow */}
      <path d="M 64 74 Q 72 70 80 72" fill="none" stroke="#7a3850" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 86 72 Q 94 70 100 74" fill="none" stroke="#7a3850" strokeWidth="1.4" strokeLinecap="round" />
      {/* Eye (single visible, three-quarter view) */}
      <path d="M 68 84 Q 74 80 82 84 Q 74 86 68 84 Z" fill="#7a3850" />
      <path d="M 88 84 Q 94 80 100 84 Q 94 86 88 84 Z" fill="#7a3850" />
      {/* Nose */}
      <path d="M 82 82 Q 82 94 78 102 Q 82 104 86 102" fill="none" stroke="#7a3850" strokeWidth="1.3" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M 74 108 Q 80 110 86 108" fill="none" stroke="#7a3850" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
