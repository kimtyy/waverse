import { useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'

export default function MusicPlayer() {
  const {
    currentTrack, isPlaying, volume, progress, duration,
    togglePlay, setVolume, setProgress, setDuration, playNext, playPrev,
  } = usePlayerStore()
  const audioRef = useRef(null)

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

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={playNext}
      />

      <div
        className="h-0.5 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          if (audioRef.current) audioRef.current.currentTime = ratio * duration
        }}
      >
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        <div className="flex items-center gap-3 w-64 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-indigo-900/60 flex items-center justify-center">
            {currentTrack.cover_url ? (
              <img src={currentTrack.cover_url} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Music size={16} className="text-indigo-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
            <p className="text-xs text-white/40 truncate">{currentTrack.profiles?.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mx-auto">
          <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors">
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors"
          >
            {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
          </button>
          <button onClick={playNext} className="text-white/50 hover:text-white transition-colors">
            <SkipForward size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-36 ml-auto">
          <span className="text-xs text-white/40 w-8 text-right">{fmt(progress)}</span>
          <span className="text-xs text-white/20">/</span>
          <span className="text-xs text-white/40 w-8">{fmt(duration)}</span>
          <Volume2 size={14} className="text-white/40 ml-2" />
          <input
            type="range" min="0" max="1" step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 accent-indigo-500"
          />
        </div>
      </div>
    </div>
  )
}
