import { Play, Pause, Heart, Music } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { useLike } from '../../hooks/useMusic'
import { useAuth } from '../../hooks/useAuth'

export default function MusicCard({ track }) {
  const { user } = useAuth()
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore()
  const { liked, count, toggle } = useLike(track.id, user?.id)

  const isActive = currentTrack?.id === track.id

  const handlePlay = () => {
    if (isActive) {
      togglePlay()
    } else {
      setTrack(track)
    }
  }

  return (
    <div className="glass rounded-xl overflow-hidden group cursor-pointer animate-fade-in">
      <div className="relative aspect-square bg-gradient-to-br from-indigo-900/60 to-purple-900/60">
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={40} className="text-indigo-400/40" />
          </div>
        )}

        {isActive && isPlaying && (
          <div className="absolute inset-0 flex items-end justify-start p-3 gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-indigo-400 rounded-full"
                style={{
                  height: '24px',
                  animation: `wave 0.8s ease-in-out ${i * 0.15}s infinite`,
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
            {isActive && isPlaying ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
          </div>
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{track.title}</p>
            <p className="text-xs text-white/50 truncate mt-0.5">
              {track.profiles?.username || 'Unknown artist'}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggle() }}
            className={`flex items-center gap-1 text-xs transition-colors flex-shrink-0 ${
              liked ? 'text-pink-400' : 'text-white/40 hover:text-pink-400'
            }`}
          >
            <Heart size={14} className={liked ? 'fill-current' : ''} />
            <span>{count}</span>
          </button>
        </div>

        {track.genre && (
          <div className="mt-2">
            <span className="tag">{track.genre}</span>
          </div>
        )}
      </div>
    </div>
  )
}
