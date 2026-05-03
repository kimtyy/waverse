import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Vercel Pro: 60s. Hobby plan: 10s (may timeout for long tracks)
export const config = { maxDuration: 60 }

const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { trackId, audioUrl, title = '', artist = '' } = req.body
  if (!trackId || !audioUrl) return res.status(400).json({ error: 'trackId and audioUrl required' })

  // Mark all as processing immediately
  await supabase.from('track_analyses').upsert(
    { track_id: trackId, lyrics_status: 'processing', sheet_status: 'processing', share_status: 'processing', updated_at: new Date().toISOString() },
    { onConflict: 'track_id' }
  )

  try {
    // ── 1. Whisper transcription ──────────────────────────────
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) throw new Error(`Audio fetch failed: ${audioRes.status}`)

    const contentLength = parseInt(audioRes.headers.get('content-length') || '0')
    if (contentLength > 24 * 1024 * 1024) throw new Error('파일이 너무 큽니다 (24MB 이하만 지원)')

    const audioBlob  = await audioRes.blob()
    const ext        = /\.mp4$/i.test(audioUrl) ? 'mp4' : 'mp3'
    const audioFile  = new File([audioBlob], `audio.${ext}`, { type: audioBlob.type || 'audio/mpeg' })

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
    })

    const rawLyrics       = transcription.text?.trim() || ''
    const isInstrumental  = rawLyrics.length < 5
    const lyrics          = isInstrumental ? 'Instrumental' : rawLyrics
    const segments        = transcription.segments || []
    const duration        = transcription.duration || 0

    // Find the 30s window with the most words (highlight)
    let highlightStart = Math.floor(duration * 0.25) // default: 25% into the track
    if (segments.length && duration > 30) {
      let maxWords = 0
      for (const seg of segments) {
        if (seg.start + 30 > duration) break
        const words = segments
          .filter(s => s.start >= seg.start && s.start < seg.start + 30)
          .reduce((n, s) => n + (s.text?.split(' ').length || 0), 0)
        if (words > maxWords) { maxWords = words; highlightStart = Math.floor(seg.start) }
      }
    }

    // ── 2. GPT-4o-mini: sheet analysis + share content ───────
    const context = isInstrumental
      ? `Instrumental track titled "${title}" by "${artist}".`
      : `Song: "${title}" by "${artist}"\n\nLyrics:\n${rawLyrics.slice(0, 1500)}`

    const gptRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: `You are a music analyst. Analyze the song and return JSON with:
- key: musical key (e.g. "Am", "C", "G major")
- bpm: integer tempo estimate
- chords: array of 4-8 chord symbols (typical progression)
- feel: short phrase (e.g. "upbeat pop", "slow ballad", "emotional R&B")
- share_title: catchy hook title under 40 chars, in the same language as lyrics
- share_desc: engaging 1-2 sentence description (Korean if lyrics are Korean)
- share_tags: array of 6-8 hashtags, always include #WAVERSE, mix Korean and English
Return ONLY valid JSON.`,
        },
        { role: 'user', content: context },
      ],
    })

    let ai = {}
    try { ai = JSON.parse(gptRes.choices[0].message.content) } catch (_) {}

    // ── 3. Save everything ────────────────────────────────────
    await supabase.from('track_analyses').upsert(
      {
        track_id:       trackId,
        lyrics,
        lyrics_status:  'done',
        sheet_key:      ai.key   || 'C',
        sheet_bpm:      ai.bpm   || 120,
        sheet_chords:   ai.chords || [],
        sheet_feel:     ai.feel  || '',
        sheet_status:   'done',
        share_title:    ai.share_title || title,
        share_desc:     ai.share_desc  || '',
        share_tags:     ai.share_tags  || ['#WAVERSE'],
        highlight_start: highlightStart,
        share_status:   'done',
        updated_at:     new Date().toISOString(),
      },
      { onConflict: 'track_id' }
    )

    res.json({ ok: true })
  } catch (err) {
    console.error('[analyze/start]', err.message)
    await supabase.from('track_analyses').upsert(
      {
        track_id:     trackId,
        lyrics_status: 'error', sheet_status: 'error', share_status: 'error',
        error_info:   { message: err.message },
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'track_id' }
    )
    res.status(500).json({ error: err.message })
  }
}
