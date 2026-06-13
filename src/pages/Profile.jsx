import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Music, LogOut, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTracks, deleteTrack } from '../hooks/useMusic'
import { supabase } from '../lib/supabase'
import MusicCard from '../components/music/MusicCard'
import EditTrackModal from '../components/admin/EditTrackModal'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const { tracks } = useTracks({ userId: user?.id })
  const [newsletter, setNewsletter] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [editTrack, setEditTrack] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [trackOverrides, setTrackOverrides] = useState({})
  const [deletedIds, setDeletedIds] = useState(new Set())

  const displayTracks = tracks
    .filter(t => !deletedIds.has(t.id))
    .map(t => trackOverrides[t.id] ? { ...t, ...trackOverrides[t.id] } : t)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTrack(deleteTarget, user.id)
      setDeletedIds(prev => new Set([...prev, deleteTarget.id]))
      setDeleteTarget(null)
      toast.success('삭제됐습니다')
    } catch (e) {
      toast.error(e.message || '삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  const handleTrackSave = async (id, patch) => {
    const { error } = await supabase.from('tracks').update(patch).eq('id', id)
    if (error) throw error
    setTrackOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
    toast.success('수정 완료')
  }

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading])

  // 뉴스레터 구독 상태 로드
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('newsletter_subscribed')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setNewsletter(data.newsletter_subscribed ?? false)
      })
  }, [user?.id])

  if (loading || !user) return null

  const username = user.user_metadata?.username || user.email?.split('@')[0]
  const initial = username?.[0]?.toUpperCase() || 'U'

  const handleSignOut = () => {
    signOut()
    navigate('/auth')
  }

  const toggleNewsletter = async () => {
    setNewsletterLoading(true)
    const next = !newsletter
    const { error } = await supabase
      .from('profiles')
      .update({ newsletter_subscribed: next })
      .eq('id', user.id)
    if (error) {
      toast.error('설정 저장 실패')
    } else {
      setNewsletter(next)
      toast.success(next ? '뉴스레터 구독 완료!' : '구독 해제됐습니다')
    }
    setNewsletterLoading(false)
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

      {/* 설정 섹션 */}
      <div style={{ margin: '0 16px 4px', padding: '4px 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Mail size={16} color="#1D9E75" />
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>알림 설정</span>
        </div>

        <div style={{
          background: 'rgba(13,26,21,0.7)',
          border: '1px solid rgba(29,158,117,0.12)',
          borderRadius: '14px',
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>
                주간 뉴스레터
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>
                매주 월요일 TOP 5 트랙 이메일 수신
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggleNewsletter}
              disabled={newsletterLoading}
              style={{
                width: '48px', height: '28px',
                borderRadius: '14px',
                background: newsletter ? '#1D9E75' : 'rgba(255,255,255,0.12)',
                border: 'none', cursor: newsletterLoading ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
                opacity: newsletterLoading ? 0.6 : 1,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: newsletter ? '23px' : '3px',
                width: '22px', height: '22px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
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
        {displayTracks.length ? (
          displayTracks.map(track => (
            <MusicCard key={track.id} track={track} showCreator={false} onEdit={setEditTrack} onDelete={setDeleteTarget} />
          ))
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

      {editTrack && (
        <EditTrackModal
          track={editTrack}
          onSave={handleTrackSave}
          onClose={() => setEditTrack(null)}
        />
      )}

      {deleteTarget && (
        <div onClick={() => setDeleteTarget(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '320px', background: '#0d1a16', borderRadius: '16px', border: '1px solid rgba(248,113,113,0.3)', padding: '24px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>트랙 삭제</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', lineHeight: 1.6 }}>
              <span style={{ color: 'white', fontWeight: 600 }}>{deleteTarget.title}</span>을(를) 삭제하면<br />파일도 함께 삭제됩니다.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn-outline" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>취소</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', fontSize: '13px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
