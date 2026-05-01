import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Music, Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTracks } from '../hooks/useMusic'
import MusicCard from '../components/music/MusicCard'

export default function Profile() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const { tracks } = useTracks({ userId: user?.id })

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading])

  if (loading || !user) return null

  const username = user.user_metadata?.username || user.email?.split('@')[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-900/60 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{username}</h1>
            <p className="text-white/40 text-sm mt-0.5">{user.email}</p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{tracks.length}</p>
                <p className="text-xs text-white/40">Tracks</p>
              </div>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost text-sm text-white/40">
            Sign out
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-5">
          <Music size={18} className="text-indigo-400" />
          <h2 className="text-lg font-bold text-white">My Tracks</h2>
        </div>
        {tracks.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tracks.map((track) => <MusicCard key={track.id} track={track} />)}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-xl">
            <Music size={40} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No tracks uploaded yet</p>
            <button onClick={() => navigate('/upload')} className="btn-primary mt-4 mx-auto">
              Upload your first track
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
