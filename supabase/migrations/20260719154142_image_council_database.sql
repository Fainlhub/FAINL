-- Beeldraad database contract.
-- Client ownership is limited to project presentation fields and read access.
-- Runs, branches, artifacts, evaluations, rankings, events, Storage writes,
-- queue writes, settlement, refunds, and purge are server-owned.

create extension if not exists pgmq;
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (
    select 1
    from pgmq.meta
    where queue_name = 'image_council_steps'
  ) then
    perform pgmq.create('image_council_steps');
  end if;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
    from cron.job
   where jobname = 'image-council-recovery';

  if found then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'image-council-recovery',
    '* * * * *',
    $recovery$
      select net.http_post(
        url := project_url.decrypted_secret
          || '/functions/v1/image-council-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-image-council-worker-token', worker_token.decrypted_secret
        ),
        body := '{}'::jsonb
      )
      from vault.decrypted_secrets as project_url
      cross join vault.decrypted_secrets as worker_token
      where project_url.name = 'image_council_project_url'
        and worker_token.name = 'image_council_worker_token';
    $recovery$
  );
end;
$$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.image_model_catalog (
  id text primary key
    check (id ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{1,159}$'),
  provider text not null
    check (provider in ('openai', 'google', 'huggingface')),
  provider_model text not null,
  display_name text not null,
  model_role text not null
    check (model_role in ('generator', 'final_editor', 'evaluator')),
  branch_credit_cost smallint not null default 0,
  license_identifier text not null,
  commercial_use_allowed boolean not null default false,
  license_policy_accepted boolean not null default false,
  enabled boolean not null default false,
  kill_switch boolean not null default false,
  sort_order smallint not null default 0 check (sort_order >= 0),
  capabilities jsonb not null default '{}'::jsonb
    check (jsonb_typeof(capabilities) = 'object'),
  provider_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(provider_config) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint image_model_catalog_branch_cost_check check (
    (model_role = 'generator' and branch_credit_cost = 1)
    or (model_role <> 'generator' and branch_credit_cost = 0)
  ),
  unique (provider, provider_model, model_role)
);

create table public.image_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  brief text not null default '' check (char_length(brief) <= 20000),
  selected_artifact_id uuid,
  pinned boolean not null default false,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'archived', 'deletion_requested', 'purged')),
  archived_at timestamptz,
  deletion_requested_at timestamptz,
  purge_after timestamptz,
  purged_at timestamptz,
  deletion_restore_status text
    check (deletion_restore_status is null or deletion_restore_status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint image_projects_lifecycle_check check (
    (
      lifecycle_status = 'active'
      and archived_at is null
      and deletion_requested_at is null
      and purge_after is null
      and purged_at is null
      and deletion_restore_status is null
    )
    or (
      lifecycle_status = 'archived'
      and archived_at is not null
      and deletion_requested_at is null
      and purge_after is null
      and purged_at is null
      and deletion_restore_status is null
    )
    or (
      lifecycle_status = 'deletion_requested'
      and deletion_requested_at is not null
      and purge_after = deletion_requested_at + interval '24 hours'
      and purged_at is null
      and deletion_restore_status is not null
    )
    or (
      lifecycle_status = 'purged'
      and selected_artifact_id is null
      and deletion_requested_at is not null
      and purge_after is not null
      and purged_at is not null
      and deletion_restore_status is null
    )
  ),
  unique (id, user_id)
);

create table public.image_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  client_request_id text not null
    check (char_length(btrim(client_request_id)) between 8 and 200),
  status text not null default 'queued'
    check (status in (
      'queued',
      'moderating',
      'generating',
      'evaluating',
      'debating',
      'refining',
      'ranking',
      'polishing',
      'completed',
      'partial',
      'failed',
      'cancel_requested',
      'cancelled',
      'quarantined'
    )),
  prompt text not null
    check (char_length(btrim(prompt)) between 1 and 20000),
  aspect_ratio text not null
    check (aspect_ratio in ('1:1', '4:5', '3:2', '16:9', '9:16')),
  style_preset text not null
    check (style_preset in ('auto', 'photo', 'illustration', 'editorial', 'product')),
  reserved_credits smallint
    check (reserved_credits is null or reserved_credits in (0, 9)),
  settled_credits smallint
    check (settled_credits is null or settled_credits between 0 and 9),
  failure_code text,
  failure_stage text
    check (failure_stage is null or failure_stage in (
      'moderating',
      'generating',
      'evaluating',
      'debating',
      'refining',
      'ranking',
      'polishing',
      'queue',
      'system'
    )),
  failure_detail text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint image_runs_project_owner_fk
    foreign key (project_id, user_id)
    references public.image_projects(id, user_id)
    on delete cascade,
  constraint image_runs_terminal_check check (
    (
      status in ('completed', 'partial', 'failed', 'cancelled', 'quarantined')
      and completed_at is not null
      and settled_credits is not null
    )
    or (
      status not in ('completed', 'partial', 'failed', 'cancelled', 'quarantined')
      and completed_at is null
      and settled_credits is null
    )
  ),
  unique (user_id, client_request_id),
  unique (id, user_id),
  unique (id, project_id, user_id)
);

create table public.image_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  run_id uuid not null,
  model_catalog_id text not null
    references public.image_model_catalog(id) on delete restrict,
  ordinal smallint not null check (ordinal between 1 and 5),
  credit_cost smallint not null default 1 check (credit_cost = 1),
  status text not null default 'queued'
    check (status in (
      'queued',
      'generating',
      'completed',
      'failed',
      'cancel_requested',
      'cancelled',
      'quarantined'
    )),
  failure_code text,
  failure_detail text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint image_branches_project_owner_fk
    foreign key (project_id, user_id)
    references public.image_projects(id, user_id)
    on delete cascade,
  constraint image_branches_run_project_owner_fk
    foreign key (run_id, project_id, user_id)
    references public.image_runs(id, project_id, user_id)
    on delete cascade,
  unique (run_id, model_catalog_id),
  unique (run_id, ordinal),
  unique (id, user_id),
  unique (id, run_id, user_id)
);

