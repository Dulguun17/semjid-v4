-- ================================================================
--  Create ROOMS table for dynamic pricing and images
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ================================================================

-- Drop existing table if needed
-- drop table if exists rooms cascade;

-- Create rooms table
create table if not exists rooms (
  id          text primary key,
  name_mn     text not null,
  name_en     text not null,
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

-- Workspace access policies are installed by workspace_roles_migration.sql.
-- Remove the legacy broad policies if this setup script is re-run.
drop policy if exists "Auth read rooms" on rooms;
drop policy if exists "Auth update rooms" on rooms;
drop policy if exists "Auth insert rooms" on rooms;

-- Insert initial rooms data (if starting fresh)
-- Uncomment below to auto-populate with your room IDs
/*
INSERT INTO rooms (id, name_mn, name_en, adult1, adult2, child02, img) VALUES
('luxury', 'Люкс өрөө', 'Luxury Room', NULL, 113000, 43000, '/images/image3.jpeg'),
('halflux', 'Хагас Люкс өрөө', 'Half-Luxury Room', NULL, 93000, 43000, '/images/image4.jpeg'),
('superlux', 'Супер Люкс өрөө', 'Super Lux Room', NULL, 135000, 43000, '/images/image4.jpeg'),
('fullux', 'Фулл Люкс өрөө', 'Full Lux Room', NULL, 150000, 43000, '/images/image3.jpeg'),
('std2', '2 Ортой Стандарт өрөө', '2-Bed Standard Room', 88000, NULL, 43000, '/images/image5.jpeg'),
('std4', '4 Ортой Стандарт өрөө', '4-Bed Standard Room', 83000, 88000, 43000, '/images/image6.jpeg'),
('std5', '5 Ортой Стандарт өрөө', '5-Bed Standard Room', 83000, NULL, 43000, '/images/image6.jpeg'),
('summer', 'Зуны байр', 'Summer Cottage', 78000, NULL, 43000, '/images/image1.jpg')
ON CONFLICT (id) DO NOTHING;
*/
