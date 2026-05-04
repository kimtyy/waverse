import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

const BASE_URL = 'https://waverse.net'

function Btn({ color, bg, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        padding: '10px 14px', borderRadius: '10px',
        background: bg || 'rgba(255,255,255,0.07)',
        border: `1px solid ${color}30`,
        color, fontSize: '12px', fontWeight: 700,
        cursor: 'pointer', flex: '1 1 auto', minWidth: '90px',
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export default function ShareButtons({ track }) {
  const [copied, setCopied] = useState(false)

  const title     = track?.title  || ''
  const artist    = track?.artist || '-'
  const link      = `${BASE_URL}/track/${track?.id}`
  const shareText = `🎵 ${title} - ${artist}\nWAVERSE에서 들어보세요!`
  const text      = `${shareText}\n${link}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    toast.success('링크 복사됨!')
    setTimeout(() => setCopied(false), 2000)
  }

  const webShare = () => {
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else copyLink()
  }

  const toX = () => window.open(
    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
    '_blank', 'noopener'
  )

  const toKakao = () => {
    const kakaoKey = import.meta.env.VITE_KAKAO_APP_KEY
    if (!kakaoKey) {
      navigator.clipboard.writeText(link).catch(() => {})
      toast('카카오에 링크를 붙여넣으세요', { icon: 'ℹ️' })
      return
    }
    const doShare = () => {
      if (!window.Kakao.isInitialized()) window.Kakao.init(kakaoKey)
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: 'WAVERSE에서 들어보세요!',
          imageUrl: track?.cover_url || undefined,
          link: { mobileWebUrl: link, webUrl: link },
        },
        buttons: [{ title: '듣기', link: { mobileWebUrl: link, webUrl: link } }],
      })
    }
    if (window.Kakao) {
      doShare()
    } else {
      const s = document.createElement('script')
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
      s.onload = doShare
      document.head.appendChild(s)
    }
  }

  const toFacebook = () => window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    '_blank', 'noopener'
  )

  const toThreads = () => window.open(
    `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText + ' ' + link)}`,
    '_blank', 'noopener'
  )

  const toInsta = () => {
    navigator.clipboard.writeText(link).catch(() => {})
    toast('인스타에 붙여넣으세요! 📋')
  }

  const toTikTok = () => {
    navigator.clipboard.writeText(link).catch(() => {})
    toast('틱톡에 붙여넣으세요! 📋')
  }

  return (
    <>
      {/* 공유 텍스트 미리보기 */}
      <div style={{
        background: 'rgba(29,158,117,0.08)',
        border: '1px solid rgba(29,158,117,0.2)',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '16px',
      }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
          🎵 {title} - {artist}
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>
          WAVERSE에서 들어보세요!
        </p>
        <p style={{ fontSize: '11px', color: '#4ecca3', wordBreak: 'break-all' }}>{link}</p>
      </div>

      {/* 링크 복사 + 기본 공유 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <Btn color={copied ? '#4ecca3' : 'rgba(255,255,255,0.7)'} onClick={copyLink}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>링크 복사</span>
        </Btn>
        <Btn color="#4ecca3" bg="rgba(29,158,117,0.15)" onClick={webShare}>
          <Share2 size={14} />
          <span>공유하기</span>
        </Btn>
      </div>

      {/* SNS 6개 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>

        {/* X (Twitter) */}
        <Btn color="#fff" bg="rgba(0,0,0,0.5)" onClick={toX}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>X</span>
        </Btn>

        {/* 카카오 */}
        <Btn color="#FEE500" bg="rgba(254,229,0,0.12)" onClick={toKakao}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#FEE500">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.5 5.1 3.8 6.6L5 21l4.3-2.8c.9.2 1.8.3 2.7.3 5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
          </svg>
          <span>카카오</span>
        </Btn>

        {/* 페이스북 */}
        <Btn color="#1877F2" bg="rgba(24,119,242,0.12)" onClick={toFacebook}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>페이스북</span>
        </Btn>

        {/* 스레드 */}
        <Btn color="white" bg="rgba(255,255,255,0.07)" onClick={toThreads}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
          </svg>
          <span>스레드</span>
        </Btn>

        {/* 인스타 */}
        <Btn color="#E1306C" bg="rgba(225,48,108,0.1)" onClick={toInsta}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none"/>
          </svg>
          <span>인스타</span>
        </Btn>

        {/* 틱톡 */}
        <Btn color="white" bg="rgba(255,255,255,0.07)" onClick={toTikTok}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.5a8.17 8.17 0 004.78 1.52V6.57a4.85 4.85 0 01-1.01.12z"/>
          </svg>
          <span>틱톡</span>
        </Btn>

      </div>

      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        인스타 · 틱톡: 링크 복사 후 직접 게시하세요
      </p>
    </>
  )
}
