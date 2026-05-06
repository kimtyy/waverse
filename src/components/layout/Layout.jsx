import Header from './Header'
import BottomNav from './BottomNav'
import MusicPlayer from '../music/MusicPlayer'
import { usePlayerStore } from '../../stores/playerStore'

export default function Layout({ children }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)

  return (
    <div style={{ minHeight: '100dvh', background: '#070e0c' }}>
      <Header />
      <main style={{
        maxWidth: '640px',
        margin: '0 auto',
        paddingTop: '56px',
        paddingBottom: currentTrack
          ? 'calc(env(safe-area-inset-bottom) + 148px)'
          : 'calc(env(safe-area-inset-bottom) + 76px)',
      }}>
        {children}
      </main>
      <MusicPlayer />
      <BottomNav />
    </div>
  )
}
