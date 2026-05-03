import { Loader2, Music2, Mic2 } from 'lucide-react'

export default function SheetView({ analysis, track }) {
  const status = analysis?.sheet_status || 'idle'

  if (status === 'idle') {
    return (
      <div style={center}>
        <Mic2 size={32} color="rgba(29,158,117,0.35)" style={{ marginBottom: '14px' }} />
        <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
          MR 분리 완료 후 자동으로 분석됩니다
        </p>
        <p style={{ ...mutedText, fontSize: '12px', marginTop: '4px' }}>
          MR 탭에서 먼저 분리를 시작하세요
        </p>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div style={center}>
        <Loader2 size={28} color="#1D9E75" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p style={mutedText}>악보 분석 중...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={center}>
        <p style={{ color: '#f87171', fontSize: '13px' }}>악보 분석 실패</p>
      </div>
    )
  }

  const key    = analysis?.sheet_key    || '?'
  const bpm    = analysis?.sheet_bpm    || '?'
  const chords = analysis?.sheet_chords || []
  const feel   = analysis?.sheet_feel   || ''
  const lyrics = analysis?.lyrics || ''
  const lines  = lyrics !== 'Instrumental' ? lyrics.split('\n').filter(l => l.trim()) : []

  return (
    <div style={{ padding: '20px 24px' }}>

      {/* 악보 메타 정보 */}
      <div style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap',
        marginBottom: '20px',
      }}>
        {[
          { label: '조성 (Key)', value: key },
          { label: '템포 (BPM)', value: String(bpm) },
          { label: '분위기', value: feel },
        ].filter(i => i.value && i.value !== '?').map(item => (
          <div key={item.label} style={{
            background: 'rgba(29,158,117,0.12)',
            border: '1px solid rgba(29,158,117,0.25)',
            borderRadius: '10px', padding: '8px 14px', flex: '1 1 auto',
          }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#4ecca3' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 코드 진행 */}
      {chords.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            코드 진행
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {chords.map((chord, i) => (
              <div key={i} style={{
                background: i % 2 === 0 ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(29,158,117,0.2)',
                borderRadius: '8px', padding: '8px 16px',
                fontSize: '17px', fontWeight: 800, color: 'white',
                letterSpacing: '-0.3px',
              }}>
                {chord}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 코드 리드 시트 */}
      {lines.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
            리드 시트
          </p>
          <div style={{
            background: 'rgba(13,26,21,0.8)',
            border: '1px solid rgba(29,158,117,0.1)',
            borderRadius: '14px', padding: '16px 20px',
          }}>
            {lines.map((line, i) => {
              const chord = chords.length ? chords[i % chords.length] : null
              return (
                <div key={i} style={{ marginBottom: '14px' }}>
                  {chord && (
                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#1D9E75', marginBottom: '2px', letterSpacing: '0.02em' }}>
                      {chord}
                    </p>
                  )}
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                    {line}
                  </p>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '10px', textAlign: 'center' }}>
            * AI가 분석한 예상 코드입니다. 실제와 다를 수 있습니다.
          </p>
        </div>
      )}

      {lines.length === 0 && chords.length === 0 && (
        <div style={center}>
          <Music2 size={32} color="rgba(29,158,117,0.35)" style={{ marginBottom: '12px' }} />
          <p style={mutedText}>악보 정보를 불러올 수 없습니다</p>
        </div>
      )}

      <div style={{ height: '40px' }} />
    </div>
  )
}

const center = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  minHeight: '160px', padding: '24px', textAlign: 'center',
}
const mutedText = { fontSize: '13px', color: 'rgba(255,255,255,0.4)' }
