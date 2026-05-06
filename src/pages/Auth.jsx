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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { user, signIn, signUp, signInWithGoogle } = useAuth()
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

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err.message || 'Google 로그인 오류')
      setGoogleLoading(false)
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
          음악 공유 플랫폼
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
          marginBottom: '20px',
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

        {/* Google 버튼 */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%', padding: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            marginBottom: '16px',
            opacity: googleLoading ? 0.7 : 1,
          }}
        >
          {googleLoading
            ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            : <GoogleIcon />
          }
          Google로 계속하기
        </button>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>또는</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* 이메일 폼 */}
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
