import type { Session } from '../lib/types'

interface Props {
  session: Session
}

export default function DebateView({ session }: Props) {
  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {session.status === 'debating' ? '⚡ Debaters are arguing...' : '⚖️ Judge is deliberating...'}
        </h2>
        <p className="text-gray-500 text-sm">Debate UI coming in Phase 6</p>
      </div>
    </main>
  )
}
