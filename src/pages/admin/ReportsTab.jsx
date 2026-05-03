import { useState } from 'react'
import { Flag } from 'lucide-react'
import { useAdminReports } from '../../hooks/useAdmin'
import toast from 'react-hot-toast'

const FILTERS = [
  { value: 'pending',   label: '대기' },
  { value: 'resolved',  label: '처리 완료' },
  { value: 'dismissed', label: '기각' },
  { value: 'all',       label: '전체' },
]

const STATUS = {
  pending:   { label: '대기 중',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  resolved:  { label: '처리 완료', color: '#1D9E75', bg: 'rgba(29,158,117,0.1)' },
  dismissed: { label: '기각',      color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
}

function ReportRow({ report, onUpdateStatus }) {
  const s = STATUS[report.status] ?? STATUS.pending
  const [busy, setBusy] = useState(false)

  const handle = async (status) => {
    setBusy(true)
    try {
      await onUpdateStatus(report.id, status)
      toast.success(status === 'resolved' ? '처리 완료' : '기각 완료')
    } catch {
      toast.error('처리 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
              {report.track?.title ?? '(삭제된 트랙)'}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
              — {report.track?.artist || '아티스트 미상'}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
            신고자: {report.reporter?.username ?? '—'} · {new Date(report.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: s.bg, color: s.color, flexShrink: 0 }}>
          {s.label}
        </span>
      </div>

      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '10px' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{report.reason}</p>
      </div>

      {report.status === 'pending' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handle('resolved')} disabled={busy}
            style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '8px', color: '#1D9E75', cursor: 'pointer' }}
          >
            처리 완료
          </button>
          <button
            onClick={() => handle('dismissed')} disabled={busy}
            style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
          >
            기각
          </button>
        </div>
      )}
    </div>
  )
}

export default function ReportsTab() {
  const [filter, setFilter] = useState('pending')
  const { reports, loading, updateStatus } = useAdminReports()

  const visible = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  return (
    <div style={{ padding: '12px 14px' }}>
      {/* 필터 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: '9999px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              border: 'none',
              background: filter === f.value ? '#1D9E75' : 'rgba(255,255,255,0.07)',
              color: filter === f.value ? 'white' : 'rgba(255,255,255,0.5)',
            }}
          >
            {f.label}
            {f.value !== 'all' && (
              <span style={{ marginLeft: '4px', opacity: 0.75 }}>
                ({reports.filter(r => r.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ background: 'rgba(13,26,21,0.6)', borderRadius: '14px', border: '1px solid rgba(29,158,117,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>로딩 중...</p>
        ) : visible.length ? (
          visible.map(r => <ReportRow key={r.id} report={r} onUpdateStatus={updateStatus} />)
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Flag size={32} style={{ margin: '0 auto 10px', display: 'block', color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>신고 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