create table public.image_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  run_id uuid not null,
  branch_id uuid,
  model_catalog_id text not null
    references public.image_model_catalog(id) on delete restrict,
  kind text not null
    check (kind in ('original', 'refinement', 'finalist', 'thumbnail')),
  parent_artifact_id uuid,
  version integer not null check (version >= 1),
  storage_path text not null unique,
  mime_type text not null
    check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/avif')),
  checksum_sha256 text not null
    check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  width_px integer not null check (width_px between 1 and 32768),
  height_px integer not null check (height_px between 1 and 32768),
  byte_size bigint check (byte_size is null or byte_size between 1 and 52428800),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint image_artifacts_project_owner_fk
    foreign key (project_id, user_id)
    references public.image_projects(id, user_id)
    on delete cascade,
  constraint image_artifacts_run_project_owner_fk
    foreign key (run_id, project_id, user_id)
    references public.image_runs(id, project_id, user_id)
    on delete cascade,
  constraint image_artifacts_branch_run_owner_fk
    foreign key (branch_id, run_id, user_id)
    references public.image_branches(id, run_id, user_id)
    on delete cascade,
  constraint image_artifacts_owner_path_check check (
    storage_path like user_id::text || '/' || project_id::text || '/%'
  ),
  constraint image_artifacts_branch_kind_check check (
    (kind in ('original', 'refinement', 'thumbnail') and branch_id is not null)
    or (kind = 'finalist')
  ),
  unique (id, user_id),
  unique (id, run_id, user_id),
  unique (id, project_id, user_id)
);

alter table public.image_artifacts
  add constraint image_artifacts_parent_run_owner_fk
  foreign key (parent_artifact_id, run_id, user_id)
  references public.image_artifacts(id, run_id, user_id)
  on delete cascade;

create unique index image_artifacts_branch_kind_version_key
  on public.image_artifacts (branch_id, kind, version)
  where branch_id is not null;

create unique index image_artifacts_run_finalist_version_key
  on public.image_artifacts (run_id, kind, version)
  where branch_id is null and kind = 'finalist';

alter table public.image_projects
  add constraint image_projects_selected_artifact_fk
  foreign key (selected_artifact_id, id, user_id)
  references public.image_artifacts(id, project_id, user_id)
  on delete restrict;

create table public.image_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  artifact_id uuid not null,
  evaluator_model_catalog_id text not null
    references public.image_model_catalog(id) on delete restrict,
  evaluator text not null
    check (char_length(btrim(evaluator)) between 1 and 160),
  round smallint not null check (round between 1 and 99),
  criteria jsonb not null
    check (jsonb_typeof(criteria) = 'object'),
  argumentation text not null
    check (char_length(argumentation) between 1 and 20000),
  confidence numeric(7, 6) not null
    check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  constraint image_evaluations_run_owner_fk
    foreign key (run_id, user_id)
    references public.image_runs(id, user_id)
    on delete cascade,
  constraint image_evaluations_artifact_run_owner_fk
    foreign key (artifact_id, run_id, user_id)
    references public.image_artifacts(id, run_id, user_id)
    on delete cascade,
  unique (artifact_id, evaluator_model_catalog_id, round)
);

create table public.image_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  evaluator_model_catalog_id text not null
    references public.image_model_catalog(id) on delete restrict,
  evaluator text not null
    check (char_length(btrim(evaluator)) between 1 and 160),
  round smallint not null check (round between 1 and 99),
  rank_1_artifact_id uuid not null,
  rank_2_artifact_id uuid,
  rank_3_artifact_id uuid,
  argumentation text not null
    check (char_length(argumentation) between 1 and 20000),
  confidence numeric(7, 6) not null
    check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  constraint image_rankings_run_owner_fk
    foreign key (run_id, user_id)
    references public.image_runs(id, user_id)
    on delete cascade,
  constraint image_rankings_rank_1_fk
    foreign key (rank_1_artifact_id, run_id, user_id)
    references public.image_artifacts(id, run_id, user_id)
    on delete cascade,
  constraint image_rankings_rank_2_fk
    foreign key (rank_2_artifact_id, run_id, user_id)
    references public.image_artifacts(id, run_id, user_id)
    on delete cascade,
  constraint image_rankings_rank_3_fk
    foreign key (rank_3_artifact_id, run_id, user_id)
    references public.image_artifacts(id, run_id, user_id)
    on delete cascade,
  constraint image_rankings_one_to_three_distinct_check check (
    (rank_3_artifact_id is null or rank_2_artifact_id is not null)
    and rank_1_artifact_id is distinct from rank_2_artifact_id
    and rank_1_artifact_id is distinct from rank_3_artifact_id
    and rank_2_artifact_id is distinct from rank_3_artifact_id
  ),
  unique (run_id, evaluator_model_catalog_id, round)
);

create table public.image_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  run_id uuid not null,
  artifact_id uuid,
  event_type text not null
    check (event_type ~ '^[a-z][a-z0-9_.-]{1,79}$'),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null default now(),
  constraint image_events_project_owner_fk
    foreign key (project_id, user_id)
    references public.image_projects(id, user_id)
    on delete cascade,
  constraint image_events_run_project_owner_fk
    foreign key (run_id, project_id, user_id)
    references public.image_runs(id, project_id, user_id)
    on delete cascade,
  constraint image_events_artifact_run_owner_fk
    foreign key (artifact_id, run_id, user_id)
    references public.image_artifacts(id, run_id, user_id)
    on delete cascade
);

