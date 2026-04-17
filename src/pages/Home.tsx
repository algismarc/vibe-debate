import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'

export default function Home() {
  const navigate = useNavigate()
  const { createSession, loading, error } = useSessionStore()

  // Create form state
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [timeLimit, setTimeLimit] = useState('300')
  const [createError, setCreateError] = useState('')

  // Join form state
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (!title.trim()) return setCreateError('Enter a debate topic.')
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
    if (code.length !== 6) return setJoinError('Enter a 6-character code.')
    navigate(`/join/${code}`)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-8">
      {/* Header */}
      <div className="text-center animate-fadeUp" style={{ animationDelay: '0ms' }}>
        <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
          Vibe<span className="animate-shimmer">Debate</span>
        </h1>
        <p className="text-gray-400">Intelligence-Assisted Consensus Discovery</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Start a Debate */}
        <section
          className="rothko-panel animate-fadeUp"
          style={{ animationDelay: '120ms' }}
        >
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            Start a Debate
          </h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Debate topic</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Pineapple belongs on pizza"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                maxLength={120}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="You'll be arguing FOR"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                maxLength={30}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Brief time limit</label>
              <select
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes (default)</option>
                <option value="600">10 minutes</option>
                <option value="0">No limit</option>
              </select>
            </div>
            {createError && (
              <p className="text-red-400 text-sm">{createError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-all mt-1"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </form>
        </section>

        {/* Divider */}
        <div
          className="flex items-center gap-4 animate-fadeUp"
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Join a Debate */}
        <section
          className="rothko-panel animate-fadeUp"
          style={{ animationDelay: '300ms' }}
        >
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            Join a Debate
          </h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Session code</label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABCDEF"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 font-mono text-xl tracking-widest text-center focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                maxLength={6}
                autoComplete="off"
              />
            </div>
            {joinError && (
              <p className="text-red-400 text-sm">{joinError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-700 active:scale-95 border border-gray-700 text-white font-semibold rounded-lg px-6 py-3 transition-all"
            >
              Join Session
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
