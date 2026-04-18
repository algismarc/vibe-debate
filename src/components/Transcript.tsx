import { useEffect, useRef } from 'react'
import { parseTranscript } from '../lib/parseTranscript'

interface Props {
  transcript: string
  visibleTurns: number
  scrollToLatest?: boolean
}

export default function Transcript({ transcript, visibleTurns, scrollToLatest }: Props) {
  const rounds = parseTranscript(transcript)
  const latestRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollToLatest || !latestRef.current) return
    latestRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [visibleTurns, scrollToLatest])

  let turnIndex = 0
  let latestVisibleIndex = -1
  rounds.forEach(round => {
    round.turns.forEach(() => {
      if (turnIndex < visibleTurns) latestVisibleIndex = turnIndex
      turnIndex++
    })
  })
  turnIndex = 0

  return (
    <div className="agora-thread">
      {rounds.map((round, ri) => {
        const firstTurnInRound = turnIndex
        const anyVisible = round.turns.some((_, ti) => firstTurnInRound + ti < visibleTurns)
        if (!anyVisible) { turnIndex += round.turns.length; return null }

        return (
          <section key={ri} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="agora-round-label">{round.title}</div>
            {round.turns.map((turn, ti) => {
              const idx = turnIndex++
              const visible = idx < visibleTurns
              const isLatest = idx === latestVisibleIndex
              const isFor = turn.side === 'for'
              if (!visible) return null
              return (
                <div
                  key={ti}
                  ref={isLatest ? latestRef : undefined}
                  className={`agora-turn-row ${isFor ? 'for' : 'against'}`}
                >
                  <div className="agora-avatar" style={{ width: 34, height: 34, fontSize: 14, flexShrink: 0 }}>
                    {isFor ? 'F' : 'A'}
                  </div>
                  <div className={`agora-turn-bubble ${isFor ? 'for slide-left' : 'against slide-right'}`}>
                    <div className={`agora-turn-meta ${isFor ? 'for' : 'against'}`}>
                      <span>{isFor ? 'FOR' : 'AGAINST'}</span>
                    </div>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{turn.text}</p>
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
