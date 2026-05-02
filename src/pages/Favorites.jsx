import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import MusicCard from '../components/music/MusicCard'
import { useNavigate } from 'react-router-dom'

export default function Favorites() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth'); return }
    if (!user) return

    supabase
      .from('likes')
      .select('track_id, tracks(*, profiles(username, avatar_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTracks((data || []).map(d => d.tracks).filter(Boolean))
        setLoading(false)
      })
  }, [user, authLoading])

  if (authLoading || !user) return null

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(244,114,182,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={16} color="#f472b6" fill="#f472b6" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>찜한 트랙</h1>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', paddingLeft: '40px' }}>
          {loading ? '...' : `${tracks.length}개`}
        </p>
      </div>

      {/* List */}
      <div style={{
        background: 'rgba(13,26,21,0.6)',
        margin: '0 12px',
        borderRadius: '16px',
        border: '1px solid rgba(29,158,117,0.1)',
        overflow: 'hidden',
      }}>
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
        ) : tracks.length ? (
          tracks.map(track => <MusicCard key={track.id} track={track} />)
        ) : (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Heart size={36} color="rgba(244,114,182,0.25)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>
              아직 찜한 트랙이 없어요
            </p>
            <button onClick={() => navigate('/discover')} className="btn-primary" style={{ fontSize: '13px' }}>
              음악 탐색하기
            </button>
          </div>
        )}
      </div>
      <div style={{ height: '16px' }} />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
      <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '7px' }} />
        <div className="skeleton" style={{ height: '11px', width: '35%' }} />
      </div>
    </div>
  )
}
