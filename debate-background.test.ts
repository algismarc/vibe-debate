import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks (must be defined before any imports) ───────────────────────
// vi.hoisted ensures these variables exist when the vi.mock factory functions run.

const { mockSingle, mockUpdateEq, mockUpdateFn, mockFrom, mockCreate, mockGte } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockUpdateEq = vi.fn()
  const mockUpdateFn = vi.fn()  // tracks every .update({...}) call — statuses live here
  const mockFrom = vi.fn()
  const mockCreate = vi.fn()
  const mockGte = vi.fn()       // terminal for the rate-limit .neq().gte() chain
  return { mockSingle, mockUpdateEq, mockUpdateFn, mockFrom, mockCreate, mockGte }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  // Must use a regular function (not arrow) so `new Anthropic()` works
  default: vi.fn(function () {
    return { messages: { create: mockCreate } }
  }),
}))

// ─── Imports (after mocks are in place) ───────────────────────────────────────

import handler, {
  parseJudgment,
  isValidJudgment,
  buildDebatePrompt,
} from './netlify/functions/debate-background.mts'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const validJudgmentObj = {
  for_highlights: ['Made a strong statistical case', 'Directly countered the opposition data'],
  against_highlights: ['Raised compelling counter-evidence', 'Exposed a flaw in the FOR framing'],
  consensus: 'Both sides agreed that the issue has real complexity. A balanced approach incorporating the strongest data from each side would serve the debate topic best.',
}

const validJudgmentJSON = JSON.stringify(validJudgmentObj)

const mockPlayer = (id: string, brief: string | null = 'Argue hard') => ({
  id,
  name: id === 'player-a' ? 'Alice' : 'Bob',
  brief,
  tone: null as string | null,
  ready: true,
})

const mockSession = (overrides = {}) => ({
  id: 'session-1',
  join_code: 'ABCDEF',
  title: 'Pineapple on pizza',
  status: 'prompting',
  player_a: mockPlayer('player-a'),
  player_b: mockPlayer('player-b'),
  ...overrides,
})

function makeRequest(body: object) {
  return new Request('https://example.com', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  process.env.SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  process.env.ANTHROPIC_API_KEY = 'test-api-key'

  // Default Supabase mock: returns a valid session from .single()
  mockSingle.mockResolvedValue({ data: mockSession(), error: null })
  mockUpdateEq.mockResolvedValue({ error: null })
  mockUpdateFn.mockReturnValue({ eq: mockUpdateEq })

  // Rate-limit query: .select('*', { count: 'exact', head: true }).neq().gte() → { count: 0 }
  mockGte.mockResolvedValue({ count: 0, data: null, error: null })

  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ single: mockSingle }),  // session fetch path
      neq: vi.fn().mockReturnValue({ gte: mockGte }),       // rate-limit path
    }),
    update: mockUpdateFn,
  })

  // Default Anthropic mock: debate transcript + valid judgment
  mockCreate
    .mockResolvedValueOnce({ content: [{ type: 'text', text: '## Round 1: Opening\n\n**FOR:** Arg.\n\n**AGAINST:** Counter.' }] })
    .mockResolvedValueOnce({ content: [{ type: 'text', text: validJudgmentJSON }] })
})

// ─────────────────────────────────────────────────────────────────────────────
// parseJudgment
// ─────────────────────────────────────────────────────────────────────────────

