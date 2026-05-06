# WAVERSE 개발 로그

> 최종 업데이트: 2026-05-07 — v1.0 기능 완성 + 출시 준비

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [페이지 & 라우트](#3-페이지--라우트)
4. [완성된 기능](#4-완성된-기능)
5. [미완성 / 버그](#5-미완성--버그)
6. [다음 작업](#6-다음-작업)
7. [데이터베이스 구조](#7-데이터베이스-구조)
8. [스토리지 버킷](#8-스토리지-버킷)
9. [Vercel Serverless API](#9-vercel-serverless-api)
10. [환경변수](#10-환경변수)
11. [배포](#11-배포)
12. [변경 이력](#12-변경-이력)

---

## 1. 프로젝트 개요

음악 공유 플랫폼. 사용자가 MP3/MP4를 업로드하고, MR(반주)을 분리하며, SNS 공유 링크를 제공한다.

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
| MR 분리 | Replicate Demucs (`htdemucs`, 2-stem) |
| 이메일 | Resend (환영 이메일, 주간 뉴스레터) |
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
| `/profile` | `Profile` | 내 프로필 + 뉴스레터 구독 토글 | ✅ |
| `/auth` | `Auth` | 로그인 / 회원가입 / 구글 로그인 | ✅ |
| `/track/:trackId` | `TrackPage` | 트랙 상세 + 자동재생 + 공유 | ✅ |
| `/dashboard` | `DashboardPage` | 아티스트 대시보드 | ✅ |
| `/admin` | `AdminPage` | 관리자 페이지 (superadmin 전용) | ✅ |

`/auth`, `/admin`, `/dashboard`는 Layout(BottomNav) 없이 독립 렌더링.  
나머지는 LayoutWrapper 안에서 BottomNav + MusicPlayer 포함.

---

## 4. 완성된 기능

### 4-1. 인증

- 이메일/비밀번호 회원가입 · 로그인 (`supabase.auth`)
- **구글 소셜 로그인** (`supabase.auth.signInWithOAuth({ provider: 'google' })`)
- 회원가입 시 `profiles` 테이블에 자동 레코드 생성
- 회원가입 완료 시 Resend로 환영 이메일 자동 발송
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
- **MP4**: 전체 화면 영상 재생 (poster로 로딩 중 검은 화면 방지)
- 큰 프로그레스 바, 재생 시간/총 시간
- 분석 버튼 (✨ 아이콘) → AnalysisPanel 열기

**Zustand 플레이어 스토어** (`playerStore`)
- `currentTrack`, `isPlaying`, `volume`, `progress`, `duration`, `queue`
- `playNext` / `playPrev` (큐 순환)

**모바일 autoplay 지원**
- `<MusicPlayer />`를 항상 DOM에 마운트 (Layout에서 조건부 렌더 제거)
- 첫 탭이 마운트가 아닌 re-render로 처리 → iOS Safari gesture context 유지
- `useLayoutEffect`로 트랙 변경/재생 동기화 (브라우저 paint 전 동기 실행)

### 4-4. MR 분리

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
| 공유 | SNS 공유 링크 (7개 플랫폼) |

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
- **OG 태그**: `<meta property="og:*">` + Twitter Card — SNS 공유 시 트랙 제목·커버 미리보기

### 4-7. 좋아요

- `likes` 테이블 (user_id + track_id unique)
- `useLike` 훅: 좋아요 수 조회, 토글

### 4-8. 이메일 (Resend)

| 기능 | 경로 | 설명 |
|------|------|------|
| 환영 이메일 | `POST /api/email/welcome` | 회원가입 완료 시 자동 발송 |
| 주간 뉴스레터 | `GET /api/newsletter/weekly-top5` | 매주 월요일 오후 6시 Cron 실행 |

- **환영 이메일**: WAVERSE 브랜드 HTML 템플릿, 기능 안내 포함
- **뉴스레터**: `newsletter_subscribed = true`인 사용자에게만 발송
- **구독 토글**: Profile 페이지에서 ON/OFF (`profiles.newsletter_subscribed` 컬럼)
- `RESEND_API_KEY` 없으면 서버 오류 반환 (클라이언트 흐름에는 영향 없음)

**Vercel Cron 설정** (`vercel.json`):
```json
{
  "crons": [{ "path": "/api/newsletter/weekly-top5", "schedule": "0 9 * * 1" }]
}
```
(UTC 09:00 = KST 18:00, 매주 월요일)

### 4-9. 아티스트 대시보드 (`/dashboard`)

- **내 트랙 탭**: 내가 올린 트랙 목록, 삭제 가능
- **업로드 탭**: UploadForm 임베드
- **통계 탭**: 총 트랙 수, 총 재생 수(play_count), 좋아요 수
- artist / superadmin 역할만 접근 가능

### 4-10. 관리자 페이지 (`/admin`, superadmin 전용)

| 탭 | 기능 |
|----|------|
| 트랙 | 전체 트랙 목록, 수정(제목/아티스트/장르/공개여부/커버이미지), 삭제 |
| 회원 | 전체 회원 목록, 역할 변경 (user/artist/superadmin) |
| 신고 | 신고 목록, 상태 변경 (pending/resolved/dismissed) |
| 통계 | 트랙 수, 회원 수, 좋아요 수, 재생 수(play_count 합산) |

### 4-11. 보안

- **MR API 인증**: `/api/analyze/mr-start`, `/api/analyze/mr-poll` — JWT 검증 추가, 미인증 요청 401 반환
- **play_count 실제 증가**: MusicPlayer에서 재생 시 `increment_play_count` RPC 호출
- **MusicCard → TrackPage 링크**: 트랙 카드 클릭 시 `/track/:trackId` 이동

### 4-12. PWA

- **앱 아이콘**: 모든 사이즈(192×192, 512×512 등) 초록 파형 아이콘으로 통일
- `manifest.json` 아이콘 목록 일치

### 4-13. 스토리지 추상화

- `StorageProvider` 인터페이스: `upload(file, opts)` / `delete(id)`
- `SupabaseStorage`: 기본 공급자 (tracks/covers/stems 버킷)
- `IpfsStorage`: Pinata IPFS 연동 준비 (`VITE_PINATA_JWT` 필요)
- `VITE_STORAGE_PROVIDER` 환경변수로 런타임 전환 가능

### 4-14. 장르 시스템

22개 장르: 발라드, 포크, 재즈, K-POP, 로파이, 블루스, 팝, 록, R&B, 힙합, 클래식, 트로트, 인디, 소울, 펑크, 레게, 컨트리, 일렉트로닉, 앰비언트, 뉴에이지, OST, 기타

---

## 5. 미완성 / 버그

### 🟠 주요 누락

| 번호 | 항목 | 내용 |
|------|------|------|
| M1 | **프로필 편집 없음** | Profile 페이지는 조회만 가능. username, bio, avatar 수정 불가 |
| M2 | **댓글 UI 없음** | `comments` 테이블 있음, UI 없음 |
| M3 | **회원가입 후 username 설정 없음** | 구글 로그인 시 username 입력 단계 없음 (자동 생성) |

### 🟡 경고 / 주의

| 번호 | 항목 | 내용 |
|------|------|------|
| W1 | **Vercel Hobby 플랜 제한** | Serverless 함수 최대 실행 10초. `analyze/start.js`(maxDuration 60s)는 Pro 플랜 필요 |
| W2 | **클라이언트 오케스트레이션** | MR 폴링이 클라이언트(브라우저)에서 돌아감. 브라우저 닫으면 폴링 중단, 재접속 시 자동 재개 |
| W3 | **wavesurfer.js 미사용** | 설치됨, MRPanel 통합 예정이었으나 미구현 |
| W4 | **IPFS 스토리지** | 코드는 준비됨, 실제 사용 시 Pinata 계정 및 환경변수 필요 |
| W5 | **Supabase 스토리지 버킷 공개 설정** | `tracks`, `covers` 버킷이 private이면 audio_url 404 반환. Dashboard → Storage → 버킷 → Make public 확인 필요 |
| W6 | **환영 이메일 테스트 미완료** | Resend 연동 완료, 실제 신규 가입 시 수신 여부 검증 필요 |
| W7 | **가사/악보 미구현** | `track_analyses` 테이블에 스키마만 존재. Whisper/GPT 연동 없음 |

---

## 6. 다음 작업

| 우선순위 | 항목 | 비고 |
|---------|------|------|
| 🔴 P0 | **환영 이메일 테스트** | 신규 가입 → 수신함 확인 |
| 🔴 P0 | **결제 연동 (Stripe)** | 구독 플랜, 웹훅 처리 |
| 🟠 P1 | **출시** | Product Hunt, Reddit (r/WeAreTheMusicMakers), X |
| 🟡 P2 | **프로필 편집** | username, bio, avatar 수정 |
| 🟡 P2 | **댓글** | UI + RLS |

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
| `newsletter_subscribed` | boolean | 주간 뉴스레터 수신 여부 (default false) |
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
| `share_title` | text | ❌ 미구현 | |
| `share_desc` | text | ❌ 미구현 | |
| `share_tags` | text[] | ❌ 미구현 | |
| `share_status` | text | ❌ 미구현 | |
| `error_info` | jsonb | ✅ | 에러 상세 |
| `updated_at` | timestamptz | ✅ | |

### DB 함수

```sql
increment_play_count(track_id uuid) → void
-- MusicPlayer에서 재생 시작 시 호출됨
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

⚠️ 버킷이 private이면 audio_url 404 발생 → Supabase Dashboard에서 public 확인 필요

---

## 9. Vercel Serverless API

### `POST /api/analyze/mr-start`

MR 분리 시작 (Replicate Demucs 비동기 예측 생성)

**요청**: `{ trackId, audioUrl }` + `Authorization: Bearer {token}`  
**처리**: JWT 검증 → Replicate `htdemucs` 2-stem 예측 생성 → `mr_prediction_id` DB 저장  
**maxDuration**: 15s

### `GET /api/analyze/mr-poll?trackId={id}`

Replicate 예측 결과 폴링

**요청**: `Authorization: Bearer {token}`  
**처리**: JWT 검증 → 예측 완료 시 보컬/MR 스템을 `stems` 버킷에 영구 저장  
**응답**: `{ status: 'processing'|'done'|'error', mr_url, vocal_url }`  
**maxDuration**: 20s

### `POST /api/analyze/start` ← 현재 미사용

GPT-4o-mini 기반 공유 콘텐츠 생성. 향후 가사/악보 기능 구현 시 활용 예정.

### `POST /api/email/welcome`

Resend로 환영 이메일 발송

**요청**: `{ email, username }`  
**발신**: `noreply@waverse.net`  
**RESEND_API_KEY** 없으면 500 반환 (가입 흐름에는 영향 없음)

### `GET /api/newsletter/weekly-top5`

주간 TOP5 트랙 뉴스레터 발송 (Vercel Cron)

**스케줄**: 매주 월요일 UTC 09:00 (= KST 18:00)  
**대상**: `newsletter_subscribed = true`인 전체 사용자  
**내용**: 지난 7일간 play_count 상위 5개 트랙

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
| `RESEND_API_KEY` | ✅ | Resend API 키 (이메일 발송) |
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
- **Cron**: 매주 월요일 오후 6시 (KST) 뉴스레터 자동 발송
- **DB 마이그레이션**: `supabase/schema.sql`을 Supabase SQL 에디터에서 수동 실행

```json
// vercel.json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }],
  "crons": [{ "path": "/api/newsletter/weekly-top5", "schedule": "0 9 * * 1" }]
}
```

---

## 12. 변경 이력

### 2026-05-07

- **구글 로그인**: Supabase Google OAuth 연동 (`signInWithOAuth`)
- **PWA 아이콘**: 전 사이즈 초록 파형 아이콘으로 통일
- **"AI" 문구 제거**: UI 5곳에서 "AI" 레이블 제거
- **Resend 이메일 연동**: 환영 이메일(`/api/email/welcome`) + 주간 TOP5 뉴스레터 Cron(`/api/newsletter/weekly-top5`) + Profile 구독 토글
- **OG 태그**: 트랙 상세 페이지에 `og:title`, `og:image`, `og:description`, Twitter Card 추가
- **보안 수정**: MR API JWT 인증, `increment_play_count` RPC 실제 호출, MusicCard → TrackPage 링크
- **재생 버그 수정**:
  - `supabase.rpc().catch()` TypeError → async IIFE + try/catch로 교체
  - 모바일 autoplay: Layout에서 `<MusicPlayer />` 항상 마운트 (iOS gesture context 유지)
  - MP4 까만 화면: `<video poster>` 속성으로 커버 이미지 표시

### 2026-05-06

- 트랙 상세 페이지 (`/track/:trackId`) 구현
- 공유 기능 7개 플랫폼 (`ShareButtons` 컴포넌트)
- v1.0 초기 상태 점검 및 문서화

---

## v1.0 상태 요약 (2026-05-07 기준)

| 영역 | 완성도 | 비고 |
|------|--------|------|
| UI/UX | ⭐⭐⭐⭐⭐ | 다크테마, 반응형, PWA 아이콘 완성 |
| 인증 | ⭐⭐⭐⭐⭐ | 이메일 + 구글 로그인 완성 |
| 업로드 | ⭐⭐⭐⭐ | 멀티파일, MP4 지원 완성 |
| 플레이어 | ⭐⭐⭐⭐⭐ | 미니/확장, 큐, MP4, 모바일 autoplay 완성 |
| MR 분리 | ⭐⭐⭐⭐ | 완성 (수동 시작 방식) |
| 공유 | ⭐⭐⭐⭐⭐ | 7개 플랫폼, OG 태그, 트랙 상세 페이지 완성 |
| 이메일 | ⭐⭐⭐⭐ | 환영 이메일 + 주간 뉴스레터 (테스트 필요) |
| 보안 | ⭐⭐⭐⭐ | API 인증, play_count 증가 완성 |
| 통계 | ⭐⭐⭐⭐ | play_count 실제 증가 완성 |
| 관리자 | ⭐⭐⭐⭐⭐ | 트랙/회원/신고/통계 완성 |
| 결제 | ⭐ | 미구현 (Stripe 예정) |
| 가사/악보 | ⭐ | DB 스키마만, 구현 없음 |
