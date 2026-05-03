import { useState, useRef, useCallback } from 'react'
import {
  Upload, ImageIcon, Loader2, User2, X,
  CheckCircle2, AlertCircle, PlusCircle,
} from 'lucide-react'
import { uploadTrack } from '../../hooks/useMusic'
import { useAuth } from '../../hooks/useAuth'
import { GENRES, genreLabel } from '../../lib/genres'
import toast from 'react-hot-toast'

/* ── 파일명 파싱 ─────────────────────────────────────────── */
function parseFilename(filename) {
  const stem = filename.replace(/\.[^/.]+$/, '').trim()
  const dashIdx = stem.indexOf(' - ')
  if (dashIdx === -1) return { artist: '', title: stem }
  const artist = stem.slice(0, dashIdx).trim()
  const title  = stem.slice(dashIdx + 3).trim().replace(/\s*\(\d+\)\s*$/, '').trim()
  return { artist, title }
}

/* ── IME-safe field hook ─────────────────────────────────── */
function useField(initial = '') {
  const [value, setValue] = useState(initial)
  const composing = useRef(false)
  const inputProps = {
    value,
    onChange:           (e) => setValue(e.target.value),
    onCompositionStart: ()  => { composing.current = true },
    onCompositionEnd:   (e) => { composing.current = false; setValue(e.target.value) },
  }
  return [value, setValue, inputProps]
}

