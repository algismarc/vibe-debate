import type { Session } from '../lib/types'
import Transcript from './Transcript'

interface Props {
  session: Session
}

export default function DebateView({ session }: Props) {
  const isDebating = session.status === 'debating'
  const isJudging = session.status === 'judging'

  return (
    <main className="flex flex-col items-center min-h-svh p-4 pt-8 gap-6 max-w-2xl mx-auto w-full">
      {/* Topic */}
      <div className="text-center w-full">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Debate Topic</p>
        <h1 className="text-2xl font-bold text-white leading-snug">"{session.title}"</h1>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-5 py-3">
        <span className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full animate-bounce ${isDebating ? 'bg-purple-500' : 'bg-yellow-500'}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-gray-300 text-sm font-medium">
          {isDebating ? 'AI debaters are arguing...' : 'Judge is deliberating...'}
        </span>
      </div>

      {/* Transcript appears when judging (debate is done) */}
      {(isJudging) && session.debate_transcript && (
        <Transcript transcript={session.debate_transcript} animate />
      )}
    </main>
  )
}