create table public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'settled', 'refunded')),
  requested_credits smallint not null default 9 check (requested_credits = 9),
  reserved_credits smallint not null check (reserved_credits in (0, 9)),
  consumed_credits smallint
    check (consumed_credits is null or consumed_credits between 0 and 9),
  refunded_credits smallint not null default 0
    check (refunded_credits between 0 and 9),
  lifetime_snapshot boolean not null,
  queue_message_id bigint,
  refund_reason text,
  reserved_at timestamptz not null default now(),
  settled_at timestamptz,
  refunded_at timestamptz,
  constraint credit_reservations_run_owner_fk
    foreign key (run_id, user_id)
    references public.image_runs(id, user_id)
    on delete cascade,
  constraint credit_reservations_state_check check (
    (
      status = 'reserved'
      and consumed_credits is null
      and refunded_credits = 0
      and settled_at is null
      and refunded_at is null
    )
    or (
      status = 'settled'
      and consumed_credits is not null
      and refunded_credits = reserved_credits - least(consumed_credits, reserved_credits)
      and settled_at is not null
      and refunded_at is null
    )
    or (
      status = 'refunded'
      and consumed_credits = 0
      and refunded_credits = reserved_credits
      and settled_at is null
      and refunded_at is not null
    )
  ),
  unique (run_id),
  unique (id, user_id)
);

alter table public.credit_ledger
  add column if not exists image_reservation_id uuid;

alter table public.credit_ledger
  add constraint credit_ledger_image_reservation_shape_check check (
    image_reservation_id is null
    or (reason = 'image_council_reserve' and delta < 0)
    or (reason in ('image_council_refund', 'image_council_settle_refund') and delta > 0)
  );

create unique index credit_ledger_image_reservation_reason_key
  on public.credit_ledger (image_reservation_id, reason)
  where image_reservation_id is not null;

create unique index image_runs_one_active_per_user_idx
  on public.image_runs (user_id)
  where status in (
    'queued',
    'moderating',
    'generating',
    'evaluating',
    'debating',
    'refining',
    'ranking',
    'polishing',
    'cancel_requested'
  );

create index image_projects_user_updated_idx
  on public.image_projects (user_id, pinned desc, updated_at desc);
create index image_projects_purge_due_idx
  on public.image_projects (purge_after)
  where lifecycle_status = 'deletion_requested';
create index image_runs_project_created_idx
  on public.image_runs (project_id, created_at desc);
create index image_branches_run_ordinal_idx
  on public.image_branches (run_id, ordinal);
create index image_artifacts_run_created_idx
  on public.image_artifacts (run_id, created_at);
create index image_evaluations_artifact_round_idx
  on public.image_evaluations (artifact_id, round);
create index image_rankings_run_round_idx
  on public.image_rankings (run_id, round);
create index image_events_run_occurred_idx
  on public.image_events (run_id, occurred_at, id);
create index credit_reservations_user_reserved_idx
  on public.credit_reservations (user_id, reserved_at desc);

insert into public.image_model_catalog (
  id,
  provider,
  provider_model,
  display_name,
  model_role,
  branch_credit_cost,
  license_identifier,
  commercial_use_allowed,
  license_policy_accepted,
  enabled,
  kill_switch,
  sort_order,
  capabilities,
  provider_config
)
values
  (
    'openai/gpt-image-2',
    'openai',
    'gpt-image-2',
    'OpenAI GPT Image 2',
    'generator',
    1,
    'openai-service-terms',
    true,
    true,
    true,
    false,
    10,
    '{"generation": true, "editing": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'google/gemini-3.1-flash-image',
    'google',
    'gemini-3.1-flash-image',
    'Google Gemini 3.1 Flash Image',
    'generator',
    1,
    'google-api-terms',
    true,
    true,
    true,
    false,
    20,
    '{"generation": true, "editing": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'huggingface/Qwen/Qwen-Image',
    'huggingface',
    'Qwen/Qwen-Image',
    'Qwen Image',
    'generator',
    1,
    'apache-2.0',
    true,
    true,
    true,
    false,
    30,
    '{"generation": true, "editing": true}'::jsonb,
    '{"requires_inference_provider": true}'::jsonb
  ),
  (
    'huggingface/Tongyi-MAI/Z-Image-Turbo',
    'huggingface',
    'Tongyi-MAI/Z-Image-Turbo',
    'Z-Image Turbo',
    'generator',
    1,
    'apache-2.0',
    true,
    true,
    true,
    false,
    40,
    '{"generation": true, "editing": false}'::jsonb,
    '{"requires_inference_provider": true}'::jsonb
  ),
  (
    'huggingface/stabilityai/stable-diffusion-xl-base-1.0',
    'huggingface',
    'stabilityai/stable-diffusion-xl-base-1.0',
    'Stable Diffusion XL Base 1.0',
    'generator',
    1,
    'openrail++',
    true,
    true,
    true,
    false,
    50,
    '{"generation": true, "editing": false}'::jsonb,
    '{"requires_license_policy_acceptance": true}'::jsonb
  ),
  (
    'google/gemini-3-pro-image',
    'google',
    'gemini-3-pro-image',
    'Google Gemini 3 Pro Image',
    'final_editor',
    0,
    'google-api-terms',
    true,
    true,
    true,
    false,
    60,
    '{"generation": true, "editing": true, "final_polish": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'google/gemini-3.1-pro',
    'google',
    'gemini-3.1-pro',
    'Google Gemini 3.1 Pro Evaluator',
    'evaluator',
    0,
    'google-api-terms',
    true,
    true,
    true,
    false,
    70,
    '{"vision": true, "structured_output": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'google/gemini-3.1-flash',
    'google',
    'gemini-3.1-flash',
    'Google Gemini 3.1 Flash Evaluator',
    'evaluator',
    0,
    'google-api-terms',
    true,
    true,
    true,
    false,
    80,
    '{"vision": true, "structured_output": true}'::jsonb,
    '{}'::jsonb
  ),
  (
    'openai/gpt-4o',
    'openai',
    'gpt-4o',
    'OpenAI GPT-4o Evaluator',
    'evaluator',
    0,
    'openai-service-terms',
    true,
    true,
    true,
    false,
    90,
    '{"vision": true, "structured_output": true}'::jsonb,
    '{}'::jsonb
  )
