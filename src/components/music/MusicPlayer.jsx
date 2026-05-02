import { useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { useNavigate } from 'react-router-dom'

export default function MusicPlayer() {
  const { currentTrack, isPlaying, volume, progress, duration,
    togglePlay, setVolume, setProgress, setDuration, playNext, playPrev,
  } = usePlayerStore()
  const audioRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return
    audioRef.current.src = currentTrack.audio_url
    if (isPlaying) audioRef.current.play().catch(() => {})
  }, [currentTrack])

  useEffect(() => {
    if (!audioRef.current) return
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause()
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const pct = duration ? (progress / duration) * 100 : 0

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(60px + env(safe-area-inset-bottom))',
      left: 0, right: 0,
      zIndex: 45,
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
      />

      {/* Progress bar (thin line at top) */}
      <div
        style={{
          height: '2px',
          background: 'rgba(29,158,117,0.2)',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = ratio * duration
        }}
      >
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #1D9E75, #4ecca3)',
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Player body */}
      <div style={{
        background: 'rgba(7, 14, 12, 0.98)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(29,158,117,0.18)',
        padding: '10px 16px',
        maxWidth: '640px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Thumbnail */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden',
          flexShrink: 0, background: '#112219',
          border: '1.5px solid rgba(29,158,117,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {currentTrack.cover_url
            ? <img src={currentTrack.cover_url} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Music size={18} color="rgba(29,158,117,0.5)" />
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {currentTrack.title}
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {currentTrack.artist || currentTrack.profiles?.username || '-'}
          </p>
        </div>

        {/* Time */}
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          {fmt(progress)}
        </span>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button onClick={playPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'rgba(255,255,255,0.5)' }}>
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#1D9E75', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(29,158,117,0.5)',
            }}
          >
            {isPlaying
              ? <Pause size={17} color="white" />
              : <Play size={17} color="white" style={{ marginLeft: '2px' }} />
            }
          </button>
          <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'rgba(255,255,255,0.5)' }}>
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
