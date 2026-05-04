import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Music, Play, Pause, Heart, Copy, Check, Share2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTrack, useLike } from '../hooks/useMusic'
import { usePlayerStore } from '../stores/playerStore'
import { useAuth } from '../hooks/useAuth'
import { genreLabel } from '../lib/genres'

const BASE_URL = 'https://waverse.net'

export default function TrackPage() {
  const { trackId } = useParams()
  const { track, loading } = useTrack(trackId)
  const { user } = useAuth()
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore()
  const { liked, count, toggle } = useLike(trackId, user?.id)
  const [copied, setCopied] = useState(false)

  const isActive = currentTrack?.id === trackId
  const isNowPlaying = isActive && isPlaying

  useEffect(() => {
    if (track) setTrack(track)
  }, [track]) // eslint-disable-line

  const handlePlay = () => {
    if (isActive) togglePlay()
    else if (track) setTrack(track)
  }

  const link   = `${BASE_URL}/track/${trackId}`
  const title  = track?.title  || ''
  const artist = track?.artist || '-'
  const text   = `🎵 ${title} - ${artist}\nWAVERSE에서 들어보세요!\n${link}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    toast.success('링크 복사됨!')
    setTimeout(() => setCopied(false), 2000)
  }

  const webShare = () => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      copyLink()
    }
  }

  const toX = () => window.open(
    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener'
  )

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

        {/* Play + Like */}
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
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            공유하기
          </p>

          {/* Share text preview */}
          <div style={{
            background: 'rgba(29,158,117,0.08)',
            border: '1px solid rgba(29,158,117,0.15)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '14px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>
              🎵 {title} - {artist}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
              WAVERSE에서 들어보세요!
            </p>
            <p style={{ fontSize: '11px', color: '#4ecca3', wordBreak: 'break-all' }}>{link}</p>
          </div>

          {/* Copy + Share buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <ShareBtn color={copied ? '#4ecca3' : 'rgba(255,255,255,0.6)'} onClick={copyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>링크 복사</span>
            </ShareBtn>
            <ShareBtn color="#4ecca3" bg="rgba(29,158,117,0.15)" onClick={webShare}>
              <Share2 size={14} />
              <span>공유하기</span>
            </ShareBtn>
          </div>

          {/* SNS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <ShareBtn color="#fff" bg="rgba(0,0,0,0.5)" onClick={toX}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (Twitter)</span>
            </ShareBtn>
            <ShareBtn color="#FEE500" bg="rgba(254,229,0,0.12)" onClick={() => { navigator.clipboard.writeText(link).catch(() => {}); toast('카카오에 링크를 붙여넣으세요', { icon: 'ℹ️' }) }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#FEE500">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.5 5.1 3.8 6.6L5 21l4.3-2.8c.9.2 1.8.3 2.7.3 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
              </svg>
              <span>카카오</span>
            </ShareBtn>
            <ShareBtn color="#E1306C" bg="rgba(225,48,108,0.1)" onClick={() => { navigator.clipboard.writeText(link).catch(() => {}); toast('인스타에 붙여넣으세요 📋') }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none"/>
              </svg>
              <span>인스타</span>
            </ShareBtn>
            <ShareBtn color="white" bg="rgba(255,255,255,0.07)" onClick={() => { navigator.clipboard.writeText(link).catch(() => {}); toast('틱톡에 붙여넣으세요 📋') }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.5a8.17 8.17 0 004.78 1.52V6.57a4.85 4.85 0 01-1.01.12z"/>
              </svg>
              <span>틱톡</span>
            </ShareBtn>
          </div>

          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '14px' }}>
            인스타 · 틱톡 · 카카오: 링크 복사 후 직접 게시하세요
          </p>
        </div>
      </div>
    </div>
  )
}

function ShareBtn({ color, bg, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        padding: '10px 14px', borderRadius: '10px',
        background: bg || 'rgba(255,255,255,0.07)',
        border: `1px solid ${color}30`,
        color, fontSize: '12px', fontWeight: 700,
        cursor: 'pointer', flex: '1 1 auto', minWidth: '90px',
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}
