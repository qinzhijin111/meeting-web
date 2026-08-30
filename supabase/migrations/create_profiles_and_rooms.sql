
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;

create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can view their own rooms"
on public.rooms
for select
using (auth.uid() = host_user_id);

create policy "Users can create their own rooms"
on public.rooms
for insert
with check (auth.uid() = host_user_id);