import { useState, useRef } from 'react'
import { X, Save, ImageIcon, Camera, Hash } from 'lucide-react'
import { GENRES, genreLabel } from '../../lib/genres'
import { storage } from '../../lib/storage'
import toast from 'react-hot-toast'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024  // 10MB

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: value ? '#1D9E75' : 'rgba(255,255,255,0.15)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
      }} />
    </div>
  )
}

export default function EditTrackModal({ track, onSave, onClose }) {
  const [title,        setTitle]        = useState(track.title || '')
  const [artist,       setArtist]       = useState(track.artist || '')
  const [maker,        setMaker]        = useState(track.maker || '')
  const [genre,        setGenre]        = useState(track.genre || '')
  const [description,  setDescription]  = useState(track.description || '')
  const [isPublic,     setIsPublic]     = useState(track.is_public !== false)
  const [saving,       setSaving]       = useState(false)

  // 커버 이미지
  const [coverFile,    setCoverFile]    = useState(null)
  const [coverPreview, setCoverPreview] = useState(track.cover_url || null)
  const [coverError,   setCoverError]   = useState(null)
  const coverRef = useRef()

  // 태그
  const [tags,     setTags]     = useState(track.tags || [])
  const [tagInput, setTagInput] = useState('')

  const addTag = (raw) => {
    const tag = raw.trim().replace(/^#/, '')
    if (!tag || tags.includes(tag) || tags.length >= 10) return
    setTags(prev => [...prev, tag])
  }

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const handleTagBlur = () => {
    if (tagInput.trim()) { addTag(tagInput); setTagInput('') }
  }

  const handleCoverSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setCoverError('JPG, PNG, WEBP 형식만 지원합니다')
      e.target.value = ''
      return
    }
    if (file.size > MAX_BYTES) {
      setCoverError('파일 크기는 10MB 이하여야 합니다')
      e.target.value = ''
      return
    }

    setCoverError(null)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const finalTags = tagInput.trim()
        ? [...tags, tagInput.trim().replace(/^#/, '')].filter((t, i, a) => a.indexOf(t) === i)
        : tags

      const patch = {
        title:       title.trim(),
        artist:      artist.trim()      || null,
        maker:       maker.trim()       || null,
        genre:       genre              || null,
        description: description.trim() || null,
        tags:        finalTags,
        is_public:   isPublic,
      }

      if (coverFile) {
        // 새 커버 업로드
        const result = await storage.upload(coverFile, {
          type:   'image',
          userId: track.user_id || 'admin',
        })
        // 기존 커버 삭제
        if (track.cover_storage_id) {
          await storage.delete(track.cover_storage_id).catch(console.warn)
        }
        patch.cover_url        = result.url
        patch.cover_storage_id = result.id
      }

      await onSave(track.id, patch)
      onClose()
    } catch (e) {
      console.error(e)
      toast.error(e.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(13,26,21,0.9)',
    border: '1.5px solid rgba(29,158,117,0.2)',
    borderRadius: '10px', padding: '10px 12px',
    color: 'white', fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none', WebkitAppearance: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'rgba(255,255,255,0.45)', marginBottom: '5px',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px',
          background: '#0d1a16',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(29,158,117,0.2)',
          padding: '20px 20px 32px',
          animation: 'scaleIn 0.18s ease-out',
          maxHeight: '90dvh', overflowY: 'auto',
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>트랙 정보 수정</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── 커버 이미지 ── */}
          <div>
            <label style={labelStyle}>커버 이미지</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* 썸네일 */}
              <div
                onClick={() => coverRef.current?.click()}
                style={{
                  width: '80px', height: '80px', flexShrink: 0,
                  borderRadius: '12px', overflow: 'hidden',
                  border: coverError
                    ? '1.5px solid rgba(248,113,113,0.5)'
                    : '1.5px dashed rgba(29,158,117,0.35)',
                  background: 'rgba(13,26,21,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                {coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* 호버용 오버레이 */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <Camera size={20} color="white" />
                    </div>
                  </>
                ) : (
                  <ImageIcon size={24} color="rgba(29,158,117,0.4)" />
                )}
              </div>

              <input
                ref={coverRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleCoverSelect}
              />

              {/* 안내 텍스트 + 버튼 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {coverFile ? (
                  <p style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ✓ {coverFile.name}
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                    {track.cover_url ? '현재 이미지 사용 중' : '이미지 없음'}
                  </p>
                )}
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>
                  JPG · PNG · WEBP / 최대 10MB
                </p>
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  style={{
                    padding: '5px 12px', fontSize: '12px', fontWeight: 600,
                    background: 'rgba(29,158,117,0.12)',
                    border: '1px solid rgba(29,158,117,0.3)',
                    borderRadius: '8px', color: '#1D9E75',
                    cursor: 'pointer',
                  }}
                >
                  {coverPreview ? '이미지 변경' : '이미지 선택'}
                </button>
              </div>
            </div>
            {coverError && (
              <p style={{ fontSize: '11px', color: '#f87171', marginTop: '6px' }}>{coverError}</p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label style={labelStyle}>제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              onCompositionEnd={e => setTitle(e.target.value)}
              style={inputStyle} autoComplete="off" spellCheck={false} />
          </div>

          {/* 가수 */}
          <div>
            <label style={labelStyle}>가수명</label>
            <input value={artist} onChange={e => setArtist(e.target.value)}
              onCompositionEnd={e => setArtist(e.target.value)}
              style={inputStyle} autoComplete="off" spellCheck={false} />
          </div>

          {/* 제작자 */}
          <div>
            <label style={labelStyle}>제작자 (제작 툴)</label>
            <input value={maker} onChange={e => setMaker(e.target.value)}
              onCompositionEnd={e => setMaker(e.target.value)}
              style={inputStyle} placeholder="Suno, Udio 등" autoComplete="off" spellCheck={false} />
          </div>

          {/* 장르 */}
          <div>
            <label style={labelStyle}>장르</label>
            <select value={genre} onChange={e => setGenre(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">선택 안 함</option>
              {GENRES.map(g => <option key={g.value} value={g.value}>{genreLabel(g.value)}</option>)}
            </select>
          </div>

          {/* 설명 */}
          <div>
            <label style={labelStyle}>설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              onCompositionEnd={e => setDescription(e.target.value)}
              rows={3} style={{ ...inputStyle, resize: 'none' }} autoComplete="off" spellCheck={false} />
          </div>

          {/* 태그 */}
          <div>
            <label style={labelStyle}>태그 (최대 10개, Enter로 추가)</label>
            <div style={{
              ...inputStyle, padding: '6px 10px',
              display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
              cursor: 'text', minHeight: '42px',
            }}
              onClick={() => document.getElementById('tag-input-field')?.focus()}
            >
              {tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(29,158,117,0.15)',
                  border: '1px solid rgba(29,158,117,0.3)',
                  borderRadius: '6px', padding: '2px 8px',
                  fontSize: '12px', color: '#4ecca3', flexShrink: 0,
                }}>
                  <Hash size={10} />
                  {tag}
                  <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(78,204,163,0.6)', display: 'flex', lineHeight: 1 }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              {tags.length < 10 && (
                <input
                  id="tag-input-field"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={handleTagBlur}
                  placeholder={tags.length ? '' : '태그 입력 후 Enter...'}
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    color: 'white', fontSize: '13px', minWidth: '120px', flex: 1,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                />
              )}
            </div>
          </div>

          {/* 공개 설정 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>공개 설정</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {isPublic ? '모든 사용자에게 공개' : '비공개 (본인만 조회 가능)'}
              </p>
            </div>
            <Toggle value={isPublic} onChange={setIsPublic} />
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || !!coverError}
          className="btn-primary"
          style={{ width: '100%', marginTop: '20px', padding: '13px', fontSize: '14px' }}
        >
          {saving ? '저장 중...' : <><Save size={15} /> 저장</>}
        </button>
      </div>
    </div>
  )
}
