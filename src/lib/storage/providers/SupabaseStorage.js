import { supabase } from '../../supabase'
import { StorageProvider } from '../StorageProvider'

const AUDIO_BUCKET = 'tracks'
const COVER_BUCKET = 'covers'

// storage ID 형식: "bucket:path"  예) "tracks:userId/123.mp3"  "covers:userId/123.jpg"
const encodeId  = (bucket, path) => `${bucket}:${path}`
const decodeId  = (id) => {
  const sep = id.indexOf(':')
  if (sep === -1) return { bucket: AUDIO_BUCKET, path: id }  // 구형 ID 호환
  return { bucket: id.slice(0, sep), path: id.slice(sep + 1) }
}

export class SupabaseStorage extends StorageProvider {
  get name() { return 'supabase' }

  /**
   * @param {File} file
   * @param {{ type?: 'audio'|'image', userId?: string, path?: string }} options
   */
  async upload(file, options = {}) {
    const { type = 'audio', userId = 'anon', path: suggestedPath } = options
    const isImage = type === 'image'

    const bucket = isImage ? COVER_BUCKET : AUDIO_BUCKET
    const ext    = file.name.split('.').pop().toLowerCase()
    const ts     = Date.now()
    const path   = suggestedPath ?? `${userId}/${ts}.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      ...(isImage && { contentType: file.type }),
    })
    if (error) throw new Error(`SupabaseStorage.upload failed: ${error.message}`)

    const id  = encodeId(bucket, path)
    const url = this.getUrl(id)
    return { url, id, provider: this.name }
  }

  getUrl(storageId) {
    const { bucket, path } = decodeId(storageId)
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async delete(storageId) {
    const { bucket, path } = decodeId(storageId)
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw new Error(`SupabaseStorage.delete failed: ${error.message}`)
  }

  async isHealthy() {
    try {
      await supabase.storage.from(AUDIO_BUCKET).list('', { limit: 1 })
      return true
    } catch {
      return false
    }
  }
}
