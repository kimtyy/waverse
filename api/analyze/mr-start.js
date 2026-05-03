import { createClient } from '@supabase/supabase-js'

export const config = { maxDuration: 15 }

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Replicate: https://replicate.com/cjwbw/demucs — copy the version hash from the model page
const DEMUCS_VERSION =
  process.env.REPLICATE_DEMUCS_VERSION ||
  '25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { trackId, audioUrl } = req.body
  if (!trackId || !audioUrl) return res.status(400).json({ error: 'Missing params' })

  await supabase.from('track_analyses').upsert(
    { track_id: trackId, mr_status: 'processing', updated_at: new Date().toISOString() },
    { onConflict: 'track_id' }
  )

  if (!process.env.REPLICATE_API_TOKEN) {
    await supabase.from('track_analyses').upsert(
      { track_id: trackId, mr_status: 'error', error_info: { mr: 'REPLICATE_API_TOKEN not set' }, updated_at: new Date().toISOString() },
      { onConflict: 'track_id' }
    )
    return res.status(200).json({ ok: false, reason: 'REPLICATE_API_TOKEN not configured' })
  }

  try {
    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: DEMUCS_VERSION,
        input: {
          audio: audioUrl,
          model: 'htdemucs',
          stem: 'vocals',        // outputs vocals + no_vocals (2-stem)
          output_format: 'mp3',
          jobs: 1,
        },
      }),
    })

    const prediction = await replicateRes.json()
    if (prediction.detail) throw new Error(prediction.detail)

    await supabase.from('track_analyses').upsert(
      { track_id: trackId, mr_prediction_id: prediction.id, updated_at: new Date().toISOString() },
      { onConflict: 'track_id' }
    )

    res.json({ ok: true, predictionId: prediction.id })
  } catch (err) {
    console.error('[mr-start]', err.message)
    await supabase.from('track_analyses').upsert(
      { track_id: trackId, mr_status: 'error', error_info: { mr: err.message }, updated_at: new Date().toISOString() },
      { onConflict: 'track_id' }
    )
    res.status(500).json({ error: err.message })
  }
}
