import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, Judgment } from '../lib/types'
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
    return <DebatingLoader />
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
            <span className="text-gray-600 text-xs uppercase tracking-widest">Verdict</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <ConsensusPanel
            judgment={judgment}
            forName={player_a.name}
            againstName={player_b?.name ?? 'Opponent'}
          />

          <Actions session={session} />
        </div>
      )}
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConsensusPanel({
  judgment,
  forName,
  againstName,
}: {
  judgment: Judgment
  forName: string
  againstName: string
}) {
  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* Best arguments — side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* FOR highlights */}
        <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">
            {forName} · FOR
          </p>
          <ul className="flex flex-col gap-2">
            {judgment.for_highlights.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-snug">
                <span className="text-purple-500 mt-0.5 shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* AGAINST highlights */}
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">
            {againstName} · AGAINST
          </p>
          <ul className="flex flex-col gap-2">
            {judgment.against_highlights.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300 leading-snug">
                <span className="text-green-500 mt-0.5 shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Consensus */}
      <div
        className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-5 animate-fadeIn"
        style={{ animationDelay: '0.3s', opacity: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Consensus</p>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed">{judgment.consensus}</p>
      </div>
    </div>
  )
}

// ─── Debating loader ─────────────────────────────────────────────────────────

const QUOTES = [
  { text: "The aim of argument, or of discussion, should not be victory, but progress.", author: "Joseph Joubert" },
  { text: "He who knows only his own side of the case knows little of that.", author: "John Stuart Mill" },
  { text: "Discussion is an exchange of knowledge; argument is merely an exchange of ignorance.", author: "Robert Quillen" },
  { text: "In a heated argument, we are apt to lose sight of the truth.", author: "Publilius Syrus" },
  { text: "If you can't answer a man's argument, all is not lost; you can still call him vile names.", author: "Elbert Hubbard" },
  { text: "Wise men argue causes; fools decide them.", author: "Anacharsis" },
  { text: "I never learned anything while I was talking.", author: "Larry King" },
  { text: "Strong minds discuss ideas, average minds discuss events, weak minds discuss people.", author: "Socrates" },
  { text: "It usually takes more than three weeks to prepare a good impromptu speech.", author: "Mark Twain" },
  { text: "The most courageous act is still to think for yourself. Aloud.", author: "Coco Chanel" },
]

// Organic progress: fast burst early, slows as it creeps toward ~91%
const PROGRESS_STEPS = [
  { ms: 300,   pct: 9  },
  { ms: 1200,  pct: 18 },
  { ms: 2500,  pct: 28 },
  { ms: 4200,  pct: 38 },
  { ms: 6500,  pct: 47 },
  { ms: 9000,  pct: 55 },
  { ms: 12000, pct: 62 },
  { ms: 15500, pct: 68 },
  { ms: 19000, pct: 73 },
  { ms: 23000, pct: 77 },
  { ms: 27500, pct: 80 },
  { ms: 32000, pct: 83 },
  { ms: 38000, pct: 86 },
  { ms: 46000, pct: 88 },
  { ms: 56000, pct: 91 },
]

function DebatingLoader() {
  const [progress, setProgress] = useState(0)
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [quoteKey, setQuoteKey] = useState(0)

  // Organic fake progress
  useEffect(() => {
    const ids = PROGRESS_STEPS.map(({ ms, pct }) =>
      setTimeout(() => setProgress(pct), ms)
    )
    return () => ids.forEach(clearTimeout)
  }, [])

  // Cycle quotes every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length)
      setQuoteKey(k => k + 1)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const quote = QUOTES[quoteIdx]

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-8">
      {/* Status */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-gray-300 font-semibold">AI debaters are arguing...</p>
        <p className="text-gray-600 text-sm">This usually takes about 30 seconds</p>
      </div>

      {/* Organic loading bar */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-700 via-purple-400 to-fuchsia-400 transition-all ease-out"
            style={{
              width: `${progress}%`,
              transitionDuration: progress < 30 ? '800ms' : progress < 65 ? '1400ms' : '2200ms',
            }}
          />
        </div>
        <p className="text-gray-700 text-xs text-right tabular-nums">{progress}%</p>
      </div>

      {/* Cycling quote */}
      <div className="w-full max-w-sm min-h-[80px] flex flex-col items-center justify-center text-center px-2">
        <div key={quoteKey} className="animate-fadeIn flex flex-col gap-2">
          <p className="text-gray-400 text-sm italic leading-relaxed">"{quote.text}"</p>
          <p className="text-gray-600 text-xs">— {quote.author}</p>
        </div>
      </div>
    </main>
  )
}

function Actions({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const { judgment, title, player_a, player_b } = session

  function handleShare() {
    if (!judgment) return
    const { for_highlights, against_highlights, consensus } = judgment
    const forName = player_a.name
    const againstName = player_b?.name ?? 'Opponent'

    const text = [
      `Vibe Debate: "${title}"`,
      ``,
      `${forName} (FOR) vs ${againstName} (AGAINST)`,
      ``,
      `Best from ${forName}:`,
      ...for_highlights.map(p => `  - ${p}`),
      ``,
      `Best from ${againstName}:`,
      ...against_highlights.map(p => `  - ${p}`),
      ``,
      `Consensus: ${consensus}`,
    ].join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleShare}
        className="w-full bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 text-white font-semibold rounded-xl px-6 py-3 transition-all"
      >
        {copied ? 'Copied!' : 'Share Results'}
      </button>
      <button
        onClick={() => navigate('/')}
        className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold rounded-xl px-6 py-3 transition-all"
      >
        New Debate
      </button>
    </div>
  )
}
