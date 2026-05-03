import { useState, useRef, useCallback } from 'react'
import {
  Upload, ImageIcon, Loader2, User2, X,
  CheckCircle2, AlertCircle, PlusCircle,
} from 'lucide-react'
import { uploadTrack } from '../../hooks/useMusic'
import { useAuth } from '../../hooks/useAuth'
import { GENRES, genreLabel } from '../../lib/genres'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

/* ── MP4 → 오디오 트랙 추출 (MR 분리용) ─────────────────── */
async function extractAudioFromVideo(file) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  const ctx = new AudioCtx()
  try {
    const arrayBuf   = await file.arrayBuffer()
    const sourceBuf  = await ctx.decodeAudioData(arrayBuf)

    // 22 050 Hz 모노로 다운샘플 — Demucs 보컬 분리에 충분한 품질
    const targetRate   = 22050
    const targetFrames = Math.ceil(sourceBuf.duration * targetRate)
    const offCtx       = new OfflineAudioContext(1, targetFrames, targetRate)
    const src          = offCtx.createBufferSource()
    src.buffer         = sourceBuf
    src.connect(offCtx.destination)
    src.start()
    const rendered = await offCtx.startRendering()
    return _audioBufferToWav(rendered)
  } finally {
    ctx.close()
  }
}

function _audioBufferToWav(buf) {
  const ch  = buf.numberOfChannels
  const sr  = buf.sampleRate
  const len = buf.length * ch * 2  // 16-bit PCM
  const out = new ArrayBuffer(44 + len)
  const v   = new DataView(out)
  const ws  = (off, s) => [...s].forEach((c, i) => v.setUint8(off + i, c.charCodeAt(0)))

  ws(0, 'RIFF'); v.setUint32(4, 36 + len, true)
  ws(8, 'WAVE'); ws(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true)   // PCM
  v.setUint16(22, ch, true);  v.setUint32(24, sr, true)
  v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true)
  ws(36, 'data'); v.setUint32(40, len, true)

  let off = 44
  for (let i = 0; i < buf.length; i++)
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]))
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2
    }
  return new Blob([out], { type: 'audio/wav' })
}

/* ── MP4 썸네일 자동 생성 ────────────────────────────────── */
function generateVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl
    video.muted = true
    video.playsInline = true
    video.load()

    const cleanup = () => URL.revokeObjectURL(objectUrl)

    video.addEventListener('loadedmetadata', () => {
      const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : 0
      video.currentTime = dur > 1 ? Math.min(1, dur * 0.1) : 0.001
    }, { once: true })

    video.addEventListener('seeked', () => {
      const w = video.videoWidth  || 480
      const h = video.videoHeight || 480
      const scale = Math.min(1, 480 / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        cleanup()
        if (!blob) { reject(new Error('no blob')); return }
        const thumbFile = new File([blob], 'thumb.jpg', { type: 'image/jpeg' })
        resolve({ file: thumbFile, preview: URL.createObjectURL(blob) })
      }, 'image/jpeg', 0.85)
    }, { once: true })

    video.addEventListener('error', () => { cleanup(); reject(new Error('video error')) }, { once: true })
  })
}

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
    onUpdate(track.id, { coverFile: f, coverPreview: URL.createObjectURL(f), autoThumb: false })
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
        {track.coverPreview ? (
          <>
            <img src={track.coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {track.autoThumb && (
              <div style={{
                position: 'absolute', bottom: '2px', right: '2px',
                background: 'rgba(0,0,0,0.7)', borderRadius: '3px',
                padding: '1px 4px', fontSize: '7px', fontWeight: 800,
                color: '#4ecca3', letterSpacing: '0.04em', lineHeight: 1.6,
              }}>AUTO</div>
            )}
          </>
        ) : (
          <ImageIcon size={16} color="rgba(29,158,117,0.35)" />
        )}
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
export default function UploadForm({ onSuccess, onArtistPromotion }) {
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

    const newTracks = files.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      ...parseFilename(f.name),
      coverFile: null, coverPreview: null, autoThumb: false,
    }))
    setTrackList(prev => [...prev, ...newTracks])

    // MP4: 썸네일 자동 생성 (비동기)
    newTracks.forEach(track => {
      if (/\.mp4$/i.test(track.file.name) || track.file.type === 'video/mp4') {
        generateVideoThumbnail(track.file)
          .then(({ file, preview }) => {
            setTrackList(prev => prev.map(t =>
              t.id === track.id && !t.coverFile
                ? { ...t, coverFile: file, coverPreview: preview, autoThumb: true }
                : t
            ))
          })
          .catch(() => {}) // 실패 시 무시 — 사용자가 직접 선택 가능
      }
    })
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
        const uploaded = await uploadTrack({
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

        // AI 분석 백그라운드 트리거 (fire and forget)
        if (uploaded?.id && uploaded?.audio_url) {
          const isVideo = /\.mp4$/i.test(track.file.name) || track.file.type === 'video/mp4'
          const hdrs    = { 'Content-Type': 'application/json' }

          // 가사·악보·공유 분석은 원본 URL 그대로
          fetch('/api/analyze/start', {
            method: 'POST', headers: hdrs,
            body: JSON.stringify({ trackId: uploaded.id, audioUrl: uploaded.audio_url, title: track.title, artist: track.artist }),
          }).catch(() => {})

          // MR 분리: MP4는 오디오 트랙만 추출해서 전달
          ;(async () => {
            let mrAudioUrl = uploaded.audio_url
            if (isVideo) {
              try {
                const wavBlob = await extractAudioFromVideo(track.file)
                const path    = `${user.id}/${uploaded.id}_mr_src.wav`
                await supabase.storage.from('stems').upload(path, wavBlob, { contentType: 'audio/wav', upsert: true })
                const { data } = supabase.storage.from('stems').getPublicUrl(path)
                mrAudioUrl = data.publicUrl
              } catch (e) {
                console.warn('[MR] 오디오 추출 실패, 원본 URL 사용:', e.message)
              }
            }
            fetch('/api/analyze/mr-start', {
              method: 'POST', headers: hdrs,
              body: JSON.stringify({ trackId: uploaded.id, audioUrl: mrAudioUrl }),
            }).catch(() => {})
          })()
        }
      } catch (err) {
        setStatuses(prev => ({ ...prev, [track.id]: `error:${err.message || '업로드 실패'}` }))
        fail++
      }
    }

    setUploading(false)

    if (ok > 0) {
      // 업로드 성공 시 role 자동 승격 (user → artist)
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'user') {
        await supabase.from('profiles').update({ role: 'artist' }).eq('id', user.id)
        toast.success(`${ok}개 트랙 업로드 완료!\n아티스트 권한이 부여되었습니다.`)
        onArtistPromotion?.()
        return
      }
    }

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
