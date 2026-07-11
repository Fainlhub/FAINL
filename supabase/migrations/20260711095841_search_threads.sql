-- Sidebar search across thread titles AND message content. SECURITY INVOKER:
-- RLS on both tables still applies, so results are always caller-owned.
-- Plain ilike is fine at current volumes; pg_trgm is the follow-up if slow.

create or replace function public.search_threads(p_query text)
returns table (thread_id uuid, title text, snippet text, updated_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select t.id, t.title, coalesce(left(m.content, 120), ''), t.updated_at
  from chat_threads t
  left join lateral (
    select content
    from chat_messages m
    where m.thread_id = t.id
      and m.content ilike '%' || p_query || '%'
    order by m.created_at desc
    limit 1
  ) m on true
  where t.user_id = (select auth.uid())
    and (t.title ilike '%' || p_query || '%' or m.content is not null)
  order by t.updated_at desc
  limit 20
$$;

REVOKE ALL ON FUNCTION public.search_threads(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_threads(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_threads(text) TO authenticated;