on conflict (id) do update
set provider = excluded.provider,
    provider_model = excluded.provider_model,
    display_name = excluded.display_name,
    model_role = excluded.model_role,
    branch_credit_cost = excluded.branch_credit_cost,
    license_identifier = excluded.license_identifier,
    commercial_use_allowed = excluded.commercial_use_allowed,
    license_policy_accepted = excluded.license_policy_accepted,
    enabled = excluded.enabled,
    kill_switch = excluded.kill_switch,
    sort_order = excluded.sort_order,
    capabilities = excluded.capabilities,
    provider_config = excluded.provider_config,
    updated_at = now();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger image_model_catalog_set_updated_at
  before update on public.image_model_catalog
  for each row execute function private.set_updated_at();

create trigger image_projects_set_updated_at
  before update on public.image_projects
  for each row execute function private.set_updated_at();

create or replace function private.validate_image_branch_model()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_role text;
  v_cost smallint;
begin
  select model_role, branch_credit_cost
    into v_role, v_cost
    from public.image_model_catalog
   where id = new.model_catalog_id;

  if v_role is distinct from 'generator' or v_cost is distinct from 1 then
    raise exception 'image branch model must be a one-credit generator'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger image_branches_validate_model
  before insert or update of model_catalog_id, credit_cost
  on public.image_branches
  for each row execute function private.validate_image_branch_model();

create or replace function private.validate_image_evaluator_model()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.image_model_catalog
    where id = new.evaluator_model_catalog_id
      and model_role = 'evaluator'
  ) then
    raise exception 'evaluation model must have evaluator role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger image_evaluations_validate_model
  before insert or update of evaluator_model_catalog_id
  on public.image_evaluations
  for each row execute function private.validate_image_evaluator_model();

create trigger image_rankings_validate_model
  before insert or update of evaluator_model_catalog_id
  on public.image_rankings
  for each row execute function private.validate_image_evaluator_model();

create or replace function private.reject_immutable_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE'
     and tg_table_name in ('image_artifacts', 'image_events')
     and current_setting('app.image_council_purge', true) = 'on' then
    return old;
  end if;

  raise exception '% is append-only', tg_table_schema || '.' || tg_table_name
    using errcode = '55000';
end;
$$;

create trigger image_artifacts_immutable
  before update or delete on public.image_artifacts
  for each row execute function private.reject_immutable_change();

create trigger image_events_immutable
  before update or delete on public.image_events
  for each row execute function private.reject_immutable_change();

create trigger credit_ledger_immutable
  before update or delete on public.credit_ledger
  for each row execute function private.reject_immutable_change();

alter table public.image_model_catalog enable row level security;
alter table public.image_projects enable row level security;
alter table public.image_runs enable row level security;
alter table public.image_branches enable row level security;
alter table public.image_artifacts enable row level security;
alter table public.image_evaluations enable row level security;
alter table public.image_rankings enable row level security;
alter table public.image_events enable row level security;
alter table public.credit_reservations enable row level security;

create policy "authenticated read available image models"
  on public.image_model_catalog for select
  to authenticated
  using (
    enabled
    and not kill_switch
    and commercial_use_allowed
    and license_policy_accepted
  );

create policy "owner select image projects"
  on public.image_projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner update image project presentation"
  on public.image_projects for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and lifecycle_status in ('active', 'archived')
  )
  with check (
    (select auth.uid()) = user_id
    and lifecycle_status in ('active', 'archived')
  );

create policy "owner select image runs"
  on public.image_runs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner select image branches"
  on public.image_branches for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner select image artifacts"
  on public.image_artifacts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner select image evaluations"
  on public.image_evaluations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner select image rankings"
  on public.image_rankings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner select image events"
  on public.image_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "owner select credit reservations"
  on public.credit_reservations for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.image_model_catalog from anon, authenticated;
revoke all on public.image_projects from anon, authenticated;
revoke all on public.image_runs from anon, authenticated;
revoke all on public.image_branches from anon, authenticated;
revoke all on public.image_artifacts from anon, authenticated;
revoke all on public.image_evaluations from anon, authenticated;
revoke all on public.image_rankings from anon, authenticated;
revoke all on public.image_events from anon, authenticated;
revoke all on public.credit_reservations from anon, authenticated;

grant select on public.image_model_catalog to authenticated;
grant select on public.image_projects to authenticated;
grant update (title, brief, pinned)
  on public.image_projects to authenticated;
grant select on public.image_runs to authenticated;
grant select on public.image_branches to authenticated;
grant select on public.image_artifacts to authenticated;
grant select on public.image_evaluations to authenticated;
grant select on public.image_rankings to authenticated;
grant select on public.image_events to authenticated;
grant select on public.credit_reservations to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'image-council',
  'image-council',
  false,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "image council owner read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'image-council'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- No authenticated INSERT/UPDATE/DELETE Storage policy exists. The worker
-- owns binary upload and all lineage metadata.

