import { useEffect, useState } from 'react'

interface Props {
  transcript: string
  animate?: boolean
}

interface Turn {
  side: 'for' | 'against'
  text: string
}

interface Round {
  title: string
  turns: Turn[]
}

function parseTranscript(raw: string): Round[] {
  const rounds: Round[] = []
  const roundBlocks = raw.split(/^## /m).filter(Boolean)

  for (const block of roundBlocks) {
    const lines = block.trim().split('\n')
    const title = lines[0].trim()
    const body = lines.slice(1).join('\n')

    const turns: Turn[] = []
    const forMatch = body.match(/\*\*FOR:\*\*\s*([\s\S]*?)(?=\*\*AGAINST:\*\*|$)/)
    const againstMatch = body.match(/\*\*AGAINST:\*\*\s*([\s\S]*?)$/)

    if (forMatch) turns.push({ side: 'for', text: forMatch[1].trim() })
    if (againstMatch) turns.push({ side: 'against', text: againstMatch[1].trim() })

    if (turns.length > 0) rounds.push({ title, turns })
  }

  return rounds
}

export default function Transcript({ transcript, animate = false }: Props) {
  const rounds = parseTranscript(transcript)
  const [visibleTurns, setVisibleTurns] = useState(animate ? 0 : Infinity)

  // Reveal turns one by one if animating
  useEffect(() => {
    if (!animate) return
    const totalTurns = rounds.reduce((n, r) => n + r.turns.length, 0)
    if (visibleTurns >= totalTurns) return

    const id = setTimeout(() => setVisibleTurns(v => v + 1), 600)
    return () => clearTimeout(id)
  }, [visibleTurns, animate, rounds])

  let turnIndex = 0

  return (
    <div className="w-full flex flex-col gap-8">
      {rounds.map((round, ri) => (
        <section key={ri}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">
            {round.title}
          </h2>
          <div className="flex flex-col gap-3">
            {round.turns.map((turn, ti) => {
              const idx = turnIndex++
              const visible = idx < visibleTurns
              const isFor = turn.side === 'for'

              return (
                <div
                  key={ti}
                  className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
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
      ))}
    </div>
  )
}
