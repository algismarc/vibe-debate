import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, Judgment } from '../lib/types'
import { parseTranscript, countTurns } from '../lib/parseTranscript'
import Transcript from './Transcript'

const TURN_INTERVAL_MS = 5000
const VERDICT_DELAY_MS = 4000

const QUOTES = [
  { text: "The aim of argument should not be victory, but progress.", author: "Joseph Joubert" },
  { text: "He who knows only his own side of the case knows little of that.", author: "John Stuart Mill" },
  { text: "Wise men argue causes; fools decide them.", author: "Anacharsis" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Opinion is the medium between knowledge and ignorance.", author: "Plato" },
  { text: "Strong minds discuss ideas; average minds discuss events.", author: "attr. Socrates" },
  { text: "I know that I know nothing.", author: "Socrates" },
]

const PROGRESS_STEPS = [
  { ms: 300, pct: 9 }, { ms: 1200, pct: 18 }, { ms: 2500, pct: 28 },
  { ms: 4200, pct: 38 }, { ms: 6500, pct: 47 }, { ms: 9000, pct: 55 },
  { ms: 12000, pct: 62 }, { ms: 15500, pct: 68 }, { ms: 19000, pct: 73 },
  { ms: 23000, pct: 77 }, { ms: 27500, pct: 80 }, { ms: 32000, pct: 83 },
  { ms: 38000, pct: 86 }, { ms: 46000, pct: 88 }, { ms: 56000, pct: 91 },
]

interface Props {
  session: Session
}

export default function DebateReveal({ session }: Props) {
  const { debate_transcript, judgment, title, player_a, player_b } = session
  const rounds = debate_transcript ? parseTranscript(debate_transcript) : []
  const totalTurns = countTurns(rounds)

  const [visibleTurns, setVisibleTurns] = useState(debate_transcript ? 1 : 0)
  const [showVerdict, setShowVerdict] = useState(false)
  const verdictRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debate_transcript && visibleTurns === 0) setVisibleTurns(1)
  }, [debate_transcript])

  useEffect(() => {
    if (!debate_transcript || visibleTurns === 0 || visibleTurns >= totalTurns) return
    const id = setTimeout(() => setVisibleTurns(v => v + 1), TURN_INTERVAL_MS)
    return () => clearTimeout(id)
  }, [visibleTurns, debate_transcript, totalTurns])

  useEffect(() => {
    if (visibleTurns < totalTurns || totalTurns === 0) return
    if (!judgment || showVerdict) return
    const id = setTimeout(() => setShowVerdict(true), VERDICT_DELAY_MS)
    return () => clearTimeout(id)
  }, [visibleTurns, totalTurns, judgment, showVerdict])

  useEffect(() => {
    if (!showVerdict || !verdictRef.current) return
    setTimeout(() => verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }, [showVerdict])

  if (!debate_transcript) {
    return <DebatingLoader topic={title} code={session.join_code} />
  }

  const allTurnsVisible = visibleTurns >= totalTurns
  const waitingForJudgment = allTurnsVisible && !judgment
  const waitingForVerdict = allTurnsVisible && judgment && !showVerdict

  return (
    <div className="agora-stage">
      <nav className="agora-topnav">
        <span className="agora-brand">Vibeum Debatum</span>
        <div style={{ flex: 1 }} />
        <span className="agora-session-code"><span style={{ opacity: 0.5 }}>#</span>{session.join_code}</span>
      </nav>

      <main style={{
        flex: 1, width: '100%', maxWidth: 780, margin: '0 auto',
        padding: '28px 20px 120px', display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        {/* Topic + participants */}
        <div className="fade-up" style={{ textAlign: 'center' }}>
          <span className="agora-eyebrow">Topic</span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)',
            fontWeight: 500, fontStyle: 'italic', marginTop: 8, lineHeight: 1.25,
          }}>
            "{title}"
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="agora-chip agora-chip-laurel"><span className="dot" />{player_a.name} · FOR</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg4)', fontSize: 11 }}>vs.</span>
            <span className="agora-chip agora-chip-oxblood"><span className="dot" />{player_b?.name ?? 'Opponent'} · AGAINST</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

        {/* Transcript */}
        <Transcript transcript={debate_transcript} visibleTurns={visibleTurns} scrollToLatest />

        {/* Between-turn indicator */}
        {!allTurnsVisible && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', color: 'var(--fg3)', fontSize: 13, paddingTop: 8 }}>
            <span className="agora-pulse-dots"><span /><span /><span /></span>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13 }}>Next argument incoming…</span>
          </div>
        )}

        {/* Waiting for judgment */}
        {waitingForJudgment && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--gold)' }}>
            <span className="agora-dots"><span /><span /><span /></span>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15 }}>Deliberating…</span>
          </div>
        )}

        {/* Verdict incoming */}
        {waitingForVerdict && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--gold)' }}>
            <span className="agora-pulse-dots"><span /><span /><span /></span>
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15 }}>Verdict incoming…</span>
          </div>
        )}

        {/* Verdict */}
        {showVerdict && judgment && (
          <div ref={verdictRef} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 8 }}>
            <div className="agora-round-label" style={{ margin: '20px 0 4px' }}>Verdict</div>
            <ConsensusPanel
              judgment={judgment}
              forName={player_a.name}
              againstName={player_b?.name ?? 'Opponent'}
            />
            <Actions session={session} />
          </div>
        )}
      </main>
    </div>
  )
}

