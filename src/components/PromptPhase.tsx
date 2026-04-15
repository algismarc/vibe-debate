import type { Session } from '../lib/types'
import { useSessionStore } from '../store/sessionStore'

interface Props {
  session: Session
}

export default function PromptPhase({ session }: Props) {
  const { playerSide } = useSessionStore()

  const myPlayer = playerSide === 'a' ? session.player_a : session.player_b
  const opponentPlayer = playerSide === 'a' ? session.player_b : session.player_a
  const side = playerSide === 'a' ? 'FOR' : 'AGAINST'
  const sideColor = playerSide === 'a' ? 'text-purple-400' : 'text-green-400'

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-6">
      <div className="text-center max-w-lg">
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Debate Topic</p>
        <h1 className="text-2xl font-bold text-white mb-3">"{session.title}"</h1>
        <p className={`text-sm font-semibold ${sideColor}`}>
          You are arguing <span className="font-bold">{side}</span>
        </p>
      </div>

      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-2">Brief submission UI coming in Phase 4</p>
        <div className="flex flex-col gap-2 text-xs text-gray-600">
          <p>You: <span className="text-white">{myPlayer?.name}</span></p>
          <p>Opponent: <span className="text-white">{opponentPlayer?.name ?? '?'}</span></p>
        </div>
      </div>
    </main>
  )
}
