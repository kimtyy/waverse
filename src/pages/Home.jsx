import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, Music2 } from 'lucide-react'
import MusicCard from '../components/music/MusicCard'
import { useTracks } from '../hooks/useMusic'
import { usePlayerStore } from '../stores/playerStore'

export default function Home() {
  const { tracks: featured, loading: featuredLoading } = useTracks({ limit: 8 })
  const { tracks: trending } = useTracks({ limit: 4 })
  const { setTrack, addToQueue } = usePlayerStore()

  const handlePlayAll = () => {
    if (!featured.length) return
    featured.forEach((t) => addToQueue(t))
    setTrack(featured[0])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <section className="relative rounded-2xl overflow-hidden mb-12 p-10"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #1e1b4b 100%)' }}>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-indigo-300" />
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">AI Music Platform</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Discover &amp; Share<br />AI-Generated Music
          </h1>
          <p className="text-white/60 mb-6 leading-relaxed">
            Upload your AI-created tracks, explore what others are making,
            and connect with a community of AI music creators.
          </p>
          <div className="flex gap-3">
            <Link to="/discover" className="btn-primary">
              <Music2 size={16} /> Explore Music
            </Link>
            <button onClick={handlePlayAll} className="btn-ghost border border-white/20">
              Play All
            </button>
          </div>
        </div>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex gap-2 items-end opacity-30">
          {[40, 70, 55, 90, 65, 80, 45, 75].map((h, i) => (
            <div
              key={i}
              className="w-3 bg-indigo-400 rounded-full"
              style={{
                height: `${h}px`,
                animation: `wave 1.2s ease-in-out ${i * 0.15}s infinite`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Latest Tracks</h2>
          </div>
          <Link to="/discover" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            See all →
          </Link>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <div className="aspect-square animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="h-2 w-2/3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((track) => <MusicCard key={track.id} track={track} />)}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-xl">
            <Music2 size={40} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No tracks yet. Be the first to upload!</p>
            <Link to="/upload" className="btn-primary mt-4 inline-flex">Upload a Track</Link>
          </div>
        )}
      </section>
    </div>
  )
}
