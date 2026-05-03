import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useAnalysis(trackId) {
  const [analysis, setAnalysis]   = useState(undefined) // undefined=loading, null=none
  const [starting, setStarting]   = useState(false)
  const pollTimerRef = useRef(null)

  const load = useCallback(async () => {
    if (!trackId) return
    const { data } = await supabase
      .from('track_analyses')
      .select('*')
      .eq('track_id', trackId)
      .single()
    setAnalysis(data ?? null)
    return data
  }, [trackId])

  // Trigger full analysis (called after upload)
  const startAnalysis = useCallback(async (audioUrl, title = '', artist = '') => {
    if (!trackId || !audioUrl) return
    setStarting(true)
    // Optimistic: show processing state immediately
    setAnalysis(prev => ({
      track_id: trackId,
      lyrics_status: 'processing', sheet_status: 'processing',
      share_status: 'processing', mr_status: 'processing',
      ...(prev || {}),
    }))
    try {
      await Promise.all([
        fetch('/api/analyze/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, audioUrl, title, artist }),
        }),
        fetch('/api/analyze/mr-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, audioUrl }),
        }),
      ])
    } catch (_) { /* analysis runs server-side, errors surfaced via DB status */ }
    setStarting(false)
    await load()
    scheduleMRPoll()
  }, [trackId, load])

  // Poll MR status every 15s until done/error
  const scheduleMRPoll = useCallback(() => {
    if (pollTimerRef.current) return
    const tick = async () => {
      try {
        const res  = await fetch(`/api/analyze/mr-poll?trackId=${trackId}`)
        const data = await res.json()
        if (data.status === 'done' || data.status === 'error') {
          await load()
          pollTimerRef.current = null
          return
        }
      } catch (_) {}
      pollTimerRef.current = setTimeout(tick, 15_000)
    }
    pollTimerRef.current = setTimeout(tick, 15_000)
  }, [trackId, load])

  // Initial load + realtime subscription
  useEffect(() => {
    if (!trackId) return
    load().then(data => {
      if (data?.mr_status === 'processing') scheduleMRPoll()
    })

    const channel = supabase
      .channel(`analysis:${trackId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'track_analyses',
        filter: `track_id=eq.${trackId}`,
      }, ({ new: row }) => {
        setAnalysis(row)
        if (row?.mr_status === 'processing') scheduleMRPoll()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null }
    }
  }, [trackId, load, scheduleMRPoll])

  return { analysis, starting, startAnalysis, reload: load }
}
