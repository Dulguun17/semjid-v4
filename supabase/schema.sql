-- ================================================================
--  Сэмжид Хүжирт — Complete Supabase Schema v2
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ================================================================

create extension if not exists "pgcrypto";

-- ── DROP OLD TABLES (clean slate) ─────────────────────────────
drop table if exists chat_messages cascade;
drop table if exists bookings cascade;
drop table if exists contact_inquiries cascade;

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
  treatments  text[] default '{}',
  notes       text,
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

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table bookings      enable row level security;
alter table chat_messages enable row level security;

-- Bookings: public insert, auth read/update
create policy "Public insert bookings"   on bookings for insert with check (true);
create policy "Auth read bookings"       on bookings for select using (auth.role() = 'authenticated');
create policy "Auth update bookings"     on bookings for update using (auth.role() = 'authenticated');

-- Chat: public insert+read, admin can insert as admin
create policy "Public insert chat"       on chat_messages for insert with check (true);
create policy "Public read own chat"     on chat_messages for select using (true);
