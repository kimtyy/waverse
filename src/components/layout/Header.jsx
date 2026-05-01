import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Upload, User, LogOut, Music2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/discover?q=${encodeURIComponent(search.trim())}`)
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 ${
        location.pathname === to ? 'text-white' : 'text-white/50 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
      style={{ background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Music2 size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">WAVERSE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLink('/', 'Home')}
          {navLink('/discover', 'Discover')}
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracks, artists..."
              className="input-field pl-9 h-9 text-sm"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <button onClick={() => navigate('/upload')} className="btn-primary text-sm h-9 px-3">
                <Upload size={15} /> Upload
              </button>
              <button onClick={() => navigate('/profile')} className="btn-ghost text-sm h-9 px-3">
                <User size={15} />
              </button>
              <button onClick={signOut} className="btn-ghost text-sm h-9 px-3 text-white/40">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/auth')} className="btn-ghost text-sm h-9 px-3">
                Sign in
              </button>
              <button onClick={() => navigate('/auth?mode=signup')} className="btn-primary text-sm h-9 px-3">
                Get started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
