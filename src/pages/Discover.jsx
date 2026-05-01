import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import MusicCard from '../components/music/MusicCard'
import { useTracks } from '../hooks/useMusic'

const GENRES = ['All', 'Electronic', 'Hip-Hop', 'Pop', 'Rock', 'Jazz', 'Classical', 'Ambient', 'Lo-fi', 'R&B', 'Other']

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [genre, setGenre] = useState('All')
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { tracks, loading } = useTracks({
    genre: genre === 'All' ? undefined : genre,
    search: debouncedSearch || undefined,
    limit: 24,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Discover</h1>
        <p className="text-white/50">Explore AI-generated music from the community</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-9"
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchParams(e.target.value ? { q: e.target.value } : {})
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              genre === g
                ? 'bg-indigo-600 text-white'
                : 'glass glass-hover text-white/60 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <div className="aspect-square animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-2 w-2/3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : tracks.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tracks.map((track) => <MusicCard key={track.id} track={track} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search size={40} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50">No tracks found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}</p>
        </div>
      )}
    </div>
  )
}
