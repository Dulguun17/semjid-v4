-- ================================================================
--  Сэмжид Хүжирт — Complete Supabase Schema v2
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ================================================================

create extension if not exists "pgcrypto";

-- ── DROP OLD TABLES (clean slate) ─────────────────────────────
drop table if exists chat_messages cascade;
drop table if exists bookings cascade;
drop table if exists contact_inquiries cascade;
drop table if exists reviews cascade;

-- ── BOOKINGS ──────────────────────────────────────────────────
create table bookings (
  id          uuid primary key default gen_random_uuid(),
  ref         text unique not null,
  fname       text not null,
  lname       text not null,
  phone       text not null,
  email       text,
  room_id     text,
  check_in    date not null,
  check_out   date not null,
  guests      integer not null default 1,
  guest_details jsonb default '[]'::jsonb,
  treatments  text[] default '{}',
  notes       text,
  ilgeeh_bichig_url text,
  special_code text,
  payment     text not null default 'cash',
  total       integer default 0,
  status      text not null default 'pending'
                check (status in ('pending','confirmed','cancelled')),
  created_at  timestamptz not null default now()
);

-- ── CHAT MESSAGES ─────────────────────────────────────────────
create table chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  sender       text not null check (sender in ('client','admin')),
  sender_name  text not null default 'Зочин',
  message      text not null,
  created_at   timestamptz not null default now()
);

create index on chat_messages (session_id, created_at);

-- ── SETTINGS ──────────────────────────────────────────────────
create table settings (
  id          text primary key default 'main',
  referral_letter_url text,
  updated_at  timestamptz not null default now()
);

-- ── DYNAMIC CONTENT ───────────────────────────────────────────
create table content (
  id          text primary key,
  section     text not null, -- 'hero', 'about', 'rooms', etc.
  key         text not null, -- field name like 'title', 'description', 'image'
  lang        text not null check (lang in ('mn', 'en')),
  value       text, -- text content
  image_url   text, -- for image fields
  updated_at  timestamptz not null default now(),
  unique(section, key, lang)
);

-- ── REVIEWS ───────────────────────────────────────────────────
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  room_id     text not null,
  fname       text not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index on reviews (room_id, approved);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table bookings      enable row level security;
alter table chat_messages enable row level security;
alter table settings      enable row level security;
alter table content       enable row level security;
alter table reviews       enable row level security;

-- Apply workspace_roles_migration.sql after creating a fresh schema. It adds
-- role-scoped policies; leaving RLS without policies here is fail-closed.
