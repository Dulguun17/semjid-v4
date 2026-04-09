# 🚀 Supabase Setup Guide — Complete Instructions

**Status**: Before deploying to production, you MUST complete these steps.

---

## 📋 Step 1: Run Database Migrations

Go to your **Supabase Dashboard** → **SQL Editor** → **Create New Query**

### 1a. Create Core Tables & Auth

Copy ALL of this and run in a new SQL Query:

```sql
-- ================================================================
--  Database Schema — REQUIRED FIRST
-- ================================================================

create extension if not exists "pgcrypto";

-- Drop old tables (clean slate)
drop table if exists chat_messages cascade;
drop table if exists bookings cascade;
drop table if exists contact_inquiries cascade;
drop table if exists reviews cascade;

-- BOOKINGS TABLE
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

-- CHAT MESSAGES TABLE
create table chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  sender       text not null check (sender in ('client','admin')),
  sender_name  text not null default 'Зочин',
  message      text not null,
  created_at   timestamptz not null default now()
);

create index on chat_messages (session_id, created_at);

-- SETTINGS TABLE (for global configuration)
create table settings (
  id          text primary key default 'main',
  referral_letter_url text,
  updated_at  timestamptz not null default now()
);

-- CONTENT TABLE (for dynamic website content)
create table content (
  id          text primary key,
  section     text not null,
  key         text not null,
  lang        text not null check (lang in ('mn', 'en')),
  value       text,
  image_url   text,
  updated_at  timestamptz not null default now(),
  unique(section, key, lang)
);

-- REVIEWS TABLE
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

-- ROOM BLOCKS TABLE (for blocking out dates)
create table if not exists room_blocks (
  id          uuid primary key default gen_random_uuid(),
  room_id     text not null,
  from_date   date not null,
  to_date     date not null,
  reason      text,
  created_at  timestamptz not null default now()
);

-- ENABLE ROW LEVEL SECURITY
alter table bookings      enable row level security;
alter table chat_messages enable row level security;
alter table settings      enable row level security;
alter table content       enable row level security;
alter table reviews       enable row level security;
alter table room_blocks   enable row level security;

-- ROW LEVEL SECURITY POLICIES
-- Bookings: public insert, authenticated read/update
drop policy if exists "Public insert bookings" on bookings;
create policy "Public insert bookings" on bookings for insert with check (true);
drop policy if exists "Auth read bookings" on bookings;
create policy "Auth read bookings" on bookings for select using (auth.role() = 'authenticated');
drop policy if exists "Auth update bookings" on bookings;
create policy "Auth update bookings" on bookings for update using (auth.role() = 'authenticated');

-- Chat: public insert+read
drop policy if exists "Public insert chat" on chat_messages;
create policy "Public insert chat" on chat_messages for insert with check (true);
drop policy if exists "Public read chat" on chat_messages;
create policy "Public read chat" on chat_messages for select using (true);

-- Settings: public read, authenticated update
drop policy if exists "Public read settings" on settings;
create policy "Public read settings" on settings for select using (true);
drop policy if exists "Auth update settings" on settings;
create policy "Auth update settings" on settings for update using (auth.role() = 'authenticated');

-- Content: public read, authenticated update
drop policy if exists "Public read content" on content;
create policy "Public read content" on content for select using (true);
drop policy if exists "Auth update content" on content;
create policy "Auth update content" on content for update using (auth.role() = 'authenticated');

-- Reviews: public insert+read, authenticated delete
drop policy if exists "Public insert reviews" on reviews;
create policy "Public insert reviews" on reviews for insert with check (true);
drop policy if exists "Public read reviews" on reviews;
create policy "Public read reviews" on reviews for select using (true);

-- Room Blocks: authenticated only
drop policy if exists "Auth read blocks" on room_blocks;
create policy "Auth read blocks" on room_blocks for select using (auth.role() = 'authenticated');
drop policy if exists "Auth insert blocks" on room_blocks;
create policy "Auth insert blocks" on room_blocks for insert with check (auth.role() = 'authenticated');
drop policy if exists "Auth delete blocks" on room_blocks;
create policy "Auth delete blocks" on room_blocks for delete using (auth.role() = 'authenticated');
```

✅ Click **Run**


### 1b. Create ROOMS Table

Create another new SQL Query and run:

