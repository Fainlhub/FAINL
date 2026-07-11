-- Core platform tables the frontend already depends on. This project was
-- re-created (previous ref omysorbuzowyabcprpgm) and only carried the RPC
-- migrations; the tables themselves were never provisioned here.

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  credits_remaining integer not null default 0,
  total_turns_used integer not null default 0,
  is_lifetime boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "owner select" on public.user_profiles for select
  to authenticated using ((select auth.uid()) = id);

-- The client bootstraps a zero-value row on first login (PGRST116 path).
-- The value constraints stop a user from inserting themselves credits;
-- all credit mutations go through SECURITY DEFINER RPCs.
create policy "owner insert zero profile" on public.user_profiles for insert
  to authenticated with check (
    (select auth.uid()) = id
    and credits_remaining = 0
    and total_turns_used = 0
    and is_lifetime = false
  );

create policy "owner delete" on public.user_profiles for delete
  to authenticated using ((select auth.uid()) = id);

grant select, insert, delete on public.user_profiles to authenticated;

-- Thumbs up/down on completed sessions (CompletionActions.tsx). Write-only
-- from the client, may come from anonymous visitors.
create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  positive boolean not null,
  comment text,
  created_at timestamptz not null default now()
);

alter table public.session_feedback enable row level security;

create policy "anyone can submit feedback" on public.session_feedback for insert
  to anon, authenticated with check (true);

grant insert on public.session_feedback to anon, authenticated;

-- Newsletter banner signups (App.tsx).
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "anyone can subscribe" on public.newsletter_subscribers for insert
  to anon, authenticated with check (true);

grant insert on public.newsletter_subscribers to anon, authenticated;
