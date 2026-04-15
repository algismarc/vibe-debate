import type { Session } from '../lib/types'

interface Props {
  session: Session
}

export default function ResultsView({ session }: Props) {
  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">🏆 Debate Complete</h2>
        <p className="text-gray-500 text-sm">Results UI coming in Phase 6</p>
        <p className="text-gray-600 text-xs mt-2">Topic: "{session.title}"</p>
      </div>
    </main>
  )
}
