import { describe, it, expect } from 'vitest'
import { parseTranscript, countTurns } from './parseTranscript'

const FULL_TRANSCRIPT = `## Round 1: Opening Statements

**FOR:** The FOR argument for round 1.

**AGAINST:** The AGAINST argument for round 1.

## Round 2: Rebuttals

**FOR:** The FOR rebuttal.

**AGAINST:** The AGAINST rebuttal.

## Round 3: Closing Arguments

**FOR:** The FOR closing.

**AGAINST:** The AGAINST closing.`

describe('parseTranscript', () => {
  it('parses a well-formed 3-round transcript into 3 rounds', () => {
    const rounds = parseTranscript(FULL_TRANSCRIPT)
    expect(rounds).toHaveLength(3)
  })

  it('extracts correct round titles', () => {
    const rounds = parseTranscript(FULL_TRANSCRIPT)
    expect(rounds[0].title).toBe('Round 1: Opening Statements')
    expect(rounds[1].title).toBe('Round 2: Rebuttals')
    expect(rounds[2].title).toBe('Round 3: Closing Arguments')
  })

  it('extracts FOR and AGAINST turns for each round', () => {
    const rounds = parseTranscript(FULL_TRANSCRIPT)
    expect(rounds[0].turns).toHaveLength(2)
    expect(rounds[0].turns[0].side).toBe('for')
    expect(rounds[0].turns[1].side).toBe('against')
  })

  it('trims whitespace from turn text', () => {
    const rounds = parseTranscript(FULL_TRANSCRIPT)
    expect(rounds[0].turns[0].text).toBe('The FOR argument for round 1.')
    expect(rounds[0].turns[1].text).toBe('The AGAINST argument for round 1.')
  })

  it('returns empty array for an empty string', () => {
    expect(parseTranscript('')).toEqual([])
  })

  it('returns empty array for plain text with no ## headers', () => {
    expect(parseTranscript('just some text with no round headers')).toEqual([])
  })

  it('handles a missing AGAINST turn gracefully', () => {
    const partial = '## Round 1: Opening Statements\n\n**FOR:** Only FOR here.'
    const rounds = parseTranscript(partial)
    expect(rounds).toHaveLength(1)
    expect(rounds[0].turns).toHaveLength(1)
    expect(rounds[0].turns[0].side).toBe('for')
  })

  it('handles a missing FOR turn gracefully', () => {
    const partial = '## Round 1: Opening Statements\n\n**AGAINST:** Only AGAINST here.'
    const rounds = parseTranscript(partial)
    expect(rounds).toHaveLength(1)
    expect(rounds[0].turns).toHaveLength(1)
    expect(rounds[0].turns[0].side).toBe('against')
  })

  it('ignores rounds with no recognisable speaker turns', () => {
    const noTurns = '## Round 1: Opening Statements\n\nNo speaker labels here at all.'
    expect(parseTranscript(noTurns)).toHaveLength(0)
  })

  it('handles extra whitespace between sections without error', () => {
    const spaced = '## Round 1: Opening\n\n\n**FOR:**   Spaced argument.   \n\n\n**AGAINST:**   Another argument.   '
    const rounds = parseTranscript(spaced)
    expect(rounds[0].turns[0].text).toBe('Spaced argument.')
    expect(rounds[0].turns[1].text).toBe('Another argument.')
  })
})

describe('countTurns', () => {
  it('returns 6 for a full 3-round debate', () => {
    expect(countTurns(parseTranscript(FULL_TRANSCRIPT))).toBe(6)
  })

  it('returns 0 for an empty array', () => {
    expect(countTurns([])).toBe(0)
  })
})