create or replace function private.reserve_image_run(
  p_run_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_project_id uuid;
  v_status text;
  v_credits integer;
  v_lifetime boolean;
  v_reserved smallint;
  v_reservation public.credit_reservations%rowtype;
  v_queue_message_id bigint;
begin
  select credits_remaining, is_lifetime
    into v_credits, v_lifetime
    from public.user_profiles
   where id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'user_not_found');
  end if;

  select project_id, status
    into v_project_id, v_status
    from public.image_runs
   where id = p_run_id
     and user_id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'run_not_found');
  end if;

  select *
    into v_reservation
    from public.credit_reservations
   where run_id = p_run_id;

  if found then
    return jsonb_build_object(
      'success', true,
      'applied', false,
      'reservation_id', v_reservation.id,
      'reserved_credits', v_reservation.reserved_credits,
      'queue_message_id', v_reservation.queue_message_id,
      'credits_remaining', v_credits
    );
  end if;

  if v_status <> 'queued' then
    return jsonb_build_object('success', false, 'reason', 'invalid_run_state');
  end if;

  if (
    select count(*)
    from public.image_branches
    where run_id = p_run_id
      and credit_cost = 1
  ) <> 5 then
    return jsonb_build_object('success', false, 'reason', 'invalid_branch_contract');
  end if;

  v_reserved := case when v_lifetime then 0 else 9 end;

  if v_credits < v_reserved then
    return jsonb_build_object('success', false, 'reason', 'insufficient_credits');
  end if;

  insert into public.credit_reservations (
    user_id,
    run_id,
    reserved_credits,
    lifetime_snapshot
  )
  values (
    p_user_id,
    p_run_id,
    v_reserved,
    v_lifetime
  )
  returning * into v_reservation;

  update public.image_runs
     set reserved_credits = v_reserved
   where id = p_run_id;

  if v_reserved > 0 then
    update public.user_profiles
       set credits_remaining = credits_remaining - v_reserved,
           updated_at = now()
     where id = p_user_id
     returning credits_remaining into v_credits;

    insert into public.credit_ledger (
      user_id,
      delta,
      reason,
      metadata,
      image_reservation_id
    )
    values (
      p_user_id,
      -v_reserved,
      'image_council_reserve',
      jsonb_build_object('run_id', p_run_id, 'fixed_reservation', 9),
      v_reservation.id
    );
  end if;

  select pgmq.send(
    'image_council_steps',
    jsonb_build_object(
      'run_id', p_run_id,
      'project_id', v_project_id,
      'user_id', p_user_id,
      'step', 'moderate',
      'attempt', 1
    )
  )
  into v_queue_message_id;

  update public.credit_reservations
     set queue_message_id = v_queue_message_id
   where id = v_reservation.id;

  insert into public.image_events (
    user_id,
    project_id,
    run_id,
    event_type,
    payload
  )
  values (
    p_user_id,
    v_project_id,
    p_run_id,
    'credits.reserved',
    jsonb_build_object(
      'reservation_id', v_reservation.id,
      'reserved_credits', v_reserved,
      'queue_message_id', v_queue_message_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'reservation_id', v_reservation.id,
    'reserved_credits', v_reserved,
    'queue_message_id', v_queue_message_id,
    'credits_remaining', v_credits
  );
end;
$$;

revoke all on function private.reserve_image_run(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.start_image_council(
  p_client_request_id text,
  p_prompt text,
  p_aspect_ratio text,
  p_style_preset text,
  p_project_id uuid default null,
  p_project_title text default 'Nieuw beeldproject',
  p_brief text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
  v_run_id uuid;
  v_existing public.image_runs%rowtype;
  v_credits integer;
  v_lifetime boolean;
  v_model_count integer;
  v_reservation jsonb;
begin
  if v_user_id is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_client_request_id is null
     or char_length(btrim(p_client_request_id)) not between 8 and 200
     or p_prompt is null
     or char_length(btrim(p_prompt)) not between 1 and 20000
     or p_aspect_ratio is null
     or p_aspect_ratio not in ('1:1', '4:5', '3:2', '16:9', '9:16')
     or p_style_preset is null
     or p_style_preset not in ('auto', 'photo', 'illustration', 'editorial', 'product')
     or p_project_title is null
     or char_length(btrim(p_project_title)) not between 1 and 160
     or p_brief is null
     or char_length(p_brief) > 20000 then
    return jsonb_build_object('success', false, 'reason', 'invalid_input');
  end if;

  -- Serializes starts for one user, covers both idempotency and active-run checks.
  select credits_remaining, is_lifetime
    into v_credits, v_lifetime
    from public.user_profiles
   where id = v_user_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'user_not_found');
  end if;

  select *
    into v_existing
    from public.image_runs
   where user_id = v_user_id
     and client_request_id = btrim(p_client_request_id);

  if found then
    return jsonb_build_object(
      'success', true,
      'applied', false,
      'project_id', v_existing.project_id,
      'run_id', v_existing.id,
      'status', v_existing.status,
      'client_request_id', v_existing.client_request_id,
      'reserved_credits', 9
    );
  end if;

  if exists (
    select 1
    from public.image_runs
    where user_id = v_user_id
      and status in (
        'queued',
        'moderating',
        'generating',
        'evaluating',
        'debating',
        'refining',
        'ranking',
        'polishing',
        'cancel_requested'
      )
  ) then
    return jsonb_build_object('success', false, 'reason', 'active_run_exists');
  end if;

  if not v_lifetime and v_credits < 9 then
    return jsonb_build_object('success', false, 'reason', 'insufficient_credits');
  end if;

  select count(*)
    into v_model_count
    from public.image_model_catalog
   where model_role = 'generator'
     and enabled
     and not kill_switch
     and commercial_use_allowed
     and license_policy_accepted;

  if v_model_count <> 5 then
    return jsonb_build_object('success', false, 'reason', 'generator_catalog_unavailable');
  end if;

  if p_project_id is null then
    insert into public.image_projects (user_id, title, brief)
    values (v_user_id, btrim(p_project_title), p_brief)
    returning id into v_project_id;
  else
    select id
      into v_project_id
      from public.image_projects
     where id = p_project_id
       and user_id = v_user_id
       and lifecycle_status in ('active', 'archived')
     for update;

    if not found then
      return jsonb_build_object('success', false, 'reason', 'project_not_found');
    end if;
  end if;

  insert into public.image_runs (
    user_id,
    project_id,
    client_request_id,
    prompt,
    aspect_ratio,
    style_preset,
    status
  )
  values (
    v_user_id,
    v_project_id,
    btrim(p_client_request_id),
    btrim(p_prompt),
    p_aspect_ratio,
    p_style_preset,
    'queued'
  )
  returning id into v_run_id;

  insert into public.image_branches (
    user_id,
    project_id,
    run_id,
    model_catalog_id,
    ordinal,
    credit_cost
  )
  select
    v_user_id,
    v_project_id,
    v_run_id,
    id,
    row_number() over (order by sort_order, id)::smallint,
    1
  from public.image_model_catalog
  where model_role = 'generator'
    and enabled
    and not kill_switch
    and commercial_use_allowed
    and license_policy_accepted
  order by sort_order, id;

  insert into public.image_events (
    user_id,
    project_id,
    run_id,
    event_type,
    payload
  )
  values (
    v_user_id,
    v_project_id,
    v_run_id,
    'run.created',
    jsonb_build_object('client_request_id', btrim(p_client_request_id))
  );

  v_reservation := private.reserve_image_run(v_run_id, v_user_id);

  if coalesce((v_reservation->>'success')::boolean, false) is not true then
    raise exception 'image council reservation failed: %',
      coalesce(v_reservation->>'reason', 'unknown')
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'project_id', v_project_id,
    'run_id', v_run_id,
    'status', 'queued',
    'client_request_id', btrim(p_client_request_id),
    'reserved_credits', 9,
    'credits_remaining', (v_reservation->>'credits_remaining')::integer,
    'queue_message_id', (v_reservation->>'queue_message_id')::bigint
  );
end;
$$;

create or replace function public.reserve_image_credits(
  p_run_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid;
begin
  select user_id
    into v_user_id
    from public.image_runs
   where id = p_run_id;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'run_not_found');
  end if;

  return private.reserve_image_run(p_run_id, v_user_id);
end;
$$;

create or replace function public.enqueue_image_council_step(
  p_run_id uuid,
  p_step text,
  p_payload jsonb default '{}'::jsonb,
  p_delay_seconds integer default 0
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_project_id uuid;
  v_user_id uuid;
  v_message_id bigint;
begin
  if p_step is null
     or p_step not in (
       'moderate',
       'generate',
       'evaluate',
       'debate',
       'refine',
       'rank',
       'polish',
       'retry',
       'dead_letter'
     )
     or p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or p_delay_seconds is null
     or p_delay_seconds not between 0 and 86400 then
    raise exception 'invalid queue step payload' using errcode = '22023';
  end if;

  select project_id, user_id
    into v_project_id, v_user_id
    from public.image_runs
   where id = p_run_id;

  if not found then
    raise exception 'run not found' using errcode = 'P0002';
  end if;

  select pgmq.send(
    'image_council_steps',
    jsonb_build_object(
      'run_id', p_run_id,
      'project_id', v_project_id,
      'user_id', v_user_id,
      'step', p_step
    ) || p_payload,
    p_delay_seconds
  )
  into v_message_id;

  return v_message_id;
end;
$$;

create or replace function public.settle_image_credits(
  p_reservation_id uuid,
  p_actual_credits integer,
  p_outcome text default 'completed'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reservation public.credit_reservations%rowtype;
  v_user_id uuid;
  v_project_id uuid;
  v_refund integer;
  v_credits integer;
begin
  if p_actual_credits is null
     or p_actual_credits not between 0 and 9
     or p_outcome not in ('completed', 'partial') then
    return jsonb_build_object('success', false, 'reason', 'invalid_settlement');
  end if;

  select user_id
    into v_user_id
    from public.credit_reservations
   where id = p_reservation_id;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'reservation_not_found');
  end if;

  select credits_remaining
    into v_credits
    from public.user_profiles
   where id = v_user_id
   for update;

  select *
    into v_reservation
    from public.credit_reservations
   where id = p_reservation_id
   for update;

  if v_reservation.status = 'settled'
     and v_reservation.consumed_credits = p_actual_credits then
    return jsonb_build_object(
      'success', true,
      'applied', false,
      'status', 'settled',
      'credits_remaining', v_credits
    );
  end if;

  if v_reservation.status <> 'reserved' then
    return jsonb_build_object('success', false, 'reason', 'invalid_reservation_state');
  end if;

  v_refund := v_reservation.reserved_credits
    - least(p_actual_credits, v_reservation.reserved_credits);

  update public.user_profiles
     set credits_remaining = credits_remaining + v_refund,
         total_turns_used = total_turns_used + 1,
         updated_at = now()
   where id = v_user_id
   returning credits_remaining into v_credits;

  update public.credit_reservations
     set status = 'settled',
         consumed_credits = p_actual_credits,
         refunded_credits = v_refund,
         settled_at = now()
   where id = p_reservation_id;

  if v_refund > 0 then
    insert into public.credit_ledger (
      user_id,
      delta,
      reason,
      metadata,
      image_reservation_id
    )
    values (
      v_user_id,
      v_refund,
      'image_council_settle_refund',
      jsonb_build_object(
        'run_id', v_reservation.run_id,
        'actual_credits', p_actual_credits
      ),
      p_reservation_id
    );
  end if;

  update public.image_runs
     set status = p_outcome,
         settled_credits = p_actual_credits,
         completed_at = now(),
         failure_code = null,
         failure_stage = null,
         failure_detail = null
   where id = v_reservation.run_id
   returning project_id into v_project_id;

  insert into public.image_events (
    user_id,
    project_id,
    run_id,
    event_type,
    payload
  )
  values (
    v_user_id,
    v_project_id,
    v_reservation.run_id,
    'credits.settled',
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'actual_credits', p_actual_credits,
      'refunded_credits', v_refund,
      'outcome', p_outcome
    )
  );

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'status', 'settled',
    'run_status', p_outcome,
    'consumed_credits', p_actual_credits,
    'refunded_credits', v_refund,
    'credits_remaining', v_credits
  );
