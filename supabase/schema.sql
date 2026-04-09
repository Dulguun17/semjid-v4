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

-- Bookings: public insert, auth read/update
create policy "Public insert bookings"   on bookings for insert with check (true);
create policy "Auth read bookings"       on bookings for select using (auth.role() = 'authenticated');
create policy "Auth update bookings"     on bookings for update using (auth.role() = 'authenticated');

-- Chat: public insert+read, admin can insert as admin
create policy "Public insert chat"       on chat_messages for insert with check (true);
create policy "Public read own chat"     on chat_messages for select using (true);

-- Settings: public read, auth update/insert
create policy "Public read settings"      on settings for select using (true);
create policy "Auth insert settings"      on settings for insert with check (auth.role() = 'authenticated');
create policy "Auth update settings"      on settings for update using (auth.role() = 'authenticated');

-- Content: auth read/update/insert
create policy "Auth read content"         on content for select using (auth.role() = 'authenticated');
create policy "Auth insert content"       on content for insert with check (auth.role() = 'authenticated');
create policy "Auth update content"       on content for update using (auth.role() = 'authenticated');

-- Reviews: public insert, auth read/update
create policy "Public insert reviews"     on reviews for insert with check (true);
create policy "Auth read reviews"         on reviews for select using (auth.role() = 'authenticated');
create policy "Auth update reviews"       on reviews for update using (auth.role() = 'authenticated');
