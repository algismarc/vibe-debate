import { useEffect, useRef } from 'react'
import { parseTranscript } from '../lib/parseTranscript'

interface Props {
  transcript: string
  visibleTurns: number   // how many turns to show; Infinity = all
  scrollToLatest?: boolean
}

export default function Transcript({ transcript, visibleTurns, scrollToLatest }: Props) {
  const rounds = parseTranscript(transcript)
  const latestRef = useRef<HTMLDivElement>(null)

  // Scroll to the latest turn whenever visibleTurns increases
  useEffect(() => {
    if (!scrollToLatest || !latestRef.current) return
    latestRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [visibleTurns, scrollToLatest])

  let turnIndex = 0
  let latestVisibleIndex = -1

  // Figure out which is the last currently-visible turn
  rounds.forEach(round => {
    round.turns.forEach(() => {
      if (turnIndex < visibleTurns) latestVisibleIndex = turnIndex
      turnIndex++
    })
  })

  turnIndex = 0

  return (
    <div className="w-full flex flex-col gap-8">
      {rounds.map((round, ri) => {
        const firstTurnInRound = turnIndex
        const anyVisible = round.turns.some((_, ti) => firstTurnInRound + ti < visibleTurns)
        if (!anyVisible) { turnIndex += round.turns.length; return null }

        return (
          <section key={ri}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">
              {round.title}
            </h2>
            <div className="flex flex-col gap-3">
              {round.turns.map((turn, ti) => {
                const idx = turnIndex++
                const visible = idx < visibleTurns
                const isLatest = idx === latestVisibleIndex
                const isFor = turn.side === 'for'

                return (
                  <div
                    key={ti}
                    ref={isLatest ? latestRef : undefined}
                    className={visible ? '' : 'h-0 overflow-hidden pointer-events-none'}
                  >
                    {visible && (
                      <div className={`flex ${isFor ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[85%] paint-bubble ${
                            isFor
                              ? 'paint-bubble-light slide-from-left'
                              : 'paint-bubble-dark slide-from-right'
                          }`}
                        >
                          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                            isFor ? 'text-gray-900/70' : 'text-gray-500'
                          }`}>
                            {isFor ? 'FOR' : 'AGAINST'}
                          </p>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            isFor ? 'text-gray-900' : 'text-gray-200'
                          }`}>
                            {turn.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
