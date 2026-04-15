import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Session, Config } from '../lib/types'

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
  submitBrief: (brief: string) => Promise<void>
  triggerDebate: () => Promise<void>
  subscribeToSession: (joinCode: string) => () => void

  // Internal
  setSession: (session: Session) => void
}

function getOrCreatePlayerId(): string {
  let id = sessionStorage.getItem('vibe-debate-player-id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('vibe-debate-player-id', id)
  }
  return id
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function derivePlayerSide(session: Session, playerId: string): 'a' | 'b' | null {
  if (session.player_a?.id === playerId) return 'a'
  if (session.player_b?.id === playerId) return 'b'
  return null
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
    const { playerId, session: prev } = get()
    const side = derivePlayerSide(session, playerId)
    set({ session, playerSide: side })

    // Trigger debate only when we witness the transition to both-ready.
    // Requires prev !== null so a page refresh (prev = null) never re-triggers
    // a debate that's already running server-side.
    const bothJustReady =
      prev !== null &&
      session.status === 'prompting' &&
      session.player_a?.ready &&
      session.player_b?.ready &&
      !(prev.player_a?.ready && prev.player_b?.ready)

    if (bothJustReady && side === 'a') {
      get().triggerDebate()
    }
  },

  createSession: async (title, name, config) => {
    const { playerId } = get()
    set({ loading: true, error: null })

    const joinCode = generateJoinCode()
    const player_a = { id: playerId, name, brief: null, ready: false }
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

    const player_b = { id: playerId, name, brief: null, ready: false }

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

  submitBrief: async (brief) => {
    const { session, playerSide } = get()
    if (!session || !playerSide) return

    const playerKey = playerSide === 'a' ? 'player_a' : 'player_b'
    const currentPlayer = session[playerKey]
    if (!currentPlayer) return

    const updatedPlayer = { ...currentPlayer, brief, ready: true }

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

  subscribeToSession: (joinCode) => {
    const channel = supabase
      .channel(`session:${joinCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `join_code=eq.${joinCode}`,
        },
        (payload) => {
          get().setSession(payload.new as Session)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
