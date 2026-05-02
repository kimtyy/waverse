/**
 * StorageProvider — abstract interface
 *
 * 모든 스토리지 구현체가 따라야 하는 계약.
 * JS에는 interface 키워드가 없으므로 기본 구현이 에러를 던지는
 * 기반 클래스 형태로 정의한다.
 *
 * ──────────────────────────────────────────────────
 * StorageFile (반환 타입)
 * {
 *   url:      string   — 브라우저에서 바로 재생/표시 가능한 HTTP(S) URL
 *   id:       string   — 공급자별 식별자 (Supabase: 경로, IPFS: CID)
 *   provider: string   — 'supabase' | 'ipfs' | 'local'
 * }
 * ──────────────────────────────────────────────────
 * UploadOptions
 * {
 *   type?:   'audio' | 'image'
 *   userId?: string
 *   path?:   string   — 희망 경로/파일명 (공급자가 무시할 수 있음)
 * }
 */
export class StorageProvider {
  /** @type {string} 공급자 이름 */
  get name() {
    throw new Error(`${this.constructor.name}: name getter not implemented`)
  }

  /**
   * 파일 업로드
   * @param {File} file
   * @param {object} options  UploadOptions
   * @returns {Promise<{url: string, id: string, provider: string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async upload(file, options = {}) {
    throw new Error(`${this.constructor.name}: upload() not implemented`)
  }

  /**
   * 저장된 파일의 공개 URL 반환
   * (업로드 이후 id만 알 때 URL을 다시 구성해야 하는 경우 사용)
   * @param {string} storageId
   * @returns {string}
   */
  // eslint-disable-next-line no-unused-vars
  getUrl(storageId) {
    throw new Error(`${this.constructor.name}: getUrl() not implemented`)
  }

  /**
   * 파일 삭제
   * (IPFS처럼 불변 공급자는 '언핀(unpin)'으로 구현)
   * @param {string} storageId
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(storageId) {
    throw new Error(`${this.constructor.name}: delete() not implemented`)
  }

  /**
   * 공급자 상태 확인 (헬스체크)
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    return true
  }
}
