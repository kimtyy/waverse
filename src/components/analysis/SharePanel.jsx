import { useState } from 'react'
import { Loader2, Copy, Check, Share2, Mic2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PLATFORM_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://waverse.net'

function ShareButton({ label, color, bg, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '11px 14px', borderRadius: '12px',
        background: bg || 'rgba(255,255,255,0.07)',
        border: `1px solid ${color}30`,
        color, fontSize: '13px', fontWeight: 700,
        cursor: 'pointer', flex: '1 1 auto', minWidth: '100px',
        transition: 'all 0.15s',
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export default function SharePanel({ analysis, track }) {
  const status = analysis?.share_status || 'idle'
  const [copied, setCopied]       = useState(false)
  const [editTitle, setEditTitle] = useState(null)
  const [editDesc,  setEditDesc]  = useState(null)

  if (status === 'idle') {
    return (
      <div style={center}>
        <Mic2 size={32} color="rgba(29,158,117,0.35)" style={{ marginBottom: '14px' }} />
        <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
          MR 분리 완료 후 자동으로 생성됩니다
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
        <p style={mutedText}>공유 콘텐츠 생성 중...</p>
      </div>
    )
  }

  const shareTitle = editTitle  ?? analysis?.share_title  ?? track?.title ?? ''
  const shareDesc  = editDesc   ?? analysis?.share_desc   ?? ''
  const shareTags  = analysis?.share_tags  ?? ['#WAVERSE']
  const highlight  = analysis?.highlight_start ?? 0

  const shareUrl  = `${PLATFORM_BASE_URL}/?play=${track?.id}&t=${Math.floor(highlight)}`
  const shareText = `${shareTitle}\n\n${shareDesc}\n\n${shareTags.join(' ')}`
  const fullText  = `${shareText}\n\n${shareUrl}`

  const copy = async (text) => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    toast.success('복사됨!')
    setTimeout(() => setCopied(false), 2000)
  }

  const webShare = () => {
    if (navigator.share) {
      navigator.share({ title: shareTitle, text: shareDesc + '\n\n' + shareTags.join(' '), url: shareUrl })
        .catch(() => {})
    } else {
      copy(fullText)
    }
  }

  const toTwitter = () => {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`
    window.open(url, '_blank', 'noopener')
  }

  const toKakao = () => {
    // Kakao SDK 필요 — SDK 연동 후 아래 주석 해제
    // window.Kakao?.Share?.sendDefault({ objectType: 'text', text: shareText, link: { webUrl: shareUrl } })
    copy(fullText)
    toast('카카오 SDK 연동 후 사용 가능합니다\n링크를 복사했습니다', { icon: 'ℹ️' })
  }

  return (
    <div style={{ padding: '20px 24px' }}>

      {/* AI 생성 콘텐츠 */}
      <div style={{ marginBottom: '20px' }}>
        <p style={sectionLabel}>AI 생성 제목</p>
        <input
          value={shareTitle}
          onChange={e => setEditTitle(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={sectionLabel}>AI 생성 설명</p>
        <textarea
          value={shareDesc}
          onChange={e => setEditDesc(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <p style={sectionLabel}>해시태그</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {shareTags.map((tag, i) => (
            <span key={i} style={{
              background: tag === '#WAVERSE' ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${tag === '#WAVERSE' ? 'rgba(29,158,117,0.35)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '9999px', padding: '4px 10px',
              fontSize: '12px', fontWeight: 600,
              color: tag === '#WAVERSE' ? '#4ecca3' : 'rgba(255,255,255,0.6)',
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* 하이라이트 구간 */}
      <div style={{
        background: 'rgba(29,158,117,0.08)',
        border: '1px solid rgba(29,158,117,0.2)',
        borderRadius: '12px', padding: '12px 14px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#4ecca3' }}>
            하이라이트 구간: {Math.floor(highlight / 60)}:{String(Math.floor(highlight % 60)).padStart(2, '0')}
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
            AI가 선정한 가장 임팩트 있는 30초 구간
          </p>
        </div>
      </div>

      {/* 공유 버튼 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <ShareButton label="링크 복사" color={copied ? '#4ecca3' : 'rgba(255,255,255,0.7)'} onClick={() => copy(shareUrl)}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </ShareButton>
        <ShareButton label="공유하기" color="#4ecca3" bg="rgba(29,158,117,0.15)" onClick={webShare}>
          <Share2 size={15} />
        </ShareButton>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <ShareButton label="X (Twitter)" color="#fff" bg="rgba(0,0,0,0.5)" onClick={toTwitter}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </ShareButton>
        <ShareButton label="카카오" color="#FEE500" bg="rgba(254,229,0,0.12)" onClick={toKakao}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FEE500"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.5 5.1 3.8 6.6L5 21l4.3-2.8c.9.2 1.8.3 2.7.3 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
        </ShareButton>
        <ShareButton label="인스타" color="#E1306C" bg="rgba(225,48,108,0.1)" onClick={() => copy(shareText)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none"/></svg>
        </ShareButton>
        <ShareButton label="틱톡" color="white" bg="rgba(255,255,255,0.07)" onClick={() => copy(shareText)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.5a8.17 8.17 0 004.78 1.52V6.57a4.85 4.85 0 01-1.01.12z"/></svg>
        </ShareButton>
      </div>

      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        인스타 · 틱톡: 텍스트 복사 후 직접 게시하세요
      </p>
      <div style={{ height: 'calc(env(safe-area-inset-bottom) + 24px)' }} />
    </div>
  )
}

const center = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  minHeight: '200px', padding: '32px 24px', textAlign: 'center',
}
const mutedText = { fontSize: '13px', color: 'rgba(255,255,255,0.4)' }
const sectionLabel = { fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(13,26,21,0.9)',
  border: '1.5px solid rgba(29,158,117,0.2)',
  borderRadius: '10px', padding: '10px 12px',
  color: 'white', fontSize: '14px',
  fontFamily: 'Inter, system-ui, sans-serif',
  outline: 'none', WebkitAppearance: 'none',
}
