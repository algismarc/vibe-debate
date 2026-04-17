import type { Session } from './types'

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function derivePlayerSide(session: Session, playerId: string): 'a' | 'b' | null {
  if (session.player_a?.id === playerId) return 'a'
  if (session.player_b?.id === playerId) return 'b'
  return null
}
