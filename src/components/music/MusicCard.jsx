import { Play, Pause, Heart, Music } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { useLike } from '../../hooks/useMusic'
import { useAuth } from '../../hooks/useAuth'
import { genreLabel } from '../../lib/genres'

export default function MusicCard({ track, showCreator = true }) {
  const { user } = useAuth()
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore()
  const { liked, count, toggle } = useLike(track.id, user?.id)
  const isActive = currentTrack?.id === track.id
  const isNowPlaying = isActive && isPlaying

  const handlePlay = (e) => {
    e.stopPropagation()
    isActive ? togglePlay() : setTrack(track)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(29,158,117,0.08)',
        background: isActive ? 'rgba(29,158,117,0.06)' : 'transparent',
        transition: 'background 0.18s',
        cursor: 'pointer',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Cover */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden',
          background: 'linear-gradient(135deg, #112219, #0a1a14)',
          border: isActive ? '1.5px solid #1D9E75' : '1.5px solid rgba(29,158,117,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {track.cover_url
            ? <img src={track.cover_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Music size={20} color="rgba(29,158,117,0.4)" />
          }
        </div>

        {/* Playing indicator overlay */}
        {isNowPlaying && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '10px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '2px',
          }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                width: '3px', height: '14px', background: '#1D9E75', borderRadius: '2px',
                transformOrigin: 'bottom',
                animation: `wave 0.9s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px', fontWeight: 600,
          color: isActive ? '#1D9E75' : 'white',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {track.title}
        </p>
        <p style={{
          fontSize: '12px', color: 'rgba(255,255,255,0.5)',
          marginTop: '2px',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {track.artist || '아티스트 미상'}
        </p>
        {showCreator && (
          <p style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.28)',
            marginTop: '1px',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>
            {track.maker
              ? `${track.maker} · ${track.profiles?.username || '-'}`
              : `업로더 · ${track.profiles?.username || '-'}`}
          </p>
        )}
        {track.genre && (
          <div style={{ marginTop: '5px' }}>
            <span className="tag">{genreLabel(track.genre)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); toggle() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
            padding: '6px',
            color: liked ? '#f472b6' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.15s',
          }}
        >
          <Heart size={16} fill={liked ? '#f472b6' : 'none'} stroke="currentColor" />
          <span style={{ fontSize: '10px', fontWeight: 600 }}>{count}</span>
        </button>

        <button
          onClick={handlePlay}
          style={{
            background: isActive ? '#1D9E75' : 'rgba(29,158,117,0.15)',
            border: 'none', cursor: 'pointer',
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
            color: isActive ? 'white' : '#1D9E75',
            flexShrink: 0,
          }}
        >
          {isNowPlaying
            ? <Pause size={16} />
            : <Play size={16} style={{ marginLeft: '2px' }} />
          }
        </button>
      </div>
    </div>
  )
}