function ConsensusPanel({ judgment, forName, againstName }: {
  judgment: Judgment; forName: string; againstName: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Best-of grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="verdict-grid">
        <div className="agora-card" style={{ borderLeft: '3px solid var(--laurel)' }}>
          <span className="agora-eyebrow laurel">{forName} · FOR</span>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
            {judgment.for_highlights.map((point, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--fg1)', lineHeight: 1.55 }}>
                <span style={{ color: 'var(--laurel)', flexShrink: 0 }}>·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="agora-card" style={{ borderLeft: '3px solid var(--oxblood)' }}>
          <span className="agora-eyebrow oxblood">{againstName} · AGAINST</span>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
            {judgment.against_highlights.map((point, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--fg1)', lineHeight: 1.55 }}>
                <span style={{ color: 'var(--oxblood)', flexShrink: 0 }}>·</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Consensus */}
      <div className="agora-card-sunken" style={{ borderLeft: '2px solid var(--claude-clay)' }}>
        <span className="agora-eyebrow clay">Consensus</span>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--fg1)',
          lineHeight: 1.65, margin: '10px 0 0', fontStyle: 'italic',
        }}>
          {judgment.consensus}
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) { .verdict-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

function DebatingLoader({ topic, code }: { topic: string; code: string }) {
  const [progress, setProgress] = useState(0)
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [quoteKey, setQuoteKey] = useState(0)

  useEffect(() => {
    const ids = PROGRESS_STEPS.map(({ ms, pct }) => setTimeout(() => setProgress(pct), ms))
    return () => ids.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length)
      setQuoteKey(k => k + 1)
    }, 5500)
    return () => clearInterval(id)
  }, [])

  const q = QUOTES[quoteIdx]

  return (
    <div className="agora-stage">
      <nav className="agora-topnav">
        <span className="agora-brand">Vibeum Debatum</span>
        <div style={{ flex: 1 }} />
        <span className="agora-session-code"><span style={{ opacity: 0.5 }}>#</span>{code}</span>
      </nav>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}>
          <div className="fade-up" style={{ textAlign: 'center', maxWidth: 460 }}>
            <span className="agora-eyebrow">Topic</span>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: 'var(--fg1)', margin: '6px 0 0', lineHeight: 1.35, fontStyle: 'italic' }}>
              "{topic}"
            </p>
          </div>

          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', animationDelay: '100ms' }}>
            <span className="agora-dots"><span /><span /><span /></span>
            <h2 className="agora-display agora-display-sm" style={{ fontStyle: 'italic', textAlign: 'center' }}>
              Generating debate…
            </h2>
            <p style={{ color: 'var(--fg3)', fontSize: 14, margin: 0 }}>Usually ~30 seconds.</p>
          </div>

          <div className="fade-up" style={{ width: '100%', maxWidth: 360, animationDelay: '180ms' }}>
            <div className="agora-progress">
              <div className="agora-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--fg4)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Working</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{progress}%</span>
            </div>
          </div>

          <div key={quoteKey} className="fade-in" style={{ textAlign: 'center', maxWidth: 420, minHeight: 80 }}>
            <blockquote style={{
              fontFamily: 'var(--font-serif)', fontSize: 17, fontStyle: 'italic',
              color: 'var(--fg2)', margin: 0, borderLeft: '2px solid var(--claude-clay)',
              paddingLeft: 20, textAlign: 'left', lineHeight: 1.6,
            }}>
              "{q.text}"
            </blockquote>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg4)', marginTop: 8 }}>— {q.author}</div>
          </div>
        </div>
      </main>
    </div>
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
      `VibeDebate: "${title}"`,
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
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
      <button onClick={handleShare} className="agora-btn agora-btn-secondary">
        {copied ? '✓ Copied' : 'Share the transcript'}
      </button>
      <div style={{ flex: 1 }} />
      <button onClick={() => navigate('/')} className="agora-btn agora-btn-primary">
        New debate →
      </button>
    </div>
  )
}
