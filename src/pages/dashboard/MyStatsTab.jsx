import { Music, Play, Heart } from 'lucide-react'
import { useMyStats } from '../../hooks/useDashboard'

function StatCard({ icon: Icon, label, value, color = '#1D9E75' }) {
  return (
    <div style={{ background: 'rgba(13,26,21,0.7)', border: '1px solid rgba(29,158,117,0.12)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: '26px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
        {value?.toLocaleString('ko-KR') ?? '—'}
      </span>
    </div>
  )
}

export default function MyStatsTab({ userId }) {
  const { stats, loading } = useMyStats(userId)

  if (loading) {
    return (
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '14px' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard icon={Music} label="내 트랙"   value={stats?.trackCount} />
        <StatCard icon={Play}  label="총 재생수" value={stats?.totalPlays} />
        <StatCard icon={Heart} label="총 좋아요" value={stats?.likeCount} color="#f472b6" />
      </div>

      {stats?.topPlayed?.length > 0 && (
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>인기 트랙 TOP 5</p>
          <div style={{ background: 'rgba(13,26,21,0.6)', borderRadius: '14px', border: '1px solid rgba(29,158,117,0.1)', overflow: 'hidden' }}>
            {stats.topPlayed.map((track, i) => (
              <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
                <span style={{ width: '18px', fontSize: '12px', fontWeight: 700, color: i < 3 ? '#1D9E75' : 'rgba(255,255,255,0.3)', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '7px', overflow: 'hidden', background: 'rgba(13,26,21,0.8)', border: '1px solid rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {track.cover_url
                    ? <img src={track.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Music size={14} color="rgba(29,158,117,0.4)" />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {track.is_public === false ? '🔒 비공개 · ' : ''}{track.artist || '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Play size={11} color="#1D9E75" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D9E75' }}>{(track.play_count ?? 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
