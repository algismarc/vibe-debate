import { useEffect, useState } from 'react'

interface Props {
  totalSeconds: number
  startedAt: number   // Unix ms timestamp when the timer began
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
      if (r <= 0 && !expired) {
        setExpired(true)
        onExpire()
      }
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
  const barColor = urgent ? 'bg-red-500' : pct > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
  const textColor = urgent ? 'text-red-400' : 'text-gray-300'

  if (expired) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-gray-800" />
        <span className="text-red-400 text-sm font-mono font-bold tabular-nums">Time's up</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-bold tabular-nums ${textColor}`}>
        {display}
      </span>
    </div>
  )
}

function calcRemaining(totalSeconds: number, startedAt: number): number {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  return Math.max(0, totalSeconds - elapsed)
}
