import { useEffect, useState } from 'react'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1100)
    const doneTimer = setTimeout(onDone, 1500)
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
        background: '#0f0f0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        zIndex: 9999,
        transition: 'opacity 0.4s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: 'none',
      }}
    >
      {/* Debaters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Debater side="left" delay={0} />
        <VsBadge />
        <Debater side="right" delay={0.15} />
      </div>

      {/* Title */}
      <h1
        className="animate-shimmer"
        style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          animation: 'splashTitle 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards, shimmer 3s linear infinite',
          opacity: 0,
          animationDelay: '0.25s, 0.25s',
        }}
      >
        Vibe Debate
      </h1>

      {/* Tagline */}
      <p
        style={{
          margin: 0,
          color: '#6b7280',
          fontSize: '0.85rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          opacity: 0,
          animation: 'splashFade 0.5s ease-out 0.45s forwards',
        }}
      >
        AI‑judged debates · real‑time
      </p>

      <style>{`
        @keyframes splashTitle {
          from { opacity: 0; transform: translateY(14px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes splashFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 0.65; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.5) translateY(10px); }
          60%  { transform: scale(1.15) translateY(-4px); }
          80%  { transform: scale(0.95) translateY(1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bubbleLeft {
          0%   { opacity: 0; transform: translateX(-18px) scale(0.8); }
          70%  { transform: translateX(4px) scale(1.05); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes bubbleRight {
          0%   { opacity: 0; transform: translateX(18px) scale(0.8); }
          70%  { transform: translateX(-4px) scale(1.05); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes vsFlash {
          0%   { opacity: 0; transform: scale(0.4) rotate(-15deg); }
          60%  { opacity: 1; transform: scale(1.25) rotate(6deg); }
          80%  { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  )
}

function Debater({ side, delay }: { side: 'left' | 'right'; delay: number }) {
  const isLeft = side === 'left'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: 0,
        animation: `${isLeft ? 'bubbleLeft' : 'bubbleRight'} 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}s forwards`,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: isLeft
            ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
            : 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: isLeft
            ? '0 0 24px rgba(168,85,247,0.45)'
            : '0 0 24px rgba(56,189,248,0.45)',
        }}
      >
        {isLeft ? '🎤' : '🎙️'}
      </div>
      {/* Speech bubble */}
      <div
        style={{
          background: isLeft ? 'rgba(168,85,247,0.15)' : 'rgba(56,189,248,0.15)',
          border: `1px solid ${isLeft ? 'rgba(168,85,247,0.35)' : 'rgba(56,189,248,0.35)'}`,
          borderRadius: 10,
          padding: '3px 10px',
          fontSize: '0.7rem',
          color: isLeft ? '#c084fc' : '#7dd3fc',
          letterSpacing: '0.04em',
        }}
      >
        {isLeft ? 'Pro' : 'Con'}
      </div>
    </div>
  )
}

function VsBadge() {
  return (
    <span
      style={{
        fontSize: '1.35rem',
        fontWeight: 900,
        color: '#f59e0b',
        textShadow: '0 0 12px rgba(245,158,11,0.6)',
        opacity: 0,
        animation: 'vsFlash 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.08s forwards',
        letterSpacing: '-0.02em',
      }}
    >
      VS
    </span>
  )
}
