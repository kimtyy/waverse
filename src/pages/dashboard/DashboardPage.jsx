import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Music, Upload, BarChart2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import MyTracksTab from './MyTracksTab'
import MyStatsTab  from './MyStatsTab'
import UploadForm  from '../../components/music/UploadModal'

const TABS = [
  { id: 'tracks', label: '내 트랙', Icon: Music },
  { id: 'upload', label: '업로드',  Icon: Upload },
  { id: 'stats',  label: '통계',   Icon: BarChart2 },
]

const ROLE_LABELS = {
  artist:     { text: '아티스트',   color: '#60a5fa' },
  superadmin: { text: '슈퍼바이저', color: '#1D9E75' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [profile, setProfile] = useState(null)  // null=loading
  const [tab, setTab] = useState('tracks')

  useEffect(() => {
    if (!user) { setProfile(false); return }
    supabase.from('profiles').select('role, username').eq('id', user.id).single()
      .then(({ data }) => setProfile(data ?? false))
  }, [user])

  const allowed = profile && (profile.role === 'artist' || profile.role === 'superadmin')

  if (profile === null) return <Spinner />
  if (!allowed) return <Denied navigate={navigate} />

  const roleInfo = ROLE_LABELS[profile.role] ?? ROLE_LABELS.artist

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#070e0c',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,14,12,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(29,158,117,0.15)',
        padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: '4px', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#1D9E75' }}>WA</span>VERSE <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: roleInfo.color }}>DASHBOARD</span>
          </span>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: `${roleInfo.color}18`, color: roleInfo.color, border: `1px solid ${roleInfo.color}40` }}>
          {roleInfo.text}
        </span>
      </div>

      {/* 탭 바 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(29,158,117,0.1)',
        background: 'rgba(13,26,21,0.4)',
      }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '11px 8px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: tab === id ? '#1D9E75' : 'rgba(255,255,255,0.38)',
              borderBottom: tab === id ? '2px solid #1D9E75' : '2px solid transparent',
              fontSize: '10px', fontWeight: 600,
              transition: 'color 0.15s',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ paddingBottom: '32px' }}>
        {tab === 'tracks' && <MyTracksTab userId={user.id} />}
        {tab === 'upload' && (
          <div style={{ padding: '16px' }}>
            <UploadForm
              onSuccess={() => setTab('tracks')}
              onArtistPromotion={() => setTab('tracks')}
            />
          </div>
        )}
        {tab === 'stats' && <MyStatsTab userId={user.id} />}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#070e0c' }}>
      <Loader2 size={28} color="#1D9E75" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )
}

function Denied({ navigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#070e0c', gap: '14px', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '44px' }}>🎵</div>
      <p style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>아티스트 전용 페이지</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>아티스트 또는 슈퍼바이저 계정이 필요합니다</p>
      <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '8px', padding: '10px 24px' }}>
        홈으로 돌아가기
      </button>
    </div>
  )
}
