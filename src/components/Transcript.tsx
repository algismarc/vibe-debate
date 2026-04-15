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
                    className={`transition-all duration-700 ${
                      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none h-0 overflow-hidden'
                    }`}
                  >
                    <div className={`flex ${isFor ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                        isFor
                          ? 'bg-purple-950/60 border border-purple-800/40 rounded-tl-sm'
                          : 'bg-green-950/60 border border-green-800/40 rounded-tr-sm'
                      }`}>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                          isFor ? 'text-purple-400' : 'text-green-400'
                        }`}>
                          {isFor ? 'FOR' : 'AGAINST'}
                        </p>
                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {turn.text}
                        </p>
                      </div>
                    </div>
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
