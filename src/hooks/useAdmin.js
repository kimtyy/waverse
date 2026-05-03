import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/storage'

/* ── 현재 사용자 role 조회 ───────────────────── */
export function useRole(userId) {
  const [role, setRole] = useState(null)   // null = loading
  useEffect(() => {
    if (!userId) { setRole(''); return }
    supabase.from('profiles').select('role').eq('id', userId).single()
      .then(({ data }) => setRole(data?.role ?? 'user'))
  }, [userId])
  return role
}

/* ── 전체 트랙 목록 + CRUD (superadmin) ─────── */
export function useAdminTracks(search = '') {
  const [tracks,  setTracks]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    let q = supabase
      .from('tracks')
      .select('id, user_id, title, artist, maker, genre, is_public, play_count, created_at, cover_url, audio_storage_id, cover_storage_id, storage_provider, description, profiles!left(username)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (search) q = q.or(`title.ilike.%${search}%,artist.ilike.%${search}%,maker.ilike.%${search}%`)
    const { data, error: err } = await q
    if (err) { setError(err.message); setLoading(false); return }
    setTracks(data || [])
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const deleteTrack = useCallback(async (track) => {
    if (track.audio_storage_id) await storage.delete(track.audio_storage_id).catch(console.warn)
    if (track.cover_storage_id) await storage.delete(track.cover_storage_id).catch(console.warn)
    const { error: err } = await supabase.from('tracks').delete().eq('id', track.id)
    if (err) throw err
    setTracks(prev => prev.filter(t => t.id !== track.id))
  }, [])

  const updateTrack = useCallback(async (id, patch) => {
    const { data, error: err } = await supabase
      .from('tracks').update(patch).eq('id', id).select().single()
    if (err) throw err
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    return data
  }, [])

  return { tracks, loading, error, reload: load, deleteTrack, updateTrack }
}

/* ── 전체 회원 목록 ──────────────────────────── */
export function useAdminUsers(search = '') {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('profiles')
      .select('id, username, email, role, created_at, avatar_url')
      .order('created_at', { ascending: false })
    if (search) q = q.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    const { data } = await q
    setUsers(data || [])
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const changeRole = useCallback(async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) throw error
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }, [])

  return { users, loading, changeRole }
}

/* ── 신고 목록 ───────────────────────────────── */
export function useAdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reports')
      .select('id, reason, status, created_at, reporter:profiles!reporter_id(username), track:tracks!track_id(id, title, artist)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setReports(data || []); setLoading(false) })
  }, [])

  const updateStatus = useCallback(async (id, status) => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (error) throw error
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }, [])

  return { reports, loading, updateStatus }
}

/* ── 전체 통계 ───────────────────────────────── */
export function useAdminStats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('tracks').select('play_count'),
      supabase.from('tracks')
        .select('id, title, artist, play_count, cover_url')
        .order('play_count', { ascending: false })
        .limit(5),
    ]).then(([
      { count: trackCount },
      { count: userCount },
      { count: likeCount },
      { count: pendingReports },
      { data: playData },
      { data: topPlayed },
    ]) => {
      setStats({
        trackCount, userCount, likeCount, pendingReports,
        totalPlays: playData?.reduce((s, t) => s + (t.play_count || 0), 0) ?? 0,
        topPlayed: topPlayed || [],
      })
      setLoading(false)
    })
  }, [])

  return { stats, loading }
}
