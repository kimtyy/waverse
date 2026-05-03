# WAVERSE 개발 로그

> 최종 업데이트: 2026-05-04

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [페이지 & 라우트](#3-페이지--라우트)
4. [구현된 기능](#4-구현된-기능)
5. [데이터베이스 구조](#5-데이터베이스-구조)
6. [스토리지 버킷](#6-스토리지-버킷)
7. [Vercel Serverless API](#7-vercel-serverless-api)
8. [환경변수](#8-환경변수)
9. [미완성 / 알려진 이슈](#9-미완성--알려진-이슈)
10. [배포](#10-배포)

---

## 1. 프로젝트 개요

AI 기반 음악 공유 플랫폼. 사용자가 MP3/MP4를 업로드하면 AI가 자동으로 가사를 추출하고, 악보를 생성하며, MR(반주)을 분리하고, 바이럴 공유 콘텐츠를 만들어 준다.

**GitHub**: `https://github.com/kimtyy/waverse`  
**Vercel**: 자동 배포 (main 브랜치 push → 즉시 배포)

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8 |
| 라우팅 | React Router v7 |
| 상태관리 | Zustand 5 |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| 서버리스 함수 | Vercel Serverless Functions (`/api` 디렉토리) |
| AI - 가사 | OpenAI Whisper (`whisper-1`) |
| AI - 악보/공유 | OpenAI GPT-4o-mini |
| AI - MR 분리 | Replicate Demucs (`htdemucs`, 2-stem) |
| 스토리지 추상화 | 내부 StorageProvider 패턴 (Supabase / IPFS 전환 가능) |
| UI 아이콘 | Lucide React |
| 토스트 | react-hot-toast |
| 파형 시각화 | wavesurfer.js (설치됨, MRPanel에서 사용 예정) |
| CSS | Tailwind CSS 4 + 인라인 스타일 혼용 |

---

## 3. 페이지 & 라우트

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `Home` | 트랙 목록 (장르 필터 칩, 전체 재생) |
| `/discover` | `Discover` | 검색 + 장르 필터 |
| `/upload` | `Upload` | 업로드 페이지 (UploadForm 래퍼) |
| `/favorites` | `Favorites` | 좋아요한 트랙 목록 |
| `/profile` | `Profile` | 내 프로필 |
| `/auth` | `Auth` | 로그인 / 회원가입 |
| `/dashboard` | `DashboardPage` | 아티스트 대시보드 (내 트랙, 업로드, 통계) |
| `/admin` | `AdminPage` | 관리자 페이지 (superadmin 전용) |

`/auth`, `/admin`, `/dashboard`는 Layout(BottomNav) 없이 독립 렌더링.

---

## 4. 구현된 기능

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
- **AI 분석 자동 트리거**: 업로드 완료 후 백그라운드에서 MR 분리 시작

### 4-3. 음악 플레이어

**미니 플레이어** (하단 고정)
- 커버 썸네일, 트랙명/아티스트, 현재 재생 시간
- 이전/재생·일시정지/다음 버튼
- 씬 프로그레스 바 (클릭 seek 가능)
- 클릭 시 확장 플레이어로 전환

**확장 플레이어** (풀스크린 오버레이)
- **MP3/WAV**: 블러 배경 + 대형 커버 이미지 표시
- **MP4**: 전체 화면 영상 재생 (video 엘리먼트 전환)
- 큰 프로그레스 바 (클릭 seek), 재생 시간/총 시간
- AI 분석 버튼 (✨ 아이콘) → AnalysisPanel 열기
- 파일 형식 자동 감지 (`isVideoUrl`)

**Zustand 플레이어 스토어** (`playerStore`)
- `currentTrack`, `isPlaying`, `volume`, `progress`, `duration`, `queue`
- `playNext` / `playPrev` (큐 순환)

### 4-4. AI 분석 파이프라인

**순서**: MR 분리 → 가사 추출 → 악보/공유 분석

```
업로드 완료
    └─► /api/analyze/mr-start  (Replicate Demucs 예측 시작)
            │
            ▼  (클라이언트 15초 폴링)
        /api/analyze/mr-poll  (Replicate 결과 확인)
            │  succeeded
            ▼
        보컬 스템 + MR 스템 → Supabase stems 버킷 저장
        lyrics/sheet/share_status = 'processing'
            │
            ▼  (클라이언트 자동 트리거)
        /api/analyze/start
            ├─ Whisper: 보컬 스템으로 가사 추출 (파일 작음 + 정확도↑)
            └─ GPT-4o-mini: MR 스템 컨텍스트로 악보/공유 분석 (보컬 없음 = 코드 정확도↑)
```

**복구 로직**: 페이지 이탈 후 복귀 시 `mr_status=done` & `lyrics_status≠done`이면 자동 재트리거

**AnalysisPanel 4개 탭**

| 탭 | 기능 |
|----|------|
| 가사 | Whisper 추출 가사, 스크롤 뷰, Instrumental 처리 |
| 악보 | 조성(Key), BPM, 분위기(Feel), 코드 진행 표시 |
| MR | 보컬/MR 스템 독립 오디오 플레이어 (MR↔보컬 토글) |
| 공유 | 제목/설명/태그 편집, X(트위터)/카카오/인스타그램/틱톡 공유 버튼 |

상태 도트: `idle`(투명) / `processing`(노랑 펄스) / `done`(초록) / `error`(빨강)

Supabase Realtime으로 분석 상태 실시간 업데이트.

### 4-5. 좋아요

- `likes` 테이블 (user_id + track_id unique)
- `useLike` 훅: 좋아요 수 조회, 토글

### 4-6. 댓글

- `comments` 테이블 (체계 구현, UI는 MusicCard에 부분 통합)

### 4-7. 아티스트 대시보드 (`/dashboard`)

- **내 트랙 탭**: 내가 올린 트랙 목록, 삭제 가능
- **업로드 탭**: UploadForm 임베드
- **통계 탭**: 총 트랙 수, 총 재생 수, 좋아요 수
- artist / superadmin 역할만 접근 가능

### 4-8. 관리자 페이지 (`/admin`, superadmin 전용)

| 탭 | 기능 |
|----|------|
| 트랙 | 전체 트랙 목록, 트랙 수정(제목/아티스트/장르/공개여부/커버이미지 변경), 삭제 |
| 회원 | 전체 회원 목록, 역할 변경 (user/artist/superadmin) |
| 신고 | 신고 목록, 상태 변경 (pending/resolved/dismissed) |
| 통계 | 트랙 수, 회원 수, 좋아요 수, 재생 수 등 집계 |

### 4-9. 스토리지 추상화 레이어

- `StorageProvider` 인터페이스: `upload(file, opts)` / `delete(id)`
- `SupabaseStorage`: 기본 공급자 (tracks/covers 버킷)
- `IpfsStorage`: Pinata IPFS 연동 준비 완료 (`VITE_PINATA_JWT` 필요)
- `VITE_STORAGE_PROVIDER` 환경변수로 런타임 전환 가능

### 4-10. 장르 시스템

22개 장르 지원: 발라드, 포크, 재즈, K-POP, 로파이, 블루스, 팝, 록, R&B, 힙합, 클래식, 트로트, 인디, 소울, 펑크, 레게, 컨트리, 일렉트로닉, 앰비언트, 뉴에이지, OST, 기타

---

## 5. 데이터베이스 구조

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
| `play_count` | integer | 재생 수 |
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

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid (PK) | |
| `track_id` | uuid → tracks UNIQUE | |
| `lyrics` | text | 추출된 가사 |
| `lyrics_status` | text | `idle/processing/done/error` |
| `sheet_key` | text | 조성 (e.g. "Am") |
| `sheet_bpm` | integer | 템포 |
| `sheet_chords` | text[] | 코드 진행 배열 |
| `sheet_feel` | text | 분위기 설명 |
| `sheet_status` | text | `idle/processing/done/error` |
| `mr_url` | text | MR(반주) 스템 URL |
| `vocal_url` | text | 보컬 스템 URL |
| `mr_status` | text | `idle/processing/done/error` |
| `mr_prediction_id` | text | Replicate 예측 ID |
| `share_title` | text | 공유용 제목 |
| `share_desc` | text | 공유용 설명 |
| `share_tags` | text[] | 공유용 해시태그 |
| `highlight_start` | float | 하이라이트 시작 시간(초) |
| `share_status` | text | `idle/processing/done/error` |
| `error_info` | jsonb | 에러 상세 |
| `updated_at` | timestamptz | |

### RLS 정책 요약

- `profiles`: 전체 조회 가능, 본인만 수정
- `tracks`: 전체 조회 가능, 인증 사용자만 등록, 본인만 수정/삭제, superadmin 전체 접근
- `likes`: 전체 조회, 인증 사용자 추가, 본인 삭제
- `comments`: 전체 조회, 인증 사용자 추가, 본인 삭제
- `reports`: 인증 사용자 생성, superadmin만 조회/수정
- `track_analyses`: 전체 조회, 인증 사용자 등록

### DB 함수

```sql
increment_play_count(track_id uuid) → void
```

---

## 6. 스토리지 버킷

| 버킷 | 공개 | 허용 타입 | 용도 |
|------|------|-----------|------|
| `tracks` | public | audio/mpeg, audio/mp3, audio/wav, audio/flac, audio/aac, audio/ogg, video/mp4 | 원본 오디오/영상 |
| `covers` | public | image/jpeg, png, webp, gif, avif | 커버 이미지 |
| `stems` | public | 제한 없음 | MR/보컬 분리 결과, MP4 오디오 추출 임시 파일 |

**파일 경로 규칙**
- `tracks`: `{userId}/{trackId}.{ext}`
- `covers`: `{userId}/{trackId}.{ext}`
- `stems`: `{userId}/{trackId}_mr.mp3`, `{userId}/{trackId}_vocal.mp3`, `{userId}/{trackId}_mr_src.wav`

---

## 7. Vercel Serverless API

### `POST /api/analyze/mr-start`

MR 분리 시작 (Replicate Demucs 비동기 예측 생성)

**요청**: `{ trackId, audioUrl }`  
**처리**: Replicate `htdemucs` 2-stem 예측 생성 → `mr_prediction_id` DB 저장  
**모델**: `cjwbw/demucs` (버전 해시 `25a173108...`, `REPLICATE_DEMUCS_VERSION`으로 오버라이드 가능)  
**maxDuration**: 15s

### `GET /api/analyze/mr-poll?trackId={id}`

Replicate 예측 결과 폴링

**처리**: 예측 완료 시 보컬/MR 스템을 `stems` 버킷에 영구 저장 (Replicate URL은 24시간 후 만료)  
**응답**: `{ status: 'processing'|'done'|'error', mr_url, vocal_url }`  
**완료 시 DB 업데이트**: `mr_status=done`, `lyrics/sheet/share_status=processing`  
**maxDuration**: 20s

### `POST /api/analyze/start`

가사·악보·공유 분석 (MR 분리 완료 후 클라이언트가 자동 호출)

**요청**: `{ trackId, vocalUrl, instrumentalUrl }`  
**처리**:
1. DB에서 title/artist 조회
2. Whisper로 보컬 스템 가사 추출
3. GPT-4o-mini로 악보(Key/BPM/코드/분위기) + 공유 콘텐츠 생성
4. 하이라이트 구간 자동 계산 (단어 밀도 기준)

**maxDuration**: 60s

---

## 8. 환경변수

### 프론트엔드 (`.env.local`, `VITE_` 접두사)

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 공개 anon 키 |
| `VITE_STORAGE_PROVIDER` | - | `supabase`(기본) 또는 `ipfs` |
| `VITE_PINATA_JWT` | - | IPFS 사용 시 Pinata JWT |

### 서버 (Vercel 환경변수)

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase URL (서버 함수에서도 사용) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 서비스 롤 키 (RLS 우회) |
| `OPENAI_API_KEY` | ✅ | OpenAI API 키 (Whisper + GPT-4o-mini) |
| `REPLICATE_API_TOKEN` | ✅ | Replicate API 토큰 (Demucs) |
| `REPLICATE_DEMUCS_VERSION` | - | Demucs 모델 버전 해시 오버라이드 |

### superadmin 설정 방법

Supabase SQL 에디터에서 실행:
```sql
update public.profiles set role = 'superadmin' where id = '<YOUR_USER_ID>';
```

---

## 9. 미완성 / 알려진 이슈

### 미완성 기능

| 항목 | 상태 | 비고 |
|------|------|------|
| 댓글 UI | 미구현 | `comments` 테이블은 있음, UI 없음 |
| 파형 시각화 | 미구현 | `wavesurfer.js` 설치됨, MRPanel에 통합 예정 |
| 프로필 편집 | 미구현 | Profile 페이지 조회만 됨 |
| 팔로우/팔로워 | 미구현 | DB 테이블 없음 |
| 트랙 상세 페이지 | 미구현 | 개별 트랙 URL 없음 |
| 알림 시스템 | 미구현 | |
| 플레이리스트 | 미구현 | |

### 알려진 이슈 / 주의사항

| 이슈 | 내용 |
|------|------|
| **Replicate 크레딧** | Replicate 계정에 잔액이 있어야 MR 분리 작동. `replicate.com/account/billing`에서 충전 필요 |
| **Vercel Hobby 플랜** | Serverless 함수 최대 실행 시간 10초. `start.js`(60s)는 Pro 플랜 필요. 긴 트랙 분석 시 타임아웃 가능 |
| **MP4 오디오 추출** | Web Audio API 기반 클라이언트 사이드 처리. 브라우저 메모리 제한으로 매우 큰 파일(1GB+)은 실패 가능 |
| **AI 분석 의존성** | 파이프라인이 클라이언트 오케스트레이션 방식. 브라우저를 닫으면 MR 완료 후 분석이 시작되지 않음. 복구 로직으로 재진입 시 자동 재시작 |
| `url.parse()` 경고 | Node.js 에서 발생하는 비치명적 deprecation 경고 (무시 가능) |

### 향후 개선 고려 사항

- Vercel `mr-poll`에서 완료 시 `start`를 직접 서버 내 호출 → 완전한 서버 사이드 파이프라인
- 큐 관리 UI (현재 큐는 존재하지만 조작 인터페이스 없음)
- PWA / 오프라인 지원

---

## 10. 배포

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
