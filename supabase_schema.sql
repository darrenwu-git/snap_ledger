-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Create Transactions Table
create table public.transactions (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  description text,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  date timestamptz not null default now(),
  status text default 'completed',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Create policies
create policy "Users can view their own transactions"
on public.transactions for select
using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
on public.transactions for insert
with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
on public.transactions for update
using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
on public.transactions for delete
using (auth.uid() = user_id);
