import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'

export default function Home() {
  const navigate = useNavigate()
  const { createSession, loading, error } = useSessionStore()

  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [timeLimit, setTimeLimit] = useState('300')
  const [createError, setCreateError] = useState('')

  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!title.trim()) return setCreateError('Enter a proposition to debate.')
    if (!name.trim()) return setCreateError('Enter your name.')
    try {
      const code = await createSession(title.trim(), name.trim(), {
        time_limit_seconds: parseInt(timeLimit) || 300,
      })
      navigate(`/session/${code}`)
    } catch {
      setCreateError(error ?? 'Failed to create session.')
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoinError('')
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) return setJoinError('Enter a valid 6-character code.')
    navigate(`/join/${code}`)
  }

  return (
    <div className="agora-stage">
      <TopNav />
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 20px 80px', position: 'relative',
      }}>
        {/* Column flourishes */}
        <ColumnFlourish style={{ position: 'absolute', right: -40, top: 40, width: 180, height: 360, opacity: 0.06 }} />
        <ColumnFlourish style={{ position: 'absolute', left: -40, bottom: 40, width: 180, height: 360, opacity: 0.06, transform: 'scaleX(-1)' }} />

        <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 36, position: 'relative' }}>
          {/* Hero */}
          <div className="fade-up" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <h1 className="agora-display agora-display-lg" style={{ fontStyle: 'italic' }}>
              VibeDebate
            </h1>
          </div>

          {/* Pose form */}
          <form onSubmit={handleCreate} className="agora-card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18, animationDelay: '100ms' }}>
            <div className="agora-field">
              <label className="agora-label">Topic <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--fg4)', fontSize: 12 }}>— you argue for</span></label>
              <input
                className="agora-input"
                style={{ fontFamily: 'var(--font-serif)', fontSize: 17, padding: '14px 16px' }}
                placeholder="e.g. Pineapple belongs on pizza."
                value={title} onChange={e => setTitle(e.target.value)} maxLength={160}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 14 }}>
              <div className="agora-field">
                <label className="agora-label">Your name</label>
                <input className="agora-input" placeholder="Name"
                  value={name} onChange={e => setName(e.target.value)} maxLength={30} />
              </div>
              <div className="agora-field">
                <label className="agora-label">Brief length</label>
                <select className="agora-select" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}>
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                  <option value="0">No limit</option>
                </select>
              </div>
            </div>
            {createError && <p style={{ color: 'var(--oxblood)', fontSize: 13, margin: 0 }}>{createError}</p>}
            <button type="submit" disabled={loading}
              className="agora-btn agora-btn-primary agora-btn-lg agora-btn-block">
              {loading ? 'Creating…' : 'Start debate →'}
            </button>
          </form>

          {/* Divider */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--fg4)', animationDelay: '160ms' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Join form */}
          <form onSubmit={handleJoin} className="agora-card-sunken fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, animationDelay: '220ms' }}>
            <div className="agora-field">
              <label className="agora-label">Join code</label>
              <input
                className="agora-input"
                placeholder="ABCDEF"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 8))}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 22, textAlign: 'center', letterSpacing: '0.3em', padding: '14px 16px' }}
                maxLength={8} autoComplete="off"
              />
            </div>
            {joinError && <p style={{ color: 'var(--oxblood)', fontSize: 13, margin: 0 }}>{joinError}</p>}
            <button type="submit" className="agora-btn agora-btn-secondary agora-btn-block">
              Join
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

function TopNav() {
  return (
    <nav className="agora-topnav">
      <span className="agora-brand">Vibeum Debatum</span>
    </nav>
  )
}

function LaurelSvg({ size = 44, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 54 C 22 54 14 46 14 34 C 14 24 20 18 28 18" />
      <path d="M32 54 C 42 54 50 46 50 34 C 50 24 44 18 36 18" />
      {[0,1,2,3,4].map(i => {
        const y = 22 + i * 6
        return <g key={i}>
          <path d={`M ${16+i} ${y} q -4 -2 -6 2 q 3 4 7 1`} />
          <path d={`M ${48-i} ${y} q 4 -2 6 2 q -3 4 -7 1`} />
        </g>
      })}
      <path d="M32 18 L32 12" />
      <circle cx="32" cy="10" r="1.5" fill={color} />
    </svg>
  )
}

function ColumnFlourish({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 400" style={{ ...style, pointerEvents: 'none' }}
      fill="none" stroke="var(--ink-00)" strokeWidth="1">
      <rect x="10" y="6" width="100" height="14" />
      <rect x="16" y="20" width="88" height="10" />
      <path d="M20 30 Q 40 44 60 30 Q 80 44 100 30" />
      <line x1="28" y1="40" x2="28" y2="370" />
      <line x1="44" y1="40" x2="44" y2="370" />
      <line x1="60" y1="40" x2="60" y2="370" />
      <line x1="76" y1="40" x2="76" y2="370" />
      <line x1="92" y1="40" x2="92" y2="370" />
      <rect x="16" y="370" width="88" height="10" />
      <rect x="10" y="380" width="100" height="14" />
    </svg>
  )
}
