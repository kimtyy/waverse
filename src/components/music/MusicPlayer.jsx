import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Music, ChevronDown, Video, Sparkles } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { supabase } from '../../lib/supabase'
import AnalysisPanel from '../analysis/AnalysisPanel'

const isVideoUrl = (url) => /\.mp4$/i.test(url || '')

/* ── 공통 시간 포맷 ── */
const fmt = (s) => !s || isNaN(s)
  ? '0:00'
  : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/* ── 프로그레스 바 클릭 → 시간 이동 ── */
const seekOnClick = (e, containerEl, duration, mediaEl) => {
  if (!mediaEl || !duration) return
  const rect = containerEl.getBoundingClientRect()
  mediaEl.currentTime = ((e.clientX - rect.left) / rect.width) * duration
}

export default function MusicPlayer() {
  const {
    currentTrack, isPlaying, volume, progress, duration,
    togglePlay, setProgress, setDuration, playNext, playPrev,
  } = usePlayerStore()

  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const [isExpanded,    setIsExpanded]    = useState(false)
  const [showAnalysis,  setShowAnalysis]  = useState(false)

  const isVideo    = isVideoUrl(currentTrack?.audio_url)
  const activeRef  = isVideo ? videoRef : audioRef

  /* ── 트랙 변경 시 로드 ── */
  useEffect(() => {
    if (!currentTrack) return
    // 비활성 엘리먼트 초기화
    const inactive = isVideo ? audioRef : videoRef
    if (inactive.current) { inactive.current.pause(); inactive.current.src = '' }
    // 활성 엘리먼트 설정
    const el = activeRef.current
    if (!el) return
    el.src = currentTrack.audio_url
    el.load()
    // 재생 수 증가
    supabase.rpc('increment_play_count', { track_id: currentTrack.id }).catch(() => {})
  }, [currentTrack]) // eslint-disable-line

  /* ── 재생/일시정지 동기화 (트랙 변경 및 토글 모두 처리) ── */
  useEffect(() => {
    const el = activeRef.current
    if (!el) return
    if (isPlaying) {
      el.play().catch(e => {
        if (e.name !== 'AbortError') console.warn('[player] play failed:', e.name, e.message)
      })
    } else {
      el.pause()
    }
  }, [isPlaying, currentTrack]) // eslint-disable-line

  /* ── 볼륨 동기화 ── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    if (videoRef.current) videoRef.current.volume = volume
  }, [volume])

  const pct = duration ? (progress / duration) * 100 : 0

  if (!currentTrack) return null

  /* 공통 이벤트 핸들러 */
  const mediaEvents = (ref) => ({
    onTimeUpdate:    () => setProgress(ref.current?.currentTime || 0),
    onLoadedMetadata:() => setDuration(ref.current?.duration   || 0),
    onEnded: playNext,
  })

  return (
    <>
      {/* ── 오디오 엘리먼트 (항상 DOM에 유지) ── */}
      <audio ref={audioRef} style={{ display: 'none' }} {...(!isVideo ? mediaEvents(audioRef) : {})} />

      {/* ── 비디오 엘리먼트 (고정 위치, 확장 시 표시) ── */}
      <video
        ref={videoRef}
        playsInline
        {...(isVideo ? mediaEvents(videoRef) : {})}
        style={{
          position: 'fixed',
          top: isExpanded && isVideo ? '56px' : 0,
          left: 0, right: 0,
          width: '100%',
          height: isExpanded && isVideo ? 'calc(100dvh - 56px - 210px)' : 0,
          objectFit: 'contain',
          background: 'black',
          zIndex: isExpanded && isVideo ? 205 : -1,
          opacity: isExpanded && isVideo ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      />

      {/* ── 미니 플레이어 ── */}
      {!isExpanded && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(60px + env(safe-area-inset-bottom))',
          left: 0, right: 0, zIndex: 45,
        }}>
          {/* 씬 프로그레스 라인 */}
          <div
            style={{ height: '2px', background: 'rgba(29,158,117,0.2)', cursor: 'pointer' }}
            onClick={(e) => seekOnClick(e, e.currentTarget, duration, activeRef.current)}
          >
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#1D9E75,#4ecca3)', transition: 'width 0.1s linear' }} />
          </div>

          <div style={{
            background: 'rgba(7,14,12,0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(29,158,117,0.18)',
            padding: '10px 16px',
            maxWidth: '640px', margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            {/* 썸네일 — 클릭 시 확장 */}
            <div onClick={() => setIsExpanded(true)} style={{
              width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden',
              flexShrink: 0, background: '#112219',
              border: '1.5px solid rgba(29,158,117,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}>
              {currentTrack.cover_url
                ? <img src={currentTrack.cover_url} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : isVideo
                  ? <Video size={18} color="rgba(29,158,117,0.5)" />
                  : <Music size={18} color="rgba(29,158,117,0.5)" />
              }
              {isVideo && (
                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '3px', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={8} color="white" />
                </div>
              )}
            </div>

            {/* 트랙 정보 — 클릭 시 확장 */}
            <div onClick={() => setIsExpanded(true)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {currentTrack.artist || currentTrack.profiles?.username || '-'}
              </p>
            </div>

            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{fmt(progress)}</span>

            {/* 컨트롤 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <button onClick={playPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'rgba(255,255,255,0.5)' }}>
                <SkipBack size={18} />
              </button>
              <button onClick={togglePlay} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1D9E75', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(29,158,117,0.5)' }}>
                {isPlaying ? <Pause size={17} color="white" /> : <Play size={17} color="white" style={{ marginLeft: '2px' }} />}
              </button>
              <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'rgba(255,255,255,0.5)' }}>
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 확장 플레이어 ── */}
      {isExpanded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: isVideo ? 'black' : '#070e0c',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {showAnalysis && (
            <AnalysisPanel track={currentTrack} onClose={() => setShowAnalysis(false)} />
          )}
          {/* 헤더 */}
          <div style={{
            height: '56px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: 210, position: 'relative',
            background: isVideo ? 'rgba(0,0,0,0.6)' : 'transparent',
            backdropFilter: isVideo ? 'blur(8px)' : 'none',
          }}>
            <button onClick={() => setIsExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              <ChevronDown size={24} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isVideo ? '영상 재생' : '음악 재생'}
            </span>
            <button
              onClick={() => setShowAnalysis(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#1D9E75', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <Sparkles size={18} />
            </button>
          </div>

          {/* 콘텐츠 영역 */}
          {isVideo ? (
            /* 비디오: video 엘리먼트가 fixed로 이 영역을 채움 */
            <div style={{ flex: 1 }} />
          ) : (
            /* 오디오: 블러 배경 + 대형 커버 */
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {currentTrack.cover_url && (
                <div style={{
                  position: 'absolute', inset: '-30px',
                  backgroundImage: `url(${currentTrack.cover_url})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'blur(48px) brightness(0.22)',
                }} />
              )}
              <div style={{ position: 'relative', width: '72vw', maxWidth: '300px', aspectRatio: '1/1', zIndex: 1 }}>
                <div style={{
                  width: '100%', height: '100%',
                  borderRadius: '20px', overflow: 'hidden',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#112219',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {currentTrack.cover_url
                    ? <img src={currentTrack.cover_url} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Music size={64} color="rgba(29,158,117,0.4)" />
                  }
                </div>
              </div>
            </div>
          )}

          {/* 하단 컨트롤 */}
          <div style={{
            padding: '20px 28px calc(env(safe-area-inset-bottom) + 20px)',
            background: isVideo ? 'rgba(0,0,0,0.85)' : 'transparent',
            backdropFilter: isVideo ? 'blur(12px)' : 'none',
            zIndex: 210, position: 'relative',
          }}>
            {/* 트랙 정보 */}
            <div style={{ marginBottom: '18px' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'white', letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack.title}
              </p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack.artist || currentTrack.profiles?.username || '-'}
              </p>
            </div>

            {/* 프로그레스 바 */}
            <div
              style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', cursor: 'pointer', marginBottom: '8px' }}
              onClick={(e) => seekOnClick(e, e.currentTarget, duration, activeRef.current)}
            >
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#1D9E75,#4ecca3)', borderRadius: '2px', transition: 'width 0.1s linear' }} />
            </div>

            {/* 시간 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{fmt(progress)}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{fmt(duration)}</span>
            </div>

            {/* 재생 컨트롤 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
              <button onClick={playPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'rgba(255,255,255,0.6)' }}>
                <SkipBack size={28} />
              </button>
              <button onClick={togglePlay} style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: '#1D9E75', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(29,158,117,0.55)',
              }}>
                {isPlaying ? <Pause size={28} color="white" /> : <Play size={28} color="white" style={{ marginLeft: '3px' }} />}
              </button>
              <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'rgba(255,255,255,0.6)' }}>
                <SkipForward size={28} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
