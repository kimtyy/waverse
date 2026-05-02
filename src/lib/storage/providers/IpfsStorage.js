import { StorageProvider } from '../StorageProvider'

/**
 * IpfsStorage — IPFS/Pinata 기반 탈중앙 스토리지
 *
 * 전환 방법:
 *   1. .env.local 에 아래 변수 추가
 *      VITE_STORAGE_PROVIDER=ipfs
 *      VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
 *      VITE_PINATA_JWT=<Pinata API JWT>
 *
 *   2. TODO 주석 아래 코드를 주석 해제
 *
 * 대안 공급자 (동일한 인터페이스로 교체 가능):
 *   - web3.storage  : https://web3.storage
 *   - Filebase      : S3-compatible + IPFS pinning
 *   - Arweave       : 영구 저장, AR 토큰으로 지불
 *   - Lighthouse    : Filecoin + IPFS 결합
 */
export class IpfsStorage extends StorageProvider {
  get name() { return 'ipfs' }

  #gateway = import.meta.env.VITE_IPFS_GATEWAY ?? 'https://ipfs.io/ipfs'
  #jwt     = import.meta.env.VITE_PINATA_JWT    ?? ''

  /**
   * @param {File} file
   * @param {{ type?: 'audio'|'image' }} options
   * @returns {Promise<{url: string, id: string, provider: string}>}
   */
  async upload(file, options = {}) {
    if (!this.#jwt) {
      throw new Error('IpfsStorage: VITE_PINATA_JWT env var is not set')
    }

    // ── Pinata pinFileToIPFS ──────────────────────────────
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pinataMetadata', JSON.stringify({
      name: file.name,
      keyvalues: { type: options.type ?? 'audio' },
    }))
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.#jwt}` },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`IpfsStorage.upload failed (${res.status}): ${err}`)
    }

    const { IpfsHash: cid } = await res.json()
    const url = this.getUrl(cid)
    return { url, id: cid, provider: this.name }

    // ── 대안: web3.storage ────────────────────────────────
    // import { Web3Storage } from 'web3.storage'
    // const client = new Web3Storage({ token: import.meta.env.VITE_WEB3_STORAGE_TOKEN })
    // const cid = await client.put([file])
    // return { url: this.getUrl(cid), id: cid, provider: this.name }
  }

  /**
   * CID → HTTP 게이트웨이 URL
   * 게이트웨이는 환경변수 VITE_IPFS_GATEWAY 로 교체 가능
   */
  getUrl(cid) {
    return `${this.#gateway}/${cid}`
  }

  /**
   * IPFS는 콘텐츠 주소 기반이라 데이터 자체를 지울 수 없음.
   * '삭제'는 핀을 해제하여 자신의 노드에서만 제거하는 것을 의미.
   */
  async delete(cid) {
    if (!this.#jwt) return

    const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.#jwt}` },
    })

    if (!res.ok) {
      console.warn(`IpfsStorage.delete (unpin) failed for CID ${cid}: ${res.status}`)
    }
  }

  async isHealthy() {
    if (!this.#jwt) return false
    try {
      const res = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        headers: { Authorization: `Bearer ${this.#jwt}` },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
