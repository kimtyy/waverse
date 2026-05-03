import { useState } from 'react'
import { Search, User } from 'lucide-react'
import { useAdminUsers } from '../../hooks/useAdmin'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'user',       label: '일반',       color: 'rgba(255,255,255,0.3)' },
  { value: 'artist',     label: '아티스트',   color: '#60a5fa' },
  { value: 'superadmin', label: '슈퍼바이저', color: '#1D9E75' },
]

function RoleBadge({ role }) {
  const r = ROLES.find(r => r.value === role) ?? ROLES[0]
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700,
      padding: '2px 7px', borderRadius: '9999px',
      background: `${r.color}20`,
      color: r.color,
      border: `1px solid ${r.color}40`,
    }}>
      {r.label}
    </span>
  )
}

function UserRow({ user, onRoleChange }) {
  const [changing, setChanging] = useState(false)

  const handleChange = async (e) => {
    const newRole = e.target.value
    if (newRole === user.role) return
    setChanging(true)
    try {
      await onRoleChange(user.id, newRole)
      toast.success(`권한 변경: ${ROLES.find(r => r.value === newRole)?.label}`)
    } catch {
      toast.error('권한 변경 실패')
    } finally {
      setChanging(false)
    }
  }

  const initials = user.username?.slice(0, 2).toUpperCase() || '??'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '11px 14px',
      borderBottom: '1px solid rgba(29,158,117,0.07)',
    }}>
      {/* 아바타 */}
      <div style={{
        width: '38px', height: '38px', flexShrink: 0,
        borderRadius: '50%', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a2e20, #0d3a28)',
        border: '1.5px solid rgba(29,158,117,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D9E75' }}>{initials}</span>
        }
      </div>

      {/* 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.username}
          </span>
          <RoleBadge role={user.role ?? 'user'} />
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email || '—'}
        </p>
      </div>

      {/* 권한 변경 */}
      <select
        value={user.role ?? 'user'}
        onChange={handleChange}
        disabled={changing}
        style={{
          background: 'rgba(13,26,21,0.9)',
          border: '1px solid rgba(29,158,117,0.2)',
          borderRadius: '8px', padding: '5px 8px',
          color: 'white', fontSize: '11px',
          cursor: 'pointer', outline: 'none',
          flexShrink: 0,
        }}
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function UsersTab() {
  const [search, setSearch] = useState('')
  const { users, loading, changeRole } = useAdminUsers(search)

  return (
    <div style={{ padding: '12px 14px' }}>
      {/* 검색 */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="유저명, 이메일 검색..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(13,26,21,0.9)',
            border: '1.5px solid rgba(29,158,117,0.2)',
            borderRadius: '10px', padding: '10px 10px 10px 36px',
            color: 'white', fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            outline: 'none',
          }}
        />
      </div>

      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>
        {loading ? '로딩 중...' : `${users.length}명`}
      </p>

      <div style={{ background: 'rgba(13,26,21,0.6)', borderRadius: '14px', border: '1px solid rgba(29,158,117,0.1)', overflow: 'hidden' }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '11px 14px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
              <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: '12px', width: '45%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '10px', width: '65%' }} />
              </div>
            </div>
          ))
        ) : users.length ? (
          users.map(u => <UserRow key={u.id} user={u} onRoleChange={changeRole} />)
        ) : (
          <p style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            <User size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
            회원이 없습니다
          </p>
        )}
      </div>
    </div>
  )
}
