-- Selahe — Supabase Postgres schema
-- Run this in Supabase: Project → SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ============ ACTIONS ============
create table public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,                         -- null until first card is committed
  color text,                         -- fixed accent color, assigned at creation, never changes
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index actions_user_id_idx on public.actions(user_id);

-- ============ CARD VERSIONS ============
create table public.card_versions (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  start_time text,                    -- e.g. "07:00 pm"
  end_time text,
  location text,
  duration_minutes integer,
  days_of_week integer[] not null default '{}',  -- 0=Sun ... 6=Sat
  why_text text,
  is_active boolean not null default true,
  superseded_by_id uuid references public.card_versions(id),
  created_at timestamptz not null default now()
);
create index card_versions_action_id_idx on public.card_versions(action_id);
create unique index one_active_version_per_action
  on public.card_versions(action_id) where (is_active);

-- ============ PUNCHES ============
create table public.punches (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  card_version_id uuid not null references public.card_versions(id),
  punched_at timestamptz not null default now(),
  scheduled_date date not null         -- computed server-side, never by the model
);
create index punches_action_id_idx on public.punches(action_id);
create index punches_scheduled_date_idx on public.punches(scheduled_date);

-- ============ MESSAGES (the audit log / source of truth) ============
create type message_role as enum ('user','assistant','system');
create type message_type as enum ('dialogue','card_created','card_updated','auto_log','saved_notification');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  role message_role not null,
  content text not null,
  message_type message_type not null default 'dialogue',
  card_version_id uuid references public.card_versions(id),
  punch_id uuid references public.punches(id),
  created_at timestamptz not null default now()
);
create index messages_action_id_idx on public.messages(action_id, created_at);

-- ============ BYOK: per-user API key storage ============
-- encrypted_key is encrypted app-side (AES-GCM) before insert — never store plaintext.
create table public.user_api_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'anthropic',
  encrypted_key text,
  use_own_key boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table public.actions enable row level security;
alter table public.card_versions enable row level security;
alter table public.punches enable row level security;
alter table public.messages enable row level security;
alter table public.user_api_keys enable row level security;

create policy "own actions select" on public.actions for select using (auth.uid() = user_id);
create policy "own actions insert" on public.actions for insert with check (auth.uid() = user_id);
create policy "own actions update" on public.actions for update using (auth.uid() = user_id);
create policy "own actions delete" on public.actions for delete using (auth.uid() = user_id);

create policy "own card_versions select" on public.card_versions for select using (
  exists (select 1 from public.actions a where a.id = card_versions.action_id and a.user_id = auth.uid())
);
create policy "own card_versions insert" on public.card_versions for insert with check (
  exists (select 1 from public.actions a where a.id = card_versions.action_id and a.user_id = auth.uid())
);
create policy "own card_versions update" on public.card_versions for update using (
  exists (select 1 from public.actions a where a.id = card_versions.action_id and a.user_id = auth.uid())
);

create policy "own punches select" on public.punches for select using (
  exists (select 1 from public.actions a where a.id = punches.action_id and a.user_id = auth.uid())
);
create policy "own punches insert" on public.punches for insert with check (
  exists (select 1 from public.actions a where a.id = punches.action_id and a.user_id = auth.uid())
);

create policy "own messages select" on public.messages for select using (
  exists (select 1 from public.actions a where a.id = messages.action_id and a.user_id = auth.uid())
);
create policy "own messages insert" on public.messages for insert with check (
  exists (select 1 from public.actions a where a.id = messages.action_id and a.user_id = auth.uid())
);

create policy "own api key all" on public.user_api_keys for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
