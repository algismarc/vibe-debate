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
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-6">
      <div className="w-full max-w-sm bg-gray-900 border border-red-900/50 rounded-2xl p-6 text-center flex flex-col gap-4">
        <div>
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-white font-bold text-lg mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col gap-2">
          {sessionId && (
            <button
              onClick={handleRetry}
              disabled={loading}
              className="w-full bg-red-800 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-6 py-3 transition-colors"
            >
              {loading ? 'Retrying...' : 'Retry Debate'}
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </main>
  )
}
