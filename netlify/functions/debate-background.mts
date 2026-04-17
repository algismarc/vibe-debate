/**
 * Netlify Background Function — orchestrates the full debate lifecycle.
 *
 * Flow:
 *   1. Validate session (status must be 'prompting', both briefs present)
 *   2. Call Claude → full 3-round debate transcript
 *   3. Call Claude → judge scores + winner + summary (JSON)
 *   4. Write results to Supabase; clients update via Realtime
 *
 * Returns 202 immediately; all state flows through Supabase Realtime.
 */
import type { Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const config: Config = { type: 'background' }

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player {
  id: string
  name: string
  brief: string | null
  tone: string | null
  ready: boolean
}

interface Session {
  id: string
  join_code: string
  title: string
  status: string
  player_a: Player
  player_b: Player
}

interface Judgment {
  for_highlights: string[]
  against_highlights: string[]
  consensus: string
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const DEBATE_SYSTEM = `You are a debate scriptwriter. You will receive a debate topic and two strategy briefs — one for the FOR side, one for the AGAINST side. Write a punchy, data-driven 3-round debate between two skilled debaters.

Rules:
- Each debater follows their strategist's brief as closely as possible.
- Each turn MUST be very short: exactly 2–3 bullet points. No more. No prose paragraphs.
- Every bullet point should include a specific statistic, figure, study, or concrete data point where possible. Make the numbers real and plausible.
- Rebuttals must directly counter specific numbers or claims the other side made — don't just pivot, challenge the data.
- Keep language sharp and direct. No filler. No waffle.
- Do not editorialize or add commentary. Write only the debate itself.
- Do not declare a winner. That is not your job.

Format your response EXACTLY like this, including the headers:

## Round 1: Opening Statements

**FOR:** [2–3 bullet points with stats]

**AGAINST:** [2–3 bullet points with stats]

## Round 2: Rebuttals

**FOR:** [2–3 bullet points directly countering AGAINST's data]

**AGAINST:** [2–3 bullet points directly countering FOR's data]

## Round 3: Closing Arguments

**FOR:** [2–3 bullet points, strongest data first]

**AGAINST:** [2–3 bullet points, strongest data first]`

const JUDGE_SYSTEM = `You are a thoughtful debate moderator. Your job is NOT to pick a winner — it is to find common ground and highlight the strongest contributions from each side.

Read the full debate and identify:
1. The 2–3 strongest, most compelling points made by the FOR side
2. The 2–3 strongest, most compelling points made by the AGAINST side
3. A consensus: what do both sides actually agree on beneath the argument? What insight emerges when you combine their best points? Write 2–3 sentences that a reasonable person on either side could accept.

Keep each highlight to one punchy sentence. The consensus should feel like a genuine synthesis, not a cop-out.

Respond with ONLY valid JSON, no markdown fences, no preamble:
{"for_highlights":["point 1","point 2","point 3"],"against_highlights":["point 1","point 2","point 3"],"consensus":"2–3 sentence synthesis here."}`

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async (req: Request) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  let session_id: string
  try {
    const body = await req.json()
    session_id = body.session_id
    if (!session_id) throw new Error('Missing session_id')
  } catch {
    console.error('debate-background: invalid request body')
    return
  }

  // ── Fetch & validate ───────────────────────────────────────────────────────

  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select()
    .eq('id', session_id)
    .single()

  if (fetchError || !session) {
    console.error('debate-background: session not found', session_id)
    return
  }

  const s = session as Session

  if (s.status !== 'prompting') {
    console.log(`debate-background: session ${session_id} is already ${s.status}, skipping`)
    return
  }

  if (!s.player_a?.brief || !s.player_b?.brief) {
    console.error('debate-background: missing briefs for session', session_id)
    return
  }

  // ── Global hourly rate limit ───────────────────────────────────────────────
  // Counts debates that have moved past 'waiting' in the last hour.
  // Prevents a bot from burning credits by flooding session creation.

  const HOURLY_DEBATE_LIMIT = 20
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentDebates } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'waiting')
    .gte('created_at', hourAgo)

  if ((recentDebates ?? 0) >= HOURLY_DEBATE_LIMIT) {
    console.warn(`debate-background: hourly limit reached (${recentDebates} debates in last hour)`)
    await setError(supabase, session_id, 'Service is temporarily at capacity. Please try again later.')
    return
  }

  // ── Cap input lengths server-side ─────────────────────────────────────────
  // Prevents oversized briefs / titles from inflating token costs.

  const title = s.title.slice(0, 200)
  const playerA = { ...s.player_a, brief: s.player_a.brief.slice(0, 2000) }
  const playerB = { ...s.player_b, brief: s.player_b.brief.slice(0, 2000) }

  // ── Set status → debating ─────────────────────────────────────────────────

  await supabase
    .from('sessions')
    .update({ status: 'debating', error_message: null })
    .eq('id', session_id)

  // ── Call Claude: debate generation ────────────────────────────────────────

  let transcript: string
  try {
    const debateMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      temperature: 0.9,
      system: DEBATE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildDebatePrompt(title, playerA, playerB),
        },
      ],
    })

    const block = debateMsg.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text in debate response')
    transcript = block.text
  } catch (err) {
    console.error('debate-background: debate generation failed', err)
    await setError(supabase, session_id, 'Debate generation failed. Please retry.')
    return
  }

  // ── Write transcript, set status → judging ────────────────────────────────

  await supabase
    .from('sessions')
    .update({ debate_transcript: transcript, status: 'judging' })
    .eq('id', session_id)

  // ── Call Claude: judgment ─────────────────────────────────────────────────

  let rawJudgment: string
  try {
    const judgeMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 0.3,
      system: JUDGE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Debate topic: "${title}"\n\n${transcript}\n\nJudge this debate now.`,
        },
      ],
    })

    const block = judgeMsg.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text in judge response')
    rawJudgment = block.text
  } catch (err) {
    console.error('debate-background: judgment call failed', err)
    await setError(supabase, session_id, 'Judging failed. Please retry.')
    return
  }

  // ── Parse judgment JSON ───────────────────────────────────────────────────

  let judgment = parseJudgment(rawJudgment)

  if (!judgment) {
    // Retry with a stricter follow-up
    try {
      const retryMsg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        temperature: 0,
        system: JUDGE_SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Debate topic: "${title}"\n\n${transcript}\n\nJudge this debate now.`,
          },
          { role: 'assistant', content: rawJudgment },
          {
            role: 'user',
            content:
              'Your previous response was not valid JSON. Respond ONLY with the JSON object. No markdown fences, no preamble, no explanation.',
          },
        ],
      })

      const block = retryMsg.content.find(b => b.type === 'text')
      if (block && block.type === 'text') {
        judgment = parseJudgment(block.text)
      }
    } catch (err) {
      console.error('debate-background: judgment retry failed', err)
    }
  }

  if (!judgment) {
    await setError(supabase, session_id, 'Judge returned invalid data after retry. Please retry.')
    return
  }

  // ── Write judgment, set status → complete ─────────────────────────────────

  await supabase
    .from('sessions')
    .update({ judgment, status: 'complete' })
    .eq('id', session_id)

  console.log(`debate-background: session ${session_id} complete. Topic: "${title}"`)

}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildDebatePrompt(title: string, playerA: Player, playerB: Player): string {
  const toneInstruction = (tone: string | null) =>
    tone ? `Tone: ${tone} — let this define the voice and manner of delivery throughout.` : 'Tone: balanced and professional.'

  return `Debate topic: "${title}"

FOR strategist's brief:
---
${playerA.brief}
---
${toneInstruction(playerA.tone)}

AGAINST strategist's brief:
---
${playerB.brief}
---
${toneInstruction(playerB.tone)}

Write the debate now.`
}

export function parseJudgment(text: string): Judgment | null {
  // Strip markdown fences if present
  const cleaned = text.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim()

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned)
    if (isValidJudgment(parsed)) return parsed
  } catch {}

  // Try extracting the first {...} block
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (isValidJudgment(parsed)) return parsed
    } catch {}
  }

  return null
}

export function isValidJudgment(obj: unknown): obj is Judgment {
  if (typeof obj !== 'object' || obj === null) return false
  const j = obj as Record<string, unknown>

  if (typeof j.consensus !== 'string' || j.consensus.length < 10) return false
  if (!Array.isArray(j.for_highlights) || j.for_highlights.length === 0) return false
  if (!Array.isArray(j.against_highlights) || j.against_highlights.length === 0) return false
  if (!j.for_highlights.every((h: unknown) => typeof h === 'string')) return false
  if (!j.against_highlights.every((h: unknown) => typeof h === 'string')) return false

  return true
}

async function setError(
  supabase: ReturnType<typeof createClient>,
  session_id: string,
  message: string,
) {
  await supabase
    .from('sessions')
    .update({ status: 'error', error_message: message })
    .eq('id', session_id)
}
