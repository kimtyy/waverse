import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Waves, TrendingUp, ChevronRight } from 'lucide-react'
import MusicCard from '../components/music/MusicCard'
import { useTracks } from '../hooks/useMusic'
import { usePlayerStore } from '../stores/playerStore'
import { GENRE_CHIPS } from '../lib/genres'

export default function Home() {
  const [activeGenre, setActiveGenre] = useState('all')
  const { tracks, loading, error } = useTracks({
    genre: activeGenre === 'all' ? undefined : activeGenre,
    limit: 20,
  })
  const { setTrack, addToQueue } = usePlayerStore()

  const handlePlayAll = () => {
    if (!tracks.length) return
    tracks.forEach(t => addToQueue(t))
    setTrack(tracks[0])
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero Banner ─────────────────────────────── */}
      <div style={{
        margin: '12px 16px 0',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a2e20 0%, #0d3a28 40%, #061a11 100%)',
        border: '1px solid rgba(29,158,117,0.25)',
        padding: '24px 20px',
        position: 'relative',
      }}>
        {/* BG glow */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,158,117,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'white', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          모든 좋은 음악은<br />
          <span style={{ color: '#1D9E75' }}>들려야 한다</span>
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '18px' }}>
          누가 만들었든, 좋은 음악이면 됩니다
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/discover" className="btn-primary" style={{ padding: '10px 18px', fontSize: '13px', textDecoration: 'none' }}>
            <Waves size={15} /> 탐색하기
          </Link>
          <button onClick={handlePlayAll} className="btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }}>
            전체 재생
          </button>
        </div>

        {/* Decorative waveform */}
        <div style={{ position: 'absolute', right: '20px', bottom: '20px', display: 'flex', alignItems: 'flex-end', gap: '3px', opacity: 0.35 }}>
          {[14, 28, 20, 36, 24, 40, 18, 32, 22, 16].map((h, i) => (
            <div key={i} style={{
              width: '4px', height: `${h}px`,
              background: '#1D9E75', borderRadius: '3px',
              transformOrigin: 'bottom',
              animation: `wave 1.1s ease-in-out ${i * 0.1}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* ── Genre Chips ─────────────────────────────── */}
      <div style={{ overflowX: 'auto', padding: '16px 16px 4px', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: '8px', paddingBottom: '4px' }}>
          {GENRE_CHIPS.map(g => {
            const active = activeGenre === g.value
            return (
              <button
                key={g.value}
                onClick={() => setActiveGenre(g.value)}
                style={{
                  flexShrink: 0,
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? '#1D9E75' : 'rgba(13,26,21,0.9)',
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  boxShadow: active ? '0 0 12px rgba(29,158,117,0.35)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.ko}
                {g.ko !== g.en && g.value !== 'all' && (
                  <span style={{ opacity: 0.65, marginLeft: '4px', fontWeight: 400, fontSize: '11px' }}>
                    {g.en}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Track List ──────────────────────────────── */}
      <section style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#1D9E75" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
              {activeGenre === 'all' ? '최신 트랙' : activeGenre}
            </span>
          </div>
          <Link to="/discover" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: '#1D9E75' }}>
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{
          background: 'rgba(13,26,21,0.6)',
          margin: '0 12px',
          borderRadius: '16px',
          border: '1px solid rgba(29,158,117,0.1)',
          overflow: 'hidden',
        }}>
          {loading ? (
            [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
          ) : error ? (
            <ErrorState message={error} />
          ) : tracks.length ? (
            tracks.map(track => <MusicCard key={track.id} track={track} />)
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
      <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: '13px', width: '60%', marginBottom: '7px' }} />
        <div className="skeleton" style={{ height: '11px', width: '40%' }} />
      </div>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '6px', fontWeight: 600 }}>트랙을 불러오지 못했습니다</p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{message}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Waves size={36} color="rgba(29,158,117,0.3)" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>아직 트랙이 없습니다</p>
      <Link to="/upload" className="btn-primary" style={{ fontSize: '13px', textDecoration: 'none', display: 'inline-flex' }}>
        첫 트랙 업로드하기
      </Link>
    </div>
  )
}
