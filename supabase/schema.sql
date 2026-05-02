-- WAVERSE Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);


-- Tracks
create table if not exists public.tracks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  artist text,
  maker text,
  description text,
  genre text,
  tags text[] default '{}',

  -- 재생/표시용 HTTP URL (공급자 무관하게 항상 채워짐)
  audio_url text not null,
  cover_url text,

  -- 스토리지 추상화 레이어용 메타데이터
  -- 삭제·마이그레이션 시 공급자 API에 넘길 식별자
  storage_provider text default 'supabase',  -- 'supabase' | 'ipfs' | ...
  audio_storage_id text,                     -- 공급자별 ID (Supabase: path, IPFS: CID)
  cover_storage_id text,

  play_count integer default 0,
  created_at timestamptz default now()
);

-- 기존 스키마 업그레이드 (이미 테이블이 있는 경우)
alter table public.tracks add column if not exists artist           text;
alter table public.tracks add column if not exists maker            text;
alter table public.tracks add column if not exists storage_provider text default 'supabase';
alter table public.tracks add column if not exists audio_storage_id text;
alter table public.tracks add column if not exists cover_storage_id text;

alter table public.tracks enable row level security;

create policy "Tracks are viewable by everyone"
  on public.tracks for select using (true);

create policy "Authenticated users can insert tracks"
  on public.tracks for insert with check (auth.uid() = user_id);

create policy "Users can update own tracks"
  on public.tracks for update using (auth.uid() = user_id);

create policy "Users can delete own tracks"
  on public.tracks for delete using (auth.uid() = user_id);


-- Likes
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track_id uuid references public.tracks(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, track_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

create policy "Authenticated users can like"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.likes for delete using (auth.uid() = user_id);


-- Comments
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track_id uuid references public.tracks(id) on delete cascade not null,
  body text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- Storage Buckets
-- ──────────────────────────────────────────────────────────────

-- 버킷 생성 (Supabase Dashboard > Storage > New bucket 에서도 가능)
insert into storage.buckets (id, name, public)
  values ('tracks', 'tracks', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public, allowed_mime_types)
  values (
    'covers',
    'covers',
    true,
    array['image/jpeg','image/png','image/webp','image/gif','image/avif']
  )
  on conflict (id) do nothing;

-- tracks 버킷 정책
create policy "tracks: public read"
  on storage.objects for select
  using (bucket_id = 'tracks');

create policy "tracks: auth upload"
  on storage.objects for insert
  with check (bucket_id = 'tracks' and auth.role() = 'authenticated');

create policy "tracks: owner delete"
  on storage.objects for delete
  using (bucket_id = 'tracks' and auth.uid()::text = (storage.foldername(name))[1]);

-- covers 버킷 정책
create policy "covers: public read"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "covers: auth upload (images only)"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.role() = 'authenticated'
    and (storage.extension(name) in ('jpg','jpeg','png','webp','gif','avif'))
  );

create policy "covers: owner delete"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

-- Increment play count function
create or replace function increment_play_count(track_id uuid)
returns void as $$
  update public.tracks set play_count = play_count + 1 where id = track_id;
$$ language sql;
