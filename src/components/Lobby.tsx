import { useState } from 'react'
import type { Session } from '../lib/types'

interface Props {
  session: Session
}

export default function Lobby({ session }: Props) {
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-8">
      {/* Topic */}
      <div className="text-center max-w-lg">
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Debate Topic</p>
        <h1 className="text-3xl font-bold text-white leading-tight">
          "{session.title}"
        </h1>
      </div>

      {/* Join code card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4">
        <p className="text-gray-500 text-sm">Share this code with your opponent</p>

        <button
          onClick={copyCode}
          className="font-mono text-5xl font-bold tracking-[0.2em] text-purple-400 hover:text-purple-300 transition-colors cursor-pointer select-all"
          title="Click to copy code"
        >
          {session.join_code}
        </button>

        <div className="flex gap-3">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {codeCopied ? '✓ Copied!' : '📋 Copy code'}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {linkCopied ? '✓ Copied!' : '🔗 Copy link'}
          </button>
        </div>
      </div>

      {/* Player slots */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <p className="text-gray-500 text-xs uppercase tracking-widest text-center">Players</p>

        {/* Player A — confirmed */}
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-purple-400 bg-purple-400/10 rounded px-2 py-0.5">FOR</span>
          <span className="text-white font-medium">{session.player_a.name}</span>
          <span className="ml-auto text-green-400 text-xs">✓ Ready</span>
        </div>

        {/* Player B — waiting */}
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 border-dashed rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-green-400 bg-green-400/10 rounded px-2 py-0.5">AGAINST</span>
          <span className="text-gray-600 font-medium italic">Waiting for opponent...</span>
          <span className="ml-auto">
            <WaitingDots />
          </span>
        </div>
      </div>
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
