import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '../lib/types'
import { useSessionStore } from '../store/sessionStore'

interface Props {
  session: Session
}

export default function Lobby({ session }: Props) {
  const navigate = useNavigate()
  const { playerSide, cancelSession } = useSessionStore()
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(session.join_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  function copyLink() {
    const link = `${window.location.origin}/join/${session.join_code}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleCancel() {
    if (!confirm('Withdraw this proposition? Your opponent\'s link will stop working.')) return
    setCancelling(true)
    await cancelSession()
    navigate('/')
  }

  return (
    <div className="agora-stage">
      <nav className="agora-topnav">
        <span className="agora-brand">Agora</span>
        <div style={{ flex: 1 }} />
        <span className="agora-session-code">
          <span style={{ opacity: 0.5 }}>#</span>{session.join_code}
        </span>
      </nav>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '48px 20px 80px', gap: 28,
      }}>
        {/* Topic */}
        <div className="fade-up" style={{ textAlign: 'center', maxWidth: 600 }}>
          <span className="agora-eyebrow clay">The floor is open</span>
          <h1 className="agora-display agora-display-md" style={{ marginTop: 10, fontStyle: 'italic' }}>
            "{session.title}"
          </h1>
        </div>

        {/* Join code card */}
        <div className="agora-card fade-up" style={{
          width: '100%', maxWidth: 400,
          display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center',
          animationDelay: '100ms',
        }}>
          <span className="agora-eyebrow">Share this code with your opponent</span>
          <button className="agora-joincode" onClick={copyCode} title="Click to copy">
            {session.join_code}
          </button>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={copyCode} className="agora-btn agora-btn-ghost agora-btn-sm" style={{ flex: 1 }}>
              {codeCopied ? '✓ Copied' : 'Copy code'}
            </button>
            <button onClick={copyLink} className="agora-btn agora-btn-ghost agora-btn-sm" style={{ flex: 1 }}>
              {linkCopied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Player slots */}
        <div className="fade-up" style={{
          width: '100%', maxWidth: 400,
          display: 'flex', flexDirection: 'column', gap: 10,
          animationDelay: '180ms',
        }}>
          <span className="agora-eyebrow" style={{ textAlign: 'center' }}>Participants</span>

          {/* Player A (host) */}
          <div className="agora-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="agora-avatar">{session.player_a.name[0].toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{session.player_a.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg4)' }}>arguing FOR</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="agora-chip agora-chip-laurel"><span className="dot" />Present</span>
            </div>
          </div>

          {/* Player B (waiting) */}
          <div style={{
            padding: 14, background: 'transparent',
            border: '1px dashed var(--border-strong)', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div className="agora-avatar" style={{ background: 'transparent', color: 'var(--fg4)', border: '1px dashed var(--border-strong)' }}>?</div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--fg3)', fontSize: 15 }}>
                Waiting for opponent…
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg4)' }}>will argue AGAINST</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="agora-pulse-dots"><span /><span /><span /></span>
            </div>
          </div>
        </div>

        {/* Cancel — host only */}
        {playerSide === 'a' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="agora-btn agora-btn-ghost agora-btn-sm fade-up"
            style={{ animationDelay: '260ms', color: 'var(--fg3)' }}
          >
            {cancelling ? 'Withdrawing…' : 'Withdraw the proposition'}
          </button>
        )}
      </main>
    </div>
  )
}