end;
$$;

create or replace function public.refund_image_credits(
  p_reservation_id uuid,
  p_failure_code text,
  p_failure_detail text default null,
  p_outcome text default 'failed'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reservation public.credit_reservations%rowtype;
  v_user_id uuid;
  v_project_id uuid;
  v_credits integer;
begin
  if p_failure_code is null
     or char_length(btrim(p_failure_code)) not between 1 and 120
     or p_outcome not in ('failed', 'cancelled', 'quarantined') then
    return jsonb_build_object('success', false, 'reason', 'invalid_refund');
  end if;

  select user_id
    into v_user_id
    from public.credit_reservations
   where id = p_reservation_id;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'reservation_not_found');
  end if;

  select credits_remaining
    into v_credits
    from public.user_profiles
   where id = v_user_id
   for update;

  select *
    into v_reservation
    from public.credit_reservations
   where id = p_reservation_id
   for update;

  if v_reservation.status = 'refunded' then
    return jsonb_build_object(
      'success', true,
      'applied', false,
      'status', 'refunded',
      'credits_remaining', v_credits
    );
  end if;

  if v_reservation.status <> 'reserved' then
    return jsonb_build_object('success', false, 'reason', 'invalid_reservation_state');
  end if;

  update public.user_profiles
     set credits_remaining = credits_remaining + v_reservation.reserved_credits,
         updated_at = now()
   where id = v_user_id
   returning credits_remaining into v_credits;

  update public.credit_reservations
     set status = 'refunded',
         consumed_credits = 0,
         refunded_credits = v_reservation.reserved_credits,
         refund_reason = btrim(p_failure_code),
         refunded_at = now()
   where id = p_reservation_id;

  if v_reservation.reserved_credits > 0 then
    insert into public.credit_ledger (
      user_id,
      delta,
      reason,
      metadata,
      image_reservation_id
    )
    values (
      v_user_id,
      v_reservation.reserved_credits,
      'image_council_refund',
      jsonb_build_object(
        'run_id', v_reservation.run_id,
        'failure_code', btrim(p_failure_code)
      ),
      p_reservation_id
    );
  end if;

  update public.image_runs
     set status = p_outcome,
         settled_credits = 0,
         completed_at = now(),
         failure_code = btrim(p_failure_code),
         failure_stage = 'system',
         failure_detail = p_failure_detail
   where id = v_reservation.run_id
   returning project_id into v_project_id;

  insert into public.image_events (
    user_id,
    project_id,
    run_id,
    event_type,
    payload
  )
  values (
    v_user_id,
    v_project_id,
    v_reservation.run_id,
    'credits.refunded',
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'refunded_credits', v_reservation.reserved_credits,
      'failure_code', btrim(p_failure_code),
      'outcome', p_outcome
    )
  );

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'status', 'refunded',
    'run_status', p_outcome,
    'refunded_credits', v_reservation.reserved_credits,
    'credits_remaining', v_credits
  );
