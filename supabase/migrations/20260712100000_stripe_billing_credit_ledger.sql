alter table public.user_profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_plan text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists ad_free_lifetime boolean not null default false;

create unique index if not exists user_profiles_stripe_customer_id_key
  on public.user_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists user_profiles_stripe_subscription_id_key
  on public.user_profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  stripe_event_id text,
  stripe_session_id text,
  stripe_invoice_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_ledger_delta_not_zero check (delta <> 0)
);

create unique index if not exists credit_ledger_stripe_event_id_key
  on public.credit_ledger (stripe_event_id)
  where stripe_event_id is not null;

create unique index if not exists credit_ledger_stripe_session_id_key
  on public.credit_ledger (stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists credit_ledger_stripe_invoice_id_key
  on public.credit_ledger (stripe_invoice_id)
  where stripe_invoice_id is not null;

alter table public.credit_ledger enable row level security;

create policy "owner select credit ledger" on public.credit_ledger for select
  to authenticated using ((select auth.uid()) = user_id);

grant select on public.credit_ledger to authenticated;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  attempts integer not null default 1,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events
  add column if not exists status text not null default 'processing',
  add column if not exists attempts integer not null default 1,
  add column if not exists error text,
  add column if not exists received_at timestamptz not null default now(),
  add column if not exists processed_at timestamptz;

alter table public.stripe_webhook_events enable row level security;

revoke all on public.stripe_webhook_events from anon, authenticated;

create or replace function public.record_stripe_credit(
  p_user_id uuid,
  p_delta integer,
  p_reason text,
  p_stripe_event_id text default null,
  p_stripe_session_id text default null,
  p_stripe_invoice_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_id uuid;
  v_credits integer;
  v_turns integer;
  v_lifetime boolean;
begin
  if p_user_id is null or p_delta is null or p_delta = 0 or p_reason is null then
    return jsonb_build_object('success', false, 'reason', 'invalid_input');
  end if;

  insert into public.user_profiles (id)
  values (p_user_id)
  on conflict (id) do nothing;

  insert into public.credit_ledger (
    user_id,
    delta,
    reason,
    stripe_event_id,
    stripe_session_id,
    stripe_invoice_id,
    metadata
  )
  values (
    p_user_id,
    p_delta,
    p_reason,
    p_stripe_event_id,
    p_stripe_session_id,
    p_stripe_invoice_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    select credits_remaining, total_turns_used, is_lifetime
      into v_credits, v_turns, v_lifetime
      from public.user_profiles
     where id = p_user_id;

    return jsonb_build_object(
      'success', true,
      'applied', false,
      'credits_remaining', v_credits,
      'total_turns_used', v_turns,
      'is_lifetime', v_lifetime
    );
  end if;

  update public.user_profiles
     set credits_remaining = greatest(credits_remaining + p_delta, 0),
         updated_at = now()
   where id = p_user_id
   returning credits_remaining, total_turns_used, is_lifetime
      into v_credits, v_turns, v_lifetime;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'profile_not_found');
  end if;

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'credits_remaining', v_credits,
    'total_turns_used', v_turns,
    'is_lifetime', v_lifetime
  );
end;
$$;

revoke all on function public.record_stripe_credit(uuid, integer, text, text, text, text, jsonb) from public;
revoke execute on function public.record_stripe_credit(uuid, integer, text, text, text, text, jsonb) from anon, authenticated;
grant execute on function public.record_stripe_credit(uuid, integer, text, text, text, text, jsonb) to service_role;
