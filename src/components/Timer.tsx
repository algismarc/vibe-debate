import { useEffect, useState } from 'react'

interface Props {
  totalSeconds: number
  startedAt: number
  onExpire: () => void
}

export default function Timer({ totalSeconds, startedAt, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => calcRemaining(totalSeconds, startedAt))
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (expired) return
    const tick = () => {
      const r = calcRemaining(totalSeconds, startedAt)
      setRemaining(r)
      if (r <= 0 && !expired) { setExpired(true); onExpire() }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [totalSeconds, startedAt, expired])

  const pct = Math.max(0, remaining / totalSeconds)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${mins}:${String(secs).padStart(2, '0')}`
  const urgent = remaining <= 30 && remaining > 0

  if (expired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="agora-progress" style={{ flex: 1 }}>
          <div className="agora-progress-fill" style={{ width: 0 }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--oxblood)', fontWeight: 500 }}>Time's up</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="agora-progress" style={{ flex: 1 }}>
        <div className={`agora-progress-fill${urgent ? ' urgent' : ''}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
        color: urgent ? 'var(--oxblood)' : 'var(--fg2)',
        minWidth: '3.5ch', textAlign: 'right',
      }}>
        {display}
      </span>
    </div>
  )
}

function calcRemaining(totalSeconds: number, startedAt: number): number {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  return Math.max(0, totalSeconds - elapsed)
}
