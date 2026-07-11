create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

-- Anonymous visitors submit the public contact form but must never read
-- other people's submissions; there is intentionally no select policy.
create policy "anyone can submit contact form"
on public.contact_submissions
for insert
to anon, authenticated
with check (true);

grant insert on public.contact_submissions to anon, authenticated;
