import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

/* ── 본인 트랙 목록 + CRUD (artist) ─────────── */
export function useMyTracks(userId, search = '') {
  const [tracks,  setTracks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true); setError(null)
    let q = supabase
      .from('tracks')
      .select('id, user_id, title, artist, maker, genre, is_public, play_count, created_at, cover_url, audio_storage_id, cover_storage_id, storage_provider, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (search) q = q.or(`title.ilike.%${search}%,artist.ilike.%${search}%`)
    const { data, error: err } = await q
    if (err) { setError(err.message); setLoading(false); return }
    setTracks(data || [])
    setLoading(false)
  }, [userId, search])

  useEffect(() => { load() }, [load])

  const deleteTrack = useCallback(async (track) => {
    if (track.audio_storage_id) await storage.delete(track.audio_storage_id).catch(console.warn)
    if (track.cover_storage_id) await storage.delete(track.cover_storage_id).catch(console.warn)
    const { error: err } = await supabase
      .from('tracks').delete().eq('id', track.id).eq('user_id', userId)
    if (err) throw err
    setTracks(prev => prev.filter(t => t.id !== track.id))
  }, [userId])

  const updateTrack = useCallback(async (id, patch) => {
    const { data, error: err } = await supabase
      .from('tracks').update(patch).eq('id', id).eq('user_id', userId).select().single()
    if (err) throw err
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    return data
  }, [userId])

  return { tracks, loading, error, reload: load, deleteTrack, updateTrack }
}

/* ── 본인 트랙 통계 (artist) ─────────────────── */
export function useMyStats(userId) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('tracks').select('play_count').eq('user_id', userId),
      supabase.from('tracks').select('id').eq('user_id', userId)
        .then(async ({ data }) => {
          if (!data?.length) return 0
          const ids = data.map(t => t.id)
          const { count } = await supabase
            .from('likes').select('*', { count: 'exact', head: true }).in('track_id', ids)
          return count ?? 0
        }),
      supabase.from('tracks')
        .select('id, title, artist, play_count, cover_url, is_public')
        .eq('user_id', userId)
        .order('play_count', { ascending: false })
        .limit(5),
    ]).then(([
      { count: trackCount },
      { data: playData },
      likeCount,
      { data: topPlayed },
    ]) => {
      setStats({
        trackCount,
        totalPlays: playData?.reduce((s, t) => s + (t.play_count || 0), 0) ?? 0,
        likeCount,
        topPlayed: topPlayed || [],
      })
      setLoading(false)
    })
  }, [userId])

  return { stats, loading }
}
