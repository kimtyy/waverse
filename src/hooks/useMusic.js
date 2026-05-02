import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

export function useTracks(options = {}) {
  const { genre, search, userId, limit = 20 } = options
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('tracks')
        .select(`*, profiles!left(username, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (genre)  query = query.eq('genre', genre)
      if (userId) query = query.eq('user_id', userId)
      if (search) query = query.or(
        `title.ilike.%${search}%,artist.ilike.%${search}%,maker.ilike.%${search}%`
      )

      const { data, error: err } = await query
      if (cancelled) return

      if (err) {
        console.error('[useTracks]', err)
        setError(err.message)
        setTracks([])
      } else {
        setTracks(data || [])
      }
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [genre, search, userId, limit])

  return { tracks, loading, error }
}

export function useTrack(id) {
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('tracks')
      .select(`*, profiles(username, avatar_url)`)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setTrack(data)
        setLoading(false)
      })
  }, [id])

  return { track, loading }
}

export function useLike(trackId, userId) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trackId) return
    supabase.from('likes').select('id', { count: 'exact' }).eq('track_id', trackId)
      .then(({ count: c }) => setCount(c || 0))
    if (userId) {
      supabase.from('likes').select('id').eq('track_id', trackId).eq('user_id', userId).single()
        .then(({ data }) => setLiked(!!data))
    }
  }, [trackId, userId])

  const toggle = async () => {
    if (!userId) return
    if (liked) {
      await supabase.from('likes').delete().eq('track_id', trackId).eq('user_id', userId)
      setLiked(false)
      setCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ track_id: trackId, user_id: userId })
      setLiked(true)
      setCount((c) => c + 1)
    }
  }

  return { liked, count, toggle }
}

export async function uploadTrack({ file, audioFile, userId, title, artist, creator, genre, description, tags }) {
  // 오디오 업로드 — 공급자 무관하게 동일한 인터페이스
  const audioResult = await storage.upload(audioFile, { type: 'audio', userId })

  // 커버 이미지 업로드 (선택)
  let coverResult = null
  if (file) {
    coverResult = await storage.upload(file, { type: 'image', userId })
  }

  // DB에는 HTTP URL + 공급자 정보 저장
  const { data, error } = await supabase.from('tracks').insert({
    user_id: userId,
    title,
    artist:           artist || null,
    maker:            creator || null,
    genre,
    description,
    tags:             tags || [],
    audio_url:        audioResult.url,
    audio_storage_id: audioResult.id,
    cover_url:        coverResult?.url ?? null,
    cover_storage_id: coverResult?.id  ?? null,
    storage_provider: storage.name,
  }).select().single()

  if (error) throw error
  return data
}

/**
 * 트랙 삭제 — 스토리지 파일 + DB 레코드 모두 제거
 * storage_provider, audio_storage_id, cover_storage_id 컬럼이 있을 때만 파일도 삭제.
 */
export async function deleteTrack(track, userId) {
  // 스토리지 파일 삭제 (storage_id가 있을 때만)
  if (track.audio_storage_id) {
    await storage.delete(track.audio_storage_id).catch(console.warn)
  }
  if (track.cover_storage_id) {
    await storage.delete(track.cover_storage_id).catch(console.warn)
  }

  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', track.id)
    .eq('user_id', userId)

  if (error) throw error
}