```sql
-- Create rooms table for dynamic pricing
create table if not exists rooms (
  id          text primary key,
  adult1      integer,
  adult2      integer,
  child02     integer,
  child37a    integer,
  child37b    integer,
  child812a   integer,
  child812b   integer,
  img         text,
  updated_at  timestamptz not null default now()
);

alter table rooms enable row level security;

-- Only authenticated users can modify rooms
drop policy if exists "Auth read rooms" on rooms;
create policy "Auth read rooms"
  on rooms for select using (auth.role() = 'authenticated');

drop policy if exists "Auth update rooms" on rooms;
create policy "Auth update rooms"
  on rooms for update using (auth.role() = 'authenticated');

drop policy if exists "Auth insert rooms" on rooms;
create policy "Auth insert rooms"
  on rooms for insert with check (auth.role() = 'authenticated');

-- Insert your rooms (optional - can be done via admin panel later)
INSERT INTO rooms (id, adult1, adult2, child02, child37a, child37b, child812a, child812b) VALUES
('luxury', NULL, 113000, 43000, NULL, NULL, NULL, NULL),
('halflux', NULL, 93000, 43000, NULL, NULL, NULL, NULL),
('superlux', NULL, 135000, 43000, NULL, NULL, NULL, NULL),
('fullux', NULL, 150000, 43000, NULL, NULL, NULL, NULL),
('std2', NULL, 68000, 43000, NULL, NULL, NULL, NULL),
('std4', NULL, 68000, 43000, NULL, NULL, NULL, NULL),
('std5', NULL, 75000, 43000, NULL, NULL, NULL, NULL),
('std6', NULL, 75000, 43000, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET adult2 = EXCLUDED.adult2;
```

✅ Click **Run**

---

## 📦 Step 2: Create Storage Buckets

In Supabase Dashboard → **Storage**

### 2a. Create `resort-images` Bucket
- Click **Create bucket**
- Name: `resort-images`
- Set to **Public**
- Click **Create**

### 2b. Create `ilgeeh-bichig` Bucket
- Click **Create bucket**
- Name: `ilgeeh-bichig` 
- Set to **Public**
- Click **Create**

✅ Both buckets created

---

## 👤 Step 3: Create Admin User

In Supabase Dashboard → **Authentication** → **Users**

1. Click **Add user**
2. **Email**: `otgonbatzolboo@gmail.com` (or your admin email)
3. **Password**: (auto-generate or set a strong one)
4. Click **Create user**

✅ Admin account created. Now you can login to `/admin/login`

---

## 🔐 Step 4: Create Service Role for API Routes

This is automatically created by Supabase. Just verify:

**Settings** → **API** → **Project API keys**
- Copy your **Service role secret** (for `SUPABASE_SERVICE_ROLE_KEY`)
- Copy your **anon public** key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

✅ Already in `.env.local`

---

## 💾 Step 5: Initial Content Migration (Optional)

If you want dynamic content from the start, run this in a new SQL Query:

```sql
-- Heroes section initial content
INSERT INTO content (id, section, key, lang, value) VALUES
('hero-badge-mn', 'hero', 'badge', 'mn', 'Монголын анхны хувийн рашаан сувилал · 2003 оноос'),
('hero-badge-en', 'hero', 'badge', 'en', 'Mongolia''s First Private Mineral Resort · Est. 2003'),
('about-title-mn', 'about', 'title', 'mn', 'Сэмжид Хужирт Рашаан Сувилал'),
('about-title-en', 'about', 'title', 'en', 'Semjid Khujirt Wellness Resort')
ON CONFLICT (id) DO NOTHING;
```

(Optional — the website has hardcoded defaults if content table is empty)

---

## ✅ Verification Checklist

- [ ] SQL schema created (tables: bookings, chats, content, reviews, rooms, settings, room_blocks)
- [ ] Storage buckets created (`resort-images`, `ilgeeh-bichig`)
- [ ] Admin user created (email: `otgonbatzolboo@gmail.com`)
- [ ] API keys in `.env.local`
- [ ] Can login to `/admin/login`

---

## 🚀 Next Steps After Setup

1. **Upload Referral Letter** → Go to `/admin/settings` → Upload PDF
2. **Upload Room Images** → Go to `/admin/rooms-management` → Add images
3. **Update Content** → Go to `/admin/content` → Edit sections
4. **Test Booking** → Create a test booking at `/booking`
5. **Run Production Build** → `npm run build`
6. **Deploy to Vercel** → Push to GitHub & connect to Vercel

---

**Time to complete**: ~5 minutes

**Support**: If you get errors, check Supabase error logs or ask!
