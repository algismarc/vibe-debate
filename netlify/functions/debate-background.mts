/**
 * Netlify Background Function — generates debate transcript and judgment.
 * Returns 202 immediately; all state updates go through Supabase Realtime.
 *
 * Phase 5 implementation: LLM calls and judgment logic go here.
 */
import type { Config } from '@netlify/functions'

export const config: Config = {
  type: 'background',
}

export default async (req: Request) => {
  // TODO (Phase 5): implement debate generation and judging
  const body = await req.json().catch(() => ({}))
  console.log('debate-background called with session_id:', body.session_id)
}
