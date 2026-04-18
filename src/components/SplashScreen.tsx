import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

const TOTAL_MS = 2800
const FADE_OUT_MS = 500

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), TOTAL_MS - FADE_OUT_MS)
    const doneTimer = setTimeout(onDone, TOTAL_MS)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--ink-00)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: 20,
      transition: `opacity ${FADE_OUT_MS}ms ease`,
      opacity: fading ? 0 : 1,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <Bust facing="right" delay={0.08} />
        <Bust facing="left" variant="helmeted" delay={0.22} />
      </div>

      <div style={{
        textAlign: 'center',
        animation: 'agora-fade-up 640ms var(--ease-standard) 0.4s backwards',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500,
          color: 'var(--marble-00)', letterSpacing: '-0.02em',
        }}>
          Agora
        </div>
        <div style={{
          marginTop: 10, fontFamily: 'var(--font-serif)', fontSize: 17,
          fontStyle: 'italic', color: 'var(--marble-20)', fontWeight: 400,
        }}>
          Where arguments are sharpened in the open.
        </div>
      </div>
    </div>
  )
}

function Bust({ facing, variant = 'bearded', delay = 0 }: {
  facing: 'left' | 'right'
  variant?: 'bearded' | 'helmeted'
  delay?: number
}) {
  return (
    <svg
      viewBox="0 0 160 200" width="120" height="150"
      style={{
        transform: facing === 'left' ? 'scaleX(-1)' : undefined,
        animation: `agora-splash-up 720ms var(--ease-standard) ${delay}s backwards`,
        display: 'block',
      }}
      fill="none" stroke="var(--claude-clay-light)"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="46" y="178" width="68" height="18" />
      <rect x="52" y="168" width="56" height="12" />
      <path d="M 30 170 Q 36 150 58 140 L 102 140 Q 124 150 130 170 Z" />
      <path d="M 66 140 Q 66 128 70 118 L 90 118 Q 94 128 94 140 Z" />
      <ellipse cx="80" cy="80" rx="32" ry="40" />
      <path d="M 108 78 Q 114 82 112 92 Q 108 94 106 90" />
      {variant === 'bearded' ? (
        <>
          <path d="M 50 56 Q 52 40 66 36 Q 80 30 96 36 Q 110 42 112 56 Q 114 48 108 44 Q 102 30 88 28 Q 72 26 62 34 Q 52 42 50 56 Z" />
          <path d="M 62 108 Q 58 128 70 138 Q 80 144 90 138 Q 102 128 98 108" />
        </>
      ) : (
        <>
          <path d="M 46 66 Q 44 38 66 30 Q 80 24 96 30 Q 116 38 114 66 Q 112 54 100 50 Q 80 42 60 50 Q 48 54 46 66 Z" />
          <path d="M 78 28 Q 80 20 82 28" />
          <path d="M 66 104 Q 64 120 74 126 Q 80 130 86 126 Q 96 120 94 104" />
        </>
      )}
      <path d="M 64 74 Q 72 70 80 72" />
      <path d="M 86 72 Q 94 70 100 74" />
      <circle cx="74" cy="84" r="1.3" fill="var(--claude-clay-light)" />
      <circle cx="94" cy="84" r="1.3" fill="var(--claude-clay-light)" />
      <path d="M 82 82 Q 82 94 78 102 Q 82 104 86 102" />
      <path d="M 74 108 Q 80 110 86 108" />
    </svg>
  )
}
