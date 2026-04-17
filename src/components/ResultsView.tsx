import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '../lib/types'
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

  const { for_highlights, against_highlights, consensus } = judgment
  const forName = player_a.name
  const againstName = player_b?.name ?? 'Opponent'

  function handleShare() {
    const text = [
      `⚡ Vibe Debate: "${title}"`,
      ``,
      `${forName} (FOR) vs ${againstName} (AGAINST)`,
      ``,
      `🟣 Best from ${forName}:`,
      ...for_highlights.map(p => `  • ${p}`),
      ``,
      `🟢 Best from ${againstName}:`,
      ...against_highlights.map(p => `  • ${p}`),
      ``,
      `🤝 Consensus: ${consensus}`,
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
          {/* Best arguments */}
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">
                {forName} · FOR
              </p>
              <ul className="flex flex-col gap-2">
                {for_highlights.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300 leading-snug">
                    <span className="text-purple-500 mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">
                {againstName} · AGAINST
              </p>
              <ul className="flex flex-col gap-2">
                {against_highlights.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300 leading-snug">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Consensus */}
          <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤝</span>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Consensus</p>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{consensus}</p>
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
