import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Music, Users, Flag, BarChart2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import TracksTab  from './TracksTab'
import UsersTab   from './UsersTab'
import ReportsTab from './ReportsTab'
import StatsTab   from './StatsTab'

const TABS = [
  { id: 'tracks',  label: '트랙', Icon: Music },
  { id: 'users',   label: '회원', Icon: Users },
  { id: 'reports', label: '신고', Icon: Flag },
  { id: 'stats',   label: '통계', Icon: BarChart2 },
]

export default function AdminPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [allowed, setAllowed] = useState(null)  // null=loading
  const [tab, setTab] = useState('tracks')

  useEffect(() => {
    if (!user) { setAllowed(false); return }
    supabase.from('profiles').select('role').eq('id', user.id).single()
      .then(({ data }) => setAllowed(data?.role === 'superadmin'))
  }, [user])

  if (allowed === null) return <Spinner />
  if (!allowed) return <Denied navigate={navigate} />

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
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: '4px', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>
          <span style={{ color: '#1D9E75' }}>WA</span>VERSE <span style={{ color: '#1D9E75', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>ADMIN</span>
        </span>
      </div>

      {/* 탭 바 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(29,158,117,0.1)',
        background: 'rgba(13,26,21,0.4)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, minWidth: '64px',
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
        {tab === 'tracks'  && <TracksTab />}
        {tab === 'users'   && <UsersTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'stats'   && <StatsTab />}
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
      <div style={{ fontSize: '44px' }}>🔒</div>
      <p style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>접근 권한이 없습니다</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>슈퍼바이저 계정으로 로그인해주세요</p>
      <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '8px', padding: '10px 24px' }}>
        홈으로 돌아가기
      </button>
    </div>
  )
}
