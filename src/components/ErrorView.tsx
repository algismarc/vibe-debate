import { useSessionStore } from '../store/sessionStore'

interface Props {
  message: string
  sessionId?: string
}

export default function ErrorView({ message, sessionId }: Props) {
  const { triggerDebate, loading } = useSessionStore()

  async function handleRetry() {
    if (!sessionId) return
    await triggerDebate()
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-6">
      <div className="w-full max-w-sm bg-gray-900 border border-red-900/50 rounded-2xl p-6 text-center flex flex-col gap-4">
        <div>
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="text-white font-bold text-lg mb-2">Something went wrong</h2>
          <p className="text-gray-400 text-sm">{message}</p>
        </div>
        {sessionId && (
          <button
            onClick={handleRetry}
            disabled={loading}
            className="w-full bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-3 transition-colors"
          >
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </main>
  )
}
