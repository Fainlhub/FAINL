-- Chat module: cloud-persisted threads, messages, projects, and mission-session history.

create table public.chat_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.chat_projects(id) on delete set null,
  title text not null default 'Nieuwe chat',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  -- Denormalized owner: lets RLS check auth.uid() without joining chat_threads.
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tier text not null default 'instant'
    check (tier in ('instant', 'moderate', 'complex', 'max', 'ultra')),
  -- Thinking detail: nodeTraces, reviews, creditsSpent, byok, durationMs.
  -- Can be 50-150KB per consensus turn: never select it in list queries.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Cloud history for /mission sessions (full SessionState in data).
create table public.council_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  synthesis text not null default '',
  data jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sidebar thread list: pinned first, newest activity first.
create index chat_threads_user_updated_idx
  on public.chat_threads (user_id, pinned desc, updated_at desc);
create index chat_threads_project_idx
  on public.chat_threads (project_id) where project_id is not null;
create index chat_messages_thread_created_idx
  on public.chat_messages (thread_id, created_at);
create index chat_projects_user_idx
  on public.chat_projects (user_id);
create index council_sessions_user_created_idx
  on public.council_sessions (user_id, created_at desc);

-- Bump the thread's updated_at when a message arrives so the sidebar reorders.
create or replace function public.touch_chat_thread()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.chat_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.touch_chat_thread();

-- RLS: owner-only on every table, all four verbs. No anon grants at all —
-- anonymous chat is ephemeral by design and never touches these tables.

alter table public.chat_projects enable row level security;

create policy "owner select" on public.chat_projects for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "owner insert" on public.chat_projects for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "owner update" on public.chat_projects for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner delete" on public.chat_projects for delete
  to authenticated using ((select auth.uid()) = user_id);

alter table public.chat_threads enable row level security;

create policy "owner select" on public.chat_threads for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "owner insert" on public.chat_threads for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "owner update" on public.chat_threads for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner delete" on public.chat_threads for delete
  to authenticated using ((select auth.uid()) = user_id);

alter table public.chat_messages enable row level security;

create policy "owner select" on public.chat_messages for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "owner insert" on public.chat_messages for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "owner update" on public.chat_messages for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner delete" on public.chat_messages for delete
  to authenticated using ((select auth.uid()) = user_id);

alter table public.council_sessions enable row level security;

create policy "owner select" on public.council_sessions for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "owner insert" on public.council_sessions for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "owner update" on public.council_sessions for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner delete" on public.council_sessions for delete
  to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.chat_projects to authenticated;
grant select, insert, update, delete on public.chat_threads to authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
grant select, insert, update, delete on public.council_sessions to authenticated;
