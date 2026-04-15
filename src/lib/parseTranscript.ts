export interface Turn {
  side: 'for' | 'against'
  text: string
}

export interface Round {
  title: string
  turns: Turn[]
}

export function parseTranscript(raw: string): Round[] {
  const rounds: Round[] = []
  const roundBlocks = raw.split(/^## /m).filter(Boolean)

  for (const block of roundBlocks) {
    const lines = block.trim().split('\n')
    const title = lines[0].trim()
    const body = lines.slice(1).join('\n')

    const turns: Turn[] = []
    const forMatch = body.match(/\*\*FOR:\*\*\s*([\s\S]*?)(?=\*\*AGAINST:\*\*|$)/)
    const againstMatch = body.match(/\*\*AGAINST:\*\*\s*([\s\S]*?)$/)

    if (forMatch) turns.push({ side: 'for', text: forMatch[1].trim() })
    if (againstMatch) turns.push({ side: 'against', text: againstMatch[1].trim() })

    if (turns.length > 0) rounds.push({ title, turns })
  }

  return rounds
}

export function countTurns(rounds: Round[]): number {
  return rounds.reduce((n, r) => n + r.turns.length, 0)
}
