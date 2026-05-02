import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Music, LogOut, ChevronRight, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTracks } from '../hooks/useMusic'
import MusicCard from '../components/music/MusicCard'

export default function Profile() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const { tracks } = useTracks({ userId: user?.id })

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading])

  if (loading || !user) return null

  const username = user.user_metadata?.username || user.email?.split('@')[0]
  const initial = username?.[0]?.toUpperCase() || 'U'

  const handleSignOut = () => {
    signOut()
    navigate('/auth')
  }

  return (
    <div>
      {/* Profile card */}
      <div style={{
        margin: '12px 16px',
        padding: '20px',
        background: 'linear-gradient(135deg, #0d2a1f, #0a1a14)',
        border: '1px solid rgba(29,158,117,0.2)',
        borderRadius: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Avatar */}
          <div style={{
            width: '60px', height: '60px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #1D9E75, #0a4433)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, color: 'white',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(29,158,117,0.35)',
          }}>
            {initial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
              {username}
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          </div>

          <button onClick={handleSignOut} className="btn-ghost" style={{ padding: '8px 10px', flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '1px', marginTop: '20px',
          background: 'rgba(29,158,117,0.1)', borderRadius: '12px', overflow: 'hidden',
          border: '1px solid rgba(29,158,117,0.15)',
        }}>
          {[
            { label: '업로드', value: tracks.length },
            { label: '팔로워', value: 0 },
            { label: '찜받음', value: 0 },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', background: 'rgba(7,14,12,0.5)' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#1D9E75' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My tracks */}
      <div style={{ padding: '4px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={16} color="#1D9E75" />
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>내 트랙</span>
        </div>
      </div>

      <div style={{
        background: 'rgba(13,26,21,0.6)',
        margin: '0 12px',
        borderRadius: '16px',
        border: '1px solid rgba(29,158,117,0.1)',
        overflow: 'hidden',
      }}>
        {tracks.length ? (
          tracks.map(track => <MusicCard key={track.id} track={track} showCreator={false} />)
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Music size={36} color="rgba(29,158,117,0.25)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>
              아직 업로드한 트랙이 없어요
            </p>
            <button onClick={() => navigate('/upload')} className="btn-primary" style={{ fontSize: '13px' }}>
              첫 트랙 업로드
            </button>
          </div>
        )}
      </div>
      <div style={{ height: '16px' }} />
    </div>
  )
}
