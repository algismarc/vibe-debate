import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, Scores } from '../lib/types'
import { parseTranscript, countTurns } from '../lib/parseTranscript'
import Transcript from './Transcript'

const TURN_INTERVAL_MS = 5000   // 5 seconds between each turn
const VERDICT_DELAY_MS = 4000   // 4 seconds after last turn before showing verdict

interface Props {
  session: Session
}

export default function DebateReveal({ session }: Props) {
  const { debate_transcript, judgment, title, player_a, player_b } = session
  const rounds = debate_transcript ? parseTranscript(debate_transcript) : []
  const totalTurns = countTurns(rounds)

  // Start at 1 so the first turn appears immediately when transcript arrives
  const [visibleTurns, setVisibleTurns] = useState(debate_transcript ? 1 : 0)
  const [showVerdict, setShowVerdict] = useState(false)
  const verdictRef = useRef<HTMLDivElement>(null)

  // When transcript first arrives (was null, now set), show first turn
  useEffect(() => {
    if (debate_transcript && visibleTurns === 0) setVisibleTurns(1)
  }, [debate_transcript])

  // Reveal one turn every TURN_INTERVAL_MS
  useEffect(() => {
    if (!debate_transcript || visibleTurns === 0 || visibleTurns >= totalTurns) return
    const id = setTimeout(() => setVisibleTurns(v => v + 1), TURN_INTERVAL_MS)
    return () => clearTimeout(id)
  }, [visibleTurns, debate_transcript, totalTurns])

  // After all turns revealed + judgment ready, wait then show verdict
  useEffect(() => {
    if (visibleTurns < totalTurns || totalTurns === 0) return
    if (!judgment || showVerdict) return
    const id = setTimeout(() => setShowVerdict(true), VERDICT_DELAY_MS)
    return () => clearTimeout(id)
  }, [visibleTurns, totalTurns, judgment, showVerdict])

  // Scroll verdict into view when it appears
  useEffect(() => {
    if (!showVerdict || !verdictRef.current) return
    setTimeout(() => {
      verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [showVerdict])

  // No transcript yet — debate is still being generated
  if (!debate_transcript) {
    return (
      <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-4">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-gray-400 font-medium">AI debaters are arguing...</p>
        <p className="text-gray-600 text-sm">This usually takes about 30 seconds</p>
      </main>
    )
  }

  const allTurnsVisible = visibleTurns >= totalTurns
  const waitingForJudgment = allTurnsVisible && !judgment
  const waitingForVerdict = allTurnsVisible && judgment && !showVerdict

  return (
    <main className="flex flex-col items-center p-4 pt-8 pb-24 gap-8 max-w-2xl mx-auto w-full">
      {/* Topic */}
      <div className="text-center w-full">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Debate Topic</p>
        <h1 className="text-2xl font-bold text-white leading-snug">"{title}"</h1>
      </div>

      {/* Transcript */}
      <Transcript
        transcript={debate_transcript}
        visibleTurns={visibleTurns}
        scrollToLatest
      />

      {/* Between-turn indicator */}
      {!allTurnsVisible && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </span>
          <span>Next argument incoming...</span>
        </div>
      )}

      {/* All turns done, waiting for judgment from server */}
      {waitingForJudgment && (
        <div className="flex items-center gap-3 text-yellow-500 text-sm">
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-yellow-600 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
          <span>Judge is deliberating...</span>
        </div>
      )}

      {/* All turns done, judgment ready, counting down to reveal */}
      {waitingForVerdict && (
        <div className="flex items-center gap-3 text-yellow-500/70 text-sm">
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-yellow-700 animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </span>
          <span>Verdict incoming...</span>
        </div>
      )}

      {/* Verdict — fades in below the transcript */}
      {showVerdict && judgment && (
        <div
          ref={verdictRef}
          className="w-full flex flex-col gap-5 animate-fadeIn"
        >
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs uppercase tracking-widest">Judge's Verdict</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <WinnerCard
            winner={judgment.winner}
            forName={player_a.name}
            againstName={player_b?.name ?? 'Opponent'}
          />

          <Scorecard
            forName={player_a.name}
            againstName={player_b?.name ?? 'Opponent'}
            forScores={judgment.scores.for}
            againstScores={judgment.scores.against}
            winner={judgment.winner}
          />

          <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Ruling</p>
            <p className="text-gray-300 text-sm leading-relaxed">{judgment.summary}</p>
          </div>

          <Actions session={session} />
        </div>
      )}
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WinnerCard({
  winner,
  forName,
  againstName,
}: {
  winner: 'for' | 'against' | 'tie'
  forName: string
  againstName: string
}) {
  const isTie = winner === 'tie'
  const winnerName = winner === 'for' ? forName : winner === 'against' ? againstName : null
  const winnerSide = winner === 'for' ? 'FOR' : winner === 'against' ? 'AGAINST' : null
  const color = isTie ? 'text-yellow-400' : winner === 'for' ? 'text-purple-400' : 'text-green-400'
  const border = isTie ? 'border-yellow-500/40' : winner === 'for' ? 'border-purple-500/40' : 'border-green-500/40'

  return (
    <div className={`w-full bg-gray-900 border-2 ${border} rounded-2xl p-6 text-center`}>
      <p className="text-3xl mb-2">{isTie ? '🤝' : '🏆'}</p>
      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${color}`}>
        {isTie ? 'Result' : `Winner — ${winnerSide}`}
      </p>
      <h2 className={`text-3xl font-bold ${color}`}>
        {isTie ? "It's a Tie" : winnerName}
      </h2>
    </div>
  )
}

const CRITERIA = [
  { key: 'argument' as const, label: 'Argument' },
  { key: 'persuasiveness' as const, label: 'Persuasion' },
  { key: 'evidence' as const, label: 'Evidence' },
  { key: 'rhetoric' as const, label: 'Rhetoric' },
]

function Scorecard({
  forName,
  againstName,
  forScores,
  againstScores,
  winner,
}: {
  forName: string
  againstName: string
  forScores: Scores
  againstScores: Scores
  winner: 'for' | 'against' | 'tie'
}) {
  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-widest border-b border-gray-800">
        <div className={`px-3 py-3 text-purple-400 min-w-0 ${winner === 'for' ? 'bg-purple-950/40' : ''}`}>
          <span className="block truncate">{forName}</span>
          <span className="opacity-50">FOR</span>
        </div>
        <div className="px-2 py-3 text-gray-600 text-center">vs</div>
        <div className={`px-3 py-3 text-green-400 text-right min-w-0 ${winner === 'against' ? 'bg-green-950/40' : ''}`}>
          <span className="block truncate">{againstName}</span>
          <span className="opacity-50">AGAINST</span>
        </div>
      </div>

      {CRITERIA.map(({ key, label }) => {
        const f = forScores[key]
        const a = againstScores[key]
        return (
          <div key={key} className="grid grid-cols-3 border-b border-gray-800/60 last:border-0">
            <div className={`px-4 py-3 text-sm font-bold ${f > a ? 'text-purple-300' : 'text-gray-400'}`}>
              {f}<span className="text-gray-600 font-normal">/10</span>
            </div>
            <div className="px-4 py-3 text-gray-600 text-xs text-center self-center">{label}</div>
            <div className={`px-4 py-3 text-sm font-bold text-right ${a > f ? 'text-green-300' : 'text-gray-400'}`}>
              {a}<span className="text-gray-600 font-normal">/10</span>
            </div>
          </div>
        )
      })}

      <div className="grid grid-cols-3 border-t-2 border-gray-700 bg-gray-800/40">
        <div className={`px-4 py-3 text-lg font-bold ${winner === 'for' ? 'text-purple-300' : 'text-gray-300'}`}>
          {forScores.total}<span className="text-gray-600 text-sm font-normal">/40</span>
        </div>
        <div className="px-4 py-3 text-gray-600 text-xs text-center self-center uppercase tracking-widest">Total</div>
        <div className={`px-4 py-3 text-lg font-bold text-right ${winner === 'against' ? 'text-green-300' : 'text-gray-300'}`}>
          {againstScores.total}<span className="text-gray-600 text-sm font-normal">/40</span>
        </div>
      </div>
    </div>
  )
}

function Actions({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const { judgment, title, player_a, player_b } = session

  function handleShare() {
    if (!judgment) return
    const { scores, winner, summary } = judgment
    const forName = player_a.name
    const againstName = player_b?.name ?? 'Opponent'
    const winnerLabel = winner === 'tie'
      ? "It's a tie!"
      : `${winner === 'for' ? forName : againstName} wins (${winner.toUpperCase()})`

    const text = [
      `⚡ Vibe Debate: "${title}"`,
      ``,
      `${forName} (FOR) vs ${againstName} (AGAINST)`,
      ``,
      `🏆 ${winnerLabel}`,
      `  ${forName}: ${scores.for.total}/40`,
      `  ${againstName}: ${scores.against.total}/40`,
      ``,
      summary,
    ].join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleShare}
        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
      >
        {copied ? '✓ Copied!' : '📋 Share Results'}
      </button>
      <button
        onClick={() => navigate('/')}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
      >
        New Debate →
      </button>
    </div>
  )
}
