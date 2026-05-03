import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon } from 'lucide-react'
import UploadForm from '../components/music/UploadModal'
import { useAuth } from '../hooks/useAuth'

export default function Upload() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading])

  if (loading || !user) return null

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '11px',
            background: 'rgba(29,158,117,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UploadIcon size={17} color="#1D9E75" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
            트랙 등록
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', paddingLeft: '44px' }}>
          음악을 커뮤니티와 공유하세요
        </p>
      </div>

      <div style={{
        background: 'rgba(13,26,21,0.8)',
        border: '1px solid rgba(29,158,117,0.15)',
        borderRadius: '20px',
        padding: '20px',
      }}>
        <UploadForm onSuccess={() => navigate('/')} onArtistPromotion={() => navigate('/dashboard')} />
      </div>
      <div style={{ height: '16px' }} />
    </div>
  )
}
