import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '../lib/types'
import { useSessionStore } from '../store/sessionStore'
import Timer from './Timer'

interface Props {
  session: Session
}

export default function PromptPhase({ session }: Props) {
  const { playerSide, submitBrief } = useSessionStore()

  const [brief, setBrief] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submitLock = useRef(false)

  const myPlayer = playerSide === 'a' ? session.player_a : session.player_b
  const opponentPlayer = playerSide === 'a' ? session.player_b : session.player_a
  const side = playerSide === 'a' ? 'FOR' : 'AGAINST'
  const sideColor = playerSide === 'a' ? 'text-purple-400' : 'text-green-400'
  const sideBg = playerSide === 'a' ? 'bg-purple-400/10 border-purple-400/30' : 'bg-green-400/10 border-green-400/30'

  const hasTimeLimit = session.config.time_limit_seconds > 0
  const charLimit = session.config.char_limit
  const overLimit = charLimit !== null && brief.length > charLimit

  // Restore submitted state if player already submitted (e.g. after refresh)
  useEffect(() => {
    if (myPlayer?.ready) {
      setSubmitted(true)
    }
  }, [myPlayer?.ready])

  // Stable timer start time: stored in sessionStorage so refresh preserves it
  const startedAt = useMemo(() => {
    const key = `vibe-debate-timer-${session.join_code}`
    let ts = sessionStorage.getItem(key)
    if (!ts) {
      ts = String(Date.now())
      sessionStorage.setItem(key, ts)
    }
    return parseInt(ts)
  }, [session.join_code])

  async function handleSubmit() {
    if (submitted || submitting || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      await submitBrief(brief.trim())
      setSubmitted(true)
    } catch {
      setSubmitError('Failed to submit. Please try again.')
      submitLock.current = false
    } finally {
      setSubmitting(false)
    }
  }

  function handleExpire() {
    if (!submitted) handleSubmit()
  }

  const opponentReady = opponentPlayer?.ready ?? false
  const bothReady = (myPlayer?.ready ?? false) && opponentReady

  if (bothReady) {
    return (
      <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-4">
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Starting debate...</h2>
          <p className="text-gray-500 text-sm">Both briefs are in. The AI debaters are being briefed.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center min-h-svh p-4 pt-8 gap-5 max-w-lg mx-auto w-full">
      {/* Topic + side */}
      <div className="text-center w-full">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Debate Topic</p>
        <h1 className="text-2xl font-bold text-white leading-snug mb-3">
          "{session.title}"
        </h1>
        <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${sideBg} ${sideColor}`}>
          You are arguing {side}
        </span>
      </div>

      {/* Timer */}
      {hasTimeLimit && !submitted && (
        <div className="w-full">
          <Timer
            totalSeconds={session.config.time_limit_seconds}
            startedAt={startedAt}
            onExpire={handleExpire}
          />
        </div>
      )}

      {/* Brief input */}
      <div className="w-full flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <label className="text-gray-400 text-sm font-medium">
            Your strategy brief
            <span className="text-gray-600 font-normal ml-1">— private coaching for your AI debater</span>
          </label>
        </div>

        {submitted ? (
          <div className="w-full min-h-40 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm leading-relaxed">
            {brief || <span className="italic text-gray-600">No brief submitted</span>}
          </div>
        ) : (
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder={`Tell your AI debater how to argue ${side}. Tactics, tone, key points, what to attack...`}
            className="w-full min-h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500 transition-colors text-sm leading-relaxed"
            maxLength={charLimit ?? undefined}
            autoFocus
          />
        )}

        {/* Character counter */}
        {charLimit !== null && !submitted && (
          <p className={`text-xs text-right ${overLimit ? 'text-red-400' : 'text-gray-600'}`}>
            {brief.length} / {charLimit}
          </p>
        )}
      </div>

      {/* Submit / status */}
      <div className="w-full flex flex-col gap-3 pb-6">
        {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || overLimit}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3.5 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Brief — Ready to Debate'}
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <span>✓</span>
              <span>Brief submitted</span>
            </div>
            <OpponentStatus name={opponentPlayer?.name ?? 'Opponent'} ready={opponentReady} />
          </div>
        )}
      </div>
    </main>
  )
}

function OpponentStatus({ name, ready }: { name: string; ready: boolean }) {
  if (ready) {
    return (
      <p className="text-gray-400 text-sm">
        <span className="text-green-400">✓</span> {name} is ready
      </p>
    )
  }
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <span className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-gray-600 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      <span>Waiting for {name}...</span>
    </div>
  )
}
