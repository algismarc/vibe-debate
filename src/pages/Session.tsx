import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import Lobby from '../components/Lobby'
import PromptPhase from '../components/PromptPhase'
import DebateReveal from '../components/DebateReveal'
import ErrorView from '../components/ErrorView'

export default function Session() {
  const { joinCode } = useParams<{ joinCode: string }>()
  const navigate = useNavigate()
  const { session, loading, error, playerSide, fetchSession, subscribeToSession } =
    useSessionStore()

  // Always fetch on mount to get the latest DB state.
  // This catches status transitions (e.g. 'waiting' → 'prompting') that may have
  // fired before the Realtime subscription was fully established.
  useEffect(() => {
    if (!joinCode) return
    fetchSession(joinCode)
  }, [joinCode])

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!joinCode) return
    const unsubscribe = subscribeToSession(joinCode)
    return unsubscribe
  }, [joinCode])

  // Polling fallback: re-fetch every 4 s while in a transitional state.
  // Guards against Supabase Realtime events being missed (WebSocket race,
  // dropped connection, Strict Mode double-mount, etc.).
  useEffect(() => {
    if (!joinCode || !session) return
    if (session.status === 'complete' || session.status === 'error') return

    const id = setInterval(() => fetchSession(joinCode), 4000)
    return () => clearInterval(id)
  }, [joinCode, session?.status])

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
          Back to home
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
    case 'complete':
      return <DebateReveal session={session} />
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
