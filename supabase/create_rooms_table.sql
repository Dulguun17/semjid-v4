-- ================================================================
--  Create ROOMS table for dynamic pricing and images
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ================================================================

-- Drop existing table if needed
-- drop table if exists rooms cascade;

-- Create rooms table
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

-- Enable RLS
alter table rooms enable row level security;

-- RLS Policies
-- Allow authenticated users to read and update rooms
drop policy if exists "Auth read rooms" on rooms;
create policy "Auth read rooms"
  on rooms for select using (auth.role() = 'authenticated');

drop policy if exists "Auth update rooms" on rooms;
create policy "Auth update rooms"
  on rooms for update using (auth.role() = 'authenticated');

drop policy if exists "Auth insert rooms" on rooms;
create policy "Auth insert rooms"
  on rooms for insert with check (auth.role() = 'authenticated');

-- Insert initial rooms data (if starting fresh)
-- Uncomment below to auto-populate with your room IDs
/*
INSERT INTO rooms (id, adult1, adult2, child02, img) VALUES
('luxury', NULL, 113000, 43000, '/images/image3.jpeg'),
('halflux', NULL, 93000, 43000, '/images/image4.jpeg'),
('superlux', NULL, 135000, 43000, '/images/image4.jpeg'),
('fullux', NULL, 150000, 43000, '/images/image3.jpeg'),
('std2', NULL, 68000, 43000, '/images/image5.jpeg'),
('std4', NULL, 68000, 43000, '/images/image6.jpeg'),
('std5', NULL, 75000, 43000, '/images/image6.jpeg'),
('summer', NULL, 53000, 43000, '/images/image1.jpg')
ON CONFLICT (id) DO NOTHING;
*/
