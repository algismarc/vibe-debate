import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'

export default function Join() {
  const { joinCode } = useParams<{ joinCode: string }>()
  const navigate = useNavigate()
  const { joinSession, loading, error } = useSessionStore()

  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')

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

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-1">
            Vibe<span className="text-purple-400">Debate</span>
          </h1>
          <p className="text-gray-500 text-sm">
            Joining session{' '}
            <span className="font-mono text-green-400 tracking-widest">{joinCode}</span>
          </p>
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-1">You're the AGAINST side</h2>
          <p className="text-gray-500 text-sm mb-5">
            You'll be arguing against the topic. Enter your name to continue.
          </p>
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
            {(formError) && (
              <p className="text-red-400 text-sm">{formError}</p>
            )}
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
