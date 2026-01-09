-- Telemetry and Feedback Tables
-- Run this in your Supabase SQL Editor

-- 1. Create Feedback Table
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id), -- nullable, for logged in users
  anonymous_id text, -- for guest users
  type text check (type in ('bug', 'feature', 'like', 'other')),
  message text not null,
  contact_email text,
  metadata jsonb default '{}'::jsonb
);

-- 2. Create Analytics Events Table
create table if not exists analytics_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id), -- nullable
  anonymous_id text, -- required for guests
  event_name text not null,
  properties jsonb default '{}'::jsonb
);

-- 3. Enable RLS
alter table feedback enable row level security;
alter table analytics_events enable row level security;

-- 4. Policies (Allow Insert Only for Public/Anon)
create policy "Enable insert for anonymous users" on feedback 
for insert to anon, authenticated 
with check (true);

create policy "Enable insert for anonymous users" on analytics_events 
for insert to anon, authenticated 
with check (true);

-- 5. Helper View for Dashboard (Optional, for your own use later)
-- create view daily_active_users as 
-- select date_trunc('day', created_at) as day, count(distinct anonymous_id) as dau 
-- from analytics_events where event_name = 'app_opened' group by 1;
