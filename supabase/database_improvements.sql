-- ================================================================
-- Database Improvements & Performance Optimizations
-- Run this in: Supabase → SQL Editor → New Query → Run
-- ================================================================

-- ── ADD INDEXES FOR PERFORMANCE ─────────────────────────────────
-- Improve query performance on frequently filtered columns

create index if not exists idx_bookings_email on bookings(email);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_room_dates on bookings(room_id, check_in, check_out);
create index if not exists idx_bookings_created_at on bookings(created_at desc);

create index if not exists idx_chat_messages_session_created on chat_messages(session_id, created_at);
create index if not exists idx_chat_messages_sender on chat_messages(sender);

create index if not exists idx_reviews_room_approved on reviews(room_id, approved);
create index if not exists idx_reviews_created_at on reviews(created_at desc);

-- ── ADD PAYMENT TRACKING TABLE ──────────────────────────────────
-- Track payment status and history

create table if not exists payment_history (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  amount      integer not null,
  currency    text default 'MNT',
  method      text not null check (method in ('cash', 'bank', 'qpay', 'card')),
  status      text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text unique,
  qpay_invoice_id text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_payment_history_booking on payment_history(booking_id);
create index if not exists idx_payment_history_status on payment_history(status);
create index if not exists idx_payment_history_created on payment_history(created_at desc);

-- RLS for payment history
alter table payment_history enable row level security;
create policy "Auth read payment_history" on payment_history for select using (auth.role() = 'authenticated');
create policy "Auth insert payment_history" on payment_history for insert with check (auth.role() = 'authenticated');
create policy "Auth update payment_history" on payment_history for update using (auth.role() = 'authenticated');

-- ── ADD ADMIN RESPONSE TRACKING ─────────────────────────────────
-- Better track chat conversations and admin responses

create table if not exists admin_responses (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references chat_messages(id) on delete cascade,
  session_id  text not null,
  response_text text not null,
  is_ai_generated boolean default false,
  ai_model    text,
  response_time_ms integer,
  created_at  timestamptz not null default now()
);

create index if not exists idx_admin_responses_session on admin_responses(session_id);
create index if not exists idx_admin_responses_ai on admin_responses(is_ai_generated);

alter table admin_responses enable row level security;
create policy "Auth read admin_responses" on admin_responses for select using (auth.role() = 'authenticated');
create policy "Auth insert admin_responses" on admin_responses for insert with check (auth.role() = 'authenticated');

-- ── ENHANCE BOOKINGS TABLE ─────────────────────────────────────

-- Add payment tracking columns
alter table bookings add column if not exists payment_status text default 'pending' check (payment_status in ('pending', 'confirmed', 'failed'));
alter table bookings add column if not exists payment_method_details jsonb;
alter table bookings add column if not exists cancellation_reason text;
alter table bookings add column if not exists cancelled_at timestamptz;

-- Add guest comfort/accessibility info
alter table bookings add column if not exists accessibility_needs text;
alter table bookings add column if not exists dietary_restrictions text[];
alter table bookings add column if not exists special_requests text;

create index if not exists idx_bookings_payment_status on bookings(payment_status);

-- ── AUDIT TABLE FOR ALL ADMIN CHANGES ──────────────────────────

create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null,
  admin_email text not null,
  action      text not null, -- 'create', 'update', 'delete'
  table_name  text not null,
  record_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_log_admin on audit_log(admin_id);
create index if not exists idx_audit_log_action on audit_log(action);
create index if not exists idx_audit_log_created on audit_log(created_at desc);

alter table audit_log enable row level security;
create policy "Auth read audit_log" on audit_log for select using (auth.role() = 'authenticated');
create policy "Auth insert audit_log" on audit_log for insert with check (auth.role() = 'authenticated');

-- ── ROOM INVENTORY MANAGEMENT ──────────────────────────────────

create table if not exists room_availability (
  id          uuid primary key default gen_random_uuid(),
  room_id     text not null,
  date        date not null,
  available   integer default 1,
  reason      text, -- 'maintenance', 'blocked', 'restricted', etc.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(room_id, date)
);

create index if not exists idx_room_availability_room_date on room_availability(room_id, date);

alter table room_availability enable row level security;
create policy "Auth read room_availability" on room_availability for select using (auth.role() = 'authenticated');
create policy "Auth manage room_availability" on room_availability for insert, update with check (auth.role() = 'authenticated');

-- ── PERFORMANCE VIEWS ──────────────────────────────────────────

-- Booking summary view
create or replace view bookings_summary as
select 
  status,
  count(*) as total_bookings,
  sum(total) as total_revenue,
  sum(guests) as total_guests,
  min(created_at) as first_booking,
  max(created_at) as last_booking
from bookings
where status != 'cancelled'
group by status;

-- Revenue by period
create or replace view revenue_by_month as
select 
  date_trunc('month', created_at)::date as month,
  sum(total) as revenue,
  count(*) as booking_count,
  avg(total) as avg_booking_value
from bookings
where status = 'confirmed'
group by date_trunc('month', created_at)
order by month desc;

-- Guest statistics
create or replace view guest_statistics as
select 
  sum(guests) as total_guests,
  count(distinct email) as unique_guests,
  avg(guests) as avg_guests_per_booking,
  max(guests) as max_guests_booking
from bookings
where status != 'cancelled';

-- ── VACUUM & ANALYZE FOR PERFORMANCE ───────────────────────────
-- Clean up and optimize all tables
vacuum analyze bookings;
vacuum analyze chat_messages;
vacuum analyze reviews;
vacuum analyze payment_history;

-- ================================================================
-- All improvements complete! Your database is now optimized.
-- ================================================================