describe('parseJudgment', () => {
  it('parses valid JSON directly', () => {
    expect(parseJudgment(validJudgmentJSON)).toEqual(validJudgmentObj)
  })

  it('strips markdown fences before parsing', () => {
    expect(parseJudgment(`\`\`\`json\n${validJudgmentJSON}\n\`\`\``)).toEqual(validJudgmentObj)
  })

  it('extracts a JSON block embedded in surrounding prose', () => {
    expect(parseJudgment(`Here is my ruling:\n${validJudgmentJSON}\nThat concludes it.`)).toEqual(
      validJudgmentObj,
    )
  })

  it('returns null for completely invalid text', () => {
    expect(parseJudgment('not json at all')).toBeNull()
  })

  it('returns null when JSON structure fails isValidJudgment', () => {
    const bad = JSON.stringify({ winner: 'nobody', summary: 'short', scores: {} })
    expect(parseJudgment(bad)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isValidJudgment
// ─────────────────────────────────────────────────────────────────────────────

describe('isValidJudgment', () => {
  it('returns true for a fully valid judgment object', () => {
    expect(isValidJudgment(validJudgmentObj)).toBe(true)
  })

  it('returns false when consensus is missing', () => {
    const { consensus: _c, ...rest } = validJudgmentObj
    expect(isValidJudgment(rest)).toBe(false)
  })

  it('returns false when consensus is too short (< 10 chars)', () => {
    expect(isValidJudgment({ ...validJudgmentObj, consensus: 'short' })).toBe(false)
  })

  it('returns false when for_highlights is empty', () => {
    expect(isValidJudgment({ ...validJudgmentObj, for_highlights: [] })).toBe(false)
  })

  it('returns false when against_highlights contains a non-string', () => {
    expect(isValidJudgment({ ...validJudgmentObj, against_highlights: [42] })).toBe(false)
  })

  it('returns false when highlights are missing entirely', () => {
    expect(isValidJudgment({ consensus: validJudgmentObj.consensus })).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildDebatePrompt
// ─────────────────────────────────────────────────────────────────────────────

describe('buildDebatePrompt', () => {
  const playerA = mockPlayer('player-a')
  const playerB = { ...mockPlayer('player-b'), brief: 'Argue against', tone: 'aggressive' }

  it('includes the debate title', () => {
    expect(buildDebatePrompt('Pineapple on pizza', playerA, playerB)).toContain(
      'Pineapple on pizza',
    )
  })

  it('includes both player briefs', () => {
    const prompt = buildDebatePrompt('Test topic', playerA, playerB)
    expect(prompt).toContain('Argue hard')
    expect(prompt).toContain('Argue against')
  })

  it('includes tone instruction when a tone is set', () => {
    const prompt = buildDebatePrompt('Test topic', playerA, playerB)
    expect(prompt).toContain('aggressive')
  })

  it('falls back to balanced/professional when tone is null', () => {
    const prompt = buildDebatePrompt('Test topic', playerA, mockPlayer('player-b'))
    expect(prompt).toContain('balanced and professional')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Handler — guard logic
// ─────────────────────────────────────────────────────────────────────────────

describe('handler — guard logic', () => {
  it('skips processing when session status is not prompting', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockSession({ status: 'debating' }),
      error: null,
    })
    await handler(makeRequest({ session_id: 'session-1' }))
    // The 'debating' status update should never be written
    expect(mockUpdateEq).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('skips processing when player_a.brief is null', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockSession({ player_a: mockPlayer('player-a', null) }),
      error: null,
    })
    await handler(makeRequest({ session_id: 'session-1' }))
    expect(mockUpdateEq).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('skips processing when player_b is null', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockSession({ player_b: null }),
      error: null,
    })
    await handler(makeRequest({ session_id: 'session-1' }))
    expect(mockUpdateEq).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Handler — happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('handler — happy path', () => {
  it('transitions through debating → judging → complete and calls Claude twice', async () => {
    await handler(makeRequest({ session_id: 'session-1' }))

    expect(mockCreate).toHaveBeenCalledTimes(2)

    const statuses = mockUpdateFn.mock.calls.map(
      (c: [Record<string, unknown>]) => c[0].status,
    )
    expect(statuses).toContain('debating')
    expect(statuses).toContain('judging')
    expect(statuses).toContain('complete')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Handler — error handling
// ─────────────────────────────────────────────────────────────────────────────

describe('handler — error handling', () => {
  it('retries the judge call once when first response is invalid JSON', async () => {
    mockCreate
      .mockReset()
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: '## Round 1\n\n**FOR:** Arg.\n\n**AGAINST:** Counter.' }],
      }) // debate generation
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'not valid json' }] }) // judge (invalid)
      .mockResolvedValueOnce({ content: [{ type: 'text', text: validJudgmentJSON }] }) // retry (valid)

    await handler(makeRequest({ session_id: 'session-1' }))

    // 3 calls total: debate + judge (invalid) + retry (valid)
    expect(mockCreate).toHaveBeenCalledTimes(3)

    const statuses = mockUpdateFn.mock.calls.map(
      (c: [Record<string, unknown>]) => c[0].status,
    )
    expect(statuses).not.toContain('error')
    expect(statuses).toContain('complete')
  })

  it('sets status to error when the hourly rate limit is exceeded', async () => {
    // Simulate 20 debates already run in the past hour
    mockGte.mockResolvedValueOnce({ count: 20, data: null, error: null })

    await handler(makeRequest({ session_id: 'session-1' }))

    // Claude must never be called
    expect(mockCreate).not.toHaveBeenCalled()

    const statuses = mockUpdateFn.mock.calls.map(
      (c: [Record<string, unknown>]) => c[0].status,
    )
    expect(statuses).toContain('error')
    expect(statuses).not.toContain('debating')
  })

  it('sets status to error when judge returns invalid JSON on both attempts', async () => {
    mockCreate
      .mockReset()
      .mockResolvedValueOnce({
        content: [{ type: 'text', text: '## Round 1\n\n**FOR:** Arg.\n\n**AGAINST:** Counter.' }],
      }) // debate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'not valid json' }] }) // judge attempt 1
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'still not valid json' }] }) // judge attempt 2

    await handler(makeRequest({ session_id: 'session-1' }))

    const statuses = mockUpdateFn.mock.calls.map(
      (c: [Record<string, unknown>]) => c[0].status,
    )
    expect(statuses).toContain('error')
    expect(statuses).not.toContain('complete')
  })
})
