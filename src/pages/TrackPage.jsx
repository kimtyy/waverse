import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Music, Play, Pause, Heart, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTrack, useLike } from '../hooks/useMusic'
import { usePlayerStore } from '../stores/playerStore'
import { useAuth } from '../hooks/useAuth'
import { genreLabel } from '../lib/genres'
import ShareButtons from '../components/shared/ShareButtons'

export default function TrackPage() {
  const { trackId } = useParams()
  const { track, loading } = useTrack(trackId)
  const { user } = useAuth()
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore()
  const { liked, count, toggle } = useLike(trackId, user?.id)

  const isActive = currentTrack?.id === trackId
  const isNowPlaying = isActive && isPlaying

  useEffect(() => {
    if (track) setTrack(track)
  }, [track]) // eslint-disable-line

  const handlePlay = () => {
    if (isActive) togglePlay()
    else if (track) setTrack(track)
  }

  const webShare = () => {
    const link = `https://waverse.net/track/${trackId}`
    const title  = track?.title  || ''
    const artist = track?.artist || '-'
    const text   = `🎵 ${title} - ${artist}\nWAVERSE에서 들어보세요!\n${link}`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard.writeText(link).catch(() => {}).then(() => toast.success('링크 복사됨!'))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid rgba(29,158,117,0.3)', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!track) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <Music size={48} color="rgba(29,158,117,0.3)" />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>트랙을 찾을 수 없습니다</p>
        <Link to="/" style={{ color: '#1D9E75', fontSize: '13px', textDecoration: 'none' }}>홈으로 이동</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '120px' }}>

      {/* Back */}
      <div style={{ padding: '16px 20px 0' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> 뒤로
        </Link>
      </div>

      {/* Cover + info */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          width: '100%', maxWidth: '280px', aspectRatio: '1',
          margin: '0 auto 24px',
          borderRadius: '20px', overflow: 'hidden',
          background: 'linear-gradient(135deg, #112219, #0a1a14)',
          border: '1px solid rgba(29,158,117,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {track.cover_url
            ? <img src={track.cover_url} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Music size={64} color="rgba(29,158,117,0.3)" />
          }
          {isNowPlaying && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              {[18, 28, 22, 32, 20].map((h, i) => (
                <div key={i} style={{
                  width: '5px', height: `${h}px`, background: '#1D9E75', borderRadius: '3px',
                  transformOrigin: 'bottom',
                  animation: `wave 1.1s ease-in-out ${i * 0.1}s infinite`,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Title / artist */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.4px', marginBottom: '6px', lineHeight: 1.2 }}>
            {track.title}
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', marginBottom: '8px' }}>
            {track.artist || '아티스트 미상'}
          </p>
          {track.genre && (
            <span className="tag">{genreLabel(track.genre)}</span>
          )}
        </div>

        {/* Play + Like + Share */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '32px' }}>
          <button
            onClick={toggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              color: liked ? '#f472b6' : 'rgba(255,255,255,0.4)',
              transition: 'color 0.15s',
            }}
          >
            <Heart size={24} fill={liked ? '#f472b6' : 'none'} stroke="currentColor" />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{count}</span>
          </button>

          <button
            onClick={handlePlay}
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#1D9E75', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 28px rgba(29,158,117,0.5)',
              transition: 'transform 0.15s',
            }}
          >
            {isNowPlaying
              ? <Pause size={26} color="white" />
              : <Play size={26} color="white" style={{ marginLeft: '3px' }} />
            }
          </button>

          <button
            onClick={webShare}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              color: 'rgba(255,255,255,0.4)', transition: 'color 0.15s',
            }}
          >
            <Share2 size={24} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>공유</span>
          </button>
        </div>

        {/* Track meta */}
        {(track.maker || track.description) && (
          <div style={{
            background: 'rgba(13,26,21,0.7)',
            border: '1px solid rgba(29,158,117,0.12)',
            borderRadius: '16px', padding: '16px',
            marginBottom: '24px',
          }}>
            {track.maker && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: track.description ? '8px' : 0 }}>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>제작자</span> {track.maker}
              </p>
            )}
            {track.description && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                {track.description}
              </p>
            )}
          </div>
        )}

        {/* Share section */}
        <div style={{
          background: 'rgba(29,158,117,0.06)',
          border: '1px solid rgba(29,158,117,0.15)',
          borderRadius: '16px', padding: '20px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            공유하기
          </p>
          <ShareButtons track={track} />
        </div>
      </div>
    </div>
  )
}
