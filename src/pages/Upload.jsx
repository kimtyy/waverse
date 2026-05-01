import { useNavigate } from 'react-router-dom'
import { Upload as UploadIcon } from 'lucide-react'
import UploadForm from '../components/music/UploadModal'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function Upload() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading])

  if (loading) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/30 flex items-center justify-center">
            <UploadIcon size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Upload Track</h1>
        </div>
        <p className="text-white/50">Share your AI-generated music with the world</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <UploadForm onSuccess={() => navigate('/')} />
      </div>
    </div>
  )
}
