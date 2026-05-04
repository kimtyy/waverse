import { useState, useRef, useEffect } from 'react'
import { Loader2, Play, Pause, Mic2, Music } from 'lucide-react'

const fmt = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function MRPanel({ analysis, onStart, starting }) {
  const status = analysis?.mr_status || 'idle'
  const mrUrl  = analysis?.mr_url

  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.src = mrUrl || ''
    if (mrUrl) el.load()
    setPlaying(false)
    setProgress(0)
    setDuration(0)
  }, [mrUrl])

  const togglePlay = () => {
    const el = audioRef.current
    if (!el || !mrUrl) return
    if (playing) { el.pause(); setPlaying(false) }
    else { el.play().catch(() => {}); setPlaying(true) }
  }

  const seek = (e) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  // ── 시작 전 ──────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div style={center}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '22px',
          background: 'rgba(29,158,117,0.12)',
          border: '1px solid rgba(29,158,117,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <Mic2 size={32} color="#1D9E75" />
        </div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
          ① MR 분리를 먼저 시작하세요
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '260px', textAlign: 'center' }}>
          완료 후 공유 콘텐츠가<br />자동으로 생성됩니다
        </p>
        <button
          onClick={onStart}
          disabled={starting}
          className="btn-primary"
          style={{ padding: '13px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {starting
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 시작 중...</>
            : <><Mic2 size={16} /> MR 분리 시작</>
          }
        </button>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '14px' }}>
          Replicate API 키가 필요합니다
        </p>
      </div>
    )
  }

  // ── 처리 중 ──────────────────────────────────────────────────
  if (status === 'processing') {
    return (
      <div style={center}>
        <Loader2 size={28} color="#1D9E75" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p style={mutedText}>MR 분리 중...</p>
        <p style={{ ...mutedText, fontSize: '11px', marginTop: '6px', opacity: 0.55 }}>
          반주를 AI가 분리하고 있습니다
          <br />최대 3~5분 소요될 수 있습니다
        </p>
      </div>
    )
  }

  // ── 오류 ──────────────────────────────────────────────────────
  if (status === 'error' || !mrUrl) {
    return (
      <div style={center}>
        <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '6px' }}>MR 분리 실패</p>
        <p style={{ ...mutedText, fontSize: '11px' }}>Replicate API 키를 확인해 주세요</p>
      </div>
    )
  }

  // ── 완료: MR 반주 플레이어 ────────────────────────────────────
  const pct = duration ? (progress / duration) * 100 : 0

  return (
    <div style={{ padding: '24px' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
      />

      <div style={{
        background: 'rgba(13,26,21,0.8)',
        border: '1px solid rgba(29,158,117,0.15)',
        borderRadius: '16px', padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <button
            onClick={togglePlay}
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#1D9E75', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(29,158,117,0.4)',
              flexShrink: 0,
            }}
          >
            {playing ? <Pause size={22} color="white" /> : <Play size={22} color="white" style={{ marginLeft: '2px' }} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Music size={13} color="#1D9E75" />
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>MR 반주 트랙</p>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              보컬을 제거한 반주입니다
            </p>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
            {fmt(progress)} / {fmt(duration)}
          </span>
        </div>

        <div
          onClick={seek}
          style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', cursor: 'pointer' }}
        >
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#1D9E75,#4ecca3)', borderRadius: '2px', transition: 'width 0.1s linear' }} />
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '16px' }}>
        AI 분리된 오디오는 품질에 제한이 있을 수 있습니다
      </p>
      <div style={{ height: '40px' }} />
    </div>
  )
}

const center = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  minHeight: '200px', padding: '32px 24px', textAlign: 'center',
}
const mutedText = { fontSize: '13px', color: 'rgba(255,255,255,0.4)' }