end;
$$;

create or replace function public.request_image_project_deletion(
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.image_projects%rowtype;
  v_requested_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select *
    into v_project
    from public.image_projects
   where id = p_project_id
     and user_id = v_user_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'project_not_found');
  end if;

  if v_project.lifecycle_status = 'purged' then
    return jsonb_build_object('success', false, 'reason', 'project_purged');
  end if;

  if v_project.lifecycle_status = 'deletion_requested' then
    return jsonb_build_object(
      'success', true,
      'applied', false,
      'purge_after', v_project.purge_after
    );
  end if;

  update public.image_projects
     set lifecycle_status = 'deletion_requested',
         deletion_restore_status = v_project.lifecycle_status,
         deletion_requested_at = v_requested_at,
         purge_after = v_requested_at + interval '24 hours'
   where id = p_project_id;

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'purge_after', v_requested_at + interval '24 hours'
  );
end;
$$;

create or replace function public.cancel_image_project_deletion(
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_restore_status text;
begin
  if v_user_id is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select deletion_restore_status
    into v_restore_status
    from public.image_projects
   where id = p_project_id
     and user_id = v_user_id
     and lifecycle_status = 'deletion_requested'
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'deletion_not_requested');
  end if;

  update public.image_projects
     set lifecycle_status = v_restore_status,
         deletion_requested_at = null,
         purge_after = null,
         deletion_restore_status = null
   where id = p_project_id;

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'lifecycle_status', v_restore_status
  );
end;
$$;

create or replace function public.purge_image_project(
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_project public.image_projects%rowtype;
  v_run_count integer;
begin
  select *
    into v_project
    from public.image_projects
   where id = p_project_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'project_not_found');
  end if;

  if v_project.lifecycle_status = 'purged' then
    return jsonb_build_object('success', true, 'applied', false, 'status', 'purged');
  end if;

  if v_project.lifecycle_status <> 'deletion_requested'
     or v_project.purge_after > now() then
    return jsonb_build_object('success', false, 'reason', 'purge_not_due');
  end if;

  select count(*)
    into v_run_count
    from public.image_runs
   where project_id = p_project_id;

  -- The worker must delete bucket objects through the Storage API first.
  perform set_config('app.image_council_purge', 'on', true);

  update public.image_projects
     set selected_artifact_id = null
   where id = p_project_id;

  delete from public.image_runs
   where project_id = p_project_id;

  update public.image_projects
     set title = 'Verwijderd beeldproject',
         brief = '',
         pinned = false,
         lifecycle_status = 'purged',
         archived_at = coalesce(archived_at, now()),
         purged_at = now(),
         deletion_restore_status = null
   where id = p_project_id;

  return jsonb_build_object(
    'success', true,
    'applied', true,
    'status', 'purged',
    'purged_runs', v_run_count
  );
end;
$$;

revoke all on function public.start_image_council(text, text, text, text, uuid, text, text)
  from public;
revoke execute on function public.start_image_council(text, text, text, text, uuid, text, text)
  from anon;
grant execute on function public.start_image_council(text, text, text, text, uuid, text, text)
  to authenticated;

revoke all on function public.reserve_image_credits(uuid) from public;
revoke execute on function public.reserve_image_credits(uuid) from anon, authenticated;
grant execute on function public.reserve_image_credits(uuid) to service_role;

revoke all on function public.enqueue_image_council_step(uuid, text, jsonb, integer)
  from public;
