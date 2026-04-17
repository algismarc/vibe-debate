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
    if (!confirm('Cancel this session? Your opponent\'s link will stop working.')) return
    setCancelling(true)
    await cancelSession()
    navigate('/')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-8">
      {/* Topic */}
      <div
        className="text-center max-w-lg px-2 animate-fadeUp"
        style={{ animationDelay: '0ms' }}
      >
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Debate Topic</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          "{session.title}"
        </h1>
      </div>

      {/* Join code card */}
      <div
        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4 animate-fadeUp"
        style={{ animationDelay: '100ms' }}
      >
        <p className="text-gray-500 text-sm">Share this code with your opponent</p>

        <button
          onClick={copyCode}
          className="font-mono text-4xl sm:text-5xl font-bold tracking-[0.2em] text-purple-400 hover:text-purple-300 active:scale-95 transition-all cursor-pointer animate-codeGlow rounded-lg px-2"
          title="Click to copy code"
        >
          {session.join_code}
        </button>

        <div className="flex gap-2 w-full">
          <button
            onClick={copyCode}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition-all"
          >
            {codeCopied ? 'Copied!' : 'Copy code'}
          </button>
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 text-white text-sm font-medium rounded-lg px-3 py-2 transition-all"
          >
            {linkCopied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      {/* Player slots */}
      <div
        className="w-full max-w-sm flex flex-col gap-3 animate-fadeUp"
        style={{ animationDelay: '200ms' }}
      >
        <p className="text-gray-500 text-xs uppercase tracking-widest text-center">Players</p>

        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-purple-400 bg-purple-400/10 rounded px-2 py-0.5 shrink-0">FOR</span>
          <span className="text-white font-medium truncate">{session.player_a.name}</span>
          <span className="ml-auto text-green-400 text-xs shrink-0">Ready</span>
        </div>

        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 border-dashed rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-green-400 bg-green-400/10 rounded px-2 py-0.5 shrink-0">AGAINST</span>
          <span className="text-gray-600 font-medium italic truncate">Waiting for opponent...</span>
          <span className="ml-auto shrink-0"><WaitingDots /></span>
        </div>
      </div>

      {/* Cancel — host only */}
      {playerSide === 'a' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="text-gray-700 hover:text-red-400 text-sm transition-colors disabled:opacity-50 animate-fadeUp"
          style={{ animationDelay: '300ms' }}
        >
          {cancelling ? 'Cancelling...' : 'Cancel session'}
        </button>
      )}
    </main>
  )
}

function WaitingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  )
}
