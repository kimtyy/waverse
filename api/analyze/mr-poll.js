import { createClient } from '@supabase/supabase-js'

export const config = { maxDuration: 20 }

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { trackId } = req.query
  if (!trackId) return res.status(400).json({ error: 'trackId required' })

  const { data: row } = await supabase
    .from('track_analyses')
    .select('mr_status, mr_prediction_id, mr_url, vocal_url')
    .eq('track_id', trackId)
    .single()

  if (!row) return res.status(404).json({ status: 'idle' })
  if (row.mr_status === 'done')  return res.json({ status: 'done',  mr_url: row.mr_url, vocal_url: row.vocal_url })
  if (row.mr_status === 'error') return res.json({ status: 'error' })
  if (!row.mr_prediction_id)     return res.json({ status: 'processing' })

  // Poll Replicate prediction
  const replicateRes = await fetch(
    `https://api.replicate.com/v1/predictions/${row.mr_prediction_id}`,
    { headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` } }
  )
  const pred = await replicateRes.json()

  if (pred.status === 'succeeded') {
    const output = pred.output || {}

    // Demucs 2-stem: { vocals, no_vocals }  |  4-stem: { bass, drums, other, vocals }
    const vocalSource = output.vocals || null
    const mrSource    = output.no_vocals || output.other || null

    // Download stems and persist to Supabase Storage (avoids Replicate's 24h URL expiry)
    let mrUrl    = mrSource
    let vocalUrl = vocalSource

    try {
      const { data: track } = await supabase.from('tracks').select('user_id').eq('id', trackId).single()
      const uid = track?.user_id || 'unknown'

      const [mrBuf, vocalBuf] = await Promise.all([
        mrSource    ? fetch(mrSource).then(r => r.arrayBuffer()).catch(() => null)    : Promise.resolve(null),
        vocalSource ? fetch(vocalSource).then(r => r.arrayBuffer()).catch(() => null) : Promise.resolve(null),
      ])

      if (mrBuf) {
        const path = `${uid}/${trackId}_mr.mp3`
        await supabase.storage.from('stems').upload(path, mrBuf, { contentType: 'audio/mpeg', upsert: true })
        const { data } = supabase.storage.from('stems').getPublicUrl(path)
        mrUrl = data.publicUrl
      }
      if (vocalBuf) {
        const path = `${uid}/${trackId}_vocal.mp3`
        await supabase.storage.from('stems').upload(path, vocalBuf, { contentType: 'audio/mpeg', upsert: true })
        const { data } = supabase.storage.from('stems').getPublicUrl(path)
        vocalUrl = data.publicUrl
      }
    } catch (uploadErr) {
      console.warn('[mr-poll] stem upload failed, using Replicate URLs:', uploadErr.message)
      // Fall back to Replicate URLs (expire in 24h)
    }

    await supabase.from('track_analyses').upsert(
      {
        track_id: trackId, mr_url: mrUrl, vocal_url: vocalUrl, mr_status: 'done',
        lyrics_status: 'processing', sheet_status: 'processing', share_status: 'processing',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'track_id' }
    )
    return res.json({ status: 'done', mr_url: mrUrl, vocal_url: vocalUrl })
  }

  if (pred.status === 'failed' || pred.status === 'canceled') {
    await supabase.from('track_analyses').upsert(
      { track_id: trackId, mr_status: 'error', error_info: { mr: pred.error || 'Replicate failed' }, updated_at: new Date().toISOString() },
      { onConflict: 'track_id' }
    )
    return res.json({ status: 'error' })
  }

  return res.json({ status: 'processing' })
}
