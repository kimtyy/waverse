import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Music2, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [loading, setLoading] = useState(false)
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(form.email, form.password, form.username)
        toast.success('Account created! Check your email to confirm.')
      } else {
        await signIn(form.email, form.password)
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Music2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">WAVERSE</h1>
          <p className="text-white/40 text-sm mt-1">AI Music Sharing Platform</p>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === m ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Username</label>
                <input
                  className="input-field"
                  placeholder="your_username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-11 mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
