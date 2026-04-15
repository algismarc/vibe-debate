import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, Scores } from '../lib/types'
import Transcript from './Transcript'

interface Props {
  session: Session
}

export default function ResultsView({ session }: Props) {
  const navigate = useNavigate()
  const { judgment, debate_transcript, title, player_a, player_b } = session
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'results' | 'transcript'>('results')

  if (!judgment) return null

  const { scores, winner, summary } = judgment
  const winnerName = winner === 'for' ? player_a.name : winner === 'against' ? player_b?.name : null
  const winnerSide = winner === 'for' ? 'FOR' : winner === 'against' ? 'AGAINST' : null
  const winnerColor = winner === 'for' ? 'text-purple-400' : winner === 'against' ? 'text-green-400' : 'text-yellow-400'
  const winnerBorder = winner === 'for' ? 'border-purple-500/50' : winner === 'against' ? 'border-green-500/50' : 'border-yellow-500/50'

  function handleShare() {
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
      ``,
      `Scores:`,
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
    <main className="flex flex-col items-center min-h-svh p-4 pt-8 gap-6 max-w-2xl mx-auto w-full pb-12">
      {/* Topic */}
      <div className="text-center w-full">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Debate Topic</p>
        <h1 className="text-2xl font-bold text-white leading-snug">"{title}"</h1>
      </div>

      {/* Winner declaration */}
      <div className={`w-full bg-gray-900 border-2 ${winnerBorder} rounded-2xl p-6 text-center`}>
        {winner === 'tie' ? (
          <>
            <p className="text-4xl mb-2">🤝</p>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Result</p>
            <h2 className="text-3xl font-bold text-white">It's a Tie</h2>
          </>
        ) : (
          <>
            <p className="text-4xl mb-2">🏆</p>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${winnerColor}`}>
              Winner — {winnerSide}
            </p>
            <h2 className={`text-3xl font-bold ${winnerColor}`}>{winnerName}</h2>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="w-full flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {(['results', 'transcript'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'results' ? (
        <>
          {/* Scorecard */}
          <div className="w-full flex flex-col gap-3">
            <Scorecard
              forName={player_a.name}
              againstName={player_b?.name ?? 'Opponent'}
              forScores={scores.for}
              againstScores={scores.against}
              winner={winner}
            />
          </div>

          {/* Judge summary */}
          <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Judge's Ruling</p>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
        </>
      ) : (
        debate_transcript && <Transcript transcript={debate_transcript} visibleTurns={Infinity} />
      )}

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          {copied ? '✓ Copied to clipboard!' : '📋 Share Results'}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          New Debate →
        </button>
      </div>
    </main>
  )
}

const CRITERIA = [
  { key: 'argument', label: 'Argument' },
  { key: 'persuasiveness', label: 'Persuasion' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'rhetoric', label: 'Rhetoric' },
] as const

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
      {/* Header */}
      <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-widest border-b border-gray-800">
        <div className={`px-4 py-3 text-purple-400 ${winner === 'for' ? 'bg-purple-950/40' : ''}`}>
          {forName}
          <span className="ml-1.5 opacity-60">FOR</span>
        </div>
        <div className="px-4 py-3 text-gray-600 text-center">Criteria</div>
        <div className={`px-4 py-3 text-green-400 text-right ${winner === 'against' ? 'bg-green-950/40' : ''}`}>
          <span className="mr-1.5 opacity-60">AGAINST</span>
          {againstName}
        </div>
      </div>

      {/* Rows */}
      {CRITERIA.map(({ key, label }) => {
        const f = forScores[key]
        const a = againstScores[key]
        const forWins = f > a
        const againstWins = a > f
        return (
          <div key={key} className="grid grid-cols-3 border-b border-gray-800/60 last:border-0">
            <div className={`px-4 py-3 text-sm font-bold ${forWins ? 'text-purple-300' : 'text-gray-400'}`}>
              {f}<span className="text-gray-600 font-normal">/10</span>
            </div>
            <div className="px-4 py-3 text-gray-600 text-xs text-center self-center">{label}</div>
            <div className={`px-4 py-3 text-sm font-bold text-right ${againstWins ? 'text-green-300' : 'text-gray-400'}`}>
              {a}<span className="text-gray-600 font-normal">/10</span>
            </div>
          </div>
        )
      })}

      {/* Totals */}
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
