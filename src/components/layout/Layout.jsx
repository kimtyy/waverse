import Header from './Header'
import MusicPlayer from '../music/MusicPlayer'
import { usePlayerStore } from '../../stores/playerStore'

export default function Layout({ children }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)

  return (
    <div className="min-h-screen" style={{ background: '#020617' }}>
      <Header />
      <main className={`pt-16 ${currentTrack ? 'pb-24' : ''}`}>
        {children}
      </main>
      {currentTrack && <MusicPlayer />}
    </div>
  )
}
