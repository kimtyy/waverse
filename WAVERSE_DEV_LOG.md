# WAVERSE 개발 로그

> 최종 업데이트: 2026-05-06 — v1.0 상태 점검

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [페이지 & 라우트](#3-페이지--라우트)
4. [완성된 기능](#4-완성된-기능)
5. [미완성 / 버그](#5-미완성--버그)
6. [결제 연동 전 필수 수정 사항](#6-결제-연동-전-필수-수정-사항)
7. [데이터베이스 구조](#7-데이터베이스-구조)
8. [스토리지 버킷](#8-스토리지-버킷)
9. [Vercel Serverless API](#9-vercel-serverless-api)
10. [환경변수](#10-환경변수)
11. [배포](#11-배포)

---

## 1. 프로젝트 개요

AI 기반 음악 공유 플랫폼. 사용자가 MP3/MP4를 업로드하고, AI가 MR(반주)을 분리하며, SNS 공유 링크를 제공한다.

**GitHub**: `https://github.com/kimtyy/waverse`  
**Vercel**: 자동 배포 (main 브랜치 push → 즉시 배포)  
**도메인**: `https://waverse.net`

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8 |
| 라우팅 | React Router v7 |
| 상태관리 | Zustand 5 |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| 서버리스 함수 | Vercel Serverless Functions (`/api` 디렉토리) |
| AI - MR 분리 | Replicate Demucs (`htdemucs`, 2-stem) |
| AI - 공유 콘텐츠 | OpenAI GPT-4o-mini (`/api/analyze/start.js` — 현재 미사용) |
| 스토리지 추상화 | 내부 StorageProvider 패턴 (Supabase / IPFS 전환 가능) |
| UI 아이콘 | Lucide React |
| 토스트 | react-hot-toast |
| 파형 시각화 | wavesurfer.js (설치됨, 미사용) |
| CSS | Tailwind CSS 4 + 인라인 스타일 혼용 |

---

## 3. 페이지 & 라우트

| 경로 | 컴포넌트 | 설명 | 상태 |
|------|----------|------|------|
| `/` | `Home` | 트랙 목록 (장르 필터 칩, 전체 재생) | ✅ |
| `/discover` | `Discover` | 검색 + 장르 필터 | ✅ |
| `/upload` | `Upload` | 업로드 페이지 | ✅ |
| `/favorites` | `Favorites` | 좋아요한 트랙 목록 | ✅ |
| `/profile` | `Profile` | 내 프로필 (조회만, 수정 불가) | 🟡 |
| `/auth` | `Auth` | 로그인 / 회원가입 | ✅ |
| `/track/:trackId` | `TrackPage` | 트랙 상세 + 자동재생 + 공유 | ✅ |
| `/dashboard` | `DashboardPage` | 아티스트 대시보드 | ✅ |
| `/admin` | `AdminPage` | 관리자 페이지 (superadmin 전용) | ✅ |

`/auth`, `/admin`, `/dashboard`는 Layout(BottomNav) 없이 독립 렌더링.  
나머지는 LayoutWrapper 안에서 BottomNav + MusicPlayer 포함.

---

## 4. 완성된 기능

### 4-1. 인증

- 이메일/비밀번호 회원가입 · 로그인 (`supabase.auth`)
- 회원가입 시 `profiles` 테이블에 자동 레코드 생성
- `useAuth` 훅으로 전역 세션 관리

### 4-2. 트랙 업로드

- **멀티 파일 업로드**: 파일 여러 개 동시 선택 or 드래그&드롭
- **지원 형식**: MP3, MP4
- **파일명 자동 파싱**: `"가수명 - 곡제목.mp3"` 형태 → artist/title 자동 분리
- **공통 설정**: 제작자(maker), 장르 (22개 장르 지원)
- **개별 설정**: 각 트랙별 가수명 · 곡제목 수동 편집, 커버 이미지 선택
- **MP4 썸네일 자동 생성**: Canvas API로 첫 프레임 캡처 → 커버로 설정
- **업로드 완료 시 role 자동 승격**: `user` → `artist` (첫 업로드 시 1회)

### 4-3. 음악 플레이어

**미니 플레이어** (하단 고정)
- 커버 썸네일, 트랙명/아티스트, 현재 재생 시간
- 이전/재생·일시정지/다음 버튼
- 씬 프로그레스 바 (클릭 seek 가능)
- 클릭 시 확장 플레이어로 전환

**확장 플레이어** (풀스크린 오버레이)
- **MP3/WAV**: 블러 배경 + 대형 커버 이미지 표시
- **MP4**: 전체 화면 영상 재생
- 큰 프로그레스 바, 재생 시간/총 시간
- AI 분석 버튼 (✨ 아이콘) → AnalysisPanel 열기

**Zustand 플레이어 스토어** (`playerStore`)
- `currentTrack`, `isPlaying`, `volume`, `progress`, `duration`, `queue`
- `playNext` / `playPrev` (큐 순환)

### 4-4. AI MR 분리

사용자가 AnalysisPanel → MR 탭에서 [MR 분리 시작] 버튼을 누르면 실행된다 (자동 실행 없음).

```
[MR 분리 시작] 버튼 클릭
    └─► /api/analyze/mr-start  (Replicate Demucs 예측 생성)
            │
            ▼  (클라이언트 15초 폴링)
        /api/analyze/mr-poll  (Replicate 결과 확인)
            │  succeeded
            ▼
        MR 스템 + 보컬 스템 → Supabase stems 버킷 영구 저장
        mr_status = 'done'
```

- Replicate 24시간 만료 URL을 stems 버킷에 자동 다운로드해서 영구 보관
- 완료 후 MRPanel에서 MR 반주 트랙 플레이어 표시
- Supabase Realtime으로 상태 실시간 업데이트

**AnalysisPanel 탭**: MR / 공유 (2개)

| 탭 | 기능 |
|----|------|
| MR | MR 반주 오디오 플레이어 |
| 공유 | SNS 공유 링크 (6개 플랫폼) |

### 4-5. 공유 기능 (`ShareButtons` 컴포넌트)

두 곳에서 동일하게 사용: AnalysisPanel 공유 탭, `/track/:trackId` 상세 페이지.

| 버튼 | 방식 |
|------|------|
| 링크 복사 | `navigator.clipboard.writeText(link)` |
| 공유하기 | Web Share API (미지원 시 링크 복사 폴백) |
| X (Twitter) | `x.com/intent/tweet` |
| 카카오 | Kakao Share SDK (`VITE_KAKAO_APP_KEY` 없으면 클립보드 폴백) |
| 페이스북 | `facebook.com/sharer/sharer.php` |
| 스레드 | `threads.net/intent/post` |
| 인스타 | 클립보드 복사 + 토스트 |
| 틱톡 | 클립보드 복사 + 토스트 |

공유 링크 형식: `https://waverse.net/track/{trackId}`

### 4-6. 트랙 상세 페이지 (`/track/:trackId`)

- URL 접속 시 해당 트랙 자동 재생 (playerStore.setTrack)
- 커버, 제목, 아티스트, 장르, 제작자, 설명 표시
- 좋아요, 재생/일시정지, 공유 버튼
- 하단 공유 섹션 (ShareButtons 포함)

### 4-7. 좋아요

- `likes` 테이블 (user_id + track_id unique)
- `useLike` 훅: 좋아요 수 조회, 토글

### 4-8. 아티스트 대시보드 (`/dashboard`)

- **내 트랙 탭**: 내가 올린 트랙 목록, 삭제 가능
- **업로드 탭**: UploadForm 임베드
- **통계 탭**: 총 트랙 수, 총 재생 수(표시만), 좋아요 수
- artist / superadmin 역할만 접근 가능

### 4-9. 관리자 페이지 (`/admin`, superadmin 전용)

| 탭 | 기능 |
|----|------|
| 트랙 | 전체 트랙 목록, 수정(제목/아티스트/장르/공개여부/커버이미지), 삭제 |
| 회원 | 전체 회원 목록, 역할 변경 (user/artist/superadmin) |
| 신고 | 신고 목록, 상태 변경 (pending/resolved/dismissed) |
| 통계 | 트랙 수, 회원 수, 좋아요 수, 재생 수(play_count 합산 표시만) |

### 4-10. 스토리지 추상화

- `StorageProvider` 인터페이스: `upload(file, opts)` / `delete(id)`
- `SupabaseStorage`: 기본 공급자 (tracks/covers/stems 버킷)
- `IpfsStorage`: Pinata IPFS 연동 준비 (`VITE_PINATA_JWT` 필요)
- `VITE_STORAGE_PROVIDER` 환경변수로 런타임 전환 가능

### 4-11. 장르 시스템

22개 장르: 발라드, 포크, 재즈, K-POP, 로파이, 블루스, 팝, 록, R&B, 힙합, 클래식, 트로트, 인디, 소울, 펑크, 레게, 컨트리, 일렉트로닉, 앰비언트, 뉴에이지, OST, 기타

---

## 5. 미완성 / 버그

### 🔴 심각 (동작 오류 또는 비용 위험)

| 번호 | 항목 | 내용 |
|------|------|------|
| B1 | **API 인증 없음** | `/api/analyze/mr-start`, `/api/analyze/mr-poll` 에 JWT 인증이 없음. `trackId`만 알면 누구나 호출 가능 → Replicate 비용 폭탄 위험 |
| B2 | **play_count 미증가** | DB에 `increment_play_count` 함수 있음. 조회/표시는 되지만 실제로 호출하는 코드가 없음 → 재생 수 통계 항상 0 |
| B3 | **AI 가사/악보 미구현** | `track_analyses` 테이블에 `lyrics`, `sheet_*` 컬럼 존재. `/api/analyze/start.js` 파일 있음. 그러나 Whisper 가사 추출, GPT 악보 분석 코드 없음. UI 탭도 제거됨 |

### 🟠 주요 누락

| 번호 | 항목 | 내용 |
|------|------|------|
| M1 | **MusicCard → TrackPage 링크 없음** | 트랙 목록에서 카드를 클릭해도 `/track/:trackId`로 이동 안 됨. 공유 링크로 직접 접근은 가능 |
| M2 | **프로필 편집 없음** | Profile 페이지는 조회만 가능. username, bio, avatar 수정 불가 |
| M3 | **댓글 UI 없음** | `comments` 테이블 있음, UI 없음 |
| M4 | **회원가입 후 username 설정 없음** | 회원가입 직후 username 입력 단계 없음 (자동 생성) |

### 🟡 경고 / 주의

| 번호 | 항목 | 내용 |
|------|------|------|
| W1 | **Vercel Hobby 플랜 제한** | Serverless 함수 최대 실행 10초. `analyze/start.js`(maxDuration 60s)는 Pro 플랜 필요 |
| W2 | **클라이언트 오케스트레이션** | MR 폴링이 클라이언트(브라우저)에서 돌아감. 브라우저 닫으면 폴링 중단되나, 재접속 시 자동 재개 |
| W3 | **wavesurfer.js 미사용** | 설치됨, MRPanel에 통합 예정이었으나 미구현 |
| W4 | **IPFS 스토리지** | 코드는 준비됨, 실제 사용 시 Pinata 계정 및 환경변수 필요 |

---

## 6. 결제 연동 전 필수 수정 사항

결제 시스템을 붙이기 전에 아래 3가지는 반드시 수정해야 한다.

### 🔴 P0 — API 인증 추가 (최우선)

```javascript
// api/analyze/mr-start.js, mr-poll.js 상단에 추가
const authHeader = req.headers.authorization
const token = authHeader?.replace('Bearer ', '')
const { data: { user }, error } = await supabase.auth.getUser(token)
if (!user || error) return res.status(401).json({ error: 'Unauthorized' })
```

클라이언트에서는 fetch 시 `Authorization: Bearer {session.access_token}` 헤더 추가.  
이게 없으면 공개 trackId만으로 Replicate API 호출이 가능해서 비용이 무제한 발생한다.

### 🔴 P0 — play_count 증가 구현

MusicPlayer에서 재생 시작 시점에 RPC 호출:
```javascript
supabase.rpc('increment_play_count', { track_id: currentTrack.id })
```
통계 데이터가 없으면 결제 플랜의 "트랙 재생 수" 기반 기능이 의미없다.

### 🟠 P1 — MusicCard에 TrackPage 링크 추가

```jsx
// MusicCard.jsx 에서 트랙 제목/아티스트 영역을 Link로 감싸기
import { Link } from 'react-router-dom'
<Link to={`/track/${track.id}`} style={{ textDecoration: 'none' }}>
  {/* 제목/아티스트 */}
</Link>
```
공유 링크로 유입된 사람이 다른 트랙을 탐색할 수 있어야 한다.

---

## 7. 데이터베이스 구조

### `profiles`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | auth.users 참조 |
| `username` | text UNIQUE | 사용자명 |
| `email` | text | 이메일 |
| `avatar_url` | text | 프로필 이미지 URL |
| `bio` | text | 자기소개 |
| `role` | text | `user` / `artist` / `superadmin` |
| `created_at` | timestamptz | 가입일 |

### `tracks`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `user_id` | uuid → profiles | 업로더 |
| `title` | text | 곡 제목 |
| `artist` | text | 아티스트명 |
| `maker` | text | 제작자 (Suno 등) |
| `description` | text | 설명 |
| `genre` | text | 장르 value |
| `tags` | text[] | 태그 배열 |
| `audio_url` | text | 재생용 공개 URL |
| `cover_url` | text | 커버 이미지 URL |
| `storage_provider` | text | `supabase` / `ipfs` |
| `audio_storage_id` | text | 스토리지 내부 ID |
| `cover_storage_id` | text | 스토리지 내부 ID |
| `is_public` | boolean | 공개 여부 (default true) |
| `play_count` | integer | 재생 수 ⚠️ 증가 코드 미구현 |
| `created_at` | timestamptz | |

### `likes`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `user_id` | uuid → profiles | |
| `track_id` | uuid → tracks | |
| `created_at` | timestamptz | |

UNIQUE 제약: `(user_id, track_id)`

### `comments`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `user_id` | uuid → profiles | |
| `track_id` | uuid → tracks | |
| `body` | text | 댓글 내용 |
| `created_at` | timestamptz | |

⚠️ 테이블만 있음, UI 없음

### `reports`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `reporter_id` | uuid → profiles | 신고자 |
| `track_id` | uuid → tracks | 신고 대상 (nullable) |
| `reason` | text | 신고 사유 |
| `status` | text | `pending` / `resolved` / `dismissed` |
| `created_at` | timestamptz | |

### `track_analyses`

| 컬럼 | 타입 | 사용 여부 | 설명 |
|------|------|----------|------|
| `id` | uuid (PK) | ✅ | |
| `track_id` | uuid → tracks UNIQUE | ✅ | |
| `mr_url` | text | ✅ | MR 반주 스템 URL |
| `vocal_url` | text | ✅ | 보컬 스템 URL |
| `mr_status` | text | ✅ | `idle/processing/done/error` |
| `mr_prediction_id` | text | ✅ | Replicate 예측 ID |
| `lyrics` | text | ❌ 미구현 | Whisper 가사 |
| `lyrics_status` | text | ❌ 미구현 | |
| `sheet_key` | text | ❌ 미구현 | 조성 |
| `sheet_bpm` | integer | ❌ 미구현 | BPM |
| `sheet_chords` | text[] | ❌ 미구현 | 코드 진행 |
| `sheet_feel` | text | ❌ 미구현 | 분위기 |
| `sheet_status` | text | ❌ 미구현 | |
| `share_title` | text | ❌ 미구현 | AI 공유 제목 |
| `share_desc` | text | ❌ 미구현 | AI 공유 설명 |
| `share_tags` | text[] | ❌ 미구현 | AI 해시태그 |
| `share_status` | text | ❌ 미구현 | |
| `error_info` | jsonb | ✅ | 에러 상세 |
| `updated_at` | timestamptz | ✅ | |

### DB 함수

```sql
increment_play_count(track_id uuid) → void
-- ⚠️ 함수는 존재하지만 클라이언트에서 호출하는 코드 없음
```

### RLS 정책 요약

- `profiles`: 전체 조회 가능, 본인만 수정
- `tracks`: 전체 조회, 인증 사용자 등록, 본인 수정/삭제, superadmin 전체
- `likes`: 전체 조회, 인증 사용자 추가, 본인 삭제
- `comments`: 전체 조회, 인증 사용자 추가, 본인 삭제
- `reports`: 인증 사용자 생성, superadmin만 조회/수정
- `track_analyses`: 전체 조회, 인증 사용자 등록/수정

---

## 8. 스토리지 버킷

| 버킷 | 공개 | 용도 |
|------|------|------|
| `tracks` | public | 원본 오디오/영상 (MP3, MP4) |
| `covers` | public | 커버 이미지 (JPEG, PNG, WebP) |
| `stems` | public | MR/보컬 분리 결과 |

**파일 경로 규칙**
- `tracks`: `{userId}/{trackId}.{ext}`
- `covers`: `{userId}/{trackId}.{ext}`
- `stems`: `{userId}/{trackId}_mr.mp3`, `{userId}/{trackId}_vocal.mp3`

---

## 9. Vercel Serverless API

### `POST /api/analyze/mr-start`

MR 분리 시작 (Replicate Demucs 비동기 예측 생성)

**요청**: `{ trackId, audioUrl }`  
**처리**: Replicate `htdemucs` 2-stem 예측 생성 → `mr_prediction_id` DB 저장  
**maxDuration**: 15s  
**⚠️ 인증 없음**: JWT 검증 미구현

### `GET /api/analyze/mr-poll?trackId={id}`

Replicate 예측 결과 폴링

**처리**: 예측 완료 시 보컬/MR 스템을 `stems` 버킷에 영구 저장  
**응답**: `{ status: 'processing'|'done'|'error', mr_url, vocal_url }`  
**완료 시 DB**: `mr_status=done`, `mr_url`, `vocal_url` 저장  
**maxDuration**: 20s  
**⚠️ 인증 없음**: JWT 검증 미구현

### `POST /api/analyze/start` ← 현재 미사용

GPT-4o-mini 기반 공유 콘텐츠 생성 (Whisper 가사 추출 코드 없음)  
클라이언트에서 더 이상 호출하지 않음. 향후 가사/악보 기능 구현 시 활용 예정.

---

## 10. 환경변수

### 프론트엔드 (`.env.local`, `VITE_` 접두사)

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 공개 anon 키 |
| `VITE_STORAGE_PROVIDER` | - | `supabase`(기본) 또는 `ipfs` |
| `VITE_PINATA_JWT` | - | IPFS 사용 시 Pinata JWT |
| `VITE_KAKAO_APP_KEY` | - | 카카오 공유 SDK 키 (없으면 클립보드 폴백) |

### 서버 (Vercel 환경변수)

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase URL (서버 함수에서도 사용) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 서비스 롤 키 (RLS 우회) |
| `REPLICATE_API_TOKEN` | ✅ | Replicate API 토큰 (Demucs MR 분리) |
| `OPENAI_API_KEY` | - | GPT-4o-mini (현재 미사용, 향후 가사/악보) |
| `REPLICATE_DEMUCS_VERSION` | - | Demucs 모델 버전 해시 오버라이드 |

### superadmin 설정

```sql
-- Supabase SQL 에디터에서 실행
UPDATE public.profiles SET role = 'superadmin' WHERE id = '<YOUR_USER_ID>';
```

---

## 11. 배포

- **플랫폼**: Vercel (GitHub `kimtyy/waverse` 연동, main 브랜치 자동 배포)
- **SPA 라우팅**: `vercel.json`에서 `/api/*` 제외하고 모두 `index.html`로 rewrite
- **정적 에셋 캐싱**: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
- **DB 마이그레이션**: `supabase/schema.sql`을 Supabase SQL 에디터에서 수동 실행

```json
// vercel.json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }]
}
```

---

## v1.0 상태 요약 (2026-05-06 기준)

| 영역 | 완성도 | 비고 |
|------|--------|------|
| UI/UX | ⭐⭐⭐⭐⭐ | 다크테마, 반응형, 애니메이션 완성 |
| 인증 | ⭐⭐⭐⭐ | 회원가입/로그인 완성, 프로필 편집 없음 |
| 업로드 | ⭐⭐⭐⭐ | 멀티파일, MP4 지원 완성 |
| 플레이어 | ⭐⭐⭐⭐⭐ | 미니/확장, 큐, MP4 영상 재생 완성 |
| AI MR 분리 | ⭐⭐⭐⭐ | 완성 (수동 시작 방식) |
| AI 가사/악보 | ⭐ | DB 스키마만, 구현 없음 |
| 공유 | ⭐⭐⭐⭐ | 6개 플랫폼, 트랙 상세 페이지 완성 |
| 보안 | ⭐⭐ | API 인증 없음 — 결제 전 필수 수정 |
| 통계 | ⭐⭐ | 표시만, play_count 증가 코드 없음 |
| 관리자 | ⭐⭐⭐⭐⭐ | 트랙/회원/신고/통계 완성 |
