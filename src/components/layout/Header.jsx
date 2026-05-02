import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Waves } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/discover?q=${encodeURIComponent(search.trim())}`)
      setSearchOpen(false)
      setSearch('')
    }
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: '56px',
      background: 'rgba(7, 14, 12, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(29, 158, 117, 0.14)',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{
        maxWidth: '640px', margin: '0 auto',
        height: '56px', padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {/* Logo */}
        {!searchOpen && (
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #1D9E75 0%, #0a4433 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(29,158,117,0.5)',
            }}>
              <Waves size={15} color="white" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', color: 'white' }}>
              WA<span style={{ color: '#1D9E75' }}>VERSE</span>
            </span>
          </Link>
        )}

        {/* Search bar (expanded) */}
        {searchOpen && (
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="트랙, 아티스트 검색..."
                className="input-sm"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="btn-icon"
            style={{ width: '36px', height: '36px' }}
          >
            <Search size={18} />
          </button>
          {user && (
            <button className="btn-icon" style={{ width: '36px', height: '36px' }}>
              <Bell size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
