import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useAnalysis(trackId) {
  const [analysis, setAnalysis] = useState(undefined) // undefined=loading, null=none
  const [starting, setStarting] = useState(false)
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

  const triggerStart = useCallback((vocalUrl, instrumentalUrl) => {
    if (!trackId || !vocalUrl) return
    fetch('/api/analyze/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, vocalUrl, instrumentalUrl }),
    }).catch(() => {})
  }, [trackId])

  // Stage 1: only kick off MR separation
  const startAnalysis = useCallback(async (audioUrl) => {
    if (!trackId || !audioUrl) return
    setStarting(true)
    setAnalysis(prev => ({
      track_id: trackId,
      mr_status: 'processing',
      lyrics_status: 'idle', sheet_status: 'idle', share_status: 'idle',
      ...(prev || {}),
    }))
    try {
      await fetch('/api/analyze/mr-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, audioUrl }),
      })
    } catch (_) {}
    setStarting(false)
    await load()
    scheduleMRPoll()
  }, [trackId, load]) // eslint-disable-line

  // Poll MR status; when done trigger Stage 2 (lyrics/sheet/share)
  const scheduleMRPoll = useCallback(() => {
    if (pollTimerRef.current) return
    const tick = async () => {
      try {
        const res  = await fetch(`/api/analyze/mr-poll?trackId=${trackId}`)
        const data = await res.json()
        if (data.status === 'done') {
          await load()
          pollTimerRef.current = null
          triggerStart(data.vocal_url, data.mr_url)
          return
        }
        if (data.status === 'error') {
          await load()
          pollTimerRef.current = null
          return
        }
      } catch (_) {}
      pollTimerRef.current = setTimeout(tick, 15_000)
    }
    pollTimerRef.current = setTimeout(tick, 15_000)
  }, [trackId, load, triggerStart])

  useEffect(() => {
    if (!trackId) return
    load().then(data => {
      if (data?.mr_status === 'processing') scheduleMRPoll()
      // Recovery: MR finished but client was absent when it completed
      if (data?.mr_status === 'done' && data?.vocal_url && data?.lyrics_status !== 'done') {
        triggerStart(data.vocal_url, data.mr_url)
      }
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
  }, [trackId, load, scheduleMRPoll, triggerStart])

  return { analysis, starting, startAnalysis, reload: load }
}
