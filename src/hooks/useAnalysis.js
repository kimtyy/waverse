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

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  // Stage 1: MR separation
  const startAnalysis = useCallback(async (audioUrl) => {
    if (!trackId || !audioUrl) return
    setStarting(true)
    setAnalysis(prev => ({
      track_id: trackId,
      mr_status: 'processing',
      ...(prev || {}),
    }))
    try {
      const token = await getToken()
      await fetch('/api/analyze/mr-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ trackId, audioUrl }),
      })
    } catch (_) {}
    setStarting(false)
    await load()
    scheduleMRPoll()
  }, [trackId, load]) // eslint-disable-line

  // Poll until MR is done or errored
  const scheduleMRPoll = useCallback(() => {
    if (pollTimerRef.current) return
    const tick = async () => {
      try {
        const token = await getToken()
        const res  = await fetch(`/api/analyze/mr-poll?trackId=${trackId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
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
