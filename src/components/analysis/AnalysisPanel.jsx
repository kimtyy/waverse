import { useState } from 'react'
import { X, FileText, Music2, Mic2, Share2, Loader2, Sparkles } from 'lucide-react'
import { useAnalysis } from '../../hooks/useAnalysis'
import LyricsView from './LyricsView'
import SheetView  from './SheetView'
import MRPanel    from './MRPanel'
import SharePanel from './SharePanel'

const TABS = [
  { id: 'mr',     label: 'MR',    Icon: Mic2    },
  { id: 'lyrics', label: '가사',  Icon: FileText },
  { id: 'sheet',  label: '악보',  Icon: Music2  },
  { id: 'share',  label: '공유',  Icon: Share2  },
]

const statusDot = (status) => {
  if (status === 'processing') return '#facc15'
  if (status === 'done')       return '#1D9E75'
  if (status === 'error')      return '#f87171'
  return 'transparent'
}

export default function AnalysisPanel({ track, onClose }) {
  const [activeTab, setActiveTab] = useState('mr')
  const { analysis, starting, startAnalysis } = useAnalysis(track?.id)

  const handleStart = () => {
    if (!track) return
    startAnalysis(track.audio_url)
  }

  const dotOf = {
    mr:     statusDot(analysis?.mr_status),
    lyrics: statusDot(analysis?.lyrics_status),
    sheet:  statusDot(analysis?.sheet_status),
    share:  statusDot(analysis?.share_status),
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: '#070e0c',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowY: 'hidden',
    }}>
      {/* ── 헤더 ── */}
      <div style={{
        height: '56px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(29,158,117,0.15)',
        background: 'rgba(7,14,12,0.98)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#1D9E75" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'white', letterSpacing: '-0.2px' }}>
            AI 분석
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: '6px', display: 'flex' }}>
          <X size={22} />
        </button>
      </div>

      {/* ── 로딩 ── */}
      {analysis === undefined && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={24} color="#1D9E75" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* ── 탭 UI (analysis가 null 또는 object 모두 표시) ── */}
      {analysis !== undefined && (
        <>
          {/* 탭 바 */}
          <div style={{
            display: 'flex', flexShrink: 0,
            borderBottom: '1px solid rgba(29,158,117,0.1)',
            background: 'rgba(13,26,21,0.5)',
          }}>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1, padding: '10px 4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  color: activeTab === id ? '#1D9E75' : 'rgba(255,255,255,0.38)',
                  borderBottom: activeTab === id ? '2px solid #1D9E75' : '2px solid transparent',
                  fontSize: '10px', fontWeight: 700, position: 'relative',
                  transition: 'color 0.15s',
                }}
              >
                <Icon size={15} />
                {label}
                {dotOf[id] !== 'transparent' && (
                  <div style={{
                    position: 'absolute', top: '6px', right: '18%',
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: dotOf[id],
                    animation: dotOf[id] === '#facc15' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* 콘텐츠 */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'mr'     && <MRPanel    analysis={analysis} onStart={handleStart} starting={starting} />}
            {activeTab === 'lyrics' && <LyricsView analysis={analysis} />}
            {activeTab === 'sheet'  && <SheetView  analysis={analysis} track={track} />}
            {activeTab === 'share'  && <SharePanel analysis={analysis} track={track} />}
          </div>
        </>
      )}
    </div>
  )
}
