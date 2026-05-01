import { useState, useRef } from 'react'
import { Upload, X, Music, Image, Loader2 } from 'lucide-react'
import { uploadTrack } from '../../hooks/useMusic'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const GENRES = ['Electronic', 'Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Ambient', 'Lo-fi', 'R&B', 'Other']

export default function UploadForm({ onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', genre: '', description: '', tags: '' })
  const [audioFile, setAudioFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef()
  const coverRef = useRef()

  const handleCover = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!audioFile) return toast.error('Please select an audio file')
    if (!form.title.trim()) return toast.error('Title is required')
    if (!user) return toast.error('Please sign in first')

    setLoading(true)
    try {
      await uploadTrack({
        file: coverFile,
        audioFile,
        userId: user.id,
        title: form.title,
        genre: form.genre,
        description: form.description,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      toast.success('Track uploaded successfully!')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
        style={{ borderColor: audioFile ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
        onClick={() => audioRef.current?.click()}
      >
        <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files[0])} />
        {audioFile ? (
          <div className="flex items-center justify-center gap-2 text-indigo-400">
            <Music size={20} />
            <span className="text-sm font-medium">{audioFile.name}</span>
          </div>
        ) : (
          <div>
            <Upload size={32} className="mx-auto text-white/20 mb-2" />
            <p className="text-sm text-white/50">Drop audio file here or click to browse</p>
            <p className="text-xs text-white/30 mt-1">MP3, WAV, FLAC, AAC supported</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-xs text-white/50 mb-1.5 block">Title *</label>
          <input
            className="input-field"
            placeholder="Track title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Genre</label>
          <select
            className="input-field"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          >
            <option value="">Select genre</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Cover Image</label>
          <div
            className="input-field cursor-pointer flex items-center gap-2"
            onClick={() => coverRef.current?.click()}
          >
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-6 h-6 rounded object-cover" />
            ) : (
              <Image size={16} className="text-white/40" />
            )}
            <span className="text-sm text-white/40 truncate">
              {coverFile ? coverFile.name : 'Choose image'}
            </span>
          </div>
        </div>

        <div className="col-span-2">
          <label className="text-xs text-white/50 mb-1.5 block">Description</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Tell us about this track..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-white/50 mb-1.5 block">Tags (comma separated)</label>
          <input
            className="input-field"
            placeholder="e.g. chill, beats, synthwave"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-11">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload Track</>}
      </button>
    </form>
  )
}
