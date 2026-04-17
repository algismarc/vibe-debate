import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSessionStore } from './sessionStore'
import type { Session } from '../lib/types'

// Mock Supabase so no real network calls are made when the module loads
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

const basePlayer = (id: string, name: string, ready = false) => ({
  id,
  name,
  brief: 'My brief' as string | null,
  tone: null as string | null,
  ready,
})

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  join_code: 'ABCDEF',
  title: 'Test debate',
  status: 'prompting',
  config: { time_limit_seconds: 300, char_limit: null },
  player_a: basePlayer('player-a-id', 'Alice'),
  player_b: basePlayer('player-b-id', 'Bob'),
  debate_transcript: null,
  judgment: null,
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', mockFetch)
  // Reset store to a clean state with a known player ID
  useSessionStore.setState({
    session: null,
    loading: false,
    error: null,
    playerSide: null,
    playerId: 'player-a-id',
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('setSession — both-ready detection', () => {
  it('does NOT call triggerDebate when prev session is null (page refresh scenario)', () => {
    // Store starts with session=null, so prev will be null on first setSession call
    useSessionStore.getState().setSession(
      makeSession({
        player_a: basePlayer('player-a-id', 'Alice', true),
        player_b: basePlayer('player-b-id', 'Bob', true),
      }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does NOT call triggerDebate when only player_a is ready', () => {
    useSessionStore.getState().setSession(makeSession()) // establish prev
    useSessionStore.getState().setSession(
      makeSession({
        player_a: basePlayer('player-a-id', 'Alice', true),
        player_b: basePlayer('player-b-id', 'Bob', false),
      }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does NOT call triggerDebate when only player_b is ready', () => {
    useSessionStore.getState().setSession(makeSession()) // establish prev
    useSessionStore.getState().setSession(
      makeSession({
        player_a: basePlayer('player-a-id', 'Alice', false),
        player_b: basePlayer('player-b-id', 'Bob', true),
      }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('DOES call triggerDebate when both players flip ready and current player is side a', () => {
    useSessionStore.getState().setSession(makeSession()) // establish prev (both not ready)
    useSessionStore.getState().setSession(
      makeSession({
        status: 'prompting',
        player_a: basePlayer('player-a-id', 'Alice', true),
        player_b: basePlayer('player-b-id', 'Bob', true),
      }),
    )
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      '/.netlify/functions/debate-background',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('does NOT call triggerDebate when both ready but current player is side b', () => {
    useSessionStore.setState({ playerId: 'player-b-id' })
    useSessionStore.getState().setSession(makeSession()) // establish prev
    useSessionStore.getState().setSession(
      makeSession({
        player_a: basePlayer('player-a-id', 'Alice', true),
        player_b: basePlayer('player-b-id', 'Bob', true),
      }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does NOT call triggerDebate again when status moves away from prompting', () => {
    useSessionStore.getState().setSession(makeSession())

    // Both flip ready — triggers once
    useSessionStore.getState().setSession(
      makeSession({
        status: 'prompting',
        player_a: basePlayer('player-a-id', 'Alice', true),
        player_b: basePlayer('player-b-id', 'Bob', true),
      }),
    )

    // Status advances to debating — should NOT trigger again
    useSessionStore.getState().setSession(
      makeSession({
        status: 'debating',
        player_a: basePlayer('player-a-id', 'Alice', true),
        player_b: basePlayer('player-b-id', 'Bob', true),
      }),
    )

    expect(mockFetch).toHaveBeenCalledOnce()
  })
})
