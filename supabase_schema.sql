-- Create Profiles Table (Idempotent)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Create Transactions Table (Idempotent)
create table if not exists public.transactions (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  description text,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  date timestamptz not null default now(),
  status text default 'completed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Categories Table (Idempotent)
create table if not exists public.categories (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  icon text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.categories enable row level security;

-- Policies: DROP IF EXISTS then CREATE to ensure idempotency and latest definition

-- Transactions Policies
drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions" on public.transactions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own transactions" on public.transactions;
create policy "Users can insert their own transactions" on public.transactions for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions" on public.transactions for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- Categories Policies
drop policy if exists "Users can view their own categories" on public.categories;
create policy "Users can view their own categories" on public.categories for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own categories" on public.categories;
create policy "Users can insert their own categories" on public.categories for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own categories" on public.categories;
create policy "Users can update their own categories" on public.categories for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own categories" on public.categories;
create policy "Users can delete their own categories" on public.categories for delete using (auth.uid() = user_id);