revoke execute on function public.enqueue_image_council_step(uuid, text, jsonb, integer)
  from anon, authenticated;
grant execute on function public.enqueue_image_council_step(uuid, text, jsonb, integer)
  to service_role;

revoke all on function public.settle_image_credits(uuid, integer, text)
  from public;
revoke execute on function public.settle_image_credits(uuid, integer, text)
  from anon, authenticated;
grant execute on function public.settle_image_credits(uuid, integer, text)
  to service_role;

revoke all on function public.refund_image_credits(uuid, text, text, text)
  from public;
revoke execute on function public.refund_image_credits(uuid, text, text, text)
  from anon, authenticated;
grant execute on function public.refund_image_credits(uuid, text, text, text)
  to service_role;

revoke all on function public.request_image_project_deletion(uuid) from public;
revoke execute on function public.request_image_project_deletion(uuid) from anon;
grant execute on function public.request_image_project_deletion(uuid)
  to authenticated;

revoke all on function public.cancel_image_project_deletion(uuid) from public;
revoke execute on function public.cancel_image_project_deletion(uuid) from anon;
grant execute on function public.cancel_image_project_deletion(uuid)
  to authenticated;

revoke all on function public.purge_image_project(uuid) from public;
revoke execute on function public.purge_image_project(uuid)
  from anon, authenticated;
grant execute on function public.purge_image_project(uuid) to service_role;

-- Replace the caller-controlled weekly grant overload with one fixed at 10.
revoke all on function public.claim_weekly_credits(uuid, integer) from public;
revoke execute on function public.claim_weekly_credits(uuid, integer)
  from anon, authenticated;
drop function public.claim_weekly_credits(uuid, integer);

create function public.claim_weekly_credits(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_credit_grant constant integer := 10;
  v_current_week date := date_trunc('week', now())::date;
  v_last_grant date;
  v_credits integer;
  v_turns integer;
  v_lifetime boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select
    credits_remaining,
    total_turns_used,
    is_lifetime,
    weekly_credits_granted_at
  into
    v_credits,
    v_turns,
    v_lifetime,
    v_last_grant
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
     set credits_remaining = credits_remaining + v_credit_grant,
         weekly_credits_granted_at = v_current_week,
         updated_at = now()
   where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'granted', true,
    'amount', v_credit_grant,
    'credits_remaining', v_credits + v_credit_grant,
    'total_turns_used', v_turns,
    'is_lifetime', v_lifetime
  );
end;
$$;

revoke all on function public.claim_weekly_credits(uuid) from public;
revoke execute on function public.claim_weekly_credits(uuid) from anon;
grant execute on function public.claim_weekly_credits(uuid) to authenticated;

-- Existing clients call these signatures without an idempotency key. Ledger
-- insertion is now atomic with each successful deduction, but duplicate client
-- retries and caller-supplied p_amount remain risks until the client contract
-- carries a stable request id and server-owned pricing.
create or replace function public.deduct_credit(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_credits integer;
  v_turns integer;
  v_lifetime boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select credits_remaining, total_turns_used, is_lifetime
    into v_credits, v_turns, v_lifetime
    from public.user_profiles
   where id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'user_not_found');
  end if;

  if v_lifetime then
    update public.user_profiles
       set total_turns_used = total_turns_used + 1,
           updated_at = now()
     where id = p_user_id;

    return jsonb_build_object(
      'success', true,
      'credits_remaining', v_credits,
      'total_turns_used', v_turns + 1
    );
  end if;

  if v_credits < 1 then
    return jsonb_build_object('success', false, 'reason', 'insufficient_credits');
  end if;

  update public.user_profiles
     set credits_remaining = credits_remaining - 1,
         total_turns_used = total_turns_used + 1,
         updated_at = now()
   where id = p_user_id;

  insert into public.credit_ledger (user_id, delta, reason, metadata)
  values (
    p_user_id,
    -1,
    'mission_credit_deduction',
    jsonb_build_object('rpc', 'deduct_credit', 'amount', 1)
  );

  return jsonb_build_object(
    'success', true,
    'credits_remaining', v_credits - 1,
    'total_turns_used', v_turns + 1
  );
end;
$$;

create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_credits integer;
  v_turns integer;
  v_lifetime boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > 10 then
    return jsonb_build_object('success', false, 'reason', 'invalid_amount');
  end if;

  select credits_remaining, total_turns_used, is_lifetime
    into v_credits, v_turns, v_lifetime
    from public.user_profiles
   where id = p_user_id
   for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'user_not_found');
  end if;

  if v_lifetime then
    update public.user_profiles
       set total_turns_used = total_turns_used + 1,
           updated_at = now()
     where id = p_user_id;

    return jsonb_build_object(
      'success', true,
      'credits_remaining', v_credits,
      'total_turns_used', v_turns + 1
    );
  end if;

  if v_credits < p_amount then
    return jsonb_build_object('success', false, 'reason', 'insufficient_credits');
  end if;

  update public.user_profiles
     set credits_remaining = credits_remaining - p_amount,
         total_turns_used = total_turns_used + 1,
         updated_at = now()
   where id = p_user_id;

  insert into public.credit_ledger (user_id, delta, reason, metadata)
  values (
    p_user_id,
    -p_amount,
    'chat_credit_deduction',
    jsonb_build_object('rpc', 'deduct_credits', 'amount', p_amount)
  );

  return jsonb_build_object(
    'success', true,
    'credits_remaining', v_credits - p_amount,
    'total_turns_used', v_turns + 1
  );
end;
$$;

revoke all on function public.deduct_credit(uuid) from public;
revoke execute on function public.deduct_credit(uuid) from anon;
grant execute on function public.deduct_credit(uuid) to authenticated;

revoke all on function public.deduct_credits(uuid, integer) from public;
revoke execute on function public.deduct_credits(uuid, integer) from anon;
grant execute on function public.deduct_credits(uuid, integer) to authenticated;
