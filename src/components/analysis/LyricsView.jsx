import { Loader2, Music } from 'lucide-react'

export default function LyricsView({ analysis }) {
  const status = analysis?.lyrics_status || 'idle'
  const lyrics = analysis?.lyrics || ''

  if (status === 'idle' || status === 'processing') {
    return (
      <div style={center}>
        <Loader2 size={28} color="#1D9E75" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p style={mutedText}>가사 추출 중...</p>
        <p style={{ ...mutedText, fontSize: '11px', marginTop: '6px', opacity: 0.5 }}>
          Whisper AI가 음악을 분석하고 있습니다
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={center}>
        <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '6px' }}>가사 추출 실패</p>
        <p style={{ ...mutedText, fontSize: '11px' }}>{analysis?.error_info?.message || '다시 시도해 주세요'}</p>
      </div>
    )
  }

  if (lyrics === 'Instrumental') {
    return (
      <div style={center}>
        <Music size={36} color="rgba(29,158,117,0.4)" style={{ marginBottom: '14px' }} />
        <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>연주곡</p>
        <p style={mutedText}>가사가 없는 인스트루멘탈 트랙입니다</p>
      </div>
    )
  }

  const lines = lyrics.split('\n').filter(l => l.trim())

  return (
    <div style={{ padding: '20px 24px', lineHeight: 1.9 }}>
      {lines.map((line, i) => (
        <p
          key={i}
          style={{
            fontSize: '15px',
            color: line.trim() === '' ? 'transparent' : 'rgba(255,255,255,0.9)',
            marginBottom: line.trim() === '' ? '8px' : '2px',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}
        >
          {line || ' '}
        </p>
      ))}
      <div style={{ height: '40px' }} />
    </div>
  )
}

const center = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  minHeight: '200px', padding: '32px 24px', textAlign: 'center',
}
const mutedText = { fontSize: '13px', color: 'rgba(255,255,255,0.4)' }
