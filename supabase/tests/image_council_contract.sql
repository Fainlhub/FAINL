-- Run after migrations. Every failed invariant aborts the test transaction.
begin;

do $$
declare
  v_count integer;
  v_public boolean;
  v_rls_count integer;
begin
  select count(*)
    into v_count
    from public.image_model_catalog
   where model_role = 'generator'
     and enabled
     and not kill_switch
     and commercial_use_allowed
     and license_policy_accepted;
  if v_count <> 5 then
    raise exception 'expected 5 operational image generators, found %', v_count;
  end if;

  select count(*)
    into v_count
    from public.image_model_catalog
   where model_role = 'evaluator'
     and enabled
     and not kill_switch
     and commercial_use_allowed
     and license_policy_accepted;
  if v_count <> 3 then
    raise exception 'expected 3 operational vision evaluators, found %', v_count;
  end if;

  select count(*)
    into v_count
    from public.image_model_catalog
   where model_role = 'final_editor'
     and provider_model = 'gemini-3-pro-image'
     and enabled
     and not kill_switch;
  if v_count <> 1 then
    raise exception 'expected the Gemini 3 Pro final editor';
  end if;

  select public
    into v_public
    from storage.buckets
   where id = 'image-council';
  if not found or v_public then
    raise exception 'image-council bucket must exist and remain private';
  end if;

  select count(*)
    into v_rls_count
    from pg_class
   where oid in (
     'public.image_model_catalog'::regclass,
     'public.image_projects'::regclass,
     'public.image_runs'::regclass,
     'public.image_branches'::regclass,
     'public.image_artifacts'::regclass,
     'public.image_evaluations'::regclass,
     'public.image_rankings'::regclass,
     'public.image_events'::regclass,
     'public.credit_reservations'::regclass
   )
     and relrowsecurity;
  if v_rls_count <> 9 then
    raise exception 'all Beeldraad tables must have RLS enabled';
  end if;

  if has_table_privilege('authenticated', 'public.image_artifacts', 'INSERT')
     or has_table_privilege('authenticated', 'public.image_artifacts', 'UPDATE')
     or has_table_privilege('authenticated', 'public.image_artifacts', 'DELETE') then
    raise exception 'authenticated clients must not mutate image artifacts';
  end if;

  if has_table_privilege('authenticated', 'public.credit_reservations', 'INSERT')
     or has_table_privilege('authenticated', 'public.credit_reservations', 'UPDATE')
     or has_table_privilege('authenticated', 'public.credit_reservations', 'DELETE') then
    raise exception 'authenticated clients must not mutate credit reservations';
  end if;

  if to_regprocedure('public.claim_weekly_credits(uuid,integer)') is not null then
    raise exception 'caller-controlled weekly-credit function still exists';
  end if;

  if to_regprocedure('public.claim_weekly_credits(uuid)') is null then
    raise exception 'fixed weekly-credit function is missing';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.start_image_council(text,text,text,text,uuid,text,text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated users cannot start Beeldraad';
  end if;

  if has_function_privilege(
    'anon',
    'public.start_image_council(text,text,text,text,uuid,text,text)',
    'EXECUTE'
  ) then
    raise exception 'anonymous users must not start Beeldraad';
  end if;

  if not exists (
    select 1 from pgmq.meta where queue_name = 'image_council_steps'
  ) then
    raise exception 'image_council_steps queue is missing';
  end if;

  if not exists (
    select 1 from cron.job where jobname = 'image-council-recovery'
  ) then
    raise exception 'image-council-recovery cron job is missing';
  end if;
end;
$$;

rollback;
