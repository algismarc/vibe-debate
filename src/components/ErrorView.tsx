import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'

interface Props {
  message: string
  sessionId?: string
}

export default function ErrorView({ message, sessionId }: Props) {
  const navigate = useNavigate()
  const { retryDebate, loading } = useSessionStore()

  async function handleRetry() {
    if (!sessionId) return
    await retryDebate()
  }

  return (
    <div className="agora-stage">
      <nav className="agora-topnav">
        <span className="agora-brand">Agora</span>
      </nav>
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="agora-card fade-up" style={{
          maxWidth: 460, display: 'flex', flexDirection: 'column',
          gap: 14, textAlign: 'center', borderLeft: '3px solid var(--oxblood)',
        }}>
          <span className="agora-eyebrow oxblood">A column has fallen</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500 }}>
            Something broke in the stoa.
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--fg2)', margin: 0, fontStyle: 'italic' }}>
            {message}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {sessionId && (
              <button onClick={handleRetry} disabled={loading}
                className="agora-btn agora-btn-primary agora-btn-block">
                {loading ? 'Re-assembling…' : 'Re-assemble the debate'}
              </button>
            )}
            <button onClick={() => navigate('/')}
              className="agora-btn agora-btn-ghost agora-btn-sm agora-btn-block"
              style={{ color: 'var(--fg3)' }}>
              Return to the floor
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
