/**
 * WAVERSE 장르 마스터 데이터
 *
 * value   — DB에 저장되는 고정 키 (기존 데이터와 호환)
 * ko      — 한국어 표시명
 * en      — 영어 표시명
 */
export const GENRES = [
  { value: 'Ballad',      ko: '발라드',    en: 'Ballad' },
  { value: 'Folk',        ko: '포크',      en: 'Folk' },
  { value: 'Jazz',        ko: '재즈',      en: 'Jazz' },
  { value: 'K-POP',       ko: 'K-POP',    en: 'K-POP' },
  { value: 'Lo-fi',       ko: '로파이',    en: 'Lo-fi' },
  { value: 'Blues',       ko: '블루스',    en: 'Blues' },
  { value: 'Pop',         ko: '팝',        en: 'Pop' },
  { value: 'Rock',        ko: '록',        en: 'Rock' },
  { value: 'R&B',         ko: 'R&B',      en: 'R&B' },
  { value: 'Hip-Hop',     ko: '힙합',      en: 'Hip-Hop' },
  { value: 'Classical',   ko: '클래식',    en: 'Classical' },
  { value: 'Trot',        ko: '트로트',    en: 'Trot' },
  { value: 'Indie',       ko: '인디',      en: 'Indie' },
  { value: 'Soul',        ko: '소울',      en: 'Soul' },
  { value: 'Funk',        ko: '펑크',      en: 'Funk' },
  { value: 'Reggae',      ko: '레게',      en: 'Reggae' },
  { value: 'Country',     ko: '컨트리',    en: 'Country' },
  { value: 'Electronic',  ko: '일렉트로닉', en: 'Electronic' },
  { value: 'Ambient',     ko: '앰비언트',  en: 'Ambient' },
  { value: 'New Age',     ko: '뉴에이지',  en: 'New Age' },
  { value: 'OST',         ko: 'OST',      en: 'OST' },
  { value: 'Other',       ko: '기타',      en: 'Other' },
]

/** 장르 value → "한국어 · English" 레이블 */
export function genreLabel(value) {
  const g = GENRES.find(g => g.value === value)
  if (!g) return value
  // K-POP, R&B, OST처럼 한/영이 같으면 한 번만 표시
  return g.ko === g.en ? g.ko : `${g.ko} · ${g.en}`
}

/** Discover 칩용: 한국어만 */
export function genreKo(value) {
  return GENRES.find(g => g.value === value)?.ko ?? value
}

/** 홈 화면 장르 필터 칩 목록 (자주 쓰이는 것 먼저) */
export const GENRE_CHIPS = [
  { value: 'all', ko: '전체', en: 'All' },
  { value: 'K-POP',      ko: 'K-POP',    en: 'K-POP' },
  { value: 'Ballad',     ko: '발라드',    en: 'Ballad' },
  { value: 'Hip-Hop',    ko: '힙합',      en: 'Hip-Hop' },
  { value: 'Lo-fi',      ko: '로파이',    en: 'Lo-fi' },
  { value: 'Electronic', ko: '일렉트로닉', en: 'Electronic' },
  { value: 'Indie',      ko: '인디',      en: 'Indie' },
  { value: 'R&B',        ko: 'R&B',      en: 'R&B' },
  { value: 'Jazz',       ko: '재즈',      en: 'Jazz' },
  { value: 'OST',        ko: 'OST',      en: 'OST' },
]
