/**
 * Storage Factory
 *
 * VITE_STORAGE_PROVIDER 환경변수로 런타임 공급자를 선택한다.
 * 값이 없으면 'supabase' 를 기본값으로 사용한다.
 *
 * 지원 공급자
 *   supabase  — Supabase Storage (현재 기본값)
 *   ipfs      — IPFS via Pinata (VITE_PINATA_JWT 필요)
 *
 * 신규 공급자 추가 방법
 *   1. src/lib/storage/providers/MyStorage.js 작성
 *   2. 아래 REGISTRY 에 항목 추가
 *   3. .env.local 에서 VITE_STORAGE_PROVIDER=my 설정
 */

import { SupabaseStorage } from './providers/SupabaseStorage'
import { IpfsStorage }     from './providers/IpfsStorage'

const REGISTRY = {
  supabase: () => new SupabaseStorage(),
  ipfs:     () => new IpfsStorage(),
}

const providerKey = import.meta.env.VITE_STORAGE_PROVIDER ?? 'supabase'

if (!REGISTRY[providerKey]) {
  throw new Error(
    `[storage] Unknown provider "${providerKey}". ` +
    `Valid options: ${Object.keys(REGISTRY).join(', ')}`
  )
}

/** 현재 활성 스토리지 공급자 (싱글턴) */
export const storage = REGISTRY[providerKey]()

export { StorageProvider } from './StorageProvider'
export { SupabaseStorage } from './providers/SupabaseStorage'
export { IpfsStorage }     from './providers/IpfsStorage'
