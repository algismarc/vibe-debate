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
      <main className="flex flex-col items-center justify-center min-h-svh p-4">
        <div className="w-full max-w-sm text-center flex flex-col gap-4">
          <p className="text-4xl">🔍</p>
          <h2 className="text-white font-bold text-xl">Session not found</h2>
          <p className="text-gray-500 text-sm">
            The code <span className="font-mono text-gray-300">{joinCode}</span> doesn't match any active session.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            Back to home
          </button>
        </div>
      </main>
    )
  }

  // Debate already started — let them watch
  if (sessionLoaded && status && status !== 'waiting') {
    const isComplete = status === 'complete'
    return (
      <main className="flex flex-col items-center justify-center min-h-svh p-4">
        <div className="w-full max-w-sm text-center flex flex-col gap-5">
          <p className="text-4xl">{isComplete ? '🏆' : '⚡'}</p>
          <div>
            <h2 className="text-white font-bold text-xl mb-1">
              {isComplete ? 'Debate complete' : 'Debate in progress'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isComplete
                ? 'This debate has finished. View the results below.'
                : 'This debate has already started — you can\'t join, but you can watch.'}
            </p>
          </div>
          {topic && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Topic</p>
              <p className="text-white font-semibold">"{topic}"</p>
            </div>
          )}
          <button
            onClick={() => navigate(`/session/${joinCode}`)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl px-6 py-3 transition-colors"
          >
            {isComplete ? 'View results →' : 'Watch debate →'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-1">
            Vibe<span className="text-purple-400">Debate</span>
          </h1>
          <p className="text-gray-500 text-sm">You've been challenged to a debate</p>
        </div>

        {/* Topic card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Debate Topic</p>
          {loading && !topic ? (
            <div className="flex justify-center gap-1.5 py-2">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-white font-bold text-xl leading-snug">"{topic}"</p>
          )}
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest mt-3">
            You'll be arguing AGAINST
          </p>
        </div>

        {/* Join form */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                maxLength={30}
              />
            </div>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-colors"
            >
              {loading ? 'Joining...' : "Let's Debate →"}
            </button>
          </form>
        </section>

        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-400 text-sm transition-colors text-center"
        >
          ← Back to home
        </button>
      </div>
    </main>
  )
}