/* ── 공통 필드 래퍼 ──────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 600,
        color: 'rgba(255,255,255,0.5)', marginBottom: '6px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

/* ── 트랙 행 ─────────────────────────────────────────────── */
function TrackRow({ track, onUpdate, onRemove, status, disabled }) {
  const coverRef = useRef()

  // 로컬 IME 상태 — 부모 리렌더가 조합을 끊지 않도록
  const [title,  setTitle]  = useState(track.title)
  const [artist, setArtist] = useState(track.artist)

  const sync = (field, val) => onUpdate(track.id, { [field]: val })

  const handleCover = (e) => {
    const f = e.target.files[0]
    if (!f) return
    onUpdate(track.id, { coverFile: f, coverPreview: URL.createObjectURL(f) })
  }

  const isDone      = status === 'done'
  const isUploading = status === 'uploading'
  const isError     = typeof status === 'string' && status.startsWith('error:')

  const rowInput = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(29,158,117,0.18)',
    borderRadius: '7px',
    padding: '5px 8px',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none', WebkitAppearance: 'none',
    opacity: isDone ? 0.55 : 1,
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '10px 12px',
      borderBottom: '1px solid rgba(29,158,117,0.07)',
      background: isDone   ? 'rgba(29,158,117,0.05)'
                : isError  ? 'rgba(248,113,113,0.05)'
                : 'transparent',
      transition: 'background 0.2s',
    }}>

      {/* 커버 썸네일 */}
      <div
        onClick={() => !isDone && !isUploading && coverRef.current?.click()}
        style={{
          width: '44px', height: '44px', flexShrink: 0,
          borderRadius: '8px', overflow: 'hidden',
          border: '1px dashed rgba(29,158,117,0.3)',
          background: 'rgba(13,26,21,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isDone || isUploading ? 'default' : 'pointer',
        }}
      >
        <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCover} />
        {track.coverPreview
          ? <img src={track.coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <ImageIcon size={16} color="rgba(29,158,117,0.35)" />
        }
      </div>

      {/* 가수 · 제목 입력 */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <input
          value={artist}
          placeholder="가수명"
          disabled={isDone || isUploading || disabled}
          style={{ ...rowInput, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
          onChange={(e) => { setArtist(e.target.value); sync('artist', e.target.value) }}
          onCompositionEnd={(e) => { setArtist(e.target.value); sync('artist', e.target.value) }}
          autoComplete="off" spellCheck={false}
        />
        <input
          value={title}
          placeholder="곡 제목 *"
          disabled={isDone || isUploading || disabled}
          style={{ ...rowInput, fontSize: '13px', fontWeight: 600 }}
          onChange={(e) => { setTitle(e.target.value); sync('title', e.target.value) }}
          onCompositionEnd={(e) => { setTitle(e.target.value); sync('title', e.target.value) }}
          autoComplete="off" spellCheck={false}
        />
        {isError && (
          <p style={{ fontSize: '10px', color: '#f87171' }}>
            {status.slice(6)}
          </p>
        )}
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {track.file.name}
        </p>
      </div>

      {/* 상태 */}
      <div style={{ paddingTop: '4px', flexShrink: 0 }}>
        {isUploading ? (
          <Loader2 size={16} color="#1D9E75" style={{ animation: 'spin 1s linear infinite' }} />
        ) : isDone ? (
          <CheckCircle2 size={18} color="#1D9E75" />
        ) : isError ? (
          <AlertCircle size={18} color="#f87171" />
        ) : (
          <button
            type="button"
            onClick={() => onRemove(track.id)}
            disabled={disabled}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: 'rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── 메인 폼 ──────────────────────────────────────────────── */
export default function UploadForm({ onSuccess }) {
  const { user } = useAuth()

  const [trackList, setTrackList] = useState([])
  const [maker, , makerProps]     = useField('')
  const [genre, setGenre]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [statuses, setStatuses]   = useState({})  // { id: 'uploading' | 'done' | 'error:msg' }
  const [dragOver, setDragOver]   = useState(false)

  const audioRef = useRef()

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter(f => /\.(mp3|mp4)$/i.test(f.name) || f.type === 'audio/mpeg' || f.type === 'video/mp4')
    if (!files.length) { toast.error('MP3 또는 MP4 파일만 업로드 가능합니다'); return }
    setTrackList(prev => [
      ...prev,
      ...files.map(f => ({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        ...parseFilename(f.name),
        coverFile: null, coverPreview: null,
      })),
    ])
  }, [])

  const handleFileInput = useCallback((e) => {
    if (e.target.files?.length) { addFiles(e.target.files); e.target.value = '' }
  }, [addFiles])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const updateTrack = useCallback((id, patch) =>
    setTrackList(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  , [])

  const removeTrack = useCallback((id) => {
    setTrackList(prev => prev.filter(t => t.id !== id))
    setStatuses(prev => { const n = { ...prev }; delete n[id]; return n })
  }, [])

  const clearDone = () => {
    const doneIds = new Set(
      Object.entries(statuses).filter(([, v]) => v === 'done').map(([k]) => k)
    )
    setTrackList(prev => prev.filter(t => !doneIds.has(t.id)))
    setStatuses(prev => {
      const n = { ...prev }
      doneIds.forEach(id => delete n[id])
      return n
    })
  }

  const pendingTracks = trackList.filter(t => statuses[t.id] !== 'done')
  const doneCount     = trackList.length - pendingTracks.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!trackList.length) return toast.error('파일을 선택해 주세요')
    if (!user)             return toast.error('로그인이 필요합니다')
    if (!pendingTracks.length) { toast.success('모두 업로드되었습니다'); return }

    const invalid = pendingTracks.filter(t => !t.title.trim())
    if (invalid.length) {
      toast.error(`제목이 없는 트랙 ${invalid.length}개를 확인해 주세요`)
      return
    }

    setUploading(true)
    let ok = 0, fail = 0

    for (const track of pendingTracks) {
      setStatuses(prev => ({ ...prev, [track.id]: 'uploading' }))
      try {
        await uploadTrack({
          file:      track.coverFile,
          audioFile: track.file,
          userId:    user.id,
          title:     track.title,
          artist:    track.artist,
          creator:   maker,
          genre,
          description: '',
          tags: [],
        })
        setStatuses(prev => ({ ...prev, [track.id]: 'done' }))
        ok++
      } catch (err) {
        setStatuses(prev => ({ ...prev, [track.id]: `error:${err.message || '업로드 실패'}` }))
        fail++
      }
    }

    setUploading(false)

    if (fail === 0) {
      toast.success(`${ok}개 트랙 업로드 완료!`)
      onSuccess?.()
    } else {
      toast.error(`${ok}개 완료, ${fail}개 실패`)
    }
  }

  /* ── 스타일 상수 ── */
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(13,26,21,0.9)',
    border: '1.5px solid rgba(29,158,117,0.2)',
    borderRadius: '10px',
    padding: '11px 13px',
    color: 'white', fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none', WebkitAppearance: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── 파일 드롭존 ───────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => audioRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#1D9E75' : 'rgba(29,158,117,0.25)'}`,
          borderRadius: '16px',
          padding: trackList.length ? '14px 20px' : '22px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'rgba(29,158,117,0.08)' : 'transparent',
          transition: 'all 0.18s',
        }}
      >
        <input
          ref={audioRef} type="file" accept=".mp3,.mp4,audio/mpeg,video/mp4"
          multiple style={{ display: 'none' }}
          onChange={handleFileInput}
        />

        {trackList.length ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1D9E75' }}>
            <PlusCircle size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>파일 더 추가하기</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              현재 {trackList.length}개
            </span>
          </div>
        ) : (
          <>
            <Upload size={28} color="rgba(29,158,117,0.4)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              오디오 파일 선택 또는 드래그
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
              MP3 · MP4 — 여러 파일 동시 선택 가능
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(29,158,117,0.6)', marginTop: '6px' }}>
              "가수명 - 곡제목.mp3" 형태면 자동 추출됩니다
            </p>
          </>
        )}
      </div>

      {/* ── 공통 설정 + 트랙 목록 (파일 선택 후 표시) ── */}
      {trackList.length > 0 && (
        <>
          {/* 제작자 */}
          <Field label="제작자 (전체 공통)">
            <div style={{ position: 'relative' }}>
              <User2 size={14} style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Suno, Udio, 직접 제작 등"
                style={{ ...base, paddingLeft: '34px' }}
                autoComplete="off" spellCheck={false}
                {...makerProps}
              />
            </div>
          </Field>

          {/* 장르 */}
          <Field label="장르 (전체 공통)">
            <select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
              <option value="">장르 선택</option>
              {GENRES.map(g => (
                <option key={g.value} value={g.value}>{genreLabel(g.value)}</option>
              ))}
            </select>
          </Field>

          {/* 트랙 목록 */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                트랙 목록
                {doneCount > 0 && (
                  <span style={{ marginLeft: '6px', color: '#1D9E75' }}>
                    ✓ {doneCount}/{trackList.length}
                  </span>
                )}
              </span>
              {doneCount > 0 && !uploading && (
                <button
                  type="button" onClick={clearDone}
                  style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  완료 항목 지우기
                </button>
              )}
            </div>

            <div style={{
              background: 'rgba(13,26,21,0.6)',
              borderRadius: '14px',
              border: '1px solid rgba(29,158,117,0.1)',
              overflow: 'hidden',
              maxHeight: '340px', overflowY: 'auto',
            }}>
              {trackList.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onUpdate={updateTrack}
                  onRemove={removeTrack}
                  status={statuses[track.id]}
                  disabled={uploading}
                />
              ))}
            </div>
          </div>

          {/* 업로드 버튼 */}
          <button
            type="submit"
            disabled={uploading || pendingTracks.length === 0}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '4px' }}
          >
            {uploading ? (
              <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> 업로드 중...</>
            ) : (
              <><Upload size={17} /> {pendingTracks.length}개 트랙 등록</>
            )}
          </button>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>
            지원 형식: MP3, MP4 &nbsp;/&nbsp; 최대 크기: 50MB
          </p>
        </>
      )}
    </form>
  )
}
