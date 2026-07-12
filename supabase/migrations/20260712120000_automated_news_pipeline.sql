create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  homepage_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources(id) on delete cascade,
  guid text,
  source_url text not null,
  title text not null,
  summary text,
  author text,
  published_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_items_source_guid_key unique (source_id, guid),
  constraint news_items_source_url_key unique (source_url)
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid references public.news_items(id) on delete set null,
  slug text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'published', 'rejected')),
  title text not null,
  excerpt text not null,
  body_markdown text not null,
  seo_title text not null,
  seo_description text not null,
  keywords text[] not null default '{}',
  language text not null default 'nl',
  hero_image_url text,
  hero_image_alt text,
  image_prompt text,
  source_links jsonb not null default '[]'::jsonb,
  generation_model text,
  generated_at timestamptz,
  published_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_posts_published_idx
  on public.news_posts (published_at desc)
  where status = 'published';

create table if not exists public.news_generation_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('ingest', 'generate', 'image', 'publish', 'cron')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_seen integer not null default 0,
  items_upserted integer not null default 0,
  posts_created integer not null default 0,
  error text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.news_sources enable row level security;
alter table public.news_items enable row level security;
alter table public.news_posts enable row level security;
alter table public.news_generation_runs enable row level security;

drop policy if exists "public select published news posts" on public.news_posts;
create policy "public select published news posts" on public.news_posts for select
  to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

revoke all on public.news_sources from anon, authenticated;
revoke all on public.news_items from anon, authenticated;
revoke all on public.news_generation_runs from anon, authenticated;

grant select on public.news_posts to anon, authenticated;

insert into public.news_sources (name, feed_url, homepage_url)
values
  ('OpenAI News', 'https://openai.com/news/rss.xml', 'https://openai.com/news/'),
  ('Anthropic News', 'https://www.anthropic.com/news/rss.xml', 'https://www.anthropic.com/news'),
  ('Google AI Blog', 'https://blog.google/technology/ai/rss/', 'https://blog.google/technology/ai/'),
  ('Mistral AI News', 'https://mistral.ai/news/rss.xml', 'https://mistral.ai/news/'),
  ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'https://huggingface.co/blog')
on conflict (feed_url) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read news images" on storage.objects;
create policy "public read news images" on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'news-images');

-- Optional production scheduling:
-- 1. Enable pg_cron and pg_net in the Supabase dashboard if unavailable.
-- 2. Store project_url and publishable_key in Vault as documented by Supabase.
-- 3. Run a daily cron that calls /functions/v1/news-generate. The function itself
--    enforces a 14-day cadence unless force=true is sent by an admin.
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule(
--   'fainl-news-generate-daily',
--   '19 7 * * *',
--   $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/news-generate',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
--     ),
--     body := '{"mode":"cron"}'::jsonb
--   );
--   $$
-- );
