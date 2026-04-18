import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '../lib/types'
import { useSessionStore } from '../store/sessionStore'
import Timer from './Timer'

interface Props {
  session: Session
}

const TONES = [
  { id: 'aggressive', label: 'Eristic',    desc: 'Attack hard; expose every weakness.' },
  { id: 'logical',    label: 'Dialectic',  desc: 'Calm, structured, evidence-first.' },
  { id: 'passionate', label: 'Rhetorical', desc: 'Emotional, values-driven, stirring.' },
  { id: 'sarcastic',  label: 'Ironic',     desc: 'Dry, cutting, in the Socratic vein.' },
  { id: 'sensual',    label: 'Lyric',      desc: 'Alluring, poetic, unexpectedly disarming.' },
  { id: 'academic',   label: 'Scholastic', desc: 'Formal, thorough, citation-heavy.' },
]

export default function PromptPhase({ session }: Props) {
  const { playerSide, submitBrief } = useSessionStore()

  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submitLock = useRef(false)

  const myPlayer = playerSide === 'a' ? session.player_a : session.player_b
  const opponentPlayer = playerSide === 'a' ? session.player_b : session.player_a
  const isFor = playerSide === 'a'
  const sideLabel = isFor ? 'FOR' : 'AGAINST'

  const hasTimeLimit = session.config.time_limit_seconds > 0
  const charLimit = session.config.char_limit
  const overLimit = charLimit !== null && brief.length > charLimit

  useEffect(() => {
    if (myPlayer?.ready) setSubmitted(true)
  }, [myPlayer?.ready])

  const startedAt = useMemo(() => {
    const key = `agora-timer-${session.join_code}`
    let ts = sessionStorage.getItem(key)
    if (!ts) { ts = String(Date.now()); sessionStorage.setItem(key, ts) }
    return parseInt(ts)
  }, [session.join_code])

  async function handleSubmit() {
    if (submitted || submitting || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      await submitBrief(brief.trim(), tone ?? undefined)
      setSubmitted(true)
    } catch {
      setSubmitError('Failed to submit. Please try again.')
      submitLock.current = false
    } finally {
      setSubmitting(false)
    }
  }

  function handleExpire() {
    if (!submitted) handleSubmit()
  }

  const opponentReady = opponentPlayer?.ready ?? false
  const bothReady = (myPlayer?.ready ?? false) && opponentReady

  // Summoning screen when both are ready
  if (bothReady) {
    return (
      <div className="agora-stage">
        <nav className="agora-topnav">
          <span className="agora-brand">Agora</span>
          <div style={{ flex: 1 }} />
          <span className="agora-session-code"><span style={{ opacity: 0.5 }}>#</span>{session.join_code}</span>
        </nav>
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div className="fade-up" style={{
            textAlign: 'center', display: 'flex', flexDirection: 'column',
            gap: 22, alignItems: 'center', maxWidth: 440,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <BustSmall facing="right" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontStyle: 'italic', color: 'var(--fg3)' }}>vs.</span>
              <BustSmall facing="left" variant="helmeted" />
            </div>
            <h2 className="agora-display agora-display-sm" style={{ fontStyle: 'italic' }}>Summoning the debaters…</h2>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--fg2)', margin: 0 }}>
              Both briefs are lodged. The proxies are being instructed.
            </p>
            <span className="agora-dots"><span /><span /><span /></span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="agora-stage">
      <nav className="agora-topnav">
        <span className="agora-brand">Agora</span>
        <div style={{ flex: 1 }} />
        <span className="agora-session-code"><span style={{ opacity: 0.5 }}>#</span>{session.join_code}</span>
      </nav>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 20px 80px', gap: 22, maxWidth: 560, margin: '0 auto', width: '100%',
      }}>
        {/* Topic + side */}
        <div className="fade-up" style={{ textAlign: 'center', width: '100%' }}>
          <span className="agora-eyebrow">The proposition</span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', fontWeight: 500,
            fontStyle: 'italic', marginTop: 8, lineHeight: 1.3,
          }}>
            "{session.title}"
          </h1>
          <span className={`agora-chip ${isFor ? 'agora-chip-laurel' : 'agora-chip-oxblood'}`} style={{ marginTop: 10 }}>
            <span className="dot" />You are arguing {sideLabel}
          </span>
        </div>

        {/* Timer */}
        {hasTimeLimit && !submitted && (
          <div className="fade-up" style={{ width: '100%', animationDelay: '80ms' }}>
            <Timer totalSeconds={session.config.time_limit_seconds} startedAt={startedAt} onExpire={handleExpire} />
          </div>
        )}

        {/* Tone selector */}
        <div className="fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, animationDelay: '120ms' }}>
          <div>
            <span className="agora-label">Rhetorical register</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg3)', marginLeft: 8 }}>— how should your proxy argue?</span>
          </div>
          <div className="agora-tone-grid">
            {TONES.map(t => {
              const selected = tone === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => setTone(selected ? null : t.id)}
                  className={`agora-tone-card${selected ? ' selected' : ''}`}
                >
                  <span className="agora-tone-label">{t.label}</span>
                  <span className="agora-tone-desc">{t.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Brief textarea */}
        <div className="fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, animationDelay: '180ms' }}>
          <div>
            <span className="agora-label">Strategy brief</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--fg3)', marginLeft: 8 }}>— private coaching for your proxy</span>
          </div>
          {submitted ? (
            <div style={{
              width: '100%', minHeight: 120, background: 'var(--marble-05)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-3)',
              padding: '14px 16px', fontFamily: 'var(--font-serif)', fontSize: 16,
              color: 'var(--fg2)', lineHeight: 1.6,
            }}>
              {brief || <span style={{ fontStyle: 'italic', color: 'var(--fg4)' }}>No brief submitted</span>}
            </div>
          ) : (
            <textarea
              className="agora-textarea"
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="Key points to hit, what to attack, specific examples to use…"
              style={{ minHeight: 140 }}
              maxLength={charLimit ?? undefined}
            />
          )}
          {charLimit !== null && !submitted && (
            <p style={{
              fontSize: 12, textAlign: 'right', margin: 0,
              color: overLimit ? 'var(--oxblood)' : 'var(--fg4)',
            }}>
              {brief.length} / {charLimit}
            </p>
          )}
        </div>

        {/* Submit / status */}
        <div className="fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, animationDelay: '240ms' }}>
          {submitError && <p style={{ color: 'var(--oxblood)', fontSize: 13, margin: 0 }}>{submitError}</p>}
          {!submitted ? (
            <button onClick={handleSubmit} disabled={submitting || overLimit}
              className="agora-btn agora-btn-primary agora-btn-lg agora-btn-block">
              {submitting ? 'Lodging brief…' : 'Lodge brief — Ready to debate'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span className="agora-chip agora-chip-laurel">
                <span className="dot" />
                Brief lodged{tone ? ` · ${TONES.find(t => t.id === tone)?.label}` : ''}
              </span>
              <OpponentStatus name={opponentPlayer?.name ?? 'Opponent'} ready={opponentReady} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function OpponentStatus({ name, ready }: { name: string; ready: boolean }) {
  if (ready) {
    return (
      <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--fg2)', fontSize: 15, margin: 0 }}>
        {name} is ready
      </p>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--fg3)', fontSize: 14 }}>
      <span className="agora-pulse-dots"><span /><span /><span /></span>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Waiting for {name}…</span>
    </div>
  )
}

function BustSmall({ facing, variant = 'bearded' }: { facing: 'left' | 'right'; variant?: 'bearded' | 'helmeted' }) {
  return (
    <svg viewBox="0 0 160 200" width="90" height="112"
      style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      fill="none" stroke="var(--claude-clay)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="46" y="178" width="68" height="18" />
      <rect x="52" y="168" width="56" height="12" />
      <path d="M 30 170 Q 36 150 58 140 L 102 140 Q 124 150 130 170 Z" />
      <path d="M 66 140 Q 66 128 70 118 L 90 118 Q 94 128 94 140 Z" />
      <ellipse cx="80" cy="80" rx="32" ry="40" />
      <path d="M 108 78 Q 114 82 112 92 Q 108 94 106 90" />
      {variant === 'bearded' ? (
        <>
          <path d="M 50 56 Q 52 40 66 36 Q 80 30 96 36 Q 110 42 112 56 Q 114 48 108 44 Q 102 30 88 28 Q 72 26 62 34 Q 52 42 50 56 Z" />
          <path d="M 62 108 Q 58 128 70 138 Q 80 144 90 138 Q 102 128 98 108" />
        </>
      ) : (
        <>
          <path d="M 46 66 Q 44 38 66 30 Q 80 24 96 30 Q 116 38 114 66 Q 112 54 100 50 Q 80 42 60 50 Q 48 54 46 66 Z" />
          <path d="M 78 28 Q 80 20 82 28" />
          <path d="M 66 104 Q 64 120 74 126 Q 80 130 86 126 Q 96 120 94 104" />
        </>
      )}
      <path d="M 64 74 Q 72 70 80 72" />
      <path d="M 86 72 Q 94 70 100 74" />
      <path d="M 82 82 Q 82 94 78 102 Q 82 104 86 102" />
      <path d="M 74 108 Q 80 110 86 108" />
    </svg>
  )
}
