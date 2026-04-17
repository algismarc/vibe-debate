import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '../lib/types'
import { useSessionStore } from '../store/sessionStore'
import Timer from './Timer'

interface Props {
  session: Session
}

const TONES = [
  { id: 'aggressive',   emoji: '🔥', label: 'Aggressive',  desc: 'Attack hard, expose every weakness' },
  { id: 'logical',      emoji: '🧠', label: 'Logical',      desc: 'Calm, structured, evidence-first' },
  { id: 'passionate',   emoji: '🎭', label: 'Passionate',   desc: 'Emotional, values-driven, inspiring' },
  { id: 'sarcastic',    emoji: '😏', label: 'Sarcastic',    desc: 'Witty, cutting, dry humour' },
  { id: 'sensual',       emoji: '💋', label: 'Sensual',     desc: 'Seductive, alluring, dangerously charming' },
  { id: 'academic',     emoji: '🎓', label: 'Academic',     desc: 'Formal, thorough, citation-heavy' },
]

export default function PromptPhase({ session }: Props) {
  const { playerSide, submitBrief } = useSessionStore()

  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const submitLock = useRef(false)

  const myPlayer = playerSide === 'a' ? session.player_a : session.player_b
  const opponentPlayer = playerSide === 'a' ? session.player_b : session.player_a
  const side = playerSide === 'a' ? 'FOR' : 'AGAINST'
  const sideColor = playerSide === 'a' ? 'text-purple-400' : 'text-green-400'
  const sideBg = playerSide === 'a' ? 'bg-purple-400/10 border-purple-400/30' : 'bg-green-400/10 border-green-400/30'
  const accentBorder = playerSide === 'a' ? 'border-purple-500' : 'border-green-500'
  const accentBg = playerSide === 'a' ? 'bg-purple-950/50' : 'bg-green-950/50'
  const focusBorder = playerSide === 'a' ? 'focus:border-purple-500 focus:ring-purple-500/20' : 'focus:border-green-500 focus:ring-green-500/20'

  const hasTimeLimit = session.config.time_limit_seconds > 0
  const charLimit = session.config.char_limit
  const overLimit = charLimit !== null && brief.length > charLimit

  // Restore submitted state on refresh
  useEffect(() => {
    if (myPlayer?.ready) setSubmitted(true)
  }, [myPlayer?.ready])

  // Timer start time persisted in sessionStorage
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
      await submitBrief(brief.trim(), tone ?? undefined)
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
      <main className="flex flex-col items-center justify-center min-h-svh p-4 gap-6">
        <div className="text-center flex flex-col items-center gap-5">
          {/* Animated VS spark */}
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-lg font-bold uppercase tracking-widest animate-vsSpark">VS</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Summoning the debaters...</h2>
            <p className="text-gray-500 text-sm">Both briefs are in. The AI is being briefed.</p>
          </div>
          {/* Bouncing dots */}
          <div className="flex gap-2 justify-center">
            {[0, 1, 2, 3, 4].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  backgroundColor: i < 2 ? 'rgb(168,85,247)' : i > 2 ? 'rgb(34,197,94)' : 'rgb(156,163,175)',
                }}
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center min-h-svh p-4 pt-8 gap-5 max-w-lg mx-auto w-full">
      {/* Topic + side */}
      <div
        className="text-center w-full animate-fadeUp"
        style={{ animationDelay: '0ms' }}
      >
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
        <div className="w-full animate-fadeUp" style={{ animationDelay: '80ms' }}>
          <Timer
            totalSeconds={session.config.time_limit_seconds}
            startedAt={startedAt}
            onExpire={handleExpire}
          />
        </div>
      )}

      {/* Tone selector */}
      <div
        className="w-full flex flex-col gap-2 animate-fadeUp"
        style={{ animationDelay: '140ms' }}
      >
        <label className="text-gray-400 text-sm font-medium">
          Debater tone
          <span className="text-gray-600 font-normal ml-1">— how should your AI argue?</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TONES.map(t => {
            const selected = tone === t.id
            return (
              <button
                key={t.id}
                type="button"
                disabled={submitted}
                onClick={() => setTone(selected ? null : t.id)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? `${accentBorder} ${accentBg} border-2 scale-105 shadow-lg`
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:scale-[1.03] hover:bg-gray-800/60'
                } ${submitted ? 'opacity-50 cursor-default' : 'cursor-pointer active:scale-95'}`}
              >
                <span className={`text-xs font-semibold ${selected ? sideColor : 'text-white'}`}>
                  {t.label}
                </span>
                <span className="text-gray-600 text-xs leading-tight">{t.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Brief input */}
      <div
        className="w-full flex flex-col gap-2 flex-1 animate-fadeUp"
        style={{ animationDelay: '200ms' }}
      >
        <label className="text-gray-400 text-sm font-medium">
          Strategy brief
          <span className="text-gray-600 font-normal ml-1">— private coaching for your AI debater</span>
        </label>

        {submitted ? (
          <div className="w-full min-h-32 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm leading-relaxed">
            {brief || <span className="italic text-gray-600">No brief submitted</span>}
          </div>
        ) : (
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder={`Key points to hit, what to attack, specific examples to use...`}
            className={`w-full min-h-36 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 transition-all text-sm leading-relaxed ${focusBorder}`}
            maxLength={charLimit ?? undefined}
          />
        )}

        {charLimit !== null && !submitted && (
          <p className={`text-xs text-right ${overLimit ? 'text-red-400' : 'text-gray-600'}`}>
            {brief.length} / {charLimit}
          </p>
        )}
      </div>

      {/* Submit / status */}
      <div
        className="w-full flex flex-col gap-3 pb-6 animate-fadeUp"
        style={{ animationDelay: '260ms' }}
      >
        {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || overLimit}
            className="w-full bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3.5 transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit Brief — Ready to Debate'}
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <span>Brief submitted{tone ? ` · ${TONES.find(t => t.id === tone)?.label}` : ''}</span>
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
{name} is ready
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
