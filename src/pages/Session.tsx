import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import Lobby from '../components/Lobby'
import PromptPhase from '../components/PromptPhase'
import DebateView from '../components/DebateView'
import ResultsView from '../components/ResultsView'
import ErrorView from '../components/ErrorView'

export default function Session() {
  const { joinCode } = useParams<{ joinCode: string }>()
  const navigate = useNavigate()
  const { session, loading, error, playerSide, fetchSession, subscribeToSession } =
    useSessionStore()

  // Fetch session if not already loaded
  useEffect(() => {
    if (!joinCode) return
    if (!session || session.join_code !== joinCode) {
      fetchSession(joinCode)
    }
  }, [joinCode])

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!joinCode) return
    const unsubscribe = subscribeToSession(joinCode)
    return unsubscribe
  }, [joinCode])

  // Redirect non-players to the join page if session is still open
  useEffect(() => {
    if (!session) return
    if (playerSide === null && session.status === 'waiting') {
      navigate(`/join/${joinCode}`, { replace: true })
    }
  }, [session, playerSide])

  if (loading && !session) {
    return <LoadingScreen />
  }

  if (error && !session) {
    return (
      <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back to home
        </button>
      </main>
    )
  }

  if (!session) return <LoadingScreen />

  switch (session.status) {
    case 'waiting':
      return <Lobby session={session} />
    case 'prompting':
      return <PromptPhase session={session} />
    case 'debating':
    case 'judging':
      return <DebateView session={session} />
    case 'complete':
      return <ResultsView session={session} />
    case 'error':
      return (
        <ErrorView
          message={session.error_message ?? 'An unknown error occurred.'}
          sessionId={session.id}
        />
      )
    default:
      return <LoadingScreen />
  }
}

function LoadingScreen() {
  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-3">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-gray-600 text-sm">Loading session...</p>
    </main>
  )
}
