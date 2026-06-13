import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X, ChevronDown } from 'lucide-react'
import MusicCard from '../components/music/MusicCard'
import { useTracks } from '../hooks/useMusic'
import { GENRES, genreLabel } from '../lib/genres'

const ALL = { value: 'all', ko: '전체', en: 'All' }
const GENRE_LIST = [ALL, ...GENRES]
const PAGE_SIZE = 30

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [genre, setGenre] = useState('all')
  const [debounced, setDebounced] = useState(search)
  const [limit, setLimit] = useState(PAGE_SIZE)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 380)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setLimit(PAGE_SIZE) }, [genre, debounced])

  const { tracks, loading } = useTracks({
    genre: genre === 'all' ? undefined : genre,
    search: debounced || undefined,
    limit,
  })
  const hasMore = !loading && tracks.length === limit

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '14px', letterSpacing: '-0.3px' }}>
          플레이 <span style={{ color: '#1D9E75' }}>탐색</span>
        </h1>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            className="input"
            placeholder="트랙, 아티스트, 제작자 검색..."
            value={search}
            style={{ paddingLeft: '40px', paddingRight: search ? '40px' : '14px' }}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchParams(e.target.value ? { q: e.target.value } : {})
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchParams({}) }}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Genre chips */}
      <div style={{ overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {GENRE_LIST.map(g => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px', fontWeight: 600,
                border: genre === g.value ? 'none' : '1px solid rgba(29,158,117,0.2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: genre === g.value ? '#1D9E75' : 'transparent',
                color: genre === g.value ? 'white' : 'rgba(255,255,255,0.5)',
                boxShadow: genre === g.value ? '0 0 10px rgba(29,158,117,0.3)' : 'none',
              }}
            >
              {g.ko}
              {g.ko !== g.en && g.value !== 'all' && (
                <span style={{ opacity: 0.65, marginLeft: '4px', fontWeight: 400 }}>
                  {g.en}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <div style={{ padding: '0 16px 8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            {tracks.length}개의 트랙
            {debounced ? ` · "${debounced}"` : ''}
          </span>
        </div>
      )}

      {/* Track list */}
      <div style={{
        background: 'rgba(13,26,21,0.6)',
        margin: '0 12px',
        borderRadius: '16px',
        border: '1px solid rgba(29,158,117,0.1)',
        overflow: 'hidden',
      }}>
        {loading && tracks.length === 0 ? (
          [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
        ) : tracks.length ? (
          tracks.map(track => <MusicCard key={track.id} track={track} />)
        ) : (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Search size={36} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
              {debounced ? `"${debounced}"에 대한 결과가 없습니다` : '트랙이 없습니다'}
            </p>
          </div>
        )}
        {loading && tracks.length > 0 && (
          [...Array(3)].map((_, i) => <SkeletonRow key={`more-${i}`} />)
        )}
      </div>
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <button
            onClick={() => setLimit(l => l + PAGE_SIZE)}
            className="btn-outline"
            style={{ fontSize: '13px', padding: '9px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ChevronDown size={15} /> 더보기
          </button>
        </div>
      )}
      <div style={{ height: '16px' }} />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(29,158,117,0.07)' }}>
      <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '7px' }} />
        <div className="skeleton" style={{ height: '11px', width: '35%' }} />
      </div>
    </div>
  )
}
