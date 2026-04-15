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
  scores: {
    for: { argument: number; persuasiveness: number; evidence: number; rhetoric: number; total: number }
    against: { argument: number; persuasiveness: number; evidence: number; rhetoric: number; total: number }
  }
  winner: 'for' | 'against' | 'tie'
  summary: string
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

const DEBATE_SYSTEM = `You are a debate scriptwriter. You will receive a debate topic and two strategy briefs — one for the FOR side, one for the AGAINST side. Write a realistic, engaging 3-round debate between two skilled debaters.

Rules:
- Each debater follows their strategist's brief as closely as possible.
- Each turn should be roughly 150-250 words.
- The debate should feel like two distinct voices, not one author.
- Rebuttals must directly engage with what the other side actually argued in prior rounds.
- Do not editorialize or add commentary. Write only the debate itself.
- Do not declare a winner. That is not your job.

Format your response EXACTLY like this, including the headers:

## Round 1: Opening Statements

**FOR:** [Debater A's opening argument]

**AGAINST:** [Debater B's opening argument]

## Round 2: Rebuttals

**FOR:** [Debater A's rebuttal to B's opening]

**AGAINST:** [Debater B's rebuttal to A's opening]

## Round 3: Closing Arguments

**FOR:** [Debater A's closing]

**AGAINST:** [Debater B's closing]`

const JUDGE_SYSTEM = `You are a rigorous, neutral debate judge with a background in formal argumentation, logic, and rhetoric. You have no stake in the outcome. Your job is to evaluate what actually happened in this debate — not what could have been argued, but what was argued.

Score each debater on these four criteria (1–10 scale). Be discriminating: a 7 means genuinely good, a 9 means exceptional. Do not cluster scores around the middle to seem balanced.

1. Argument Strength — Were the core claims logically sound and well-structured? Did they build a coherent case across all three rounds, or just make isolated points? Penalise logical fallacies, unsupported assertions, and internal contradictions.

2. Persuasiveness — Would a sceptical, neutral observer actually be moved? Distinguish between arguments that sound good and arguments that genuinely shift the burden of proof.

3. Evidence & Reasoning — Did they ground claims in concrete reasoning, real-world examples, data, or analogies? Vague generalities score low. Specific, well-deployed evidence scores high.

4. Rhetorical Skill — Was the language precise and effective? Did they control the framing of the debate? Did they anticipate and neutralise the other side's strongest points?

The total is the sum of all four scores (max 40).

For your summary: write exactly 3 paragraphs as a sharp, analytical third-party observer. Paragraph 1: identify the decisive factor that separated the two sides — what did the winner do that the loser did not? Paragraph 2: identify the weakest moment or missed opportunity for each debater — be specific, quote or closely paraphrase the debate. Paragraph 3: deliver the verdict with clear reasoning tied directly to the scores.

Do not be diplomatic. Do not hedge. If one side was significantly stronger, say so and explain why.

Declare a winner. Only call a tie if the totals are equal AND the quality of argumentation is genuinely indistinguishable across all criteria.

Respond with ONLY valid JSON, no markdown fences, no preamble:
{"scores":{"for":{"argument":N,"persuasiveness":N,"evidence":N,"rhetoric":N,"total":N},"against":{"argument":N,"persuasiveness":N,"evidence":N,"rhetoric":N,"total":N}},"winner":"for"|"against"|"tie","summary":"Your 3-paragraph ruling here."}`

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
      max_tokens: 3000,
      temperature: 0.9,
      system: DEBATE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildDebatePrompt(s.title, s.player_a.brief, s.player_b.brief),
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
      max_tokens: 1000,
      temperature: 0.3,
      system: JUDGE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Debate topic: "${s.title}"\n\n${transcript}\n\nJudge this debate now.`,
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
        max_tokens: 1000,
        temperature: 0,
        system: JUDGE_SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Debate topic: "${s.title}"\n\n${transcript}\n\nJudge this debate now.`,
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

  console.log(`debate-background: session ${session_id} complete. Winner: ${judgment.winner}`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDebatePrompt(title: string, briefFor: string, briefAgainst: string): string {
  return `Debate topic: "${title}"

FOR strategist's brief:
---
${briefFor}
---

AGAINST strategist's brief:
---
${briefAgainst}
---

Write the debate now.`
}

function parseJudgment(text: string): Judgment | null {
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

function isValidJudgment(obj: unknown): obj is Judgment {
  if (typeof obj !== 'object' || obj === null) return false
  const j = obj as Record<string, unknown>

  if (!['for', 'against', 'tie'].includes(j.winner as string)) return false
  if (typeof j.summary !== 'string' || j.summary.length < 10) return false

  const scores = j.scores as Record<string, unknown>
  if (!scores?.for || !scores?.against) return false

  for (const side of ['for', 'against'] as const) {
    const s = scores[side] as Record<string, unknown>
    if (!s) return false
    for (const key of ['argument', 'persuasiveness', 'evidence', 'rhetoric', 'total']) {
      if (typeof s[key] !== 'number') return false
    }
  }

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
