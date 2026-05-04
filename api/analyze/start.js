import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

export const config = { maxDuration: 30 }

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { trackId, instrumentalUrl } = req.body
  if (!trackId) return res.status(400).json({ error: 'trackId required' })

  const { data: trackRow } = await supabase
    .from('tracks')
    .select('title, artist')
    .eq('id', trackId)
    .single()
  const title  = trackRow?.title  || ''
  const artist = trackRow?.artist || ''

  await supabase.from('track_analyses').upsert(
    { track_id: trackId, share_status: 'processing', updated_at: new Date().toISOString() },
    { onConflict: 'track_id' }
  )

  try {
    // GPT-4o-mini: 공유 콘텐츠 생성 (MR 트랙 기반)
    const mrHint = instrumentalUrl
      ? ' Based on the instrumental (MR) track — pure music, no vocals.'
      : ''

    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a music content creator.${mrHint} Create viral sharing content for the song and return JSON with:
- share_title: catchy hook title under 40 chars (Korean if the song seems Korean)
- share_desc: engaging 1-2 sentence description (Korean if the song seems Korean)
- share_tags: array of 6-8 hashtags, always include #WAVERSE, mix Korean and English
Return ONLY valid JSON.`,
        },
        { role: 'user', content: `Song: "${title}" by "${artist}".` },
      ],
    })

    let ai = {}
    try { ai = JSON.parse(gptRes.choices[0].message.content) } catch (_) {}

    await supabase.from('track_analyses').upsert(
      {
        track_id:    trackId,
        share_title: ai.share_title || title,
        share_desc:  ai.share_desc  || '',
        share_tags:  ai.share_tags  || ['#WAVERSE'],
        share_status: 'done',
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'track_id' }
    )

    res.json({ ok: true })
  } catch (err) {
    console.error('[analyze/start]', err.message)
    await supabase.from('track_analyses').upsert(
      {
        track_id:    trackId,
        share_status: 'error',
        error_info:  { message: err.message },
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'track_id' }
    )
    res.status(500).json({ error: err.message })
  }
}
