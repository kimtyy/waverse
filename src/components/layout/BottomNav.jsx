import { Link, useLocation } from 'react-router-dom'
import { Home, Headphones, PlusCircle, Heart, User } from 'lucide-react'

const tabs = [
  { to: '/',         icon: Home,       label: '홈' },
  { to: '/discover', icon: Headphones, label: '플레이' },
  { to: '/upload',   icon: PlusCircle, label: '등록',   center: true },
  { to: '/favorites',icon: Heart,      label: '찜' },
  { to: '/profile',  icon: User,       label: '내 음악' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(7, 14, 12, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(29, 158, 117, 0.18)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '60px' }}>
        {tabs.map(({ to, icon: Icon, label, center }) => {
          const active = pathname === to

          if (center) {
            return (
              <Link key={to} to={to} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: '14px',
                  background: active
                    ? 'linear-gradient(135deg, #1D9E75, #156b52)'
                    : 'linear-gradient(135deg, rgba(29,158,117,0.85), rgba(21,107,82,0.85))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(29,158,117,0.45)',
                  marginTop: '-10px',
                  transition: 'transform 0.15s',
                }}>
                  <Icon size={20} color="white" strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#1D9E75', letterSpacing: '0.01em' }}>
                  {label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={to}
              to={to}
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}
            >
              <div style={{
                width: '36px', height: '28px',
                borderRadius: '10px',
                background: active ? 'rgba(29,158,117,0.18)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.18s',
              }}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.8}
                  color={active ? '#1D9E75' : 'rgba(255,255,255,0.38)'}
                  fill={active && label === '찜' ? '#1D9E75' : 'none'}
                />
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: active ? 700 : 500,
                color: active ? '#1D9E75' : 'rgba(255,255,255,0.38)',
                letterSpacing: '0.01em',
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
