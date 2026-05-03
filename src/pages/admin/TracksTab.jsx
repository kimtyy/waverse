import { useState } from 'react'
import { Search, Music, Pencil, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useAdminTracks } from '../../hooks/useAdmin'
import EditTrackModal from '../../components/admin/EditTrackModal'
import UploadForm from '../../components/music/UploadModal'
import toast from 'react-hot-toast'

function DeleteConfirm({ track, onConfirm, onCancel, loading }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '320px', background: '#0d1a16', borderRadius: '16px', border: '1px solid rgba(248,113,113,0.3)', padding: '24px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>트랙 삭제</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', lineHeight: 1.5 }}>
          <span style={{ color: 'white', fontWeight: 600 }}>{track.title}</span>을 삭제하면<br />
          스토리지 파일도 함께 삭제됩니다.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} className="btn-outline" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>취소</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px', fontSize: '13px', background: '#ef4444', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TrackRow({ track, onEdit, onDelete, onTogglePublic }) {
  const isPublic = track.is_public !== false
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px',
      borderBottom: '1px solid rgba(29,158,117,0.07)',
      background: isPublic ? 'transparent' : 'rgba(255,255,255,0.02)',
    }}>
      {/* 커버 */}
      <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: 'rgba(13,26,21,0.8)', border: '1px solid rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {track.cover_url
          ? <img src={track.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Music size={16} color="rgba(29,158,117,0.4)" />
        }
      </div>

      {/* 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {track.title}
          </span>
          {!isPublic && (
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>비공개</span>
          )}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[track.artist, track.maker].filter(Boolean).join(' · ') || '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
          {track.genre && <span className="tag" style={{ fontSize: '9px', padding: '1px 6px' }}>{track.genre}</span>}
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>▶ {track.play_count ?? 0}</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{track.profiles?.username || '—'}</span>
        </div>
      </div>

      {/* 액션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <button onClick={() => onTogglePublic(track)} title={isPublic ? '비공개로 전환' : '공개로 전환'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: isPublic ? '#1D9E75' : 'rgba(255,255,255,0.3)', display: 'flex' }}>
          {isPublic ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button onClick={() => onEdit(track)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
          <Pencil size={15} />
        </button>
        <button onClick={() => onDelete(track)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'rgba(248,113,113,0.6)', display: 'flex' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export default function TracksTab() {
  const [search,      setSearch]      = useState('')
  const [editTrack,   setEditTrack]   = useState(null)
  const [deleteTrack, setDeleteTrack] = useState(null)
  const [deleting,    setDeleting]    = useState(false)
  const [showUpload,  setShowUpload]  = useState(false)

  const { tracks, loading, error, reload, deleteTrack: doDelete, updateTrack } = useAdminTracks(search)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await doDelete(deleteTrack)
      toast.success('삭제 완료')
      setDeleteTrack(null)
    } catch (e) {
      toast.error(e.message || '삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  const handleTogglePublic = async (track) => {
    try {
      await updateTrack(track.id, { is_public: !track.is_public })
    } catch (e) {
      toast.error('설정 변경 실패')
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(13,26,21,0.9)',
    border: '1.5px solid rgba(29,158,117,0.2)',
    borderRadius: '10px', padding: '10px 10px 10px 36px',
    color: 'white', fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
  }

  return (
    <div>
      {/* 툴바 */}
      <div style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="트랙, 아티스트 검색..." style={inputStyle} />
        </div>
        <button onClick={reload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '8px', display: 'flex' }}>
          <RefreshCw size={16} />
        </button>
        <button
          onClick={() => setShowUpload(p => !p)}
          className="btn-primary"
          style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
        >
          {showUpload ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          업로드
        </button>
      </div>

      {/* 업로드 섹션 (접이식) */}
      {showUpload && (
        <div style={{ margin: '0 14px 14px', padding: '16px', background: 'rgba(29,158,117,0.06)', borderRadius: '14px', border: '1px solid rgba(29,158,117,0.15)' }}>
          <UploadForm onSuccess={() => { setShowUpload(false); reload() }} />
        </div>
      )}

      {/* 트랙 목록 */}
      <div style={{ padding: '0 14px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>
          {loading ? '로딩 중...' : `${tracks.length}개 트랙`}
        </p>
        <div style={{ background: 'rgba(13,26,21,0.6)', borderRadius: '14px', border: '1px solid rgba(29,158,117,0.1)', overflow: 'hidden' }}>
          {error ? (
            <p style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#f87171' }}>{error}</p>
          ) : loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '12px', width: '55%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '35%' }} />
                </div>
              </div>
            ))
          ) : tracks.length ? (
            tracks.map(t => (
              <TrackRow
                key={t.id} track={t}
                onEdit={setEditTrack}
                onDelete={setDeleteTrack}
                onTogglePublic={handleTogglePublic}
              />
            ))
          ) : (
            <p style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>트랙이 없습니다</p>
          )}
        </div>
      </div>

      {editTrack && (
        <EditTrackModal
          track={editTrack}
          onSave={async (id, patch) => { await updateTrack(id, patch); toast.success('수정 완료') }}
          onClose={() => setEditTrack(null)}
        />
      )}
      {deleteTrack && (
        <DeleteConfirm
          track={deleteTrack}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTrack(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
