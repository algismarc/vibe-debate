import { describe, it, expect } from 'vitest'
import { generateJoinCode, derivePlayerSide } from './utils'
import type { Session } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const baseSession: Session = {
  id: 'session-1',
  join_code: 'ABCDEF',
  title: 'Test debate',
  status: 'waiting',
  config: { time_limit_seconds: 300, char_limit: null },
  player_a: { id: 'player-a', name: 'Alice', brief: null, tone: null, ready: false },
  player_b: null,
  debate_transcript: null,
  judgment: null,
  error_message: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ─── generateJoinCode ─────────────────────────────────────────────────────────

describe('generateJoinCode', () => {
  it('always returns exactly 6 characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateJoinCode()).toHaveLength(6)
    }
  })

  it('only contains uppercase letters and digits', () => {
    for (let i = 0; i < 30; i++) {
      expect(generateJoinCode()).toMatch(/^[A-Z2-9]+$/)
    }
  })

  it('never contains ambiguous characters (0, O, 1, I, L)', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateJoinCode()).not.toMatch(/[0O1IL]/)
    }
  })

  it('produces different codes across calls', () => {
    const codes = new Set(Array.from({ length: 10 }, generateJoinCode))
    expect(codes.size).toBeGreaterThan(1)
  })
})

// ─── derivePlayerSide ─────────────────────────────────────────────────────────

describe('derivePlayerSide', () => {
  it("returns 'a' when playerId matches player_a.id", () => {
    expect(derivePlayerSide(baseSession, 'player-a')).toBe('a')
  })

  it("returns 'b' when playerId matches player_b.id", () => {
    const session: Session = {
      ...baseSession,
      player_b: { id: 'player-b', name: 'Bob', brief: null, tone: null, ready: false },
    }
    expect(derivePlayerSide(session, 'player-b')).toBe('b')
  })

  it('returns null when playerId matches neither player', () => {
    expect(derivePlayerSide(baseSession, 'unknown-id')).toBeNull()
  })

  it('returns null when player_b is null and id would match player_b', () => {
    // player_b is null so there is no b slot to match
    expect(derivePlayerSide(baseSession, 'player-b')).toBeNull()
  })
})
