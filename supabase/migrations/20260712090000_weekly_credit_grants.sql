-- Weekly free credit grants for authenticated users.
-- Claimed lazily from the app on login/profile refresh. This avoids requiring
-- a scheduler while still ensuring each user receives the allowance once per
-- calendar week.

alter table public.user_profiles
  add column if not exists weekly_credits_granted_at date;

create or replace function public.claim_weekly_credits(
  p_user_id uuid,
  p_amount integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_week date := date_trunc('week', now())::date;
  v_last_grant date;
  v_credits integer;
  v_turns integer;
  v_lifetime boolean;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > 50 then
    return jsonb_build_object('success', false, 'reason', 'invalid_amount');
  end if;

  select credits_remaining, total_turns_used, is_lifetime, weekly_credits_granted_at
    into v_credits, v_turns, v_lifetime, v_last_grant
    from public.user_profiles
   where id = p_user_id
     for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'user_not_found');
  end if;

  if v_last_grant is not null and v_last_grant >= v_current_week then
    return jsonb_build_object(
      'success', true,
      'granted', false,
      'credits_remaining', v_credits,
      'total_turns_used', v_turns,
      'is_lifetime', v_lifetime
    );
  end if;

  update public.user_profiles
     set credits_remaining = credits_remaining + p_amount,
         weekly_credits_granted_at = v_current_week,
         updated_at = now()
   where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'granted', true,
    'amount', p_amount,
    'credits_remaining', v_credits + p_amount,
    'total_turns_used', v_turns,
    'is_lifetime', v_lifetime
  );
end;
$$;

revoke all on function public.claim_weekly_credits(uuid, integer) from public;
revoke execute on function public.claim_weekly_credits(uuid, integer) from anon;
grant execute on function public.claim_weekly_credits(uuid, integer) to authenticated;
