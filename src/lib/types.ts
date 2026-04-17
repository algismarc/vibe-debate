export interface Player {
  id: string
  name: string
  brief: string | null
  tone: string | null
  ready: boolean
}

export interface Config {
  time_limit_seconds: number
  char_limit: number | null
}

export interface Judgment {
  for_highlights: string[]
  against_highlights: string[]
  consensus: string
}

export type SessionStatus =
  | 'waiting'
  | 'prompting'
  | 'debating'
  | 'judging'
  | 'complete'
  | 'error'

export interface Session {
  id: string
  join_code: string
  title: string
  status: SessionStatus
  config: Config
  player_a: Player
  player_b: Player | null
  debate_transcript: string | null
  judgment: Judgment | null
  error_message: string | null
  created_at: string
  updated_at: string
}
