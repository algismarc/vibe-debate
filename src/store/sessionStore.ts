import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Session, Config } from '../lib/types'
import { generateJoinCode, derivePlayerSide } from '../lib/utils'

interface SessionState {
  // Session data
  session: Session | null
  loading: boolean
  error: string | null

  // This client's identity
  playerId: string
  playerSide: 'a' | 'b' | null

  // Actions
  fetchSession: (joinCode: string) => Promise<void>
  createSession: (title: string, name: string, config?: Partial<Config>) => Promise<string>
  joinSession: (joinCode: string, name: string) => Promise<void>
  submitBrief: (brief: string, tone?: string) => Promise<void>
  triggerDebate: () => Promise<void>
  retryDebate: () => Promise<void>
  cancelSession: () => Promise<void>
  subscribeToSession: (joinCode: string) => () => void

  // Internal
  setSession: (session: Session) => void
}

// generateJoinCode and derivePlayerSide live in ../lib/utils (testable there)

function getOrCreatePlayerId(): string {
  let id = sessionStorage.getItem('vibe-debate-player-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('vibe-debate-player-id', id)
  }
  return id
}


export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  loading: false,
  error: null,
  playerId: getOrCreatePlayerId(),
  playerSide: null,

  fetchSession: async (joinCode) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('sessions')
      .select()
      .eq('join_code', joinCode.toUpperCase())
      .single()

    if (error || !data) {
      set({ loading: false, error: 'Session not found.' })
      return
    }

    get().setSession(data)
    set({ loading: false })
  },

  setSession: (session) => {
    const { playerId, session: prev, playerSide: currentSide } = get()
    const side = derivePlayerSide(session, playerId)
    // Preserve existing playerSide if derivePlayerSide can't resolve it —
    // avoids nulling out a known side during transient Realtime race conditions.
    const resolvedSide = side ?? currentSide

    // Guard against out-of-order Realtime events: if we already have
    // debate_transcript or judgment, never discard them — a delayed earlier
    // event (e.g. the 'debating' update that has no transcript yet) arriving
    // after a later event (e.g. the 'judging' update that wrote the transcript)
    // would otherwise blank the transcript mid-reveal.
    const resolvedSession: Session = prev
      ? {
          ...session,
          debate_transcript: session.debate_transcript ?? prev.debate_transcript,
          judgment: session.judgment ?? prev.judgment,
        }
      : session

    set({ session: resolvedSession, playerSide: resolvedSide })

    // Trigger debate only when we witness the transition to both-ready.
    // Requires prev !== null so a page refresh (prev = null) never re-triggers
    // a debate that's already running server-side.
    const bothJustReady =
      prev !== null &&
      resolvedSession.status === 'prompting' &&
      resolvedSession.player_a?.ready &&
      resolvedSession.player_b?.ready &&
      !(prev.player_a?.ready && prev.player_b?.ready)

    if (bothJustReady && resolvedSide === 'a') {
      get().triggerDebate()
    }
  },

  createSession: async (title, name, config) => {
    const { playerId } = get()
    set({ loading: true, error: null })

    const joinCode = generateJoinCode()
    const player_a = { id: playerId, name, brief: null, tone: null, ready: false }
    const sessionConfig = {
      time_limit_seconds: 300,
      char_limit: null,
      ...config,
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        join_code: joinCode,
        title,
        status: 'waiting',
        config: sessionConfig,
        player_a,
      })
      .select()
      .single()

    if (error) {
      set({ loading: false, error: error.message })
      throw error
    }

    set({
      session: data,
      playerSide: 'a',
      loading: false,
    })

    return joinCode
  },

  joinSession: async (joinCode, name) => {
    const { playerId } = get()
    set({ loading: true, error: null })

    // Fetch current session
    const { data: existing, error: fetchError } = await supabase
      .from('sessions')
      .select()
      .eq('join_code', joinCode.toUpperCase())
      .single()

    if (fetchError || !existing) {
      set({ loading: false, error: 'Session not found.' })
      throw new Error('Session not found')
    }

    if (existing.status !== 'waiting') {
      set({ loading: false, error: 'This session is no longer accepting players.' })
      throw new Error('Session not in waiting state')
    }

    if (existing.player_b !== null) {
      set({ loading: false, error: 'This session is already full.' })
      throw new Error('Session full')
    }

    const player_b = { id: playerId, name, brief: null, tone: null, ready: false }

    const { data, error } = await supabase
      .from('sessions')
      .update({ player_b, status: 'prompting' })
      .eq('join_code', joinCode.toUpperCase())
      .select()
      .single()

    if (error) {
      set({ loading: false, error: error.message })
      throw error
    }

    set({
      session: data,
      playerSide: 'b',
      loading: false,
    })
  },

  submitBrief: async (brief, tone) => {
    const { session, playerSide } = get()
    if (!session || !playerSide) return

    const playerKey = playerSide === 'a' ? 'player_a' : 'player_b'
    const currentPlayer = session[playerKey]
    if (!currentPlayer) return

    const updatedPlayer = { ...currentPlayer, brief, tone: tone ?? null, ready: true }

    const { data, error } = await supabase
      .from('sessions')
      .update({ [playerKey]: updatedPlayer })
      .eq('id', session.id)
      .select()
      .single()

    if (error) {
      set({ error: error.message })
      throw error
    }

    get().setSession(data)
    // Both-ready detection is handled inside setSession so it also fires
    // when the other player's update arrives via Realtime.
  },

  triggerDebate: async () => {
    const { session } = get()
    if (!session) return

    try {
      await fetch('/.netlify/functions/debate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id }),
      })
    } catch (err) {
      console.error('Failed to trigger debate function:', err)
    }
  },

  retryDebate: async () => {
    const { session } = get()
    if (!session) return

    set({ loading: true, error: null })

    // Reset to prompting and clear stale transcript/judgment so the merge
    // logic in setSession doesn't carry old data into the new run.
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'prompting', error_message: null, debate_transcript: null, judgment: null })
      .eq('id', session.id)

    if (error) {
      set({ loading: false, error: 'Retry failed — please refresh the page.' })
      return
    }

    set({ loading: false })
    await get().triggerDebate()
  },

  cancelSession: async () => {
    const { session } = get()
    if (!session) return

    await supabase
      .from('sessions')
      .update({ status: 'error', error_message: 'Session was cancelled by the host.' })
      .eq('id', session.id)
  },

  subscribeToSession: (joinCode) => {
    const code = joinCode.toUpperCase()
    const channel = supabase
      .channel(`session:${code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `join_code=eq.${code}`,
        },
        (payload) => {
          const updated = payload.new as Session
          // Guard: only process events for our session (defence against
          // server-side filter not evaluating correctly in some Supabase
          // configurations).
          if (updated?.join_code === code) {
            get().setSession(updated)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.debug(`[Realtime] subscribed to session ${code}`)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Realtime] subscription ${status} for session ${code}`, err)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
