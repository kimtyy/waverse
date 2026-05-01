import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTracks(options = {}) {
  const { genre, search, userId, limit = 20 } = options
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let query = supabase
        .from('tracks')
        .select(`*, profiles(username, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (genre) query = query.eq('genre', genre)
      if (userId) query = query.eq('user_id', userId)
      if (search) query = query.ilike('title', `%${search}%`)

      const { data, error } = await query
      if (!error) setTracks(data || [])
      setLoading(false)
    }
    fetch()
  }, [genre, search, userId, limit])

  return { tracks, loading }
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

export async function uploadTrack({ file, audioFile, userId, title, genre, description, tags }) {
  const ext = audioFile.name.split('.').pop()
  const audioPath = `${userId}/${Date.now()}.${ext}`

  const { error: audioError } = await supabase.storage
    .from('tracks')
    .upload(audioPath, audioFile)
  if (audioError) throw audioError

  const { data: { publicUrl: audioUrl } } = supabase.storage.from('tracks').getPublicUrl(audioPath)

  let coverUrl = null
  if (file) {
    const imgExt = file.name.split('.').pop()
    const imgPath = `covers/${userId}/${Date.now()}.${imgExt}`
    await supabase.storage.from('tracks').upload(imgPath, file)
    const { data: { publicUrl } } = supabase.storage.from('tracks').getPublicUrl(imgPath)
    coverUrl = publicUrl
  }

  const { data, error } = await supabase.from('tracks').insert({
    user_id: userId,
    title,
    genre,
    description,
    tags: tags || [],
    audio_url: audioUrl,
    cover_url: coverUrl,
  }).select().single()

  if (error) throw error
  return data
}
