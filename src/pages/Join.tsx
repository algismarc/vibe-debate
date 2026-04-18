import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'

export default function Join() {
  const { joinCode } = useParams<{ joinCode: string }>()
  const navigate = useNavigate()
  const { session, loading, error, fetchSession, joinSession } = useSessionStore()

  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!joinCode) return
    if (!session || session.join_code !== joinCode) {
      fetchSession(joinCode)
    }
  }, [joinCode])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!name.trim()) return setFormError('Enter your name.')
    try {
      await joinSession(joinCode!, name.trim())
      navigate(`/session/${joinCode}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join.'
      setFormError(error ?? msg)
    }
  }

  const sessionLoaded = session?.join_code === joinCode
  const topic = sessionLoaded ? session?.title : null
  const status = sessionLoaded ? session?.status : null

  // Session not found
  if (!loading && error && !session) {
    return (
      <div className="agora-stage">
        <SessionTopNav code={joinCode} />
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="agora-card fade-up" style={{
            maxWidth: 420, textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 14,
            borderLeft: '3px solid var(--oxblood)',
          }}>
            <span className="agora-eyebrow oxblood">A column has fallen</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500 }}>
              Session not found.
            </h2>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--fg2)', margin: 0 }}>
              The code <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-00)' }}>{joinCode}</span> doesn't match any open session. It may have been withdrawn.
            </p>
            <button onClick={() => navigate('/')} className="agora-btn agora-btn-secondary agora-btn-block">
              Return to the floor
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Debate already started — let them watch
  if (sessionLoaded && status && status !== 'waiting') {
    const isComplete = status === 'complete'
    return (
      <div className="agora-stage">
        <SessionTopNav code={joinCode} />
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="agora-card fade-up" style={{
            maxWidth: 460, textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <span className={`agora-eyebrow ${isComplete ? 'laurel' : 'clay'}`}>
              {isComplete ? 'Debate concluded' : 'Debate underway'}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500 }}>
              {isComplete ? 'The laurels have been awarded.' : 'The floor is closed to late arrivals.'}
            </h2>
            <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--fg2)', margin: 0 }}>
              {isComplete
                ? 'You may still read the transcript and the chair\'s reckoning.'
                : 'You can observe the debate from the gallery.'}
            </p>
            {topic && (
              <div className="agora-card-sunken" style={{ padding: 14 }}>
                <span className="agora-eyebrow">Proposition</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--fg1)', margin: '6px 0 0', fontStyle: 'italic' }}>
                  "{topic}"
                </p>
              </div>
            )}
            <button onClick={() => navigate(`/session/${joinCode}`)}
              className="agora-btn agora-btn-primary agora-btn-block">
              {isComplete ? 'Read the verdict →' : 'Watch from the gallery →'}
            </button>
            <button onClick={() => navigate('/')}
              style={{ fontSize: 13, color: 'var(--fg3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Back to the floor
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="agora-stage">
      <SessionTopNav code={joinCode} />
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px 20px 80px' }}>
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="fade-up" style={{ textAlign: 'center' }}>
            <span className="agora-eyebrow clay">You have been called to the stoa</span>
            <h1 className="agora-display agora-display-md" style={{ marginTop: 10, fontStyle: 'italic' }}>
              The floor awaits your answer.
            </h1>
          </div>

          {/* Proposition card */}
          <div className="agora-card fade-up" style={{
            textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14,
            position: 'relative', overflow: 'hidden', animationDelay: '80ms',
          }}>
            <div style={{
              position: 'absolute', right: 14, top: 4,
              fontFamily: 'var(--font-display)', fontSize: 96,
              color: 'var(--claude-clay-wash)', lineHeight: 1, fontWeight: 400,
              pointerEvents: 'none',
            }}>§</div>
            <span className="agora-eyebrow clay">The proposition</span>
            {loading && !topic ? (
              <div className="agora-pulse-dots" style={{ justifyContent: 'center' }}>
                <span /><span /><span />
              </div>
            ) : (
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--fg1)', margin: 0, lineHeight: 1.35, fontStyle: 'italic', position: 'relative' }}>
                "{topic}"
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <span className="agora-chip agora-chip-oxblood">
                <span className="dot" />You · Against
              </span>
            </div>
          </div>

          {/* Join form */}
          <form onSubmit={handleJoin} className="agora-card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, animationDelay: '160ms' }}>
            <div className="agora-field">
              <label className="agora-label">Your name</label>
              <input className="agora-input" placeholder="How shall we address you?"
                value={name} onChange={e => setName(e.target.value)} maxLength={30} autoFocus />
            </div>
            {formError && <p style={{ color: 'var(--oxblood)', fontSize: 13, margin: 0 }}>{formError}</p>}
            <button type="submit" disabled={loading}
              className="agora-btn agora-btn-primary agora-btn-lg agora-btn-block">
              {loading ? 'Joining…' : 'Accept the challenge →'}
            </button>
          </form>

          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'var(--fg3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
            Back to the floor
          </button>
        </div>
      </main>
    </div>
  )
}

function SessionTopNav({ code }: { code?: string }) {
  return (
    <nav className="agora-topnav">
      <span className="agora-brand">Agora</span>
      <div style={{ flex: 1 }} />
      {code && (
        <span className="agora-session-code">
          <span style={{ opacity: 0.5 }}>#</span>{code}
        </span>
      )}
    </nav>
  )
}
