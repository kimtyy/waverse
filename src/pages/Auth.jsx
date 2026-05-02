import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Waves, Loader2, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

/* IME 조합 중 onChange 간섭 없이 한글/영어 모두 입력되도록 처리 */
function useField(initial = '') {
  const [value, setValue] = useState(initial)
  const composing = useRef(false)
  const props = {
    value,
    onChange: (e) => setValue(e.target.value),
    onCompositionStart: () => { composing.current = true },
    onCompositionEnd: (e) => { composing.current = false; setValue(e.target.value) },
  }
  return [value, props]
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [loading, setLoading] = useState(false)
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [username, usernameProps] = useField('')
  const [email,    emailProps]    = useField('')
  const [password, passwordProps] = useField('')

  useEffect(() => { if (user) navigate('/') }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, username)
        toast.success('가입 완료! 이메일을 확인해 주세요.')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#070e0c',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '18px',
          background: 'linear-gradient(135deg, #1D9E75, #0a4433)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 0 28px rgba(29,158,117,0.5)',
        }}>
          <Waves size={26} color="white" />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
          WA<span style={{ color: '#1D9E75' }}>VERSE</span>
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          AI 음악 공유 플랫폼
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '360px',
        background: 'rgba(13,26,21,0.9)',
        border: '1px solid rgba(29,158,117,0.2)',
        borderRadius: '20px',
        padding: '24px',
      }}>
        {/* Tab */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'rgba(7,14,12,0.8)',
          border: '1px solid rgba(29,158,117,0.15)',
          borderRadius: '12px', padding: '4px',
          marginBottom: '24px',
        }}>
          {[['signin', '로그인'], ['signup', '회원가입']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '9px',
                borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600,
                transition: 'all 0.15s',
                background: mode === m ? '#1D9E75' : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                boxShadow: mode === m ? '0 0 12px rgba(29,158,117,0.35)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '7px', fontWeight: 600 }}>
                사용자 이름
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="username"
                  style={{ paddingLeft: '38px' }}
                  autoComplete="username"
                  spellCheck={false}
                  required
                  {...usernameProps}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '7px', fontWeight: 600 }}>
              이메일
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                style={{ paddingLeft: '38px' }}
                autoComplete="email"
                required
                {...emailProps}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '7px', fontWeight: 600 }}>
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
              <input
                type="password"
                className="input"
                placeholder="6자 이상"
                style={{ paddingLeft: '38px' }}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                {...passwordProps}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '4px', padding: '13px', fontSize: '15px' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {mode === 'signin' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
