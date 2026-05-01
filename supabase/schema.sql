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
  description text,
  genre text,
  tags text[] default '{}',
  audio_url text not null,
  cover_url text,
  play_count integer default 0,
  created_at timestamptz default now()
);

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


-- Storage bucket for tracks and covers
-- Run in Supabase Dashboard > Storage > New bucket: "tracks" (public)

-- Increment play count function
create or replace function increment_play_count(track_id uuid)
returns void as $$
  update public.tracks set play_count = play_count + 1 where id = track_id;
$$ language sql;
